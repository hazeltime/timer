// state.js

import { DEMO_TASKS, DEMO_LAP_LIST } from "./demo-data.js";

// Helper to safely parse JSON with a default fallback
const safeParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error parsing ${key} from localStorage, using fallback.`, e);
    return fallback;
  }
};

export const state = {
  tasks: safeParse("tasks", []).map((t) => ({
    ...t,
    lapInterval: t.lapInterval || 1,
    growthFactor: t.growthFactor !== undefined ? t.growthFactor : 0,
    maxOccurrences: t.maxOccurrences || 0,
  })),
  lapList: safeParse("lapList", []),
  lastId: safeParse("lastId", 0),
  sortState: { field: "id", order: "desc" },
  selectedCategoryId: "cat-0",
  editingTaskId: null,
  panelCollapseState: safeParse("panelCollapseState", {}),
  draggedItemId: null,
  runnerState: "STOPPED",
  currentVirtualTaskIndex: -1,
  sessionCache: {
    completedOccurrencesMap: new Map(),
    virtualSessionPlaylist: [],
  },
};

export const saveState = () => {
  localStorage.setItem("tasks", JSON.stringify(state.tasks));
  localStorage.setItem("lapList", JSON.stringify(state.lapList));
  localStorage.setItem("lastId", JSON.stringify(state.lastId));
};
