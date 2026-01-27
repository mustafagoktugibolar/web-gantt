import Worker from '../worker/ganttWorker?worker';

export class GanttEngine {
  constructor() {
    this.worker = new Worker();
    this.requestId = 0;
    this.handlers = new Map();
    this.worker.addEventListener('message', (event) => {
      const { requestId, result } = event.data;
      const handler = this.handlers.get(requestId);
      if (handler) {
        handler(result);
        this.handlers.delete(requestId);
      }
    });
  }

  computeBars({ tasks, rangeStart, rangeEnd, pxPerHour }) {
    const requestId = ++this.requestId;
    return new Promise((resolve) => {
      this.handlers.set(requestId, resolve);
      this.worker.postMessage({
        requestId,
        tasks,
        rangeStart,
        rangeEnd,
        pxPerHour
      });
    });
  }
}
