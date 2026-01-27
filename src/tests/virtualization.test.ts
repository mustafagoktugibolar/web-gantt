import { describe, expect, it } from 'vitest';
import { getVirtualRange } from '../utils/virtualization';

describe('getVirtualRange', () => {
  it('calculates buffered range within bounds', () => {
    const range = getVirtualRange({
      scrollTop: 120,
      rowHeight: 30,
      viewportHeight: 300,
      totalCount: 200,
      buffer: 4
    });
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBeGreaterThan(range.startIndex);
    expect(range.offsetTop).toBe(0);
  });
});
