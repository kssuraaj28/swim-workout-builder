import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AppState } from '../src/core/state.ts';
import { STATE_VERSION, createEmptyState, decodeState, encodeState } from '../src/core/state.ts';
import { kitchenSinkWorkout, metricWorkout } from './example-workouts.ts';
import { assertClean, assertWarned } from './support.ts';

function fullState(): AppState {
  return {
    version: STATE_VERSION,
    workout: kitchenSinkWorkout(),
    library: [metricWorkout(), kitchenSinkWorkout()],
  };
}

test('a full state survives an encode/decode round trip with no warnings', () => {
  const before = fullState();
  const r = decodeState(encodeState(before));
  assert.deepEqual(r.value, before);
  assertClean(r);
});

test('an empty state survives an encode/decode round trip with no warnings', () => {
  const before = createEmptyState();
  const r = decodeState(encodeState(before));
  assert.deepEqual(r.value, before);
  assertClean(r);
});

test('a mismatched version yields an empty state and warns', () => {
  const bytes = encodeState({ ...fullState(), version: STATE_VERSION + 1 });
  const r = decodeState(bytes);
  assertWarned(r, 'version');
  assert.deepEqual(r.value, createEmptyState());
});

test('non-CBOR bytes yield an empty state and warn', () => {
  const r = decodeState(new TextEncoder().encode('not cbor'));
  assertWarned(r, 'readable state file');
  assert.deepEqual(r.value, createEmptyState());
});

test('an empty file yields an empty state and warns', () => {
  const r = decodeState(new Uint8Array(0));
  assertWarned(r, 'empty');
  assert.deepEqual(r.value, createEmptyState());
});

test('a state file missing its library yields defaults with warnings', () => {
  const bytes = encodeState({ version: STATE_VERSION, workout: kitchenSinkWorkout() } as unknown as AppState);
  const r = decodeState(bytes);
  assert.deepEqual(r.value.library, []);
  assert.deepEqual(r.value.workout, kitchenSinkWorkout());
});

test('a state file with an unknown top-level field warns and drops it', () => {
  const bytes = encodeState({ ...fullState(), extra: 1 } as unknown as AppState);
  const r = decodeState(bytes);
  assertWarned(r, 'extra');
  assert.equal((r.value as unknown as { extra?: number }).extra, undefined);
});

test('a malformed workout inside the library surfaces its warnings', () => {
  const bad = { ...kitchenSinkWorkout(), poolLength: 'twenty' } as unknown as AppState['workout'];
  const bytes = encodeState({ ...fullState(), library: [bad] });
  const r = decodeState(bytes);
  assertWarned(r, 'poolLength');
});
