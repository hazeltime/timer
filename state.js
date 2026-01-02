// state.js

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

const STORAGE_SCHEMA = {
  tasks: { key: "tasks", fallback: [], persist: true },
  lapList: { key: "lapList", fallback: [], persist: true },
  lastId: { key: "lastId", fallback: 0, persist: true },
  panelCollapseState: { key: "panelCollapseState", fallback: {}, persist: false },
};

const loadStorage = (schema) =>
  Object.fromEntries(
    Object.entries(schema).map(([prop, config]) => [
      prop,
      safeParse(config.key, config.fallback),
    ]),
  );

const storedState = loadStorage(STORAGE_SCHEMA);

export const state = {
  tasks: storedState.tasks.map((t) => ({
    ...t,
    lapInterval: t.lapInterval || 1,
    growthFactor: t.growthFactor !== undefined ? t.growthFactor : 0,
    maxOccurrences: t.maxOccurrences || 0,
  })),
  lapList: storedState.lapList,
  lastId: storedState.lastId,
  sortState: { field: "id", order: "desc" },
  selectedCategoryId: "cat-0",
  editingTaskId: null,
  panelCollapseState: storedState.panelCollapseState,
  draggedItemId: null,
  runnerState: "STOPPED",
  currentVirtualTaskIndex: -1,
  sessionCache: {
    completedOccurrencesMap: new Map(),
    virtualSessionPlaylist: [],
  },
};

export const saveState = () => {
  Object.entries(STORAGE_SCHEMA).forEach(([prop, config]) => {
    if (!config.persist) return;
    localStorage.setItem(config.key, JSON.stringify(state[prop]));
  });
};
