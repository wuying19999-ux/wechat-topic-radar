import { BarChart3, Download, RefreshCw, ShieldAlert } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { fetchTrialRecords } from "../lib/apiClient";

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsv(records) {
  const headers = [
    "createdAt",
    "operatorName",
    "school",
    "moduleName",
    "timeNode",
    "dialogueTitle",
    "postedGroupName",
    "groupSize",
    "replyCount",
    "activeEffect",
    "editLevel",
    "qualityScore",
    "riskStatus",
    "riskNote",
    "note",
  ];

  return [
    headers.join(","),
    ...records.map((record) => headers.map((header) => csvEscape(record[header])).join(",")),
  ].join("\n");
}

function downloadCsv(records) {
  const csv = buildCsv(records);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `试运营数据-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getReplyCount(record) {
  return record.replyCount ?? record.replies2h ?? record.replies30m ?? 0;
}

function StatCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "risk"
      ? "bg-rose-50 text-rose-700"
      : tone === "good"
        ? "bg-radar-50 text-radar-800"
        : "bg-slate-50 text-ink-800";

  return (
    <div className={`rounded-md px-3 py-2 ${toneClass}`}>
      <div className="text-[11px] font-bold text-current/70">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function CountList({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-2 text-xs font-bold text-ink-600">{title}</div>
      {entries.length ? (
        <div className="space-y-1.5">
          {entries.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-ink-700">{label}</span>
              <span className="font-bold text-ink-950">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-ink-500">暂无数据</div>
      )}
    </div>
  );
}

export default function TrialDataDashboard({ refreshKey }) {
  const [data, setData] = useState({ records: [], summary: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRecords() {
    setLoading(true);
    setError("");

    try {
      const nextData = await fetchTrialRecords({ admin: true });
      setData(nextData);
    } catch (err) {
      console.error(err);
      setError("读取失败，稍后刷新试试。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [refreshKey]);

  const summary = data.summary || {};
  const latestRecords = useMemo(() => (data.records || []).slice(0, 5), [data.records]);

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-ink-950">
            <BarChart3 size={18} />
            试运营数据看板
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-600">
            所有人在网页里提交的群活跃记录会汇总到这里。
          </p>
        </div>
        <button
          type="button"
          onClick={loadRecords}
          className="icon-button shrink-0"
          title="刷新数据"
          aria-label="刷新数据"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="记录数" value={summary.total || 0} tone="good" />
        <StatCard label="风险记录" value={summary.riskCount || 0} tone="risk" />
        <StatCard label="平均回复数" value={summary.avgReplyCount || 0} />
        <StatCard label="总回复数" value={summary.totalReplyCount || 0} />
      </div>

      <div className="mt-3 grid gap-2">
        <CountList title="活跃效果分布" data={summary.effectCounts} />
        <CountList title="群模块分布" data={summary.moduleCounts} />
        <CountList title="发布群名分布" data={summary.groupCounts} />
        <CountList title="修改程度分布" data={summary.editLevelCounts} />
      </div>

      <button
        type="button"
        onClick={() => downloadCsv(data.records || [])}
        disabled={!data.records?.length}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink-950 px-3 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Download size={16} />
        导出 CSV
      </button>

      {error ? (
        <div className="mt-3 flex gap-2 rounded-md bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 text-xs font-bold text-ink-600">最近记录</div>
        {latestRecords.length ? (
          <div className="space-y-2">
            {latestRecords.map((record) => (
              <div key={record.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-bold text-ink-950">
                  {record.school} · {record.moduleName}
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-ink-600">
                  {record.dialogueTitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-bold">
                  <span className="rounded bg-white px-2 py-1">回复 {getReplyCount(record)}</span>
                  <span className="rounded bg-white px-2 py-1">{record.postedGroupName || "未填群名"}</span>
                  <span className="rounded bg-white px-2 py-1">{record.activeEffect}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-ink-600">
            暂无记录。员工在中间模块点击“记录试运营”后，这里会出现汇总。
          </div>
        )}
      </div>
    </section>
  );
}
