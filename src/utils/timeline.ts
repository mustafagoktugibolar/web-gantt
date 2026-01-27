export const MS_PER_HOUR = 60 * 60 * 1000;

export const dateToPx = ({
  date,
  start,
  pxPerHour
}: {
  date: number;
  start: number;
  pxPerHour: number;
}) => {
  return ((date - start) / MS_PER_HOUR) * pxPerHour;
};

export const clampRange = (range: { start: number; end: number }, minSpanMs: number) => {
  if (range.end - range.start < minSpanMs) {
    return { start: range.start, end: range.start + minSpanMs };
  }
  return range;
};
