// script.js
// Refactored Todo Task Timer (TTT)
// Combines best features from both versions and fixes bugs
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
  const MAX_DURATION_SECONDS = 23 * 3600 + 59 * 60 + 59;
  const MIN_DURATION_SECONDS = 1;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
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
    addTaskBtn: $("#add-task-btn"),
    cancelEditBtn: $("#cancel-edit-btn"),
    taskListEl: $("#task-list"),
    lapListEl: $("#lap-list"),
    lapListDurationEl: $("#lap-list-duration"),
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
      sessionTotal: $("#runner-session-total"), // NEW
    },
    lapsControls: $(".laps-controls"),
    sessionControls: $("#session-controls"),
    lapsInput: $("#laps-input"),
    stopLapsBtn: $("#stop-laps-btn"),
    restartLapsBtn: $("#restart-laps-btn"), // NEW
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
  const state = {
    tasks: (JSON.parse(localStorage.getItem("tasks")) || []).map((t) => ({
      ...t,
      lapInterval: t.lapInterval || 1,
      growthFactor: t.growthFactor !== undefined ? t.growthFactor : 0,
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
      completedTaskDurationsMap: new Map(), // NEW
    },
  };
  const saveState = () => {
    localStorage.setItem("tasks", JSON.stringify(state.tasks));
    localStorage.setItem("lapList", JSON.stringify(state.lapList));
    localStorage.setItem("lastId", JSON.stringify(state.lastId));
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const formatTime = (totalSeconds) => {
    if (totalSeconds === 0) return "0s";
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || (hours === 0 && minutes === 0))
      parts.push(`${seconds}s`);
    const formatted = parts.join(" ");
    return isNegative ? `-${formatted}` : formatted;
  };
  const isSessionActive = () => state.runnerState !== "STOPPED";
  const getTaskMap = () => new Map(state.tasks.map((t) => [t.id, t]));
  const renderCategoryButtons = () => {
    DOM.categoryGrid.innerHTML = CATEGORIES.map((cat) => {
      const isActive = cat.id === state.selectedCategoryId;
      return `
            <button class="category-btn ${isActive ? "active" : ""}" data-id="${
        cat.id
      }" style="outline-color: ${isActive ? cat.color : "transparent"};">
              <span class="icon">${cat.icon}</span><span class="name">${
        cat.name
      }</span>
            </button>
          `;
    }).join("");
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
        case "growthFactor":
          return ((a.growthFactor || 0) - (b.growthFactor || 0)) * order;
        default:
          return (a.id - b.id) * order;
      }
    });
  };
  const renderTasks = () => {
    const sorted = sortTasks(state.tasks);
    DOM.noTasksMessage.style.display = sorted.length === 0 ? "block" : "none";
    if (sorted.length === 0) {
      DOM.taskListEl.innerHTML = "";
    } else {
      DOM.taskListEl.innerHTML = sorted
        .map((task) => {
          const category =
            categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
          const intervalText =
            task.lapInterval === 1
              ? "Always"
              : `<i class="fas fa-redo-alt"></i> ${task.lapInterval}`;
          const growthText = `${task.growthFactor || 0}%`;
          return `
                <div class="task-item" data-id="${task.id}">
                  <div class="task-cell task-id-col">#${task.id}</div>
                  <div class="task-cell task-title-col">
                    <span class="task-title">${task.title}</span>
                    <span class="task-description">${
                      task.description || ""
                    }</span>
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
          state.currentVirtualTaskIndex > -1 &&
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
              <span class="duration">${formatTime(task.duration).replace(
                /(\d+)([a-z]+)/g,
                "$1 $2"
              )}</span>
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
  const resetTaskForm = () => {
    state.editingTaskId = null;
    DOM.formTitle.textContent = "Create New Task";
    DOM.taskInput.value = "";
    DOM.taskDescriptionInput.value = "";
    state.selectedCategoryId = "cat-0";
    DOM.durationMinutesInput.value = 1;
    DOM.durationSecondsInput.value = 30;
    DOM.lapIntervalInput.value = 1;
    DOM.growthFactorInput.value = 0;
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
        task.growthFactor = growthFactor;
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
    DOM.growthFactorInput.value = task.growthFactor || 0;
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
    if (copy.growthFactor === undefined) copy.growthFactor = 0;
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
    DOM.runnerDetails.baseDuration.textContent = "0s";
    DOM.runnerDetails.currentDuration.textContent = "0s";
    DOM.runnerDetails.occurrenceCount.textContent = "0";
    DOM.runnerDetails.changePercentage.textContent = "0%";
    DOM.runnerDetails.changeDelta.textContent = "0s";
    DOM.runnerDetails.sessionTotal.textContent = "0s";
  };
  const scrollToRunningTask = () => {
    const container = DOM.lapListEl;
    const runningTaskEl = container.querySelector(".lap-list-item.running");
    if (runningTaskEl && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = runningTaskEl.getBoundingClientRect();
      if (
        elementRect.top < containerRect.top ||
        elementRect.bottom > containerRect.bottom
      ) {
        const offset = runningTaskEl.offsetTop - container.offsetTop;
        const desiredScrollTop =
          offset - container.clientHeight / 2 + runningTaskEl.clientHeight / 2;
        container.scrollTo({
          top: desiredScrollTop,
          behavior: "smooth",
        });
      }
    }
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
    DOM.runnerDetails.baseDuration.textContent = formatTime(baseDuration);
    DOM.runnerDetails.currentDuration.textContent =
      formatTime(calculatedDuration);
    DOM.runnerDetails.occurrenceCount.textContent = `${occurrences} of ${totalOccurrences}`;
    DOM.runnerDetails.changePercentage.textContent = `${changePercentage}%`;
    DOM.runnerDetails.changeDelta.textContent = formatTime(changeDelta);
    DOM.runnerDetails.sessionTotal.textContent = formatTime(sessionTotalTime);
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
    updateTimerDisplay();
    renderLapList();
    scrollToRunningTask();
  };
  const updateTimerDisplay = () => {
    if (state.currentVirtualTaskIndex === -1) return;
    const currentVirtualTask =
      state.sessionCache.virtualSessionPlaylist[state.currentVirtualTaskIndex];
    if (!currentVirtualTask) return;
    const { taskId, calculatedDuration, lap, taskIndexInLap, totalTasksInLap } =
      currentVirtualTask;
    const elapsed = calculatedDuration - state.currentTaskTimeLeft;
    const taskPercent =
      calculatedDuration > 0
        ? Math.floor((elapsed / calculatedDuration) * 100)
        : 0;
    const sessionTotalTime =
      (state.sessionCache.completedTaskDurationsMap.get(taskId) || 0) + elapsed;
    DOM.runnerDetails.sessionTotal.textContent = formatTime(sessionTotalTime);
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
    DOM.lapsProgressLabel.textContent = `Lap ${activeLapNumber} of ${state.sessionCache.totalActiveLaps} - Task ${taskIndexInLap} of ${totalTasksInLap}`;
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
        const lastRun = lastRunLap.has(taskId) ? lastRunLap.get(taskId) : -1;
        if (lap === 0 || (lap > lastRun && (lap - lastRun) % interval === 0)) {
          const occurrences = (totalTaskOccurrencesMap.get(taskId) || 0) + 1;
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
        virtualSessionPlaylist.push({
          ...taskInfo,
          lap,
          totalTasksInLap,
          taskIndexInLap: indexInLap + 1,
          totalOccurrences: totalTaskOccurrencesMap.get(taskInfo.taskId) || 0,
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
        "No tasks are scheduled to run in this session with the current intervals."
      );
      return false;
    }
    state.sessionCache = {
      ...playlistData,
      taskMap,
      totalLaps,
      completedTaskDurationsMap: new Map(), // Reset for new session
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
      showConfirmationModal(
        "🎉 Congratulations! 🎉",
        `Session Complete! You finished ${
          state.sessionCache.totalLaps || 0
        } lap(s).`,
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
  const restartSession = () => {
    // NEW
    stopTimerInterval();
    state.runnerState = "PAUSED"; // Go to paused state, not stopped
    DOM.playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
    // Rebuild playlist and reset completed times
    state.sessionCache.completedTaskDurationsMap = new Map();
    const playlistData = buildVirtualPlaylist(
      state.sessionCache.taskMap,
      state.sessionCache.totalLaps
    );
    state.sessionCache = { ...state.sessionCache, ...playlistData };
    loadTaskToRunner(0);
    state.runnerState = "RUNNING"; // Pretend it was running to allow immediate pause/play
    playPauseSession(); // Call this to set state to PAUSED correctly
  };
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
    }, 300); // Match animation duration
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
  const toggleAllPanels = (collapse) => {
    const panels = $$(".panel[id]");
    panels.forEach((panel) => {
      const isCurrentlyCollapsed = panel.classList.contains("collapsed");
      const collapseBtn = panel.querySelector(".collapse-btn");
      if (collapse && !isCurrentlyCollapsed) {
        panel.classList.add("collapsed");
        if (collapseBtn) collapseBtn.setAttribute("aria-expanded", "false");
        state.panelCollapseState[panel.id] = true;
      } else if (!collapse && isCurrentlyCollapsed) {
        panel.classList.remove("collapsed");
        if (collapseBtn) collapseBtn.setAttribute("aria-expanded", "true");
        state.panelCollapseState[panel.id] = false;
      }
    });
    localStorage.setItem(
      "panelCollapseState",
      JSON.stringify(state.panelCollapseState)
    );
  };
  const toggleRunnerPopout = () => {
    const panel = $("#task-runner-panel");
    const body = document.body;
    const icon = DOM.popoutRunnerBtn.querySelector("i");
    panel.classList.toggle("task-runner-popout");
    body.classList.toggle("runner-popped-out");
    if (panel.classList.contains("task-runner-popout")) {
      if (panel.classList.contains("collapsed")) {
        panel.classList.remove("collapsed");
        const collapseBtn = panel.querySelector(".collapse-btn");
        if (collapseBtn) collapseBtn.setAttribute("aria-expanded", "true");
        state.panelCollapseState[panel.id] = false;
        localStorage.setItem(
          "panelCollapseState",
          JSON.stringify(state.panelCollapseState)
        );
      }
      icon.className = "fas fa-compress-arrows-alt";
      DOM.popoutRunnerBtn.title = "Exit Focus Mode";
    } else {
      icon.className = "fas fa-expand-arrows-alt";
      DOM.popoutRunnerBtn.title = "Focus Mode";
    }
  };
  const setupEventListeners = () => {
    DOM.addTaskBtn.addEventListener("click", handleTaskFormSubmit);
    DOM.cancelEditBtn.addEventListener("click", resetTaskForm);
    DOM.globalCollapseBtn.addEventListener("click", () =>
      toggleAllPanels(true)
    );
    DOM.globalExpandBtn.addEventListener("click", () => toggleAllPanels(false));
    DOM.popoutRunnerBtn.addEventListener("click", toggleRunnerPopout);
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
    DOM.categoryGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;
      state.selectedCategoryId = btn.dataset.id;
      renderCategoryButtons();
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
      showConfirmationModal(
        "Restart Session?",
        "This will restart the current session from the beginning. Are you sure?",
        () => restartSession()
      );
    });
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
              title: "Clean ears",
              description:
                "A quick but important part of a personal hygiene routine.",
              categoryId: "cat-1",
              duration: 120,
              lapInterval: 99,
              growthFactor: 0,
            },
            {
              id: 2,
              title: "Clean private email",
              description: "Organize and archive personal emails.",
              categoryId: "cat-4",
              duration: 60,
              lapInterval: 2,
              growthFactor: 10,
            },
            {
              id: 3,
              title: "Floss teeth",
              description: "Maintain dental hygiene.",
              categoryId: "cat-1",
              duration: 120,
              lapInterval: 99,
              growthFactor: 0,
            },
            {
              id: 4,
              title: "Clear personal mail",
              description: "Sort and remove old emails from your inbox.",
              categoryId: "cat-4",
              duration: 60,
              lapInterval: 3,
              growthFactor: 10,
            },
            {
              id: 5,
              title: "Scrape tongue",
              description: "Improve oral health by cleaning your tongue.",
              categoryId: "cat-1",
              duration: 120,
              lapInterval: 99,
              growthFactor: 0,
            },
            {
              id: 6,
              title: "Clear SMS/DMs/Messages",
              description: "Delete old or unnecessary messages and DMs.",
              categoryId: "cat-6",
              duration: 120,
              lapInterval: 2,
              growthFactor: -10,
            },
            {
              id: 7,
              title: "Pushups",
              description: "A quick set of pushups to build strength.",
              categoryId: "cat-1",
              duration: 60,
              lapInterval: 4,
              growthFactor: 20,
            },
            {
              id: 8,
              title: "Clear downloads",
              description:
                "Organize and delete files from your downloads folder.",
              categoryId: "cat-4",
              duration: 180,
              lapInterval: 3,
              growthFactor: -10,
            },
            {
              id: 9,
              title: "Breathing Exercise",
              description: "A short exercise to center yourself.",
              categoryId: "cat-2",
              duration: 30,
              lapInterval: 1,
              growthFactor: 5,
            },
            {
              id: 10,
              title: "Find Photos",
              description: "Sort and organize digital photo albums.",
              categoryId: "cat-4",
              duration: 300,
              lapInterval: 5,
              growthFactor: -20,
            },
            {
              id: 11,
              title: "Drink Water",
              description: "A quick reminder to stay hydrated.",
              categoryId: "cat-1",
              duration: 60,
              lapInterval: 3,
              growthFactor: 0,
            },
            {
              id: 12,
              title: "Code",
              description: "Focused coding session.",
              categoryId: "cat-3",
              duration: 300,
              lapInterval: 5,
              growthFactor: -10,
            },
            {
              id: 13,
              title: "Mindfulness",
              description: "Practice being present and aware.",
              categoryId: "cat-2",
              duration: 10,
              lapInterval: 4,
              growthFactor: 20,
            },
            {
              id: 14,
              title: "Work emails",
              description: "Review and respond to new work emails.",
              categoryId: "cat-3",
              duration: 60,
              lapInterval: 6,
              growthFactor: 5,
            },
            {
              id: 15,
              title: "Squats",
              description: "A quick set of squats for a leg workout.",
              categoryId: "cat-1",
              duration: 60,
              lapInterval: 5,
              growthFactor: 20,
            },
            {
              id: 16,
              title: "Review Finances",
              description: "Check your budget and recent transactions.",
              categoryId: "cat-8",
              duration: 90,
              lapInterval: 4,
              growthFactor: 1,
            },
            {
              id: 17,
              title: "Planning",
              description: "Plan out your next tasks or day.",
              categoryId: "cat-9",
              duration: 120,
              lapInterval: 3,
              growthFactor: 0,
            },
            {
              id: 18,
              title: "Stretch",
              description: "A short stretch to loosen up muscles.",
              categoryId: "cat-1",
              duration: 10,
              lapInterval: 3,
              growthFactor: 10,
            },
            {
              id: 19,
              title: "Recharge",
              description: "A quick mental break to restore focus.",
              categoryId: "cat-2",
              duration: 60,
              lapInterval: 7,
              growthFactor: 0,
            },
            {
              id: 20,
              title: "Eat",
              description: "Eat a healthy meal or snack.",
              categoryId: "cat-1",
              duration: 240,
              lapInterval: 5,
              growthFactor: -10,
            },
            {
              id: 21,
              title: "Power Nap",
              description: "A short nap to boost energy.",
              categoryId: "cat-1",
              duration: 90,
              lapInterval: 4,
              growthFactor: -10,
            },
            {
              id: 22,
              title: "Read",
              description: "Read a chapter from a book or article.",
              categoryId: "cat-7",
              duration: 300,
              lapInterval: 8,
              growthFactor: -5,
            },
            {
              id: 23,
              title: "Play a Game",
              description: "Take a fun break with a game.",
              categoryId: "cat-6",
              duration: 600,
              lapInterval: 10,
              growthFactor: -5,
            },
            {
              id: 24,
              title: "Write Journal",
              description: "Reflect and write down your thoughts.",
              categoryId: "cat-2",
              duration: 300,
              lapInterval: 9,
              growthFactor: -10,
            },
            {
              id: 25,
              title: "Situps",
              description: "A quick set of situps for core strength.",
              categoryId: "cat-1",
              duration: 60,
              lapInterval: 6,
              growthFactor: 10,
            },
            {
              id: 26,
              title: "Tidy up",
              description: "Organize your physical space.",
              categoryId: "cat-4",
              duration: 60,
              lapInterval: 3,
              growthFactor: 20,
            },
            {
              id: 27,
              title: "Erase tracking",
              description: "Clear your browser history and cookies.",
              categoryId: "cat-4",
              duration: 120,
              lapInterval: 6,
              growthFactor: -3,
            },
            {
              id: 28,
              title: "Fold Laundry",
              description: "Take care of your clothes.",
              categoryId: "cat-4",
              duration: 120,
              lapInterval: 8,
              growthFactor: 0,
            },
            {
              id: 29,
              title: "Work",
              description: "A short burst of focused work.",
              categoryId: "cat-3",
              duration: 120,
              lapInterval: 10,
              growthFactor: 2,
            },
            {
              id: 30,
              title: "Brush teeth",
              description: "A complete dental hygiene routine.",
              categoryId: "cat-1",
              duration: 240,
              lapInterval: 99,
              growthFactor: 0,
            },
            {
              id: 31,
              title: "Prepare",
              description: "Get ready for the next task or activity.",
              categoryId: "cat-9",
              duration: 120,
              lapInterval: 4,
              growthFactor: -1,
            },
            {
              id: 32,
              title: "Shower",
              description: "Take a refreshing shower.",
              categoryId: "cat-1",
              duration: 900,
              lapInterval: 99,
              growthFactor: 0,
            },
            {
              id: 33,
              title: "Connect with others",
              description: "Send a quick message to a friend or family member.",
              categoryId: "cat-5",
              duration: 120,
              lapInterval: 10,
              growthFactor: 1,
            },
            {
              id: 34,
              title: "Break",
              description: "A short break to refresh your mind.",
              categoryId: "cat-3",
              duration: 120,
              lapInterval: 1,
              growthFactor: 1,
            },
          ];
          state.lapList = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
          ];
          state.lastId = 34;
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
