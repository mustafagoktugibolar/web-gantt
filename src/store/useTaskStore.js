import { computed, markRaw, reactive, ref, shallowRef } from 'vue';
import { fetchTasks, getTotalTasks, subscribeUpdates } from '../services/taskService';
import { getVisibleRange } from '../utils/virtualization';
import { GanttEngine } from '../services/ganttEngine';
import { pxToDate } from '../utils/time';
import { mergeTaskUpdate } from '../utils/taskUpdates';

const ROW_HEIGHT = 36;
const DEFAULT_RANGE_HOURS = 48;

const createInitialRange = () => {
  const start = Date.now() - 12 * 60 * 60 * 1000;
  return {
    start,
    end: start + DEFAULT_RANGE_HOURS * 60 * 60 * 1000,
    pxPerHour: 40
  };
};

const createStore = () => {
  const timeline = reactive(createInitialRange());
  const totalCount = ref(getTotalTasks());
  const scrollTop = ref(0);
  const scrollLeft = ref(0);
  const viewportHeight = ref(500);
  const viewportWidth = ref(900);
  const visibleRange = ref({ startIndex: 0, endIndex: 0 });
  const visibleTasks = shallowRef([]);
  const bars = shallowRef([]);
  const loading = ref(false);
  const staleFetches = ref(0);
  const updatesPerSec = ref(0);
  const workerMs = ref(0);
  const selectedId = ref(null);
  const hoveredId = ref(null);
  const pendingUpdates = markRaw(new Map());
  const tasksById = markRaw(new Map());
  const engine = markRaw(new GanttEngine());

  let fetchRequestId = 0;
  let updateQueue = [];
  let updateFrame = null;
  let updateCounter = 0;
  let updateTimer = null;
  let computeRequestId = 0;
  let scrollFrame = null;
  let pendingScrollTop = 0;

  const updateVisibleRange = () => {
    visibleRange.value = getVisibleRange({
      scrollTop: scrollTop.value,
      rowHeight: ROW_HEIGHT,
      viewportHeight: viewportHeight.value,
      totalCount: totalCount.value
    });
  };

  const applyUpdates = (updates) => {
    updates.forEach((update) => {
      const existing = tasksById.get(update.id);
      if (!existing) {
        pendingUpdates.set(update.id, update);
        return;
      }
      const merged = mergeTaskUpdate(existing, update);
      tasksById.set(update.id, merged);
    });
    updateCounter += updates.length;
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(async () => {
      updateFrame = null;
      await refreshVisibleTasks();
    });
  };

  const startUpdateCounter = () => {
    updateTimer = setInterval(() => {
      updatesPerSec.value = updateCounter;
      updateCounter = 0;
    }, 1000);
  };

  const refreshVisibleTasks = async () => {
    const { startIndex, endIndex } = visibleRange.value;
    const next = [];
    for (let index = startIndex; index < endIndex; index += 1) {
      const id = `task-${index}`;
      const task = tasksById.get(id);
      if (task) next.push(task);
    }
    visibleTasks.value = next;
    await computeBars();
  };

  const computeBars = async () => {
    const requestId = ++computeRequestId;
    const start = performance.now();
    const currentTasks = visibleTasks.value;
    const result = await engine.computeBars({
      tasks: currentTasks,
      rangeStart: timeline.start,
      rangeEnd: timeline.end,
      pxPerHour: timeline.pxPerHour
    });
    if (requestId !== computeRequestId) return;
    const end = performance.now();
    workerMs.value = Math.round(end - start);
    bars.value = result;
  };

  const fetchWindow = async ({ anchorIndex, direction }) => {
    const requestId = ++fetchRequestId;
    loading.value = true;
    const response = await fetchTasks({
      anchorIndex,
      direction,
      limit: 120,
      rangeStart: timeline.start,
      rangeEnd: timeline.end
    });
    if (requestId !== fetchRequestId) {
      staleFetches.value += 1;
      loading.value = false;
      return;
    }
    response.tasks.forEach((task) => {
      const pending = pendingUpdates.get(task.id);
      const merged = mergeTaskUpdate(task, pending);
      tasksById.set(task.id, merged);
      pendingUpdates.delete(task.id);
    });
    loading.value = false;
    await refreshVisibleTasks();
  };

  const ensureWindowData = async () => {
    const { startIndex, endIndex } = visibleRange.value;
    const needsTop = !tasksById.has(`task-${startIndex}`);
    const needsBottom = !tasksById.has(`task-${endIndex - 1}`);
    if (needsTop) {
      await fetchWindow({ anchorIndex: startIndex, direction: 'backward' });
    }
    if (needsBottom) {
      await fetchWindow({ anchorIndex: startIndex, direction: 'forward' });
    }
  };

  const updateTimeline = async ({ start, end, pxPerHour }) => {
    timeline.start = start;
    timeline.end = end;
    timeline.pxPerHour = pxPerHour;
    await fetchWindow({ anchorIndex: visibleRange.value.startIndex, direction: 'forward' });
  };

  const onScroll = (nextTop) => {
    pendingScrollTop = nextTop;
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(async () => {
      scrollFrame = null;
      scrollTop.value = pendingScrollTop;
      updateVisibleRange();
      await refreshVisibleTasks();
      await ensureWindowData();
    });
  };

  const onHorizontalScroll = (nextLeft) => {
    scrollLeft.value = nextLeft;
  };

  const setViewportHeight = (height) => {
    viewportHeight.value = height;
    updateVisibleRange();
    refreshVisibleTasks();
  };

  const setViewportWidth = (width) => {
    viewportWidth.value = width;
  };

  const selectTask = (id) => {
    selectedId.value = id;
  };

  const hoverTask = (id) => {
    hoveredId.value = id;
  };

  const init = async () => {
    updateVisibleRange();
    await fetchWindow({ anchorIndex: 0, direction: 'forward' });
    startUpdateCounter();
    subscribeUpdates((updates) => {
      updateQueue = updateQueue.concat(updates);
      if (updateFrame) return;
      updateFrame = requestAnimationFrame(() => {
        const batch = updateQueue;
        updateQueue = [];
        updateFrame = null;
        applyUpdates(batch);
      });
    });
  };

  const gridOffset = computed(() => visibleRange.value.startIndex * ROW_HEIGHT);
  const totalHeight = computed(() => totalCount.value * ROW_HEIGHT);
  const visibleTimeRange = computed(() => {
    const start = pxToDate(scrollLeft.value, timeline.start, timeline.pxPerHour);
    const end = pxToDate(
      scrollLeft.value + viewportWidth.value,
      timeline.start,
      timeline.pxPerHour
    );
    return { start, end };
  });

  return {
    timeline,
    totalCount,
    visibleRange,
    visibleTasks,
    bars,
    loading,
    scrollTop,
    scrollLeft,
    viewportHeight,
    viewportWidth,
    gridOffset,
    totalHeight,
    visibleTimeRange,
    updatesPerSec,
    workerMs,
    staleFetches,
    selectedId,
    hoveredId,
    rowHeight: ROW_HEIGHT,
    init,
    updateTimeline,
    onScroll,
    onHorizontalScroll,
    setViewportHeight,
    setViewportWidth,
    selectTask,
    hoverTask
  };
};

let store;

export const useTaskStore = () => {
  if (!store) {
    store = createStore();
  }
  return store;
};
