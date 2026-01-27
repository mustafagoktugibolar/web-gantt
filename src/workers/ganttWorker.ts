import { dateToPx } from '../utils/timeline';
import type { Task } from '../services/mockApi';

export interface WorkerRequest {
  id: number;
  tasks: Task[];
  rangeStart: number;
  pxPerHour: number;
}

export interface WorkerResponse {
  id: number;
  bars: Array<{ id: string; x: number; width: number }>;
  computeTime: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const startTime = performance.now();
  const { id, tasks, rangeStart, pxPerHour } = event.data;
  const bars = tasks.map((task) => {
    const x = dateToPx({ date: task.start, start: rangeStart, pxPerHour });
    const width = Math.max(4, dateToPx({ date: task.end, start: rangeStart, pxPerHour }) - x);
    return {
      id: task.id,
      x,
      width
    };
  });
  const computeTime = performance.now() - startTime;
  self.postMessage({ id, bars, computeTime } satisfies WorkerResponse);
};
