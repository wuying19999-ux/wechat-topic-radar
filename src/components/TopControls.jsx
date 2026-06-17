import { Globe2, School, Save } from "lucide-react";
import React from "react";
import { countries, schools } from "../data/sampleData";

export default function TopControls({ settings, onChange, onSave, savedLabel }) {
  return (
    <header className="panel sticky top-4 z-20 mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-normal text-ink-950 md:text-2xl">
          留学生微信群话题雷达网页工作台
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          生成不重复群话题，记录发布效果，并为群内问题生成双口吻回复。
        </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(160px,1fr)_minmax(140px,1fr)_auto] lg:min-w-[560px]">
        <label>
          <span className="field-label inline-flex items-center gap-1.5">
            <School size={14} /> 学校
          </span>
          <select
            className="field-control"
            value={settings.school}
            onChange={(event) => onChange({ school: event.target.value })}
          >
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="field-label inline-flex items-center gap-1.5">
            <Globe2 size={14} /> 国家/地区
          </span>
          <select
            className="field-control"
            value={settings.country}
            onChange={(event) => onChange({ country: event.target.value })}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            <Save size={16} />
            保存
          </button>
          <span className="min-w-20 pb-2 text-xs text-ink-600">{savedLabel}</span>
        </div>
      </div>
    </header>
  );
}
