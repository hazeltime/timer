// ui.js
import { CATEGORIES, categoryMap } from "./constants.js";

// --- UTILITY FUNCTIONS ---
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => [...document.querySelectorAll(sel)];

export const formatTime = (totalSeconds) => {
  if (totalSeconds === 0) return "0s";
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
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
export const renderCategoryButtons = (DOM, selectedCategoryId) => {
  DOM.categoryGrid.innerHTML = CATEGORIES.map((cat) => {
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

export const renderTaskSummary = (DOM, tasks) => {
  const totalTasks = tasks.length;
  const totalDurationInSeconds = tasks.reduce((s, t) => s + t.duration, 0);
  DOM.taskSummaryEl.innerHTML = `<span><strong>Total Tasks:</strong> ${totalTasks}</span><span><strong>Total Duration:</strong> ${formatTime(
    totalDurationInSeconds
  )}</span>`;
};

export const renderTasks = (DOM, tasks, sortState) => {
  DOM.noTasksMessage.style.display = tasks.length === 0 ? "block" : "none";
  if (tasks.length === 0) {
    DOM.taskListEl.innerHTML = "";
  } else {
    DOM.taskListEl.innerHTML = tasks
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
  renderTaskSummary(DOM, tasks);
};

export const renderLapList = (DOM, state) => {
  const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
  const lapDuration = state.lapList.reduce(
    (s, id) => s + (taskMap.get(id)?.duration || 0),
    0
  );
  DOM.lapListDurationEl.textContent = `Total: ${formatTime(lapDuration)}`;
  const sessionInactive = state.runnerState === "STOPPED";
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
        ? `<div class="lap-item-actions">
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

export const resetTaskFormUI = (DOM) => {
  DOM.formTitle.textContent = "Create New Task";
  DOM.taskInput.value = "";
  DOM.taskDescriptionInput.value = "";
  DOM.durationMinutesInput.value = 1;
  DOM.durationSecondsInput.value = 30;
  DOM.lapIntervalInput.value = 1;
  DOM.growthFactorInput.value = 0;
  DOM.addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
  DOM.cancelEditBtn.style.display = "none";
  DOM.taskInput.focus();
};

export const loadTaskIntoFormUI = (DOM, task) => {
  DOM.formTitle.textContent = `Editing Task #${task.id}`;
  DOM.taskInput.value = task.title;
  DOM.taskDescriptionInput.value = task.description;
  DOM.durationMinutesInput.value = Math.floor(task.duration / 60);
  DOM.durationSecondsInput.value = task.duration % 60;
  DOM.lapIntervalInput.value = task.lapInterval || 1;
  DOM.growthFactorInput.value = task.growthFactor || 0;
  DOM.addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  DOM.cancelEditBtn.style.display = "inline-block";
};

export const resetRunnerDisplay = (DOM) => {
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

export const scrollToRunningTask = (DOM) => {
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

export const updateTimerDisplay = (DOM, state) => {
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
  DOM.timeRemainingEl.textContent = `-${formatTime(state.currentTaskTimeLeft)}`;
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

export const showConfirmationModal = (
  DOM,
  state,
  title,
  text,
  onConfirm,
  type = "confirm"
) => {
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

export const hideConfirmationModal = (DOM) => {
  DOM.confirmModal.classList.remove("show");
  setTimeout(() => {
    DOM.confirmModal.style.display = "none";
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

export const toggleRunnerPopout = (DOM, state) => {
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

export const applyTheme = (theme) => {
  document.body.className = `${theme}-theme`;
  localStorage.setItem("theme", theme);
};
