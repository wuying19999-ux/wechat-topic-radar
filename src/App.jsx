import React, { useEffect, useMemo, useState } from "react";
import DataModelPreview from "./components/DataModelPreview";
import GroupModuleCard from "./components/GroupModuleCard";
import ModuleRail from "./components/ModuleRail";
import QAPanel from "./components/QAPanel";
import TopControls from "./components/TopControls";
import TrialDataDashboard from "./components/TrialDataDashboard";
import TestingBugDashboard from "./components/TestingBugDashboard";
import { getDefaultCountryForSchool, groupModules } from "./data/sampleData";
import { answerQuestion, generateGroupDialogue, savePublishedTopic, saveTrialRecord } from "./lib/apiClient";
import { generateLocalGroupDialogues } from "./lib/localDialogueEngine";
import { loadState, saveState } from "./lib/storage";

function updateModule(state, moduleId, updater) {
  return {
    ...state,
    modules: {
      ...state.modules,
      [moduleId]: updater(state.modules[moduleId]),
    },
  };
}

function copyFromTurns(turns = []) {
  return turns
    .map((turn) => `${turn.speaker || (turn.speakerType === "senior" ? "学姐号" : "新生")}：${turn.text || ""}`)
    .join("\n");
}

function normalizeDialogueKey(dialogue) {
  const raw = dialogue.key || dialogue.copyText || copyFromTurns(dialogue.turns || []);

  return String(raw || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。、“”‘’：:；;,.!?！？（）()【】\[\]\-—_]/g, "")
    .slice(0, 260);
}

function decorateDialogues(dialogues, moduleState) {
  const existingByKey = new Map([
    ...(moduleState.dialogues || []).map((dialogue) => [normalizeDialogueKey(dialogue), dialogue]),
    ...(moduleState.publishedDialogues || []).map((dialogue) => [normalizeDialogueKey(dialogue), dialogue]),
  ]);
  const publishedKeys = new Set((moduleState.publishedDialogues || []).map(normalizeDialogueKey));

  return dialogues.map((dialogue, index) => {
    const key = normalizeDialogueKey(dialogue);
    const existing = existingByKey.get(key);

    return {
      id: dialogue.id || `${Date.now()}-${index}`,
      key,
      title: dialogue.title || `模拟对话 ${index + 1}`,
      angle: dialogue.angle || "",
      summary: dialogue.summary || "",
      copyText: dialogue.copyText || copyFromTurns(dialogue.turns || []),
      turns: dialogue.turns || [],
      followUps: dialogue.followUps || [],
      sourceNote: dialogue.sourceNote || "",
      createdAt: dialogue.createdAt || new Date().toISOString(),
      published: publishedKeys.has(key),
      publishedAt: existing?.publishedAt || "",
      effect: existing?.effect || dialogue.effect || "未选择",
    };
  });
}

function mergeTrialGroupName(names = [], name) {
  const nextName = String(name || "").trim();

  if (!nextName) {
    return names;
  }

  return [nextName, ...names.filter((item) => item !== nextName)].slice(0, 50);
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [savedLabel, setSavedLabel] = useState("已自动保存");
  const [trialRefreshKey, setTrialRefreshKey] = useState(0);
  const isAdminView =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin") === "1";

  const selectedModule = useMemo(
    () => groupModules.find((module) => module.id === state.selectedModuleId) || groupModules[0],
    [state.selectedModuleId]
  );
  const selectedModuleState = state.modules[selectedModule.id];

  useEffect(() => {
    saveState(state);
  }, [state]);

  function handleSettingsChange(nextSettings) {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...nextSettings,
        ...(nextSettings.school ? { country: getDefaultCountryForSchool(nextSettings.school) } : {}),
      },
    }));
  }

  function handleManualSave() {
    const lastSavedAt = new Date().toISOString();
    setState((current) => ({
      ...current,
      meta: {
        ...current.meta,
        lastSavedAt,
      },
    }));
    setSavedLabel("刚刚保存");
    window.setTimeout(() => setSavedLabel("已自动保存"), 1800);
  }

  function handleInputChange(field, value) {
    setState((current) =>
      updateModule(current, selectedModule.id, (moduleState) => ({
        ...moduleState,
        inputs: {
          ...moduleState.inputs,
          [field]: value,
        },
      }))
    );
  }

  async function handleGenerateDialogues() {
    const moduleId = selectedModule.id;
    const moduleSnapshot = state.modules[moduleId];

    setState((current) =>
      updateModule(current, moduleId, (moduleState) => ({
        ...moduleState,
        isGeneratingDialogue: true,
        generationError: "",
        generationNotice: "",
      }))
    );

    try {
      const localResult = generateLocalGroupDialogues({
        school: state.settings.school,
        country: state.settings.country,
        moduleId,
        moduleName: selectedModule.name,
        activity: moduleSnapshot.inputs.activity,
        timeNode: moduleSnapshot.inputs.timeNode,
        recentDiscussion: moduleSnapshot.inputs.recentDiscussion,
        publishedDialogues: moduleSnapshot.publishedDialogues || [],
      });

      setState((current) =>
        updateModule(current, moduleId, (moduleState) => ({
          ...moduleState,
          dialogues: decorateDialogues(
            localResult.dialogues?.length ? localResult.dialogues : [localResult],
            moduleState
          ),
          historyDialogues: localResult.historyDialogues || [],
          isGeneratingDialogue: true,
          generationError: "",
          generationNotice: "已先按过往聊天记录生成，DeepSeek 正在后台优化语气。",
          lastGeneratedAt: new Date().toISOString(),
        }))
      );

      try {
        const apiResult = await generateGroupDialogue({
          school: state.settings.school,
          country: state.settings.country,
          moduleId,
          moduleName: selectedModule.name,
          activity: moduleSnapshot.inputs.activity,
          timeNode: moduleSnapshot.inputs.timeNode,
          recentDiscussion: moduleSnapshot.inputs.recentDiscussion,
          publishedDialogues: moduleSnapshot.publishedDialogues || [],
        });

        setState((current) =>
          updateModule(current, moduleId, (moduleState) => ({
            ...moduleState,
            dialogues:
              !apiResult.fallbackUsed && apiResult.dialogues?.length
                ? decorateDialogues(apiResult.dialogues, moduleState)
                : moduleState.dialogues,
            historyDialogues: apiResult.historyDialogues || moduleState.historyDialogues || [],
            isGeneratingDialogue: false,
            generationError: "",
            generationNotice:
              !apiResult.fallbackUsed && apiResult.dialogues?.length
                ? "DeepSeek 已结合资料库完成优化，可直接复制使用。"
                : "模型本次未稳定返回，已保留本地真实聊天记录版本。",
            lastGeneratedAt: new Date().toISOString(),
          }))
        );
      } catch (apiError) {
        console.warn("DeepSeek dialogue enhancement failed, keeping local result:", apiError);
        setState((current) =>
          updateModule(current, moduleId, (moduleState) => ({
            ...moduleState,
            isGeneratingDialogue: false,
            generationError: "",
            generationNotice: "模型本次未稳定返回，已保留本地真实聊天记录版本。",
          }))
        );
      }
    } catch (error) {
      console.error(error);
      setState((current) =>
        updateModule(current, moduleId, (moduleState) => ({
          ...moduleState,
          isGeneratingDialogue: false,
          generationError: "本地资料库生成失败，请刷新页面后再试一次。",
        }))
      );
    }
  }

  function handleToggleDialoguePublished(dialogueId, published) {
    const dialogueToPersist = selectedModuleState.dialogues?.find((dialogue) => dialogue.id === dialogueId);

    setState((current) =>
      updateModule(current, selectedModule.id, (moduleState) => {
        const publishedAt = published ? new Date().toISOString() : "";
        const dialogues = (moduleState.dialogues || []).map((dialogue) =>
          dialogue.id === dialogueId
            ? {
                ...dialogue,
                published,
                publishedAt,
              }
            : dialogue
        );
        const targetDialogue = dialogues.find((dialogue) => dialogue.id === dialogueId);
        const publishedByKey = new Map(
          (moduleState.publishedDialogues || []).map((dialogue) => [normalizeDialogueKey(dialogue), dialogue])
        );

        if (targetDialogue && published) {
          publishedByKey.set(normalizeDialogueKey(targetDialogue), {
            ...targetDialogue,
            published,
            publishedAt,
          });
        }

        return {
          ...moduleState,
          dialogues,
          publishedDialogues: published
            ? Array.from(publishedByKey.values())
            : (moduleState.publishedDialogues || []).filter((dialogue) =>
                targetDialogue ? normalizeDialogueKey(dialogue) !== normalizeDialogueKey(targetDialogue) : true
              ),
        };
      })
    );

    if (published && dialogueToPersist) {
      savePublishedTopic({
        school: state.settings.school,
        country: state.settings.country,
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        dialogueKey: normalizeDialogueKey(dialogueToPersist),
        title: dialogueToPersist.title,
        copyText: dialogueToPersist.copyText,
        effect: dialogueToPersist.effect,
      }).catch((error) => {
        console.warn("Published topic persistence skipped:", error.message);
      });
    }
  }

  function handleDialogueEffectChange(dialogueId, effect) {
    setState((current) =>
      updateModule(current, selectedModule.id, (moduleState) => {
        const dialogues = (moduleState.dialogues || []).map((dialogue) =>
          dialogue.id === dialogueId ? { ...dialogue, effect } : dialogue
        );
        const targetDialogue = dialogues.find((dialogue) => dialogue.id === dialogueId);

        return {
          ...moduleState,
          dialogues,
          publishedDialogues: (moduleState.publishedDialogues || []).map((dialogue) =>
            targetDialogue && normalizeDialogueKey(dialogue) === normalizeDialogueKey(targetDialogue)
              ? { ...dialogue, effect }
              : dialogue
          ),
        };
      })
    );
  }

  async function handleSaveTrialRecord(dialogue, form) {
    try {
      await saveTrialRecord({
        ...form,
        school: state.settings.school,
        country: state.settings.country,
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        timeNode: selectedModuleState.inputs.timeNode,
        recentDiscussion: selectedModuleState.inputs.recentDiscussion,
        dialogueId: dialogue.id,
        dialogueKey: normalizeDialogueKey(dialogue),
        dialogueTitle: dialogue.title,
        dialogueAngle: dialogue.angle,
        copyText: dialogue.copyText,
      });

      const now = new Date().toISOString();

      setState((current) => {
        const moduleState = current.modules[selectedModule.id];
        const dialogues = (moduleState.dialogues || []).map((item) =>
          item.id === dialogue.id
            ? {
                ...item,
                published: true,
                publishedAt: item.publishedAt || now,
                effect: form.activeEffect || item.effect,
              }
            : item
        );
        const savedDialogue = dialogues.find((item) => item.id === dialogue.id);
        const publishedByKey = new Map(
          (moduleState.publishedDialogues || []).map((item) => [normalizeDialogueKey(item), item])
        );

        if (savedDialogue) {
          publishedByKey.set(normalizeDialogueKey(savedDialogue), savedDialogue);
        }

        return {
          ...current,
          meta: {
            ...current.meta,
            trialGroupNames: mergeTrialGroupName(current.meta?.trialGroupNames || [], form.postedGroupName),
          },
          modules: {
            ...current.modules,
            [selectedModule.id]: {
              ...moduleState,
              dialogues,
              publishedDialogues: Array.from(publishedByKey.values()),
            },
          },
        };
      });

      setTrialRefreshKey((current) => current + 1);
      alert("已保存到试运营数据看板。");
    } catch (error) {
      console.error(error);
      alert("试运营数据保存失败，请稍后再试。");
      throw error;
    }
  }

  function handleQuestionChange(question) {
    setState((current) => ({
      ...current,
      qa: {
        ...current.qa,
        question,
      },
    }));
  }

  async function handleGenerateAnswer() {
    setState((current) => ({
      ...current,
      qa: {
        ...current.qa,
        isGenerating: true,
        statusText: "正在检索学校资料与可用来源…",
        startedAt: Date.now(),
        error: "",
      },
    }));

    try {
      const answer = await answerQuestion({
        school: state.settings.school,
        country: state.settings.country,
        moduleId: selectedModule.id,
        moduleName: selectedModule.name,
        question: state.qa.question,
        timeNode: selectedModuleState.inputs.timeNode
      });

      setState((current) => ({
        ...current,
        qa: {
          ...current.qa,
          seniorAnswer: answer.seniorAnswer,
          peerAnswer: answer.peerAnswer,
          followUp: answer.followUp,
          riskNote: answer.riskNote,
          evidence: answer.evidence || [],
          provider: answer.provider || "",
          searchMode: answer.searchMode || "knowledge",
          isGenerating: false,
          statusText: answer.fallbackUsed
            ? "模型未稳定返回，已使用资料库回答。"
            : answer.searchMode === "live"
              ? "已完成实时检索与双口吻改写。"
              : "已完成资料库检索与双口吻改写。",
          completedAt: Date.now(),
          error: "",
        }
      }));
    } catch (error) {
      console.error(error);
      setState((current) => ({
        ...current,
        qa: {
          ...current.qa,
          isGenerating: false,
          statusText: "这次没有生成成功，请再试一次。",
          error: error.message || "生成失败",
        },
      }));
    }
  }

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <TopControls
        settings={state.settings}
        onChange={handleSettingsChange}
        onSave={handleManualSave}
        savedLabel={savedLabel}
      />

      {isAdminView ? (
        <div className="mx-auto mt-5 grid w-full max-w-[1500px] gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <TrialDataDashboard refreshKey={trialRefreshKey} />
          <TestingBugDashboard />
        </div>
      ) : null}

      <main className="mx-auto mt-5 grid min-w-0 w-full max-w-[1500px] gap-5 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <ModuleRail
          selectedModuleId={state.selectedModuleId}
          modules={state.modules}
          onSelect={(moduleId) => setState((current) => ({ ...current, selectedModuleId: moduleId }))}
        />

        <div className="min-w-0 space-y-5">
          <GroupModuleCard
            module={selectedModule}
            moduleState={selectedModuleState}
            settings={state.settings}
            onInputChange={handleInputChange}
            onGenerateDialogues={handleGenerateDialogues}
            onToggleDialoguePublished={handleToggleDialoguePublished}
            onDialogueEffectChange={handleDialogueEffectChange}
            onSaveTrialRecord={handleSaveTrialRecord}
            trialGroupNames={state.meta?.trialGroupNames || []}
          />
        </div>

        <div className="min-w-0 space-y-5">
          <QAPanel
            qa={state.qa}
            module={selectedModule}
            settings={state.settings}
            onQuestionChange={handleQuestionChange}
            onGenerateAnswer={handleGenerateAnswer}
          />
          <DataModelPreview state={state} />
        </div>
      </main>
    </div>
  );
}
