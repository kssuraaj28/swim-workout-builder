import { decode, encode } from 'cbor-x';
import type { Workout } from './types.ts';
import { createDefaultWorkout } from './utils.ts';

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

class StateFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateFormatError';
  }
}

export function decodeState(bytes: Uint8Array): AppState {
  if (bytes.byteLength === 0) {
    throw new StateFormatError('State file is empty.');
  }

  let raw: unknown;
  try {
    raw = decode(bytes);
  } catch (err) {
    throw new StateFormatError(
      `Not a readable state file (${err instanceof Error ? err.message : String(err)}).`,
    );
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new StateFormatError('State file does not contain an object.');
  }

  const state = raw as Partial<AppState>;
  if (state.version !== STATE_VERSION) {
    throw new StateFormatError(
      `State file is version ${String(state.version)}, this build reads version ${STATE_VERSION}.`,
    );
  }
  if (!Array.isArray(state.library) || typeof state.workout !== 'object' || state.workout === null) {
    throw new StateFormatError('State file is missing a workout or library.');
  }

  return { version: STATE_VERSION, workout: state.workout, library: state.library };
}
