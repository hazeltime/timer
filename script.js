// script.refactored.js - Refactored Todo Task Timer (TTT)
// Behavior-preserving refactor: improved readability, reduced duplication, small helpers

document.addEventListener("DOMContentLoaded", () => {
  // ----------------------
  // Constants & Maps
  // ----------------------
  const CATEGORIES = [
    { id: "cat-0", name: "None", icon: "⚫", color: "#78716c" },
    { id: "cat-1", name: "Body", icon: "💪", color: "#ef4444" },
    { id: "cat-2", name: "Mind", icon: "🧠", color: "#8b5cf6" },
    { id: "cat-3", name: "Work", icon: "💼", color: "#3b82f6" },
    { id: "cat-4", name: "Personal", icon: "🏠", color: "#22c55e" },
    { id: "cat-5", name: "Relations", icon: "❤️", color: "#ec4899" },
    { id: "cat-6", name: "Social", icon: "🎉", color: "#f97316" },
    { id: "cat-7", name: "Education", icon: "📚", color: "#0ea5e9" },
    { id: "cat-8", name: "Finance", icon: "💰", color: "#84cc16" },
    { id: "cat-9", name: "Planning", icon: "📅", color: "#78716c" },
  ];
  const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

  // Max and min duration in seconds
  const MAX_DURATION_SECONDS = 23 * 3600 + 59 * 60 + 59;
  const MIN_DURATION_SECONDS = 1;

  // ----------------------
  // DOM refs grouped for clarity
  // ----------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const DOM = {
    // form
    taskForm: $("#task-form"),
    formTitle: $("#form-title"),
    taskInput: $("#task-input"),
    taskDescriptionInput: $("#task-description-input"),
    categoryGrid: $("#category-grid"),
    durationMinutesInput: $("#task-duration-minutes"),
    durationSecondsInput: $("#task-duration-seconds"),
    lapIntervalInput: $("#lap-interval-input"),
    growthFactorInput: $("#growth-factor-input"), // NEW
    addTaskBtn: $("#add-task-btn"),
    cancelEditBtn: $("#cancel-edit-btn"),

    // lists
    taskListEl: $("#task-list"),
    lapListEl: $("#lap-list"),
    lapListDurationEl: $("#lap-list-duration"),

    // modal / controls
    themeToggleBtn: $("#theme-toggle-btn"),
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

    // runner
    runnerTaskCategory: $("#runner-task-category"),
    runnerTaskTitle: $("#runner-task-title"),
    taskProgressBar: $("#task-progress-bar"),
    taskPercentage: $("#task-percentage"),
    timeElapsedEl: $("#time-elapsed"),
    timeRemainingEl: $("#time-remaining"),
    prevTaskBtn: $("#prev-task-btn"),
    playPauseBtn: $("#play-pause-btn"),
    nextTaskBtn: $("#next-task-btn"),

    // laps block
    lapsControls: $(".laps-controls"),
    sessionControls: $("#session-controls"),
    lapsInput: $("#laps-input"),
    stopLapsBtn: $("#stop-laps-btn"),
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
  };

  // ----------------------
  // Application state
  // ----------------------
  const state = {
    tasks: (JSON.parse(localStorage.getItem("tasks")) || []).map((t) => ({
      ...t,
      lapInterval: t.lapInterval || 1,
      growthFactor: t.growthFactor !== undefined ? t.growthFactor : 0, // NEW: default to 0
    })),
    lapList: JSON.parse(localStorage.getItem("lapList")) || [],
    lastId: JSON.parse(localStorage.getItem("lastId")) || 0,
    sortState: { field: "id", order: "desc" },
    selectedCategoryId: "cat-0",
    editingTaskId: null,
    panelCollapseState:
      JSON.parse(localStorage.getItem("panelCollapseState")) || {},

    // runner state
    sessionInterval: null,
    runnerState: "STOPPED", // STOPPED, RUNNING, PAUSED
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
      taskOccurenceCounts: new Map(), // NEW: to track occurrences for the growth factor
    },
  };

  // ----------------------
  // Utilities
  // ----------------------
  const saveState = () => {
    localStorage.setItem("tasks", JSON.stringify(state.tasks));
    localStorage.setItem("lapList", JSON.stringify(state.lapList));
    localStorage.setItem("lastId", JSON.stringify(state.lastId));
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    if (totalSeconds === 0) return "0s";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(" ");
  };

  const isSessionActive = () => state.runnerState !== "STOPPED";
  const getTaskMap = () => new Map(state.tasks.map((t) => [t.id, t]));

  // ----------------------
  // Rendering helpers
  // ----------------------
  const renderCategoryButtons = () => {
    DOM.categoryGrid.innerHTML = CATEGORIES.map(
      (cat) => `
      <button class="category-btn ${
        cat.id === state.selectedCategoryId ? "active" : ""
      }" data-id="${cat.id}" style="border-color: ${
        cat.id === state.selectedCategoryId ? cat.color : "transparent"
      };">
        <span class="icon">${cat.icon}</span><span class="name">${
        cat.name
      }</span>
      </button>
    `
    ).join("");
  };

  const renderTaskSummary = () => {
    const totalTasks = state.tasks.length;
    const totalDurationInSeconds = state.tasks.reduce(
      (s, t) => s + t.duration,
      0
    );
    DOM.taskSummaryEl.innerHTML = `<span><strong>Total Tasks:</strong> ${totalTasks}</span><span><strong>Total Duration:</strong> ${formatTime(
      totalDurationInSeconds
    )}</span>`;
  };

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
        case "growthFactor": // NEW sort by growth factor
          return ((a.growthFactor || 0) - (b.growthFactor || 0)) * order;
        default:
          return (a.id - b.id) * order;
      }
    });
  };

  const renderTasks = () => {
    const sorted = sortTasks(state.tasks);
    if (sorted.length === 0) {
      DOM.taskListEl.innerHTML =
        '<div class="task-item">No tasks yet. Add one above!</div>';
    } else {
      DOM.taskListEl.innerHTML = sorted
        .map((task) => {
          const category =
            categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
          const intervalText =
            task.lapInterval === 1
              ? "Always"
              : `<i class="fas fa-redo-alt"></i> ${task.lapInterval}`;
          const growthText = `${task.growthFactor || 0}%`; // NEW
          return `
          <div class="task-item" data-id="${task.id}">
            <div class="task-cell task-id-col">#${task.id}</div>
            <div class="task-cell task-title-col">
              <span class="task-title">${task.title}</span>
              <span class="task-description">${task.description || ""}</span>
            </div>
            <div class="task-cell task-category-col"><span class="task-category-badge" style="background-color: ${
              category.color
            };">${category.icon} ${category.name}</span></div>
            <div class="task-cell task-duration-col">${formatTime(
              task.duration
            )}</div>
            <div class="task-cell task-interval-col">${intervalText}</div>
            <div class="task-cell task-growth-col">${growthText}</div>
            <div class="task-cell task-actions-col">
              <button class="add-to-lap-btn" title="Add to Lap"><i class="fas fa-plus-circle"></i></button>
              <button class="edit-btn" title="Edit Task"><i class="fas fa-edit"></i></button>
              <button class="copy-btn" title="Duplicate"><i class="fas fa-copy"></i></button>
              <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>`;
        })
        .join("");
    }
    renderTaskSummary();
  };

  const renderLapList = () => {
    const taskMap = getTaskMap();
    const lapDuration = state.lapList.reduce(
      (s, id) => s + (taskMap.get(id)?.duration || 0),
      0
    );
    DOM.lapListDurationEl.textContent = `Total: ${formatTime(lapDuration)}`;

    const sessionInactive = !isSessionActive();
    const draggableAttr = sessionInactive ? 'draggable="true"' : "";

    if (state.lapList.length === 0) {
      DOM.lapListEl.innerHTML =
        '<div class="lap-list-item">Add tasks from the repository to create a playlist.</div>';
      return;
    }

    DOM.lapListEl.innerHTML = state.lapList
      .map((id) => {
        const task = taskMap.get(id);
        if (!task) return "";
        const category =
          categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
        const isRunning =
          isSessionActive() &&
          task.id ===
            state.sessionCache.virtualSessionPlaylist[
              state.currentVirtualTaskIndex
            ]?.taskId;
        const actions = sessionInactive
          ? `
          <div class="lap-item-actions">
            <button class="move-btn" data-action="top" title="Move to Top"><i class="fas fa-angle-double-up"></i></button>
            <button class="move-btn" data-action="bottom" title="Move to Bottom"><i class="fas fa-angle-double-down"></i></button>
            <button class="remove-btn" title="Remove from Lap"><i class="fas fa-trash-alt"></i></button>
          </div>`
          : `<div class="lap-item-actions"><button class="remove-btn" title="Remove from Lap"><i class="fas fa-trash-alt"></i></button></div>`;

        return `<div class="lap-list-item ${
          isRunning ? "running" : ""
        }" ${draggableAttr} data-id="${task.id}">
        <span class="lap-category-icon" title="${category.name}">${
          category.icon
        }</span>
        <div class="title">${task.title}</div>
        <span class="duration">${formatTime(task.duration)}</span>
        ${actions}
      </div>`;
      })
      .join("");
  };

  const renderAll = () => {
    renderTasks();
    renderLapList();
    renderCategoryButtons();
  };

  // ----------------------
  // CRUD operations
  // ----------------------
  const resetTaskForm = () => {
    state.editingTaskId = null;
    DOM.formTitle.textContent = "Create New Task";
    DOM.taskInput.value = "";
    DOM.taskDescriptionInput.value = "";
    state.selectedCategoryId = "cat-0";
    DOM.durationMinutesInput.value = 1;
    DOM.durationSecondsInput.value = 30;
    DOM.lapIntervalInput.value = 1;
    DOM.growthFactorInput.value = 0; // NEW: reset growth factor
    DOM.addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    DOM.cancelEditBtn.style.display = "none";
    renderCategoryButtons();
    DOM.taskInput.focus();
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
        task.growthFactor = growthFactor; // NEW: save growth factor
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
        growthFactor, // NEW: save growth factor
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
    DOM.formTitle.textContent = `Editing Task #${id}`;
    DOM.taskInput.value = task.title;
    DOM.taskDescriptionInput.value = task.description;
    state.selectedCategoryId = task.categoryId;
    DOM.durationMinutesInput.value = Math.floor(task.duration / 60);
    DOM.durationSecondsInput.value = task.duration % 60;
    DOM.lapIntervalInput.value = task.lapInterval || 1;
    DOM.growthFactorInput.value = task.growthFactor || 0; // NEW: load growth factor
    DOM.addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    DOM.cancelEditBtn.style.display = "inline-block";
    renderCategoryButtons();
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
    if (copy.growthFactor === undefined) copy.growthFactor = 0; // NEW: ensure growth factor exists
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
      renderLapList();
    }
  };

  const removeTaskFromLap = (id) => {
    if (isSessionActive()) {
      alert("Please stop the lap session to modify the playlist.");
      return;
    }
    state.lapList = state.lapList.filter((l) => l !== id);
    saveState();
    renderLapList();
  };

  // ----------------------
  // Runner / timing
  // ----------------------
  const resetRunnerDisplay = () => {
    DOM.runnerTaskCategory.textContent = "";
    DOM.runnerTaskTitle.textContent = "No task selected";
    DOM.taskProgressBar.style.width = "0%";
    DOM.taskPercentage.textContent = "0%";
    DOM.timeElapsedEl.textContent = "0s";
    DOM.timeRemainingEl.textContent = "0s";
    DOM.lapProgressBar.style.width = "0%";
    DOM.lapPercentage.textContent = "0%";
    DOM.lapTimeElapsedEl.textContent = "0s";
    DOM.lapTimeRemainingEl.textContent = "0s";
    DOM.sessionProgressBar.style.width = "0%";
    DOM.sessionPercentage.textContent = "0%";
    DOM.sessionTimeElapsedEl.textContent = "0s";
    DOM.sessionTimeRemainingEl.textContent = "0s";
  };

  const stopTimerInterval = () => {
    clearInterval(state.sessionInterval);
    state.sessionInterval = null;
  };

  const startTimerInterval = () => {
    if (state.sessionInterval) stopTimerInterval();
    state.sessionInterval = setInterval(() => {
      state.currentTaskTimeLeft--;
      updateTimerDisplay();
      if (state.currentTaskTimeLeft < 0) handleTaskCompletion();
    }, 1000);
  };

  const loadTaskToRunner = (virtualIndex) => {
    state.currentVirtualTaskIndex = virtualIndex;
    if (
      virtualIndex < 0 ||
      virtualIndex >= state.sessionCache.virtualSessionPlaylist.length
    )
      return stopSession(true);
    const { taskId, calculatedDuration } =
      state.sessionCache.virtualSessionPlaylist[virtualIndex];
    const task = state.sessionCache.taskMap.get(taskId);
    if (!task) return stopSession(true);
    const category =
      categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
    DOM.runnerTaskCategory.textContent = `${category.icon} ${category.name}`;
    DOM.runnerTaskTitle.textContent = task.title;
    state.currentTaskTimeLeft = calculatedDuration; // Use the pre-calculated duration
    updateTimerDisplay();
    renderLapList();
  };

  const updateTimerDisplay = () => {
    if (state.currentVirtualTaskIndex === -1) return;
    const currentVirtualTask =
      state.sessionCache.virtualSessionPlaylist[state.currentVirtualTaskIndex];
    if (!currentVirtualTask) return;

    const { taskId, calculatedDuration, lap, tasksInLap, taskIndexInLap } =
      currentVirtualTask;
    const elapsed = calculatedDuration - state.currentTaskTimeLeft;
    const taskPercent =
      calculatedDuration > 0
        ? Math.floor((elapsed / calculatedDuration) * 100)
        : 0;
    DOM.timeElapsedEl.textContent = formatTime(elapsed);
    DOM.timeRemainingEl.textContent = `-${formatTime(
      state.currentTaskTimeLeft
    )}`;
    DOM.taskProgressBar.style.width = `${taskPercent}%`;
    DOM.taskPercentage.textContent = `${taskPercent}%`;

    const currentLapDuration = state.sessionCache.lapDurations[lap];
    const lapStartTime = state.sessionCache.lapStartCumulativeDurations[lap];
    const completedDurationInLap =
      (state.sessionCache.cumulativeSessionDurations[
        state.currentVirtualTaskIndex
      ] || 0) - lapStartTime;
    const lapTimeElapsed = completedDurationInLap + elapsed;
    const lapTimeRemaining = currentLapDuration - lapTimeElapsed;
    const lapPercent =
      currentLapDuration > 0
        ? Math.floor((lapTimeElapsed / currentLapDuration) * 100)
        : 0;
    DOM.lapProgressBar.style.width = `${lapPercent}%`;
    DOM.lapPercentage.textContent = `${lapPercent}%`;
    DOM.lapTimeElapsedEl.textContent = formatTime(lapTimeElapsed);
    DOM.lapTimeRemainingEl.textContent = `-${formatTime(lapTimeRemaining)}`;

    const activeLapNumber = state.sessionCache.activeLapMap.get(lap);
    DOM.lapsProgressLabel.textContent = `Lap ${activeLapNumber} of ${
      state.sessionCache.totalActiveLaps
    } (Run ${lap + 1}) - Task ${taskIndexInLap + 1} of ${tasksInLap.length}`;

    const totalSessionDuration = state.sessionCache.totalSessionDuration;
    const sessionTimeElapsed =
      (state.sessionCache.cumulativeSessionDurations[
        state.currentVirtualTaskIndex
      ] || 0) + elapsed;
    const sessionTimeRemaining = totalSessionDuration - sessionTimeElapsed;
    const sessionPercent =
      totalSessionDuration > 0
        ? Math.floor((sessionTimeElapsed / totalSessionDuration) * 100)
        : 0;
    DOM.sessionProgressBar.style.width = `${sessionPercent}%`;
    DOM.sessionPercentage.textContent = `${sessionPercent}%`;
    DOM.sessionTimeElapsedEl.textContent = formatTime(sessionTimeElapsed);
    DOM.sessionTimeRemainingEl.textContent = `-${formatTime(
      sessionTimeRemaining
    )}`;
  };

  const handleTaskCompletion = () =>
    loadTaskToRunner(state.currentVirtualTaskIndex + 1);

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
      stopSession(true);
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
    } else if (direction > 0) stopSession(true);
  };

  // ----------------------
  // Playlist builder
  // ----------------------
  const buildVirtualPlaylist = (taskMap, totalLaps) => {
    const virtualSessionPlaylist = [];
    const lapDurations = Array(totalLaps).fill(0);
    const lapStartCumulativeDurations = Array(totalLaps).fill(0);
    const tasksByLap = Array.from({ length: totalLaps }, () => []);
    let currentCumulativeDuration = 0;
    const activeLapMap = new Map();
    let activeLapCounter = 0;
    const lastRunLap = new Map();
    const taskOccurenceCounts = new Map();

    for (let lap = 0; lap < totalLaps; lap++) {
      lapStartCumulativeDurations[lap] = currentCumulativeDuration;
      state.lapList.forEach((taskId) => {
        const task = taskMap.get(taskId);
        if (!task) return;
        const interval = task.lapInterval || 1;
        const lastRun = lastRunLap.has(taskId) ? lastRunLap.get(taskId) : -1;
        if (lap === 0 || (lap > lastRun && (lap - lastRun) % interval === 0)) {
          // Increment occurrence count for this task
          const occurrences = (taskOccurenceCounts.get(taskId) || 0) + 1;
          taskOccurenceCounts.set(taskId, occurrences);

          // Calculate new duration based on the growth factor and occurrence
          let calculatedDuration = task.duration;
          if (task.growthFactor !== 0) {
            calculatedDuration = Math.round(
              task.duration *
                Math.pow(1 + task.growthFactor / 100, occurrences - 1)
            );
            // Apply min/max duration constraints
            calculatedDuration = clamp(
              calculatedDuration,
              MIN_DURATION_SECONDS,
              MAX_DURATION_SECONDS
            );
          }
          tasksByLap[lap].push({ taskId, calculatedDuration });
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
      tasksInThisLap.forEach((taskInfo, taskIndexInLap) => {
        virtualSessionPlaylist.push({
          ...taskInfo,
          lap,
          tasksInLap: tasksByLap[lap],
          taskIndexInLap,
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
      taskOccurenceCounts,
    };
  };

  const startSession = () => {
    const totalLaps = parseInt(DOM.lapsInput.value, 10) || 1;
    const taskMap = getTaskMap();
    const playlistData = buildVirtualPlaylist(taskMap, totalLaps);

    if (playlistData.virtualSessionPlaylist.length === 0) {
      alert(
        "No tasks are scheduled to run in this session with the current intervals."
      );
      return false;
    }

    state.sessionCache = { ...playlistData, taskMap, totalLaps };

    DOM.lapsProgressContainer.style.display = "block";
    loadTaskToRunner(0);
    DOM.lapsControls.style.display = "none";
    DOM.sessionControls.style.display = "flex";
    DOM.lapsInput.disabled = true;
    $$('.stepper-btn[data-field="laps"]').forEach((b) => (b.disabled = true));
    return true;
  };

  const stopSession = (finished = false) => {
    stopTimerInterval();
    state.runnerState = "STOPPED";
    DOM.playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
    DOM.lapsControls.style.display = "flex";
    DOM.sessionControls.style.display = "none";
    DOM.lapsInput.disabled = false;
    $$('.stepper-btn[data-field="laps"]').forEach((b) => (b.disabled = false));

    if (finished) {
      DOM.lapsProgressLabel.textContent = `Session Complete! (${
        state.sessionCache.totalLaps || 0
      } runs)`;
      showConfirmationModal(
        "🎉 Congratulations! 🎉",
        `Session Complete! You finished ${
          state.sessionCache.totalLaps || 0
        } run(s).`,
        () => {
          DOM.lapsProgressContainer.style.display = "none";
          resetRunnerDisplay();
        },
        "alert"
      );
    } else {
      DOM.lapsProgressContainer.style.display = "none";
      resetRunnerDisplay();
    }

    state.currentVirtualTaskIndex = -1;
    renderLapList();
  };

  // ----------------------
  // Modal + utilities
  // ----------------------
  const showConfirmationModal = (title, text, onConfirm, type = "confirm") => {
    DOM.modalTitle.textContent = title;
    DOM.modalText.textContent = text;
    state.confirmCallback = onConfirm;
    if (type === "alert") {
      DOM.modalCancelBtn.style.display = "none";
      DOM.modalConfirmBtn.textContent = "OK";
    } else {
      DOM.modalCancelBtn.style.display = "inline-block";
      DOM.modalConfirmBtn.textContent = "Confirm";
    }
    DOM.confirmModal.style.display = "flex";
    DOM.confirmModal.classList.add("show");
  };

  const hideConfirmationModal = () => {
    DOM.confirmModal.classList.remove("show");
    setTimeout(() => {
      DOM.confirmModal.style.display = "none";
    }, 200);
  };

  const isModificationAllowed = (msg) => {
    if (isSessionActive()) {
      alert(msg);
      return false;
    }
    return true;
  };

  // ----------------------
  // Drag helpers for lap list
  // ----------------------
  function getDragAfterElement(container, y) {
    const draggableElements = Array.from(
      container.querySelectorAll(".lap-list-item:not(.dragging)")
    );
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
  }

  // ----------------------
  // Setup event listeners (centralized)
  // ----------------------
  const setupEventListeners = () => {
    DOM.addTaskBtn.addEventListener("click", handleTaskFormSubmit);
    DOM.cancelEditBtn.addEventListener("click", resetTaskForm);

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
        renderLapList();
      }
    });

    // drag & drop
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
      renderLapList();
    });

    // categories
    DOM.categoryGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;
      state.selectedCategoryId = btn.dataset.id;
      renderCategoryButtons();
    });

    // runner controls
    DOM.playPauseBtn.addEventListener("click", playPauseSession);
    DOM.nextTaskBtn.addEventListener("click", () => {
      if (isSessionActive()) handleTaskCompletion();
    });
    DOM.prevTaskBtn.addEventListener("click", () => {
      if (isSessionActive() && state.currentVirtualTaskIndex > 0)
        loadTaskToRunner(state.currentVirtualTaskIndex - 1);
    });

    DOM.stopLapsBtn.addEventListener("click", () => stopSession(false));
    DOM.nextLapBtn.addEventListener("click", () => skipToLap(1));
    DOM.prevLapBtn.addEventListener("click", () => skipToLap(-1));

    DOM.themeToggleBtn.addEventListener("click", () =>
      applyTheme(
        document.body.classList.contains("dark-theme") ? "light" : "dark"
      )
    );

    DOM.deleteAllBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed("Please stop the session to delete all tasks.")
      )
        return;
      showConfirmationModal(
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
      showConfirmationModal(
        "Clear Playlist?",
        "This will remove all tasks from the current playlist. Are you sure?",
        () => {
          state.lapList = [];
          saveState();
          renderLapList();
        }
      );
    });

    DOM.resetAppBtn.addEventListener("click", () => {
      showConfirmationModal(
        "Reset Application?",
        "This will clear all data and load demo tasks. Are you sure?",
        () => {
          stopSession();
          state.tasks = [
            {
              id: 1,
              title: "Quick Stand-up Prep",
              description: "Review yesterday's work and plan today's points.",
              categoryId: "cat-3",
              duration: 180,
              lapInterval: 1,
              growthFactor: 0,
            },
            {
              id: 2,
              title: "Morning Meditation",
              description: "10 minutes of mindfulness.",
              categoryId: "cat-2",
              duration: 600,
              lapInterval: 1,
              growthFactor: 0,
            },
            {
              id: 3,
              title: "HIIT Workout",
              description: "High-Intensity Interval Training.",
              categoryId: "cat-1",
              duration: 1500,
              lapInterval: 2,
              growthFactor: 20,
            },
            {
              id: 4,
              title: "Pay Monthly Bills",
              description: "Handle rent, utilities, and credit card payments.",
              categoryId: "cat-8",
              duration: 300,
              lapInterval: 4,
              growthFactor: 10,
            },
            {
              id: 5,
              title: "Call Mom",
              description: "Catch up for 15 minutes.",
              categoryId: "cat-5",
              duration: 900,
              lapInterval: 1,
              growthFactor: 0,
            },
            {
              id: 6,
              title: "Language Flashcards",
              description: "Quick Duolingo-style review.",
              categoryId: "cat-7",
              duration: 120,
              lapInterval: 1,
              growthFactor: -10,
            },
            {
              id: 7,
              title: "Water the Plants",
              description: "Just a quick hydration for the little guys.",
              categoryId: "cat-4",
              duration: 30,
              lapInterval: 3,
              growthFactor: 0,
            },
            {
              id: 8,
              title: "Weekly Review & Plan",
              description: "Go over last week's goals and plan the next.",
              categoryId: "cat-9",
              duration: 1200,
              lapInterval: 5,
              growthFactor: -5,
            },
          ];
          state.lapList = [1, 2, 3, 4, 5, 6, 7, 8];
          state.lastId = 8;
          saveState();
          renderAll();
        }
      );
    });

    DOM.modalCancelBtn.addEventListener("click", hideConfirmationModal);
    DOM.modalConfirmBtn.addEventListener("click", () => {
      if (state.confirmCallback) state.confirmCallback();
      hideConfirmationModal();
    });

    $$(".sort-header").forEach((h) =>
      h.addEventListener("click", () => updateSort(h.id.split("-")[2]))
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
  // Sort & theme helpers
  // ----------------------
  const updateSort = (field) => {
    state.sortState.order =
      state.sortState.field === field && state.sortState.order === "asc"
        ? "desc"
        : "asc";
    state.sortState.field = field;
    $$(".sort-header").forEach((h) => {
      h.classList.remove("active");
      h.querySelector("i").className = "fas";
    });
    const active = $(`#sort-by-${field}-btn`);
    if (active) {
      active.classList.add("active");
      active
        .querySelector("i")
        .classList.add(
          state.sortState.order === "asc" ? "fa-arrow-up" : "fa-arrow-down"
        );
    }
    renderTasks();
  };

  const applyTheme = (theme) => {
    document.body.className = `${theme}-theme`;
    localStorage.setItem("theme", theme);
  };

  // ----------------------
  // Initialization
  // ----------------------
  const init = () => {
    applyTheme(localStorage.getItem("theme") || "dark");
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
    renderCategoryButtons();
    renderLapList();
    updateSort("id");
  };

  init();
});
