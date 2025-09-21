/**
 * @jest-environment jsdom
 */
import { updateTimerDisplay } from '../ui.js';

function makeRunnerDOM() {
  return {
    runnerDetails: {
      sessionTotal: document.createElement('div'),
      baseDuration: document.createElement('div'),
      currentDuration: document.createElement('div'),
      occurrenceCount: document.createElement('div'),
      changePercentage: document.createElement('div'),
      changeDelta: document.createElement('div'),
      sessionTotal: document.createElement('div'),
    },
    timeElapsedEl: document.createElement('div'),
    timeRemainingEl: document.createElement('div'),
    taskProgressBar: { style: { width: '' } },
    taskPercentage: document.createElement('div'),
    lapProgressBar: { style: { width: '' } },
    lapPercentage: document.createElement('div'),
    lapTimeElapsedEl: document.createElement('div'),
    lapTimeRemainingEl: document.createElement('div'),
    lapsProgressLabel: document.createElement('div'),
    sessionProgressBar: { style: { width: '' } },
    sessionPercentage: document.createElement('div'),
    sessionTimeElapsedEl: document.createElement('div'),
    sessionTimeRemainingEl: document.createElement('div'),
  };
}

describe('updateTimerDisplay', () => {
  test('handles normal task and updates DOM fields', () => {
    const runnerDOM = makeRunnerDOM();
    const state = {
      currentVirtualTaskIndex: 0,
      currentTaskTimeLeft: 5,
      sessionCache: {
        virtualSessionPlaylist: [ { taskId: 'x', calculatedDuration: 10, lap: 0, taskIndexInLap: 1, totalTasksInLap: 1 } ],
        completedTaskDurationsMap: new Map([['x', 0]]),
        lapDurations: [10],
        lapStartCumulativeDurations: [0],
        cumulativeSessionDurations: [0],
        totalSessionDuration: 10,
        activeLapMap: new Map([[0,1]]),
        totalActiveLaps: 1,
      }
    };
    updateTimerDisplay(runnerDOM, state);
    expect(runnerDOM.timeElapsedEl.textContent).toBeDefined();
    expect(runnerDOM.lapPercentage.textContent).toContain('%');
    expect(runnerDOM.lapsProgressLabel.textContent).toContain('Lap');
  });

  test('no-op when index is -1', () => {
    const runnerDOM = makeRunnerDOM();
    const state = { currentVirtualTaskIndex: -1 };
    updateTimerDisplay(runnerDOM, state);
    // Should not throw and keep elements empty/default
    expect(runnerDOM.timeElapsedEl.textContent).toBe('');
  });
});
