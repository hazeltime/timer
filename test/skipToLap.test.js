/**
 * @jest-environment jsdom
 */
import { initRunner, skipToLap } from '../runner.js';

test('skipToLap moves forward to session end when beyond last lap', () => {
  const task = { id: 't', duration: 1, lapInterval:1, growthFactor:0, categoryId: 'cat-0', title: 'T', description: '' };
  const state = {
    tasks: [task],
    lapList: ['t'],
    runnerState: 'RUNNING',
    currentVirtualTaskIndex: 0,
    sessionCache: {
      virtualSessionPlaylist: [{ taskId: 't', calculatedDuration: 1, lap:0, taskIndexInLap:1, totalTasksInLap:1 }],
      totalLaps: 1,
    }
  };
  const runnerDOM = { lapsInput: document.createElement('input'), lapsControls: document.createElement('div'), playPauseBtn: document.createElement('button'), lapListEl: document.createElement('div'), lapListDurationEl: document.createElement('div') };
  initRunner(state, runnerDOM, null);
  // skip forward beyond last lap
  skipToLap(1);
  // should set index to playlist length (and then stopSession called internally) -> currentVirtualTaskIndex becomes -1
  expect(state.currentVirtualTaskIndex).toBe(-1);
});

test('skipToLap does not move when runner stopped', () => {
  const state = { runnerState: 'STOPPED', sessionCache: { virtualSessionPlaylist: [] } };
  const runnerDOM = { lapsInput: document.createElement('input'), lapsControls: document.createElement('div'), playPauseBtn: document.createElement('button') };
  initRunner(state, runnerDOM, null);
  skipToLap(1);
  // state should remain STOPPED
  expect(state.runnerState).toBe('STOPPED');
});
