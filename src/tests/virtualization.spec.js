import { describe, expect, it } from 'vitest';
import { getVisibleRange } from '../utils/virtualization';

describe('getVisibleRange', () => {
  it('calculates a buffered range', () => {
    const range = getVisibleRange({
      scrollTop: 180,
      rowHeight: 30,
      viewportHeight: 120,
      totalCount: 200,
      buffer: 2
    });

    expect(range.startIndex).toBe(4);
    expect(range.endIndex).toBe(12);
  });

  it('keeps render count bounded', () => {
    const range = getVisibleRange({
      scrollTop: 0,
      rowHeight: 30,
      viewportHeight: 600,
      totalCount: 10_000,
      buffer: 4
    });

    expect(range.endIndex - range.startIndex).toBeLessThanOrEqual(28);
  });
});
