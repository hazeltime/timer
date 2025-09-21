// Entry script: bootstraps app, loads components and wires UI
import * as UI from "./ui.js";
import * as Runner from "./runner.js";
import { state } from "./state.js";
import { setupEventListeners } from "./events.js";
import { renderAll, updateSort } from "./actions.js";

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
      if (!placeholder) {
        console.error(`Placeholder with ID ${id} not found.`);
        return;
      }
      // Basic validation: ensure fetched fragment contains an HTML tag
      if (!/<\w+/.test(html)) {
        console.error(`Component ${id} returned invalid HTML.`);
        return;
      }
      // Insert into a temporary container to avoid replacing the placeholder element itself
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      // Move children out of wrapper into DOM where placeholder was
      while (wrapper.firstChild) {
        placeholder.parentNode.insertBefore(wrapper.firstChild, placeholder);
      }
      // Remove the placeholder after inserting content
      placeholder.parentNode.removeChild(placeholder);
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

  const DOM = { formDOM, repoDOM, playlistDOM, runnerDOM, headerDOM, modalDOM, guideModalDOM };

  // Initialization
  const init = () => {
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
      lapListEl: playlistDOM.lapListEl,
      lapListDurationEl: playlistDOM.lapListDurationEl,
    };

    Runner.initRunner(state, runnerDOMForInit, modalDOM);
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

    setupEventListeners(DOM);
    renderAll(DOM);
    updateSort(state.sortState.field, DOM);
  };

  init();
});
