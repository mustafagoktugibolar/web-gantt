import { describe, expect, it } from 'vitest';
import { dateToPx, pxToDate, HOUR_MS } from '../utils/time';

describe('time mapping', () => {
  it('maps date to px and back', () => {
    const start = 1_700_000_000_000;
    const target = start + 6 * HOUR_MS;
    const pxPerHour = 50;

    const px = dateToPx(target, start, pxPerHour);
    const back = pxToDate(px, start, pxPerHour);

    expect(px).toBe(300);
    expect(back).toBe(target);
  });
});
