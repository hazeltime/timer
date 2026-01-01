/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { duplicateTask } from "../actions.js";
import { state } from "../state.js";
import * as UI from "../ui.js";

// Partial mock or spy
// We will spy on specific UI methods instead of full module mock if possible,
// or let the real UI run but with detached DOM (which is fine in JSDOM).
// But renderTasks touches DOM heavily.
// Let's try to just spy on the methods being called.

describe("duplicateTask", () => {
  beforeEach(() => {
    state.tasks = [
      { id: 1, title: "Original", duration: 60, categoryId: "cat-0" },
    ];
    state.lastId = 1;
    // Spy on UI methods called by action
    jest.spyOn(UI, "renderTasks").mockImplementation(() => {});
    jest.spyOn(UI, "renderLapList").mockImplementation(() => {});
    jest.spyOn(UI, "renderCategoryButtons").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
