const HOUR_MS = 60 * 60 * 1000;

const dateToPx = (timestamp, rangeStart, pxPerHour) => {
  const diffHours = (timestamp - rangeStart) / HOUR_MS;
  return diffHours * pxPerHour;
};

self.addEventListener('message', (event) => {
  const { requestId, tasks, rangeStart, rangeEnd, pxPerHour } = event.data;
  const bars = tasks.map((task) => {
    const left = dateToPx(task.start, rangeStart, pxPerHour);
    const right = dateToPx(task.end, rangeStart, pxPerHour);
    const width = Math.max(right - left, 6);
    const within = task.end >= rangeStart && task.start <= rangeEnd;
    return {
      id: task.id,
      left,
      width,
      within,
      progress: task.progress,
      status: task.status
    };
  });
  self.postMessage({ requestId, result: bars });
});
