import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSet, createDefaultStep, createDefaultWorkout,
  normalizeWorkout, normalizeWorkoutSet, normalizeWorkoutStep,
} from '../src/core/workouts.ts';
import { kitchenSinkWorkout } from './example-workouts.ts';
import { assertClean, assertWarned } from './support.ts';

test('normalizeWorkoutStep round-trips the default step with no warnings', () => {
  const s = createDefaultStep();
  const r = normalizeWorkoutStep(s);
  assert.deepEqual(r.value, s);
  assertClean(r);
});

test('normalizeWorkoutStep warns about unknown fields and drops them', () => {
  const r = normalizeWorkoutStep({ ...createDefaultStep(), reps: 5 });
  assertWarned(r, 'reps');
  assert.equal((r.value as unknown as { reps?: number }).reps, undefined);
});

test('normalizeWorkoutStep replaces a non-integer distance with the default', () => {
  const r = normalizeWorkoutStep({ ...createDefaultStep(), distance: 100.5 });
  assertWarned(r, 'distance');
  assert.equal(r.value.distance, createDefaultStep().distance);
});

test('normalizeWorkoutStep replaces a bad stroke type with the default', () => {
  const r = normalizeWorkoutStep({ ...createDefaultStep(), strokeType: 'butterly' });
  assertWarned(r, 'strokeType');
  assert.equal(r.value.strokeType, createDefaultStep().strokeType);
});

test('normalizeWorkoutStep replaces bad equipment entries with none', () => {
  const r = normalizeWorkoutStep({ ...createDefaultStep(), equipment: ['flippers'] });
  assertWarned(r, 'equipment');
  assert.deepEqual(r.value.equipment, ['none']);
});

test('normalizeWorkoutStep replaces a non-boolean track with the default', () => {
  const r = normalizeWorkoutStep({ ...createDefaultStep(), track: 'yes' });
  assertWarned(r, 'track');
  assert.equal(r.value.track, createDefaultStep().track);
});

test('normalizeWorkoutStep accepts non-object input and returns a default step', () => {
  const r = normalizeWorkoutStep(null);
  assertWarned(r, 'not an object');
  assert.deepEqual(r.value, createDefaultStep());
});

test('normalizeWorkoutSet round-trips the default set with no warnings', () => {
  const s = createDefaultSet();
  const r = normalizeWorkoutSet(s);
  assert.deepEqual(r.value, s);
  assertClean(r);
});

test('normalizeWorkoutSet accepts empty steps without warning', () => {
  const r = normalizeWorkoutSet({ name: '', iterations: 1, steps: [] });
  assertClean(r);
  assert.deepEqual(r.value.steps, []);
});

test('normalizeWorkoutSet warns when steps is not an array and returns empty', () => {
  const r = normalizeWorkoutSet({ name: '', iterations: 1, steps: 'nope' });
  assertWarned(r, 'steps');
  assert.deepEqual(r.value.steps, []);
});

test('normalizeWorkoutSet surfaces step-level warnings', () => {
  const set = createDefaultSet();
  set.steps[0].strokeType = 'butterly' as never;
  const r = normalizeWorkoutSet(set);
  assertWarned(r, 'strokeType');
  assert.equal(r.value.steps[0].strokeType, createDefaultStep().strokeType);
});

test('normalizeWorkout round-trips the default workout with no warnings', () => {
  const w = createDefaultWorkout();
  const r = normalizeWorkout(w);
  assert.deepEqual(r.value, w);
  assertClean(r);
});

test('normalizeWorkout round-trips a rich fixture with no warnings', () => {
  const w = kitchenSinkWorkout();
  const r = normalizeWorkout(w);
  assert.deepEqual(r.value, w);
  assertClean(r);
});

test('normalizeWorkout replaces a bad poolLengthUnit with the default', () => {
  const r = normalizeWorkout({ ...createDefaultWorkout(), poolLengthUnit: 'furlongs' });
  assertWarned(r, 'poolLengthUnit');
  assert.equal(r.value.poolLengthUnit, createDefaultWorkout().poolLengthUnit);
});

test('normalizeWorkout accepts an optional savedAt cleanly', () => {
  const w = { ...createDefaultWorkout(), savedAt: '2026-01-01T00:00:00Z' };
  const r = normalizeWorkout(w);
  assert.deepEqual(r.value, w);
  assertClean(r);
});

test('normalizeWorkout warns and replaces a non-string savedAt with an empty string', () => {
  const r = normalizeWorkout({ ...createDefaultWorkout(), savedAt: 42 });
  assertWarned(r, 'savedAt');
  assert.equal(r.value.savedAt, '');
});

test('normalizeWorkout surfaces set-level warnings', () => {
  const w = kitchenSinkWorkout();
  (w.sets[0] as { name: unknown }).name = 42;
  const r = normalizeWorkout(w);
  assertWarned(r, 'name');
});
