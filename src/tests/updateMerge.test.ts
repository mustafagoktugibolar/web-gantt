import { describe, expect, it } from 'vitest';
import { mergeTaskUpdate } from '../utils/updateMerge';
import type { Task } from '../services/mockApi';

describe('mergeTaskUpdate', () => {
  it('prefers newer updates', () => {
    const base: Task = {
      id: '1',
      name: 'Task',
      start: 0,
      end: 1,
      updatedAt: 10
    };
    const update: Task = { ...base, name: 'Updated', updatedAt: 20 };
    const result = mergeTaskUpdate(base, update);
    expect(result.name).toBe('Updated');
  });

  it('keeps existing when update is stale', () => {
    const base: Task = {
      id: '1',
      name: 'Task',
      start: 0,
      end: 1,
      updatedAt: 30
    };
    const update: Task = { ...base, name: 'Stale', updatedAt: 10 };
    const result = mergeTaskUpdate(base, update);
    expect(result.name).toBe('Task');
  });
});
