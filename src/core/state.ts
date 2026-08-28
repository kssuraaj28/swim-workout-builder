import { decode, encode } from 'cbor-x';
import type { Workout } from './workouts.ts';
import { createDefaultWorkout, normalizeWorkout } from './workouts.ts';
import type { Designer } from './designers.ts';
import { normalizeDesigner } from './designers.ts';
import type { Warned } from './utils.ts';
import { NormalizeWarnings, asObject, warnUnknown } from './utils.ts';

export const STATE_VERSION = 1;

export interface AppState {
  version: number;
  workout: Workout;
  library: Workout[];
  designers: Designer[];
}

export function createEmptyState(): AppState {
  return {
    version: STATE_VERSION,
    workout: createDefaultWorkout(),
    library: [],
    designers: [],
  };
}

export function encodeState(state: AppState): Uint8Array {
  return encode(state);
}

const APP_STATE_KEYS = Object.keys(createEmptyState()) as (keyof AppState)[];

export function decodeState(bytes: Uint8Array): Warned<AppState> {
  const warnings = new NormalizeWarnings();

  if (bytes.byteLength === 0) {
    warnings.add('State file is empty; using an empty state');
    return { value: createEmptyState(), warnings };
  }

  let raw: unknown;
  try {
    raw = decode(bytes);
  } catch (err) {
    warnings.add(`Not a readable state file (${err instanceof Error ? err.message : String(err)}); using an empty state`);
    return { value: createEmptyState(), warnings };
  }

  const obj = asObject(raw, 'state', warnings);
  warnUnknown(obj, APP_STATE_KEYS, warnings);

  if (obj.version !== STATE_VERSION) {
    warnings.add(`State file is version ${String(obj.version)}, this build reads version ${STATE_VERSION}; using an empty state`);
    return { value: createEmptyState(), warnings };
  }

  const workoutResult = normalizeWorkout(obj.workout);
  warnings.merge(workoutResult.warnings);

  let library: Workout[] = [];
  if (Array.isArray(obj.library)) {
    library = obj.library.map(w => {
      const r = normalizeWorkout(w);
      warnings.merge(r.warnings);
      return r.value;
    });
  } else if (obj.library !== undefined) {
    warnings.add('library was not an array; using []');
  }

  let designers: Designer[] = [];
  if (Array.isArray(obj.designers)) {
    designers = obj.designers.map(d => {
      const r = normalizeDesigner(d);
      warnings.merge(r.warnings);
      return r.value;
    });
  } else if (obj.designers !== undefined) {
    warnings.add('designers was not an array; using []');
  }

  return {
    value: { version: STATE_VERSION, workout: workoutResult.value, library, designers },
    warnings,
  };
}
