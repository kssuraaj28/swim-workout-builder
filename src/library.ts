import type { Workout } from './types';

const LIBRARY_KEY = 'swim-workout-library';

export function loadLibrary(): Workout[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveLibrary(workouts: Workout[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(workouts));
}

export function saveWorkoutToLibrary(workout: Workout): Workout[] {
  const lib = loadLibrary();
  const stamped = { ...workout, savedAt: new Date().toISOString() };
  const idx = lib.findIndex(w => w.id === workout.id);
  if (idx >= 0) {
    lib[idx] = stamped;
  } else {
    lib.unshift(stamped);
  }
  saveLibrary(lib);
  return lib;
}

export function deleteFromLibrary(id: string): Workout[] {
  const lib = loadLibrary().filter(w => w.id !== id);
  saveLibrary(lib);
  return lib;
}
