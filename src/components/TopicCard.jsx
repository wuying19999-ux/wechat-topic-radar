import { Check, ClipboardCheck, Copy, MessageCircle, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import { effectOptions } from "../data/sampleData";

function CopyableBlock({ label, icon: Icon, toneClass, text, copyKey, copiedKey, onCopy, children }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className={`flex items-center gap-2 text-xs font-bold ${toneClass}`}>
          <Icon size={14} />
          {label}
        </div>
        <button
          type="button"
          onClick={() => onCopy(copyKey, text)}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-ink-700 transition hover:border-radar-200 hover:text-radar-700"
        >
          {copiedKey === copyKey ? <Check size={13} /> : <Copy size={13} />}
          {copiedKey === copyKey ? "已复制" : "复制"}
        </button>
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-ink-800">{text}</p>
      {children}
    </div>
  );
}

export default function TopicCard({ topic, index, onPublishedChange, onEffectChange }) {
  const [copiedKey, setCopiedKey] = useState("");
  const seniorText = topic.seniorCopy || topic.seniorVoice;
  const peerText = topic.peerCopy || topic.peerVoice;
  const followUpText = topic.followUpCopy || topic.followUp;

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
    <article className="quiet-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-ink-950 text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="rounded-md bg-radar-50 px-2 py-1 text-xs font-semibold text-radar-700">
              {topic.source}
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              常见问题：{topic.painPoint}
            </span>
            {topic.discussionFocus ? (
              <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                结合群内讨论：{topic.discussionFocus}
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-bold leading-6 text-ink-950">{topic.title}</h3>
          <p className="mt-1 text-xs leading-5 text-ink-600">
            话题依据：{topic.topicBrief || topic.newsAngle}
          </p>
          {topic.toneSource ? (
            <p className="mt-1 text-xs leading-5 text-ink-500">{topic.toneSource}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-radar-600"
              checked={topic.published}
              onChange={(event) => onPublishedChange(topic.id, event.target.checked)}
            />
            已发布
          </label>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-ink-800 outline-none focus:border-radar-500 focus:ring-4 focus:ring-radar-100"
            value={topic.effect}
            onChange={(event) => onEffectChange(topic.id, event.target.value)}
            aria-label="选择话题效果"
          >
            {effectOptions.map((effect) => (
              <option key={effect} value={effect}>
                效果：{effect}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <CopyableBlock
          label="可复制：学姐账号"
          icon={ShieldCheck}
          toneClass="text-radar-700"
          text={seniorText}
          copyKey={`${topic.id}-senior`}
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />
        <CopyableBlock
          label="可复制：同届学生"
          icon={MessageCircle}
          toneClass="text-sky-700"
          text={peerText}
          copyKey={`${topic.id}-peer`}
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />
        <CopyableBlock
          label="追问/补一句"
          icon={ClipboardCheck}
          toneClass="text-amber-700"
          text={followUpText}
          copyKey={`${topic.id}-follow`}
          copiedKey={copiedKey}
          onCopy={handleCopy}
        >
          {topic.quickReplies?.length > 0 ? (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-bold text-ink-600">备用短句</div>
              {topic.quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleCopy(`${topic.id}-${reply}`, reply)}
                  className="block w-full rounded-md bg-slate-50 px-2 py-2 text-left text-xs leading-5 text-ink-700 transition hover:bg-radar-50 hover:text-radar-800"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex items-start gap-2 rounded-md bg-slate-50 p-2 text-xs leading-5 text-ink-600">
            <Check size={14} className="mt-0.5 shrink-0 text-radar-600" />
            {topic.riskNote}
          </div>
        </CopyableBlock>
      </div>

      {topic.evidence?.length > 0 ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold text-ink-600">依据（聊天沉淀 / 资料 / 官网）</div>
          <div className="grid gap-2 md:grid-cols-2">
            {topic.evidence.map((source) => (
              <div key={`${source.type}-${source.title}`} className="rounded-md bg-slate-50 p-2">
                <div className="text-xs font-bold text-ink-950">
                  {source.type}：{source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-radar-700 underline-offset-2 hover:underline"
                    >
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-600">{source.note}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
