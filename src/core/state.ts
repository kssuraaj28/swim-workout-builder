import { decode, encode } from 'cbor-x';
import type { Workout } from './workouts.ts';
import { createDefaultWorkout, normalizeWorkout } from './workouts.ts';
import { asObject, normalizeFail, rejectUnknown } from './utils.ts';

export const STATE_VERSION = 1;

export interface AppState {
  version: number;
  workout: Workout;
  library: Workout[];
}

export function createEmptyState(): AppState {
  return {
    version: STATE_VERSION,
    workout: createDefaultWorkout(),
    library: [],
  };
}

export function encodeState(state: AppState): Uint8Array {
  return encode(state);
}

export function decodeState(bytes: Uint8Array): AppState {
  if (bytes.byteLength === 0) normalizeFail('State file is empty.');

  let raw: unknown;
  try {
    raw = decode(bytes);
  } catch (err) {
    normalizeFail(`Not a readable state file (${err instanceof Error ? err.message : String(err)}).`);
  }

  return normalizeAppState(raw);
}

const APP_STATE_KEYS = Object.keys(createEmptyState()) as (keyof AppState)[];

function normalizeAppState(raw: unknown): AppState {
  const obj = asObject(raw);
  rejectUnknown(obj, APP_STATE_KEYS, []);

  if (obj.version !== STATE_VERSION) {
    normalizeFail(`State file is version ${String(obj.version)}, this build reads version ${STATE_VERSION}.`);
  }
  if (!Array.isArray(obj.library)) normalizeFail('library must be an array');

  return {
    version: STATE_VERSION,
    workout: normalizeWorkout(obj.workout),
    library: obj.library.map(normalizeWorkout),
  };
}
