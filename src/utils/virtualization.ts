export interface VirtualRange {
  startIndex: number;
  endIndex: number;
  offsetTop: number;
}

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const getVirtualRange = ({
  scrollTop,
  rowHeight,
  viewportHeight,
  totalCount,
  buffer = 6
}: {
  scrollTop: number;
  rowHeight: number;
  viewportHeight: number;
  totalCount: number;
  buffer?: number;
}): VirtualRange => {
  const startIndex = clamp(Math.floor(scrollTop / rowHeight) - buffer, 0, totalCount - 1);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + buffer * 2;
  const endIndex = clamp(startIndex + visibleCount, 0, totalCount - 1);
  return {
    startIndex,
    endIndex,
    offsetTop: startIndex * rowHeight
  };
};
