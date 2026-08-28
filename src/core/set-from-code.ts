import type { WorkoutSet } from './workouts.ts';
import { createDefaultSet, normalizeWorkoutSet } from './workouts.ts';
import type { Warned } from './utils.ts';
import { NormalizeWarnings } from './utils.ts';

export function buildSetFromCode(source: string): Warned<WorkoutSet> {
  let raw: unknown;
  try {
    raw = new Function(source)();
  } catch (err) {
    const warnings = new NormalizeWarnings();
    warnings.add(`Code failed to run: ${err instanceof Error ? err.message : String(err)}`);
    return { value: createDefaultSet(), warnings };
  }
  return normalizeWorkoutSet(raw);
}
