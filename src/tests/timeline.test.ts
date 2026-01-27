import { describe, expect, it } from 'vitest';
import { dateToPx, MS_PER_HOUR } from '../utils/timeline';

describe('dateToPx', () => {
  it('maps time to pixels', () => {
    const start = Date.now();
    const px = dateToPx({ date: start + 2 * MS_PER_HOUR, start, pxPerHour: 50 });
    expect(px).toBeCloseTo(100);
  });
});
