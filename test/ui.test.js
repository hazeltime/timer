let formatTime;

beforeAll(async () => {
  const mod = await import('../ui.js');
  formatTime = mod.formatTime;
});

describe('formatTime', () => {
  test('formats zero as 0s', () => {
    expect(formatTime(0)).toBe('0s');
  });

  test('formats seconds correctly', () => {
    expect(formatTime(5)).toBe('5s');
    expect(formatTime(65)).toBe('1m 5s');
  });

  test('formats hours correctly', () => {
    expect(formatTime(3600)).toBe('1h');
    expect(formatTime(3661)).toBe('1h 1m 1s');
  });

  test('handles negative values', () => {
    expect(formatTime(-5)).toBe('-5s');
    expect(formatTime(-3661)).toBe('-1h 1m 1s');
  });

  test('handles non-numeric input gracefully', () => {
    expect(formatTime(undefined)).toBe('0s');
    expect(formatTime(null)).toBe('0s');
    expect(formatTime('abc')).toBe('0s');
  });
});
