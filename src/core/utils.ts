import type { Workout, WorkoutSet, WorkoutStep } from './types.ts';

export function createDefaultStep(): WorkoutStep {
  return {
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

/** Distance covered in a single iteration of the set (sum of step.distance * step.repetitions). */
export function calcSetBaseDistance(set: WorkoutSet): number {
  return set.steps.reduce((d, s) => d + s.distance * s.repetitions, 0);
}

export function calcTotalDistance(workout: Workout): number {
  return workout.sets.reduce(
    (total, set) => total + calcSetBaseDistance(set) * set.iterations,
    0,
  );
}
