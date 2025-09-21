// actions.js

import * as UI from "./ui.js";
import { state, saveState } from "./state.js";
import { clamp } from "./utils.js";
import * as Runner from "./runner.js";
import { categoryMap } from "./constants.js";

export const getTaskMap = () => new Map(state.tasks.map((t) => [t.id, t]));

export const sortTasks = (list) => {
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

export const renderAll = (DOM) => {
  const sortedTasks = sortTasks(state.tasks);
  UI.renderTasks(DOM.repoDOM, sortedTasks, state.sortState);
  UI.renderLapList(DOM.playlistDOM, state, getTaskMap());
  UI.renderCategoryButtons(DOM.formDOM, state.selectedCategoryId);
};

export const updateSort = (field, DOM) => {
  state.sortState.order =
    state.sortState.field === field && state.sortState.order === "asc"
      ? "desc"
      : "asc";
  state.sortState.field = field;
  UI.updateSortHeaders(state.sortState);
  const sortedTasks = sortTasks(state.tasks);
  UI.renderTasks(DOM.repoDOM, sortedTasks, state.sortState);
};

export const resetTaskForm = (formDOM) => {
  state.editingTaskId = null;
  state.selectedCategoryId = "cat-0";
  UI.resetTaskFormUI(formDOM);
  UI.renderCategoryButtons(formDOM, state.selectedCategoryId);
};

export const handleTaskFormSubmit = (formDOM, DOM) => {
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
  renderAll(DOM);
  resetTaskForm(formDOM);
};

export const loadTaskIntoForm = (id, formDOM, DOM) => {
  if (Runner.isSessionActive()) {
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

export const deleteTask = (id, DOM) => {
  if (Runner.isSessionActive()) {
    UI.showAlert(DOM, "Action blocked", "Cannot delete a task that is part of an active lap session.");
    return;
  }
  state.tasks = state.tasks.filter((t) => t.id !== id);
  state.lapList = state.lapList.filter((l) => l !== id);
  saveState();
  renderAll(DOM);
};

export const duplicateTask = (id, DOM) => {
  const original = state.tasks.find((t) => t.id === id);
  if (!original) return;
  state.lastId++;
  const copy = { ...original, id: state.lastId };
  if (!copy.lapInterval) copy.lapInterval = 1;
  if (copy.growthFactor === undefined) copy.growthFactor = 0;
  if (copy.maxOccurrences === undefined) copy.maxOccurrences = 0;
  state.tasks.push(copy);
  saveState();
  renderAll(DOM);
};

export const addTaskToLap = (id, playlistDOM, DOM) => {
  if (Runner.isSessionActive()) {
    UI.showAlert(DOM, "Action blocked", "Please stop the lap session to modify the playlist.");
    return;
  }
  if (!state.lapList.includes(id)) {
    state.lapList.push(id);
    saveState();
    UI.renderLapList(playlistDOM, state, getTaskMap());
  }
};

export const removeTaskFromLap = (id, playlistDOM) => {
  if (Runner.isSessionActive()) {
    UI.showAlert(DOM, "Action blocked", "Please stop the lap session to modify the playlist.");
    return;
  }
  state.lapList = state.lapList.filter((l) => l !== id);
  saveState();
  UI.renderLapList(playlistDOM, state, getTaskMap());
};

export const isModificationAllowed = (msg, DOM) => {
  if (Runner.isSessionActive()) {
    UI.showAlert(DOM, "Info", msg);
    return false;
  }
  return true;
};

export const getDragAfterElement = (container, y) => {
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
