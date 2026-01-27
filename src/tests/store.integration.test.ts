import { describe, expect, it, vi } from 'vitest';
import { shallowRef } from 'vue';

vi.mock('../services/ganttEngine', () => {
  return {
    useGanttEngine: () => ({
      bars: shallowRef([]),
      computeBars: vi.fn(),
      computeTime: shallowRef(0),
      droppedFrames: shallowRef(0),
      dispose: vi.fn()
    })
  };
});

const fetchTasks = vi.fn(async () => ({
  tasks: [
    {
      id: 'TASK-1',
      name: 'Task 1',
      start: 0,
      end: 1,
      updatedAt: 1
    }
  ],
  anchorId: 'TASK-1',
  totalCount: 1
}));

const subscribeUpdates = vi.fn(() => () => undefined);

vi.mock('../services/mockApi', () => {
  return {
    fetchTasks,
    subscribeUpdates
  };
});

import { useTaskStore } from '../composables/useTaskStore';

describe('useTaskStore integration', () => {
  it('fetches on initialize and refetches on range update', async () => {
    const store = useTaskStore({ rowHeight: 32 });
    store.updateViewportHeight(320);
    store.initialize();
    await Promise.resolve();

    expect(fetchTasks).toHaveBeenCalledTimes(1);

    store.updateTimelineRange({ start: 1000, end: 2000 });
    await Promise.resolve();

    expect(fetchTasks).toHaveBeenCalledTimes(2);
  });
});
