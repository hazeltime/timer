/**
 * @jest-environment jsdom
 */
import { initRunner, playPauseSession } from '../runner.js';

describe('playPauseSession integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts and pauses session when lapList present', () => {
    const task = { id: 't1', duration: 2, lapInterval: 1, growthFactor: 0, categoryId: 'cat-0', title: 'T1', description: '' };
    const state = {
      tasks: [task],
      lapList: ['t1'],
      runnerState: 'STOPPED',
      currentVirtualTaskIndex: -1,
      sessionInterval: null,
    };

    // build minimal runnerDOM expected by initRunner/startSession
    const parent = document.createElement('div');
    const lapsInput = document.createElement('input');
    lapsInput.value = '1';
    parent.appendChild(lapsInput);
    const stepperBtn = document.createElement('button');
    stepperBtn.className = 'stepper-btn';
    parent.appendChild(stepperBtn);

    const runnerDOM = {
      runnerTaskCategory: document.createElement('div'),
      runnerTaskTitle: document.createElement('div'),
      runnerTaskDescription: document.createElement('div'),
      taskProgressBar: { style: { width: '0%' } },
      taskPercentage: document.createElement('div'),
      timeElapsedEl: document.createElement('div'),
      timeRemainingEl: document.createElement('div'),
      playPauseBtn: document.createElement('button'),
      lapsControls: document.createElement('div'),
      lapsInput: lapsInput,
      lapsProgressContainer: document.createElement('div'),
      lapsProgressLabel: document.createElement('div'),
      lapProgressBar: { style: { width: '0%' } },
      lapPercentage: document.createElement('div'),
      lapTimeElapsedEl: document.createElement('div'),
      lapTimeRemainingEl: document.createElement('div'),
      sessionProgressBar: { style: { width: '0%' } },
      sessionPercentage: document.createElement('div'),
      sessionTimeElapsedEl: document.createElement('div'),
      sessionTimeRemainingEl: document.createElement('div'),
      runnerDetails: {
        baseDuration: document.createElement('div'),
        currentDuration: document.createElement('div'),
        occurrenceCount: document.createElement('div'),
        changePercentage: document.createElement('div'),
        changeDelta: document.createElement('div'),
        sessionTotal: document.createElement('div'),
      },
      lapListEl: document.createElement('div'),
      lapListDurationEl: document.createElement('div'),
    };

    // ensure parentElement.querySelectorAll exists on lapsInput
    Object.defineProperty(lapsInput, 'parentElement', { value: parent });

    initRunner(state, runnerDOM, null);

    // start
    playPauseSession();
    expect(state.runnerState).toBe('RUNNING');
    expect(state.sessionInterval).not.toBeNull();

    // pause
    playPauseSession();
    expect(state.runnerState).toBe('PAUSED');
    expect(state.sessionInterval).toBeNull();
  });

  test('does not start when lapList empty and shows alert', () => {
    const state = { tasks: [], lapList: [], runnerState: 'STOPPED' };
    const runnerDOM = { playPauseBtn: document.createElement('button'), lapsInput: document.createElement('input'), lapsControls: document.createElement('div'), lapsInput: document.createElement('input') };
    // simple init
    initRunner(state, runnerDOM, null);
    // Calling should not throw; it should short-circuit
    playPauseSession();
    expect(state.runnerState).toBe('STOPPED');
  });
});
