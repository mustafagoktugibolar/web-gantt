import { computed, markRaw, reactive, shallowRef } from 'vue';
import { fetchTasks, subscribeUpdates, type Task } from '../services/mockApi';
import { getVirtualRange } from '../utils/virtualization';
import { clampRange } from '../utils/timeline';
import { mergeTaskUpdate } from '../utils/updateMerge';
import { useGanttEngine } from '../services/ganttEngine';

const MS_PER_HOUR = 60 * 60 * 1000;
const MIN_RANGE_MS = 6 * MS_PER_HOUR;

interface TaskStoreOptions {
  rowHeight: number;
}

export const useTaskStore = ({ rowHeight }: TaskStoreOptions) => {
  const cache = markRaw(new Map<string, Task>());
  const pendingUpdates = markRaw(new Map<string, Task>());
  const loadedTaskIds = shallowRef<string[]>([]);
  const anchorId = shallowRef<string | null>(null);
  const unsubscribe = shallowRef<null | (() => void)>(null);
  const rafHandle = shallowRef<number | null>(null);
  const updateQueue = markRaw(new Map<string, Task>());
  const latestFetch = shallowRef(0);
  const { bars, computeBars, computeTime, droppedFrames, dispose: disposeWorker } = useGanttEngine();
  const metricsInterval = shallowRef<number | null>(null);

  const state = reactive({
    visibleTasks: [] as Task[],
    visibleOffset: 0,
    totalCount: 0,
    scrollTop: 0,
    viewportHeight: 0,
    timelineRange: {
      start: Date.now() - 4 * MS_PER_HOUR,
      end: Date.now() + 18 * MS_PER_HOUR
    },
    zoomLevel: 48,
    selectedId: '',
    hoverId: '' as string | '',
    showDebug: true,
    isLoading: false,
    metrics: {
      visibleRows: '0-0',
      visibleTime: '',
      updatesPerSec: 0,
      computeMs: 0,
      droppedFrames: 0,
      staleResponses: 0
    }
  });

  let updatesApplied = 0;
  let lastUpdateWindow = performance.now();

  const pxPerHour = computed(() => state.zoomLevel);

  const setVisibleRows = () => {
    if (!state.viewportHeight) {
      state.visibleTasks = [];
      return;
    }
    const range = getVirtualRange({
      scrollTop: state.scrollTop,
      rowHeight,
      viewportHeight: state.viewportHeight,
      totalCount: state.totalCount || 1
    });
    state.visibleOffset = range.offsetTop;
    state.visibleTasks = loadedTaskIds.value
      .slice(range.startIndex, range.endIndex + 1)
      .map((id) => cache.get(id))
      .filter((task): task is Task => Boolean(task));
    state.metrics.visibleRows = `${range.startIndex}-${range.endIndex}`;
    computeBars({
      tasks: state.visibleTasks,
      rangeStart: state.timelineRange.start,
      pxPerHour: pxPerHour.value
    });
    ensureTasks(range.startIndex, range.endIndex);
  };

  const ensureTasks = (startIndex: number, endIndex: number) => {
    const totalLoaded = loadedTaskIds.value.length;
    const threshold = 12;

    if (totalLoaded === 0) {
      void loadMore('forward');
      return;
    }

    if (endIndex > totalLoaded - threshold) {
      void loadMore('forward');
    }

    if (startIndex < threshold) {
      void loadMore('backward');
    }
  };

  const loadMore = async (direction: 'forward' | 'backward') => {
    if (state.isLoading) return;
    state.isLoading = true;
    const requestId = ++latestFetch.value;
    try {
      const response = await fetchTasks({
        anchorId: anchorId.value,
        direction,
        limit: 120,
        rangeStart: state.timelineRange.start,
        rangeEnd: state.timelineRange.end
      });
      if (requestId !== latestFetch.value) {
        state.metrics.staleResponses += 1;
        return;
      }
      response.tasks.forEach((task) => {
        const pending = pendingUpdates.get(task.id);
        const merged = mergeTaskUpdate(cache.get(task.id), pending ? mergeTaskUpdate(task, pending) : task);
        cache.set(task.id, merged);
        pendingUpdates.delete(task.id);
      });
      const newIds = response.tasks.map((task) => task.id).filter((id) => !loadedTaskIds.value.includes(id));
      if (direction === 'backward') {
        loadedTaskIds.value = [...newIds, ...loadedTaskIds.value];
      } else {
        loadedTaskIds.value = [...loadedTaskIds.value, ...newIds];
      }
      anchorId.value = response.anchorId;
      state.totalCount = response.totalCount;
      setVisibleRows();
    } finally {
      state.isLoading = false;
    }
  };

  const applyUpdates = () => {
    rafHandle.value = null;
    updateQueue.forEach((update) => {
      const existing = cache.get(update.id);
      if (!existing) {
        pendingUpdates.set(update.id, update);
        return;
      }
      const merged = mergeTaskUpdate(existing, update);
      cache.set(update.id, merged);
    });
    updateQueue.clear();
    updatesApplied += 1;
    setVisibleRows();
    computeBars({
      tasks: state.visibleTasks,
      rangeStart: state.timelineRange.start,
      pxPerHour: pxPerHour.value
    });
    const now = performance.now();
    if (now - lastUpdateWindow > 1000) {
      state.metrics.updatesPerSec = updatesApplied;
      updatesApplied = 0;
      lastUpdateWindow = now;
    }
  };

  const enqueueUpdates = (updates: Task[]) => {
    updates.forEach((update) => {
      updateQueue.set(update.id, update);
    });
    if (rafHandle.value === null) {
      rafHandle.value = requestAnimationFrame(applyUpdates);
    }
  };

  const initialize = () => {
    void loadMore('forward');
    unsubscribe.value = subscribeUpdates(enqueueUpdates);
  };

  const updateTimelineRange = (range: { start: number; end: number }) => {
    state.timelineRange = clampRange(range, MIN_RANGE_MS);
    state.metrics.visibleTime = `${new Date(state.timelineRange.start).toLocaleTimeString()} - ${new Date(
      state.timelineRange.end
    ).toLocaleTimeString()}`;
    loadedTaskIds.value = [];
    anchorId.value = null;
    void loadMore('forward');
  };

  const updateZoomLevel = (zoom: number) => {
    state.zoomLevel = zoom;
    computeBars({
      tasks: state.visibleTasks,
      rangeStart: state.timelineRange.start,
      pxPerHour: pxPerHour.value
    });
  };

  const updateScrollTop = (value: number) => {
    state.scrollTop = value;
    setVisibleRows();
  };

  const updateViewportHeight = (height: number) => {
    state.viewportHeight = height;
    setVisibleRows();
  };

  const updateHorizontalScroll = (scrollLeft: number, viewportWidth: number) => {
    const visibleStart = state.timelineRange.start + (scrollLeft / pxPerHour.value) * MS_PER_HOUR;
    const visibleEnd = visibleStart + (viewportWidth / pxPerHour.value) * MS_PER_HOUR;
    state.metrics.visibleTime = `${new Date(visibleStart).toLocaleTimeString()} - ${new Date(
      visibleEnd
    ).toLocaleTimeString()}`;
  };

  const selectTask = (taskId: string) => {
    state.selectedId = taskId;
  };

  const setHoverTask = (taskId: string | null) => {
    state.hoverId = taskId ?? '';
  };

  const dispose = () => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    if (rafHandle.value !== null) {
      cancelAnimationFrame(rafHandle.value);
    }
    if (metricsInterval.value !== null) {
      clearInterval(metricsInterval.value);
      metricsInterval.value = null;
    }
    disposeWorker();
  };

  state.metrics.visibleTime = `${new Date(state.timelineRange.start).toLocaleTimeString()} - ${new Date(
    state.timelineRange.end
  ).toLocaleTimeString()}`;

  const metricsWatcher = () => {
    state.metrics.computeMs = computeTime.value;
    state.metrics.droppedFrames = droppedFrames.value;
  };

  metricsInterval.value = window.setInterval(metricsWatcher, 250);

  return {
    state,
    initialize,
    updateTimelineRange,
    updateZoomLevel,
    updateScrollTop,
    updateViewportHeight,
    updateHorizontalScroll,
    selectTask,
    setHoverTask,
    dispose,
    bars
  };
};
