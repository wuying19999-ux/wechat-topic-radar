const recordsStore = globalThis.__wechatTopicRadarTrialRecords || [];
globalThis.__wechatTopicRadarTrialRecords = recordsStore;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TIMEOUT_MS = 8000;

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function sanitizeRecord(body = {}) {
  const now = new Date().toISOString();

  return {
    id: body.id || crypto.randomUUID(),
    createdAt: body.createdAt || now,
    updatedAt: now,
    operatorName: String(body.operatorName || "").trim(),
    school: String(body.school || "").trim(),
    country: String(body.country || "").trim(),
    moduleId: String(body.moduleId || "").trim(),
    moduleName: String(body.moduleName || "").trim(),
    timeNode: String(body.timeNode || "").trim(),
    recentDiscussion: String(body.recentDiscussion || "").trim(),
    dialogueId: String(body.dialogueId || "").trim(),
    dialogueKey: String(body.dialogueKey || "").trim(),
    dialogueTitle: String(body.dialogueTitle || "").trim(),
    dialogueAngle: String(body.dialogueAngle || "").trim(),
    copyText: String(body.copyText || "").slice(0, 5000),
    postedGroupName: String(body.postedGroupName || "").trim(),
    groupSize: numberValue(body.groupSize),
    postedAt: body.postedAt || now,
    replyCount: numberValue(body.replyCount ?? body.replies2h ?? body.replies30m),
    activeEffect: String(body.activeEffect || "未选择").trim(),
    editLevel: String(body.editLevel || "直接使用").trim(),
    qualityScore: numberValue(body.qualityScore),
    riskStatus: String(body.riskStatus || "无").trim(),
    riskNote: String(body.riskNote || "").trim(),
    note: String(body.note || "").trim(),
  };
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function toDatabaseRecord(record) {
  return {
    id: record.id,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    operator_name: record.operatorName,
    school: record.school,
    country: record.country,
    module_id: record.moduleId,
    module_name: record.moduleName,
    time_node: record.timeNode,
    recent_discussion: record.recentDiscussion,
    dialogue_id: record.dialogueId,
    dialogue_key: record.dialogueKey,
    dialogue_title: record.dialogueTitle,
    dialogue_angle: record.dialogueAngle,
    copy_text: record.copyText,
    posted_group_name: record.postedGroupName,
    group_size: record.groupSize,
    posted_at: record.postedAt,
    reply_count: record.replyCount,
    active_effect: record.activeEffect,
    edit_level: record.editLevel,
    quality_score: record.qualityScore,
    risk_status: record.riskStatus,
    risk_note: record.riskNote,
    note: record.note,
  };
}

function fromDatabaseRecord(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    operatorName: row.operator_name || "",
    school: row.school || "",
    country: row.country || "",
    moduleId: row.module_id || "",
    moduleName: row.module_name || "",
    timeNode: row.time_node || "",
    recentDiscussion: row.recent_discussion || "",
    dialogueId: row.dialogue_id || "",
    dialogueKey: row.dialogue_key || "",
    dialogueTitle: row.dialogue_title || "",
    dialogueAngle: row.dialogue_angle || "",
    copyText: row.copy_text || "",
    postedGroupName: row.posted_group_name || "",
    groupSize: numberValue(row.group_size),
    postedAt: row.posted_at || row.created_at,
    replyCount: numberValue(row.reply_count),
    activeEffect: row.active_effect || "未选择",
    editLevel: row.edit_level || "直接使用",
    qualityScore: numberValue(row.quality_score),
    riskStatus: row.risk_status || "无",
    riskNote: row.risk_note || "",
    note: row.note || "",
  };
}

async function fetchSupabaseRecords() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/trial_records`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "600");

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase read failed: ${detail}`);
  }

  const rows = await response.json();
  return rows.map(fromDatabaseRecord);
}

async function insertSupabaseRecord(record) {
  const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/trial_records`, {
    method: "POST",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(toDatabaseRecord(record)),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase insert failed: ${detail}`);
  }

  const [row] = await response.json();
  return fromDatabaseRecord(row);
}

function summarize(records) {
  const total = records.length;
  const getReplyCount = (item) => Number(item.replyCount ?? item.replies2h ?? item.replies30m) || 0;
  const sum = (field) => records.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  const totalReplies = records.reduce((acc, item) => acc + getReplyCount(item), 0);
  const avg = (field) => (total ? Number((sum(field) / total).toFixed(1)) : 0);
  const countBy = (field) =>
    records.reduce((acc, item) => {
      const key = item[field] || "未填写";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return {
    total,
    avgReplyCount: total ? Number((totalReplies / total).toFixed(1)) : 0,
    totalReplyCount: totalReplies,
    avgQualityScore: avg("qualityScore"),
    riskCount: records.filter((item) => item.riskStatus && item.riskStatus !== "无").length,
    effectCounts: countBy("activeEffect"),
    moduleCounts: countBy("moduleName"),
    groupCounts: countBy("postedGroupName"),
    editLevelCounts: countBy("editLevel"),
    schoolCounts: countBy("school"),
  };
}

export const config = {
  maxDuration: 15,
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    if (req.query?.admin !== "1") {
      res.status(403).json({ error: "Admin view required" });
      return;
    }

    try {
      const records = hasSupabaseConfig()
        ? await fetchSupabaseRecords()
        : recordsStore
            .slice(-600)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.status(200).json({
        records,
        summary: summarize(records),
        updatedAt: new Date().toISOString(),
        storage: hasSupabaseConfig() ? "supabase" : "memory",
      });
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "试运营数据读取失败，请检查 Supabase 配置或表结构。",
        storage: "supabase-error",
        detail: error.name === "AbortError" ? "Supabase request timed out" : error.message,
      });
    }
    return;
  }

  if (req.method === "POST") {
    const record = sanitizeRecord(req.body);

    try {
      const savedRecord = hasSupabaseConfig() ? await insertSupabaseRecord(record) : record;
      if (!hasSupabaseConfig()) {
        recordsStore.push(savedRecord);
      }

      res.status(201).json({
        record: savedRecord,
        summary: summarize([savedRecord]),
        storage: hasSupabaseConfig() ? "supabase" : "memory",
      });
    } catch (error) {
      console.error(error);
      res.status(502).json({
        error: "试运营数据保存失败，请检查 Supabase 配置或表结构。",
        storage: "supabase-error",
        detail: error.name === "AbortError" ? "Supabase request timed out" : error.message,
      });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
