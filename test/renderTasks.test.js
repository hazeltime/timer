/**
 * @jest-environment jsdom
 */
import { renderTasks } from '../ui.js';

function makeRepoDOM() {
  return {
    taskSummaryEl: document.createElement('div'),
    taskListEl: document.createElement('div'),
    noTasksMessage: document.createElement('div'),
  };
}

describe('renderTasks', () => {
  test('renders new task elements and summary', () => {
    const dom = makeRepoDOM();
    const tasks = [{ id: '1', title: 'One', description: 'Desc', duration: 30, lapInterval:1, growthFactor:0, maxOccurrences:0, categoryId: 'cat-0' }];
    renderTasks(dom, tasks, {});
    expect(dom.taskListEl.children.length).toBe(1);
    expect(dom.taskSummaryEl.textContent).toContain('Total Tasks');
  });

  test('updates existing element rather than creating duplicate', () => {
    const dom = makeRepoDOM();
    const task = { id: '2', title: 'Two', description: '', duration: 10, lapInterval:1, growthFactor:0, maxOccurrences:0, categoryId: 'cat-0' };
    // create existing element
    const existing = document.createElement('div');
    existing.dataset.id = '2';
    existing.innerHTML = '<span class="task-title">Old</span><span class="task-description"></span><span class="task-category-badge"></span><div class="task-duration-col"></div><div class="task-interval-col"></div><div class="task-limit-col"></div><div class="task-growth-col"></div>';
    dom.taskListEl.appendChild(existing);
    renderTasks(dom, [task], {});
    expect(dom.taskListEl.children.length).toBe(1);
    expect(dom.taskListEl.querySelector('.task-title').textContent).toBe('Two');
  });
});
