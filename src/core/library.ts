/** Generic library operations. Any collection of `{ id: string }` items — workouts, designers,
 * blocks — uses these. */

export function hasId<T extends { id: string }>(items: readonly T[], id: string): boolean {
  return items.some(i => i.id === id);
}

/** Replace the entry with matching id, or append if none. */
export function upsertById<T extends { id: string }>(items: readonly T[], item: T): T[] {
  return [...items.filter(i => i.id !== item.id), item];
}

export function removeById<T extends { id: string }>(items: readonly T[], id: string): T[] {
  return items.filter(i => i.id !== id);
}
