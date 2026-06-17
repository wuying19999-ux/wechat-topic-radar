import { CheckCircle2, Layers } from "lucide-react";
import React from "react";
import { groupModules } from "../data/sampleData";

const accentClasses = {
  teal: "bg-radar-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
};

export default function ModuleRail({ selectedModuleId, modules, onSelect }) {
  return (
    <aside className="panel min-w-0 p-3 lg:sticky lg:top-[120px]">
      <div className="mb-3 flex items-center gap-2 px-2 text-sm font-bold text-ink-950">
        <Layers size={16} />
        功能群模块
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {groupModules.map((module) => {
          const moduleState = modules[module.id];
          const publishedCount =
            moduleState?.publishedDialogues?.length ||
            moduleState?.topics?.filter((topic) => topic.published).length ||
            0;
          const active = selectedModuleId === module.id;

          return (
            <button
              type="button"
              key={module.id}
              onClick={() => onSelect(module.id)}
              className={`w-full min-w-0 rounded-md border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-radar-100 ${
                active
                  ? "border-radar-300 bg-radar-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${accentClasses[module.accent]}`} />
                    <span className="text-sm font-bold text-ink-950">{module.name}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-600">
                    {module.description}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink-600">
                  <CheckCircle2 size={13} />
                  {publishedCount}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
