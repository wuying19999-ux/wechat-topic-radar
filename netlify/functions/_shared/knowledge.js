import { generatedKnowledgeChunks } from "./knowledge.generated.js";
export const knowledgeChunks = [
  ...generatedKnowledgeChunks,
  {
    school: "UCL",
    moduleId: "alumni",
    sourceType: "聊天记录沉淀库",
    sourceTitle: "UCL大学聊天记录沉淀库-上传版.docx",
    text: "UCL 5-6月群里经常有人问住宿、CAS、押金、语言班衔接、到校时间。群里真实语气通常是：有人收到吗、我也想知道、官网没写的话先别默认有。"
  },
  {
    school: "UCL",
    moduleId: "alumni",
    sourceType: "上传资料",
    sourceTitle: "UCL新生手册2026.docx",
    text: "住宿、公寓、押金、pre-enrolment、学生账号等信息应以学校邮件、Portico、住宿官网或合同为准。"
  }
];

const keywordPool = [
  "住宿",
  "宿舍",
  "公寓",
  "早餐",
  "押金",
  "cas",
  "offer",
  "语言班",
  "pre-sessional",
  "合同",
  "机票",
  "航班",
  "行李",
  "接机",
  "落地",
  "转机",
  "机场",
  "二手",
  "床垫",
  "小家电",
  "显示器",
  "价格",
  "选课",
  "课程",
  "专业",
  "学院",
  "导师",
  "reading",
  "邮箱",
  "邮件",
  "签证",
  "visa",
  "室友",
  "租房",
  "uber",
  "地铁",
  "公交",
  "注册",
  "enrolment",
  "campus",
  "card",
];

const moduleKeywords = {
  alumni: ["offer", "cas", "押金", "住宿", "注册", "入学", "邮件", "学生卡"],
  flight: ["机票", "航班", "飞", "行李", "落地", "接机", "转机", "机场", "uber"],
  secondhand: ["二手", "价格", "床垫", "小家电", "显示器", "取货", "成色", "搬家"],
  college: ["学院", "专业", "选课", "课程", "导师", "reading", "module", "enrolment"],
  language: ["语言班", "pre-sessional", "室友", "住宿", "口语", "搭子", "签到"],
};

function scoreText(text, query, moduleId) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const terms = [...keywordPool, ...(moduleKeywords[moduleId] || [])];

  return terms.filter((word) => {
    const lowerWord = word.toLowerCase();
    return lowerQuery.includes(lowerWord) && lowerText.includes(lowerWord);
  }).length;
}

export function searchKnowledge({ school, moduleId, question }) {
  const q = question.toLowerCase();

  return knowledgeChunks
    .filter((item) => item.school === school && (item.moduleId === moduleId || item.moduleId === "alumni"))
    .map((item) => {
      const text = item.text.toLowerCase();
      const score = scoreText(item.text, q, moduleId) + (text.includes(moduleId.toLowerCase()) ? 0.5 : 0);

      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function searchHistoricalDialogues({ school, moduleId, question, limit = 8 }) {
  const query = `${question || ""} ${(moduleKeywords[moduleId] || []).join(" ")}`;

  return knowledgeChunks
    .filter((item) => item.school === school && item.sourceType?.includes("聊天记录"))
    .map((item) => {
      const moduleBoost = item.moduleId === moduleId ? 2 : item.moduleId === "alumni" ? 0.5 : 0;
      return {
        ...item,
        score: scoreText(item.text, query, moduleId) + moduleBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
