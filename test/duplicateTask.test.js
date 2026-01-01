/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Must be top-level await or in test setup
jest.unstable_mockModule("../ui.js", () => ({
  __esModule: true,
  renderAll: jest.fn(),
  renderTasks: jest.fn(),
  renderLapList: jest.fn(),
  renderCategoryButtons: jest.fn(),
  resetTaskFormUI: jest.fn(),
  resetTaskForm: jest.fn(),
  updateSortHeaders: jest.fn(),
  showAlert: jest.fn(),
}));

// Dynamic import after mocking
const { duplicateTask } = await import("../actions.js");
const { state } = await import("../state.js");

describe("duplicateTask", () => {
  beforeEach(() => {
    state.tasks = [
      { id: 1, title: "Original", duration: 60, categoryId: "cat-0" },
    ];
    state.lastId = 1;
  });

  test("creates a copy with new ID", () => {
    const DOM = {
      repoDOM: {
        taskListEl: { children: [] },
        noTasksMessage: { style: {} },
        taskSummaryEl: {},
      },
      playlistDOM: { lapListEl: { children: [] }, lapListDurationEl: {} },
      formDOM: { categoryGrid: {} },
    };
    duplicateTask(1, DOM);
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[1].title).toBe("Original");
    expect(state.tasks[1].id).not.toBe(1);
    expect(state.lastId).toBeGreaterThan(1);
  });
});
