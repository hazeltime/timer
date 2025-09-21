/**
 * @jest-environment jsdom
 */

import { renderLapList } from '../ui.js';

function makeDom() {
  const lapListEl = document.createElement('div');
  const lapListDurationEl = document.createElement('div');
  return { lapListEl, lapListDurationEl };
}

describe('renderLapList', () => {
  test('renders empty message when no tasks', () => {
    const dom = makeDom();
    const state = { lapList: [], runnerState: 'STOPPED' };
    const taskMap = new Map();
    renderLapList(dom, state, taskMap);
    expect(dom.lapListEl.textContent).toContain('Add tasks');
  });

  test('renders tasks and marks maxed-out when reached', () => {
    const dom = makeDom();
    const task = { id: 't1', title: 'T', duration: 30, categoryId: 'cat-0', maxOccurrences: 2 };
    const state = { lapList: ['t1'], runnerState: 'RUNNING', sessionCache: { completedOccurrencesMap: new Map([['t1', 2]]) } };
    const taskMap = new Map([['t1', task]]);
    renderLapList(dom, state, taskMap);
    const item = dom.lapListEl.querySelector('.lap-list-item');
    expect(item).toBeTruthy();
    expect(item.classList.contains('maxed-out')).toBe(true);
  });
});
