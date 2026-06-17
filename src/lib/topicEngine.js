import {
  groupModules,
  lifePainPoints,
  newsMaterialPool,
  topicBlueprints,
} from "../data/sampleData";
import { schoolKnowledge } from "../data/schoolKnowledge";
import { findChatInsight } from "./chatConversationEngine";

const generatedTopicMemory = new Map();

function stableId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(text = "") {
  return text.toString().replace(/\s+/g, "").toLowerCase();
}

function getSchoolProfile(school) {
  return schoolKnowledge[school] || schoolKnowledge.UCL;
}

function getModuleFacts(profile, moduleId) {
  return profile.facts.filter((fact) => fact.categories.includes(moduleId));
}

function stripEndingPunctuation(text) {
  return text.trim().replace(/[？?。.!！]+$/g, "");
}

function pickEvidence({ profile, moduleId, index, question = "" }) {
  const keywordMap = [
    { keywords: ["宿舍", "住宿", "租房", "室友", "房", "床垫", "二手", "公寓", "apartment", "accommodation", "studio", "ensuite"], modules: ["secondhand", "alumni"] },
    { keywords: ["机票", "机场", "航班", "行李", "海关", "入境", "接机", "签证", "cas", "coe", "visa"], modules: ["flight", "alumni"] },
    { keywords: ["选课", "课程", "专业", "reading", "课表", "导师", "学院", "module", "unit"], modules: ["college"] },
    { keywords: ["语言", "口语", "pre-sessional", "语言班"], modules: ["language"] },
    { keywords: ["注册", "学生卡", "账号", "邮箱", "mfa", "unikey", "guid", "portico"], modules: ["alumni", "college"] },
    { keywords: ["早餐", "早饭", "餐食", "包餐", "免费餐", "breakfast", "meal", "meals", "catered", "self-catered", "外卖", "做饭", "自己做", "吃饭", "饮食", "超市", "中超", "厨房", "餐厅"], modules: ["alumni", "secondhand"] },
    { keywords: ["安全", "诈骗", "gp", "看病", "医疗", "心理", "出勤"], modules: ["alumni", "flight", "language"] },
  ];

  const lowerQuestion = question.toLowerCase();
  const matchedModules = keywordMap.find((item) =>
    item.keywords.some((keyword) => lowerQuestion.includes(keyword.toLowerCase()))
  )?.modules;
  const preferredAccommodationPool = includesAny(question, [
    "早餐",
    "早饭",
    "餐食",
    "包餐",
    "免费餐",
    "breakfast",
    "meal",
    "meals",
    "catered",
    "self-catered",
    "公寓",
    "宿舍",
    "住宿",
    "租房",
    "studio",
    "ensuite",
    "apartment",
    "accommodation",
  ])
    ? profile.facts.filter((fact) =>
        includesAny(`${fact.label} ${fact.text}`, [
          "住宿",
          "宿舍",
          "公寓",
          "租房",
          "校内住宿",
          "accommodation",
          "生活",
          "采购",
        ])
      )
    : [];

  const factPool = preferredAccommodationPool.length
    ? preferredAccommodationPool
    : matchedModules
      ? profile.facts.filter((fact) => fact.categories.some((category) => matchedModules.includes(category)))
      : getModuleFacts(profile, moduleId);
  const fallbackPool = factPool.length ? factPool : profile.facts;
  const fact = fallbackPool[index % fallbackPool.length];
  const official = profile.webSources[index % profile.webSources.length];

  return {
    profile,
    fact,
    sources: [
      {
        type: "上传资料",
        title: profile.docSource,
        note: fact.text,
      },
      {
        type: "官方网页",
        title: official.label,
        note: official.note,
        url: official.url,
      },
    ],
  };
}

function includesAny(text = "", keywords = []) {
  const normalizedText = text.toLowerCase();
  return keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
}

function pickNewsMaterial({ index, moduleId, question = "" }) {
  if (includesAny(question, ["早餐", "早饭", "餐食", "包餐", "免费餐", "breakfast", "meal", "meals", "catered", "self-catered", "厨房", "做饭"])) {
    return newsMaterialPool.find((item) => item.id === "news-04") || newsMaterialPool[index % newsMaterialPool.length];
  }

  if (includesAny(question, ["公寓", "宿舍", "住宿", "租房", "studio", "ensuite", "apartment", "accommodation"])) {
    return newsMaterialPool.find((item) => item.id === "news-02") || newsMaterialPool[index % newsMaterialPool.length];
  }

  if (moduleId === "flight" || includesAny(question, ["机票", "航班", "机场", "行李", "接机", "落地"])) {
    return newsMaterialPool.find((item) => item.id === "news-01") || newsMaterialPool[index % newsMaterialPool.length];
  }

  return newsMaterialPool[index % newsMaterialPool.length];
}

function createFactDrivenTitle({ school, moduleId, blueprint, fact }) {
  if (!fact) {
    return blueprint.title;
  }

  const blueprintFocus = stripEndingPunctuation(blueprint.title);

  if (moduleId === "flight") {
    return `${blueprintFocus}，结合${school}${fact.label}要先核对什么？`;
  }

  if (moduleId === "secondhand") {
    return `${blueprintFocus}，落地前围绕${fact.label}怎么判断要不要买？`;
  }

  if (moduleId === "college") {
    return `${blueprintFocus}，${fact.label}这类信息大家会先看官网还是问学长姐？`;
  }

  if (moduleId === "language") {
    return `${blueprintFocus}，${fact.label}这块大家准备到哪了？`;
  }

  return `${blueprintFocus}，${fact.label}这块大家怎么确认？`;
}

function cleanDiscussionText(text) {
  return text.trim().replace(/[？?。.!！]+$/g, "").slice(0, 48);
}

function isSpecificDiscussionQuestion(text = "") {
  const cleanText = cleanDiscussionText(text);

  if (!cleanText) {
    return false;
  }

  return (
    /[？?]/.test(text) ||
    /(吗|嘛|么|有没有|会不会|要不要|多久|哪里|哪|怎么|如何|多少|贵不贵|免费|包不包|包餐|能不能|可不可以|要不要|是不是)/.test(cleanText)
  );
}

function createDiscussionDrivenTitle({ moduleId, recentDiscussion, blueprint }) {
  const discussion = cleanDiscussionText(recentDiscussion);
  const blueprintFocus = stripEndingPunctuation(blueprint.title);

  if (!discussion) {
    return "";
  }

  if (moduleId === "flight") {
    return `围绕“${discussion}”发一条找飞友/行李接龙`;
  }

  if (moduleId === "secondhand") {
    return `把“${discussion}”拆成一条二手/预算互助帖`;
  }

  if (moduleId === "college") {
    return `围绕“${discussion}”找一轮同专业真实经验`;
  }

  if (moduleId === "language") {
    return `把“${discussion}”变成语言班进度互助`;
  }

  return `围绕“${discussion}”先开一轮新生互助`;
}

function pickItem(items = [], index, fallback = "") {
  const cleanItems = items.filter(Boolean);
  return cleanItems.length ? cleanItems[index % cleanItems.length] : fallback;
}

function pickSequentialItem(items = [], index, fallback = "") {
  const cleanItems = items.filter(Boolean);
  return cleanItems[index] || fallback;
}

function compactItems(items = [], max = 3) {
  return items.filter(Boolean).slice(0, max).join("、");
}

function getMonthLabel(timeNode, chatInsight) {
  return chatInsight?.month || timeNode.split("：")[0] || "这个阶段";
}

function createDiscussionSpecificCopy({ month, cleanDiscussion, evidence, chatInsight, index }) {
  const isBreakfast = includesAny(cleanDiscussion, ["早餐", "早饭", "餐食", "包餐", "免费餐", "breakfast", "meal", "meals", "catered", "self-catered"]);
  const isAccommodation = includesAny(cleanDiscussion, ["公寓", "宿舍", "住宿", "租房", "studio", "ensuite", "apartment", "accommodation"]);
  const isFlight = includesAny(cleanDiscussion, ["机票", "航班", "飞", "落地", "机场", "行李", "转机", "接机", "航线"]);
  const isCas = includesAny(cleanDiscussion, ["cas", "offer", "押金", "邮件", "邮箱", "系统", "确认信", "确认邮件"]);
  const isCourse = includesAny(cleanDiscussion, ["选课", "课程", "学院", "专业", "reading", "导师", "课表"]);
  const isSecondhand = includesAny(cleanDiscussion, ["二手", "床垫", "小家电", "出", "收", "买", "卖", "价格"]);
  const isLanguage = includesAny(cleanDiscussion, ["语言班", "口语", "室友", "住宿搭子", "搭子", "pre-sessional"]);
  const anchor = pickItem(chatInsight?.voiceAnchors, 0, "想问下大家");

  const simpleIntentVariants = [
    isFlight && {
      title: `机票/航班小提醒：${cleanDiscussion}`,
      seniorCopy: "大家可以多刷点平台做对比，瞅瞅价格浮动。已经买好的同学也可以说下大概航线和价格，后面还没买的心里有个数。",
      peerCopy: "我也还没买，准备再蹲两天价格。有没有已经下单的同学说下大概多少钱、从哪飞呀？",
      followUpCopy: "大家现在刷到的机票大概多少钱，都是从哪里飞？",
      quickReplies: [
        "大家可以多刷点平台做对比，瞅瞅价格浮动。",
        "买好了的同学可以说下大概价格和航线吗？",
        "还没买的可以一起蹲一下价格变化。",
      ],
    },
    isCas && {
      title: `材料/邮件进度：${cleanDiscussion}`,
      seniorCopy: "这个先别慌，可以先看下邮箱、垃圾箱和申请页面有没有更新。已经发邮件的话，自动回复先别当正式结果，再等一下学校后续邮件。",
      peerCopy: "我也会先翻垃圾箱和申请页面。有同情况的同学可以说下自己等了多久吗？",
      followUpCopy: "你们现在是已经交完材料在等，还是还有哪一步没确认？",
      quickReplies: [
        "先看下邮箱、垃圾箱和申请页面有没有更新。",
        "自动回复先别当正式结果，还是等学校后续邮件。",
        "有同情况的同学可以说下自己等了多久吗？",
      ],
    },
    isCourse && {
      title: `课程/学院问题：${cleanDiscussion}`,
      seniorCopy: "这个可以先看看同专业同学怎么选，别急着一次定死。把专业和想选的课发出来，群里有同方向的同学就能接上。",
      peerCopy: "我也在看选课，感觉还是听听同专业的比较有用。有没有同学院的同学一起对一下？",
      followUpCopy: "大家可以按“专业 + 想选的课/方向”接一下吗？",
      quickReplies: [
        "同专业同学可以先互相看看怎么选。",
        "别急着一次定死，先把想选的课发出来。",
        "有没有同学院的同学一起对一下？",
      ],
    },
    isSecondhand && {
      title: `二手/价格参考：${cleanDiscussion}`,
      seniorCopy: "这个可以先多看几个价格，别看到一个就急着下手。最好问清楚成色、尺寸、取货位置，能当面看一下更稳。",
      peerCopy: "我也想蹲这个，主要怕买贵或者取货太远。有人最近买过/出过吗，大概什么价？",
      followUpCopy: "大家最近看到这个大概什么价，取货都在哪一片？",
      quickReplies: [
        "先多看几个价格，别看到一个就急着下手。",
        "成色、尺寸、取货位置最好先问清楚。",
        "有人最近买过/出过吗，大概什么价？",
      ],
    },
    isLanguage && {
      title: `语言班/搭子问题：${cleanDiscussion}`,
      seniorCopy: "这个现在问也不算晚，可以直接把时间、预算和想找的类型发出来。群里如果有同语言班或同时间到的同学，很容易接上。",
      peerCopy: "我也还在找，可以一起蹲一下。同语言班/差不多时间到的同学方便说下吗？",
      followUpCopy: "大家可以按“语言班时间 + 想找室友/搭子”接一下吗？",
      quickReplies: [
        "现在问也不算晚，先把时间和预算发出来。",
        "同语言班或同时间到的同学比较容易接上。",
        "大家可以按语言班时间接一下吗？",
      ],
    },
  ].filter(Boolean);

  if (simpleIntentVariants.length > 0) {
    const selected = simpleIntentVariants[index % simpleIntentVariants.length];

    return {
      ...selected,
      topicBrief: `员工输入：${cleanDiscussion}；本条按具体问题生成，可直接复制到群里。`,
      toneSource: chatInsight
        ? `语气参考 ${chatInsight.source} 的短句问法；学姐口吻已压短。`
        : `参考 ${evidence.profile.docSource}，改成群里能直接发的短句。`,
      suppressChatEvidence: true,
    };
  }

  if (isBreakfast || isAccommodation) {
    const subject = isBreakfast ? "公寓早餐/餐食" : "公寓/宿舍配置";
    const variants = [
      {
        title: `${subject}确认：${cleanDiscussion}`,
        seniorCopy: `这个一般要看具体公寓和房型。大家可以把公寓名发一下，顺手看看页面或合同里有没有写 breakfast / meals included；没写的话先别默认有。`,
        peerCopy: `我也想知道这个。我现在看公寓会直接搜 breakfast / meals / catered / self-catered，很多学生公寓其实是自己做饭。有同学看过官网/合同的话，可以说下自己看的公寓名和页面怎么写的吗？`,
        followUpCopy: `你们现在看的是哪个公寓？官网或合同里有没有写 breakfast、meals included、catered 或 self-catered？`,
      },
      {
        title: "公寓官网/合同里怎么查早餐",
        seniorCopy: `看公寓时可以顺手搜 breakfast、meals included、catered。没写的话先别默认包早餐，把公寓名发出来大家一起看也行。`,
        peerCopy: `我刚刚也去搜了一下，感觉要看公寓页面怎么写。有些写 self-catered 就基本是自己做饭/自己买。有人看到明确写 breakfast included 的公寓吗？`,
        followUpCopy: `你们看的公寓页面写的是 catered、self-catered，还是完全没提早餐？`,
      },
      {
        title: "公寓包餐和自己做饭怎么判断",
        seniorCopy: `页面写 catered / meals included 才比较像有餐食。只写 shared kitchen 或 self-catered 的话，多半就是自己解决早餐。`,
        peerCopy: `我理解是有厨房不等于包早餐，shared kitchen 可能只是能自己做饭。有没有人看过合同里餐食那一栏？想确认一下别误会。`,
        followUpCopy: `你们现在看到的是厨房配置，还是明确写了 breakfast / meals？`,
      },
      {
        title: "有厨房的公寓早餐怎么解决",
        seniorCopy: `如果公寓不包早餐，大家可以提前想一下早餐怎么解决：楼下超市、公共厨房、自己带一点速食，或者附近咖啡店。刚落地那几天不用准备太复杂，先保证能吃上就行。`,
        peerCopy: `我感觉如果不包早餐，可能先买面包/麦片/牛奶这种比较省事。有没有住过公寓的同学说下，早上自己做饭方便吗？`,
        followUpCopy: `如果公寓不包早餐，你们会选自己做、超市买，还是学校附近解决？`,
      },
      {
        title: "公寓早餐费用要不要算进预算",
        seniorCopy: `问早餐其实也可以顺带看预算。如果不包餐，早餐和日常采购要单独算；如果公寓写包餐，也要看是只包工作日、只包早餐，还是有其他限制。大家看合同时可以留意这几句。`,
        peerCopy: `我之前只算了房租，突然发现早餐/买菜也得算进去。有人已经估过一周早餐大概多少钱吗？`,
        followUpCopy: `大家预算里有单独算早餐/买菜吗，还是只先算了房租？`,
      },
      {
        title: "按公寓名整理早餐信息",
        seniorCopy: `可以直接在群里按公寓名整理一下：公寓名 + 房型 + 官网有没有写 breakfast/meals + 有没有厨房。这样后面同学查起来也方便，别只说“有/没有”，最好带上页面或合同里的原文。`,
        peerCopy: `要不要大家按公寓名接一下？我想看有没有同一个公寓的，顺便确认早餐和厨房配置。`,
        followUpCopy: `大家可以按“公寓名 + 房型 + 是否写早餐/厨房”接一下吗？`,
      },
    ];
    const selected = variants[index % variants.length];

    return {
      ...selected,
      topicBrief: `员工输入：${cleanDiscussion}；本批话题优先围绕这个具体问题生成，聊天沉淀只做语气参考。`,
      toneSource: chatInsight
        ? `语气参考 ${chatInsight.source} 的短句提问方式；正文已按员工输入改写。`
        : `参考 ${evidence.profile.docSource}，用短句提问和互相补充的方式处理。`,
      suppressChatEvidence: true,
      quickReplies: [
        `我也想知道这个，大家看的公寓有写 breakfast / meals included 吗？`,
        `如果官网没写包餐，是不是就默认自己做饭/自己买？`,
        `有人住过这个公寓的话，可以说下早餐或厨房配置吗？`,
      ],
    };
  }

  const genericVariants = [
    {
      title: `群里问：${cleanDiscussion}`,
      seniorCopy: `这个可以先问问同情况的同学，看看大家现在看到的信息是不是一样。别发隐私内容，截关键几句或说大概情况就行。`,
      peerCopy: `${anchor}，我也在看这个。有没有同情况的同学说下现在看到啥信息？`,
      followUpCopy: `有同情况的同学可以说下现在看到的说明吗？`,
    },
    {
      title: `同情况互助：${cleanDiscussion}`,
      seniorCopy: `可以直接把自己看到的版本发出来对一下。哪怕只是邮件里一句话，也比大家各猜各的清楚。`,
      peerCopy: `我也想听听同情况的同学怎么处理。有人已经看到比较明确的说法了吗？`,
      followUpCopy: `大家现在看到的说法一样吗？`,
    },
  ];
  const selected = genericVariants[index % genericVariants.length];

  return {
    ...selected,
    topicBrief: `员工输入：${cleanDiscussion}；本条优先围绕这个具体问题生成。`,
    toneSource: chatInsight
      ? `语气参考 ${chatInsight.source} 的短句提问方式；正文已按员工输入改写。`
      : `参考 ${evidence.profile.docSource}，用短句提问和互相补充的方式处理。`,
    suppressChatEvidence: true,
    quickReplies: [
      `同情况的同学可以说下现在看到啥信息吗？`,
      `大家现在看到的说法一样吗？`,
      `不发隐私内容，截关键几句或说大概情况就行。`,
    ],
  };
}

function createTopicCopies({
  school,
  moduleId,
  timeNode,
  discussionFocus,
  avoidDiscussionLead = false,
  blueprint,
  evidence,
  chatInsight,
  pain,
  index,
}) {
  const month = getMonthLabel(timeNode, chatInsight);
  const cleanDiscussion = discussionFocus ? cleanDiscussionText(discussionFocus) : "";

  if (cleanDiscussion) {
    return createDiscussionSpecificCopy({
      month,
      cleanDiscussion,
      evidence,
      chatInsight,
      index: avoidDiscussionLead ? index + 1 : index,
    });
  }

  const topicA = pickItem(chatInsight?.hotTopics, index, stripEndingPunctuation(blueprint.title));
  const topicB = pickItem(chatInsight?.hotTopics, index + 1, evidence.fact?.label || pain);
  const topicC = pickItem(chatInsight?.hotTopics, index + 2, evidence.fact?.label || "时间节点");
  const fallbackTitleTopic = evidence.fact?.label
    ? `「${evidence.fact.label}」这块怎么同步进度`
    : stripEndingPunctuation(blueprint.originalTitle || blueprint.title);
  const titleTopic = pickSequentialItem(chatInsight?.hotTopics, index, fallbackTitleTopic);
  const anchor = pickItem(chatInsight?.voiceAnchors, index, "想问下大家");
  const peerAnchor = pickItem(chatInsight?.voiceAnchors, index + 1, "我也在蹲这个");
  const focusLead = "";
  const topicStack = compactItems([topicA, topicB, topicC]);
  const officialTail = evidence.fact?.label
    ? `关键节点还是按学校邮件/系统里的「${evidence.fact.label}」来。`
    : "关键节点还是按学校邮件/系统来。";

  const byModule = {
    alumni: {
      title: `${school}${month}：${titleTopic}`,
      seniorCopy: `${focusLead}大家可以同步下进度：${topicStack}现在分别处理到哪里了、预计什么时候到校、有没有收到学校邮件。${school}${month}这类问题之前也会来回确认，群里先把进度说清楚，${officialTail}`,
      peerCopy: `${peerAnchor}。我现在主要在看${topicA}，${topicB}也还没完全弄明白。有没有差不多进度的同学？可以一起对下邮件/系统里不涉及隐私的部分。`,
      followUpCopy: `大家现在更想先确认${topicStack}里的哪一个？可以按“已完成/还没收到/不确定”接一下。`,
    },
    flight: {
      title: `${school}${month}飞友群：${titleTopic}`,
      seniorCopy: `${focusLead}同一天飞或同一天落地的同学可以同步下：出发城市、到达机场、落地时间、行李几件、落地后打算怎么去学校。${school}${month}之前常聊${topicA}，但护照号、签证号这些不要发群里，拼车细节再私聊确认。`,
      peerCopy: `${anchor}？我也在看飞友/行李，现在比较纠结${topicA}，还有${topicB}。有没有已经订好或者同一天到的同学，一起对一下落地后怎么走比较顺。`,
      followUpCopy: `你们现在是机票已定、还在比价，还是行李清单没收完？`,
    },
    secondhand: {
      title: `${school}${month}二手群：${titleTopic}`,
      seniorCopy: `${focusLead}二手群可以问具体一点：想蹲/出什么、预算、取货区域、能不能自取、有没有照片和尺寸。${school}${month}之前聊${topicA}的时候，大家最关心的就是别跑空、别买贵，交易尽量当面验。`,
      peerCopy: `${peerAnchor}。我主要想看看${topicA}，也有点担心${topicB}。有没有人知道大概市价/取货方便不方便？如果太远或者尺寸不合适我就先不冲了。`,
      followUpCopy: `大家买二手最在意价格、成色、距离，还是能不能当天取？`,
    },
    college: {
      title: `${school}${month}学院群：${titleTopic}`,
      seniorCopy: `${focusLead}这个可以按专业同步下：专业/方向、现在主要在看${topicA}还是${topicB}、有没有拿到学院邮件。${school}${month}类似讨论一般先找同专业的人，再去核对官网/学院信息。`,
      peerCopy: `${anchor}？我现在对${topicA}有点没底，${topicB}也想听真实经验。有没有同专业/同学院的同学，可以在群里互相说下吗？`,
      followUpCopy: `大家愿意按“专业 + 现在最想确认的问题 + 已收到的学院邮件”接一下吗？`,
    },
    language: {
      title: `${school}${month}语言班：${titleTopic}`,
      seniorCopy: `${focusLead}语言班群可以轻一点发：大家现在更想先确认${topicA}、${topicB}，还是住宿/行李衔接？不用一次问完，先说下自己的进度和问题就行。${school}${month}这类聊天本来就比较生活化，大家同步下会安心很多。`,
      peerCopy: `${peerAnchor}，我也在语言班这块有点懵，尤其是${topicA}。有没有差不多情况的同学？可以一起对一下现在收到什么邮件、还差什么、要不要约个口语/住宿搭子。`,
      followUpCopy: `你们现在最想找的是口语搭子、住宿搭子，还是一起对邮件进度的人？`,
    },
  };

  const copy = byModule[moduleId] || byModule.alumni;
  const quickReplies = [
    `${anchor}，${topicA}现在大家都处理到哪里了？`,
    `我也在看这个，${topicB}还没弄明白，想听听真实经验。`,
    `有没有同情况的同学可以接一下自己的进度？`,
  ];

  return {
    ...copy,
    topicBrief: chatInsight
      ? `${chatInsight.school}${month}聊天沉淀：${compactItems(chatInsight.hotTopics, 3)}`
      : `${school}${month}资料点：${evidence.fact?.text || stripEndingPunctuation(blueprint.title)}`,
    toneSource: chatInsight
      ? `仿照 ${chatInsight.source} 里的短句语气：${compactItems(chatInsight.voiceAnchors, 3)}`
      : `参考 ${evidence.profile.docSource}，用短句提问和接龙方式处理。`,
    quickReplies,
  };
}

function createTopicFromBlueprint(moduleId, blueprint, index, options = {}) {
  const {
    school = "UCL",
    country = "英国",
    activity = "中",
    timeNode = "5月底：找飞友/找室友/二手准备",
    recentDiscussion = "",
    avoidDiscussionLead = false,
    published = false,
    effect = "未选择",
  } = options;

  const news = pickNewsMaterial({ index, moduleId, question: recentDiscussion });
  const pain = blueprint.pain || lifePainPoints[index % lifePainPoints.length];
  const discussionFocus = recentDiscussion.trim();
  const chatInsight = findChatInsight({
    school,
    timeNode,
    moduleId,
    question: discussionFocus,
  });
  const evidence = pickEvidence({
    profile: getSchoolProfile(school),
    moduleId,
    index,
    question: discussionFocus,
  });
  const discussionTitle = index === 0
    ? createDiscussionDrivenTitle({ moduleId, recentDiscussion: discussionFocus, blueprint })
    : "";
  const fallbackTitle = discussionTitle || createFactDrivenTitle({ school, moduleId, blueprint, fact: evidence.fact });
  const copy = createTopicCopies({
    school,
    moduleId,
    timeNode,
    discussionFocus,
    avoidDiscussionLead,
    blueprint: { ...blueprint, originalTitle: blueprint.title, title: fallbackTitle },
    evidence,
    chatInsight,
    pain,
    index,
  });
  const topicTitle = copy.title || fallbackTitle;

  return {
    id: stableId(moduleId),
    title: topicTitle,
    copyReadyTitle: topicTitle,
    blueprintKey: blueprint.title,
    moduleId,
    school,
    country,
    activity,
    timeNode,
    source: chatInsight
      ? `${news.date} ${news.label}素材池 + ${evidence.profile.docSource} + ${chatInsight.source}`
      : `${news.date} ${news.label}素材池 + ${evidence.profile.docSource}`,
    riskNote: news.lowRiskAngle,
    seniorCopy: copy.seniorCopy,
    peerCopy: copy.peerCopy,
    followUpCopy: copy.followUpCopy || blueprint.chase,
    seniorVoice: copy.seniorCopy,
    peerVoice: copy.peerCopy,
    followUp: copy.followUpCopy || blueprint.chase,
    quickReplies: copy.quickReplies,
    topicBrief: copy.topicBrief,
    toneSource: copy.toneSource,
    painPoint: pain,
    newsAngle: `${news.material}；已结合 ${evidence.fact.label} 资料点，转成低风险、可接龙的群内讨论。`,
    discussionFocus: discussionFocus ? cleanDiscussionText(discussionFocus) : "",
    evidence: [
      ...evidence.sources,
      ...(chatInsight && !copy.suppressChatEvidence
        ? [
            {
              type: "聊天记录沉淀库",
              title: chatInsight.source,
              note: chatInsight.evidence,
            },
          ]
        : []),
    ],
    published,
    effect,
    createdAt: new Date().toISOString(),
    publishedAt: published ? new Date().toISOString() : "",
  };
}

export function createSeedTopics(moduleId, publishedTitles = []) {
  const blueprints = topicBlueprints[moduleId] || [];
  const publishedSet = new Set(publishedTitles.map(normalize));

  return blueprints.slice(0, 5).map((blueprint, index) =>
    createTopicFromBlueprint(moduleId, blueprint, index, {
      published: publishedSet.has(normalize(blueprint.title)),
      effect: publishedSet.has(normalize(blueprint.title)) ? "好" : "未选择",
    })
  );
}

export function generateTopics({
  moduleId,
  school,
  country,
  inputs,
  topics = [],
  publishedArchive = [],
}) {
  const blueprints = topicBlueprints[moduleId] || [];
  const publishedTitles = new Set(
    [
      ...topics
        .filter((topic) => topic.published)
        .flatMap((topic) => [topic.blueprintKey, topic.title, topic.copyReadyTitle]),
      ...publishedArchive.flatMap((topic) => [topic.blueprintKey, topic.title, topic.copyReadyTitle]),
    ].map(normalize)
  );
  const normalizedDiscussion = normalize(cleanDiscussionText(inputs.recentDiscussion || ""));
  const avoidDiscussionLead = Boolean(
    normalizedDiscussion &&
      Array.from(publishedTitles).some((title) => title.includes(normalizedDiscussion))
  );

  const recentGenerated = generatedTopicMemory.get(moduleId) || [];
  const memorySet = new Set(recentGenerated.map(normalize));

  const unusedBlueprints = blueprints.filter((blueprint) => {
    const key = normalize(blueprint.title);
    return !publishedTitles.has(key) && !memorySet.has(key);
  });

  const fallbackBlueprints = blueprints.filter((blueprint) => {
    const key = normalize(blueprint.title);
    return !publishedTitles.has(key);
  });

  const source = unusedBlueprints.length >= 5 ? unusedBlueprints : fallbackBlueprints;
  const outputCount = isSpecificDiscussionQuestion(inputs.recentDiscussion || "")
    ? 1
    : Math.min(6, source.length);
  const selected = source.slice(0, outputCount);

  const generated = selected.map((blueprint, index) =>
    createTopicFromBlueprint(moduleId, blueprint, index, {
      school,
      country,
      activity: inputs.activity,
      timeNode: inputs.timeNode,
      recentDiscussion: inputs.recentDiscussion,
      avoidDiscussionLead,
    })
  );

  generatedTopicMemory.set(moduleId, generated.flatMap((topic) => [topic.blueprintKey, topic.title]));

  return generated;
}

export function createDualToneAnswer({ question, school, country, moduleName }) {
  const safeQuestion = question.trim() || "群里有人问：现在还没开始准备，会不会来不及？";
  const moduleId = groupModules.find((module) => module.name === moduleName)?.id || "alumni";
  const chatInsight = findChatInsight({
    school,
    moduleId,
    question: safeQuestion,
  });
  const evidence = pickEvidence({
    profile: getSchoolProfile(school),
    moduleId,
    index: 0,
    question: safeQuestion,
  });
  const secondary = pickEvidence({
    profile: getSchoolProfile(school),
    moduleId,
    index: 1,
    question: safeQuestion,
  });
  const chatTopics = chatInsight?.hotTopics || [];
  const peerAnchor = chatInsight?.voiceAnchors?.[0] || "我也在蹲这个";
  const secondAnchor = chatInsight?.voiceAnchors?.[1] || "有没有同情况的同学";
  const hotTopicText = compactItems(chatTopics, 2) || evidence.fact.label;
  const chatEvidence = chatInsight
    ? [
        {
          type: "聊天记录沉淀库",
          title: chatInsight.source,
          note: chatInsight.evidence,
        },
      ]
    : [];
  const actionMap = {
    alumni: {
      slots: "现在处理到哪里、收到什么邮件、预计到校/入学时间",
      caution: "具体节点还是以学校系统和邮件为准。",
    },
    flight: {
      slots: "出发城市、航班时间、落地机场、行李几件、落地交通",
      caution: "护照号、签证号这类信息不要发群里，拼车细节再私聊确认。",
    },
    secondhand: {
      slots: "预算、取货区域、尺寸/成色、能不能当面验",
      caution: "二手交易别只看价格，先确认照片、尺寸、取货方式和付款方式。",
    },
    college: {
      slots: "专业方向、现在想确认的问题、有没有收到学院邮件",
      caution: "同专业经验可以参考，但课程和注册还是以学院/官网为准。",
    },
    language: {
      slots: "语言班开始日期、住宿衔接、收到哪些邮件、想找什么搭子",
      caution: "语言班安排还是以学校系统和邮件为准。",
    },
  };
  const action = actionMap[moduleId] || actionMap.alumni;

  return {
    seniorAnswer: `现在还不算晚，大家可以同步下进度，多关注学校系统和邮件。你可以简单发下：${action.slots}，群里有同情况的同学就能接上。${chatInsight ? `${chatInsight.school}${chatInsight.month}之前也聊过${hotTopicText}，` : ""}${action.caution}`,
    peerAnswer: `${peerAnchor}，我也在看这个。可以直接发一下：现在处理到哪里、收到什么邮件、时间/预算/材料大概是什么情况。${secondAnchor}的话，大家一起对下学校系统和邮件会更清楚。`,
    evidence: [
      ...evidence.sources,
      ...secondary.sources,
      ...chatEvidence,
    ].filter((source, index, array) => array.findIndex((item) => item.title === source.title && item.note === source.note) === index),
  };
}

export function buildDataAdapterPreview(state) {
  return {
    tables: {
      groups: {
        key: "moduleId",
        fields: ["school", "country", "moduleName", "activity", "timeNode", "recentDiscussion"],
      },
      topics: {
        key: "topicId",
        fields: [
          "moduleId",
          "title",
          "copyReadyTitle",
          "blueprintKey",
          "evidence",
          "officialSourceUrl",
          "seniorVoice",
          "peerVoice",
          "seniorCopy",
          "peerCopy",
          "followUp",
          "followUpCopy",
          "quickReplies",
          "topicBrief",
          "toneSource",
          "published",
          "effect",
          "createdAt",
        ],
      },
      dialogue_runs: {
        key: "dialogueId",
        fields: [
          "moduleId",
          "school",
          "country",
          "timeNode",
          "recentDiscussion",
          "title",
          "angle",
          "turns",
          "copyText",
          "sourceNote",
          "published",
          "effect",
          "createdAt",
        ],
      },
      published_dialogues: {
        key: "dialogueKey",
        fields: ["moduleId", "title", "copyText", "effect", "publishedAt"],
      },
      history_dialogues: {
        key: "historyId",
        fields: ["moduleId", "sourceTitle", "sourceType", "text", "score"],
      },
      qa_logs: {
        key: "qaId",
        fields: ["question", "evidence", "seniorAnswer", "peerAnswer", "school", "country", "createdAt"],
      },
      conversation_runs: {
        key: "conversationRunId",
        fields: ["prompt", "school", "month", "hotTopics", "turns", "evidence", "createdAt"],
      },
    },
    currentDemoSnapshot: {
      school: state.settings.school,
      country: state.settings.country,
      selectedModuleId: state.selectedModuleId,
      moduleCount: Object.keys(state.modules).length,
      latestConversationPrompt: state.conversation?.prompt || "",
      latestConversationSchool: state.conversation?.result?.school || "",
      latestConversationMonth: state.conversation?.result?.month || "",
    },
  };
}
