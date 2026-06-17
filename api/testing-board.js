const memoryStore = globalThis.__wechatTopicRadarTestingBoard || {
  testingLogs: [],
  bugReports: [],
};
globalThis.__wechatTopicRadarTestingBoard = memoryStore;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TIMEOUT_MS = 8000;

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
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function sanitizeTestingLog(body = {}) {
  return {
    id: body.id || crypto.randomUUID(),
    createdAt: body.createdAt || new Date().toISOString(),
    testerName: String(body.testerName || "").trim(),
    testDate: body.testDate || new Date().toISOString().slice(0, 10),
    school: String(body.school || "").trim(),
    moduleName: String(body.moduleName || "").trim(),
    generatedCount: numberValue(body.generatedCount),
    publishedCount: numberValue(body.publishedCount),
    bugCount: numberValue(body.bugCount),
    notes: String(body.notes || "").trim(),
  };
}

function sanitizeBugReport(body = {}) {
  return {
    id: body.id || crypto.randomUUID(),
    createdAt: body.createdAt || new Date().toISOString(),
    reporterName: String(body.reporterName || "").trim(),
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    severity: String(body.severity || "一般").trim(),
    status: String(body.status || "待处理").trim(),
    school: String(body.school || "").trim(),
    moduleName: String(body.moduleName || "").trim(),
  };
}

function testingLogToDb(record) {
  return {
    id: record.id,
    created_at: record.createdAt,
    tester_name: record.testerName,
    test_date: record.testDate,
    school: record.school,
    module_name: record.moduleName,
    generated_count: record.generatedCount,
    published_count: record.publishedCount,
    bug_count: record.bugCount,
    notes: record.notes,
  };
}

function testingLogFromDb(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    testerName: row.tester_name || "",
    testDate: row.test_date || "",
    school: row.school || "",
    moduleName: row.module_name || "",
    generatedCount: numberValue(row.generated_count),
    publishedCount: numberValue(row.published_count),
    bugCount: numberValue(row.bug_count),
    notes: row.notes || "",
  };
}

function bugReportToDb(record) {
  return {
    id: record.id,
    created_at: record.createdAt,
    reporter_name: record.reporterName,
    title: record.title,
    description: record.description,
    severity: record.severity,
    status: record.status,
    school: record.school,
    module_name: record.moduleName,
  };
}

function bugReportFromDb(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    reporterName: row.reporter_name || "",
    title: row.title || "",
    description: row.description || "",
    severity: row.severity || "一般",
    status: row.status || "待处理",
    school: row.school || "",
    moduleName: row.module_name || "",
  };
}

async function readTable(table, mapper) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "300");

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()).map(mapper);
}

async function insertTable(table, record, mapper) {
  const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const [row] = await response.json();
  return mapper(row);
}

function summarize(testingLogs, bugReports) {
  const testers = new Set(testingLogs.map((item) => item.testerName).filter(Boolean));
  const days = new Set(testingLogs.map((item) => item.testDate).filter(Boolean));
  const sum = (items, field) => items.reduce((acc, item) => acc + numberValue(item[field]), 0);

  return {
    testerCount: testers.size,
    testDays: days.size,
    generatedCount: sum(testingLogs, "generatedCount"),
    publishedCount: sum(testingLogs, "publishedCount"),
    bugCount: bugReports.length || sum(testingLogs, "bugCount"),
    fixedBugCount: bugReports.filter((item) => item.status === "已修复").length,
    pendingBugCount: bugReports.filter((item) => item.status !== "已修复").length,
  };
}

async function loadBoardData() {
  if (!hasSupabaseConfig()) {
    return {
      testingLogs: memoryStore.testingLogs.slice().reverse(),
      bugReports: memoryStore.bugReports.slice().reverse(),
      storage: "memory",
    };
  }

  const [testingLogs, bugReports] = await Promise.all([
    readTable("user_testing_logs", testingLogFromDb),
    readTable("bug_reports", bugReportFromDb),
  ]);

  return { testingLogs, bugReports, storage: "supabase" };
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
      const data = await loadBoardData();
      res.status(200).json({
        ...data,
        summary: summarize(data.testingLogs, data.bugReports),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(502).json({ error: "测试/Bug 看板读取失败", detail: error.message });
    }
    return;
  }

  if (req.method === "POST") {
    const type = req.body?.type;

    try {
      if (type === "bug_report") {
        const record = sanitizeBugReport(req.body);
        const saved = hasSupabaseConfig()
          ? await insertTable("bug_reports", bugReportToDb(record), bugReportFromDb)
          : record;
        if (!hasSupabaseConfig()) memoryStore.bugReports.push(saved);
        res.status(201).json({ record: saved, type, storage: hasSupabaseConfig() ? "supabase" : "memory" });
        return;
      }

      const record = sanitizeTestingLog(req.body);
      const saved = hasSupabaseConfig()
        ? await insertTable("user_testing_logs", testingLogToDb(record), testingLogFromDb)
        : record;
      if (!hasSupabaseConfig()) memoryStore.testingLogs.push(saved);
      res.status(201).json({ record: saved, type: "testing_log", storage: hasSupabaseConfig() ? "supabase" : "memory" });
    } catch (error) {
      res.status(502).json({ error: "测试/Bug 看板保存失败", detail: error.message });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
