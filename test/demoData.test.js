/**
 * @jest-environment jsdom
 */
import { DEMO_TASKS } from "../demo-data.js";

describe("DEMO_TASKS", () => {
  test("matches snapshot", () => {
    expect(DEMO_TASKS).toMatchSnapshot();
  });
});
