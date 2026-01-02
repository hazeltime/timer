// UI helpers and render functions
// UI helpers and render functions
import { CATEGORIES, categoryMap, ICONS } from "./constants.js";
import { createIconElement } from "./utils.js";

import { DomBuilder, TimeUtils, DataFormatter } from "./core.js";

// Utility helpers
/**
 * Select single element
 * @param {string} sel
 * @returns {Element}
 */
export const $ = (sel) => document.querySelector(sel);

/**
 * Select all elements as array
 * @param {string} sel
 * @returns {Element[]}
 */
export const $$ = (sel) => [...document.querySelectorAll(sel)];

// Re-export formatTime for convenience, or alias it
export const formatTime = TimeUtils.format;

/**
 * Creates a consistent action button
 * @param {string} iconClass - FontAwesome class
 * @param {string} tooltip - Tooltip text
 * @param {string} cssClass - Additional CSS classes
 */
export const createActionButton = (iconClass, tooltip, cssClass = "") => {
  return DomBuilder.button({
      className: cssClass,
      icon: iconClass,
      tooltip: tooltip
  });
};

export const showToast = (message, type = "info", timeout = 2400) => {
  if (typeof document === "undefined") return;
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  const show = () => toast.classList.add("show");
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(show);
  else setTimeout(show, 0);
  const remove = () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  };
  setTimeout(remove, timeout);
};

/**
 * Creates a consistent Task Row element (for Repo or Playlist) from a template or generator
 * (Currently keeping logic inline but refined, future TODO: fully abstract entire row)
 */
export const renderEmptyState = (message) => {
  const container = document.createElement("div");
  container.className = "empty-state";
  // Fix: Ensure ICONS.ADD is used or valid
  const iconClass = ICONS.ADD || "fas fa-plus-circle";
  container.innerHTML = `
    <i class="${iconClass}" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
    <span>${message}</span>
  `;
  return container;
};

// Render functions
/**
 * Renders category selection buttons
 * @param {Object} formDOM
 * @param {string} selectedCategoryId
 */
export const renderCategoryButtons = (formDOM, selectedCategoryId) => {
  // Clear existing
  formDOM.categoryGrid.innerHTML = "";
  const frag = document.createDocumentFragment();
  CATEGORIES.forEach((cat) => {
    const isActive = cat.id === selectedCategoryId;
    const btn = document.createElement("button");
    btn.className = `category-btn ${isActive ? "active" : ""}`;
    btn.dataset.id = cat.id;
    btn.style.outlineColor = isActive ? cat.color : "transparent";

    const iconEl = createIconElement(cat.icon);
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = cat.name;
    btn.appendChild(iconEl);
    btn.appendChild(name);
    frag.appendChild(btn);
  });
  formDOM.categoryGrid.appendChild(frag);
};

/**
 * Updates summary stats (Total tasks, Total duration) in Repo Panel
 * @param {Object} repoDOM
 * @param {Array} tasks
 */
export const renderTaskSummary = (repoDOM, tasks) => {
  const totalTasks = tasks.length;
  const totalDurationInSeconds = tasks.reduce((s, t) => s + t.duration, 0);
  repoDOM.taskSummaryEl.innerHTML = "";
  const left = document.createElement("span");
  left.innerHTML = `<strong>Total Tasks:</strong> `;
  left.appendChild(document.createTextNode(String(totalTasks)));
  const right = document.createElement("span");
  right.innerHTML = `<strong>Total Duration:</strong> `;
  right.appendChild(
    document.createTextNode(formatTime(totalDurationInSeconds)),
  );
  repoDOM.taskSummaryEl.appendChild(left);
  repoDOM.taskSummaryEl.appendChild(right);
};

/**
 * Creates a DOM element for a Task in the Repository Grid
 */
/**
 * Creates a DOM element for a Task in the Repository Grid
 */
export const createTaskRepoRow = (task, category) => {
  // Fix: Use create() to pass dataset props, as div() shortcut doesn't support 3rd arg
  const item = DomBuilder.create("div", {
      className: "task-item",
      dataset: { id: task.id }
  });

  const categoryBadge = DomBuilder.create("span", {
    className: "task-category-badge",
    style: { backgroundColor: category.color },
  });
  categoryBadge.appendChild(createIconElement(category.icon));
  categoryBadge.appendChild(document.createTextNode(" " + category.name));

  const cells = [
    { cls: "task-id-col", content: `#${task.id}` },
    {
      cls: "task-title-col",
      html: `<span class="task-title">${task.title}</span><span class="task-description">${task.description || ""}</span>`,
    },
    {
      cls: "task-category-col",
      node: categoryBadge,
    },
    { cls: "task-duration-col", content: TimeUtils.format(task.duration) },
    {
      cls: "task-interval-col",
      html: task.lapInterval === 1 ? "Always" : `<i class="${ICONS.REDO}"></i> ${task.lapInterval}`,
    },
    {
      cls: "task-limit-col",
      content: DataFormatter.formatLimit(task.maxOccurrences),
    },
    { cls: "task-growth-col", content: DataFormatter.formatGrowth(task.growthFactor) },
  ];

  cells.forEach((c) => {
    const div = DomBuilder.div(`task-cell ${c.cls}`);
    if (c.node) div.appendChild(c.node);
    else if (c.html) div.innerHTML = c.html;
    else div.textContent = c.content;
    item.appendChild(div);
  });

  // Actions
  const actionsCol = DomBuilder.div("task-cell task-actions-col", [
      createActionButton(ICONS.ADD, "Add to Lap", "add-to-lap-btn btn-icon"),
      createActionButton(ICONS.EDIT, "Edit Task", "edit-btn btn-icon"),
      createActionButton(ICONS.COPY, "Duplicate", "copy-btn btn-icon"),
      createActionButton(ICONS.DELETE, "Delete", "delete-btn btn-icon danger")
  ]);
  
  item.appendChild(actionsCol);
  return item;
};

/**
 * Creates a DOM element for a Task in the Playlist
 */
export const createPlaylistRow = (
  task,
  category,
  state,
  sessionInactive,
  runningTaskId,
) => {
  const isRunning = runningTaskId === task.id;
  const item = document.createElement("div");
  item.className = "lap-list-item" + (isRunning ? " running" : "");
  item.dataset.id = task.id;

  const completedOccurrences =
    state.sessionCache?.completedOccurrencesMap?.get(task.id) || 0;
  if (task.maxOccurrences > 0 && completedOccurrences >= task.maxOccurrences) {
    item.classList.add("maxed-out");
  }

  if (sessionInactive) item.setAttribute("draggable", "true");

  // Icon
  const icon = createIconElement(category.icon);
  icon.classList.add("lap-category-icon");
  icon.title = category.name;
  item.appendChild(icon);

  // Title
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = task.title;
  item.appendChild(title);

  // Duration
  const duration = document.createElement("span");
  duration.className = "duration";
  duration.textContent = formatTime(task.duration).replace(
    /(\d+)([a-z]+)/g,
    "$1 $2",
  );
  item.appendChild(duration);

  // Actions
  const actions = document.createElement("div");
  actions.className = "lap-item-actions";
  if (sessionInactive) {
    const upBtn = createActionButton(
      ICONS.CHEVRON_UP,
      "Move Up",
      "move-btn btn-icon top-btn",
    );
    upBtn.dataset.action = "up";
    actions.appendChild(upBtn);

    const downBtn = createActionButton(
      ICONS.CHEVRON_DOWN,
      "Move Down",
      "move-btn btn-icon bottom-btn",
    );
    downBtn.dataset.action = "down";
    actions.appendChild(downBtn);
  }
  actions.appendChild(
    createActionButton(
      ICONS.DELETE,
      "Remove from Lap",
      "remove-btn btn-icon danger",
    ),
  );
  item.appendChild(actions);

  return item;
};

/**
 * Renders the main task repository list
 * @param {Object} repoDOM
 * @param {Array} tasks
 * @param {Object} _sortState
 */
export const renderTasks = (repoDOM, tasks, _sortState) => {
  repoDOM.noTasksMessage.style.display = "none"; // Handled by empty state injection if needed, or keeping it as fallback

  const taskListEl = repoDOM.taskListEl;
  if (tasks.length === 0) {
    taskListEl.innerHTML = "";
    // repoDOM.noTasksMessage.style.display = "block"; // Revert to using the element if helper fails? No, helper works.
    repoDOM.taskListEl.appendChild(
      renderEmptyState("No tasks found. Create a new task to get started!"),
    );
    renderTaskSummary(repoDOM, tasks);
    return;
  }
  const existingTaskElements = new Map();
  for (const child of taskListEl.children) {
    existingTaskElements.set(child.dataset.id, child);
  }

  const newFragment = document.createDocumentFragment();

  for (const task of tasks) {
    const category =
      categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
    let item = existingTaskElements.get(String(task.id));

    if (item) {
      // Update existing element
      item.querySelector(".task-title").textContent = task.title;
      item.querySelector(".task-description").textContent =
        task.description || "";
      const badge = item.querySelector(".task-category-badge");
      badge.style.backgroundColor = category.color;
      badge.innerHTML = "";
      const catIconEl = createIconElement(category.icon);
      badge.appendChild(catIconEl);
      badge.appendChild(document.createTextNode(" " + category.name));
      item.querySelector(".task-duration-col").textContent = formatTime(
        task.duration,
      );
      item.querySelector(".task-interval-col").innerHTML =
        task.lapInterval === 1
          ? "Always"
          : `<i class="${ICONS.REDO}"></i> ${task.lapInterval}`;
      item.querySelector(".task-limit-col").textContent =
        task.maxOccurrences === 0 ? "∞" : String(task.maxOccurrences);
      item.querySelector(".task-growth-col").textContent = `${
        task.growthFactor || 0
      }%`;
      existingTaskElements.delete(String(task.id));
    } else {
      // Create new element
      item = createTaskRepoRow(task, category);
    }
    newFragment.appendChild(item);
  }

  for (const child of existingTaskElements.values()) {
    child.remove();
  }

  taskListEl.appendChild(newFragment);

  renderTaskSummary(repoDOM, tasks);
};

/**
 * Renders the playlist (lap list)
 * @param {Object} playlistDOM
 * @param {Object} state
 * @param {Map} taskMap
 */
export const renderLapList = (playlistDOM, state, taskMap) => {
  const lapDuration = state.lapList.reduce(
    (s, id) => s + (taskMap.get(id)?.duration || 0),
    0,
  );
  playlistDOM.lapListDurationEl.textContent = `Total: ${formatTime(
    lapDuration,
  )}`;
  const sessionInactive = state.runnerState === "STOPPED";

  const lapListEl = playlistDOM.lapListEl;
  const existingLapElements = new Map();
  for (const child of lapListEl.children) {
    existingLapElements.set(child.dataset.id, child);
  }

  const newFragment = document.createDocumentFragment();

  /* Simplified Rebuild Strategy for consistency */
  lapListEl.innerHTML = ""; // Clear

  if (state.lapList.length === 0) {
    lapListEl.appendChild(
      renderEmptyState("Add tasks from the repository to create a playlist."),
    );
  } else {
    const runningTaskId =
      state.sessionCache?.virtualSessionPlaylist?.[
        state.currentVirtualTaskIndex
      ]?.taskId;

    for (const id of state.lapList) {
      const task = taskMap.get(id);
      if (!task) continue;
      const category =
        categoryMap.get(task.categoryId) || categoryMap.get("cat-0");

      const item = createPlaylistRow(
        task,
        category,
        state,
        sessionInactive,
        runningTaskId,
      );
      newFragment.appendChild(item);
    }
    lapListEl.appendChild(newFragment);
  }
};

export const updateSortHeaders = (sortState) => {
  $$(".sort-header").forEach((h) => {
    h.classList.remove("active");
    h.setAttribute("aria-sort", "none");
    const icon = h.querySelector("i");
    if (icon) icon.className = "fas";
  });
  const active = $("#sort-by-" + sortState.field + "-btn");
  if (active) {
    active.classList.add("active");
    active.setAttribute(
      "aria-sort",
      sortState.order === "asc" ? "ascending" : "descending",
    );
    const icon = active.querySelector("i");
    if (icon)
      icon.classList.add(
        sortState.order === "asc" ? "fa-arrow-up" : "fa-arrow-down",
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
  formDOM.addTaskBtn.innerHTML = `<i class="${ICONS.PLUS}"></i> Add Task`;
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
  formDOM.addTaskBtn.innerHTML = `<i class="${ICONS.SAVE}"></i> Save Changes`;
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

/**
 * Updates the Runner Timer display with current task and lap progress
 * @param {Object} runnerDOM
 * @param {Object} state
 */
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

  runnerDOM.runnerDetails.sessionTotal.textContent =
    formatTime(sessionTotalTime);
  runnerDOM.timeElapsedEl.textContent = formatTime(elapsed);
  runnerDOM.timeRemainingEl.textContent = formatTime(state.currentTaskTimeLeft);
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
    sessionTimeRemaining,
  )}`;
};

/**
 * Shows a customizable confirmation modal
 * @param {Object} modalDOM
 * @param {Object} state
 * @param {string} title
 * @param {string} text
 * @param {Function} onConfirm
 * @param {string} type - 'confirm' or 'alert'
 */
export const showConfirmationModal = (
  modalDOM,
  state,
  title,
  text,
  onConfirm,
  type = "confirm",
) => {
  // Accept both the `modalDOM` object constructed in `script.js` or the
  // raw DOM node if that's passed; normalize to an object with expected fields.
  let m = modalDOM;
  if (!m || !m.modalTitle) {
    const node = document.getElementById("confirm-modal");
    if (!node) return;
    m = {
      confirmModal: node,
      modalTitle: node.querySelector("#modal-title"),
      modalText: node.querySelector("#modal-text"),
      modalCancelBtn: node.querySelector("#modal-cancel-btn"),
      modalConfirmBtn: node.querySelector("#modal-confirm-btn"),
    };
  }
  m.modalTitle.textContent = title;
  m.modalText.textContent = text;
  state.confirmCallback = onConfirm;
  if (type === "alert") {
    modalDOM.modalCancelBtn.style.display = "none";
    modalDOM.modalConfirmBtn.textContent = "OK";
  } else {
    modalDOM.modalCancelBtn.style.display = "inline-block";
    modalDOM.modalConfirmBtn.textContent = "Confirm";
  }
  m.confirmModal.style.display = "flex";
  // give it a small delay then focus the confirm button for accessibility
  m.confirmModal.classList.add("show");
  setTimeout(() => {
    if (m.modalConfirmBtn) m.modalConfirmBtn.focus();
  }, 200);
};

export const hideConfirmationModal = (modalDOM) => {
  modalDOM.confirmModal.classList.remove("show");
  setTimeout(() => {
    modalDOM.confirmModal.style.display = "none";
  }, 300);
};

/**
 * Collapses or expands all collapsible panels
 * @param {Object} state
 * @param {boolean} collapse - true to collapse, false to expand
 */
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

      // Auto-Focus Logic: Focus first input if expanding a form panel
      if (panel.id === "create-task-panel") {
        setTimeout(() => {
          const firstInput = panel.querySelector("input, button");
          if (firstInput) firstInput.focus();
        }, 300); // Wait for transition
      }
    }
  });
  localStorage.setItem(
    "panelCollapseState",
    JSON.stringify(state.panelCollapseState),
  );
};

/**
 * Toggles the runner popout (focus mode)
 * @param {Object} runnerDOM
 * @param {Object} state
 */
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
        JSON.stringify(state.panelCollapseState),
      );
    }
    icon.className = "fas fa-compress-arrows-alt";
    runnerDOM.popoutRunnerBtn.title = "Exit Focus Mode";
  } else {
    icon.className = "fas fa-expand-arrows-alt";
    runnerDOM.popoutRunnerBtn.title = "Focus Mode";
  }
};

/**
 * Applies color theme to body
 * @param {string} theme - 'dark' or 'light'
 */
export const applyTheme = (theme) => {
  document.body.className = `${theme}-theme`;
  localStorage.setItem("theme", theme);
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
    // Avoid calling `window.alert` in test environments (jsdom's alert throws).
    try {
      if (
        typeof console !== "undefined" &&
        typeof console.warn === "function"
      ) {
        console.warn(text || title || "");
      }
    } catch (e) {
      /* noop */
    }
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
  if (m.modalConfirmBtn)
    m.modalConfirmBtn.addEventListener("click", onOk, { once: true });
};
