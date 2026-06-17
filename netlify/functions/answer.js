import OpenAI from "openai";
import { searchKnowledge } from "./_shared/knowledge.js";

function buildFallbackAnswer({ question, evidence }) {
  const hasEvidence = evidence.length > 0;
  const evidenceHint = hasEvidence ? evidence[0].text.slice(0, 80) : "";

  if (/早餐|早饭|包餐|meal|catered/i.test(question || "")) {
    return {
      seniorCopy: "我这边资料里没看到明确写免费早餐，最好按具体公寓官网或合同确认一下。",
      peerCopy: "我也没看到明确写包早餐，感觉还是得看自己订的公寓页面/合同，有看到的同学可以发一下。",
      followUp: "有同学订的公寓页面写了包早餐吗？可以丢个截图看看。",
      riskNote: "资料里没有明确早餐信息，需按具体公寓官网或合同核实。",
    };
  }

  if (/机票|航班|飞|出发/i.test(question || "")) {
    return {
      seniorCopy: "大家可以多刷点平台做对比，瞅瞅价格浮动，顺手看下退改和行李额。",
      peerCopy: "我也还在看票，准备多对比几个平台，不想太早下手但也怕后面涨。",
      followUp: "大家现在主要看哪个出发城市？有看到合适价格的可以互相喊一下。",
      riskNote: "机票价格和规则变化快，以购票平台和航司页面为准。",
    };
  }

  if (/CAS|签证|visa/i.test(question || "")) {
    return {
      seniorCopy: "别太慌，先看自己邮件和系统里现在到哪一步，有同情况的可以在群里对一下。",
      peerCopy: "我也在等这个，准备先把邮件和系统状态翻一遍，看是不是还缺什么材料。",
      followUp: "还有谁 CAS/签证这块没动静吗？你们现在显示到哪一步了？",
      riskNote: "涉及签证和学校流程，需按个人邮件、系统状态和官方要求核实。",
    };
  }

  return {
    seniorCopy: hasEvidence
      ? `这个可以先按资料里的信息看：${evidenceHint}。不确定的地方再对下自己的邮件或页面。`
      : "我这边资料里没看到特别明确的答案，可以先问问同情况的同学有没有已经弄过。",
    peerCopy: hasEvidence
      ? "我也在看这个，感觉可以先按资料里的说法整理一下，再看自己页面有没有不一样。"
      : "我也没看到很明确的说法，有已经处理过的同学可以讲一下吗？",
    followUp: "有同情况的同学可以说下你们看到的信息吗？",
    riskNote: hasEvidence ? "已用资料库兜底生成，仍建议按个人页面核实。" : "资料不足，需人工补充或核实。",
  };
}

async function createCompletionWithTimeout({ openai, model, prompt }) {
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
      temperature: 0.2,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    },
    { signal: controller.signal, timeout: timeoutMs }
  );

  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
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
  const { school, country, moduleId, moduleName, question, timeNode } = body;

  const modelConfig = getModelConfig();

  if (!modelConfig) {
    return Response.json({ error: "Missing DEEPSEEK_API_KEY or NECO_API_KEY/NECO_BASE_URL" }, { status: 500 });
  }

  const evidence = searchKnowledge({ school, moduleId, question });

  const openai = new OpenAI({
    apiKey: modelConfig.apiKey,
    baseURL: modelConfig.baseURL,
  });

  const prompt = `
你是留学生微信群运营助手。请只基于下面资料回答，不要编造。

学校：${school}
国家/地区：${country}
模块：${moduleName}
时间节点：${timeNode}
用户问题：${question}

资料依据：
${evidence.map((item, index) => `${index + 1}.【${item.sourceType}】${item.sourceTitle}：${item.text}`).join("\n")}

请输出 JSON，格式必须是：
{
  "seniorCopy": "学姐账号可直接复制的话",
  "peerCopy": "同届学生可直接复制的话",
  "followUp": "一句追问",
  "riskNote": "资料不足或需核实时的提醒"
}

语气要求：
像微信群真人，不要百度百科，不要模板腔。
禁止使用：卡在哪、最卡的是、大家可以同步下进度、多关注学校系统和邮件、根据资料显示。
学姐口吻要简单明了，像群里随手提醒，不要写成公告。
少用“建议”“最终以……为准”“请大家注意”这种官方表达。
可以用：先看看、别急着、瞅瞅、对比一下、问问同情况的同学、发出来大家一起看。
例如问机票时，学姐口吻可以是：“大家可以多刷点平台做对比，瞅瞅价格浮动。”

准确性要求：
如果资料里没有明确写“免费早餐/包餐/meal included/catered”，不要直接说“没有免费早餐”。
更稳妥的说法是：“目前资料里没看到明确写免费早餐，最好按具体公寓官网或合同确认。”
如果资料不足，要直接说明“我这边资料里没看到明确答案”，不要编。

回答长度要求：
学姐口吻 30-90 字，最多两句话。
同届学生口吻 40-90 字。
追问一句 20-50 字。
`;

  let answer;
  let fallbackUsed = false;
  let fallbackReason = "";

  try {
    const completion = await createCompletionWithTimeout({ openai, model: modelConfig.model, prompt });
    answer = JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    fallbackUsed = true;
    fallbackReason = error?.message || "model_failed";
    console.warn("answer model failed, using fallback:", fallbackReason);
    answer = buildFallbackAnswer({ question, evidence });
  }

  return Response.json({
    seniorAnswer: answer.seniorCopy,
    peerAnswer: answer.peerCopy,
    followUp: answer.followUp,
    riskNote: answer.riskNote,
    evidence,
    fallbackUsed,
    fallbackReason,
    provider: modelConfig.provider,
  });
};

export const config = {
  path: "/api/answer",
  method: "POST",
};
