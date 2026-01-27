import type { Task } from '../services/mockApi';

export const mergeTaskUpdate = (existing: Task | undefined, update: Task): Task => {
  if (!existing || update.updatedAt >= existing.updatedAt) {
    return { ...existing, ...update } as Task;
  }
  return existing;
};
