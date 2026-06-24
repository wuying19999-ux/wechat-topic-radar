import {
  activityOptions,
  getDefaultCountryForSchool,
  groupModules,
  initialPublishedTopics,
  getTimeNodeOptionsForModule,
  schools,
} from "../data/sampleData";
import { generateChatConversation } from "./chatConversationEngine";
import { createSeedTopics } from "./topicEngine";

export const STORAGE_KEY = "wechat-topic-radar-demo-v11";

export function createInitialState() {
  const modules = Object.fromEntries(
    groupModules.map((module) => {
      const topics = createSeedTopics(module.id, initialPublishedTopics[module.id] || []);
      const moduleTimeNodeOptions = getTimeNodeOptionsForModule(module.id);

      return [
        module.id,
        {
          inputs: {
            activity: activityOptions[1],
            timeNode: moduleTimeNodeOptions[0],
            recentDiscussion: "",
          },
          dialogue: null,
          dialogues: [],
          publishedDialogues: [],
          historyDialogues: [],
          isGeneratingDialogue: false,
          generationError: "",
          generationNotice: "",
          topics,
          publishedArchive: topics
            .filter((topic) => topic.published)
            .map((topic) => ({
              id: topic.id,
              title: topic.title,
              blueprintKey: topic.blueprintKey,
              seniorCopy: topic.seniorCopy || topic.seniorVoice || "",
              peerCopy: topic.peerCopy || topic.peerVoice || "",
              followUpCopy: topic.followUpCopy || topic.followUp || "",
              effect: topic.effect,
              publishedAt: topic.publishedAt,
            })),
          lastGeneratedAt: "",
        },
      ];
    })
  );

  return {
    settings: {
      school: schools[0],
      country: getDefaultCountryForSchool(schools[0]),
    },
    selectedModuleId: groupModules[0].id,
    modules,
    qa: {
      question: "语言班群里有人问：现在还没找到室友，会不会太晚了？",
      seniorAnswer:
        "不算晚，可以先把预算、入住时间、想住区域发出来。群里有同时间到的同学，一般就能接上一起看。",
      peerAnswer:
        "我也还没完全定。我准备直接发：预算____，想住____附近，入住时间____，能不能接受合租____。有没有同样语言班/同时间到的同学一起看一下？",
      isGenerating: false,
      statusText: "",
      startedAt: 0,
      completedAt: 0,
      provider: "",
      searchMode: "knowledge",
      error: "",
    },
    conversation: {
      prompt: "格拉6月",
      result: generateChatConversation({
        prompt: "格拉6月",
        selectedSchool: "格拉斯哥大学",
        selectedTimeNode: "6月：押金、宿舍、语言班确认",
      }),
    },
    meta: {
      lastSavedAt: "",
      storageVersion: 4,
      trialGroupNames: [],
      futureAdapters: ["Google Sheets", "Supabase", "Firebase"],
    },
  };
}

function normalizeStoredModules(initialModules, storedModules = {}) {
  return Object.fromEntries(
    groupModules.map((module) => {
      const initialModuleState = initialModules[module.id];
      const storedModuleState = storedModules[module.id] || {};
      const topics = storedModuleState.topics || initialModuleState.topics;
      const topicsByTitle = new Map(topics.map((topic) => [topic.title, topic]));
      const moduleTimeNodeOptions = getTimeNodeOptionsForModule(module.id);
      const storedInputs = storedModuleState.inputs || {};
      const storedTimeNode = storedInputs.timeNode;
      const timeNode = moduleTimeNodeOptions.includes(storedTimeNode)
        ? storedTimeNode
        : initialModuleState.inputs.timeNode;

      return [
        module.id,
        {
          ...initialModuleState,
          ...storedModuleState,
          topics,
          dialogues: storedModuleState.dialogues || (storedModuleState.dialogue ? [storedModuleState.dialogue] : []),
          publishedDialogues: storedModuleState.publishedDialogues || [],
          historyDialogues: storedModuleState.historyDialogues || [],
          inputs: {
            ...initialModuleState.inputs,
            ...storedInputs,
            timeNode,
          },
          publishedArchive: (storedModuleState.publishedArchive || initialModuleState.publishedArchive).map(
            (archived) => ({
              ...archived,
              blueprintKey: archived.blueprintKey || topicsByTitle.get(archived.title)?.blueprintKey || archived.title,
            })
          ),
        },
      ];
    })
  );
}

export function loadState() {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw);
    const initial = createInitialState();
    const nextSchool = schools.includes(parsed.settings?.school) ? parsed.settings.school : initial.settings.school;
    const nextCountry = parsed.settings?.country || getDefaultCountryForSchool(nextSchool);

    return {
      ...createInitialState(),
      ...parsed,
      settings: {
        ...initial.settings,
        ...(parsed.settings || {}),
        school: nextSchool,
        country: nextCountry,
      },
      modules: normalizeStoredModules(initial.modules, parsed.modules),
      qa: {
        ...initial.qa,
        ...(parsed.qa || {}),
      },
      conversation: {
        ...initial.conversation,
        ...(parsed.conversation || {}),
      },
      meta: {
        ...initial.meta,
        ...(parsed.meta || {}),
      },
    };
  } catch (error) {
    console.warn("Failed to load topic radar state", error);
    return createInitialState();
  }
}

export function saveState(state) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
