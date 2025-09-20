// ui.js
import { CATEGORIES, categoryMap } from "./constants.js";

// --- UTILITY FUNCTIONS ---
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => [...document.querySelectorAll(sel)];

export const formatTime = (totalSeconds) => {
  const n = Number(totalSeconds);
  if (!Number.isFinite(n) || Number.isNaN(n)) return "0s";
  if (n === 0) return "0s";
  const isNegative = n < 0;
  const absSeconds = Math.abs(Math.floor(n));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds}s`);
  const formatted = parts.join(" ");
  return isNegative ? `-${formatted}` : formatted;
};

// --- RENDER FUNCTIONS ---
export const renderCategoryButtons = (formDOM, selectedCategoryId) => {
  formDOM.categoryGrid.innerHTML = CATEGORIES.map((cat) => {
    const isActive = cat.id === selectedCategoryId;
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

export const renderTaskSummary = (repoDOM, tasks) => {
  const totalTasks = tasks.length;
  const totalDurationInSeconds = tasks.reduce((s, t) => s + t.duration, 0);
  repoDOM.taskSummaryEl.innerHTML = `<span><strong>Total Tasks:</strong> ${totalTasks}</span><span><strong>Total Duration:</strong> ${formatTime(
    totalDurationInSeconds
  )}</span>`;
};

export const renderTasks = (repoDOM, tasks, sortState) => {
  repoDOM.noTasksMessage.style.display = tasks.length === 0 ? "block" : "none";
  if (tasks.length === 0) {
    repoDOM.taskListEl.innerHTML = "";
  } else {
    repoDOM.taskListEl.innerHTML = tasks
      .map((task) => {
        const category =
          categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
        const intervalText =
          task.lapInterval === 1
            ? "Always"
            : `<i class="fas fa-redo-alt"></i> ${task.lapInterval}`;
        const growthText = `${task.growthFactor || 0}%`;
        const limitText = task.maxOccurrences === 0 ? "∞" : task.maxOccurrences;
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
            <div class="task-cell task-limit-col">${limitText}</div>
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
  renderTaskSummary(repoDOM, tasks);
};

export const renderLapList = (playlistDOM, state, taskMap) => {
  const lapDuration = state.lapList.reduce(
    (s, id) => s + (taskMap.get(id)?.duration || 0),
    0
  );
  playlistDOM.lapListDurationEl.textContent = `Total: ${formatTime(lapDuration)}`;
  const sessionInactive = state.runnerState === "STOPPED";
  const draggableAttr = sessionInactive ? 'draggable="true"' : "";

  if (state.lapList.length === 0) {
    playlistDOM.lapListEl.innerHTML =
      '<div class="lap-list-item">Add tasks from the repository to create a playlist.</div>';
    return;
  }

  playlistDOM.lapListEl.innerHTML = state.lapList
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
      let extraClasses = isRunning ? "running" : "";

      if (!sessionInactive) {
        const completedOccurrences =
          state.sessionCache.completedOccurrencesMap.get(task.id) || 0;
        if (
          task.maxOccurrences > 0 &&
          completedOccurrences >= task.maxOccurrences
        ) {
          extraClasses += " maxed-out";
        }
      }

      const actions = sessionInactive
        ? `<div class="lap-item-actions">
            <button class="move-btn" data-action="top" title="Move to Top"><i class="fas fa-angle-double-up"></i></button>
            <button class="move-btn" data-action="bottom" title="Move to Bottom"><i class="fas fa-angle-double-down"></i></button>
            <button class="remove-btn" title="Remove from Lap"><i class="fas fa-trash-alt"></i></button>
          </div>`
        : `<div class="lap-item-actions"><button class="remove-btn" title="Remove from Lap"><i class="fas fa-trash-alt"></i></button></div>`;

      return `<div class="lap-list-item ${extraClasses}" ${draggableAttr} data-id="${
        task.id
      }">
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

export const updateSortHeaders = (sortState) => {
  $$(".sort-header").forEach((h) => {
    h.classList.remove("active");
    h.querySelector("i").className = "fas";
  });
  const active = $(`#sort-by-${sortState.field}-btn`);
  if (active) {
    active.classList.add("active");
    active
      .querySelector("i")
      .classList.add(
        sortState.order === "asc" ? "fa-arrow-up" : "fa-arrow-down"
      );
  }
};

// --- UI STATE MODIFICATION ---

export const resetTaskFormUI = (formDOM) => {
  formDOM.formTitle.textContent = "Create New Task";
  formDOM.taskInput.value = "";
  formDOM.taskDescriptionInput.value = "";
  formDOM.durationMinutesInput.value = 1;
  formDOM.durationSecondsInput.value = 30;
  formDOM.lapIntervalInput.value = 1;
  formDOM.growthFactorInput.value = 0;
  formDOM.maxOccurrencesInput.value = 0;
  formDOM.addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
  formDOM.cancelEditBtn.style.display = "none";
  formDOM.taskInput.focus();
};

export const loadTaskIntoFormUI = (formDOM, task) => {
  formDOM.formTitle.textContent = `Editing Task #${task.id}`;
  formDOM.taskInput.value = task.title;
  formDOM.taskDescriptionInput.value = task.description;
  formDOM.durationMinutesInput.value = Math.floor(task.duration / 60);
  formDOM.durationSecondsInput.value = task.duration % 60;
  formDOM.lapIntervalInput.value = task.lapInterval || 1;
  formDOM.growthFactorInput.value = task.growthFactor || 0;
  formDOM.maxOccurrencesInput.value = task.maxOccurrences || 0;
  formDOM.addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  formDOM.cancelEditBtn.style.display = "inline-block";
};

export const resetRunnerDisplay = (runnerDOM) => {
  runnerDOM.runnerTaskCategory.textContent = "";
  runnerDOM.runnerTaskTitle.textContent = "No task selected";
  runnerDOM.taskProgressBar.style.width = "0%";
  runnerDOM.taskPercentage.textContent = "0%";
  runnerDOM.timeElapsedEl.textContent = "0s";
  runnerDOM.timeRemainingEl.textContent = "0s";
  runnerDOM.lapProgressBar.style.width = "0%";
  runnerDOM.lapPercentage.textContent = "0%";
  runnerDOM.lapTimeElapsedEl.textContent = "0s";
  runnerDOM.lapTimeRemainingEl.textContent = "0s";
  runnerDOM.sessionProgressBar.style.width = "0%";
  runnerDOM.sessionPercentage.textContent = "0%";
  runnerDOM.sessionTimeElapsedEl.textContent = "0s";
  runnerDOM.sessionTimeRemainingEl.textContent = "0s";
  runnerDOM.runnerDetails.baseDuration.textContent = "0s";
  runnerDOM.runnerDetails.currentDuration.textContent = "0s";
  runnerDOM.runnerDetails.occurrenceCount.textContent = "0";
  runnerDOM.runnerDetails.changePercentage.textContent = "0%";
  runnerDOM.runnerDetails.changeDelta.textContent = "0s";
  runnerDOM.runnerDetails.sessionTotal.textContent = "0s";
};

export const scrollToRunningTask = (playlistDOM) => {
  const container = playlistDOM.lapListEl;
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

export const updateTimerDisplay = (runnerDOM, state) => {
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

  runnerDOM.runnerDetails.sessionTotal.textContent = formatTime(sessionTotalTime);
  runnerDOM.timeElapsedEl.textContent = formatTime(elapsed);
  runnerDOM.timeRemainingEl.textContent = `-${formatTime(state.currentTaskTimeLeft)}`;
  runnerDOM.taskProgressBar.style.width = `${taskPercent}%`;
  runnerDOM.taskPercentage.textContent = `${taskPercent}%`;

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

  runnerDOM.lapProgressBar.style.width = `${lapPercent}%`;
  runnerDOM.lapPercentage.textContent = `${lapPercent}%`;
  runnerDOM.lapTimeElapsedEl.textContent = formatTime(lapTimeElapsed);
  runnerDOM.lapTimeRemainingEl.textContent = `-${formatTime(lapTimeRemaining)}`;
  const activeLapNumber = state.sessionCache.activeLapMap.get(lap);
  runnerDOM.lapsProgressLabel.textContent = `Lap ${activeLapNumber} of ${state.sessionCache.totalActiveLaps} - Task ${taskIndexInLap} of ${totalTasksInLap}`;

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

  runnerDOM.sessionProgressBar.style.width = `${sessionPercent}%`;
  runnerDOM.sessionPercentage.textContent = `${sessionPercent}%`;
  runnerDOM.sessionTimeElapsedEl.textContent = formatTime(sessionTimeElapsed);
  runnerDOM.sessionTimeRemainingEl.textContent = `-${formatTime(
    sessionTimeRemaining
  )}`;
};

export const showConfirmationModal = (
  modalDOM,
  state,
  title,
  text,
  onConfirm,
  type = "confirm"
) => {
  modalDOM.modalTitle.textContent = title;
  modalDOM.modalText.textContent = text;
  state.confirmCallback = onConfirm;
  if (type === "alert") {
    modalDOM.modalCancelBtn.style.display = "none";
    modalDOM.modalConfirmBtn.textContent = "OK";
  } else {
    modalDOM.modalCancelBtn.style.display = "inline-block";
    modalDOM.modalConfirmBtn.textContent = "Confirm";
  }
  modalDOM.confirmModal.style.display = "flex";
  modalDOM.confirmModal.classList.add("show");
};

export const hideConfirmationModal = (modalDOM) => {
  modalDOM.confirmModal.classList.remove("show");
  setTimeout(() => {
    modalDOM.confirmModal.style.display = "none";
  }, 300);
};

export const toggleAllPanels = (state, collapse) => {
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

export const toggleRunnerPopout = (runnerDOM, state) => {
  const panel = $("#task-runner-panel");
  const body = document.body;
  const icon = runnerDOM.popoutRunnerBtn.querySelector("i");
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
    runnerDOM.popoutRunnerBtn.title = "Exit Focus Mode";
  } else {
    icon.className = "fas fa-expand-arrows-alt";
    runnerDOM.popoutRunnerBtn.title = "Focus Mode";
  }
};

export const applyTheme = (theme) => {
  document.body.className = `${theme}-theme`;
  localStorage.setItem("theme", theme);
};

export const initializeStepper = (stepperEl) => {
  const input = stepperEl.querySelector("input");
  const stepDownBtn = stepperEl.querySelector('[data-step*="-"]');
  const stepUpBtn = stepperEl.querySelector('[data-step*=":not(-)"]');
  let interval;

  const stopInterval = () => clearInterval(interval);

  const update = (step) => {
    let val = parseInt(input.value, 10) || 0;
    const min = parseInt(input.min, 10) || 0;
    const max = parseInt(input.max, 10) || Infinity;
    val = Math.max(min, Math.min(max, val + step));
    input.value = val;
  };

  stepDownBtn.addEventListener("mousedown", () => {
    update(parseInt(stepDownBtn.dataset.step, 10));
    interval = setInterval(() => update(parseInt(stepDownBtn.dataset.step, 10)), 120);
  });

  stepUpBtn.addEventListener("mousedown", () => {
    update(parseInt(stepUpBtn.dataset.step, 10));
    interval = setInterval(() => update(parseInt(stepUpBtn.dataset.step, 10)), 120);
  });

  stepDownBtn.addEventListener("mouseup", stopInterval);
  stepDownBtn.addEventListener("mouseleave", stopInterval);
  stepUpBtn.addEventListener("mouseup", stopInterval);
  stepUpBtn.addEventListener("mouseleave", stopInterval);
};