import {
  chatConversationCorpus,
  defaultChatVoiceAnchors,
} from "../data/chatConversationCorpus";
import { detectIntent, extractMonthFromText, findSchoolProfileByPrompt } from "./chatConversationEngine";

const moduleAngles = {
  alumni: ["CAS/offer进度", "宿舍和押金", "注册和入学准备"],
  flight: ["机票价格", "出发城市找飞友", "行李额和转机"],
  secondhand: ["二手价格", "床品小家电", "取货和安全交易"],
  college: ["选课和课表", "同专业找人", "reading list"],
  language: ["语言班住宿", "口语搭子", "正课衔接"],
};

const monthAngles = {
  "5月": ["找飞友", "找室友", "二手准备"],
  "6月": ["宿舍押金", "语言班确认", "CAS和注册"],
  "7月": ["签证进度", "机票价格", "行李清单"],
  "8月": ["落地接机", "临时住宿", "到校第一天"],
  "9月": ["选课注册", "同专业破冰", "开学活动"],
};

const schoolShortNames = {
  格拉斯哥大学: "格拉",
  曼彻斯特大学: "曼大",
  布里斯托大学: "布大",
  华威大学: "华威",
  杜伦大学: "杜伦",
  谢菲大学: "谢菲",
  墨尔本大学: "墨大",
  悉尼大学: "悉大",
  香港综合: "港校",
  香港理工大学: "港理工",
};

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。、“”‘’：:；;,.!?！？（）()【】\[\]\-—_]/g, "")
    .slice(0, 260);
}

function copyFromTurns(turns = []) {
  return turns.map((turn) => `${turn.speaker}：${turn.text}`).join("\n");
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function compact(value, max = 34) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function scoreRecord(record, { month, moduleId, query }) {
  const normalizedQuery = normalizeKey(query);
  let score = 0;

  if (month && record.months.includes(month)) score += 8;
  if (moduleId && record.moduleIds.includes(moduleId)) score += 5;
  record.keywords.forEach((keyword) => {
    if (normalizedQuery.includes(normalizeKey(keyword))) score += 3;
  });
  record.hotTopics.forEach((topic) => {
    if (normalizedQuery.includes(normalizeKey(topic).slice(0, 8))) score += 2;
  });

  return score;
}

function pickRecords(profile, { month, moduleId, query }) {
  return profile.records
    .map((record) => ({ record, score: scoreRecord(record, { month, moduleId, query }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.record);
}

function inferTopic({ recentDiscussion, angle, moduleId }) {
  const text = compact(recentDiscussion || angle, 40);
  if (text) return text;
  return moduleAngles[moduleId]?.[0] || "入学准备";
}

function buildAngles({ recentDiscussion, month, moduleId, records }) {
  if (recentDiscussion?.trim()) {
    return [compact(recentDiscussion, 40)];
  }

  const fromMonth = monthAngles[month] || [];
  const fromModule = moduleAngles[moduleId] || moduleAngles.alumni;
  const fromRecords = unique(records.flatMap((record) => record.hotTopics)).slice(0, 4);

  return unique([...fromRecords, ...fromMonth, ...fromModule]).slice(0, 3);
}

function getSchoolLabel(profile) {
  return schoolShortNames[profile.school] || profile.aliases?.[0] || profile.school;
}

function isLanguageHousingTopic(topic, moduleId) {
  const lower = topic.toLowerCase();
  return (
    moduleId === "language" ||
    topic.includes("语言班") ||
    topic.includes("室友") ||
    topic.includes("短租") ||
    topic.includes("正课宿舍") ||
    topic.includes("口语") ||
    lower.includes("presentation") ||
    lower.includes("student accommodation")
  );
}

function isDepositHousingTopic(topic) {
  const lower = topic.toLowerCase();
  return (
    topic.includes("押金") ||
    topic.includes("住宿") ||
    topic.includes("宿舍") ||
    topic.includes("合同") ||
    topic.includes("留位费") ||
    topic.includes("保证金") ||
    lower.includes("deposit") ||
    lower.includes("accommodation") ||
    lower.includes("contract")
  );
}

function buildSeniorLine({ topic, moduleId, variant }) {
  const lower = topic.toLowerCase();

  if (lower.includes("机票") || lower.includes("飞") || moduleId === "flight") {
    return variant % 2 === 0
      ? "大家可以多刷点平台做对比，瞅瞅价格浮动，退改和行李额也顺手看一下。"
      : "机票别只看最低价，退改、行李额、转机时间一起看，会省很多后续麻烦。";
  }

  if (isLanguageHousingTopic(topic, moduleId)) {
    return variant % 2 === 0
      ? "这个要看具体合同，有些短租和正课宿舍日期不一定能无缝接上。"
      : "先把入住/退房日期看清楚，差几天的话就得提前想好临时住哪。";
  }

  if (isDepositHousingTopic(topic)) {
    return variant % 2 === 0
      ? "押金和住宿先看自己收到的邮件/合同页，不同人页面出来的时间可能不一样。"
      : "如果已经到付款或确认那一步，可以说下页面名字，别发金额和个人信息。";
  }

  if (topic.includes("早餐") || topic.includes("公寓")) {
    return variant % 2 === 0
      ? "公寓有没有早餐最好看合同或公寓页面，很多其实是不包的，厨房能不能用反而更重要。"
      : "这个先别默认有，直接看公寓合同/官网写没写早餐；没写的话一般就按自己做或外面买来准备。";
  }

  if (topic.includes("二手") || topic.includes("价格") || moduleId === "secondhand") {
    return variant % 2 === 0
      ? "大家可以多刷点平台做对比，瞅瞅价格浮动，别急着下手。"
      : "二手先看成色、取货距离和原价，价格差不多的话别为了省一点跑太远。";
  }

  if (topic.includes("签证") || topic.includes("CAS") || topic.includes("cas")) {
    return variant % 2 === 0
      ? "CAS、签证这种先看自己邮件和系统状态，群里可以互相对大概时间，但别拿别人进度吓自己。"
      : "先把自己现在是哪一步说清楚，别人更好帮你判断是正常等待还是需要再问学校。";
  }

  if (topic.includes("选课") || topic.includes("课表") || moduleId === "college") {
    return variant % 2 === 0
      ? "选课先别急着乱点，先看课表、考核方式和必修要求，有同专业的可以一起对一下。"
      : "同专业可以先冒个泡，把看到的课表/模块名字对一下，别发个人信息就行。";
  }

  if (topic.includes("语言") || moduleId === "language") {
    return variant % 2 === 0
      ? "语言班这块可以先把时间、住宿、到校日期说清楚，同时间段的人会比较容易接上。"
      : "找搭子可以直接说自己时间和想练什么，不用写太复杂，群里会有人同样在蹲。";
  }

  return variant % 2 === 0
    ? "可以先把自己看到的信息发出来，大家对一下就行，别发隐私。"
    : "这个群里可以先轻轻问一句，有同情况的人一般会自己出来补充。";
}

function buildQuestionLines({ topic, moduleId, schoolLabel, variant }) {
  if (isLanguageHousingTopic(topic, moduleId)) {
    return [
      `有7月去${schoolLabel}上语言班的吗，我想先找个室友，女生`,
      `我也7月，正在纠结语言班住学校还是外面短租，有人看过吗`,
      `我刚刷到几个 student accommodation，合同好像有的是到8月底，不知道能不能接正课宿舍`,
      `我怕中间空几天，拖箱子换地方太麻烦了`,
      `同担心，所以想找个作息差不多的室友，语言班期间一起看房也行`,
      `有没有人想组个口语搭子，平时练一下 presentation 那种`,
      `我口语真的有点虚，想提前找人互相练一下`,
      `有同7月语言班的可以一起拉个小群吗`,
    ];
  }

  if (isDepositHousingTopic(topic)) {
    return [
      `有人最近收到宿舍/押金相关邮件了吗，我这边还没太看明白`,
      `我也在等，主要分不清是先交押金还是先确认住宿`,
      `我看到有人说合同页面出来了，但我系统里还没有`,
      `是不是每个人时间不一样啊，我怕漏邮件`,
      `有已经弄完的吗，能不能说下大概顺序，不用发隐私`,
      `我现在只想知道在哪个页面看，邮件太多真的会漏`,
      `押金这个是收到房间之后才交吗，还是申请的时候就要交`,
      `如果宿舍没下来，是不是也要同步看校外房源啊`,
    ];
  }

  if (topic.includes("早餐") || topic.includes("公寓")) {
    return [
      `想问下大家，公寓一般有免费的早餐吗？`,
      `我也想知道，我看页面没太写清楚，是不是默认没有呀`,
      `如果没有早餐，那是不是都自己做比较多`,
      `有住过公寓的学长学姐吗，厨房会不会很挤`,
      `我主要怕早八来不及做饭哈哈`,
      `是不是可以先买点麦片/面包这种顶一下`,
      `有没有${schoolLabel}附近早餐比较方便的地方呀`,
      `我现在看住宿，感觉早餐这个小问题也挺影响生活的`,
    ];
  }

  if (moduleId === "flight" || topic.includes("机票") || topic.includes("飞")) {
    const cities = variant % 2 === 0 ? ["北京", "9月初"] : ["深圳", "8月底"];
    return [
      `有没有人打算从${cities[0]}飞呀？我现在还在看机票`,
      `我也没买，价格一天一个样，有点不敢下手`,
      `我想${cities[1]}走，看看有没有差不多时间的`,
      `直飞真的贵，转机又怕第一次一个人飞太慌`,
      `有人行李额买到两件的吗，我东西感觉塞不下`,
      `如果同一天落地是不是可以一起打车`,
      `蹲一个飞友，看到便宜票也可以互相喊一下`,
      `我准备再刷两天，不行就先买能退改的`,
    ];
  }

  if (moduleId === "secondhand" || topic.includes("二手") || topic.includes("买")) {
    return [
      `大家最近有在看${topic}吗？我感觉价格差得有点大`,
      `我也在蹲，怕买贵也怕东西不好用`,
      `有些写九成新，但图拍得啥也看不出来`,
      `取货地点也得看吧，太远真的搬不动`,
      `小家电是不是最好当场试一下`,
      `我想先蹲床品和锅，别的落地再看`,
      `有没有人知道大概什么价格算正常呀`,
      `看到靠谱的可以甩群里，我也想收`,
    ];
  }

  if (moduleId === "college" || topic.includes("选课") || topic.includes("专业")) {
    return [
      `有同专业的同学在看${topic}吗？我有点没看懂`,
      `我也，系统里东西好多，看得有点乱`,
      `reading list 现在要买吗，还是开学再说`,
      `有人知道课表是不是还会变吗`,
      `我想找同专业搭子，之后上课可以互相提醒一下`,
      `有些 module 名字太像了，我怕选错`,
      `同专业的可以冒个泡吗，我想拉个小群对一下`,
      `不用发隐私，就说专业方向就行`,
    ];
  }

  if (moduleId === "language" || topic.includes("语言")) {
    return [
      `语言班有同学在看${topic}吗？我还没完全定下来`,
      `我主要怕住宿中间断掉，正课前还要搬一次`,
      `有没有人找口语搭子呀，提前练练也行`,
      `我晚上比较稳定，可以一起练`,
      `语言班住宿现在找还来得及吗`,
      `有人是先短租再搬正课宿舍的吗`,
      `我想找同时间到的室友，感觉一个人有点慌`,
      `有类似情况的可以一起看房吗`,
    ];
  }

  return [
    `有人最近在弄${topic}吗？我看得有点乱`,
    `我也想问这个，感觉信息有点散`,
    `主要怕漏了${schoolLabel}的时间点`,
    `有没有已经弄完的，说下大概流程就行`,
    `不用发隐私，我就想知道大概在哪个页面`,
    `我邮件太多了，真的怕看漏`,
    `同问，我现在也没弄明白这一步`,
    `有同情况的可以接一下吗`,
  ];
}

function normalizeTurnFromRecord(turn) {
  return {
    speakerType: String(turn.speaker || "").includes("学姐") ? "senior" : "student",
    speaker: turn.speaker || "同学",
    text: turn.text,
  };
}

function buildRecordSeedLines({ record, topic, schoolLabel }) {
  const text = `${record?.category || ""} ${record?.hotTopics?.join(" ") || ""} ${record?.keywords?.join(" ") || ""} ${topic}`;

  if (text.includes("语言班") || text.includes("室友") || text.includes("短租") || text.includes("正课宿舍") || text.includes("口语")) {
    return [
      `有7月去${schoolLabel}上语言班的吗，我想先找个室友，女生`,
      `我也7月，正在纠结语言班住学校还是外面短租，有人看过吗`,
      `我刚刷到几个 student accommodation，合同好像有的是到8月底，不知道能不能接正课宿舍`,
      `我怕中间空几天，拖箱子换地方太麻烦了`,
      `同担心，所以想找个作息差不多的室友，语言班期间一起看房也行`,
      `有没有人想组个口语搭子，平时练一下 presentation 那种`,
      `我口语真的有点虚，想提前找人互相练一下`,
      `有同7月语言班的可以一起拉个小群吗`,
    ];
  }

  if (text.includes("机票") || text.includes("飞") || text.includes("接机") || text.includes("拼车")) {
    return [
      `有人同一天飞吗，我现在还在看航班`,
      `我也没买，直飞贵，转机又怕时间太赶`,
      `落地之后有人想一起拼车吗，行李多一个人有点慌`,
      `我准备再刷两天票，看到合适的就下手`,
      `有没有已经买完的，想参考一下大概价格`,
      `我主要怕转机时间太短，第一次自己飞不太敢赌`,
      `如果同一天到可以互相喊一下`,
      `蹲一个飞友，最好时间差不多`,
    ];
  }

  if (text.includes("二手") || text.includes("小家电") || text.includes("床品") || text.includes("锅") || text.includes("火锅")) {
    return [
      `大家最近有在蹲二手吗，我感觉价格差得有点大`,
      `我想先收床品和锅，其他到了再说`,
      `有些写九成新但图太糊了，真的不敢下手`,
      `取货地点也挺重要，太远搬不回来`,
      `小家电是不是最好当场试一下`,
      `我怕买贵，想先看看大家都什么价收的`,
      `有没有靠谱一点的二手群或者平台呀`,
      `看到合适的可以互相甩一下`,
    ];
  }

  if (text.includes("选课") || text.includes("课表") || text.includes("专业") || text.includes("reading")) {
    return [
      `有同专业的同学在看课表/选课吗，我有点没看懂`,
      `我也，系统里东西好多，看得眼花`,
      `reading list 现在需要买吗，还是开学再说`,
      `有人知道课表后面还会不会变吗`,
      `我想找同专业搭子，之后上课互相提醒一下`,
      `有些 module 名字太像了，我怕选错`,
      `同专业可以冒个泡吗，想一起对一下`,
      `不用发隐私，说专业方向就行`,
    ];
  }

  if (text.includes("签证") || text.includes("CAS") || text.includes("cas") || text.includes("offer") || text.includes("uncon") || text.includes("con")) {
    return [
      `有人最近在弄 CAS/签证/注册这些吗，我现在看得有点乱`,
      `我也想问，offer 后面到底先等哪个邮件啊`,
      `我怕漏了学校发的入口，邮箱每天都好多`,
      `有人已经走完流程了吗，能不能说下大概顺序`,
      `不用发个人信息，我就想知道大概在哪一步`,
      `我现在主要卡在不知道该等邮件还是进系统看`,
      `有没有同样 con 转 uncon 还没动的`,
      `同问，我现在也只能每天刷新邮箱`,
    ];
  }

  if (text.includes("住宿") || text.includes("租房") || text.includes("公寓") || text.includes("studio") || text.includes("house")) {
    return [
      `有人在看住宿吗，我现在有点分不清校内和外面公寓怎么选`,
      `我也是，主要怕离上课地方太远`,
      `studio 会不会太贵啊，ensuite 又怕室友不合适`,
      `有人住过这个区域吗，通勤大概要多久`,
      `我现在看地图越看越乱，感觉直线距离不太准`,
      `有公寓班车的话是不是也要看具体时间`,
      `想蹲一下真实入住体验，官网看不出来`,
      `同学校同专业的可以一起对下房源吗`,
    ];
  }

  const anchors = record?.voiceAnchors?.length ? record.voiceAnchors : defaultChatVoiceAnchors;
  return [
    anchors[0] || `想问下大家${topic}`,
    anchors[1] || `我也在看这个`,
    anchors[2] || `有没有同情况的`,
    `有人已经弄完了吗，想听个大概流程`,
    `我现在主要怕漏了${schoolLabel}的时间点`,
    `不用发隐私，讲讲大概在哪一步就行`,
    anchors[3] || `蹲一个有经验的同学`,
    anchors[4] || `大家可以一起对一下信息`,
  ];
}

function buildTurns({ profile, moduleId, topic, variant, record }) {
  if (record?.turns?.length) {
    const fromRecord = record.turns.map(normalizeTurnFromRecord);
    const schoolLabel = getSchoolLabel(profile);
    const extras = buildQuestionLines({ topic, moduleId, schoolLabel, variant });
    const seniorLine = buildSeniorLine({ topic, moduleId, variant: variant + 1 });
    const padded = [...fromRecord];

    while (padded.length < 10) {
      if (padded.length === 8) {
        padded.push({ speakerType: "senior", speaker: "学姐号", text: seniorLine });
      } else {
        const text = extras[padded.length % extras.length];
        padded.push({ speakerType: "student", speaker: `同学${String.fromCharCode(65 + (padded.length % 6))}`, text });
      }
    }

    return padded.slice(0, 10);
  }

  const schoolLabel = getSchoolLabel(profile);
  const recordLines = record ? buildRecordSeedLines({ record, topic, schoolLabel }) : [];
  const questions = recordLines.length ? recordLines : buildQuestionLines({ topic, moduleId, schoolLabel, variant });
  const seniorOne = buildSeniorLine({ topic, moduleId, variant });
  const seniorTwo = buildSeniorLine({ topic, moduleId, variant: variant + 1 });
  const names = variant % 2 === 0
    ? ["同学A", "同学B", "同学C", "同学D", "同学E", "同学F", "同学G", "同学H"]
    : ["姐妹", "uu", "同学A", "同学B", "群友", "新生", "同学C", "同学D"];

  return [
    { speakerType: "student", speaker: names[0], text: questions[0] },
    { speakerType: "student", speaker: names[1], text: questions[1] },
    { speakerType: "student", speaker: names[2], text: questions[2] },
    { speakerType: "senior", speaker: "学姐号", text: seniorOne },
    { speakerType: "student", speaker: names[3], text: questions[3] },
    { speakerType: "student", speaker: names[4], text: questions[4] },
    { speakerType: "student", speaker: names[5], text: questions[5] },
    { speakerType: "student", speaker: names[6], text: questions[6] },
    { speakerType: "senior", speaker: "学姐号", text: seniorTwo },
    { speakerType: "student", speaker: names[7], text: questions[7] },
  ];
}

function decorateDialogue({ profile, moduleId, moduleName, topic, record, index, publishedKeys }) {
  const turns = buildTurns({ profile, moduleId, topic, variant: index + publishedKeys.size, record });
  const copyText = copyFromTurns(turns);
  const key = normalizeKey(copyText);

  return {
    id: `local-dialogue-${Date.now()}-${index}`,
    key,
    title: `${moduleName}热聊：${compact(topic, 24)}`,
    angle: topic,
    summary: `根据${profile.school}聊天记录语气，把「${compact(topic, 26)}」转成可直接发群的来回对话。`,
    copyText,
    turns,
    followUps: [
      "同情况的也说下你们现在看到的信息吧。",
      "有已经弄完的可以简单讲讲吗？",
    ],
    sourceNote: `本地资料库模式：参考 ${record?.dateLabel || "历年"} · ${record?.category || "聊天记录"} · ${profile.docSource}`,
    published: publishedKeys.has(key),
    effect: "未选择",
    localMode: true,
  };
}

export function generateLocalGroupDialogues({
  school,
  moduleId,
  moduleName,
  timeNode,
  recentDiscussion,
  publishedDialogues = [],
}) {
  const prompt = `${school} ${timeNode} ${recentDiscussion || ""}`;
  const profile = findSchoolProfileByPrompt(prompt, school);
  const month = extractMonthFromText(recentDiscussion) || extractMonthFromText(timeNode) || "6月";
  const queryIntent = detectIntent(recentDiscussion || "") || moduleId;
  const records = pickRecords(profile, {
    month,
    moduleId: queryIntent || moduleId,
    query: prompt,
  });
  const angles = buildAngles({ recentDiscussion, month, moduleId, records });
  const publishedKeys = new Set(publishedDialogues.map((dialogue) => normalizeKey(dialogue.key || dialogue.copyText)));
  const generated = [];

  for (let attempt = 0; generated.length < angles.length && attempt < angles.length + 10; attempt += 1) {
    const angle = angles[attempt % angles.length];
    const topic = inferTopic({ recentDiscussion, angle: attempt < angles.length ? angle : `${angle} ${attempt}`, moduleId });
    const record = records[attempt % Math.max(records.length, 1)];
    const dialogue = decorateDialogue({
      profile,
      moduleId,
      moduleName,
      topic: attempt < angles.length ? topic : `${topic} 另一种问法`,
      record,
      index: attempt,
      publishedKeys,
    });

    if (!publishedKeys.has(dialogue.key)) {
      generated.push(dialogue);
      publishedKeys.add(dialogue.key);
    }
  }

  const historyDialogues = records.map((record) => ({
    id: record.id,
    sourceTitle: profile.docSource,
    sourceType: "聊天记录沉淀库",
    dateLabel: record.dateLabel,
    category: record.category,
    text: record.turns?.length
      ? record.turns.map((turn) => `${turn.speaker}：${turn.text}`).join("\n")
      : `${record.voiceAnchors?.join(" / ") || defaultChatVoiceAnchors.join(" / ")}\n${record.evidence}`,
  }));

  return {
    dialogues: generated,
    historyDialogues,
    fallbackUsed: false,
    localMode: true,
  };
}
