export const getVisibleRange = ({
  scrollTop,
  rowHeight,
  viewportHeight,
  totalCount,
  buffer = 6
}) => {
  const startIndex = Math.max(Math.floor(scrollTop / rowHeight) - buffer, 0);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + buffer * 2;
  const endIndex = Math.min(startIndex + visibleCount, totalCount);
  return { startIndex, endIndex };
};
