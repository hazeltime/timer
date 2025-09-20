// UI helpers and render functions
import { CATEGORIES, categoryMap } from "./constants.js";
import { createIconElement } from "./utils.js";

// Utility helpers
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

// Render functions
export const renderCategoryButtons = (formDOM, selectedCategoryId) => {
  // Clear existing
  formDOM.categoryGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  CATEGORIES.forEach((cat) => {
    const isActive = cat.id === selectedCategoryId;
    const btn = document.createElement('button');
    btn.className = `category-btn ${isActive ? 'active' : ''}`;
    btn.dataset.id = cat.id;
    btn.style.outlineColor = isActive ? cat.color : 'transparent';

  const iconEl = createIconElement(cat.icon);
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = cat.name;
  btn.appendChild(iconEl);
  btn.appendChild(name);
    frag.appendChild(btn);
  });
  formDOM.categoryGrid.appendChild(frag);
};

export const renderTaskSummary = (repoDOM, tasks) => {
  const totalTasks = tasks.length;
  const totalDurationInSeconds = tasks.reduce((s, t) => s + t.duration, 0);
  repoDOM.taskSummaryEl.innerHTML = '';
  const left = document.createElement('span');
  left.innerHTML = `<strong>Total Tasks:</strong> `;
  left.appendChild(document.createTextNode(String(totalTasks)));
  const right = document.createElement('span');
  right.innerHTML = `<strong>Total Duration:</strong> `;
  right.appendChild(document.createTextNode(formatTime(totalDurationInSeconds)));
  repoDOM.taskSummaryEl.appendChild(left);
  repoDOM.taskSummaryEl.appendChild(right);
};

export const renderTasks = (repoDOM, tasks, _sortState) => {
  repoDOM.noTasksMessage.style.display = tasks.length === 0 ? "block" : "none";
  // Build element tree using DocumentFragment to avoid innerHTML and minimize reflows
  const container = document.createDocumentFragment();
  if (tasks.length === 0) {
    repoDOM.taskListEl.innerHTML = "";
  } else {
    tasks.forEach((task) => {
      const category = categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
      const item = document.createElement('div');
      item.className = 'task-item';
      item.dataset.id = task.id;

      const idCol = document.createElement('div');
      idCol.className = 'task-cell task-id-col';
      idCol.textContent = `#${task.id}`;

      const titleCol = document.createElement('div');
      titleCol.className = 'task-cell task-title-col';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'task-title';
      titleSpan.textContent = task.title;
      const descSpan = document.createElement('span');
      descSpan.className = 'task-description';
      descSpan.textContent = task.description || '';
      titleCol.appendChild(titleSpan);
      titleCol.appendChild(descSpan);

      const categoryCol = document.createElement('div');
      categoryCol.className = 'task-cell task-category-col';
  const badge = document.createElement('span');
  badge.className = 'task-category-badge';
  badge.style.backgroundColor = category.color;
  const catIconEl = createIconElement(category.icon);
  badge.appendChild(catIconEl);
  badge.appendChild(document.createTextNode(' ' + category.name));
  categoryCol.appendChild(badge);

      const durationCol = document.createElement('div');
      durationCol.className = 'task-cell task-duration-col';
      durationCol.textContent = formatTime(task.duration);

      const intervalCol = document.createElement('div');
      intervalCol.className = 'task-cell task-interval-col';
      intervalCol.innerHTML = task.lapInterval === 1 ? 'Always' : `<i class="fas fa-redo-alt"></i> ${task.lapInterval}`;

      const limitCol = document.createElement('div');
      limitCol.className = 'task-cell task-limit-col';
      limitCol.textContent = task.maxOccurrences === 0 ? '∞' : String(task.maxOccurrences);

      const growthCol = document.createElement('div');
      growthCol.className = 'task-cell task-growth-col';
      growthCol.textContent = `${task.growthFactor || 0}%`;

      const actionsCol = document.createElement('div');
      actionsCol.className = 'task-cell task-actions-col';
      const addBtn = document.createElement('button');
      addBtn.className = 'add-to-lap-btn';
      addBtn.title = 'Add to Lap';
      addBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.title = 'Edit Task';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.title = 'Duplicate';
      copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.title = 'Delete';
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      actionsCol.appendChild(addBtn);
      actionsCol.appendChild(editBtn);
      actionsCol.appendChild(copyBtn);
      actionsCol.appendChild(deleteBtn);

      item.appendChild(idCol);
      item.appendChild(titleCol);
      item.appendChild(categoryCol);
      item.appendChild(durationCol);
      item.appendChild(intervalCol);
      item.appendChild(limitCol);
      item.appendChild(growthCol);
      item.appendChild(actionsCol);

      container.appendChild(item);
    });
    // Replace content in a single operation
    repoDOM.taskListEl.innerHTML = '';
    repoDOM.taskListEl.appendChild(container);
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

  // Empty case
  if (state.lapList.length === 0) {
    playlistDOM.lapListEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'lap-list-item';
    empty.textContent = 'Add tasks from the repository to create a playlist.';
    playlistDOM.lapListEl.appendChild(empty);
    return;
  }

  // Build nodes with DocumentFragment to minimize reflows and avoid innerHTML parsing
  const frag = document.createDocumentFragment();
  const runningTaskId = state.sessionCache?.virtualSessionPlaylist?.[state.currentVirtualTaskIndex]?.taskId;

  state.lapList.forEach((id) => {
    const task = taskMap.get(id);
    if (!task) return;
    const category = categoryMap.get(task.categoryId) || categoryMap.get('cat-0');
    const isRunning = runningTaskId === task.id;
    const item = document.createElement('div');
    item.className = 'lap-list-item' + (isRunning ? ' running' : '');
    item.dataset.id = task.id;
    if (sessionInactive) item.setAttribute('draggable', 'true');

    // check maxed-out
    if (!sessionInactive) {
      const completedOccurrences = state.sessionCache.completedOccurrencesMap?.get(task.id) || 0;
      if (task.maxOccurrences > 0 && completedOccurrences >= task.maxOccurrences) {
        item.classList.add('maxed-out');
      }
    }

  const icon = createIconElement(category.icon);
  icon.classList.add('lap-category-icon');
  icon.title = category.name;

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = task.title;

    const duration = document.createElement('span');
    duration.className = 'duration';
    duration.textContent = formatTime(task.duration).replace(/(\d+)([a-z]+)/g, '$1 $2');

    const actions = document.createElement('div');
    actions.className = 'lap-item-actions';
    if (sessionInactive) {
      const topBtn = document.createElement('button');
      topBtn.className = 'move-btn';
      topBtn.dataset.action = 'top';
      topBtn.title = 'Move to Top';
      topBtn.innerHTML = '<i class="fas fa-angle-double-up"></i>';
      const bottomBtn = document.createElement('button');
      bottomBtn.className = 'move-btn';
      bottomBtn.dataset.action = 'bottom';
      bottomBtn.title = 'Move to Bottom';
      bottomBtn.innerHTML = '<i class="fas fa-angle-double-down"></i>';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.title = 'Remove from Lap';
      removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      actions.appendChild(topBtn);
      actions.appendChild(bottomBtn);
      actions.appendChild(removeBtn);
    } else {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.title = 'Remove from Lap';
      removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      actions.appendChild(removeBtn);
    }

    item.appendChild(icon);
    item.appendChild(title);
    item.appendChild(duration);
    item.appendChild(actions);
    frag.appendChild(item);
  });

  // Replace content
  playlistDOM.lapListEl.innerHTML = '';
  playlistDOM.lapListEl.appendChild(frag);
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

// Reuse the confirmation modal for simple alert messages (single OK button)
export const showAlert = (modalDOM, title, text) => {
  // Accept either a modal-like object or attempt to find modal elements in DOM
  let m = modalDOM;
  if (!m || !m.confirmModal) {
    m = {
      confirmModal: document.getElementById("confirm-modal"),
      modalTitle: document.getElementById("modal-title"),
      modalText: document.getElementById("modal-text"),
      modalCancelBtn: document.getElementById("modal-cancel-btn"),
      modalConfirmBtn: document.getElementById("modal-confirm-btn"),
    };
  }
  if (!m || !m.confirmModal) {
    // Fallback to native alert if no modal is available
    try { window.alert(text || title || ""); } catch (e) { /* noop */ }
    return;
  }
  // Use the same modal but hide the cancel button and set a one-time callback
  if (m.modalTitle) m.modalTitle.textContent = title || "Alert";
  if (m.modalText) m.modalText.textContent = text || "";
  if (m.modalCancelBtn) m.modalCancelBtn.style.display = "none";
  if (m.modalConfirmBtn) m.modalConfirmBtn.textContent = "OK";
  m.confirmModal.style.display = "flex";
  m.confirmModal.classList.add("show");
  const onOk = () => {
    m.confirmModal.classList.remove("show");
    setTimeout(() => {
      m.confirmModal.style.display = "none";
    }, 300);
  };
  if (m.modalConfirmBtn) m.modalConfirmBtn.addEventListener("click", onOk, { once: true });
};