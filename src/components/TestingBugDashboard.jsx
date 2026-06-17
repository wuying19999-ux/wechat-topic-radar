import { Bug, ClipboardCheck, RefreshCw, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { fetchTestingBoard, saveTestingBoardRecord } from "../lib/apiClient";
import { groupModules, schools } from "../data/sampleData";

function StatCard({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2 text-ink-800">
      <div className="text-[11px] font-bold text-ink-500">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function TestingLogForm({ onSaved }) {
  const [form, setForm] = useState({
    testerName: "",
    testDate: new Date().toISOString().slice(0, 10),
    school: schools[0],
    moduleName: groupModules[0].name,
    generatedCount: "",
    publishedCount: "",
    bugCount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveTestingBoardRecord({ type: "testing_log", ...form });
      setForm((current) => ({ ...current, generatedCount: "", publishedCount: "", bugCount: "", notes: "" }));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
        <ClipboardCheck size={16} />
        每日测试记录
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="field-label">测试人</span>
          <input className="field-control" value={form.testerName} onChange={(event) => update("testerName", event.target.value)} />
        </label>
        <label>
          <span className="field-label">测试日期</span>
          <input className="field-control" type="date" value={form.testDate} onChange={(event) => update("testDate", event.target.value)} />
        </label>
        <label>
          <span className="field-label">学校</span>
          <select className="field-control" value={form.school} onChange={(event) => update("school", event.target.value)}>
            {schools.map((school) => (
              <option key={school}>{school}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">模块</span>
          <select className="field-control" value={form.moduleName} onChange={(event) => update("moduleName", event.target.value)}>
            {groupModules.map((module) => (
              <option key={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">生成次数</span>
          <input className="field-control" type="number" min="0" value={form.generatedCount} onChange={(event) => update("generatedCount", event.target.value)} />
        </label>
        <label>
          <span className="field-label">发布次数</span>
          <input className="field-control" type="number" min="0" value={form.publishedCount} onChange={(event) => update("publishedCount", event.target.value)} />
        </label>
        <label>
          <span className="field-label">发现 Bug 数</span>
          <input className="field-control" type="number" min="0" value={form.bugCount} onChange={(event) => update("bugCount", event.target.value)} />
        </label>
        <label className="md:col-span-2">
          <span className="field-label">备注</span>
          <input className="field-control" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="例如：谢菲语言班生成可直接发，押金问题还需优化" />
        </label>
      </div>
      <button type="submit" disabled={saving} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-bold text-white disabled:bg-slate-400">
        <Save size={16} />
        {saving ? "保存中..." : "保存测试记录"}
      </button>
    </form>
  );
}

function BugForm({ onSaved }) {
  const [form, setForm] = useState({
    reporterName: "",
    title: "",
    description: "",
    severity: "一般",
    status: "待处理",
    school: schools[0],
    moduleName: groupModules[0].name,
  });
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveTestingBoardRecord({ type: "bug_report", ...form });
      setForm((current) => ({ ...current, title: "", description: "" }));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
        <Bug size={16} />
        Bug / 体验问题记录
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="field-label">反馈人</span>
          <input className="field-control" value={form.reporterName} onChange={(event) => update("reporterName", event.target.value)} />
        </label>
        <label>
          <span className="field-label">严重程度</span>
          <select className="field-control" value={form.severity} onChange={(event) => update("severity", event.target.value)}>
            <option>轻微</option>
            <option>一般</option>
            <option>严重</option>
            <option>阻塞</option>
          </select>
        </label>
        <label>
          <span className="field-label">状态</span>
          <select className="field-control" value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option>待处理</option>
            <option>处理中</option>
            <option>已修复</option>
            <option>暂缓</option>
          </select>
        </label>
        <label>
          <span className="field-label">学校</span>
          <select className="field-control" value={form.school} onChange={(event) => update("school", event.target.value)}>
            {schools.map((school) => (
              <option key={school}>{school}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">模块</span>
          <select className="field-control" value={form.moduleName} onChange={(event) => update("moduleName", event.target.value)}>
            {groupModules.map((module) => (
              <option key={module.id}>{module.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">标题</span>
          <input className="field-control" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="例如：押金话题语气生硬" />
        </label>
        <label className="md:col-span-3">
          <span className="field-label">问题描述</span>
          <textarea className="field-control min-h-[76px] resize-y" value={form.description} onChange={(event) => update("description", event.target.value)} />
        </label>
      </div>
      <button type="submit" disabled={saving} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-bold text-white disabled:bg-slate-400">
        <Save size={16} />
        {saving ? "保存中..." : "保存 Bug 记录"}
      </button>
    </form>
  );
}

export default function TestingBugDashboard() {
  const [data, setData] = useState({ testingLogs: [], bugReports: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      setData(await fetchTestingBoard({ admin: true }));
    } catch (err) {
      console.error(err);
      setError("测试/Bug 看板读取失败，请检查 Supabase 表结构。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const recentBugs = useMemo(() => (data.bugReports || []).slice(0, 5), [data.bugReports]);
  const summary = data.summary || {};

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-ink-950">
            <Bug size={18} />
            试运营测试与 Bug 看板
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-600">
            用来记录部门试用人数、生成量、发布量、Bug 和修复情况。当前存储：{data.storage || "读取中"}。
          </p>
        </div>
        <button type="button" onClick={loadData} className="icon-button shrink-0" title="刷新">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <StatCard label="测试人数" value={summary.testerCount || 0} />
        <StatCard label="测试天数" value={summary.testDays || 0} />
        <StatCard label="生成次数" value={summary.generatedCount || 0} />
        <StatCard label="发布次数" value={summary.publishedCount || 0} />
        <StatCard label="Bug 数" value={summary.bugCount || 0} />
        <StatCard label="已修复" value={summary.fixedBugCount || 0} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TestingLogForm onSaved={loadData} />
        <BugForm onSaved={loadData} />
      </div>

      {error ? <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
        <div className="mb-2 text-xs font-bold text-ink-600">最近 Bug / 体验问题</div>
        {recentBugs.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {recentBugs.map((bug) => (
              <div key={bug.id} className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-ink-700">
                <div className="font-bold text-ink-950">{bug.title || "未命名问题"}</div>
                <div className="mt-1 line-clamp-2">{bug.description || "未填写描述"}</div>
                <div className="mt-2 flex flex-wrap gap-1 font-bold">
                  <span className="rounded bg-white px-2 py-1">{bug.status}</span>
                  <span className="rounded bg-white px-2 py-1">{bug.severity}</span>
                  <span className="rounded bg-white px-2 py-1">{bug.school}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-ink-600">
            暂无 Bug 记录。正式试运营时，员工反馈的问题可以在这里录入。
          </div>
        )}
      </div>
    </section>
  );
}
