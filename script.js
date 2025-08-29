// script.js for Todo Task Timer (TTT)

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
  const lapsInput = document.getElementById("laps-input");
  const stopLapsBtn = document.getElementById("stop-laps-btn");
  const lapsProgressContainer = document.getElementById(
    "laps-progress-container"
  );
  const lapsProgressLabel = document.getElementById("laps-progress-label");
  const lapProgressBar = document.getElementById("lap-progress-bar");
  const lapPercentage = document.getElementById("lap-percentage");
  const sessionProgressBar = document.getElementById("session-progress-bar");
  const sessionPercentage = document.getElementById("session-percentage");

  // --- State Management ---
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let lapList = JSON.parse(localStorage.getItem("lapList")) || [];
  let lastId = JSON.parse(localStorage.getItem("lastId")) || 0;
  let sortState = { field: "id", order: "desc" };
  let selectedCategoryId = "cat-0";
  let editingTaskId = null;

  // Runner State
  let sessionInterval = null;
  let runnerState = "STOPPED"; // STOPPED, RUNNING, PAUSED

  let currentLapTaskIndex = -1;
  let currentTaskTimeLeft = 0;

  let currentLap = 0;
  let totalLaps = 1;
  let totalSessionTime = 0;
  let confirmCallback = null;

  // --- Core Functions ---
  const saveState = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("lapList", JSON.stringify(lapList));
    localStorage.setItem("lastId", JSON.stringify(lastId));
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

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
          const catA =
            CATEGORIES.find((c) => c.id === a.categoryId)?.name || "";
          const catB =
            CATEGORIES.find((c) => c.id === b.categoryId)?.name || "";
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
                CATEGORIES.find((c) => c.id === task.categoryId) ||
                CATEGORIES[0];
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
    const lapDuration = lapList.reduce(
      (sum, taskId) =>
        sum + (tasks.find((t) => t.id === taskId)?.duration || 0),
      0
    );
    lapListDurationEl.textContent = `Total: ${formatTime(lapDuration)}`;

    lapListEl.innerHTML =
      lapList.length === 0
        ? '<div class="lap-list-item">Add tasks from the repository to create a playlist.</div>'
        : lapList
            .map((taskId, index) => {
              const task = tasks.find((t) => t.id === taskId);
              if (!task) return ""; // Task might have been deleted
              const isRunning =
                runnerState !== "STOPPED" && index === currentLapTaskIndex;
              return `
                    <div class="lap-list-item ${
                      isRunning ? "running" : ""
                    }" data-id="${taskId}">
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
      // Editing existing task
      const task = tasks.find((t) => t.id === editingTaskId);
      if (task) {
        task.title = title;
        task.description = taskDescriptionInput.value.trim();
        task.categoryId = selectedCategoryId;
        task.duration = totalDuration;
      }
    } else {
      // Adding new task
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
    if (runnerState !== "STOPPED" && lapList.includes(id))
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
    taskForm.reset();
    selectedCategoryId = "cat-0";
    durationMinutesInput.value = 1;
    durationSecondsInput.value = 30;
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    cancelEditBtn.style.display = "none";
    renderCategoryButtons();
    taskInput.focus();
  };

  const deleteTask = (id) => {
    if (runnerState !== "STOPPED" && lapList.includes(id))
      return alert(
        "Cannot delete a task that is part of an active lap session."
      );

    tasks = tasks.filter((task) => task.id !== id);
    lapList = lapList.filter((lapId) => lapId !== id); // Also remove from lap list if present
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
    if (runnerState !== "STOPPED")
      return alert("Please stop the lap session to modify the playlist.");
    if (!lapList.includes(id)) {
      lapList.push(id);
      saveState();
      renderLapList();
    }
  };

  const removeTaskFromLap = (id) => {
    if (runnerState !== "STOPPED")
      return alert("Please stop the lap session to modify the playlist.");
    lapList = lapList.filter((lapId) => lapId !== id);
    saveState();
    renderLapList();
  };

  // --- Task Runner Logic ---
  const loadTaskToRunner = (lapIndex) => {
    currentLapTaskIndex = lapIndex;
    const taskId = lapList[lapIndex];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return stopSession(true); // Stop if task not found

    const category =
      CATEGORIES.find((c) => c.id === task.categoryId) || CATEGORIES[0];

    runnerTaskCategory.textContent = `${category.icon} ${category.name}`;
    runnerTaskTitle.textContent = task.title;
    currentTaskTimeLeft = task.duration;

    updateTimerDisplay();
    renderLapList();
  };

  const updateTimerDisplay = () => {
    if (currentLapTaskIndex !== -1) {
      const taskId = lapList[currentLapTaskIndex];
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const elapsed = task.duration - currentTaskTimeLeft;
        timeElapsedEl.textContent = formatTime(elapsed);
        timeRemainingEl.textContent = `-${formatTime(currentTaskTimeLeft)}`;
        const taskPercent =
          task.duration > 0 ? Math.floor((elapsed / task.duration) * 100) : 0;
        taskProgressBar.style.width = `${taskPercent}%`;
        taskPercentage.textContent = `${taskPercent}%`;
      }
    }

    if (runnerState !== "STOPPED") {
      const singleLapDuration = lapList.reduce(
        (sum, taskId) =>
          sum + (tasks.find((t) => t.id === taskId)?.duration || 0),
        0
      );

      let completedTasksDurationInLap = 0;
      for (let i = 0; i < currentLapTaskIndex; i++) {
        completedTasksDurationInLap +=
          tasks.find((t) => t.id === lapList[i])?.duration || 0;
      }

      const currentTask = tasks.find(
        (t) => t.id === lapList[currentLapTaskIndex]
      );
      const currentTaskElapsed = currentTask
        ? currentTask.duration - currentTaskTimeLeft
        : 0;
      const lapTimeElapsed = completedTasksDurationInLap + currentTaskElapsed;

      const lapPercent =
        singleLapDuration > 0
          ? Math.floor((lapTimeElapsed / singleLapDuration) * 100)
          : 0;
      lapProgressBar.style.width = `${lapPercent}%`;
      lapPercentage.textContent = `${lapPercent}%`;

      const sessionElapsed = currentLap * singleLapDuration + lapTimeElapsed;
      const sessionPercent =
        totalSessionTime > 0
          ? Math.floor((sessionElapsed / totalSessionTime) * 100)
          : 0;
      sessionProgressBar.style.width = `${sessionPercent}%`;
      sessionPercentage.textContent = `${sessionPercent}%`;
    }
  };

  const playPauseSession = () => {
    if (runnerState === "RUNNING") {
      clearInterval(sessionInterval);
      runnerState = "PAUSED";
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      // PAUSED or STOPPED
      if (lapList.length === 0)
        return alert("Add tasks to the Lap Playlist before starting.");

      if (runnerState === "STOPPED") {
        startSession();
      }

      runnerState = "RUNNING";
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

      sessionInterval = setInterval(() => {
        currentTaskTimeLeft--;
        updateTimerDisplay();

        if (currentTaskTimeLeft < 0) {
          handleTaskCompletion();
        }
      }, 1000);
    }
  };

  const handleTaskCompletion = () => {
    const nextLapTaskIndex = currentLapTaskIndex + 1;
    if (nextLapTaskIndex < lapList.length) {
      loadTaskToRunner(nextLapTaskIndex);
    } else {
      currentLap++;
      if (currentLap < totalLaps) {
        lapsProgressLabel.textContent = `Lap ${currentLap + 1} of ${totalLaps}`;
        loadTaskToRunner(0);
      } else {
        stopSession(true); // Finished
      }
    }
  };

  const startSession = () => {
    totalLaps = parseInt(lapsInput.value, 10) || 1;
    currentLap = 0;

    const singleLapDuration = lapList.reduce((sum, taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      return sum + (task ? task.duration : 0);
    }, 0);
    totalSessionTime = singleLapDuration * totalLaps;

    lapsProgressLabel.textContent = `Lap ${currentLap + 1} of ${totalLaps}`;
    lapsProgressContainer.style.display = "block";

    loadTaskToRunner(0);

    stopLapsBtn.style.display = "inline-block";
    lapsInput.disabled = true;
  };

  const stopSession = (finished = false) => {
    clearInterval(sessionInterval);
    runnerState = "STOPPED";

    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopLapsBtn.style.display = "none";
    lapsInput.disabled = false;

    if (finished) {
      lapsProgressLabel.textContent = `Session Complete! (${totalLaps} laps)`;
      showConfirmationModal(
        `Session Complete! You finished ${totalLaps} lap(s).`,
        () => {
          lapsProgressContainer.style.display = "none";
          loadTaskToRunner(0); // Reset to first task visually
        },
        "alert"
      );
    } else {
      lapsProgressContainer.style.display = "none";
    }

    currentLapTaskIndex = -1;
    renderLapList(); // Remove highlighting
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

  const showConfirmationModal = (text, onConfirm, type = "confirm") => {
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
      const id = Number(lapItem.dataset.id);
      removeTaskFromLap(id);
    });

    categoryGrid.addEventListener("click", (e) => {
      const button = e.target.closest(".category-btn");
      if (!button) return;
      selectedCategoryId = button.dataset.id;
      renderCategoryButtons();
    });

    playPauseBtn.addEventListener("click", playPauseSession);
    nextTaskBtn.addEventListener("click", () => {
      if (runnerState !== "STOPPED") handleTaskCompletion();
    });
    prevTaskBtn.addEventListener("click", () => {
      if (runnerState !== "STOPPED")
        loadTaskToRunner(
          (currentLapTaskIndex - 1 + lapList.length) % lapList.length
        );
    });

    stopLapsBtn.addEventListener("click", () => stopSession(false));

    themeToggleBtn.addEventListener("click", () =>
      applyTheme(
        document.body.classList.contains("dark-theme") ? "light" : "dark"
      )
    );

    deleteAllBtn.addEventListener("click", () => {
      if (runnerState !== "STOPPED")
        return alert("Please stop the lap session to delete all tasks.");
      showConfirmationModal(
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
      if (runnerState !== "STOPPED")
        return alert("Please stop the lap session to add all tasks.");
      tasks.forEach((task) => addTaskToLap(task.id));
    });

    clearLapListBtn.addEventListener("click", () => {
      if (runnerState !== "STOPPED")
        return alert("Please stop the lap session to clear the playlist.");
      lapList = [];
      saveState();
      renderLapList();
    });

    resetAppBtn.addEventListener("click", () => {
      showConfirmationModal(
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
  };

  const init = () => {
    applyTheme(localStorage.getItem("theme") || "dark");
    durationMinutesInput.value = 1;
    durationSecondsInput.value = 30;
    setupEventListeners();
    renderCategoryButtons(); // Render categories on initial load
    updateSort("id"); // This also calls renderTasks and renderLapList
  };

  init();
});
