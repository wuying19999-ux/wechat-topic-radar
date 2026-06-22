import { getStore } from "@netlify/blobs";

const STORE_NAME = "wechat-topic-radar-testing-board";

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function text(value) {
  return String(value || "").trim();
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function sanitizeTestingLog(body) {
  const now = new Date().toISOString();
  const testDate = text(body.testDate) || now.slice(0, 10);

  return {
    id: body.id || crypto.randomUUID(),
    type: "testing_log",
    createdAt: body.createdAt || now,
    updatedAt: now,
    testerName: text(body.testerName),
    testDate,
    school: text(body.school),
    moduleName: text(body.moduleName),
    generatedCount: numberValue(body.generatedCount),
    publishedCount: numberValue(body.publishedCount),
    bugCount: numberValue(body.bugCount),
    notes: text(body.notes).slice(0, 3000),
  };
}

function sanitizeBugReport(body) {
  const now = new Date().toISOString();

  return {
    id: body.id || crypto.randomUUID(),
    type: "bug_report",
    createdAt: body.createdAt || now,
    updatedAt: now,
    reporterName: text(body.reporterName),
    title: text(body.title),
    description: text(body.description).slice(0, 5000),
    severity: text(body.severity) || "一般",
    status: text(body.status) || "待处理",
    school: text(body.school),
    moduleName: text(body.moduleName),
  };
}

async function listJson(store, prefix) {
  const { blobs } = await store.list({ prefix });
  const records = await Promise.all(
    blobs
      .slice(-800)
      .map((blob) => store.get(blob.key, { type: "json" }).catch(() => null))
  );

  return records
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function summarize(testingLogs, bugReports) {
  const testers = new Set(testingLogs.map((item) => item.testerName).filter(Boolean));
  const testDays = new Set(testingLogs.map((item) => item.testDate).filter(Boolean));
  const sum = (records, field) => records.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  const loggedBugCount = sum(testingLogs, "bugCount");

  return {
    testerCount: testers.size,
    testDays: testDays.size,
    generatedCount: sum(testingLogs, "generatedCount"),
    publishedCount: sum(testingLogs, "publishedCount"),
    bugCount: bugReports.length || loggedBugCount,
    fixedBugCount: bugReports.filter((item) => item.status === "已修复").length,
  };
}

export default async (req) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("admin") !== "1") {
      return json({ error: "Admin view required" }, { status: 403 });
    }

    const [testingLogs, bugReports] = await Promise.all([
      listJson(store, "testing-logs/"),
      listJson(store, "bug-reports/"),
    ]);

    return json({
      testingLogs,
      bugReports,
      summary: summarize(testingLogs, bugReports),
      storage: "netlify-blobs",
      updatedAt: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const type = text(body.type);
    const record = type === "bug_report" ? sanitizeBugReport(body) : sanitizeTestingLog(body);
    const folder = record.type === "bug_report" ? "bug-reports" : "testing-logs";

    await store.setJSON(`${folder}/${record.createdAt.slice(0, 10)}/${record.id}.json`, record, {
      metadata: {
        type: record.type,
        school: record.school,
        moduleName: record.moduleName,
        createdAt: record.createdAt,
      },
    });

    return json({ record }, { status: 201 });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};

export const config = {
  path: "/api/testing-board",
};
