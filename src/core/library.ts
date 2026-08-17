import type { Workout, WorkoutKey } from './types.ts';

export class DuplicateWorkoutError extends Error {
  readonly key: WorkoutKey;
  constructor(key: WorkoutKey) {
    super(`A workout named "${key.name}" created on ${key.createdAt} already exists.`);
    this.name = 'DuplicateWorkoutError';
    this.key = key;
  }
}

export function sameKey(a: WorkoutKey, b: WorkoutKey): boolean {
  return a.name === b.name && a.createdAt === b.createdAt;
}

function keyOf(workout: Workout): WorkoutKey {
  return { name: workout.name, createdAt: workout.createdAt };
}

export function upsertWorkout(
  library: Workout[],
  workout: Workout,
  opts: { overwrite?: boolean } = {},
): Workout[] {
  const stamped = { ...workout, savedAt: new Date().toISOString() };
  const idx = library.findIndex(w => sameKey(w, workout));
  if (idx < 0) return [stamped, ...library];
  if (!opts.overwrite) throw new DuplicateWorkoutError(keyOf(workout));
  const next = [...library];
  next[idx] = stamped;
  return next;
}

export function removeWorkout(library: Workout[], key: WorkoutKey): Workout[] {
  return library.filter(w => !sameKey(w, key));
}
