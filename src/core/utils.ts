import type { StrokeType, Workout, WorkoutSet, WorkoutStep } from './types.ts';

export function generateId(): string {
  return crypto.randomUUID();
}

export function createDefaultStep(): WorkoutStep {
  return {
    id: generateId(),
    repetitions: 1,
    strokeType: 'free',
    distance: 100,
    equipment: [],
    track: true,
    targetPace: '',
    description: '',
    restType: 'rest',
    restValue: 15,
  };
}

export function createDefaultSet(): WorkoutSet {
  return {
    id: generateId(),
    name: '',
    iterations: 1,
    steps: [createDefaultStep()],
  };
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultWorkout(): Workout {
  return {
    name: '',
    createdAt: todayDateString(),
    description: '',
    poolLength: 25,
    poolLengthUnit: 'yard',
    sets: [],
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Deep-clone a set with fresh ids for the set and every step. */
export function cloneSetFresh(set: WorkoutSet): WorkoutSet {
  return {
    ...set,
    id: generateId(),
    steps: set.steps.map(step => ({
      ...step,
      id: generateId(),
      equipment: [...step.equipment],
    })),
  };
}

/** Distance covered in a single iteration of the set (sum of step.distance * step.repetitions). */
export function calcSetBaseDistance(set: WorkoutSet): number {
  return set.steps.reduce((d, s) => d + s.distance * s.repetitions, 0);
}

export interface SetOverrides {
  stroke?: StrokeType;
  /** Multiplier applied uniformly to every step's distance. */
  distanceScale?: number;
  iterations?: number;
}

export function applySetOverrides(set: WorkoutSet, overrides: SetOverrides): WorkoutSet {
  const scale = overrides.distanceScale ?? 1;
  return {
    ...set,
    iterations: overrides.iterations ?? set.iterations,
    steps: set.steps.map(step => ({
      ...step,
      strokeType: overrides.stroke ?? step.strokeType,
      distance: scale === 1 ? step.distance : Math.max(1, Math.round(step.distance * scale)),
    })),
  };
}

export function calcTotalDistance(workout: Workout): number {
  return workout.sets.reduce(
    (total, set) => total + calcSetBaseDistance(set) * set.iterations,
    0,
  );
}
