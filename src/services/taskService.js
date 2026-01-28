const TOTAL_TASKS = 12000;
const BASE_TIME = Date.now() - 3 * 24 * 60 * 60 * 1000;

const statuses = ['planned', 'active', 'blocked', 'done'];

const createTask = (index) => {
  const bucketHours = 10 * 24;
  const hourOffset = (index % bucketHours) * 60 * 60 * 1000;
  const jitter = (index % 12) * 5 * 60 * 1000;
  const start = BASE_TIME + hourOffset + jitter;
  const duration = (4 + (index % 12)) * 60 * 60 * 1000;
  return {
    id: `task-${index}`,
    name: `Task ${index}`,
    start,
    end: start + duration,
    progress: (index * 7) % 100,
    status: statuses[index % statuses.length],
    updatedAt: Date.now() - Math.floor(Math.random() * 60_000)
  };
};

const tasks = Array.from({ length: TOTAL_TASKS }, (_, index) => createTask(index));

const filterByRange = (task, rangeStart, rangeEnd) => {
  if (!rangeStart || !rangeEnd) return true;
  return task.end >= rangeStart && task.start <= rangeEnd;
};

const simulateDelay = (min = 80, max = 260) =>
  new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));

export const fetchTasks = async ({
  anchorIndex = 0,
  direction = 'forward',
  limit = 80,
  rangeStart,
  rangeEnd
}) => {
  await simulateDelay();
  const startIndex = direction === 'backward'
    ? Math.max(anchorIndex - limit, 0)
    : anchorIndex;
  const endIndex = Math.min(startIndex + limit, tasks.length);
  const page = tasks.slice(startIndex, endIndex);
  return {
    tasks: page,
    nextAnchor: endIndex,
    prevAnchor: startIndex
  };
};

export const subscribeUpdates = (callback) => {
  let active = true;
  const interval = setInterval(() => {
    if (!active) return;
    const batchSize = 4 + Math.floor(Math.random() * 4);
    const updates = Array.from({ length: batchSize }, () => {
      const index = Math.floor(Math.random() * tasks.length);
      const current = tasks[index];
      const delta = (Math.random() - 0.5) * 2 * 60 * 60 * 1000;
      const updated = {
        ...current,
        start: current.start + delta,
        end: current.end + delta,
        progress: (current.progress + Math.floor(Math.random() * 12)) % 100,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        updatedAt: Date.now()
      };
      tasks[index] = updated;
      return updated;
    });
    callback(updates);
  }, 333);

  return () => {
    active = false;
    clearInterval(interval);
  };
};

export const getTotalTasks = () => tasks.length;
