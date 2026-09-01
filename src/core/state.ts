import { decode, encode } from 'cbor-x';
import type { Workout } from './workouts.ts';
import { normalizeWorkout } from './workouts.ts';
import type { Designer } from './designers.ts';
import { normalizeDesigner } from './designers.ts';
import type { Block } from './blocks.ts';
import { normalizeBlock } from './blocks.ts';
import type { Warned } from './utils.ts';
import { NormalizeWarnings, asObject, warnUnknown, warnedArrayInto } from './utils.ts';

export const STATE_VERSION = 1;

/** Persisted state: only the saved-artifact collections. In-progress edits (current workout,
 * designer draft, block draft) live in App-level React state and are not exported. */
export interface AppState {
  version: number;
  library: Workout[];
  designers: Designer[];
  blocks: Block[];
}

export function createEmptyState(): AppState {
  return {
    version: STATE_VERSION,
    library: [],
    designers: [],
    blocks: [],
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

  const library = warnedArrayInto(obj.library, 'library', warnings, normalizeWorkout);
  const designers = warnedArrayInto(obj.designers, 'designers', warnings, normalizeDesigner);
  const blocks = warnedArrayInto(obj.blocks, 'blocks', warnings, normalizeBlock);

  return {
    value: { version: STATE_VERSION, library, designers, blocks },
    warnings,
  };
}
