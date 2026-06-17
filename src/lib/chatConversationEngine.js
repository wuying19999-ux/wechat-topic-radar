import { chatConversationCorpus, defaultChatVoiceAnchors } from "../data/chatConversationCorpus";

const CHINESE_MONTHS = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
};

const intentMatchers = [
  { intent: "flight", keywords: ["飞", "航班", "机票", "机场", "接机", "拼车", "行李", "落地"] },
  { intent: "language", keywords: ["语言", "雅思", "pte", "小分", "写作", "口语", "pre-sessional"] },
  { intent: "secondhand", keywords: ["二手", "预算", "锅", "床品", "小家电", "买", "卖", "生活费", "租房", "宿舍", "公寓", "house", "studio"] },
  { intent: "college", keywords: ["学院", "专业", "选课", "课表", "课程", "注册", "论文", "module", "作业"] },
  { intent: "alumni", keywords: ["offer", "cas", "签证", "con", "uncon", "押金", "存款", "提交", "入学"] },
];

function normalize(text = "") {
  return text.toString().trim().replace(/\s+/g, "").toLowerCase();
}

function uniq(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function normalizeMonth(month) {
  if (!month) {
    return "";
  }

  const numericMatch = month.toString().match(/(\d{1,2})/);
  if (numericMatch) {
    return `${Number(numericMatch[1])}月`;
  }

  const clean = month.toString().replace(/月份|月/g, "");
  return CHINESE_MONTHS[clean] ? `${CHINESE_MONTHS[clean]}月` : "";
}

export function extractMonthFromText(text = "") {
  const numeric = text.match(/(\d{1,2})\s*月/);
  if (numeric) {
    return normalizeMonth(numeric[1]);
  }

  const chinese = text.match(/(十一|十二|十|一|二|三|四|五|六|七|八|九)月/);
  if (chinese) {
    return normalizeMonth(chinese[1]);
  }

  const englishMonthMap = [
    ["january", "1月"],
    ["february", "2月"],
    ["march", "3月"],
    ["april", "4月"],
    ["may", "5月"],
    ["june", "6月"],
    ["july", "7月"],
    ["august", "8月"],
    ["september", "9月"],
    ["october", "10月"],
    ["november", "11月"],
    ["december", "12月"],
  ];
  const lower = text.toLowerCase();
  return englishMonthMap.find(([label]) => lower.includes(label))?.[1] || "";
}

export function findSchoolProfileByPrompt(prompt = "", selectedSchool = "") {
  const normalizedPrompt = normalize(prompt);
  const normalizedSelected = normalize(selectedSchool);

  return (
    chatConversationCorpus.find((profile) =>
      profile.aliases.some((alias) => normalizedPrompt.includes(normalize(alias)))
    ) ||
    chatConversationCorpus.find((profile) =>
      [profile.school, ...profile.aliases].some((alias) => normalize(alias) === normalizedSelected)
    ) ||
    chatConversationCorpus[0]
  );
}

export function detectIntent(text = "") {
  const normalizedText = text.toLowerCase();
  return (
    intentMatchers.find((matcher) =>
      matcher.keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()))
    )?.intent || ""
  );
}

function scoreRecord(record, { month, intent, prompt }) {
  let score = 0;
  const normalizedPrompt = normalize(prompt);

  if (month && record.months.includes(month)) {
    score += 8;
  }
  if (intent && record.moduleIds.includes(intent)) {
    score += 4;
  }
  record.keywords.forEach((keyword) => {
    if (normalizedPrompt.includes(normalize(keyword))) {
      score += 2;
    }
  });

  return score;
}

function pickRecords(profile, { month, intent, prompt }) {
  const scored = profile.records
    .map((record) => ({
      record,
      score: scoreRecord(record, { month, intent, prompt }),
    }))
    .sort((a, b) => b.score - a.score);

  const exactMonth = month ? scored.filter((item) => item.record.months.includes(month)) : [];
  const pool = exactMonth.length ? exactMonth : scored;
  return pool.slice(0, 3).map((item) => item.record);
}

function createGenericTurns(profile, records, prompt) {
  const primary = records[0];
  const topic = primary.hotTopics[0] || primary.category;
  const secondaryTopic = primary.hotTopics[1] || primary.keywords[0] || "时间节点";
  const anchor = primary.voiceAnchors[0] || defaultChatVoiceAnchors[0];
  const promptTail = prompt ? `我刚输入的是“${prompt}”` : "我想先起个话题";

  return [
    { speaker: "同学A", text: `${anchor}，${topic}现在是不是要开始处理了？` },
    { speaker: "同学B", text: `我也在看这个，${secondaryTopic}还没完全弄清楚，信息有点散。` },
    {
      speaker: "学姐",
      text: `${profile.school}${primary.months.join("/")}沉淀里，这类问题通常不是一句话解决，大家会先把自己的状态发出来再互相对。可以先问清：时间、材料状态、预算和想住/想飞的方案。`,
    },
    { speaker: "同学C", text: `那我是不是可以先发个接龙？比如我现在是${primary.keywords.slice(0, 3).join(" / ")}这几个点不确定。` },
    {
      speaker: "同学B",
      text: "可以，我感觉接龙比单独问更容易有人回，而且同情况的人会自己冒出来。",
    },
    {
      speaker: "学姐",
      text: `可以这样发：${promptTail}，想对一下${primary.hotTopics.slice(0, 2).join("、")}。有同进度的同学可以直接接在后面，具体节点还是以学校邮件/官网为准。`,
    },
    { speaker: "同学A", text: "好，我先这样发。顺便蹲一下真实经验，模板信息看多了反而更晕。" },
  ];
}

function buildTopicIdeas(records) {
  return records.flatMap((record) =>
    record.hotTopics.slice(0, 3).map((topic, index) => ({
      title: topic,
      source: `${record.dateLabel} · ${record.category}`,
      chase:
        index === 0
          ? `你们现在最想先确认${record.keywords.slice(0, 3).join("、")}里的哪一个？`
          : `有没有同样情况的同学愿意说下自己的进度？`,
    }))
  ).slice(0, 6);
}

export function generateChatConversation({ prompt = "", selectedSchool = "", selectedTimeNode = "" } = {}) {
  const profile = findSchoolProfileByPrompt(prompt, selectedSchool);
  const month = extractMonthFromText(prompt) || extractMonthFromText(selectedTimeNode) || profile.records[0]?.months[0] || "6月";
  const intent = detectIntent(prompt);
  const records = pickRecords(profile, { month, intent, prompt });
  const primary = records[0];
  const turns = primary.turns || createGenericTurns(profile, records, prompt);
  const hotTopics = uniq(records.flatMap((record) => record.hotTopics)).slice(0, 8);
  const keywords = uniq(records.flatMap((record) => record.keywords)).slice(0, 12);
  const voiceAnchors = uniq(records.flatMap((record) => record.voiceAnchors || [])).slice(0, 8);

  return {
    prompt,
    school: profile.school,
    month,
    intent: intent || "综合",
    title: primary.conversationTitle || `${profile.school}${month}群聊来回生成`,
    summary: `${profile.school}${month}可优先围绕「${hotTopics.slice(0, 3).join(" / ")}」开话题，语气保持短句、求助、同步进度，像群里正常聊天一样。`,
    hotTopics,
    keywords,
    voiceAnchors,
    topicIdeas: buildTopicIdeas(records),
    conversations: [
      {
        id: `${primary.id}-main`,
        title: primary.conversationTitle || primary.category,
        turns,
      },
    ],
    evidence: records.map((record) => ({
      id: record.id,
      source: profile.docSource,
      dateLabel: record.dateLabel,
      category: record.category,
      emotion: record.emotion,
      note: record.evidence,
    })),
    createdAt: new Date().toISOString(),
  };
}

export function findChatInsight({ school = "", timeNode = "", moduleId = "", question = "" } = {}) {
  const profile = findSchoolProfileByPrompt(question, school);
  const month = extractMonthFromText(question) || extractMonthFromText(timeNode);
  const intent = detectIntent(question) || moduleId;
  const records = pickRecords(profile, { month, intent, prompt: question || `${school} ${timeNode}` });
  const record = records.find((item) => !moduleId || item.moduleIds.includes(moduleId)) || records[0];

  if (!record) {
    return null;
  }

  return {
    school: profile.school,
    month: month || record.months[0],
    source: profile.docSource,
    category: record.category,
    emotion: record.emotion,
    hotTopics: record.hotTopics,
    keywords: record.keywords,
    voiceAnchors: record.voiceAnchors || [],
    evidence: record.evidence,
  };
}
