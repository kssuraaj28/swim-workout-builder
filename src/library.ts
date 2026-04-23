import type { Workout } from './types';

const LIBRARY_KEY = 'swim-workout-library';

export interface WorkoutKey {
  name: string;
  createdAt: string;
}

export class DuplicateWorkoutError extends Error {
  readonly key: WorkoutKey;
  constructor(key: WorkoutKey) {
    super(`A workout named "${key.name}" created on ${key.createdAt} already exists.`);
    this.name = 'DuplicateWorkoutError';
    this.key = key;
  }
}

function sameKey(a: WorkoutKey, b: WorkoutKey): boolean {
  return a.name === b.name && a.createdAt === b.createdAt;
}

export function loadLibrary(): Workout[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const parsed: Workout[] = JSON.parse(raw);
      // Migrate pre-createdAt entries: derive from savedAt or fall back to today.
      return parsed.map(w => w.createdAt ? w : { ...w, createdAt: (w.savedAt ?? new Date().toISOString()).slice(0, 10) });
    }
  } catch { /* ignore */ }
  return [];
}

function saveLibrary(workouts: Workout[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(workouts));
}

export function saveWorkoutToLibrary(
  workout: Workout,
  opts: { overwrite?: boolean } = {},
): Workout[] {
  const lib = loadLibrary();
  const stamped = { ...workout, savedAt: new Date().toISOString() };
  const idx = lib.findIndex(w => sameKey(w, workout));
  if (idx >= 0) {
    if (!opts.overwrite) throw new DuplicateWorkoutError({ name: workout.name, createdAt: workout.createdAt });
    lib[idx] = stamped;
  } else {
    lib.unshift(stamped);
  }
  saveLibrary(lib);
  return lib;
}

export function deleteFromLibrary(key: WorkoutKey): Workout[] {
  const lib = loadLibrary().filter(w => !sameKey(w, key));
  saveLibrary(lib);
  return lib;
}
