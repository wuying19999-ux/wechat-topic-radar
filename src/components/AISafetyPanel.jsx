import { AlertTriangle, Copy, ShieldCheck, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { aiSafetyRiskTypes, generateLocalAISafetyResponse } from "../lib/aiSafetyEngine";
import { generateAISafety } from "../lib/apiClient";
import { timeNodeOptions } from "../data/sampleData";

function OutputBlock({ title, value, tone = "default" }) {
  const toneClass =
    tone === "risk"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tone === "safe"
        ? "border-radar-200 bg-radar-50 text-radar-800"
        : "border-slate-200 bg-white text-ink-800";

  async function copy() {
    if (value) {
      await navigator.clipboard.writeText(value);
    }
  }

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-black">{title}</div>
        <button type="button" onClick={copy} className="icon-button h-8 w-8" aria-label={`复制${title}`}>
          <Copy size={14} />
        </button>
      </div>
      <p className="whitespace-pre-line text-sm leading-6">{value || "生成后显示"}</p>
    </div>
  );
}

export default function AISafetyPanel({ settings, module }) {
  const [form, setForm] = useState({
    groupType: "校友群",
    timeNode: timeNodeOptions[1],
    riskType: aiSafetyRiskTypes[0],
    studentQuestion: "有人问：作业能不能先用 AI 写一版再改？",
    recentDiscussion: "",
  });
  const [result, setResult] = useState(() =>
    generateLocalAISafetyResponse({
      school: settings.school,
      country: settings.country,
      ...form,
    })
  );
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleGenerate() {
    setLoading(true);
    setNotice("");
    const payload = {
      school: settings.school,
      country: settings.country,
      ...form,
    };

    try {
      const nextResult = await generateAISafety(payload);
      setResult(nextResult);
      setNotice(nextResult.source === "deepseek" ? "已使用 DeepSeek 优化语气。" : "已使用本地安全资料库生成。");
    } catch (error) {
      console.warn(error);
      setResult(generateLocalAISafetyResponse(payload));
      setNotice("API 暂时不可用，已使用本地安全兜底生成。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-700">
              {settings.school} · {settings.country}
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-ink-950">
              <ShieldCheck size={24} />
              {module.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">{module.description}</p>
            <p className="mt-2 max-w-3xl rounded-md bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
              这个模块只生成“安全提醒、官方路径、群内低风险话术”，不会提供规避检测、代写、作弊或降低 AI 率的方法。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label>
            <span className="field-label">群类型</span>
            <select className="field-control" value={form.groupType} onChange={(event) => update("groupType", event.target.value)}>
              <option>校友群</option>
              <option>飞友群</option>
              <option>二手群</option>
              <option>各学院群</option>
              <option>语言班</option>
            </select>
          </label>
          <label>
            <span className="field-label">当前时间节点</span>
            <select className="field-control" value={form.timeNode} onChange={(event) => update("timeNode", event.target.value)}>
              {timeNodeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">风险类型</span>
            <select className="field-control" value={form.riskType} onChange={(event) => update("riskType", event.target.value)}>
              {aiSafetyRiskTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">最近群内讨论（可空）</span>
            <input
              className="field-control"
              value={form.recentDiscussion}
              onChange={(event) => update("recentDiscussion", event.target.value)}
              placeholder="例如：有人问 Turnitin 相似度"
            />
          </label>
          <label className="md:col-span-2">
            <span className="field-label">学生问题</span>
            <textarea
              className="field-control min-h-[110px] resize-y"
              value={form.studentQuestion}
              onChange={(event) => update("studentQuestion", event.target.value)}
              placeholder="把群里学生问的问题贴进来"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-wait disabled:bg-slate-400"
        >
          <Sparkles size={17} />
          {loading ? "生成中..." : "生成 AI 安全话术"}
        </button>

        {notice ? (
          <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {notice}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 bg-slate-50/70 p-5 md:grid-cols-2">
        <OutputBlock title="风险判断" value={result.riskJudgement} tone="risk" />
        <OutputBlock title="不适合在群里说的话" value={result.notSuitableToSay} tone="risk" />
        <OutputBlock title="可复制：学姐口吻回复" value={result.seniorReply} tone="safe" />
        <OutputBlock title="可复制：同届学生口吻回复" value={result.peerReply} />
        <OutputBlock title="适合微信群话题开场" value={result.groupOpening} tone="safe" />
        <OutputBlock title="延展追问" value={result.followUp} />
        <OutputBlock title="安全提醒" value={result.safetyReminder} tone="risk" />
        <OutputBlock title="是否需要官方确认" value={result.needOfficialConfirmation} />
      </div>
    </section>
  );
}
