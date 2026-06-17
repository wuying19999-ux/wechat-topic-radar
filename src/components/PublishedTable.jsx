import { ClipboardList } from "lucide-react";
import React from "react";

export default function PublishedTable({ module, moduleState }) {
  const publishedTopics = moduleState.publishedArchive || [];

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-ink-950">
            <ClipboardList size={18} />
            已发话题列表
          </div>
          <p className="mt-1 text-xs text-ink-600">{module.name} 独立记录，生成时自动避开。</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-ink-600">
          {publishedTopics.length} 条
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-bold text-ink-600">
              <th className="border-b border-slate-200 px-3 py-2">话题</th>
              <th className="border-b border-slate-200 px-3 py-2">效果</th>
              <th className="border-b border-slate-200 px-3 py-2">发布时间</th>
            </tr>
          </thead>
          <tbody>
            {publishedTopics.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-3 py-6 text-center text-sm text-ink-600">
                  当前模块还没有标记已发布的话题。
                </td>
              </tr>
            ) : (
              publishedTopics.map((topic) => (
                <tr key={topic.id} className="align-top">
                  <td className="border-b border-slate-100 px-3 py-3">
                    <div className="font-semibold text-ink-950">{topic.title}</div>
                    {topic.seniorCopy ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-600">
                        学姐文案：{topic.seniorCopy}
                      </p>
                    ) : null}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-3 text-ink-600">{topic.effect}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-xs text-ink-600">
                    {topic.publishedAt ? new Date(topic.publishedAt).toLocaleString("zh-CN") : "刚刚"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
