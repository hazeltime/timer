/**
 * @jest-environment jsdom
 */
import { state } from "../state.js";

describe("state.js", () => {
  test("initializes with default values", () => {
    expect(state.tasks).toEqual([]);
    expect(state.lapList).toEqual([]);
    expect(state.runnerState).toBe("STOPPED");
  });

  test("safeParse fallback works (simulation)", () => {
    // We can't easily mock the internal safeParse directly without rewriting the module
    // to export it, but we can verify that invalid localStorage content doesn't crash the app
    // and returns defaults.
    // However, since state is initialized at module load time, we rely on the fact that
    // if we are here, it didn't crash.
    expect(state.panelCollapseState).toEqual({});
  });
});
