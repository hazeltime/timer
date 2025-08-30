// runner.js
import * as UI from "./ui.js";
import {
    categoryMap,
    MAX_DURATION_SECONDS,
    MIN_DURATION_SECONDS,
} from "./constants.js";

let state = null;
let dom = null;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const stopTimerInterval = () => {
    clearInterval(state.sessionInterval);
    state.sessionInterval = null;
};

const handleTaskCompletion = () => {
    if (state.currentVirtualTaskIndex > -1) {
        const lastTask =
            state.sessionCache.virtualSessionPlaylist[
            state.currentVirtualTaskIndex
            ];
        const { taskId, calculatedDuration } = lastTask;
        const currentTotal =
            state.sessionCache.completedTaskDurationsMap.get(taskId) || 0;
        state.sessionCache.completedTaskDurationsMap.set(
            taskId,
            currentTotal + calculatedDuration
        );
    }
    loadTaskToRunner(state.currentVirtualTaskIndex + 1);
};

const startTimerInterval = () => {
    if (state.sessionInterval) stopTimerInterval();
    state.sessionInterval = setInterval(() => {
        state.currentTaskTimeLeft--;
        UI.updateTimerDisplay(dom, state);
        if (state.currentTaskTimeLeft < 0) handleTaskCompletion();
    }, 1000);
};

const loadTaskToRunner = (virtualIndex) => {
    // Recalculate completed occurrences based on the new index.
    // This is the single source of truth for strikethrough logic.
    const newCompletedOccurrencesMap = new Map();
    for (let i = 0; i < virtualIndex; i++) {
        const task = state.sessionCache.virtualSessionPlaylist[i];
        const count = newCompletedOccurrencesMap.get(task.taskId) || 0;
        newCompletedOccurrencesMap.set(task.taskId, count + 1);
    }
    state.sessionCache.completedOccurrencesMap = newCompletedOccurrencesMap;

    state.currentVirtualTaskIndex = virtualIndex;
    if (
        virtualIndex < 0 ||
        virtualIndex >= state.sessionCache.virtualSessionPlaylist.length
    ) {
        // Recalculate one last time to ensure all tasks are struck through if session ends
        if (virtualIndex >= state.sessionCache.virtualSessionPlaylist.length) {
            const finalCompletedMap = new Map();
            state.sessionCache.virtualSessionPlaylist.forEach((task) => {
                const count = finalCompletedMap.get(task.taskId) || 0;
                finalCompletedMap.set(task.taskId, count + 1);
            });
            state.sessionCache.completedOccurrencesMap = finalCompletedMap;
        }
        return stopSession(true);
    }

    const {
        taskId,
        calculatedDuration,
        baseDuration,
        occurrences,
        totalOccurrences,
    } = state.sessionCache.virtualSessionPlaylist[virtualIndex];
    const task = state.sessionCache.taskMap.get(taskId);
    if (!task) return stopSession(true);

    const category =
        categoryMap.get(task.categoryId) || categoryMap.get("cat-0");
    dom.runnerTaskCategory.innerHTML = `<span class="icon">${category.icon}</span> ${category.name}`;
    dom.runnerTaskTitle.textContent = task.title;
    state.currentTaskTimeLeft = calculatedDuration;

    const changeDelta = calculatedDuration - baseDuration;
    const changePercentage =
        baseDuration > 0 ? Math.round((changeDelta / baseDuration) * 100) : 0;
    const sessionTotalTime =
        state.sessionCache.completedTaskDurationsMap.get(taskId) || 0;

    dom.runnerDetails.baseDuration.textContent = UI.formatTime(baseDuration);
    dom.runnerDetails.currentDuration.textContent =
        UI.formatTime(calculatedDuration);
    dom.runnerDetails.occurrenceCount.textContent = `${occurrences} of ${totalOccurrences}`;
    dom.runnerDetails.changePercentage.textContent = `${changePercentage}%`;
    dom.runnerDetails.changeDelta.textContent = UI.formatTime(changeDelta);
    dom.runnerDetails.sessionTotal.textContent =
        UI.formatTime(sessionTotalTime);

    dom.runnerDetails.changePercentage.style.color =
        changePercentage > 0
            ? "var(--accent-green)"
            : changePercentage < 0
                ? "var(--accent-red)"
                : "var(--text-secondary)";
    dom.runnerDetails.changeDelta.style.color =
        changeDelta > 0
            ? "var(--accent-green)"
            : changeDelta < 0
                ? "var(--accent-red)"
                : "var(--text-secondary)";

    UI.updateTimerDisplay(dom, state);
    UI.renderLapList(dom, state);
    UI.scrollToRunningTask(dom);
};

const buildVirtualPlaylist = (taskMap, totalLaps) => {
    const virtualSessionPlaylist = [];
    const lapDurations = Array(totalLaps).fill(0);
    const lapStartCumulativeDurations = Array(totalLaps).fill(0);
    const tasksByLap = Array.from({ length: totalLaps }, () => []);
    let currentCumulativeDuration = 0;
    const activeLapMap = new Map();
    let activeLapCounter = 0;
    const lastRunLap = new Map();
    const totalTaskOccurrencesMap = new Map();

    for (let lap = 0; lap < totalLaps; lap++) {
        lapStartCumulativeDurations[lap] = currentCumulativeDuration;
        state.lapList.forEach((taskId) => {
            const task = taskMap.get(taskId);
            if (!task) return;
            const interval = task.lapInterval || 1;
            const maxOccurrences = task.maxOccurrences || 0;
            const occurrencesSoFar = totalTaskOccurrencesMap.get(taskId) || 0;

            if (maxOccurrences > 0 && occurrencesSoFar >= maxOccurrences) {
                return; // Skip if max occurrences reached
            }

            const lastRun = lastRunLap.has(taskId) ? lastRunLap.get(taskId) : -1;
            if (lap === 0 || (lap > lastRun && (lap - lastRun) % interval === 0)) {
                const occurrences = occurrencesSoFar + 1;
                totalTaskOccurrencesMap.set(taskId, occurrences);
                const baseDuration = task.duration;
                let calculatedDuration = baseDuration;
                if (task.growthFactor !== 0) {
                    calculatedDuration = Math.round(
                        baseDuration *
                        Math.pow(1 + task.growthFactor / 100, occurrences - 1)
                    );
                    calculatedDuration = clamp(
                        calculatedDuration,
                        MIN_DURATION_SECONDS,
                        MAX_DURATION_SECONDS
                    );
                }
                tasksByLap[lap].push({
                    taskId,
                    calculatedDuration,
                    baseDuration,
                    occurrences,
                });
                lastRunLap.set(taskId, lap);
            }
        });
        if (tasksByLap[lap].length > 0) {
            activeLapCounter++;
            activeLapMap.set(lap, activeLapCounter);
            tasksByLap[lap].forEach((taskInfo) => {
                lapDurations[lap] += taskInfo.calculatedDuration;
                currentCumulativeDuration += taskInfo.calculatedDuration;
            });
        }
    }
    const cumulativeSessionDurations = [];
    currentCumulativeDuration = 0;
    tasksByLap.forEach((tasksInThisLap, lap) => {
        const totalTasksInLap = tasksInThisLap.length;
        if (totalTasksInLap === 0) return;
        tasksInThisLap.forEach((taskInfo, indexInLap) => {
            const task = taskMap.get(taskInfo.taskId);
            const maxOccurrences = task.maxOccurrences || 0;
            const totalOccurrences =
                maxOccurrences > 0
                    ? maxOccurrences
                    : totalTaskOccurrencesMap.get(taskInfo.taskId) || 0;

            virtualSessionPlaylist.push({
                ...taskInfo,
                lap,
                totalTasksInLap,
                taskIndexInLap: indexInLap + 1,
                totalOccurrences,
            });
            cumulativeSessionDurations.push(currentCumulativeDuration);
            currentCumulativeDuration += taskInfo.calculatedDuration;
        });
    });

    return {
        virtualSessionPlaylist,
        lapDurations,
        lapStartCumulativeDurations,
        cumulativeSessionDurations,
        totalSessionDuration: currentCumulativeDuration,
        activeLapMap,
        totalActiveLaps: activeLapCounter,
        totalTaskOccurrencesMap,
    };
};

const startSession = () => {
    const totalLaps = parseInt(dom.lapsInput.value, 10) || 1;
    const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
    const playlistData = buildVirtualPlaylist(taskMap, totalLaps);
    if (playlistData.virtualSessionPlaylist.length === 0) {
        alert(
            "No tasks are scheduled to run in this session with the current intervals and limits."
        );
        return false;
    }
    state.sessionCache = {
        ...playlistData,
        taskMap,
        totalLaps,
        completedTaskDurationsMap: new Map(),
        completedOccurrencesMap: new Map(), // Reset for new session
    };
    dom.lapsProgressContainer.style.display = "block";
    loadTaskToRunner(0);
    dom.lapsControls.style.display = "none";
    dom.lapsInput.disabled = true;
    dom.lapsInput.parentElement.querySelectorAll('.stepper-btn').forEach((b) => (b.disabled = true));
    return true;
};

export const playPauseSession = () => {
    if (state.runnerState === "RUNNING") {
        stopTimerInterval();
        state.runnerState = "PAUSED";
        dom.playPauseBtn.innerHTML =
            '<i class="fas fa-play"></i><span>Play</span>';
        return;
    }
    if (state.lapList.length === 0) {
        alert("Add tasks to the Lap Playlist before starting.");
        return;
    }
    if (state.runnerState === "STOPPED") {
        if (!startSession()) return;
    }
    if (
        state.currentVirtualTaskIndex >=
        state.sessionCache.virtualSessionPlaylist.length
    )
        return;
    state.runnerState = "RUNNING";
    dom.playPauseBtn.innerHTML =
        '<i class="fas fa-pause"></i><span>Pause</span>';
    startTimerInterval();
};

export const stopSession = (finished = false) => {
    stopTimerInterval();
    state.runnerState = "STOPPED";
    dom.playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
    dom.lapsControls.style.display = "flex";
    dom.lapsInput.disabled = false;
    dom.lapsInput.parentElement.querySelectorAll('.stepper-btn').forEach((b) => (b.disabled = false));

    if (finished) {
        dom.lapsProgressLabel.textContent = `Session Complete! (${state.sessionCache.totalLaps || 0
            } laps)`;
        UI.showConfirmationModal(
            dom,
            state,
            "🎉 Congratulations! 🎉",
            `Session Complete! You finished ${state.sessionCache.totalLaps || 0
            } lap(s).`,
            () => {
                dom.lapsProgressContainer.style.display = "none";
                UI.resetRunnerDisplay(dom);
            },
            "alert"
        );
    } else {
        dom.lapsProgressContainer.style.display = "none";
        UI.resetRunnerDisplay(dom);
    }
    state.currentVirtualTaskIndex = -1;
    UI.renderLapList(dom, state);
};

export const restartSession = () => {
    stopTimerInterval();
    state.runnerState = "PAUSED";
    dom.playPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
    state.sessionCache.completedTaskDurationsMap = new Map();
    state.sessionCache.completedOccurrencesMap = new Map(); // Reset on restart
    const playlistData = buildVirtualPlaylist(
        state.sessionCache.taskMap,
        state.sessionCache.totalLaps
    );
    state.sessionCache = { ...state.sessionCache, ...playlistData };
    loadTaskToRunner(0);
    state.runnerState = "RUNNING";
    playPauseSession();
};

export const skipToLap = (direction) => {
    if (
        state.runnerState === "STOPPED" ||
        state.sessionCache.virtualSessionPlaylist.length === 0
    )
        return;

    const currentLap =
        state.sessionCache.virtualSessionPlaylist[state.currentVirtualTaskIndex]
            .lap;
    let targetLap = currentLap + direction;

    if (targetLap >= state.sessionCache.totalLaps) {
        loadTaskToRunner(state.sessionCache.virtualSessionPlaylist.length);
        return;
    }
    if (targetLap < 0) return;

    let next = state.sessionCache.virtualSessionPlaylist.findIndex(
        (t) => t.lap === targetLap
    );

    while (
        next === -1 &&
        targetLap < state.sessionCache.totalLaps &&
        targetLap >= 0
    ) {
        targetLap += direction;
        next = state.sessionCache.virtualSessionPlaylist.findIndex(
            (t) => t.lap === targetLap
        );
    }

    if (next !== -1) {
        const wasRunning = state.runnerState === "RUNNING";
        if (wasRunning) stopTimerInterval();
        loadTaskToRunner(next);
        if (wasRunning) startTimerInterval();
    } else if (direction > 0) {
        loadTaskToRunner(state.sessionCache.virtualSessionPlaylist.length);
    }
};

export const nextTask = () => {
    if (state.runnerState !== "STOPPED") handleTaskCompletion();
}

export const prevTask = () => {
    if (state.runnerState !== "STOPPED" && state.currentVirtualTaskIndex > 0)
        loadTaskToRunner(state.currentVirtualTaskIndex - 1);
}

export const initRunner = (mainState, mainDom) => {
    state = mainState;
    dom = mainDom;
};