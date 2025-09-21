/**
 * @jest-environment jsdom
 */
import { initRunner, restartSession } from '../runner.js';

test('restartSession resets completed maps and restarts', () => {
  const task = { id: 'a', duration: 1, lapInterval:1, growthFactor:0, categoryId: 'cat-0', title: 'A', description: '' };
  const state = {
    tasks: [task],
    lapList: ['a'],
    runnerState: 'STOPPED',
    sessionCache: {
      taskMap: new Map([['a', task]]),
      totalLaps: 1,
      virtualSessionPlaylist: [{ taskId: 'a', calculatedDuration: 1, baseDuration: 1, lap: 0, occurrences: 1, totalOccurrences: 1 }],
      completedTaskDurationsMap: new Map([['a', 10]]),
      completedOccurrencesMap: new Map([['a', 1]]),
    },
    currentVirtualTaskIndex: 0,
  };

  const runnerDOM = { lapsInput: document.createElement('input'), lapsControls: document.createElement('div'), playPauseBtn: document.createElement('button'), lapListEl: document.createElement('div'), lapListDurationEl: document.createElement('div') };
  runnerDOM.lapsInput.value = '1';
  const wrapper = document.createElement('div');
  const stepper = document.createElement('button');
  stepper.className = 'stepper-btn';
  wrapper.appendChild(stepper);
  wrapper.appendChild(runnerDOM.lapsInput);
  // runnerDOM.lapsInput.parentElement now equals wrapper

  initRunner(state, runnerDOM, null);
  restartSession();
  expect(state.sessionCache.completedTaskDurationsMap.get('a')).toBe(0);
  expect(state.runnerState).toBe('RUNNING');
});
