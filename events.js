// events.js

import * as UI from "./ui.js";
import * as Runner from "./runner.js";
import { state, saveState } from "./state.js";
import { DEMO_TASKS, DEMO_LAP_LIST } from "./demo-data.js";
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

export const setupEventListeners = (DOM) => {
  const { formDOM, repoDOM, playlistDOM, runnerDOM, headerDOM, modalDOM, guideModalDOM } = DOM;

  formDOM.addTaskBtn.addEventListener("click", () => handleTaskFormSubmit(formDOM, DOM));
  formDOM.cancelEditBtn.addEventListener("click", () => resetTaskForm(formDOM));
  headerDOM.globalCollapseBtn.addEventListener("click", () =>
    UI.toggleAllPanels(state, true)
  );
  headerDOM.globalExpandBtn.addEventListener("click", () =>
    UI.toggleAllPanels(state, false)
  );
  runnerDOM.popoutRunnerBtn.addEventListener("click", () =>
    UI.toggleRunnerPopout(runnerDOM, state)
  );

  document.addEventListener('mousedown', (e) => {
    const panel = document.getElementById('task-runner-panel');
    if (!panel) return;
    if (!panel.classList.contains('task-runner-popout')) return;
    if (panel.contains(e.target)) return;
    panel.classList.remove('task-runner-popout');
    document.body.classList.remove('runner-popped-out');
  });

  headerDOM.guideBtn.addEventListener("click", () => {
    const guideModal = guideModalDOM.guideModal;
    if (guideModal) {
      guideModal.style.display = "flex";
      guideModal.classList.add("show");
    }
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
    const id = Number(item.dataset.id);
    if (btn.classList.contains("delete-btn")) deleteTask(id, DOM);
    if (btn.classList.contains("copy-btn")) duplicateTask(id, DOM);
    if (btn.classList.contains("add-to-lap-btn")) addTaskToLap(id, playlistDOM, DOM);
    if (btn.classList.contains("edit-btn")) loadTaskIntoForm(id, formDOM, DOM);
  });

  playlistDOM.lapListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || Runner.isSessionActive()) return;
    const item = e.target.closest(".lap-list-item");
    const id = Number(item.dataset.id);
    if (btn.classList.contains("remove-btn")) removeTaskFromLap(id, playlistDOM);
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
    document.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach((el) =>
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
    if (Runner.isSessionActive()) return;
    e.preventDefault();
    document.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach((el) =>
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
    if (!Runner.isSessionActive()) return;
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
      !isModificationAllowed("Please stop the session to delete all tasks.", DOM)
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
        renderAll(DOM);
      }
    );
  });

  repoDOM.addAllBtn.addEventListener("click", () => {
    if (!isModificationAllowed("Please stop the session to add all tasks.", DOM))
      return;
    state.tasks.forEach((t) => addTaskToLap(t.id, playlistDOM, DOM));
  });

  playlistDOM.clearLapListBtn.addEventListener("click", () => {
    if (
      !isModificationAllowed("Please stop the session to clear the playlist.", DOM)
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
        state.tasks = JSON.parse(JSON.stringify(DEMO_TASKS));
        state.lapList = [...DEMO_LAP_LIST];
        state.lastId = DEMO_TASKS.reduce(
          (max, task) => Math.max(max, task.id),
          0
        );
        saveState();
        renderAll(DOM);
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

  document.querySelectorAll(".sort-header").forEach((h) =>
    h.addEventListener("click", () =>
      updateSort(h.id.replace("sort-by-", "").replace("-btn", ""), DOM)
    )
  );

  document.querySelectorAll(".preset-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const totalSeconds = parseInt(btn.dataset.duration, 10);
      formDOM.durationMinutesInput.value = Math.floor(totalSeconds / 60);
      formDOM.durationSecondsInput.value = totalSeconds % 60;
    })
  );

  document.querySelectorAll(".stepper-btn").forEach((btn) => {
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