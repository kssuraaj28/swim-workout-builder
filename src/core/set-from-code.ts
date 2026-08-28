import type { WorkoutSet } from './workouts.ts';
import { createDefaultSet, createDefaultStep } from './workouts.ts';

export function buildSetFromCode(): WorkoutSet {
  return {
    ...createDefaultSet(),
    name: 'From Code',
    steps: [{ ...createDefaultStep(), repetitions: 5, distance: 200 }],
  };
}
