// state.js

import { DEMO_TASKS, DEMO_LAP_LIST } from "./demo-data.js";

export const state = {
  tasks: (JSON.parse(localStorage.getItem("tasks")) || []).map((t) => ({
    ...t,
    lapInterval: t.lapInterval || 1,
    growthFactor: t.growthFactor !== undefined ? t.growthFactor : 0,
    maxOccurrences: t.maxOccurrences || 0,
  })),
  lapList: JSON.parse(localStorage.getItem("lapList")) || [],
  lastId: JSON.parse(localStorage.getItem("lastId")) || 0,
  sortState: { field: "id", order: "desc" },
  selectedCategoryId: "cat-0",
  editingTaskId: null,
  panelCollapseState:
    JSON.parse(localStorage.getItem("panelCollapseState")) || {},
  draggedItemId: null,
  runnerState: "STOPPED",
  currentVirtualTaskIndex: -1,
  sessionCache: { completedOccurrencesMap: new Map(), virtualSessionPlaylist: [] },
};

export const saveState = () => {
  localStorage.setItem("tasks", JSON.stringify(state.tasks));
  localStorage.setItem("lapList", JSON.stringify(state.lapList));
  localStorage.setItem("lastId", JSON.stringify(state.lastId));
};
