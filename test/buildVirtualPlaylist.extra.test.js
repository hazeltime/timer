import { buildVirtualPlaylist } from '../runner.js';
import { MAX_DURATION_SECONDS, MIN_DURATION_SECONDS } from '../constants.js';

describe('buildVirtualPlaylist edge cases', () => {
  test('skips unknown task ids in lapList', () => {
    const tasks = [{ id: 'a', duration: 10, lapInterval: 1, growthFactor: 0 }];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const result = buildVirtualPlaylist(taskMap, 2, ['a', 'unknown']);
    expect(result.virtualSessionPlaylist.every(v => v.taskId !== 'unknown')).toBe(true);
  });

  test('clamps growthFactor calculated durations to min/max', () => {
    const tasks = [{ id: 'g', duration: 1, lapInterval:1, growthFactor: -90, maxOccurrences: 10 }];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const result = buildVirtualPlaylist(taskMap, 10, ['g']);
    // All calculated durations should be within MIN..MAX
    for (const v of result.virtualSessionPlaylist) {
      expect(v.calculatedDuration).toBeGreaterThanOrEqual(MIN_DURATION_SECONDS);
      expect(v.calculatedDuration).toBeLessThanOrEqual(MAX_DURATION_SECONDS);
    }
  });

  test('respects lapInterval across many laps', () => {
    const tasks = [
      { id: 't1', duration: 10, lapInterval: 2, growthFactor: 0 },
      { id: 't2', duration: 5, lapInterval: 3, growthFactor: 0 },
    ];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const result = buildVirtualPlaylist(taskMap, 6, ['t1','t2']);
    // Count occurrences
    const counts = {};
    for (const v of result.virtualSessionPlaylist) counts[v.taskId] = (counts[v.taskId] || 0) + 1;
    expect(counts['t1']).toBeGreaterThan(0);
    expect(counts['t2']).toBeGreaterThan(0);
    // t1 should appear approximately half the laps (every 2nd lap)
    expect(counts['t1']).toBeLessThanOrEqual(6);
  });
});
