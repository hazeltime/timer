// script.js for Todo Task Timer (TTT) - Optimized Version

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
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
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
  let currentLapTaskIndex = -1;
  let currentTaskTimeLeft = 0;
  let currentLap = 0;
  let totalLaps = 1;
  let confirmCallback = null;

  let sessionCache = {
    taskMap: new Map(),
    singleLapDuration: 0,
    totalSessionDuration: 0,
    cumulativeLapDurations: [],
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
  const isTaskInActiveSession = (id) =>
    isSessionActive() && lapList.includes(id);

  // Helper to generate a task map, avoiding code duplication
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
      switch (sortState.field) {
        case "title":
          return a.title.localeCompare(b.title) * order;
        case "duration":
          return (a.duration - b.duration) * order;
        case "category":
          const catA = categoryMap.get(a.categoryId)?.name || "";
          const catB = categoryMap.get(b.categoryId)?.name || "";
          return catA.localeCompare(catB) * order;
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
    const taskMap = getTaskMap(); // Use the helper function
    const lapDuration = lapList.reduce(
      (sum, taskId) => sum + (taskMap.get(taskId)?.duration || 0),
      0
    );
    lapListDurationEl.textContent = `Total: ${formatTime(lapDuration)}`;
    lapListEl.innerHTML =
      lapList.length === 0
        ? '<div class="lap-list-item">Add tasks from the repository to create a playlist.</div>'
        : lapList
            .map((taskId, index) => {
              const task = taskMap.get(taskId);
              if (!task) return "";
              const category =
                categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
              const isRunning =
                isSessionActive() && index === currentLapTaskIndex;
              return `
                    <div class="lap-list-item ${
                      isRunning ? "running" : ""
                    }" data-id="${taskId}">
                        <span class="lap-category-icon" title="${
                          category.name
                        }">${category.icon}</span>
                        <span class="title">${task.title}</span>
                        <span class="duration">${formatTime(
                          task.duration
                        )}</span>
                        <button class="remove-btn" title="Remove from Lap"><i class="fas fa-times-circle"></i></button>
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
    if (totalDuration <= 0)
      return alert("Duration must be greater than 0 seconds.");
    if (editingTaskId !== null) {
      const task = tasks.find((t) => t.id === editingTaskId);
      if (task) {
        task.title = title;
        task.description = taskDescriptionInput.value.trim();
        task.categoryId = selectedCategoryId;
        task.duration = totalDuration;
      }
    } else {
      lastId++;
      tasks.push({
        id: lastId,
        title,
        description: taskDescriptionInput.value.trim(),
        categoryId: selectedCategoryId,
        duration: totalDuration,
      });
    }
    saveState();
    renderAll();
    resetTaskForm();
  };

  const loadTaskIntoForm = (id) => {
    if (isTaskInActiveSession(id))
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
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    cancelEditBtn.style.display = "none";
    renderCategoryButtons();
    taskInput.focus();
  };

  const deleteTask = (id) => {
    if (isTaskInActiveSession(id))
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
    tasks.push({ ...originalTask, id: lastId });
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

  const loadTaskToRunner = (lapIndex) => {
    currentLapTaskIndex = lapIndex;
    const taskId = lapList[lapIndex];
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
    if (currentLapTaskIndex !== -1) {
      const taskId = lapList[currentLapTaskIndex];
      const task = sessionCache.taskMap.get(taskId);
      if (task) {
        const elapsed = task.duration - currentTaskTimeLeft;
        const taskPercent =
          task.duration > 0 ? Math.floor((elapsed / task.duration) * 100) : 0;
        timeElapsedEl.textContent = formatTime(elapsed);
        timeRemainingEl.textContent = `-${formatTime(currentTaskTimeLeft)}`;
        taskProgressBar.style.width = `${taskPercent}%`;
        taskPercentage.textContent = `${taskPercent}%`;
      }
    }
    if (isSessionActive()) {
      const {
        singleLapDuration,
        totalSessionDuration,
        cumulativeLapDurations,
        taskMap,
      } = sessionCache;
      const currentTask = taskMap.get(lapList[currentLapTaskIndex]);
      const currentTaskElapsed = currentTask
        ? currentTask.duration - currentTaskTimeLeft
        : 0;
      const completedTasksDurationInLap =
        cumulativeLapDurations[currentLapTaskIndex] || 0;
      const lapTimeElapsed = completedTasksDurationInLap + currentTaskElapsed;
      const lapTimeRemaining = singleLapDuration - lapTimeElapsed;
      const lapPercent =
        singleLapDuration > 0
          ? Math.floor((lapTimeElapsed / singleLapDuration) * 100)
          : 0;
      lapProgressBar.style.width = `${lapPercent}%`;
      lapPercentage.textContent = `${lapPercent}%`;
      lapTimeElapsedEl.textContent = formatTime(lapTimeElapsed);
      lapTimeRemainingEl.textContent = `-${formatTime(lapTimeRemaining)}`;
      const sessionElapsed = currentLap * singleLapDuration + lapTimeElapsed;
      const sessionRemaining = totalSessionDuration - sessionElapsed;
      const sessionPercent =
        totalSessionDuration > 0
          ? Math.floor((sessionElapsed / totalSessionDuration) * 100)
          : 0;
      sessionProgressBar.style.width = `${sessionPercent}%`;
      sessionPercentage.textContent = `${sessionPercent}%`;
      sessionTimeElapsedEl.textContent = formatTime(sessionElapsed);
      sessionTimeRemainingEl.textContent = `-${formatTime(sessionRemaining)}`;
    }
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
        startSession();
      }
      runnerState = "RUNNING";
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startTimerInterval();
    }
  };

  const updateLapLabel = () => {
    lapsProgressLabel.textContent = `Lap ${currentLap + 1} of ${totalLaps}`;
  };

  const handleTaskCompletion = () => {
    const nextLapTaskIndex = currentLapTaskIndex + 1;
    if (nextLapTaskIndex < lapList.length) {
      loadTaskToRunner(nextLapTaskIndex);
    } else {
      currentLap++;
      if (currentLap < totalLaps) {
        updateLapLabel();
        loadTaskToRunner(0);
      } else {
        stopSession(true);
      }
    }
  };

  const skipToLap = (direction) => {
    if (!isSessionActive()) return;
    const newLap = currentLap + direction;

    if (direction === 1 && newLap >= totalLaps) {
      stopSession(true);
      return;
    }
    if (newLap < 0) return;

    const wasRunning = runnerState === "RUNNING";
    if (wasRunning) stopTimerInterval();

    currentLap = newLap;
    updateLapLabel();
    loadTaskToRunner(0);

    if (wasRunning) startTimerInterval();
  };

  const startSession = () => {
    totalLaps = parseInt(lapsInput.value, 10) || 1;
    currentLap = 0;
    const taskMap = getTaskMap(); // Use the helper function
    let cumulativeDuration = 0;
    const cumulativeLapDurations = [];
    lapList.forEach((taskId) => {
      const task = taskMap.get(taskId);
      cumulativeLapDurations.push(cumulativeDuration);
      cumulativeDuration += task ? task.duration : 0;
    });
    sessionCache = {
      taskMap,
      singleLapDuration: cumulativeDuration,
      totalSessionDuration: cumulativeDuration * totalLaps,
      cumulativeLapDurations,
    };
    updateLapLabel();
    lapsProgressContainer.style.display = "block";
    loadTaskToRunner(0);
    lapsControls.style.display = "none";
    sessionControls.style.display = "flex";
    lapsInput.disabled = true;
    lapStepperBtns.forEach((btn) => (btn.disabled = true)); // Use cached selector
  };

  const stopSession = (finished = false) => {
    stopTimerInterval();
    runnerState = "STOPPED";
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    lapsControls.style.display = "flex";
    sessionControls.style.display = "none";
    lapsInput.disabled = false;
    lapStepperBtns.forEach((btn) => (btn.disabled = false)); // Use cached selector
    if (finished) {
      lapsProgressLabel.textContent = `Session Complete! (${totalLaps} laps)`;
      showConfirmationModal(
        "🎉 Congratulations! 🎉",
        `Session Complete! You finished ${totalLaps} lap(s).`,
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
    currentLapTaskIndex = -1;
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
      const button = e.target.closest(".remove-btn");
      if (!button) return;
      const lapItem = e.target.closest(".lap-list-item");
      removeTaskFromLap(Number(lapItem.dataset.id));
    });
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
      if (isSessionActive() && lapList.length > 0)
        loadTaskToRunner(
          (currentLapTaskIndex - 1 + lapList.length) % lapList.length
        );
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
            },
            {
              id: 2,
              title: "Team Stand-up Meeting",
              description: "Daily sync with the development team.",
              categoryId: "cat-3",
              duration: 1500,
            },
            {
              id: 3,
              title: "Read a Chapter",
              description: "Read one chapter of 'Atomic Habits'.",
              categoryId: "cat-7",
              duration: 1200,
            },
            {
              id: 4,
              title: "Weekly Budget Review",
              description: "Check spending and update budget spreadsheet.",
              categoryId: "cat-8",
              duration: 600,
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
          : durationSecondsInput;
      const update = () => {
        let value = parseInt(input.value, 10) || 0;
        let min = field === "laps" ? 1 : 0;
        value = Math.max(min, value + parseInt(step));
        if (field === "seconds" && value > 59) value = 59;
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
