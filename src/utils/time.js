export const HOUR_MS = 60 * 60 * 1000;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const dateToPx = (timestamp, rangeStart, pxPerHour) => {
  const diffHours = (timestamp - rangeStart) / HOUR_MS;
  return diffHours * pxPerHour;
};

export const pxToDate = (px, rangeStart, pxPerHour) => {
  const hours = px / pxPerHour;
  return rangeStart + hours * HOUR_MS;
};

export const formatDateInput = (timestamp) => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const parseDateInput = (value) => {
  if (!value) return null;
  return new Date(value).getTime();
};
