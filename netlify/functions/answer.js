import OpenAI from "openai";
import { searchKnowledge } from "./_shared/knowledge.js";

const officialDomainsBySchool = {
  UCL: ["ucl.ac.uk"],
  KCL: ["kcl.ac.uk"],
  曼彻斯特大学: ["manchester.ac.uk"],
  布里斯托大学: ["bristol.ac.uk"],
  华威大学: ["warwick.ac.uk"],
  格拉斯哥大学: ["gla.ac.uk"],
  杜伦大学: ["durham.ac.uk"],
  谢菲大学: ["sheffield.ac.uk"],
  悉尼大学: ["sydney.edu.au"],
  墨尔本大学: ["unimelb.edu.au"],
  香港理工大学: ["polyu.edu.hk"],
};

async function searchLiveWeb({ school, question }) {
  const apiKey = Netlify.env.get("TAVILY_API_KEY");
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${school} ${question} official`,
        search_depth: "advanced",
        max_results: 4,
        include_answer: false,
        include_raw_content: false,
        include_domains: officialDomainsBySchool[school] || [],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`search_http_${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).slice(0, 4).map((result, index) => ({
      id: `live-search-${index}-${result.url}`,
      sourceType: "实时官网搜索",
      sourceTitle: result.title || result.url,
      text: String(result.content || "").replace(/\s+/g, " ").trim().slice(0, 700),
      url: result.url,
      score: result.score || 0,
    }));
  } catch (error) {
    console.warn("Live search unavailable, continuing with knowledge base:", error?.message || error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeForSimilarity(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[，。！？、；：“”‘’（）,.!?;:'"()\s]/g, "");
}

function answerSimilarity(left, right) {
  const a = normalizeForSimilarity(left);
  const b = normalizeForSimilarity(right);
  if (!a || !b) return 0;
  if (a === b || a.includes(b) || b.includes(a)) return 1;

  const makeBigrams = (value) => {
    const grams = new Set();
    for (let index = 0; index < value.length - 1; index += 1) {
      grams.add(value.slice(index, index + 2));
    }
    return grams;
  };
  const aGrams = makeBigrams(a);
  const bGrams = makeBigrams(b);
  const intersection = [...aGrams].filter((gram) => bGrams.has(gram)).length;
  const union = new Set([...aGrams, ...bGrams]).size;
  return union ? intersection / union : 0;
}

function buildDistinctPeerAnswer({ question, followUp }) {
  if (/行李|行李箱|托运|随身|收拾|打包/i.test(question || "")) {
    return "我也刚开始收，准备先把证件、电脑和第一周要用的放随身，剩下的再按航司额度塞。你们都是带几个箱子呀？";
  }
  if (/机票|航班|飞|出发/i.test(question || "")) {
    return "我也还在刷票，准备把价格、退改和行李额放一起比，不只看最低价。有人和我出发时间差不多吗？";
  }
  if (/住宿|宿舍|公寓|租房|室友/i.test(question || "")) {
    return "我也在看这个，准备把预算、入住时间和想住的区域先列出来，再问问有没有同时间到的同学一起看。";
  }
  return `我也在查这个，先把自己现在看到的情况说清楚，再问问有没有同情况的同学。${followUp || ""}`;
}

function buildFallbackAnswer({ question, evidence }) {
  const hasEvidence = evidence.length > 0;
  const evidenceHint = hasEvidence
    ? evidence[0].text
        .replace(/OCR整理|已匿名化|截图内未显示具体发送时间|成员[A-Z]|可检索标签|话题总结/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 100)
    : "";

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

  if (/行李|行李箱|托运|随身|收拾|打包/i.test(question || "")) {
    return {
      seniorCopy: "行李可以先按航司额度倒着收，先定托运几件、随身几件，再看哪些国内带、哪些落地买。",
      peerCopy: "我也在收行李，准备先看票面行李额。常用药、证件、第一周马上用的先带，床品小家电这种我可能到那边再买。",
      followUp: "大家第一次去准备带几个箱子？有没有已经问过航司行李额的？",
      riskNote: "行李额度、尺寸和入境限制要以购票页面、航司规则和澳洲海关要求为准。",
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
  // Leave enough time for the function to return a structured local fallback
  // before Netlify's synchronous function limit closes the connection.
  const timeoutMs = 38000;
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
      max_tokens: 520,
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
  const knowledgeEvidence = searchKnowledge({ school, moduleId, question }).slice(0, 6);
  const liveEvidence = await searchLiveWeb({ school, question });
  const evidence = [...liveEvidence, ...knowledgeEvidence].slice(0, 8);
  const searchMode = liveEvidence.length ? "live" : "knowledge";

  if (!modelConfig) {
    const answer = buildFallbackAnswer({ question, evidence });

    return Response.json({
      seniorAnswer: answer.seniorCopy,
      peerAnswer: answer.peerCopy,
      followUp: answer.followUp,
      riskNote: answer.riskNote,
      evidence,
      fallbackUsed: true,
      fallbackReason: "missing_model_env",
      provider: "Local",
      searchMode,
    });
  }

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

资料依据（实时官网结果优先，其次为已上传学校资料）：
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
禁止使用：卡在哪、最卡的是、大家可以同步下进度、多关注学校系统和邮件、根据资料显示、OCR整理、截图、已匿名化、成员A、R整理。
学姐口吻要简单明了，像群里随手提醒，不要写成公告。
少用“建议”“最终以……为准”“请大家注意”这种官方表达。
可以用：先看看、别急着、瞅瞅、对比一下、问问同情况的同学、发出来大家一起看。
例如问机票时，学姐口吻可以是：“大家可以多刷点平台做对比，瞅瞅价格浮动。”

两个身份必须明显不同：
- seniorCopy：直接回答问题，给 1-2 个最关键的做法或判断，语气像有经验的学姐。
- peerCopy：用第一人称说“我准备怎么做/我现在是什么情况”，最后自然问一句群友，像同届学生交流。
- peerCopy 禁止复述 seniorCopy，不能只是把“可以”改成“我也觉得可以”。
- 两段不要使用相同开头，不要连续出现相同短语，核心句式必须不同。

准确性要求：
当前问题必须优先回答用户问的具体内容，不要因为当前模块是校友群就跳回 CAS/押金。
如果用户问行李、行李箱、托运、随身或怎么收，要优先使用资料里的行李/航司/海关/行李清单信息。
行李类回答可以说：先看票面或航司行李额、托运和随身分开收、重要文件随身、床品小家电不一定都从国内带、澳洲海关/申报类物品提前核对。
不能编具体航司免费额度；除非资料里明确写了对应航司，否则只说“看票面/航司页面”。
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
    if (answerSimilarity(answer.seniorCopy, answer.peerCopy) >= 0.58) {
      answer.peerCopy = buildDistinctPeerAnswer({
        question,
        followUp: answer.followUp,
      });
    }
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
    searchMode,
  });
};

export const config = {
  path: "/api/answer",
  method: "POST",
};
