import OpenAI from "openai";
import { searchHistoricalDialogues, searchKnowledge } from "./_shared/knowledge.js";

function compactEvidence(evidence) {
  return evidence.slice(0, 3).map((item) => ({
    id: item.id,
    school: item.school,
    moduleId: item.moduleId,
    sourceType: item.sourceType,
    sourceTitle: item.sourceTitle,
    text: item.text.slice(0, 320),
    score: item.score,
  }));
}

function normalizeDialogueKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。、“”‘’：:；;,.!?！？（）()【】\[\]\-—_]/g, "")
    .slice(0, 260);
}

function copyFromTurns(turns = []) {
  return turns
    .map((turn) => `${turn.speaker || (turn.speakerType === "senior" ? "学姐号" : "新生")}：${turn.text || ""}`)
    .join("\n");
}

function normalizeDialogue(dialogue, index, publishedKeySet) {
  const turns = Array.isArray(dialogue.turns) ? dialogue.turns : [];
  const copyText = dialogue.copyText || copyFromTurns(turns);
  const key = normalizeDialogueKey(copyText);

  return {
    id: dialogue.id || `dialogue-${Date.now()}-${index}`,
    key,
    title: dialogue.title || `模拟对话 ${index + 1}`,
    angle: dialogue.angle || "",
    summary: dialogue.summary || "围绕当前时间节点和群内热聊生成的模拟对话。",
    copyText,
    turns,
    followUps: Array.isArray(dialogue.followUps) ? dialogue.followUps : [],
    sourceNote: dialogue.sourceNote || "基于上传资料和聊天记录沉淀生成。",
    published: publishedKeySet.has(key),
    effect: "未选择",
  };
}

function buildAutoAngles(moduleId, timeNode) {
  const monthHint = timeNode || "";

  if (monthHint.includes("7月")) {
    return [
      "签证/CAS进度：有人签证还没稳，想知道机票要不要先买",
      "机票/出发城市：不同城市出发找飞友、看价格浮动和改签规则",
      "行李清单：托运行李额度、哪些东西别急着从国内带",
    ];
  }

  if (monthHint.includes("6月")) {
    return [
      "押金/住宿状态：大家在等宿舍、押金或合同信息",
      "语言班/室友：语言班期间找室友、找搭子、住宿衔接",
      "入学准备：CAS、注册、学生账号、邮件进度互相对一下",
    ];
  }

  if (monthHint.includes("8月")) {
    return [
      "落地时间：同一天到校、接机、打车或拼车",
      "临时住宿：宿舍入住前一两晚怎么安排",
      "到校第一天：办卡、超市采购、路线和安全感",
    ];
  }

  if (monthHint.includes("开学")) {
    return [
      "选课/注册：系统里看到什么、还有什么没确认",
      "学院破冰：同专业互认、reading list、welcome活动",
      "生活适应：超市、做饭、银行卡、电话卡",
    ];
  }

  const moduleAngles = {
    alumni: ["CAS/offer进度", "住宿和押金", "注册和入学准备"],
    flight: ["机票和出发城市", "行李额和托运", "落地接机和拼车"],
    secondhand: ["床品小家电", "二手价格和成色", "取货区域和安全交易"],
    college: ["选课", "同专业互认", "reading list"],
    language: ["语言班室友", "口语搭子", "住宿衔接"],
    "ai-safety": ["AI指控邮件阶段", "reference/citation自查", "AI率和写作过程焦虑"],
  };

  return moduleAngles[moduleId] || moduleAngles.alumni;
}

function compactTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);
}

function getStyleSamples(historicalDialogues) {
  const fallbackSamples = [
    "姐妹这个咋查呀",
    "好嘟～",
    "我也想知道这个",
    "有没有同情况的友友",
    "急急急好怕来不及",
    "我还没呢",
    "可以蹲一下",
    "这个是在哪个页面呀",
  ];
  const text = historicalDialogues.map((item) => item.text).join(" / ");
  const matches = text
    .split(/[\/\n。！？!?]/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 4 && line.length <= 32)
    .filter((line) => !/截图|字段|OCR|话题总结|可检索标签|source|学校总表/i.test(line))
    .slice(0, 10);

  return [...new Set([...matches, ...fallbackSamples])].slice(0, 12);
}

function studentName(seed, offset) {
  const names = ["同学A", "同学B", "uu", "姐妹", "群友", "新生", "同学C", "同学D"];
  return names[(seed + offset) % names.length];
}

function getSourceNote(evidence, historicalDialogues, fallbackUsed = false) {
  const sources = [...evidence, ...historicalDialogues]
    .map((item) => item.sourceTitle)
    .filter(Boolean)
    .slice(0, 3);

  if (!sources.length) {
    return fallbackUsed ? "本次用本地资料库生成。" : "基于当前时间节点生成。";
  }

  return `${fallbackUsed ? "本次用资料库生成；参考：" : "参考："}${sources.join("、")}`;
}

function buildFallbackTurns({ moduleId, angle, school, seed }) {
  const cityPairs = [
    ["北京", "9月初"],
    ["上海", "8月底"],
    ["深圳", "9月第一周"],
    ["广州", "8月底"],
  ];
  const [city, date] = cityPairs[seed % cityPairs.length];
  const topic = compactTitle(angle) || "这个事";
  const schoolName = compactTitle(school);
  const angleText = String(angle || "");

  if (/行李|行李箱|托运|随身|收拾|打包/i.test(angleText)) {
    return [
      { speakerType: "student", speaker: studentName(seed, 0), text: "大家行李都开始收了吗，我现在完全不知道从哪下手" },
      { speakerType: "student", speaker: studentName(seed, 1), text: "我也是。。感觉什么都想带，箱子肯定塞不下" },
      { speakerType: "student", speaker: studentName(seed, 2), text: "我准备先看机票行李额，再决定几个箱子" },
      { speakerType: "senior", speaker: "学姐号", text: "可以先按航司额度倒着收，托运和随身分开看，别一上来就硬塞。" },
      { speakerType: "student", speaker: studentName(seed, 3), text: "那床品要不要从国内带啊，感觉又占地方" },
      { speakerType: "student", speaker: studentName(seed, 4), text: "我可能只带一点应急的，别的落地再买" },
      { speakerType: "student", speaker: studentName(seed, 5), text: "药和证件这些是不是都随身比较稳" },
      { speakerType: "senior", speaker: "学姐号", text: "证件、药、电脑这些随身放，食品药品不确定的提前看下海关申报。" },
      { speakerType: "student", speaker: studentName(seed, 6), text: "懂了，我先把必带和可落地买的分开列" },
      { speakerType: "student", speaker: studentName(seed, 7), text: "有收完的uu能不能发个大概清单，我想抄作业" },
    ];
  }

  if (moduleId === "flight") {
    return [
      { speakerType: "student", speaker: studentName(seed, 0), text: `朋友们机票都买了吗，我刷${city}出发刷麻了` },
      { speakerType: "student", speaker: studentName(seed, 1), text: "我还没。。这两天一会儿一个价" },
      { speakerType: "student", speaker: studentName(seed, 2), text: `我想${date}走，有没有差不多时间的` },
      { speakerType: "senior", speaker: "学姐号", text: "可以多刷几个平台对比下，主要看退改和行李额，别只看首页价格。" },
      { speakerType: "student", speaker: studentName(seed, 3), text: "直飞好贵啊 但转机又怕行李寄丢" },
      { speakerType: "student", speaker: studentName(seed, 4), text: "我也是，第一次自己飞有点慌" },
      { speakerType: "student", speaker: studentName(seed, 5), text: `有${city}飞的uu吗，可以一起蹲票` },
      { speakerType: "student", speaker: studentName(seed, 6), text: "同蹲！！看到便宜的能不能喊一声" },
      { speakerType: "senior", speaker: "学姐号", text: "买之前把行李额度截个图存着，后面机场扯皮会省事很多。" },
      { speakerType: "student", speaker: studentName(seed, 7), text: "好嘟 那我先不急着下单，再看两天" },
    ];
  }

  if (moduleId === "secondhand") {
    return [
      { speakerType: "student", speaker: studentName(seed, 0), text: `有人最近在看${topic}吗，价格差得好离谱` },
      { speakerType: "student", speaker: studentName(seed, 1), text: "我也在看，怕买贵也怕踩雷" },
      { speakerType: "senior", speaker: "学姐号", text: "大家可以多刷点平台做对比，瞅瞅价格浮动，别急着下手。" },
      { speakerType: "student", speaker: studentName(seed, 2), text: "有些写九成新但图糊得啥也看不出来" },
      { speakerType: "student", speaker: studentName(seed, 3), text: "这种我会让他补细节图，不补就算了" },
      { speakerType: "student", speaker: studentName(seed, 4), text: "取货地点也很重要。。太远真的搬不动" },
      { speakerType: "student", speaker: studentName(seed, 5), text: "小家电是不是最好当场试一下啊" },
      { speakerType: "senior", speaker: "学姐号", text: "对，能当场看就当场看，尺寸、取货时间、能不能用先问清楚。" },
      { speakerType: "student", speaker: studentName(seed, 6), text: "那我不秒了，先蹲蹲" },
      { speakerType: "student", speaker: studentName(seed, 7), text: "有靠谱的甩群里！我也想收" },
    ];
  }

  if (moduleId === "college") {
    return [
      { speakerType: "student", speaker: studentName(seed, 0), text: `有同专业在看${topic}吗，我有点没看懂` },
      { speakerType: "student", speaker: studentName(seed, 1), text: "我也。。系统里东西好多" },
      { speakerType: "student", speaker: studentName(seed, 2), text: "reading list 现在要买吗 还是开学再说" },
      { speakerType: "senior", speaker: "学姐号", text: "先别一口气买太多，等课表和老师要求更清楚再定也行。" },
      { speakerType: "student", speaker: studentName(seed, 3), text: "有没有同专业的uu 拉个小群吧" },
      { speakerType: "student", speaker: studentName(seed, 4), text: "蹲一个，我也想找组织" },
      { speakerType: "student", speaker: studentName(seed, 5), text: "选课页面是现在就能进了吗" },
      { speakerType: "student", speaker: studentName(seed, 6), text: "我只能看到一部分，不知道是不是还没开" },
      { speakerType: "senior", speaker: "学姐号", text: "看到不确定的页面可以截图问，别发个人信息，大家一起对一下就行。" },
      { speakerType: "student", speaker: studentName(seed, 7), text: "好嘟 同专业的冒个泡！！" },
    ];
  }

  if (moduleId === "language") {
    return [
      { speakerType: "student", speaker: studentName(seed, 0), text: `语言班有人在看${topic}吗，我还没定下来` },
      { speakerType: "student", speaker: studentName(seed, 1), text: "我主要怕住宿中间断掉。。" },
      { speakerType: "student", speaker: studentName(seed, 2), text: "有没有人找口语搭子啊，提前练练也行" },
      { speakerType: "senior", speaker: "学姐号", text: "找室友/搭子可以把时间、预算、想住区域说具体点，会更容易对上。" },
      { speakerType: "student", speaker: studentName(seed, 3), text: "我晚上比较稳，可以一起练" },
      { speakerType: "student", speaker: studentName(seed, 4), text: "语言班住宿现在找还来得及吗" },
      { speakerType: "student", speaker: studentName(seed, 5), text: "我看还有人在找，应该不算太晚吧" },
      { speakerType: "student", speaker: studentName(seed, 6), text: "有人是先短租再搬正课宿舍的吗" },
      { speakerType: "senior", speaker: "学姐号", text: "可以先把入住和退房日期对齐，别只看价格，衔接不上会很麻烦。" },
      { speakerType: "student", speaker: studentName(seed, 7), text: "懂了 我先把日期整理出来" },
    ];
  }

  if (moduleId === "ai-safety") {
    return [
      { speakerType: "student", speaker: studentName(seed, 0), text: `有人最近遇到${topic}这种情况吗，我现在有点慌` },
      { speakerType: "student", speaker: studentName(seed, 1), text: "我也想问这个，不知道是不是已经算正式指控" },
      { speakerType: "student", speaker: studentName(seed, 2), text: "邮件里几个词看得我头大，怕理解错" },
      { speakerType: "senior", speaker: "学姐号", text: "先别自己吓自己，先看邮件写的是 possible、investigation、meeting 还是 hearing，阶段不一样。" },
      { speakerType: "student", speaker: studentName(seed, 3), text: "那现在要不要先写解释啊" },
      { speakerType: "student", speaker: studentName(seed, 4), text: "我怕说多了反而不好" },
      { speakerType: "student", speaker: studentName(seed, 5), text: "有没有人知道先整理什么材料" },
      { speakerType: "student", speaker: studentName(seed, 6), text: "不用发隐私，我就想知道大概流程" },
      { speakerType: "senior", speaker: "学姐号", text: "先把邮件、deadline、brief、草稿版本、reference 记录放一起。别求降AI，也别复制别人的解释模板。" },
      { speakerType: "student", speaker: studentName(seed, 7), text: "好 我先把材料整理出来再说" },
    ];
  }

  return [
    { speakerType: "student", speaker: studentName(seed, 0), text: `有人最近在弄${topic}吗，我看得有点乱` },
    { speakerType: "student", speaker: studentName(seed, 1), text: "我也想问这个。。" },
    { speakerType: "student", speaker: studentName(seed, 2), text: `主要怕漏了${schoolName}的时间点` },
    { speakerType: "senior", speaker: "学姐号", text: "可以先把自己看到的邮件/页面放一起看，别只听一个人的说法。" },
    { speakerType: "student", speaker: studentName(seed, 3), text: "有没有已经弄完的，说下大概流程就行" },
    { speakerType: "student", speaker: studentName(seed, 4), text: "不用发隐私，我就想知道在哪个页面" },
    { speakerType: "student", speaker: studentName(seed, 5), text: "我邮件太多了真的怕看漏" },
    { speakerType: "student", speaker: studentName(seed, 6), text: "同问，我现在也没弄明白这一步" },
    { speakerType: "senior", speaker: "学姐号", text: "账号、押金、合同这种还是看自己页面，群里可以先对一下大概方向。" },
    { speakerType: "student", speaker: studentName(seed, 7), text: "好 我先去翻邮件" },
  ];
}

function buildFallbackDialogue({ school, moduleId, moduleName, timeNode, angle, index, evidence, historicalDialogues, publishedKeySet }) {
  const seed = publishedKeySet.size + index;
  const turns = buildFallbackTurns({ moduleId, angle, school, seed });
  const copyText = copyFromTurns(turns);

  return normalizeDialogue(
    {
      id: `fallback-dialogue-${Date.now()}-${index}`,
      title: `${moduleName}热聊：${compactTitle(angle) || compactTitle(timeNode)}`,
      angle,
      summary: `围绕 ${compactTitle(angle || timeNode)} 生成的群内模拟对话。`,
      copyText,
      turns,
      followUps: [
        "同情况的也说下你们看到的信息吧。",
        "有已经弄完的可以简单讲下流程吗？",
      ],
      sourceNote: getSourceNote(evidence, historicalDialogues, true),
    },
    index,
    publishedKeySet
  );
}

function normalizeModelDialogues(parsed) {
  if (Array.isArray(parsed?.dialogues)) {
    return parsed.dialogues;
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  return parsed ? [parsed] : [];
}

async function generateModelDialogues({ openai, model, prompt, dialogueCount }) {
  const controller = new AbortController();
  const timeoutMs = 55000;
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("model_timeout_55s"));
    }, timeoutMs);
  });
  const request = openai.chat.completions.create(
    {
      model,
      temperature: dialogueCount === 1 ? 0.55 : 0.5,
      max_tokens: dialogueCount === 1 ? 1100 : 2400,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    },
    { signal: controller.signal, timeout: timeoutMs }
  );
  let completion;
  try {
    completion = await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }

  return normalizeModelDialogues(JSON.parse(completion.choices[0].message.content));
}

function getModelConfig() {
  const deepseekKey = Netlify.env.get("DEEPSEEK_API_KEY");
  const deepseekBaseURL = Netlify.env.get("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";
  const deepseekModel = Netlify.env.get("DEEPSEEK_MODEL") || "deepseek-chat";

  if (deepseekKey) {
    return {
      provider: "DeepSeek",
      apiKey: deepseekKey,
      baseURL: deepseekBaseURL,
      model: deepseekModel,
    };
  }

  const necoKey = Netlify.env.get("NECO_API_KEY");
  const necoBaseURL = Netlify.env.get("NECO_BASE_URL");
  const necoModel = Netlify.env.get("NECO_MODEL") || "gpt-5.4-openai-compact";

  if (necoKey && necoBaseURL) {
    return {
      provider: "Neco",
      apiKey: necoKey,
      baseURL: necoBaseURL,
      model: necoModel,
    };
  }

  return null;
}

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await req.json();
  const {
    school,
    country,
    moduleId,
    moduleName,
    activity,
    timeNode,
    recentDiscussion,
    publishedDialogues = [],
  } = body;

  const modelConfig = getModelConfig();

  const hasRecentDiscussion = Boolean(recentDiscussion?.trim());
  const dialogueCount = hasRecentDiscussion ? 1 : 3;
  const question = `${moduleName} ${timeNode} ${recentDiscussion || ""}`;
  const evidence = compactEvidence(searchKnowledge({ school, moduleId, question }));
  const historicalDialogues = searchHistoricalDialogues({ school, moduleId, question, limit: 4 }).map((item) => ({
    id: item.id,
    sourceType: item.sourceType,
    sourceTitle: item.sourceTitle,
    moduleId: item.moduleId,
    text: item.text.slice(0, 360),
    score: item.score,
  }));
  const publishedKeySet = new Set(
    publishedDialogues
      .map((item) => item.key || normalizeDialogueKey(item.copyText || copyFromTurns(item.turns || [])))
      .filter(Boolean)
  );
  const publishedSamples = publishedDialogues
    .slice(-8)
    .map((item, index) => `${index + 1}. ${item.title || "已发布对话"}\n${(item.copyText || "").slice(0, 520)}`)
    .join("\n\n");

  const angles = hasRecentDiscussion ? [recentDiscussion.trim()] : buildAutoAngles(moduleId, timeNode).slice(0, 3);
  const styleSamples = getStyleSamples(historicalDialogues);
  const baseContext = `
学校：${school}
国家/地区：${country}
群类型：${moduleName}
群活跃度：${activity}
时间节点：${timeNode}
资料依据：
${evidence.map((item, index) => `${index + 1}.【${item.sourceType}】${item.sourceTitle}：${item.text}`).join("\n")}

真实聊天片段参考：
${historicalDialogues.map((item, index) => `${index + 1}. ${item.text}`).join("\n")}

当前模块已发布过的对话，生成时要避开一模一样：
${publishedSamples || "暂无"}

真实聊天记录里的短句语气样本，生成时优先模仿这种颗粒度和口气：
${styleSamples.map((sample, index) => `${index + 1}. ${sample}`).join("\n")}
`;
  const aiSafetyRules =
    moduleId === "ai-safety"
      ? `

AI 安全模块额外资料与边界：
- 可生成的群聊方向：AI指控邮件、possible/suspected academic misconduct、Teams/meeting/hearing、reference/citation出错、AI率焦虑、course AI policy、写作过程证据链、lecture到outline的学习流程。
- 安全边界：不写降AI、不写改到0、不写规避检测、不承诺撤控/无处罚/申诉成功、不鼓励打死不认或糊弄老师。
- 允许表达：先看邮件阶段、保存deadline、brief、rubric、草稿版本、reference记录；核验文献真实性；按课程AI policy判断；必要时人工复核。
- 学姐号语气要短：例如“先别自己吓自己”“别急着写一大段解释”“先把邮件关键词圈出来”“reference先逐条核验”。
`
      : "";
  const prompt = `
你是留学生微信群运营助手。请基于资料生成 ${dialogueCount} 段可直接复制到微信群里的真实模拟对话。

${baseContext}
${aiSafetyRules}

本次要覆盖的角度：
${angles.map((angle, index) => `${index + 1}. ${angle}`).join("\n")}

输出 JSON，格式必须是：
{
  "dialogues": [
    {
      "title": "这段群聊的标题",
      "angle": "对应角度",
      "summary": "一句话说明这段对话围绕什么",
      "copyText": "把 turns 合并成可复制文本，每行格式为：昵称：内容",
      "turns": [
        { "speakerType": "student", "speaker": "新生A", "text": "..." }
      ],
      "followUps": ["后续可继续发的一句话", "备用追问"],
      "sourceNote": "本次主要参考了哪些资料"
    }
  ]
}

硬性要求：
1. dialogues 数量必须是 ${dialogueCount}。
2. 每段 turns 固定 10 条。
3. 每段学姐正好 2 条，新生正好 8 条。speakerType 只能是 "senior" 或 "student"。
4. 学姐名字固定用“学姐号”，只轻轻补充或提醒，不要抢话，不要总结式长段。
5. 其余昵称可以用“姐妹 / uu / 同学A / 同学B / 群友 / 新生”，不要机械轮流。
6. 每条尽量短，像微信群，不要公告腔；允许半句话、追问、口语、省略号，但不要乱加表情包。
7. 如果资料里没有明确答案，要自然说“没看到明确写”“要看具体页面/邮件/合同”，不要编造。
8. 禁止使用：根据资料显示、大家可以同步下进度、多关注学校系统和邮件、最卡的是、卡在哪、卡在、建议大家、大家现在更想确认。
9. 可用真实群聊语气：我也想知道、有人看过吗、我刚刷到、别急着下手、瞅瞅价格浮动、同情况的说下、好嘟、蹲、救救、姐妹这个咋查呀。
10. 不要和已发布对话一字不差；可以换出发城市、时间、问法或聊天路径。
11. 如果员工输入了最近群内讨论，必须紧贴这个问题；例如问“行李怎么收”，就围绕行李箱、托运/随身、航司额度、落地买什么展开，不要跳到押金/CAS。
12. 当前群模块只决定发布场景，不限制资料来源；校友群问行李，也可以参考飞友群/行李资料。
13. 禁止输出资料处理痕迹：OCR整理、截图、已匿名化、成员A、R整理、可检索标签。
14. 只输出 JSON，不要解释。

质量标准：
- 读起来要像学生在群里顺手发的，不像客服、不像公告、不像小红书笔记。
- 不要每句都完整解释背景；真实群聊会有断句、追问、同问、短回复。
- 学姐账号只做轻提醒，比如“可以多刷几个平台对比”“别急着下手”“先看合同/页面”，不要长篇总结。
- 如果员工输入了最近群内讨论，必须紧贴这个问题，不要跳到别的话题。

不同群类型参考：
- 飞友群：机票、航线、落地时间、行李、接机、价格浮动。
- 二手群：价格、成色、取货、尺寸、别急着下手。
- 各学院群：选课、专业、reading list、同专业互认。
- 语言班：室友、住宿衔接、口语搭子、到校时间。
- 校友群：CAS、offer、押金、住宿、注册、入学准备。
- AI 安全：学术诚信、AI指控、reference/citation、meeting/hearing、AI率焦虑、学习流程和证据链整理。
`;

  let rawDialogues = [];
  let fallbackUsed = false;
  let fallbackReason = "";

  if (modelConfig) {
    try {
      const openai = new OpenAI({
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        timeout: 60000,
      });

      rawDialogues = await generateModelDialogues({ openai, model: modelConfig.model, prompt, dialogueCount });
    } catch (error) {
      fallbackUsed = true;
      fallbackReason = error?.message || "model_timeout";
      console.warn("generate-dialogue model failed, using fallback:", fallbackReason);
    }
  } else {
    fallbackUsed = true;
    fallbackReason = "missing_model_env";
  }

  if (!rawDialogues.length) {
    fallbackUsed = true;
    fallbackReason = fallbackReason || "model_empty_response";
    rawDialogues = angles.map((angle, index) =>
      buildFallbackDialogue({
        school,
        moduleId,
        moduleName,
        timeNode,
        angle,
        index,
        evidence,
        historicalDialogues,
        publishedKeySet,
      })
    );
  }

  let dialogues = rawDialogues
    .map((dialogue, index) => normalizeDialogue(dialogue, index, publishedKeySet))
    .filter((dialogue) => dialogue.key && !publishedKeySet.has(dialogue.key))
    .slice(0, dialogueCount);

  if (dialogues.length < dialogueCount) {
    const existingKeys = new Set([...publishedKeySet, ...dialogues.map((dialogue) => dialogue.key)]);
    const fallbackDialogues = angles
      .map((angle, index) =>
        buildFallbackDialogue({
          school,
          moduleId,
          moduleName,
          timeNode,
          angle: `${angle} ${dialogues.length + index + 1}`,
          index: index + rawDialogues.length,
          evidence,
          historicalDialogues,
          publishedKeySet: existingKeys,
        })
      )
      .filter((dialogue) => dialogue.key && !existingKeys.has(dialogue.key));

    dialogues = [...dialogues, ...fallbackDialogues].slice(0, dialogueCount);
  }

  const firstDialogue = dialogues[0] || normalizeDialogue({}, 0, publishedKeySet);

  return Response.json({
    dialogues,
    historyDialogues: historicalDialogues,
    fallbackUsed,
    fallbackReason,
    title: firstDialogue.title || `${school}${timeNode} ${moduleName}模拟对话`,
    summary: firstDialogue.summary,
    copyText: firstDialogue.copyText,
    turns: firstDialogue.turns,
    followUps: firstDialogue.followUps,
    sourceNote: firstDialogue.sourceNote,
    evidence: evidence.map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      sourceTitle: item.sourceTitle,
      text: item.text.slice(0, 220),
      score: item.score,
    })),
    createdAt: new Date().toISOString(),
    provider: modelConfig?.provider || "Local",
  });
};

export const config = {
  path: "/api/generate-dialogue",
  method: "POST",
};
