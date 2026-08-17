import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AppState } from '../src/core/state.ts';
import { STATE_VERSION, createEmptyState, decodeState, encodeState } from '../src/core/state.ts';
import { kitchenSinkWorkout, metricWorkout } from './example-workouts.ts';

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
  assert.throws(() => decodeState(bytes), /version/);
});

test('rejects bytes that are not CBOR', () => {
  assert.throws(() => decodeState(new TextEncoder().encode('not cbor')), /readable state file/);
});

test('rejects a state file missing its workout or library', () => {
  assert.throws(
    () => decodeState(encodeState({ version: STATE_VERSION } as unknown as AppState)),
    /missing a workout or library/,
  );
});
