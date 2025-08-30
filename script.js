// script.js
import {
  CATEGORIES,
  categoryMap,
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS,
} from "./constants.js";
import * as UI from "./ui.js";
import { DEMO_TASKS, DEMO_LAP_LIST } from "./demo-data.js";

/**
 * Fetches HTML for all components and injects them into the main document.
 * This function must complete before the rest of the application logic runs.
 */
const loadHTMLComponents = async () => {
  const components = [
    { id: "#header-placeholder", url: "components/header.html" },
    { id: "#form-view-placeholder", url: "components/form-view.html" },
    {
      id: "#repository-view-placeholder",
      url: "components/repository-view.html",
    },
    { id: "#runner-view-placeholder", url: "components/runner-view.html" },
    { id: "#playlist-view-placeholder", url: "components/playlist-view.html" },
    { id: "#modal-placeholder", url: "components/modal.html" },
  ];

  try {
    const responses = await Promise.all(
      components.map((comp) => fetch(comp.url).then((res) => res.text()))
    );

    responses.forEach((html, index) => {
      const { id } = components[index];
      const placeholder = document.querySelector(id);
      if (placeholder) {
        placeholder.outerHTML = html;
      } else {
        console.error(`Placeholder with ID ${id} not found.`);
      }
    });
  } catch (error) {
    console.error("Failed to load HTML components:", error);
    document.body.innerHTML =
      "<p>Error loading application components. Please try again later.</p>";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // Load all HTML modules before initializing the application
  await loadHTMLComponents();

  // The rest of the application logic starts only after the await above is complete
  const { $$, $ } = UI;

  // ----------------------
  // DOM Elements
  // ----------------------
  const DOM = {
    taskForm: $("#task-form"),
    formTitle: $("#form-title"),
    taskInput: $("#task-input"),
    taskDescriptionInput: $("#task-description-input"),
    categoryGrid: $("#category-grid"),
    durationMinutesInput: $("#task-duration-minutes"),
    durationSecondsInput: $("#task-duration-seconds"),
    lapIntervalInput: $("#lap-interval-input"),
    growthFactorInput: $("#growth-factor-input"),
    maxOccurrencesInput: $("#max-occurrences-input"),
    addTaskBtn: $("#add-task-btn"),
    cancelEditBtn: $("#cancel-edit-btn"),
    taskListEl: $("#task-list"),
    lapListEl: $("#lap-list"),
    lapListDurationEl: $("#lap-list-duration"),
    themeToggleBtn: $("#theme-toggle-btn"),
    settingsBtn: $("#settings-btn"),
    deleteAllBtn: $("#delete-all-btn"),
    addAllBtn: $("#add-all-btn"),
    clearLapListBtn: $("#clear-lap-list-btn"),
    confirmModal: $("#confirm-modal"),
    modalTitle: $("#modal-title"),
    modalText: $("#modal-text"),
    modalCancelBtn: $("#modal-cancel-btn"),
    modalConfirmBtn: $("#modal-confirm-btn"),
    taskSummaryEl: $("#task-summary"),
    resetAppBtn: $("#reset-app-btn"),
    globalCollapseBtn: $("#global-collapse-btn"),
    globalExpandBtn: $("#global-expand-btn"),
    popoutRunnerBtn: $("#popout-runner-btn"),
    runnerTaskCategory: $("#runner-task-category"),
    runnerTaskTitle: $("#runner-task-title"),
    taskProgressBar: $("#task-progress-bar"),
    taskPercentage: $("#task-percentage"),
    timeElapsedEl: $("#time-elapsed"),
    timeRemainingEl: $("#time-remaining"),
    prevTaskBtn: $("#prev-task-btn"),
    playPauseBtn: $("#play-pause-btn"),
    nextTaskBtn: $("#next-task-btn"),
    runnerDetails: {
      baseDuration: $("#runner-base-duration"),
      currentDuration: $("#runner-current-duration"),
      occurrenceCount: $("#runner-occurrence-count"),
      changePercentage: $("#runner-change-percentage"),
      changeDelta: $("#runner-change-delta"),
      sessionTotal: $("#runner-session-total"),
    },
    lapsControls: $(".laps-controls"),
    sessionControls: $("#session-controls"),
    lapsInput: $("#laps-input"),
    stopLapsBtn: $("#stop-laps-btn"),
    restartLapsBtn: $("#restart-laps-btn"),
    prevLapBtn: $("#prev-lap-btn"),
    nextLapBtn: $("#next-lap-btn"),
    lapsProgressContainer: $("#laps-progress-container"),
    lapsProgressLabel: $("#laps-progress-label"),
    lapProgressBar: $("#lap-progress-bar"),
    lapPercentage: $("#lap-percentage"),
    lapTimeElapsedEl: $("#lap-time-elapsed"),
    lapTimeRemainingEl: $("#lap-time-remaining"),
    sessionProgressBar: $("#session-progress-bar"),
    sessionPercentage: $("#session-percentage"),
    sessionTimeElapsedEl: $("#session-time-elapsed"),
    sessionTimeRemainingEl: $("#session-time-remaining"),
    noTasksMessage: $("#no-tasks-message"),
  };

  // ----------------------
  // Application State
  // ----------------------
  const state = {
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
    sessionInterval: null,
    runnerState: "STOPPED",
    currentVirtualTaskIndex: -1,
    currentTaskTimeLeft: 0,
    confirmCallback: null,
    draggedItemId: null,
    sessionCache: {
      taskMap: new Map(),
      virtualSessionPlaylist: [],
      lapDurations: [],
      cumulativeSessionDurations: [],
      lapStartCumulativeDurations: [],
      activeLapMap: new Map(),
      totalActiveLaps: 0,
      totalLaps: 1,
      totalTaskOccurrencesMap: new Map(),
      completedTaskDurationsMap: new Map(),
      completedOccurrencesMap: new Map(),
    },
  };

  // --- UTILS ---
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ----------------------
  // State Management
  // ----------------------
  const saveState = () => {
    localStorage.setItem("tasks", JSON.stringify(state.tasks));
    localStorage.setItem("lapList", JSON.stringify(state.lapList));
    localStorage.setItem("lastId", JSON.stringify(state.lastId));
  };

  const isSessionActive = () => state.runnerState !== "STOPPED";

  const getTaskMap = () => new Map(state.tasks.map((t) => [t.id, t]));

  const sortTasks = (list) => {
    const order = state.sortState.order === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (state.sortState.field) {
        case "title":
          return a.title.localeCompare(b.title) * order;
        case "duration":
          return (a.duration - b.duration) * order;
        case "category":
          return (
            (categoryMap.get(a.categoryId)?.name || "").localeCompare(
              categoryMap.get(b.categoryId)?.name || ""
            ) * order
          );
        case "lapInterval":
          return ((a.lapInterval || 1) - (b.lapInterval || 1)) * order;
        case "maxOccurrences":
          return ((a.maxOccurrences || 0) - (b.maxOccurrences || 0)) * order;
        case "growthFactor":
          return ((a.growthFactor || 0) - (b.growthFactor || 0)) * order;
        default:
          return (a.id - b.id) * order;
      }
    });
  };

  const renderAll = () => {
    const sortedTasks = sortTasks(state.tasks);
    UI.renderTasks(DOM, sortedTasks, state.sortState);
    UI.renderLapList(DOM, state);
    UI.renderCategoryButtons(DOM, state.selectedCategoryId);
  };

  const updateSort = (field) => {
    state.sortState.order =
      state.sortState.field === field && state.sortState.order === "asc"
        ? "desc"
        : "asc";
    state.sortState.field = field;
    UI.updateSortHeaders(state.sortState);
    const sortedTasks = sortTasks(state.tasks);
    UI.renderTasks(DOM, sortedTasks, state.sortState);
  };

  // ----------------------
  // Core Logic
  // ----------------------

  const resetTaskForm = () => {
    state.editingTaskId = null;
    state.selectedCategoryId = "cat-0";
    UI.resetTaskFormUI(DOM);
    UI.renderCategoryButtons(DOM, state.selectedCategoryId);
  };

  const handleTaskFormSubmit = () => {
    const title = DOM.taskInput.value.trim();
    if (!title) {
      alert("Task title cannot be empty.");
      return;
    }
    const minutes = parseInt(DOM.durationMinutesInput.value, 10) || 0;
    const seconds = parseInt(DOM.durationSecondsInput.value, 10) || 0;
    const totalDuration = minutes * 60 + seconds;
    const lapInterval = clamp(
      parseInt(DOM.lapIntervalInput.value, 10) || 1,
      1,
      99
    );
    const growthFactor = clamp(
      parseInt(DOM.growthFactorInput.value, 10) || 0,
      -99,
      99
    );
    const maxOccurrences = clamp(
      parseInt(DOM.maxOccurrencesInput.value, 10) || 0,
      0,
      999
    );
    if (totalDuration <= 0) {
      alert("Duration must be greater than 0 seconds.");
      return;
    }
    if (state.editingTaskId !== null) {
      const task = state.tasks.find((t) => t.id === state.editingTaskId);
      if (task) {
        task.title = title;
        task.description = DOM.taskDescriptionInput.value.trim();
        task.categoryId = state.selectedCategoryId;
        task.duration = totalDuration;
        task.lapInterval = lapInterval;
        task.growthFactor = growthFactor;
        task.maxOccurrences = maxOccurrences;
      }
    } else {
      state.lastId++;
      state.tasks.push({
        id: state.lastId,
        title,
        description: DOM.taskDescriptionInput.value.trim(),
        categoryId: state.selectedCategoryId,
        duration: totalDuration,
        lapInterval,
        growthFactor,
        maxOccurrences,
      });
    }
    saveState();
    renderAll();
    resetTaskForm();
  };

  const loadTaskIntoForm = (id) => {
    if (isSessionActive()) {
      alert("Cannot edit a task that is part of an active lap session.");
      return;
    }
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    state.editingTaskId = id;
    state.selectedCategoryId = task.categoryId;
    UI.loadTaskIntoFormUI(DOM, task);
    UI.renderCategoryButtons(DOM, state.selectedCategoryId);
  };

  const deleteTask = (id) => {
    if (isSessionActive()) {
      alert("Cannot delete a task that is part of an active lap session.");
      return;
    }
    state.tasks = state.tasks.filter((t) => t.id !== id);
    state.lapList = state.lapList.filter((l) => l !== id);
    saveState();
    renderAll();
  };

  const duplicateTask = (id) => {
    const original = state.tasks.find((t) => t.id === id);
    if (!original) return;
    state.lastId++;
    const copy = { ...original, id: state.lastId };
    if (!copy.lapInterval) copy.lapInterval = 1;
    if (copy.growthFactor === undefined) copy.growthFactor = 0;
    if (copy.maxOccurrences === undefined) copy.maxOccurrences = 0;
    state.tasks.push(copy);
    saveState();
    renderAll();
  };

  const addTaskToLap = (id) => {
    if (isSessionActive()) {
      alert("Please stop the lap session to modify the playlist.");
      return;
    }
    if (!state.lapList.includes(id)) {
      state.lapList.push(id);
      saveState();
      UI.renderLapList(DOM, state);
    }
  };

  const removeTaskFromLap = (id) => {
    if (isSessionActive()) {
      alert("Please stop the lap session to modify the playlist.");
      return;
    }
    state.lapList = state.lapList.filter((l) => l !== id);
    saveState();
    UI.renderLapList(DOM, state);
  };

  // ----------------------
  // Runner/Timer Logic
  // ----------------------

  const stopTimerInterval = () => {
    clearInterval(state.sessionInterval);
    state.sessionInterval = null;
  };

  const startTimerInterval = () => {
    if (state.sessionInterval) stopTimerInterval();
    state.sessionInterval = setInterval(() => {
      state.currentTaskTimeLeft--;
      UI.updateTimerDisplay(DOM, state);
      if (state.currentTaskTimeLeft < 0) handleTaskCompletion();
    }, 1000);
  };

  const loadTaskToRunner = (virtualIndex) => {
    // Recalculate completed occurrences based on the new index.
    // This is the single source of truth for strikethrough logic.
    const newCompletedOccurrencesMap = new Map();
    for (let i = 0; i < virtualIndex; i++) {
      const task = state.sessionCache.virtualSessionPlaylist[i];
      const count = newCompletedOccurrencesMap.get(task.taskId) || 0;
      newCompletedOccurrencesMap.set(task.taskId, count + 1);
    }
    state.sessionCache.completedOccurrencesMap = newCompletedOccurrencesMap;

    state.currentVirtualTaskIndex = virtualIndex;
    if (
      virtualIndex < 0 ||
      virtualIndex >= state.sessionCache.virtualSessionPlaylist.length
    ) {
      // Recalculate one last time to ensure all tasks are struck through if session ends
      if (virtualIndex >= state.sessionCache.virtualSessionPlaylist.length) {
        const finalCompletedMap = new Map();
        state.sessionCache.virtualSessionPlaylist.forEach((task) => {
          const count = finalCompletedMap.get(task.taskId) || 0;
          finalCompletedMap.set(task.taskId, count + 1);
        });
        state.sessionCache.completedOccurrencesMap = finalCompletedMap;
      }
      return stopSession(true);
    }

    const {
      taskId,
      calculatedDuration,
      baseDuration,
      occurrences,
      totalOccurrences,
    } = state.sessionCache.virtualSessionPlaylist[virtualIndex];
    const task = state.sessionCache.taskMap.get(taskId);
    if (!task) return stopSession(true);

    const category =
      categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
    DOM.runnerTaskCategory.innerHTML = `<span class="icon">${category.icon}</span> ${category.name}`;
    DOM.runnerTaskTitle.textContent = task.title;
    state.currentTaskTimeLeft = calculatedDuration;

    const changeDelta = calculatedDuration - baseDuration;
    const changePercentage =
      baseDuration > 0 ? Math.round((changeDelta / baseDuration) * 100) : 0;
    const sessionTotalTime =
      state.sessionCache.completedTaskDurationsMap.get(taskId) || 0;

    DOM.runnerDetails.baseDuration.textContent = UI.formatTime(baseDuration);
    DOM.runnerDetails.currentDuration.textContent =
      UI.formatTime(calculatedDuration);
    DOM.runnerDetails.occurrenceCount.textContent = `${occurrences} of ${totalOccurrences}`;
    DOM.runnerDetails.changePercentage.textContent = `${changePercentage}%`;
    DOM.runnerDetails.changeDelta.textContent = UI.formatTime(changeDelta);
    DOM.runnerDetails.sessionTotal.textContent =
      UI.formatTime(sessionTotalTime);

    DOM.runnerDetails.changePercentage.style.color =
      changePercentage > 0
        ? "var(--accent-green)"
        : changePercentage < 0
        ? "var(--accent-red)"
        : "var(--text-secondary)";
    DOM.runnerDetails.changeDelta.style.color =
      changeDelta > 0
        ? "var(--accent-green)"
        : changeDelta < 0
        ? "var(--accent-red)"
        : "var(--text-secondary)";

    UI.updateTimerDisplay(DOM, state);
    UI.renderLapList(DOM, state);
    UI.scrollToRunningTask(DOM);
  };

  const handleTaskCompletion = () => {
    if (state.currentVirtualTaskIndex > -1) {
      const lastTask =
        state.sessionCache.virtualSessionPlaylist[
          state.currentVirtualTaskIndex
        ];
      const { taskId, calculatedDuration } = lastTask;
      const currentTotal =
        state.sessionCache.completedTaskDurationsMap.get(taskId) || 0;
      state.sessionCache.completedTaskDurationsMap.set(
        taskId,
        currentTotal + calculatedDuration
      );
    }
    loadTaskToRunner(state.currentVirtualTaskIndex + 1);
  };

  const playPauseSession = () => {
    if (state.runnerState === "RUNNING") {
      stopTimerInterval();
      state.runnerState = "PAUSED";
      DOM.playPauseBtn.innerHTML =
        '<i class="fas fa-play"></i><span>Play</span>';
      return;
    }
    if (state.lapList.length === 0) {
      alert("Add tasks to the Lap Playlist before starting.");
      return;
    }
    if (state.runnerState === "STOPPED") {
      if (!startSession()) return;
    }
    if (
      state.currentVirtualTaskIndex >=
      state.sessionCache.virtualSessionPlaylist.length
    )
      return;
    state.runnerState = "RUNNING";
    DOM.playPauseBtn.innerHTML =
      '<i class="fas fa-pause"></i><span>Pause</span>';
    startTimerInterval();
  };

  const skipToLap = (direction) => {
    if (
      !isSessionActive() ||
      state.sessionCache.virtualSessionPlaylist.length === 0
    )
      return;

    const currentLap =
      state.sessionCache.virtualSessionPlaylist[state.currentVirtualTaskIndex]
        .lap;
    let targetLap = currentLap + direction;

    if (targetLap >= state.sessionCache.totalLaps) {
      loadTaskToRunner(state.sessionCache.virtualSessionPlaylist.length);
      return;
    }
    if (targetLap < 0) return;

    let next = state.sessionCache.virtualSessionPlaylist.findIndex(
      (t) => t.lap === targetLap
    );

    while (
      next === -1 &&
      targetLap < state.sessionCache.totalLaps &&
      targetLap >= 0
    ) {
      targetLap += direction;
      next = state.sessionCache.virtualSessionPlaylist.findIndex(
        (t) => t.lap === targetLap
      );
    }

    if (next !== -1) {
      const wasRunning = state.runnerState === "RUNNING";
      if (wasRunning) stopTimerInterval();
      loadTaskToRunner(next);
      if (wasRunning) startTimerInterval();
    } else if (direction > 0) {
      loadTaskToRunner(state.sessionCache.virtualSessionPlaylist.length);
    }
  };

  const buildVirtualPlaylist = (taskMap, totalLaps) => {
    const virtualSessionPlaylist = [];
    const lapDurations = Array(totalLaps).fill(0);
    const lapStartCumulativeDurations = Array(totalLaps).fill(0);
    const tasksByLap = Array.from({ length: totalLaps }, () => []);
    let currentCumulativeDuration = 0;
    const activeLapMap = new Map();
    let activeLapCounter = 0;
    const lastRunLap = new Map();
    const totalTaskOccurrencesMap = new Map();

    for (let lap = 0; lap < totalLaps; lap++) {
      lapStartCumulativeDurations[lap] = currentCumulativeDuration;
      state.lapList.forEach((taskId) => {
        const task = taskMap.get(taskId);
        if (!task) return;
        const interval = task.lapInterval || 1;
        const maxOccurrences = task.maxOccurrences || 0;
        const occurrencesSoFar = totalTaskOccurrencesMap.get(taskId) || 0;

        if (maxOccurrences > 0 && occurrencesSoFar >= maxOccurrences) {
          return; // Skip if max occurrences reached
        }

        const lastRun = lastRunLap.has(taskId) ? lastRunLap.get(taskId) : -1;
        if (lap === 0 || (lap > lastRun && (lap - lastRun) % interval === 0)) {
          const occurrences = occurrencesSoFar + 1;
          totalTaskOccurrencesMap.set(taskId, occurrences);
          const baseDuration = task.duration;
          let calculatedDuration = baseDuration;
          if (task.growthFactor !== 0) {
            calculatedDuration = Math.round(
              baseDuration *
                Math.pow(1 + task.growthFactor / 100, occurrences - 1)
            );
            calculatedDuration = clamp(
              calculatedDuration,
              MIN_DURATION_SECONDS,
              MAX_DURATION_SECONDS
            );
          }
          tasksByLap[lap].push({
            taskId,
            calculatedDuration,
            baseDuration,
            occurrences,
          });
          lastRunLap.set(taskId, lap);
        }
      });
      if (tasksByLap[lap].length > 0) {
        activeLapCounter++;
        activeLapMap.set(lap, activeLapCounter);
        tasksByLap[lap].forEach((taskInfo) => {
          lapDurations[lap] += taskInfo.calculatedDuration;
          currentCumulativeDuration += taskInfo.calculatedDuration;
        });
      }
    }
    const cumulativeSessionDurations = [];
    currentCumulativeDuration = 0;
    tasksByLap.forEach((tasksInThisLap, lap) => {
      const totalTasksInLap = tasksInThisLap.length;
      if (totalTasksInLap === 0) return;
      tasksInThisLap.forEach((taskInfo, indexInLap) => {
        const task = taskMap.get(taskInfo.taskId);
        const maxOccurrences = task.maxOccurrences || 0;
        const totalOccurrences =
          maxOccurrences > 0
            ? maxOccurrences
            : totalTaskOccurrencesMap.get(taskInfo.taskId) || 0;

        virtualSessionPlaylist.push({
          ...taskInfo,
          lap,
          totalTasksInLap,
          taskIndexInLap: indexInLap + 1,
          totalOccurrences,
        });
        cumulativeSessionDurations.push(currentCumulativeDuration);
        currentCumulativeDuration += taskInfo.calculatedDuration;
      });
    });

    return {
      virtualSessionPlaylist,
      lapDurations,
      lapStartCumulativeDurations,
      cumulativeSessionDurations,
      totalSessionDuration: currentCumulativeDuration,
      activeLapMap,
      totalActiveLaps: activeLapCounter,
      totalTaskOccurrencesMap,
    };
  };

  const startSession = () => {
    const totalLaps = parseInt(DOM.lapsInput.value, 10) || 1;
    const taskMap = getTaskMap();
    const playlistData = buildVirtualPlaylist(taskMap, totalLaps);
    if (playlistData.virtualSessionPlaylist.length === 0) {
      alert(
        "No tasks are scheduled to run in this session with the current intervals and limits."
      );
      return false;
    }
    state.sessionCache = {
      ...playlistData,
      taskMap,
      totalLaps,
      completedTaskDurationsMap: new Map(),
      completedOccurrencesMap: new Map(), // Reset for new session
    };
    DOM.lapsProgressContainer.style.display = "block";
    loadTaskToRunner(0);
    DOM.lapsControls.style.display = "none";
    DOM.lapsInput.disabled = true;
    $$('.stepper-btn[data-field="laps"]').forEach((b) => (b.disabled = true));
    return true;
  };

  const stopSession = (finished = false) => {
    stopTimerInterval();
    state.runnerState = "STOPPED";
    DOM.playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
    DOM.lapsControls.style.display = "flex";
    DOM.lapsInput.disabled = false;
    $$('.stepper-btn[data-field="laps"]').forEach((b) => (b.disabled = false));

    if (finished) {
      DOM.lapsProgressLabel.textContent = `Session Complete! (${
        state.sessionCache.totalLaps || 0
      } laps)`;
      UI.showConfirmationModal(
        DOM,
        state,
        "🎉 Congratulations! 🎉",
        `Session Complete! You finished ${
          state.sessionCache.totalLaps || 0
        } lap(s).`,
        () => {
          DOM.lapsProgressContainer.style.display = "none";
          UI.resetRunnerDisplay(DOM);
        },
        "alert"
      );
    } else {
      DOM.lapsProgressContainer.style.display = "none";
      UI.resetRunnerDisplay(DOM);
    }
    state.currentVirtualTaskIndex = -1;
    UI.renderLapList(DOM, state);
  };

  const restartSession = () => {
    stopTimerInterval();
    state.runnerState = "PAUSED";
    DOM.playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
    state.sessionCache.completedTaskDurationsMap = new Map();
    state.sessionCache.completedOccurrencesMap = new Map(); // Reset on restart
    const playlistData = buildVirtualPlaylist(
      state.sessionCache.taskMap,
      state.sessionCache.totalLaps
    );
    state.sessionCache = { ...state.sessionCache, ...playlistData };
    loadTaskToRunner(0);
    state.runnerState = "RUNNING";
    playPauseSession();
  };

  const isModificationAllowed = (msg) => {
    if (isSessionActive()) {
      alert(msg);
      return false;
    }
    return true;
  };

  const getDragAfterElement = (container, y) => {
    const draggableElements = [
      ...container.querySelectorAll(".lap-list-item:not(.dragging)"),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset)
          return { offset, element: child };
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  };

  // ----------------------
  // Event Listeners
  // ----------------------
  const setupEventListeners = () => {
    DOM.addTaskBtn.addEventListener("click", handleTaskFormSubmit);
    DOM.cancelEditBtn.addEventListener("click", resetTaskForm);
    DOM.globalCollapseBtn.addEventListener("click", () =>
      UI.toggleAllPanels(state, true)
    );
    DOM.globalExpandBtn.addEventListener("click", () =>
      UI.toggleAllPanels(state, false)
    );
    DOM.popoutRunnerBtn.addEventListener("click", () =>
      UI.toggleRunnerPopout(DOM, state)
    );

    DOM.taskListEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const item = e.target.closest(".task-item");
      const id = Number(item.dataset.id);
      if (btn.classList.contains("delete-btn")) deleteTask(id);
      if (btn.classList.contains("copy-btn")) duplicateTask(id);
      if (btn.classList.contains("add-to-lap-btn")) addTaskToLap(id);
      if (btn.classList.contains("edit-btn")) loadTaskIntoForm(id);
    });

    DOM.lapListEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || isSessionActive()) return;
      const item = e.target.closest(".lap-list-item");
      const id = Number(item.dataset.id);
      if (btn.classList.contains("remove-btn")) removeTaskFromLap(id);
      else if (btn.classList.contains("move-btn")) {
        const { action } = btn.dataset;
        const idx = state.lapList.indexOf(id);
        if (idx === -1) return;
        state.lapList.splice(idx, 1);
        if (action === "top") state.lapList.unshift(id);
        else if (action === "bottom") state.lapList.push(id);
        saveState();
        UI.renderLapList(DOM, state);
      }
    });

    DOM.lapListEl.addEventListener("dragstart", (e) => {
      if (isSessionActive()) return;
      const item = e.target.closest(".lap-list-item");
      if (!item) return;
      state.draggedItemId = Number(item.dataset.id);
      setTimeout(() => item.classList.add("dragging"), 0);
    });

    DOM.lapListEl.addEventListener("dragend", (e) => {
      const item = e.target.closest(".lap-list-item");
      if (item) item.classList.remove("dragging");
      state.draggedItemId = null;
    });

    DOM.lapListEl.addEventListener("dragover", (e) => {
      if (isSessionActive()) return;
      e.preventDefault();
      const after = getDragAfterElement(DOM.lapListEl, e.clientY);
      $$(".drag-over-top, .drag-over-bottom").forEach((el) =>
        el.classList.remove("drag-over-top", "drag-over-bottom")
      );
      if (after) after.classList.add("drag-over-top");
      else {
        const last = DOM.lapListEl.lastElementChild;
        if (last && !last.classList.contains("dragging"))
          last.classList.add("drag-over-bottom");
      }
    });

    DOM.lapListEl.addEventListener("drop", (e) => {
      if (isSessionActive()) return;
      e.preventDefault();
      $$(".drag-over-top, .drag-over-bottom").forEach((el) =>
        el.classList.remove("drag-over-top", "drag-over-bottom")
      );
      if (state.draggedItemId === null) return;
      const after = getDragAfterElement(DOM.lapListEl, e.clientY);
      const oldIndex = state.lapList.indexOf(state.draggedItemId);
      if (oldIndex > -1) state.lapList.splice(oldIndex, 1);
      if (after) {
        const afterId = Number(after.dataset.id);
        const newIndex = state.lapList.indexOf(afterId);
        state.lapList.splice(newIndex, 0, state.draggedItemId);
      } else state.lapList.push(state.draggedItemId);
      saveState();
      UI.renderLapList(DOM, state);
    });

    DOM.categoryGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;
      state.selectedCategoryId = btn.dataset.id;
      UI.renderCategoryButtons(DOM, state.selectedCategoryId);
    });

    DOM.playPauseBtn.addEventListener("click", playPauseSession);
    DOM.nextTaskBtn.addEventListener("click", () => {
      if (isSessionActive()) handleTaskCompletion();
    });
    DOM.prevTaskBtn.addEventListener("click", () => {
      if (isSessionActive() && state.currentVirtualTaskIndex > 0)
        loadTaskToRunner(state.currentVirtualTaskIndex - 1);
    });
    DOM.stopLapsBtn.addEventListener("click", () => stopSession(false));
    DOM.restartLapsBtn.addEventListener("click", () => {
      if (!isSessionActive()) return;
      UI.showConfirmationModal(
        DOM,
        state,
        "Restart Session?",
        "This will restart the current session from the beginning. Are you sure?",
        () => restartSession()
      );
    });
    DOM.nextLapBtn.addEventListener("click", () => skipToLap(1));
    DOM.prevLapBtn.addEventListener("click", () => skipToLap(-1));

    DOM.themeToggleBtn.addEventListener("click", () =>
      UI.applyTheme(
        document.body.classList.contains("dark-theme") ? "light" : "dark"
      )
    );

    DOM.deleteAllBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed("Please stop the session to delete all tasks.")
      )
        return;
      UI.showConfirmationModal(
        DOM,
        state,
        "Delete All Tasks?",
        "This will permanently delete all tasks from the repository. Are you sure?",
        () => {
          state.tasks = [];
          state.lapList = [];
          state.lastId = 0;
          saveState();
          renderAll();
        }
      );
    });

    DOM.addAllBtn.addEventListener("click", () => {
      if (!isModificationAllowed("Please stop the session to add all tasks."))
        return;
      state.tasks.forEach((t) => addTaskToLap(t.id));
    });

    DOM.clearLapListBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed("Please stop the session to clear the playlist.")
      )
        return;
      UI.showConfirmationModal(
        DOM,
        state,
        "Clear Playlist?",
        "This will remove all tasks from the current playlist. Are you sure?",
        () => {
          state.lapList = [];
          saveState();
          UI.renderLapList(DOM, state);
        }
      );
    });

    DOM.resetAppBtn.addEventListener("click", () => {
      UI.showConfirmationModal(
        DOM,
        state,
        "Reset Application?",
        "This will clear all data and load demo tasks. Are you sure?",
        () => {
          stopSession();
          // Use deep copy to prevent modifying the original constant
          state.tasks = JSON.parse(JSON.stringify(DEMO_TASKS));
          state.lapList = [...DEMO_LAP_LIST];
          state.lastId = DEMO_TASKS.reduce(
            (max, task) => Math.max(max, task.id),
            0
          );
          saveState();
          renderAll();
        }
      );
    });

    DOM.modalCancelBtn.addEventListener("click", () =>
      UI.hideConfirmationModal(DOM)
    );
    DOM.modalConfirmBtn.addEventListener("click", () => {
      if (state.confirmCallback) state.confirmCallback();
      UI.hideConfirmationModal(DOM);
    });

    $$(".sort-header").forEach((h) =>
      h.addEventListener("click", () =>
        updateSort(h.id.replace("sort-by-", "").replace("-btn", ""))
      )
    );

    $$(".preset-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const totalSeconds = parseInt(btn.dataset.duration, 10);
        DOM.durationMinutesInput.value = Math.floor(totalSeconds / 60);
        DOM.durationSecondsInput.value = totalSeconds % 60;
      })
    );

    $$(".stepper-btn").forEach((btn) => {
      let interval;
      const stopInterval = () => clearInterval(interval);
      const { field, step } = btn.dataset;
      const input =
        field === "laps"
          ? DOM.lapsInput
          : field === "minutes"
          ? DOM.durationMinutesInput
          : field === "lapInterval"
          ? DOM.lapIntervalInput
          : field === "growthFactor"
          ? DOM.growthFactorInput
          : field === "maxOccurrences"
          ? DOM.maxOccurrencesInput
          : DOM.durationSecondsInput;
      const update = () => {
        let val = parseInt(input.value, 10) || 0;
        const min = parseInt(input.min, 10) || 0;
        const max = parseInt(input.max, 10) || Infinity;
        val = Math.max(min, Math.min(max, val + parseInt(step)));
        input.value = val;
      };
      btn.addEventListener("mousedown", () => {
        update();
        interval = setInterval(update, 120);
      });
      btn.addEventListener("mouseup", stopInterval);
      btn.addEventListener("mouseleave", stopInterval);
    });

    document.addEventListener("click", (e) => {
      const collapseBtn = e.target.closest(".collapse-btn");
      if (!collapseBtn) return;
      const panel = collapseBtn.closest(".panel, section");
      if (!panel) return;
      panel.classList.toggle("collapsed");
      const isCollapsed = panel.classList.contains("collapsed");
      collapseBtn.setAttribute("aria-expanded", !isCollapsed);
      if (panel.id) {
        state.panelCollapseState[panel.id] = isCollapsed;
        localStorage.setItem(
          "panelCollapseState",
          JSON.stringify(state.panelCollapseState)
        );
      }
    });
  };

  // ----------------------
  // Initialization
  // ----------------------
  const init = () => {
    UI.applyTheme(localStorage.getItem("theme") || "dark");
    $$(
      "#create-task-panel, #task-repository-panel, #lap-list-panel, #task-runner-panel"
    ).forEach((section) => {
      if (state.panelCollapseState[section.id]) {
        section.classList.add("collapsed");
        const btn = section.querySelector(".collapse-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });

    DOM.durationMinutesInput.value = 1;
    DOM.durationSecondsInput.value = 30;

    setupEventListeners();
    renderAll();
    updateSort(state.sortState.field);
  };

  init();
});
