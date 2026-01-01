/**
 * @jest-environment jsdom
 */
import { formatTime } from "../ui.js";

describe("formatTime", () => {
  test("handles 0", () => {
    expect(formatTime(0)).toBe("0s");
  });

  test("handles normal h m s", () => {
    expect(formatTime(3665)).toBe("1h 1m 5s");
  });

  test("handles negative values", () => {
    expect(formatTime(-65)).toBe("-1m 5s");
  });

  test("handles decimals (floors them)", () => {
    expect(formatTime(65.9)).toBe("1m 5s");
  });

  test("handles NaN", () => {
    expect(formatTime(NaN)).toBe("0s");
  });

  test("handles infinity", () => {
    expect(formatTime(Infinity)).toBe("0s");
  });
});
