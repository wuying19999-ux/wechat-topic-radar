import { getStore } from "@netlify/blobs";

const STORE_NAME = "wechat-topic-radar-trial-records";

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function sanitizeRecord(body) {
  const now = new Date().toISOString();
  const numberValue = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

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
    avgReplies30m: avg("replies30m"),
    avgReplies2h: avg("replies2h"),
    avgQualityScore: avg("qualityScore"),
    riskCount: records.filter((item) => item.riskStatus && item.riskStatus !== "无").length,
    effectCounts: countBy("activeEffect"),
    moduleCounts: countBy("moduleName"),
    groupCounts: countBy("postedGroupName"),
    editLevelCounts: countBy("editLevel"),
    schoolCounts: countBy("school"),
  };
}

export default async (req) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "GET") {
    const url = new URL(req.url);
    const adminView = url.searchParams.get("admin") === "1";

    if (!adminView) {
      return json({ error: "Admin view required" }, { status: 403 });
    }

    const { blobs } = await store.list({ prefix: "records/" });
    const records = await Promise.all(
      blobs
        .slice(-600)
        .map((blob) => store.get(blob.key, { type: "json" }))
    );
    const cleanRecords = records
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return json({
      records: cleanRecords,
      summary: summarize(cleanRecords),
      updatedAt: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const record = sanitizeRecord(body);
    await store.setJSON(`records/${record.createdAt.slice(0, 10)}/${record.id}.json`, record, {
      metadata: {
        school: record.school,
        moduleName: record.moduleName,
        createdAt: record.createdAt,
      },
    });

    return json({ record, summary: summarize([record]) }, { status: 201 });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};

export const config = {
  path: "/api/trial-records",
};
