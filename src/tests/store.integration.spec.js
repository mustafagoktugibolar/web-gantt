import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/taskService', () => {
  return {
    fetchTasks: vi.fn(async () => ({
      tasks: [
        { id: 'task-0', updatedAt: 10, start: 0, end: 1 },
        { id: 'task-1', updatedAt: 10, start: 0, end: 1 }
      ],
      nextAnchor: 2,
      prevAnchor: 0
    })),
    getTotalTasks: vi.fn(() => 200),
    subscribeUpdates: vi.fn(() => () => {})
  };
});

vi.mock('../services/ganttEngine', () => {
  return {
    GanttEngine: class {
      computeBars() {
        return Promise.resolve([]);
      }
    }
  };
});

describe('task store integration', () => {
  it('fetches on scroll and timeline update', async () => {
    const { fetchTasks } = await import('../services/taskService');
    const { useTaskStore } = await import('../store/useTaskStore');
    const store = useTaskStore();

    await store.onScroll(0);
    expect(fetchTasks).toHaveBeenCalledTimes(1);

    await store.updateTimeline({
      start: 0,
      end: 1000,
      pxPerHour: 20
    });
    expect(fetchTasks).toHaveBeenCalledTimes(2);
  });
});
