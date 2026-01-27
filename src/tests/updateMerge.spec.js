import { describe, expect, it } from 'vitest';
import { mergeTaskUpdate } from '../utils/taskUpdates';

describe('mergeTaskUpdate', () => {
  it('keeps the latest update', () => {
    const existing = { id: 'task-1', updatedAt: 100 };
    const update = { id: 'task-1', updatedAt: 200 };

    const merged = mergeTaskUpdate(existing, update);

    expect(merged.updatedAt).toBe(200);
  });

  it('keeps existing when update is stale', () => {
    const existing = { id: 'task-1', updatedAt: 200 };
    const update = { id: 'task-1', updatedAt: 100 };

    const merged = mergeTaskUpdate(existing, update);

    expect(merged.updatedAt).toBe(200);
  });
});
