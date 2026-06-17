import { MessagesSquare, RefreshCw, Send, Sparkles } from "lucide-react";
import React from "react";

function ChatBubble({ turn, index }) {
  const isSenior = turn.speaker.includes("学姐");
  return (
    <div className={`flex ${isSenior ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[84%] rounded-md border px-3 py-2 ${
          isSenior
            ? "border-radar-100 bg-radar-50 text-ink-800"
            : "border-slate-200 bg-white text-ink-800"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-ink-500">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-ink-950 text-white">
            {index + 1}
          </span>
          {turn.speaker}
        </div>
        <p className="text-sm leading-6">{turn.text}</p>
      </div>
    </div>
  );
}

export default function ConversationPanel({
  conversation,
  settings,
  selectedTimeNode,
  onPromptChange,
  onGenerateConversation,
  onUseExample,
}) {
  const result = conversation.result;

  return (
    <section className="panel p-5" data-testid="conversation-panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-ink-950">
            <MessagesSquare size={18} />
            真实群聊对话生成
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-600">
            输入“格拉6月 / KCL 6月签证 / 杜伦6月机票”这类短句，会优先调用聊天记录沉淀库生成有来回的群聊脚本。
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUseExample("格拉6月")}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-ink-700 transition hover:border-radar-200 hover:text-radar-700"
        >
          <RefreshCw size={14} />
          试试格拉6月
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
        <label>
          <span className="field-label">学校 + 月份 / 场景</span>
          <input
            className="field-control"
            value={conversation.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder={`例如：${settings.school} 6月 宿舍`}
            data-testid="conversation-prompt-input"
          />
        </label>
        <button
          type="button"
          onClick={onGenerateConversation}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-radar-700 px-4 text-sm font-bold text-white transition hover:bg-radar-800 focus:outline-none focus:ring-4 focus:ring-radar-100"
          data-testid="conversation-generate-button"
        >
          <Sparkles size={16} />
          生成对话
        </button>
      </div>

      {result ? (
        <div className="mt-5 space-y-4" data-testid="conversation-result">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-600">
              <span className="rounded bg-white px-2 py-1 text-radar-700">识别：{result.school}</span>
              <span className="rounded bg-white px-2 py-1 text-sky-700">{result.month}</span>
              <span className="rounded bg-white px-2 py-1 text-ink-700">依据 {result.evidence.length} 条沉淀记录</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-700">{result.summary}</p>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold text-ink-600">高频话题</div>
            <div className="flex flex-wrap gap-2">
              {result.hotTopics.map((topic) => (
                <span key={topic} className="rounded bg-radar-50 px-2.5 py-1 text-xs font-bold text-radar-800">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-ink-600">
                <Send size={14} />
                可直接发群里的话题
              </div>
              <div className="space-y-3">
                {result.topicIdeas.slice(0, 4).map((idea) => (
                  <div key={`${idea.source}-${idea.title}`} className="border-l-2 border-radar-300 pl-3">
                    <div className="text-sm font-bold leading-6 text-ink-950">{idea.title}</div>
                    <div className="mt-1 text-xs leading-5 text-ink-500">{idea.source}</div>
                    <div className="mt-1 text-xs leading-5 text-ink-600">追问：{idea.chase}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3">
              <div className="mb-2 text-xs font-bold text-ink-600">真实语气锚点</div>
              <div className="space-y-2">
                {result.voiceAnchors.map((anchor) => (
                  <div key={anchor} className="rounded bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-700">
                    “{anchor}”
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result.conversations.map((conversationBlock) => (
            <div key={conversationBlock.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 text-sm font-bold text-ink-950">{conversationBlock.title}</div>
              <div className="space-y-3">
                {conversationBlock.turns.map((turn, index) => (
                  <ChatBubble key={`${turn.speaker}-${turn.text}`} turn={turn} index={index} />
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-bold text-ink-600">本次使用的聊天记录依据</div>
            <div className="grid gap-2 md:grid-cols-2">
              {result.evidence.map((item) => (
                <div key={item.id} className="rounded bg-slate-50 p-2">
                  <div className="text-xs font-bold text-ink-950">
                    {item.dateLabel} · {item.category}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs leading-5 text-ink-500">
            当前页面是前端语料演示版；后续接入模型后，可把这些沉淀记录作为 RAG 依据，再由 OpenAI / Claude / DeepSeek 生成更细的实时回答。
            当前时间节点：{selectedTimeNode}
          </p>
        </div>
      ) : null}
    </section>
  );
}
