/**
 * @jest-environment jsdom
 */
import { validateTaskInput } from "../utils.js";

describe("validateTaskInput", () => {
  test("returns error for empty title", () => {
    expect(validateTaskInput("", 10)).toContain("Task title cannot be empty.");
  });

  test("returns error for short duration", () => {
    expect(validateTaskInput("Title", 2)).toContain(
      "Task duration must be at least 5 seconds."
    );
  });

  test("returns empty array for valid input", () => {
    expect(validateTaskInput("Title", 10)).toHaveLength(0);
  });
});
