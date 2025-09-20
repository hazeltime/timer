// Entry script: bootstraps app, loads components and wires UI
import {
  CATEGORIES,
  categoryMap,
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS,
} from "./constants.js";
import * as UI from "./ui.js";
import { DEMO_TASKS, DEMO_LAP_LIST } from "./demo-data.js";
import * as Runner from "./runner.js";
import { clamp } from "./utils.js";

// Load and inject HTML component fragments before app initialization
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
    { id: "#guide-modal-placeholder", url: "components/guide-modal.html" },
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

  // DOM element references
  const formDOM = {
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
  };

  const repoDOM = {
    taskListEl: $("#task-list"),
    deleteAllBtn: $("#delete-all-btn"),
    addAllBtn: $("#add-all-btn"),
    taskSummaryEl: $("#task-summary"),
    noTasksMessage: $("#no-tasks-message"),
  };

  const playlistDOM = {
    lapListEl: $("#lap-list"),
    lapListDurationEl: $("#lap-list-duration"),
    clearLapListBtn: $("#clear-lap-list-btn"),
  };

  const runnerDOM = {
    popoutRunnerBtn: $("#popout-runner-btn"),
    runnerTaskCategory: $("#runner-task-category"),
    runnerTaskTitle: $("#runner-task-title"),
    runnerTaskDescription: $("#runner-task-description"),
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
  };

  const headerDOM = {
    themeToggleBtn: $("#theme-toggle-btn"),
    resetAppBtn: $("#reset-app-btn"),
        globalCollapseBtn: $("#global-collapse-btn"),
    globalExpandBtn: $("#global-expand-btn"),
    guideBtn: $("#guide-btn"),
  };

  const modalDOM = {
    confirmModal: $("#confirm-modal"),
    modalTitle: $("#modal-title"),
    modalText: $("#modal-text"),
    modalCancelBtn: $("#modal-cancel-btn"),
    modalConfirmBtn: $("#modal-confirm-btn"),
  };

  const guideModalDOM = {
    guideModal: $("#guide-modal"),
    guideModalCloseBtn: $("#guide-modal-close-btn"),
  };

  const DOM = { ...formDOM, ...repoDOM, ...playlistDOM, ...runnerDOM, ...headerDOM, ...modalDOM, ...guideModalDOM };

  // Application state
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
    draggedItemId: null,
    runnerState: "STOPPED",
    currentVirtualTaskIndex: -1,
    sessionCache: { completedOccurrencesMap: new Map(), virtualSessionPlaylist: [] },
  };

  // Use shared clamp from utils

  // State management
  const saveState = () => {
    localStorage.setItem("tasks", JSON.stringify(state.tasks));
    localStorage.setItem("lapList", JSON.stringify(state.lapList));
    localStorage.setItem("lastId", JSON.stringify(state.lastId));
  };

  const isSessionActive = () => Runner.isSessionActive();

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
    UI.renderTasks(repoDOM, sortedTasks, state.sortState);
    UI.renderLapList(playlistDOM, state, getTaskMap());
    UI.renderCategoryButtons(formDOM, state.selectedCategoryId);
  };

  const updateSort = (field) => {
    state.sortState.order =
      state.sortState.field === field && state.sortState.order === "asc"
        ? "desc"
        : "asc";
    state.sortState.field = field;
    UI.updateSortHeaders(state.sortState);
    const sortedTasks = sortTasks(state.tasks);
    UI.renderTasks(repoDOM, sortedTasks, state.sortState);
  };

  // Core logic

  const resetTaskForm = () => {
    state.editingTaskId = null;
    state.selectedCategoryId = "cat-0";
    UI.resetTaskFormUI(formDOM);
    UI.renderCategoryButtons(formDOM, state.selectedCategoryId);
  };

  const handleTaskFormSubmit = () => {
    const title = formDOM.taskInput.value.trim();
      if (!title) {
        UI.showAlert(DOM, "Validation", "Task title cannot be empty.");
        return;
    }
    const minutes = parseInt(formDOM.durationMinutesInput.value, 10) || 0;
    const seconds = parseInt(formDOM.durationSecondsInput.value, 10) || 0;
    const totalDuration = minutes * 60 + seconds;
    const lapInterval = clamp(
      parseInt(formDOM.lapIntervalInput.value, 10) || 1,
      1,
      99
    );
    const growthFactor = clamp(
      parseInt(formDOM.growthFactorInput.value, 10) || 0,
      -99,
      99
    );
    const maxOccurrences = clamp(
      parseInt(formDOM.maxOccurrencesInput.value, 10) || 0,
      0,
      999
    );
    if (totalDuration <= 0) {
      UI.showAlert(DOM, "Validation", "Duration must be greater than 0 seconds.");
      return;
    }
    if (state.editingTaskId !== null) {
      const task = state.tasks.find((t) => t.id === state.editingTaskId);
      if (task) {
        task.title = title;
        task.description = formDOM.taskDescriptionInput.value.trim();
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
        description: formDOM.taskDescriptionInput.value.trim(),
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
      UI.showAlert(DOM, "Action blocked", "Cannot edit a task that is part of an active lap session.");
      return;
    }
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    state.editingTaskId = id;
    state.selectedCategoryId = task.categoryId;
    UI.loadTaskIntoFormUI(formDOM, task);
    UI.renderCategoryButtons(formDOM, state.selectedCategoryId);
  };

  const deleteTask = (id) => {
    if (isSessionActive()) {
      UI.showAlert(DOM, "Action blocked", "Cannot delete a task that is part of an active lap session.");
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
      UI.showAlert(DOM, "Action blocked", "Please stop the lap session to modify the playlist.");
      return;
    }
    if (!state.lapList.includes(id)) {
      state.lapList.push(id);
      saveState();
      UI.renderLapList(playlistDOM, state, getTaskMap());
    }
  };

  const removeTaskFromLap = (id) => {
    if (isSessionActive()) {
      UI.showAlert(DOM, "Action blocked", "Please stop the lap session to modify the playlist.");
      return;
    }
    state.lapList = state.lapList.filter((l) => l !== id);
    saveState();
    UI.renderLapList(playlistDOM, state, getTaskMap());
  };

  // Runner logic is in runner.js

  const isModificationAllowed = (msg) => {
    if (isSessionActive()) {
      UI.showAlert(DOM, "Info", msg);
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

  // Event listeners
  const setupEventListeners = () => {
    formDOM.addTaskBtn.addEventListener("click", handleTaskFormSubmit);
    formDOM.cancelEditBtn.addEventListener("click", resetTaskForm);
    headerDOM.globalCollapseBtn.addEventListener("click", () =>
      UI.toggleAllPanels(state, true)
    );
    headerDOM.globalExpandBtn.addEventListener("click", () =>
      UI.toggleAllPanels(state, false)
    );
    runnerDOM.popoutRunnerBtn.addEventListener("click", () =>
      UI.toggleRunnerPopout(runnerDOM, state)
    );

    headerDOM.guideBtn.addEventListener("click", () => {
      const guideModal = $("#guide-modal");
      if (!guideModal) return;
      // Save previously focused element to restore later
      const previouslyFocused = document.activeElement;
      guideModal.style.display = "flex";
      guideModal.classList.add("show");
      const closeBtn = $("#guide-modal-close-btn");
      if (closeBtn) closeBtn.focus();

      // Focus trap
      const handleKey = (e) => {
        if (e.key === 'Escape') {
          guideModal.classList.remove('show');
          guideModal.style.display = 'none';
          if (previouslyFocused) previouslyFocused.focus();
          document.removeEventListener('keydown', handleKey);
        }
        if (e.key === 'Tab') {
          const focusable = guideModal.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', handleKey);
    });

    guideModalDOM.guideModalCloseBtn.addEventListener("click", () => {
      guideModalDOM.guideModal.classList.remove("show");
      setTimeout(() => {
        guideModalDOM.guideModal.style.display = "none";
      }, 300);
    });

    headerDOM.guideBtn.addEventListener("click", () => {
      const guideModal = $("#guide-modal");
      if (guideModal) guideModal.style.display = "flex";
    });

    document.body.addEventListener("click", (e) => {
      if (e.target.id === 'guide-modal-close-btn' || e.target.closest('#guide-modal-close-btn')) {
        const guideModal = $("#guide-modal");
        if (guideModal) guideModal.style.display = "none";
      }
    });

    repoDOM.taskListEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const item = e.target.closest(".task-item");
      const id = Number(item.dataset.id);
      if (btn.classList.contains("delete-btn")) deleteTask(id);
      if (btn.classList.contains("copy-btn")) duplicateTask(id);
      if (btn.classList.contains("add-to-lap-btn")) addTaskToLap(id);
      if (btn.classList.contains("edit-btn")) loadTaskIntoForm(id);
    });

    playlistDOM.lapListEl.addEventListener("click", (e) => {
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
        UI.renderLapList(playlistDOM, state, getTaskMap());
      }
    });

    playlistDOM.lapListEl.addEventListener("dragstart", (e) => {
      if (isSessionActive()) return;
      const item = e.target.closest(".lap-list-item");
      if (!item) return;
      state.draggedItemId = Number(item.dataset.id);
      setTimeout(() => item.classList.add("dragging"), 0);
    });

    playlistDOM.lapListEl.addEventListener("dragend", (e) => {
      const item = e.target.closest(".lap-list-item");
      if (item) item.classList.remove("dragging");
      state.draggedItemId = null;
    });

    playlistDOM.lapListEl.addEventListener("dragover", (e) => {
      if (isSessionActive()) return;
      e.preventDefault();
      const after = getDragAfterElement(playlistDOM.lapListEl, e.clientY);
      $$(".drag-over-top, .drag-over-bottom").forEach((el) =>
        el.classList.remove("drag-over-top", "drag-over-bottom")
      );
      if (after) after.classList.add("drag-over-top");
      else {
        const last = playlistDOM.lapListEl.lastElementChild;
        if (last && !last.classList.contains("dragging"))
          last.classList.add("drag-over-bottom");
      }
    });

    playlistDOM.lapListEl.addEventListener("drop", (e) => {
      if (isSessionActive()) return;
      e.preventDefault();
      $$(".drag-over-top, .drag-over-bottom").forEach((el) =>
        el.classList.remove("drag-over-top", "drag-over-bottom")
      );
      if (state.draggedItemId === null) return;
      const after = getDragAfterElement(playlistDOM.lapListEl, e.clientY);
      const oldIndex = state.lapList.indexOf(state.draggedItemId);
      if (oldIndex > -1) state.lapList.splice(oldIndex, 1);
      if (after) {
        const afterId = Number(after.dataset.id);
        const newIndex = state.lapList.indexOf(afterId);
        state.lapList.splice(newIndex, 0, state.draggedItemId);
      } else state.lapList.push(state.draggedItemId);
      saveState();
      UI.renderLapList(playlistDOM, state, getTaskMap());
    });

    formDOM.categoryGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;
      state.selectedCategoryId = btn.dataset.id;
      UI.renderCategoryButtons(formDOM, state.selectedCategoryId);
    });

    runnerDOM.playPauseBtn.addEventListener("click", Runner.playPauseSession);
    runnerDOM.nextTaskBtn.addEventListener("click", Runner.nextTask);
    runnerDOM.prevTaskBtn.addEventListener("click", Runner.prevTask);
    runnerDOM.stopLapsBtn.addEventListener("click", () => Runner.stopSession(false));
    runnerDOM.restartLapsBtn.addEventListener("click", () => {
      if (!isSessionActive()) return;
      UI.showConfirmationModal(
        modalDOM,
        state,
        "Restart Session?",
        "This will restart the current session from the beginning. Are you sure?",
        () => Runner.restartSession()
      );
    });
    runnerDOM.nextLapBtn.addEventListener("click", () => Runner.skipToLap(1));
    runnerDOM.prevLapBtn.addEventListener("click", () => Runner.skipToLap(-1));

    headerDOM.themeToggleBtn.addEventListener("click", () =>
      UI.applyTheme(
        document.body.classList.contains("dark-theme") ? "light" : "dark"
      )
    );

    repoDOM.deleteAllBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed("Please stop the session to delete all tasks.")
      )
        return;
      UI.showConfirmationModal(
        modalDOM,
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

    repoDOM.addAllBtn.addEventListener("click", () => {
      if (!isModificationAllowed("Please stop the session to add all tasks."))
        return;
      state.tasks.forEach((t) => addTaskToLap(t.id));
    });

    playlistDOM.clearLapListBtn.addEventListener("click", () => {
      if (
        !isModificationAllowed("Please stop the session to clear the playlist.")
      )
        return;
      UI.showConfirmationModal(
        modalDOM,
        state,
        "Clear Playlist?",
        "This will remove all tasks from the current playlist. Are you sure?",
        () => {
          state.lapList = [];
          saveState();
          UI.renderLapList(playlistDOM, state, getTaskMap());
        }
      );
    });

    headerDOM.resetAppBtn.addEventListener("click", () => {
      UI.showConfirmationModal(
        modalDOM,
        state,
        "Reset Application?",
        "This will clear all data and load demo tasks. Are you sure?",
        () => {
          Runner.stopSession();
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

    modalDOM.modalCancelBtn.addEventListener("click", () =>
      UI.hideConfirmationModal(modalDOM)
    );
    modalDOM.modalConfirmBtn.addEventListener("click", () => {
      if (state.confirmCallback) state.confirmCallback();
      UI.hideConfirmationModal(modalDOM);
    });

    $$(".sort-header").forEach((h) =>
      h.addEventListener("click", () =>
        updateSort(h.id.replace("sort-by-", "").replace("-btn", ""))
      )
    );

    $$(".preset-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const totalSeconds = parseInt(btn.dataset.duration, 10);
        formDOM.durationMinutesInput.value = Math.floor(totalSeconds / 60);
        formDOM.durationSecondsInput.value = totalSeconds % 60;
      })
    );

    $$(".stepper-btn").forEach((btn) => {
      let interval;
      const stopInterval = () => clearInterval(interval);
      const { field, step } = btn.dataset;
      const input =
        field === "laps"
          ? runnerDOM.lapsInput
          : field === "minutes"
          ? formDOM.durationMinutesInput
          : field === "lapInterval"
          ? formDOM.lapIntervalInput
          : field === "growthFactor"
          ? formDOM.growthFactorInput
          : field === "maxOccurrences"
          ? formDOM.maxOccurrencesInput
          : formDOM.durationSecondsInput;
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

  // Initialization
  const init = () => {
    // Pass a focused subset of DOM refs to the runner to avoid accidental coupling
    const runnerDOMForInit = {
      runnerTaskCategory: runnerDOM.runnerTaskCategory,
      runnerTaskTitle: runnerDOM.runnerTaskTitle,
      runnerTaskDescription: runnerDOM.runnerTaskDescription,
      taskProgressBar: runnerDOM.taskProgressBar,
      taskPercentage: runnerDOM.taskPercentage,
      timeElapsedEl: runnerDOM.timeElapsedEl,
      timeRemainingEl: runnerDOM.timeRemainingEl,
      prevTaskBtn: runnerDOM.prevTaskBtn,
      playPauseBtn: runnerDOM.playPauseBtn,
      nextTaskBtn: runnerDOM.nextTaskBtn,
      runnerDetails: runnerDOM.runnerDetails,
      lapsControls: runnerDOM.lapsControls,
      lapsInput: runnerDOM.lapsInput,
      stopLapsBtn: runnerDOM.stopLapsBtn,
      restartLapsBtn: runnerDOM.restartLapsBtn,
      prevLapBtn: runnerDOM.prevLapBtn,
      nextLapBtn: runnerDOM.nextLapBtn,
      lapsProgressContainer: runnerDOM.lapsProgressContainer,
      lapsProgressLabel: runnerDOM.lapsProgressLabel,
      lapProgressBar: runnerDOM.lapProgressBar,
      lapPercentage: runnerDOM.lapPercentage,
      lapTimeElapsedEl: runnerDOM.lapTimeElapsedEl,
      lapTimeRemainingEl: runnerDOM.lapTimeRemainingEl,
      sessionProgressBar: runnerDOM.sessionProgressBar,
      sessionPercentage: runnerDOM.sessionPercentage,
      sessionTimeElapsedEl: runnerDOM.sessionTimeElapsedEl,
      sessionTimeRemainingEl: runnerDOM.sessionTimeRemainingEl,
    };

    Runner.initRunner(state, runnerDOMForInit);
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

    formDOM.durationMinutesInput.value = 1;
    formDOM.durationSecondsInput.value = 30;

    setupEventListeners();
    renderAll();
    updateSort(state.sortState.field);
  };

  init();
});