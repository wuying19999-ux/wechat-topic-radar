import { Check, Clock3, Copy, LoaderCircle, MessageCircleQuestion, Send } from "lucide-react";
import React, { useEffect, useState } from "react";

function AnswerBlock({ label, toneClass, text, copyKey, copiedKey, onCopy }) {
  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-bold">{label}</div>
        <button
          type="button"
          onClick={() => onCopy(copyKey, text)}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-white/70 bg-white/80 px-2 text-xs font-bold text-ink-700 transition hover:text-radar-700"
        >
          {copiedKey === copyKey ? <Check size={13} /> : <Copy size={13} />}
          {copiedKey === copyKey ? "已复制" : "复制"}
        </button>
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-ink-800">{text}</p>
    </div>
  );
}

export default function QAPanel({ qa, module, settings, onQuestionChange, onGenerateAnswer }) {
  const [copiedKey, setCopiedKey] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!qa.isGenerating) {
      setElapsedSeconds(0);
      return undefined;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - (qa.startedAt || Date.now())) / 1000)));
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [qa.isGenerating, qa.startedAt]);

  async function handleCopy(copyKey, text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(copyKey);
      window.setTimeout(() => setCopiedKey(""), 1400);
    } catch (error) {
      console.warn("Copy failed", error);
    }
  }

  return (
    <section className="panel p-5 lg:sticky lg:top-[120px]">
      <div className="mb-4 flex items-center gap-2 text-base font-bold text-ink-950">
        <MessageCircleQuestion size={18} />
        群内问题双口吻回答
      </div>
      <p className="mb-4 text-xs leading-5 text-ink-600">
        当前上下文：{settings.school} · {settings.country} · {module.name}
      </p>

      <label>
        <span className="field-label">输入群内问题</span>
        <textarea
          className="field-control min-h-28 resize-y"
          value={qa.question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="例如：语言班还没找到室友，会不会太晚？"
        />
      </label>

      <button
        type="button"
        onClick={onGenerateAnswer}
        disabled={qa.isGenerating || !qa.question.trim()}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-bold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {qa.isGenerating ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
        {qa.isGenerating ? `生成中 · ${elapsedSeconds}秒` : "检索资料并生成回复"}
      </button>

      {qa.statusText ? (
        <div
          className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs leading-5 ${
            qa.error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-ink-600"
          }`}
        >
          {qa.isGenerating ? <Clock3 size={14} className="mt-0.5 shrink-0" /> : <Check size={14} className="mt-0.5 shrink-0" />}
          <span>
            {qa.isGenerating && elapsedSeconds >= 3
              ? "资料已找到，正在用 DeepSeek 分开改写学姐与同届口吻…"
              : qa.statusText}
          </span>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <AnswerBlock
          label="可复制：学姐账号回复"
          toneClass="border-radar-100 bg-radar-50 text-radar-700"
          text={qa.seniorAnswer}
          copyKey="qa-senior"
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />
        <AnswerBlock
          label="可复制：同届学生回复"
          toneClass="border-sky-100 bg-sky-50 text-sky-700"
          text={qa.peerAnswer}
          copyKey="qa-peer"
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />
      </div>

      {qa.evidence?.length > 0 ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold text-ink-600">
            本次回答依据 · {qa.searchMode === "live" ? "实时网页 + 学校资料库" : "学校资料库"}
          </div>
          <div className="space-y-2">
            {qa.evidence.map((source) => (
              <div
                key={`${source.id || source.url || source.sourceTitle}-${source.sourceType || source.type}`}
                className="rounded-md bg-slate-50 p-2"
              >
                <div className="text-xs font-bold text-ink-950">
                  {source.sourceType || source.type || "资料"}：{source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-radar-700 underline-offset-2 hover:underline"
                    >
                      {source.sourceTitle || source.title}
                    </a>
                  ) : (
                    source.sourceTitle || source.title
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  {source.text || source.note || ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
