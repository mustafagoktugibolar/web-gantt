export const mergeTaskUpdate = (existing, update) => {
  if (!existing) return update;
  if (!update) return existing;
  return existing.updatedAt >= update.updatedAt ? existing : update;
};
