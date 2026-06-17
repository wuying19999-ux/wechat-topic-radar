export const aiSafetyRiskTypes = [
  "AI 指控",
  "Turnitin / 相似度",
  "学术诚信",
  "作业使用 AI",
  "论文引用与改写",
  "课堂/考试纪律",
  "邮件申诉与沟通",
  "其他",
];

const unsafePatterns = [
  "降重",
  "降低ai率",
  "降低 ai 率",
  "绕过",
  "过检测",
  "代写",
  "枪手",
  "帮写",
  "润到看不出来",
  "躲turnitin",
  "躲 turnitin",
  "改到查不出",
];

function hasUnsafeIntent(text = "") {
  const normalized = text.toLowerCase().replace(/\s+/g, "");
  return unsafePatterns.some((pattern) => normalized.includes(pattern.replace(/\s+/g, "")));
}

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function getRiskJudgement({ riskType, studentQuestion }) {
  if (hasUnsafeIntent(studentQuestion)) {
    return "高风险：问题里涉及规避检测、代写或降低 AI 痕迹，这类内容不能在群里提供操作方法。";
  }

  if (riskType.includes("指控") || riskType.includes("申诉")) {
    return "中高风险：涉及学校正式流程，群里只能做情绪安抚和路径提醒，具体判断要看学校邮件、课程要求和学院说明。";
  }

  if (riskType.includes("Turnitin") || riskType.includes("相似度")) {
    return "中风险：可以提醒大家看课程说明和引用规范，但不能讨论怎么躲检测或改到查不出。";
  }

  if (riskType.includes("课堂") || riskType.includes("考试")) {
    return "高风险：课堂和考试纪律通常边界更严，群里不要替学校下结论。";
  }

  return "中风险：适合做合规提醒和官方信息核对，不适合给确定承诺。";
}

function buildUnsafeLine({ riskType }) {
  if (riskType.includes("Turnitin") || riskType.includes("相似度")) {
    return "不要在群里问“怎么降 AI 率 / 怎么过 Turnitin / 怎么改到查不出”。";
  }

  if (riskType.includes("作业") || riskType.includes("学术诚信")) {
    return "不要在群里让别人帮写、代写，也不要公开要作业答案。";
  }

  if (riskType.includes("指控") || riskType.includes("申诉")) {
    return "不要直接把完整指控邮件、学生号、导师信息或申诉材料截图发群里。";
  }

  return "不要发隐私信息，也不要把群聊变成规避学校规则的讨论。";
}

export function generateLocalAISafetyResponse({
  school = "当前学校",
  country = "",
  groupType = "校友群",
  timeNode = "",
  studentQuestion = "",
  riskType = "学术诚信",
  recentDiscussion = "",
} = {}) {
  const topic = clean(studentQuestion || recentDiscussion, "有人问 AI / 学术诚信相关问题");
  const judgement = getRiskJudgement({ riskType, studentQuestion: `${studentQuestion} ${recentDiscussion}` });
  const unsafeLine = buildUnsafeLine({ riskType });
  const needsOfficial = ["AI 指控", "Turnitin / 相似度", "课堂/考试纪律", "邮件申诉与沟通"].includes(riskType);
  const officialHint = needsOfficial ? "需要看学校/学院官方要求" : "最好再核对课程说明";

  return {
    riskJudgement: judgement,
    notSuitableToSay: unsafeLine,
    seniorReply:
      hasUnsafeIntent(topic)
        ? "这个不建议在群里聊操作方法，容易把方向带偏。先看课程说明或学校邮件，真遇到指控就按学校流程处理，别把隐私材料发群里。"
        : `这个先别在群里下结论，${officialHint}。如果只是想确认边界，可以把课程说明里相关那几句拿出来问，别发个人信息。`,
    peerReply:
      hasUnsafeIntent(topic)
        ? "这个我不敢在群里问细节，感觉风险挺高的。我准备先看 handbook/邮件，必要的话直接问学院。"
        : "我也有点拿不准，先看课程说明吧。群里可以互相对一下关键词，但别发完整作业或个人信息。",
    groupOpening: `${groupType}里可以这样起：有人看过 ${school} 课程说明里关于 AI / academic integrity 的要求吗？我想先确认哪些能用、哪些不能碰。`,
    followUp: "有没有同学在 handbook 或邮件里看到明确写法？可以只发关键词，不用发个人信息。",
    safetyReminder:
      "群内只做信息核对和经验提醒，不承诺结果；涉及指控、申诉、考试纪律、课程评分时，必须回到学校官方说明或让学生联系学院。",
    needOfficialConfirmation: needsOfficial ? "是" : "建议确认",
    sourceNote: `${school} · ${country} · ${timeNode} · ${riskType}`,
  };
}
