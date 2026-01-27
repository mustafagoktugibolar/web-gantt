import { shallowRef } from 'vue';
import type { Task } from './mockApi';
import type { WorkerResponse } from '../workers/ganttWorker';

export interface Bar {
  id: string;
  x: number;
  width: number;
}

export const useGanttEngine = () => {
  const bars = shallowRef<Bar[]>([]);
  const computeTime = shallowRef(0);
  const droppedFrames = shallowRef(0);
  const worker = new Worker(new URL('../workers/ganttWorker.ts', import.meta.url), {
    type: 'module'
  });
  let latestRequest = 0;

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    if (event.data.id !== latestRequest) {
      droppedFrames.value += 1;
      return;
    }
    bars.value = event.data.bars;
    computeTime.value = Math.round(event.data.computeTime);
  };

  const computeBars = ({
    tasks,
    rangeStart,
    pxPerHour
  }: {
    tasks: Task[];
    rangeStart: number;
    pxPerHour: number;
  }) => {
    latestRequest += 1;
    worker.postMessage({ id: latestRequest, tasks, rangeStart, pxPerHour });
  };

  const dispose = () => {
    worker.terminate();
  };

  return {
    bars,
    computeBars,
    computeTime,
    droppedFrames,
    dispose
  };
};
