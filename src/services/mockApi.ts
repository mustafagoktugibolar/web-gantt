export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

export interface Task {
  id: string;
  name: string;
  start: number;
  end: number;
  progress?: number;
  status?: TaskStatus;
  updatedAt: number;
}

export interface TaskFetchResponse {
  tasks: Task[];
  anchorId: string | null;
  totalCount: number;
}

const TOTAL_TASKS = 12000;
const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done'];

const baseStart = Date.now() - 5 * 24 * 60 * 60 * 1000;

const taskDb: Task[] = Array.from({ length: TOTAL_TASKS }).map((_, index) => {
  const startOffset = (index % 240) * 60 * 60 * 1000;
  const duration = (2 + (index % 12)) * 60 * 60 * 1000;
  return {
    id: `TASK-${index + 1}`,
    name: `Task ${index + 1}`,
    start: baseStart + startOffset,
    end: baseStart + startOffset + duration,
    progress: Math.round(Math.random() * 100),
    status: STATUSES[index % STATUSES.length],
    updatedAt: Date.now()
  };
});

const randomUpdate = () => {
  const index = Math.floor(Math.random() * TOTAL_TASKS);
  const task = taskDb[index];
  const deltaHours = (Math.random() - 0.5) * 4;
  const newStart = task.start + deltaHours * 60 * 60 * 1000;
  const duration = task.end - task.start;
  const updated: Task = {
    ...task,
    start: newStart,
    end: newStart + duration,
    progress: Math.min(100, Math.max(0, (task.progress ?? 0) + Math.round((Math.random() - 0.5) * 10))),
    updatedAt: Date.now()
  };
  taskDb[index] = updated;
  return updated;
};

export const fetchTasks = async ({
  anchorId,
  direction,
  limit,
  rangeStart,
  rangeEnd
}: {
  anchorId: string | null;
  direction: 'forward' | 'backward';
  limit: number;
  rangeStart: number;
  rangeEnd: number;
}): Promise<TaskFetchResponse> => {
  const rangeTasks = taskDb.filter((task) => task.end >= rangeStart && task.start <= rangeEnd);
  const anchorIndex = anchorId ? rangeTasks.findIndex((task) => task.id === anchorId) : -1;
  const startIndex =
    anchorIndex === -1
      ? direction === 'forward'
        ? 0
        : Math.max(rangeTasks.length - limit, 0)
      : direction === 'forward'
        ? anchorIndex + 1
        : Math.max(anchorIndex - limit, 0);
  const slice = rangeTasks.slice(startIndex, startIndex + limit);

  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    tasks: slice,
    anchorId: slice.length ? slice[slice.length - 1].id : anchorId,
    totalCount: rangeTasks.length
  };
};

export const subscribeUpdates = (callback: (updates: Task[]) => void) => {
  const interval = setInterval(() => {
    const updates = Array.from({ length: 3 }).map(() => randomUpdate());
    callback(updates);
  }, 333);

  return () => clearInterval(interval);
};
