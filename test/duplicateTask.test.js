/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { duplicateTask } from "../actions.js";
import { state } from "../state.js";
import * as UI from "../ui.js";

// Mock UI
jest.mock("../ui.js", () => ({
  renderAll: jest.fn(),
  resetTaskForm: jest.fn(),
  renderCategoryButtons: jest.fn(),
  resetTaskFormUI: jest.fn(),
}));

describe("duplicateTask", () => {
  beforeEach(() => {
    state.tasks = [
      { id: 1, title: "Original", duration: 60, categoryId: "cat-0" },
    ];
    state.lastId = 1;
  });

  test("creates a copy with new ID", () => {
    const DOM = { repoDOM: {}, playlistDOM: {}, formDOM: {} };
    duplicateTask(1, DOM);
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[1].title).toBe("Original");
    expect(state.tasks[1].id).not.toBe(1);
    expect(state.lastId).toBeGreaterThan(1);
  });
});
