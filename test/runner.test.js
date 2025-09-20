import { buildVirtualPlaylist } from '../runner.js';

// Create sample tasks
const tasks = [
  { id: 1, duration: 60, lapInterval: 1, growthFactor: 0, maxOccurrences: 0, categoryId: 'cat-0' },
  { id: 2, duration: 30, lapInterval: 2, growthFactor: 0, maxOccurrences: 0, categoryId: 'cat-0' },
];

describe('buildVirtualPlaylist', () => {
  test('generates playlist for 2 laps with intervals', () => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const result = buildVirtualPlaylist(taskMap, 2, [1,2]);
    expect(result.virtualSessionPlaylist.length).toBeGreaterThan(0);
    // lap 0 should include task 1 and 2 (task2 interval 2 so should run only on lap 0)
    const lap0 = result.virtualSessionPlaylist.filter(v => v.lap === 0);
    expect(lap0.some(v => v.taskId === 1)).toBe(true);
    expect(lap0.some(v => v.taskId === 2)).toBe(true);
    // lap 1 should include task 1 only (task2 interval 2)
    const lap1 = result.virtualSessionPlaylist.filter(v => v.lap === 1);
    expect(lap1.some(v => v.taskId === 1)).toBe(true);
    expect(lap1.some(v => v.taskId === 2)).toBe(false);
  });
});
