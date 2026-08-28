import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AppState } from '../src/core/state.ts';
import { STATE_VERSION, createEmptyState, decodeState, encodeState } from '../src/core/state.ts';
import { kitchenSinkWorkout, metricWorkout } from './example-workouts.ts';
import { assertNormalizeError } from './support.ts';

function fullState(): AppState {
  return {
    version: STATE_VERSION,
    workout: kitchenSinkWorkout(),
    library: [metricWorkout(), kitchenSinkWorkout()],
  };
}

test('a full state survives an encode/decode round trip', () => {
  const before = fullState();
  assert.deepEqual(decodeState(encodeState(before)), before);
});

test('an empty state survives an encode/decode round trip', () => {
  const before = createEmptyState();
  assert.deepEqual(decodeState(encodeState(before)), before);
});

test('rejects a state file from a different version', () => {
  const bytes = encodeState({ ...fullState(), version: STATE_VERSION + 1 });
  assertNormalizeError(() => decodeState(bytes), 'version');
});

test('rejects bytes that are not CBOR', () => {
  assertNormalizeError(() => decodeState(new TextEncoder().encode('not cbor')), 'readable state file');
});

test('rejects an empty state file', () => {
  assertNormalizeError(() => decodeState(new Uint8Array(0)), 'empty');
});

test('rejects a state file missing its library', () => {
  const bytes = encodeState({ version: STATE_VERSION, workout: kitchenSinkWorkout() } as unknown as AppState);
  assertNormalizeError(() => decodeState(bytes), 'library');
});

test('rejects a state file with an unknown top-level field', () => {
  const bytes = encodeState({ ...fullState(), extra: 1 } as unknown as AppState);
  assertNormalizeError(() => decodeState(bytes), 'unknown field');
});

test('rejects when a workout inside the library is malformed', () => {
  const bad = { ...kitchenSinkWorkout(), poolLength: 'twenty' } as unknown as AppState['workout'];
  const bytes = encodeState({ ...fullState(), library: [bad] });
  assertNormalizeError(() => decodeState(bytes), 'poolLength');
});
