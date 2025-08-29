// script.js for Todo Task Timer (TTT) - Optimized & Fixed Version

document.addEventListener("DOMContentLoaded", () => {
  // --- Constants ---
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

  // --- DOM Elements ---
  const taskForm = document.getElementById("task-form");
  const formTitle = document.getElementById("form-title");
  const taskInput = document.getElementById("task-input");
  const taskDescriptionInput = document.getElementById(
    "task-description-input"
  );
  const categoryGrid = document.getElementById("category-grid");
  const durationMinutesInput = document.getElementById("task-duration-minutes");
  const durationSecondsInput = document.getElementById("task-duration-seconds");
  const lapIntervalInput = document.getElementById("lap-interval-input");
  const addTaskBtn = document.getElementById("add-task-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const taskListEl = document.getElementById("task-list");
  const lapListEl = document.getElementById("lap-list");
  const lapListDurationEl = document.getElementById("lap-list-duration");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const addAllBtn = document.getElementById("add-all-btn");
  const clearLapListBtn = document.getElementById("clear-lap-list-btn");
  const confirmModal = document.getElementById("confirm-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalText = document.getElementById("modal-text");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const taskSummaryEl = document.getElementById("task-summary");
  const resetAppBtn = document.getElementById("reset-app-btn");

  // Runner DOM Elements
  const runnerTaskCategory = document.getElementById("runner-task-category");
  const runnerTaskTitle = document.getElementById("runner-task-title");
  const taskProgressBar = document.getElementById("task-progress-bar");
  const taskPercentage = document.getElementById("task-percentage");
  const timeElapsedEl = document.getElementById("time-elapsed");
  const timeRemainingEl = document.getElementById("time-remaining");
  const prevTaskBtn = document.getElementById("prev-task-btn");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const nextTaskBtn = document.getElementById("next-task-btn");

  // Laps DOM Elements
  const lapsControls = document.querySelector(".laps-controls");
  const sessionControls = document.getElementById("session-controls");
  const lapsInput = document.getElementById("laps-input");
  const stopLapsBtn = document.getElementById("stop-laps-btn");
  const prevLapBtn = document.getElementById("prev-lap-btn");
  const nextLapBtn = document.getElementById("next-lap-btn");
  const lapsProgressContainer = document.getElementById(
    "laps-progress-container"
  );
  const lapsProgressLabel = document.getElementById("laps-progress-label");
  const lapProgressBar = document.getElementById("lap-progress-bar");
  const lapPercentage = document.getElementById("lap-percentage");
  const lapTimeElapsedEl = document.getElementById("lap-time-elapsed");
  const lapTimeRemainingEl = document.getElementById("lap-time-remaining");
  const sessionProgressBar = document.getElementById("session-progress-bar");
  const sessionPercentage = document.getElementById("session-percentage");
  const sessionTimeElapsedEl = document.getElementById("session-time-elapsed");
  const sessionTimeRemainingEl = document.getElementById(
    "session-time-remaining"
  );
  // Cache selector to avoid repeated DOM queries
  const lapStepperBtns = document.querySelectorAll(
    '.stepper-btn[data-field="laps"]'
  );

  // --- State Management ---
  let tasks = (JSON.parse(localStorage.getItem("tasks")) || []).map((task) => ({
    ...task,
    lapInterval: task.lapInterval || 1,
  }));
  let lapList = JSON.parse(localStorage.getItem("lapList")) || [];
  let lastId = JSON.parse(localStorage.getItem("lastId")) || 0;
  let sortState = { field: "id", order: "desc" };
  let selectedCategoryId = "cat-0";
  let editingTaskId = null;
  let panelCollapseState =
    JSON.parse(localStorage.getItem("panelCollapseState")) || {};

  // Runner State
  let sessionInterval = null;
  let runnerState = "STOPPED"; // STOPPED, RUNNING, PAUSED
  let currentVirtualTaskIndex = -1;
  let currentTaskTimeLeft = 0;
  let confirmCallback = null;
  let draggedItemId = null;

  let sessionCache = {
    taskMap: new Map(),
    virtualSessionPlaylist: [],
    lapDurations: [],
    cumulativeSessionDurations: [],
    lapStartCumulativeDurations: [],
  };

  // --- Core Functions ---
  const saveState = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("lapList", JSON.stringify(lapList));
    localStorage.setItem("lastId", JSON.stringify(lastId));
  };

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

  // --- Helper Functions ---
  const isSessionActive = () => runnerState !== "STOPPED";
  const getTaskMap = () => new Map(tasks.map((task) => [task.id, task]));

  // --- UI Rendering ---
  const renderAll = () => {
    renderTasks();
    renderLapList();
    renderCategoryButtons();
  };

  const renderTaskSummary = () => {
    const totalTasks = tasks.length;
    const totalDurationInSeconds = tasks.reduce(
      (sum, task) => sum + task.duration,
      0
    );
    taskSummaryEl.innerHTML = `<span><strong>Total Tasks:</strong> ${totalTasks}</span><span><strong>Total Duration:</strong> ${formatTime(
      totalDurationInSeconds
    )}</span>`;
  };

  const renderTasks = () => {
    const sortedTasks = [...tasks].sort((a, b) => {
      const order = sortState.order === "asc" ? 1 : -1;
      const lapIntervalA = a.lapInterval || 1;
      const lapIntervalB = b.lapInterval || 1;
      switch (sortState.field) {
        case "title":
          return a.title.localeCompare(b.title) * order;
        case "duration":
          return (a.duration - b.duration) * order;
        case "category":
          const catA = categoryMap.get(a.categoryId)?.name || "";
          const catB = categoryMap.get(b.categoryId)?.name || "";
          return catA.localeCompare(catB) * order;
        case "lapInterval":
          return (lapIntervalA - lapIntervalB) * order;
        default:
          return (a.id - b.id) * order;
      }
    });
    taskListEl.innerHTML =
      sortedTasks.length === 0
        ? '<div class="task-item">No tasks yet. Add one above!</div>'
        : sortedTasks
            .map((task) => {
              const category =
                categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
              const intervalText =
                task.lapInterval === 1
                  ? "Always"
                  : `<i class="fas fa-redo-alt"></i> ${task.lapInterval}`;
              return `
                    <div class="task-item" data-id="${task.id}">
                        <div class="task-id">#${task.id}</div>
                        <div class="task-details">
                            <span class="task-title">${task.title}</span>
                            <span class="task-description">${
                              task.description || ""
                            }</span>
                        </div>
                        <div class="task-category"><span class="task-category-badge" style="background-color: ${
                          category.color
                        };">${category.icon} ${category.name}</span></div>
                        <div class="task-duration">${formatTime(
                          task.duration
                        )}</div>
                        <div class="task-lap-interval">${intervalText}</div>
                        <div class="actions">
                            <button class="add-to-lap-btn" title="Add to Lap"><i class="fas fa-plus-circle"></i></button>
                            <button class="edit-btn" title="Edit Task"><i class="fas fa-edit"></i></button>
                            <button class="copy-btn" title="Duplicate"><i class="fas fa-copy"></i></button>
                            <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
            })
            .join("");
    renderTaskSummary();
  };

  const renderLapList = () => {
    const taskMap = getTaskMap();
    const lapDuration = lapList.reduce(
      (sum, taskId) => sum + (taskMap.get(taskId)?.duration || 0),
      0
    );
    lapListDurationEl.textContent = `Total: ${formatTime(lapDuration)}`;
    const sessionInactive = !isSessionActive();
    const draggable = sessionInactive ? 'draggable="true"' : "";
    lapListEl.innerHTML =
      lapList.length === 0
        ? '<div class="lap-list-item">Add tasks from the repository to create a playlist.</div>'
        : lapList
            .map((taskId) => {
              const task = taskMap.get(taskId);
              if (!task) return "";
              const category =
                categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
              const isRunning =
                isSessionActive() &&
                task.id ===
                  sessionCache.virtualSessionPlaylist[currentVirtualTaskIndex]
                    ?.taskId;
              const actionButtons = sessionInactive
                ? `<div class="lap-item-actions">
                    <button class="move-btn" data-action="top" title="Move to Top"><i class="fas fa-angle-double-up"></i></button>
                    <button class="move-btn" data-action="bottom" title="Move to Bottom"><i class="fas fa-angle-double-down"></i></button>
                    <button class="remove-btn" title="Remove from Lap"><i class="fas fa-times-circle"></i></button>
                </div>`
                : `<div class="lap-item-actions"><button class="remove-btn" title="Remove from Lap"><i class="fas fa-times-circle"></i></button></div>`;
              return `<div class="lap-list-item ${
                isRunning ? "running" : ""
              }" ${draggable} data-id="${taskId}">
                        <span class="lap-category-icon" title="${
                          category.name
                        }">${category.icon}</span>
                        <div class="title">${task.title}</div>
                        <span class="duration">${formatTime(
                          task.duration
                        )}</span>
                        ${actionButtons}
                    </div>`;
            })
            .join("");
  };

  const renderCategoryButtons = () => {
    categoryGrid.innerHTML = CATEGORIES.map(
      (cat) => `
            <button class="category-btn ${
              cat.id === selectedCategoryId ? "active" : ""
            }" data-id="${cat.id}" style="border-color: ${
        cat.id === selectedCategoryId ? cat.color : "transparent"
      };">
                <span class="icon">${cat.icon}</span><span class="name">${
        cat.name
      }</span>
            </button>`
    ).join("");
  };

  // --- Task & Lap List CRUD ---
  const handleTaskFormSubmit = () => {
    const title = taskInput.value.trim();
    if (title === "") return alert("Task title cannot be empty.");
    const minutes = parseInt(durationMinutesInput.value, 10) || 0;
    const seconds = parseInt(durationSecondsInput.value, 10) || 0;
    const totalDuration = minutes * 60 + seconds;
    const lapInterval =
      Math.max(1, Math.min(99, parseInt(lapIntervalInput.value, 10))) || 1;
    if (totalDuration <= 0)
      return alert("Duration must be greater than 0 seconds.");
    if (editingTaskId !== null) {
      const task = tasks.find((t) => t.id === editingTaskId);
      if (task) {
        task.title = title;
        task.description = taskDescriptionInput.value.trim();
        task.categoryId = selectedCategoryId;
        task.duration = totalDuration;
        task.lapInterval = lapInterval;
      }
    } else {
      lastId++;
      tasks.push({
        id: lastId,
        title,
        description: taskDescriptionInput.value.trim(),
        categoryId: selectedCategoryId,
        duration: totalDuration,
        lapInterval: lapInterval,
      });
    }
    saveState();
    renderAll();
    resetTaskForm();
  };

  const loadTaskIntoForm = (id) => {
    if (isSessionActive())
      return alert("Cannot edit a task that is part of an active lap session.");
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    editingTaskId = id;
    formTitle.textContent = `Editing Task #${id}`;
    taskInput.value = task.title;
    taskDescriptionInput.value = task.description;
    selectedCategoryId = task.categoryId;
    durationMinutesInput.value = Math.floor(task.duration / 60);
    durationSecondsInput.value = task.duration % 60;
    lapIntervalInput.value = task.lapInterval || 1;
    addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    cancelEditBtn.style.display = "inline-block";
    renderCategoryButtons();
  };

  const resetTaskForm = () => {
    editingTaskId = null;
    formTitle.textContent = "Create New Task";
    taskInput.value = "";
    taskDescriptionInput.value = "";
    selectedCategoryId = "cat-0";
    durationMinutesInput.value = 1;
    durationSecondsInput.value = 30;
    lapIntervalInput.value = 1;
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    cancelEditBtn.style.display = "none";
    renderCategoryButtons();
    taskInput.focus();
  };

  const deleteTask = (id) => {
    if (isSessionActive())
      return alert(
        "Cannot delete a task that is part of an active lap session."
      );
    tasks = tasks.filter((task) => task.id !== id);
    lapList = lapList.filter((lapId) => lapId !== id);
    saveState();
    renderAll();
  };

  const duplicateTask = (id) => {
    const originalTask = tasks.find((task) => task.id === id);
    if (!originalTask) return;
    lastId++;
    const newTask = { ...originalTask, id: lastId };
    if (!newTask.lapInterval) newTask.lapInterval = 1;
    tasks.push(newTask);
    saveState();
    renderAll();
  };

  const addTaskToLap = (id) => {
    if (isSessionActive())
      return alert("Please stop the lap session to modify the playlist.");
    if (!lapList.includes(id)) {
      lapList.push(id);
      saveState();
      renderLapList();
    }
  };

  const removeTaskFromLap = (id) => {
    if (isSessionActive())
      return alert("Please stop the lap session to modify the playlist.");
    lapList = lapList.filter((lapId) => lapId !== id);
    saveState();
    renderLapList();
  };

  const resetRunnerDisplay = () => {
    runnerTaskCategory.textContent = "";
    runnerTaskTitle.textContent = "No task selected";
    taskProgressBar.style.width = "0%";
    taskPercentage.textContent = "0%";
    timeElapsedEl.textContent = "0s";
    timeRemainingEl.textContent = "0s";
    lapProgressBar.style.width = "0%";
    lapPercentage.textContent = "0%";
    lapTimeElapsedEl.textContent = "0s";
    lapTimeRemainingEl.textContent = "0s";
    sessionProgressBar.style.width = "0%";
    sessionPercentage.textContent = "0%";
    sessionTimeElapsedEl.textContent = "0s";
    sessionTimeRemainingEl.textContent = "0s";
  };

  // --- Task Runner Logic ---
  const stopTimerInterval = () => {
    clearInterval(sessionInterval);
    sessionInterval = null;
  };
  const startTimerInterval = () => {
    if (sessionInterval) stopTimerInterval();
    sessionInterval = setInterval(() => {
      currentTaskTimeLeft--;
      updateTimerDisplay();
      if (currentTaskTimeLeft < 0) {
        handleTaskCompletion();
      }
    }, 1000);
  };

  const loadTaskToRunner = (virtualIndex) => {
    currentVirtualTaskIndex = virtualIndex;
    if (
      virtualIndex < 0 ||
      virtualIndex >= sessionCache.virtualSessionPlaylist.length
    ) {
      return stopSession(true);
    }
    const { taskId } = sessionCache.virtualSessionPlaylist[virtualIndex];
    const task = sessionCache.taskMap.get(taskId);
    if (!task) return stopSession(true);
    const category =
      categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
    runnerTaskCategory.textContent = `${category.icon} ${category.name}`;
    runnerTaskTitle.textContent = task.title;
    currentTaskTimeLeft = task.duration;
    updateTimerDisplay();
    renderLapList();
  };

  const updateTimerDisplay = () => {
    if (currentVirtualTaskIndex === -1) return;
    const currentVirtualTask =
      sessionCache.virtualSessionPlaylist[currentVirtualTaskIndex];
    if (!currentVirtualTask) return;

    const { taskId, lap, tasksInLap, taskIndexInLap } = currentVirtualTask;
    const task = sessionCache.taskMap.get(taskId);
    if (!task) return;

    // Task Progress
    const elapsed = task.duration - currentTaskTimeLeft;
    const taskPercent =
      task.duration > 0 ? Math.floor((elapsed / task.duration) * 100) : 0;
    timeElapsedEl.textContent = formatTime(elapsed);
    timeRemainingEl.textContent = `-${formatTime(currentTaskTimeLeft)}`;
    taskProgressBar.style.width = `${taskPercent}%`;
    taskPercentage.textContent = `${taskPercent}%`;

    // Lap Progress (FIXED: Uses pre-calculated values for performance)
    const currentLapDuration = sessionCache.lapDurations[lap];
    const lapStartTime = sessionCache.lapStartCumulativeDurations[lap];
    const completedDurationInLap =
      (sessionCache.cumulativeSessionDurations[currentVirtualTaskIndex] || 0) -
      lapStartTime;
    const lapTimeElapsed = completedDurationInLap + elapsed;
    const lapTimeRemaining = currentLapDuration - lapTimeElapsed;
    const lapPercent =
      currentLapDuration > 0
        ? Math.floor((lapTimeElapsed / currentLapDuration) * 100)
        : 0;
    lapProgressBar.style.width = `${lapPercent}%`;
    lapPercentage.textContent = `${lapPercent}%`;
    lapTimeElapsedEl.textContent = formatTime(lapTimeElapsed);
    lapTimeRemainingEl.textContent`-${formatTime(lapTimeRemaining)}`;
    lapsProgressLabel.textContent = `Lap ${lap + 1} of ${
      sessionCache.totalLaps
    } (Task ${taskIndexInLap + 1} of ${tasksInLap.length})`;

    // Session Progress
    const totalSessionDuration = sessionCache.totalSessionDuration;
    const sessionTimeElapsed =
      (sessionCache.cumulativeSessionDurations[currentVirtualTaskIndex] || 0) +
      elapsed;
    const sessionTimeRemaining = totalSessionDuration - sessionTimeElapsed;
    const sessionPercent =
      totalSessionDuration > 0
        ? Math.floor((sessionTimeElapsed / totalSessionDuration) * 100)
        : 0;
    sessionProgressBar.style.width = `${sessionPercent}%`;
    sessionPercentage.textContent = `${sessionPercent}%`;
    sessionTimeElapsedEl.textContent = formatTime(sessionTimeElapsed);
    sessionTimeRemainingEl.textContent = `-${formatTime(sessionTimeRemaining)}`;
  };

  const playPauseSession = () => {
    if (runnerState === "RUNNING") {
      stopTimerInterval();
      runnerState = "PAUSED";
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      if (lapList.length === 0)
        return alert("Add tasks to the Lap Playlist before starting.");
      if (runnerState === "STOPPED") {
        if (!startSession()) return; // Abort if startSession fails
      }
      if (
        currentVirtualTaskIndex >= sessionCache.virtualSessionPlaylist.length
      ) {
        return;
      }
      runnerState = "RUNNING";
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startTimerInterval();
    }
  };

  const handleTaskCompletion = () => {
    loadTaskToRunner(currentVirtualTaskIndex + 1);
  };

  const skipToLap = (direction) => {
    if (!isSessionActive() || sessionCache.virtualSessionPlaylist.length === 0)
      return;
    const currentLap =
      sessionCache.virtualSessionPlaylist[currentVirtualTaskIndex].lap;
    let targetLap = currentLap + direction;
    if (targetLap >= sessionCache.totalLaps) {
      stopSession(true);
      return;
    }
    if (targetLap < 0) return;
    let nextVirtualIndex = sessionCache.virtualSessionPlaylist.findIndex(
      (task) => task.lap === targetLap
    );
    while (
      nextVirtualIndex === -1 &&
      targetLap < sessionCache.totalLaps &&
      targetLap >= 0
    ) {
      targetLap += direction;
      nextVirtualIndex = sessionCache.virtualSessionPlaylist.findIndex(
        (task) => task.lap === targetLap
      );
    }
    if (nextVirtualIndex !== -1) {
      const wasRunning = runnerState === "RUNNING";
      if (wasRunning) stopTimerInterval();
      loadTaskToRunner(nextVirtualIndex);
      if (wasRunning) startTimerInterval();
    } else if (direction > 0) {
      stopSession(true);
    }
  };

  const buildVirtualPlaylist = (taskMap, totalLaps) => {
    const virtualSessionPlaylist = [];
    const lapDurations = Array(totalLaps).fill(0);
    const lapStartCumulativeDurations = Array(totalLaps).fill(0);
    const tasksByLap = Array.from({ length: totalLaps }, () => []);
    let currentCumulativeDuration = 0;

    for (let lap = 0; lap < totalLaps; lap++) {
      lapStartCumulativeDurations[lap] = currentCumulativeDuration;
      lapList.forEach((taskId) => {
        const task = taskMap.get(taskId);
        if (!task) return;
        const interval = task.lapInterval || 1;
        if ((lap + 1) % interval === 0) {
          tasksByLap[lap].push({ taskId });
          lapDurations[lap] += task.duration;
          currentCumulativeDuration += task.duration;
        }
      });
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
        currentCumulativeDuration += taskMap.get(taskInfo.taskId).duration;
      });
    });

    return {
      virtualSessionPlaylist,
      lapDurations,
      lapStartCumulativeDurations,
      cumulativeSessionDurations,
      totalSessionDuration: currentCumulativeDuration,
    };
  };

  const startSession = () => {
    const totalLaps = parseInt(lapsInput.value, 10) || 1;
    const taskMap = getTaskMap();

    const playlistData = buildVirtualPlaylist(taskMap, totalLaps);

    if (playlistData.virtualSessionPlaylist.length === 0) {
      alert(
        "No tasks are scheduled to run in this session with the current intervals."
      );
      return false; // Indicate failure
    }

    sessionCache = {
      taskMap,
      totalLaps,
      ...playlistData,
    };

    lapsProgressContainer.style.display = "block";
    loadTaskToRunner(0);
    lapsControls.style.display = "none";
    sessionControls.style.display = "flex";
    lapsInput.disabled = true;
    lapStepperBtns.forEach((btn) => (btn.disabled = true));
    return true; // Indicate success
  };

  const stopSession = (finished = false) => {
    stopTimerInterval();
    runnerState = "STOPPED";
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    lapsControls.style.display = "flex";
    sessionControls.style.display = "none";
    lapsInput.disabled = false;
    lapStepperBtns.forEach((btn) => (btn.disabled = false));
    if (finished) {
      lapsProgressLabel.textContent = `Session Complete! (${
        sessionCache.totalLaps || 0
      } laps)`;
      showConfirmationModal(
        "🎉 Congratulations! 🎉",
        `Session Complete! You finished ${sessionCache.totalLaps || 0} lap(s).`,
        () => {
          lapsProgressContainer.style.display = "none";
          resetRunnerDisplay();
        },
        "alert"
      );
    } else {
      lapsProgressContainer.style.display = "none";
      resetRunnerDisplay();
    }
    currentVirtualTaskIndex = -1;
    renderLapList();
  };

  // --- Event Listeners and Setup ---
  const updateSort = (field) => {
    sortState.order =
      sortState.field === field && sortState.order === "asc" ? "desc" : "asc";
    sortState.field = field;
    document.querySelectorAll(".sort-header").forEach((header) => {
      header.classList.remove("active");
      header.querySelector("i").className = "fas";
    });
    const activeHeader = document.getElementById(`sort-by-${field}-btn`);
    activeHeader.classList.add("active");
    activeHeader
      .querySelector("i")
      .classList.add(
        sortState.order === "asc" ? "fa-arrow-up" : "fa-arrow-down"
      );
    renderTasks();
  };

  const applyTheme = (theme) => {
    document.body.className = theme + "-theme";
    localStorage.setItem("theme", theme);
  };

  const showConfirmationModal = (title, text, onConfirm, type = "confirm") => {
    modalTitle.textContent = title;
    modalText.textContent = text;
    confirmCallback = onConfirm;
    if (type === "alert") {
      modalCancelBtn.style.display = "none";
      modalConfirmBtn.textContent = "OK";
    } else {
      modalCancelBtn.style.display = "inline-block";
      modalConfirmBtn.textContent = "Confirm";
    }
    confirmModal.style.display = "flex";
  };

  const isModificationAllowed = (alertText) => {
    if (isSessionActive()) {
      alert(alertText);
      return false;
    }
    return true;
  };

  const setupEventListeners = () => {
    addTaskBtn.addEventListener("click", handleTaskFormSubmit);
    cancelEditBtn.addEventListener("click", resetTaskForm);
    taskListEl.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) return;
      const taskItem = e.target.closest(".task-item");
      const id = Number(taskItem.dataset.id);
      if (button.classList.contains("delete-btn")) deleteTask(id);
      if (button.classList.contains("copy-btn")) duplicateTask(id);
      if (button.classList.contains("add-to-lap-btn")) addTaskToLap(id);
      if (button.classList.contains("edit-btn")) loadTaskIntoForm(id);
    });

    lapListEl.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button || isSessionActive()) return;

      const lapItem = e.target.closest(".lap-list-item");
      const id = Number(lapItem.dataset.id);

      if (button.classList.contains("remove-btn")) {
        removeTaskFromLap(id);
      } else if (button.classList.contains("move-btn")) {
        const { action } = button.dataset;
        const currentIndex = lapList.indexOf(id);
        if (currentIndex === -1) return;

        lapList.splice(currentIndex, 1);

        if (action === "top") {
          lapList.unshift(id);
        } else if (action === "bottom") {
          lapList.push(id);
        }
        saveState();
        renderLapList();
      }
    });

    lapListEl.addEventListener("dragstart", (e) => {
      if (isSessionActive()) return;
      const item = e.target.closest(".lap-list-item");
      if (!item) return;
      draggedItemId = Number(item.dataset.id);
      setTimeout(() => item.classList.add("dragging"), 0);
    });

    lapListEl.addEventListener("dragend", (e) => {
      const item = e.target.closest(".lap-list-item");
      if (item) item.classList.remove("dragging");
      draggedItemId = null;
    });

    lapListEl.addEventListener("dragover", (e) => {
      if (isSessionActive()) return;
      e.preventDefault();
      const afterElement = getDragAfterElement(lapListEl, e.clientY);
      document
        .querySelectorAll(".drag-over-top, .drag-over-bottom")
        .forEach((el) => {
          el.classList.remove("drag-over-top", "drag-over-bottom");
        });

      if (afterElement) {
        afterElement.classList.add("drag-over-top");
      } else {
        const lastChild = lapListEl.lastElementChild;
        if (lastChild && !lastChild.classList.contains("dragging")) {
          lastChild.classList.add("drag-over-bottom");
        }
      }
    });

    lapListEl.addEventListener("drop", (e) => {
      if (isSessionActive()) return;
      e.preventDefault();
      document
        .querySelectorAll(".drag-over-top, .drag-over-bottom")
        .forEach((el) => {
          el.classList.remove("drag-over-top", "drag-over-bottom");
        });
      if (draggedItemId === null) return;

      const afterElement = getDragAfterElement(lapListEl, e.clientY);
      const oldIndex = lapList.indexOf(draggedItemId);
      if (oldIndex > -1) {
        lapList.splice(oldIndex, 1);
      }

      if (afterElement) {
        const afterId = Number(afterElement.dataset.id);
        const newIndex = lapList.indexOf(afterId);
        lapList.splice(newIndex, 0, draggedItemId);
      } else {
        lapList.push(draggedItemId);
      }
      saveState();
      renderLapList();
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [
        ...container.querySelectorAll(".lap-list-item:not(.dragging)"),
      ];
      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }

    categoryGrid.addEventListener("click", (e) => {
      const button = e.target.closest(".category-btn");
      if (!button) return;
      selectedCategoryId = button.dataset.id;
      renderCategoryButtons();
    });
    playPauseBtn.addEventListener("click", playPauseSession);
    nextTaskBtn.addEventListener("click", () => {
      if (isSessionActive()) handleTaskCompletion();
    });
    prevTaskBtn.addEventListener("click", () => {
      if (isSessionActive()) {
        loadTaskToRunner(currentVirtualTaskIndex - 1);
      }
    });
    stopLapsBtn.addEventListener("click", () => stopSession(false));
    nextLapBtn.addEventListener("click", () => skipToLap(1));
    prevLapBtn.addEventListener("click", () => skipToLap(-1));
    themeToggleBtn.addEventListener("click", () =>
      applyTheme(
        document.body.classList.contains("dark-theme") ? "light" : "dark"
      )
    );
    deleteAllBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed(
          "Please stop the lap session to delete all tasks."
        )
      )
        return;
      showConfirmationModal(
        "Delete All Tasks?",
        "This will permanently delete all tasks from the repository.",
        () => {
          tasks = [];
          lapList = [];
          lastId = 0;
          saveState();
          renderAll();
        }
      );
    });
    addAllBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed("Please stop the lap session to add all tasks.")
      )
        return;
      tasks.forEach((task) => addTaskToLap(task.id));
    });
    clearLapListBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed(
          "Please stop the lap session to clear the playlist."
        )
      )
        return;
      lapList = [];
      saveState();
      renderLapList();
    });
    resetAppBtn.addEventListener("click", () => {
      showConfirmationModal(
        "Reset Application?",
        "This will clear all data and load demo tasks. Are you sure?",
        () => {
          stopSession();
          tasks = [
            {
              id: 1,
              title: "Morning Exercise",
              description: "15 minutes of stretching and cardio.",
              categoryId: "cat-1",
              duration: 900,
              lapInterval: 1,
            },
            {
              id: 2,
              title: "Team Stand-up Meeting",
              description: "Daily sync with the development team.",
              categoryId: "cat-3",
              duration: 1500,
              lapInterval: 1,
            },
            {
              id: 3,
              title: "Read a Chapter",
              description: "Read one chapter of 'Atomic Habits'.",
              categoryId: "cat-7",
              duration: 1200,
              lapInterval: 2,
            },
            {
              id: 4,
              title: "Weekly Budget Review",
              description: "Check spending and update budget spreadsheet.",
              categoryId: "cat-8",
              duration: 600,
              lapInterval: 1,
            },
          ];
          lapList = [1, 2, 3, 4];
          lastId = 4;
          saveState();
          renderAll();
        }
      );
    });
    modalCancelBtn.addEventListener(
      "click",
      () => (confirmModal.style.display = "none")
    );
    modalConfirmBtn.addEventListener("click", () => {
      if (confirmCallback) confirmCallback();
      confirmModal.style.display = "none";
    });
    document.querySelectorAll(".sort-header").forEach((header) => {
      header.addEventListener("click", () =>
        updateSort(header.id.split("-")[2])
      );
    });
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const totalSeconds = parseInt(btn.dataset.duration, 10);
        durationMinutesInput.value = Math.floor(totalSeconds / 60);
        durationSecondsInput.value = totalSeconds % 60;
      });
    });
    document.querySelectorAll(".stepper-btn").forEach((btn) => {
      let interval;
      const stopInterval = () => clearInterval(interval);
      const { field, step } = btn.dataset;
      const input =
        field === "laps"
          ? lapsInput
          : field === "minutes"
          ? durationMinutesInput
          : field === "lapInterval"
          ? lapIntervalInput
          : durationSecondsInput;

      const update = () => {
        let value = parseInt(input.value, 10) || 0;
        let min = parseInt(input.min, 10) || 0;
        let max = parseInt(input.max, 10) || Infinity;
        value = Math.max(min, Math.min(max, value + parseInt(step)));
        input.value = value;
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
      const panel = collapseBtn.closest(".panel");
      const isCollapsed = panel.classList.toggle("collapsed");
      collapseBtn.setAttribute("aria-expanded", !isCollapsed);
      panelCollapseState[panel.id] = isCollapsed;
      localStorage.setItem(
        "panelCollapseState",
        JSON.stringify(panelCollapseState)
      );
    });
  };

  const init = () => {
    applyTheme(localStorage.getItem("theme") || "dark");
    document.querySelectorAll(".panel").forEach((panel) => {
      if (panelCollapseState[panel.id]) {
        panel.classList.add("collapsed");
        const btn = panel.querySelector(".collapse-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
    durationMinutesInput.value = 1;
    durationSecondsInput.value = 30;
    setupEventListeners();
    renderCategoryButtons();
    renderLapList();
    updateSort("id");
  };

  init();
});
