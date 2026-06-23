import {
  AlertCircle,
  Check,
  ClipboardList,
  Copy,
  History,
  MessageSquareText,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";
import { activityOptions, effectOptions, getTimeNodeOptionsForModule } from "../data/sampleData";
import { schoolKnowledge } from "../data/schoolKnowledge";

function DialogueBubble({ turn, index }) {
  const isSenior = turn.speakerType === "senior" || turn.speaker?.includes("学姐");

  return (
    <div className={`flex ${isSenior ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-md border px-3 py-2 ${
          isSenior
            ? "border-radar-100 bg-radar-50 text-ink-800"
            : "border-slate-200 bg-white text-ink-800"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-ink-500">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-ink-950 text-white">
            {index + 1}
          </span>
          <span>{turn.speaker || (isSenior ? "学姐号" : "新生")}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              isSenior ? "bg-radar-100 text-radar-800" : "bg-slate-100 text-ink-600"
            }`}
          >
            {isSenior ? "学姐" : "新生"}
          </span>
        </div>
        <p className="whitespace-pre-line text-sm leading-6">{turn.text}</p>
      </div>
    </div>
  );
}

function EmptyDialogueState({ moduleName }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-ink-600">
      选择左侧的 {moduleName}，填写当前时间节点，再点击“生成模拟对话”。
      如果不填最近群内讨论，会一次生成 3 组不同角度的群聊脚本；如果填了具体问题，会只围绕这个问题生成 1 组。
    </div>
  );
}

function getDialogueCounts(turns) {
  const seniorCount = turns.filter(
    (turn) => turn.speakerType === "senior" || turn.speaker?.includes("学姐")
  ).length;

  return {
    seniorCount,
    studentCount: turns.length - seniorCount,
  };
}

function DialogueCard({
  dialogue,
  index,
  copied,
  onCopy,
  onTogglePublished,
  onEffectChange,
  onSaveTrialRecord,
  trialGroupNames,
}) {
  const [showRecordForm, setShowRecordForm] = useState(false);
  const turns = dialogue.turns || [];
  const { seniorCount, studentCount } = getDialogueCounts(turns);

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-2 text-sm font-bold text-ink-950">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-ink-950 text-xs text-white">
              {index + 1}
            </span>
            <MessageSquareText size={17} />
            <span className="min-w-0 whitespace-normal leading-6 [overflow-wrap:anywhere] [word-break:normal]">
              {dialogue.title}
            </span>
          </div>
          <p className="mt-2 min-w-0 text-sm leading-6 text-ink-600 [overflow-wrap:anywhere] [word-break:normal]">
            {dialogue.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded bg-radar-50 px-2 py-1 text-radar-800">{turns.length} 回合</span>
            <span className="rounded bg-amber-50 px-2 py-1 text-amber-800">学姐 {seniorCount}</span>
            <span className="rounded bg-sky-50 px-2 py-1 text-sky-800">新生 {studentCount}</span>
            {dialogue.angle ? (
              <span className="rounded bg-slate-50 px-2 py-1 text-ink-600">角度：{dialogue.angle}</span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-ink-700">
            <input
              type="checkbox"
              checked={Boolean(dialogue.published)}
              onChange={(event) => onTogglePublished(dialogue.id, event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-radar-600 focus:ring-radar-500"
            />
            已发布
          </label>

          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-ink-700 outline-none transition focus:border-radar-500 focus:ring-4 focus:ring-radar-100"
            value={dialogue.effect || "未选择"}
            onChange={(event) => onEffectChange(dialogue.id, event.target.value)}
          >
            {effectOptions.map((effect) => (
              <option key={effect} value={effect}>
                活跃效果：{effect}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onCopy(dialogue)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-ink-700 transition hover:border-radar-200 hover:text-radar-700"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "已复制" : "复制整段"}
          </button>
        </div>
      </div>

      {dialogue.sourceNote ? (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-600">
          {dialogue.sourceNote}
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-3">
          {turns.map((turn, turnIndex) => (
            <DialogueBubble key={`${dialogue.id}-${turn.speaker}-${turnIndex}`} turn={turn} index={turnIndex} />
          ))}
        </div>
      </div>

      {dialogue.followUps?.length ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold text-ink-600">后续可补一句</div>
          <div className="grid gap-2 md:grid-cols-2">
            {dialogue.followUps.map((line) => (
              <div key={line} className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-ink-700">
                {line}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setShowRecordForm((current) => !current)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-100 px-3 text-sm font-bold text-ink-700 transition hover:bg-radar-50 hover:text-radar-800"
        >
          <ClipboardList size={15} />
          {showRecordForm ? "收起试运营记录" : "记录试运营"}
        </button>

        {showRecordForm ? (
          <TrialRecordForm
            dialogue={dialogue}
            groupNameOptions={trialGroupNames}
            onSave={async (form) => {
              await onSaveTrialRecord(dialogue, form);
              setShowRecordForm(false);
            }}
          />
        ) : null}
      </div>
    </article>
  );
}

function TrialRecordForm({ dialogue, onSave, groupNameOptions = [] }) {
  const groupNameListId = `group-name-list-${dialogue.id}`;
  const [form, setForm] = useState({
    operatorName: "",
    postedGroupName: "",
    groupSize: "",
    postedAt: new Date().toISOString().slice(0, 16),
    replyCount: "",
    activeEffect: dialogue.effect || "未选择",
    editLevel: "直接使用",
    qualityScore: "4",
    riskStatus: "无",
    riskNote: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="field-label">员工/账号</span>
          <input
            className="field-control"
            value={form.operatorName}
            onChange={(event) => update("operatorName", event.target.value)}
            placeholder="可填昵称"
          />
        </label>
        <label>
          <span className="field-label">发布群名</span>
          <input
            className="field-control"
            list={groupNameListId}
            value={form.postedGroupName}
            onChange={(event) => update("postedGroupName", event.target.value)}
            placeholder="可输入新群，或选择历史群名"
          />
          <datalist id={groupNameListId}>
            {groupNameOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="field-label">群人数</span>
          <input
            className="field-control"
            type="number"
            min="0"
            value={form.groupSize}
            onChange={(event) => update("groupSize", event.target.value)}
            placeholder="可空"
          />
        </label>
        <label>
          <span className="field-label">发布时间</span>
          <input
            className="field-control"
            type="datetime-local"
            value={form.postedAt}
            onChange={(event) => update("postedAt", event.target.value)}
          />
        </label>
        <label>
          <span className="field-label">回复数</span>
          <input
            className="field-control"
            type="number"
            min="0"
            value={form.replyCount}
            onChange={(event) => update("replyCount", event.target.value)}
          />
        </label>
        <label>
          <span className="field-label">活跃效果</span>
          <select
            className="field-control"
            value={form.activeEffect}
            onChange={(event) => update("activeEffect", event.target.value)}
          >
            {effectOptions.map((effect) => (
              <option key={effect} value={effect}>
                {effect}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">修改程度</span>
          <select
            className="field-control"
            value={form.editLevel}
            onChange={(event) => update("editLevel", event.target.value)}
          >
            <option>直接使用</option>
            <option>小改后使用</option>
            <option>大改后使用</option>
            <option>未使用</option>
          </select>
        </label>
        <label>
          <span className="field-label">质量评分</span>
          <select
            className="field-control"
            value={form.qualityScore}
            onChange={(event) => update("qualityScore", event.target.value)}
          >
            <option value="5">5 很好</option>
            <option value="4">4 可用</option>
            <option value="3">3 一般</option>
            <option value="2">2 较差</option>
            <option value="1">1 不可用</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
        <label>
          <span className="field-label">风险情况</span>
          <select
            className="field-control"
            value={form.riskStatus}
            onChange={(event) => update("riskStatus", event.target.value)}
          >
            <option>无</option>
            <option>事实待核实</option>
            <option>语气不合适</option>
            <option>群友质疑</option>
            <option>其他</option>
          </select>
        </label>
        <label>
          <span className="field-label">风险/备注</span>
          <input
            className="field-control"
            value={form.riskNote}
            onChange={(event) => update("riskNote", event.target.value)}
            placeholder="例如：学校政策需复核 / 群友觉得太官方"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="field-label">补充备注</span>
        <textarea
          className="field-control min-h-[74px] resize-y"
          value={form.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="可填群里真实反馈、员工感受、下次优化方向"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-wait disabled:bg-slate-400"
      >
        <Save size={16} />
        {saving ? "保存中..." : "保存到试运营看板"}
      </button>
    </form>
  );
}

function HistoryDialogues({ historyDialogues }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-950">
        <History size={17} />
        历年真实对话
      </div>

      {historyDialogues?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {historyDialogues.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-700">
                <span className="rounded bg-white px-2 py-1">{item.sourceTitle}</span>
                <span className="rounded bg-white px-2 py-1">匹配度 {item.score}</span>
              </div>
              <p className="line-clamp-6 text-xs leading-5 text-ink-600">{item.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-ink-600">
          生成一次模拟对话后，这里会自动拉取该学校上传过的聊天记录沉淀片段，方便团队找历史真实语气和话题切口。
        </p>
      )}
    </section>
  );
}

export default function GroupModuleCard({
  module,
  moduleState,
  settings,
  onInputChange,
  onGenerateDialogues,
  onToggleDialoguePublished,
  onDialogueEffectChange,
  onSaveTrialRecord,
  trialGroupNames,
}) {
  const [copiedId, setCopiedId] = useState("");
  const knowledge = schoolKnowledge[settings.school] || schoolKnowledge.UCL;
  const dialogues = moduleState.dialogues?.length
    ? moduleState.dialogues
    : moduleState.dialogue
      ? [moduleState.dialogue]
      : [];
  const publishedCount = moduleState.publishedDialogues?.length || 0;
  const timeNodeOptions = getTimeNodeOptionsForModule(module.id);
  const timeNodeLabel = module.id === "ai-safety" ? "当前学习节点" : "当前时间节点";

  async function handleCopyDialogue(dialogue) {
    if (!dialogue?.copyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(dialogue.copyText);
      setCopiedId(dialogue.id);
      window.setTimeout(() => setCopiedId(""), 1400);
    } catch (error) {
      console.warn("Copy failed", error);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-radar-700">
              {settings.school} · {settings.country}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink-950">{module.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">{module.description}</p>
            <p className="mt-2 max-w-3xl rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-600">
              当前资料库：{knowledge.docSource}。{knowledge.brief}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-600">
            <strong className="text-ink-950">模块独立记忆：</strong>
            已发布 {publishedCount} 段；本模块下次生成会避开一模一样的对话，其他群模块不受影响。
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-[160px_260px_1fr_auto]">
          <label>
            <span className="field-label">群活跃度</span>
            <select
              className="field-control"
              value={moduleState.inputs.activity}
              onChange={(event) => onInputChange("activity", event.target.value)}
            >
              {activityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">{timeNodeLabel}</span>
            <select
              className="field-control"
              value={moduleState.inputs.timeNode}
              onChange={(event) => onInputChange("timeNode", event.target.value)}
            >
              {timeNodeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">最近群内讨论（可空）</span>
            <input
              className="field-control"
              value={moduleState.inputs.recentDiscussion}
              onChange={(event) => onInputChange("recentDiscussion", event.target.value)}
              placeholder="留空会生成 3 组；填写后只围绕这个问题生成 1 组"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={onGenerateDialogues}
              disabled={moduleState.isGeneratingDialogue}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-radar-600 px-4 text-sm font-bold text-white transition hover:bg-radar-700 focus:outline-none focus:ring-4 focus:ring-radar-100"
            >
              <Sparkles size={16} />
              {moduleState.isGeneratingDialogue ? "生成中..." : "生成模拟对话"}
            </button>
            <button
              type="button"
              onClick={onGenerateDialogues}
              disabled={moduleState.isGeneratingDialogue}
              className="icon-button"
              aria-label="重新生成模拟对话"
              title="重新生成模拟对话"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-slate-50/70 p-5">
        {moduleState.generationNotice ? (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
            <AlertCircle size={17} className="mt-1 shrink-0" />
            <span>{moduleState.generationNotice}</span>
          </div>
        ) : null}

        {moduleState.generationError ? (
          <div className="flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-700">
            <AlertCircle size={17} className="mt-1 shrink-0" />
            <span>{moduleState.generationError}</span>
          </div>
        ) : null}

        {dialogues.length ? (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink-600">
              <ClipboardList size={15} />
              本次生成 {dialogues.length} 组；每组都可以单独复制、标记已发布、记录活跃效果。
            </div>

            {dialogues.map((dialogue, index) => (
              <DialogueCard
                key={dialogue.id}
                dialogue={dialogue}
                index={index}
                copied={copiedId === dialogue.id}
                onCopy={handleCopyDialogue}
                onTogglePublished={onToggleDialoguePublished}
                onEffectChange={onDialogueEffectChange}
                onSaveTrialRecord={onSaveTrialRecord}
                trialGroupNames={trialGroupNames}
              />
            ))}
          </>
        ) : (
          <EmptyDialogueState moduleName={module.name} />
        )}

        <HistoryDialogues historyDialogues={moduleState.historyDialogues || []} />
      </div>
    </section>
  );
}
