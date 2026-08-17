import type { WorkoutSet } from './types.ts';
import { createDefaultSet, createDefaultStep } from './utils.ts';

export function buildSetFromCode(): WorkoutSet {
  return {
    ...createDefaultSet(),
    name: 'From Code',
    steps: [{ ...createDefaultStep(), repetitions: 5, distance: 200 }],
  };
}
