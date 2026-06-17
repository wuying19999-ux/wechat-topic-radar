import { Database } from "lucide-react";
import React from "react";
import { buildDataAdapterPreview } from "../lib/topicEngine";

export default function DataModelPreview({ state }) {
  const preview = buildDataAdapterPreview(state);

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center gap-2 text-base font-bold text-ink-950">
        <Database size={18} />
        数据结构预留
      </div>
      <p className="mb-3 text-xs leading-5 text-ink-600">
        当前示例使用 localStorage；字段结构已按 Google Sheets / Supabase / Firebase 的表结构预留。
      </p>
      <pre className="max-h-[360px] overflow-auto rounded-md bg-ink-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(preview, null, 2)}
      </pre>
    </section>
  );
}
