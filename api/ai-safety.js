import OpenAI from "openai";
import { generateLocalAISafetyResponse } from "../src/lib/aiSafetyEngine.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const REQUEST_TIMEOUT_MS = 50000;

function sanitizeBody(body = {}) {
  return {
    school: String(body.school || "").trim(),
    country: String(body.country || "").trim(),
    groupType: String(body.groupType || "").trim(),
    timeNode: String(body.timeNode || "").trim(),
    studentQuestion: String(body.studentQuestion || "").trim(),
    riskType: String(body.riskType || "学术诚信").trim(),
    recentDiscussion: String(body.recentDiscussion || "").trim(),
  };
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function insertSafetyRecord(input, output, source) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ai_safety_records`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        school: input.school,
        country: input.country,
        group_type: input.groupType,
        time_node: input.timeNode,
        risk_type: input.riskType,
        student_question: input.studentQuestion,
        recent_discussion: input.recentDiscussion,
        risk_judgement: output.riskJudgement,
        not_suitable_to_say: output.notSuitableToSay,
        senior_reply: output.seniorReply,
        peer_reply: output.peerReply,
        group_opening: output.groupOpening,
        follow_up: output.followUp,
        safety_reminder: output.safetyReminder,
        need_official_confirmation: output.needOfficialConfirmation,
        source,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    console.warn("ai_safety_records insert skipped:", error.message);
  } finally {
    clearTimeout(timeout);
  }
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("ai_safety_timeout")), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function parseModelJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = String(content || "").match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function generateWithDeepSeek(input, localDraft) {
  if (!DEEPSEEK_API_KEY) {
    return null;
  }

  const openai = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const prompt = `
你是留学生微信群运营的 AI 安全助手。请基于输入，生成可以给员工直接复制的安全话术。

学校：${input.school}
国家/地区：${input.country}
群类型：${input.groupType}
时间节点：${input.timeNode}
风险类型：${input.riskType}
学生问题：${input.studentQuestion}
最近群内讨论：${input.recentDiscussion}

本地安全草稿：
${JSON.stringify(localDraft, null, 2)}

必须输出 JSON：
{
  "riskJudgement": "风险判断",
  "notSuitableToSay": "不适合在群里说的话",
  "seniorReply": "学姐口吻回复",
  "peerReply": "同届学生口吻回复",
  "groupOpening": "适合微信群话题开场",
  "followUp": "延展追问",
  "safetyReminder": "安全提醒",
  "needOfficialConfirmation": "是/否/建议确认",
  "sourceNote": "一句依据说明"
}

硬性边界：
1. 禁止提供绕过 AI 检测、降低 AI 率、代写、帮写、作弊、规避 Turnitin、伪造引用的方法。
2. 如果用户问的是上述内容，只能礼貌拒绝操作方法，并引导看课程说明、学校邮件、学院官方渠道。
3. 语气像微信群真人，短句，清楚，不官方，不恐吓。
4. 学姐回复要简单明了，不要长篇公告，不要“根据资料显示”。
5. 同届回复要像学生自己在群里说的，允许“我也有点拿不准”“先看 handbook”。
6. 不要输出 JSON 之外的解释。
`;

  const completion = await withTimeout(
    openai.chat.completions.create({
      model: DEEPSEEK_MODEL,
      temperature: 0.35,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    REQUEST_TIMEOUT_MS
  );

  return parseModelJson(completion.choices?.[0]?.message?.content);
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const input = sanitizeBody(req.body);
  const localDraft = generateLocalAISafetyResponse(input);
  let output = localDraft;
  let source = "local";

  try {
    const modelOutput = await generateWithDeepSeek(input, localDraft);
    if (modelOutput) {
      output = { ...localDraft, ...modelOutput };
      source = "deepseek";
    }
  } catch (error) {
    console.warn("ai-safety model fallback:", error.message);
  }

  await insertSafetyRecord(input, output, source);

  res.status(200).json({
    ...output,
    source,
    createdAt: new Date().toISOString(),
  });
}
