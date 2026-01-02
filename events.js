// events.js

import * as UI from "./ui.js";
import * as Runner from "./runner.js";
import { state, saveState } from "./state.js";
import { DEMO_TASKS, DEMO_LAP_LIST } from "./demo-data.js";
import { ModalManager } from "./modal.js";
import { setupAdvancedModeToggle } from "./scripts/advanced-mode.js";
import { setupLimitToggle } from "./scripts/limit-toggle.js";
import { clamp } from "./utils.js";

let modalManager;
import {
  handleTaskFormSubmit,
  resetTaskForm,
  loadTaskIntoForm,
  deleteTask,
  duplicateTask,
  addTaskToLap,
  removeTaskFromLap,
  isModificationAllowed,
  getDragAfterElement,
  updateSort,
  renderAll,
  getTaskMap,
} from "./actions.js";

const dispatchButtonAction = (btn, handlers) => {
  for (const [className, handler] of handlers) {
    if (btn.classList.contains(className)) {
      handler();
      return true;
    }
  }
  return false;
};

const getInputBounds = (input) => {
  const minRaw = parseInt(input.min, 10);
  const maxRaw = parseInt(input.max, 10);
  return {
    min: Number.isNaN(minRaw) ? 0 : minRaw,
    max: Number.isNaN(maxRaw) ? Infinity : maxRaw,
  };
};

const clampInputToMin = (input) => {
  const value = parseInt(input.value, 10);
  const { min } = getInputBounds(input);
  if (!Number.isNaN(value) && value < min) input.value = min;
};

const clampInputToBounds = (input) => {
  const value = parseInt(input.value, 10) || 0;
  const { min, max } = getInputBounds(input);
  input.value = clamp(value, min, max);
};

export const setupEventListeners = (DOM) => {
  const {
    formDOM,
    repoDOM,
    playlistDOM,
    runnerDOM,
    headerDOM,
    modalDOM,
    guideModalDOM,
  } = DOM;

  // Init Modal Manager
  modalManager = new ModalManager(DOM);

  // Init Advanced Mode Toggle (Sprint 8)
  setupAdvancedModeToggle(formDOM);
  setupLimitToggle(formDOM);

  // Auto-focus title on load
  setTimeout(() => formDOM.taskInput.focus(), 100);

  // Auto-clear 0 on focus
  const zeroInputs = [
    formDOM.durationMinutesInput,
    formDOM.durationSecondsInput,
    formDOM.maxOccurrencesInput,
  ];
  zeroInputs.forEach((input) => {
    input.addEventListener("focus", () => {
      if (input.value === "0") input.value = "";
    });
    input.addEventListener("blur", () => {
      if (input.value === "") input.value = "0";
    });
  });

  // Allow Enter to submit
  formDOM.taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") formDOM.addTaskBtn.click();
  });

  formDOM.addTaskBtn.addEventListener("click", () =>
    handleTaskFormSubmit(formDOM, DOM),
  );
  formDOM.cancelEditBtn.addEventListener("click", () => resetTaskForm(formDOM));
  headerDOM.globalCollapseBtn.addEventListener("click", () =>
    UI.toggleAllPanels(state, true),
  );
  headerDOM.globalExpandBtn.addEventListener("click", () =>
    UI.toggleAllPanels(state, false),
  );
  runnerDOM.popoutRunnerBtn.addEventListener("click", () =>
    UI.toggleRunnerPopout(runnerDOM, state),
  );

  // Back-to-Top (Sprint 8: Polish)
  const backToTopBtn = document.getElementById("back-to-top");
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) backToTopBtn.classList.add("show");
      else backToTopBtn.classList.remove("show");
    });
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.addEventListener("mousedown", (e) => {
    const panel = document.getElementById("task-runner-panel");
    if (!panel) return;
    if (!panel.classList.contains("task-runner-popout")) return;
    if (panel.contains(e.target)) return;
    panel.classList.remove("task-runner-popout");
    document.body.classList.remove("runner-popped-out");
  });


  // Global Shortcuts (Sprint 8: Jakob's Law)
  document.addEventListener("keydown", (e) => {
    // Ignore if typing in input/textarea
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

    if (e.code === "Space") {
      e.preventDefault(); // Prevent scroll
      Runner.playPauseSession();
    }
    if (e.code === "Escape") {
      // Close any open modals
      if (modalManager) modalManager.closeAll(); // Assuming ModalManager has this or we need to access DOM directly
      // Or manually trigger close buttons if method missing:
      const openModals = document.querySelectorAll(".modal.show");
      openModals.forEach(m => {
        m.classList.remove("show");
        setTimeout(() => m.style.display = "none", 300);
      });
      // Also close Guide
      guideModalDOM.guideModalCloseBtn.click();
    }
  });

  headerDOM.guideBtn.addEventListener("click", () => {
    modalManager.openGuide();
  });

  guideModalDOM.guideModal.addEventListener("click", (e) => {
    if (e.target === guideModalDOM.guideModal) {
      guideModalDOM.guideModal.classList.remove("show");
      setTimeout(() => {
        guideModalDOM.guideModal.style.display = "none";
      }, 300);
    }
  });

  guideModalDOM.guideModalCloseBtn.addEventListener("click", () => {
    guideModalDOM.guideModal.classList.remove("show");
    setTimeout(() => {
      guideModalDOM.guideModal.style.display = "none";
    }, 300);
  });

  repoDOM.taskListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const item = e.target.closest(".task-item");
    if (!item) return;
    const id = Number(item.dataset.id);
    dispatchButtonAction(btn, [
      ["delete-btn", () => deleteTask(id, DOM)],
      ["copy-btn", () => duplicateTask(id, DOM)],
      ["add-to-lap-btn", () => addTaskToLap(id, playlistDOM, DOM)],
      ["edit-btn", () => loadTaskIntoForm(id, formDOM, DOM)],
    ]);
  });

  playlistDOM.lapListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || Runner.isSessionActive()) return;
    const item = e.target.closest(".lap-list-item");
    if (!item) return;
    const id = Number(item.dataset.id);
    dispatchButtonAction(btn, [
      ["remove-btn", () => removeTaskFromLap(id, playlistDOM, DOM)],
      [
        "move-btn",
        () => {
          const { action } = btn.dataset;
          const idx = state.lapList.indexOf(id);
          if (idx === -1) return;
          const [removed] = state.lapList.splice(idx, 1);
          if (action === "up" && idx > 0) {
            state.lapList.splice(idx - 1, 0, removed);
          } else if (action === "down" && idx < state.lapList.length) {
            state.lapList.splice(idx + 1, 0, removed);
          } else {
            state.lapList.splice(idx, 0, removed);
          }
          saveState();
          UI.renderLapList(playlistDOM, state, getTaskMap());
        },
      ],
    ]);
  });

  playlistDOM.lapListEl.addEventListener("dragstart", (e) => {
    if (Runner.isSessionActive()) return;
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
    if (Runner.isSessionActive()) return;
    e.preventDefault();
    const after = getDragAfterElement(playlistDOM.lapListEl, e.clientY);
    document
      .querySelectorAll(".drag-over-top, .drag-over-bottom")
      .forEach((el) =>
        el.classList.remove("drag-over-top", "drag-over-bottom"),
      );
    if (after) after.classList.add("drag-over-top");
    else {
      const last = playlistDOM.lapListEl.lastElementChild;
      if (last && !last.classList.contains("dragging"))
        last.classList.add("drag-over-bottom");
    }
  });

  playlistDOM.lapListEl.addEventListener("drop", (e) => {
    if (Runner.isSessionActive()) return;
    e.preventDefault();
    document
      .querySelectorAll(".drag-over-top, .drag-over-bottom")
      .forEach((el) =>
        el.classList.remove("drag-over-top", "drag-over-bottom"),
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
  runnerDOM.stopLapsBtn.addEventListener("click", () =>
    Runner.stopSession(false),
  );
  runnerDOM.restartLapsBtn.addEventListener("click", () => {
    if (!Runner.isSessionActive()) return;
    modalManager.openConfirm(
      "Restart Session?",
      "This will restart the current session from the beginning. Are you sure?",
      () => Runner.restartSession(),
    );
  });
  runnerDOM.nextLapBtn.addEventListener("click", () => Runner.skipToLap(1));
  runnerDOM.prevLapBtn.addEventListener("click", () => Runner.skipToLap(-1));

  headerDOM.themeToggleBtn.addEventListener("click", () =>
    UI.applyTheme(
      document.body.classList.contains("dark-theme") ? "light" : "dark",
    ),
  );

  repoDOM.deleteAllBtn.addEventListener("click", () => {
    if (
      !isModificationAllowed(
        "Please stop the session to delete all tasks.",
        DOM,
      )
    )
      return;
    modalManager.openConfirm(
      "Delete All Tasks?",
      "This will permanently delete all tasks from the repository. Are you sure?",
      () => {
        state.tasks = [];
        state.lapList = [];
        state.lastId = 0;
        saveState();
        renderAll(DOM);
      },
    );
  });

  repoDOM.addAllBtn.addEventListener("click", () => {
    if (
      !isModificationAllowed("Please stop the session to add all tasks.", DOM)
    )
      return;
    state.tasks.forEach((t) => addTaskToLap(t.id, playlistDOM, DOM));
  });

  playlistDOM.clearLapListBtn.addEventListener("click", () => {
    if (
      !isModificationAllowed(
        "Please stop the session to clear the playlist.",
        DOM,
      )
    )
      return;
    modalManager.openConfirm(
      "Clear Playlist?",
      "This will remove all tasks from the current playlist. Are you sure?",
      () => {
        state.lapList = [];
        saveState();
        UI.renderLapList(playlistDOM, state, getTaskMap());
      },
    );
  });

  headerDOM.resetAppBtn.addEventListener("click", () => {
    modalManager.openConfirm(
      "Reset Application?",
      "This will clear all data and load demo tasks. Are you sure?",
      () => {
        Runner.stopSession();
        state.tasks = JSON.parse(JSON.stringify(DEMO_TASKS));
        state.lapList = [...DEMO_LAP_LIST];
        state.lastId = DEMO_TASKS.reduce(
          (max, task) => Math.max(max, task.id),
          0,
        );
        saveState();
        renderAll(DOM);
      },
    );
  });

  modalDOM.modalCancelBtn.addEventListener("click", () =>
    UI.hideConfirmationModal(modalDOM),
  );
  modalDOM.modalConfirmBtn.addEventListener("click", () => {
    if (state.confirmCallback) state.confirmCallback();
    UI.hideConfirmationModal(modalDOM);
  });

  document
    .querySelectorAll(".sort-header")
    .forEach((h) =>
      h.addEventListener("click", () =>
        updateSort(h.id.replace("sort-by-", "").replace("-btn", ""), DOM),
      ),
    );

  document.querySelectorAll(".preset-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const totalSeconds = parseInt(btn.dataset.duration, 10);
      formDOM.durationMinutesInput.value = Math.floor(totalSeconds / 60);
      formDOM.durationSecondsInput.value = totalSeconds % 60;
    }),
  );

  const stepperInputs = {
    laps: runnerDOM.lapsInput,
    minutes: formDOM.durationMinutesInput,
    seconds: formDOM.durationSecondsInput,
    lapInterval: formDOM.lapIntervalInput,
    growthFactor: formDOM.growthFactorInput,
    maxOccurrences: formDOM.maxOccurrencesInput,
  };

  document.querySelectorAll(".stepper-btn").forEach((btn) => {
    let interval;
    const stopInterval = () => clearInterval(interval);
    const { field, step } = btn.dataset;
    const input = stepperInputs[field] || formDOM.durationSecondsInput;
    const update = () => {
      const current = parseInt(input.value, 10) || 0;
      const { min, max } = getInputBounds(input);
      const next = clamp(current + parseInt(step, 10), min, max);
      input.value = next;
    };
    btn.addEventListener("mousedown", () => {
      update();
      interval = setInterval(update, 120);
    });
    btn.addEventListener("mouseleave", stopInterval);
  });

  document.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("input", () => {
      // Clamp the min immediately to prevent negatives while typing.
      clampInputToMin(input);
    });
    // Ensure strict clamp on blur
    input.addEventListener("blur", () => {
      clampInputToBounds(input);
    });
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
        JSON.stringify(state.panelCollapseState),
      );
    }
  });
};
