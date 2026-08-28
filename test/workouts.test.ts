import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSet, createDefaultStep, createDefaultWorkout,
  normalizeWorkout, normalizeWorkoutSet, normalizeWorkoutStep,
} from '../src/core/workouts.ts';
import { kitchenSinkWorkout } from './example-workouts.ts';
import { assertNormalizeError } from './support.ts';

test('normalizeWorkoutStep round-trips the default step', () => {
  const s = createDefaultStep();
  assert.deepEqual(normalizeWorkoutStep(s), s);
});

test('normalizeWorkoutStep rejects an unknown field', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), reps: 5 }),
    'unknown field',
  );
});

test('normalizeWorkoutStep rejects a non-integer distance', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), distance: 100.5 }),
    'distance',
  );
});

test('normalizeWorkoutStep rejects a zero repetitions', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), repetitions: 0 }),
    'repetitions',
  );
});

test('normalizeWorkoutStep rejects a bad stroke type', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), strokeType: 'butterly' }),
    'strokeType',
  );
});

test('normalizeWorkoutStep rejects a bad equipment entry', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), equipment: ['flippers'] }),
    'equipment',
  );
});

test('normalizeWorkoutStep rejects a non-boolean track', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), track: 'yes' }),
    'track',
  );
});

test('normalizeWorkoutStep rejects a non-string description', () => {
  assertNormalizeError(
    () => normalizeWorkoutStep({ ...createDefaultStep(), description: 42 }),
    'description',
  );
});

test('normalizeWorkoutStep rejects non-object input', () => {
  assertNormalizeError(() => normalizeWorkoutStep(null), 'object');
  assertNormalizeError(() => normalizeWorkoutStep([]), 'object');
  assertNormalizeError(() => normalizeWorkoutStep('a step'), 'object');
});

test('normalizeWorkoutSet round-trips the default set', () => {
  const s = createDefaultSet();
  assert.deepEqual(normalizeWorkoutSet(s), s);
});

test('normalizeWorkoutSet rejects empty steps', () => {
  assertNormalizeError(
    () => normalizeWorkoutSet({ name: '', iterations: 1, steps: [] }),
    'empty',
  );
});

test('normalizeWorkoutSet rejects steps that is not an array', () => {
  assertNormalizeError(
    () => normalizeWorkoutSet({ name: '', iterations: 1, steps: 'nope' }),
    'array',
  );
});

test('normalizeWorkoutSet propagates step errors', () => {
  const set = createDefaultSet();
  set.steps[0].strokeType = 'butterly' as never;
  assertNormalizeError(() => normalizeWorkoutSet(set), 'strokeType');
});

test('normalizeWorkout round-trips the default workout', () => {
  const w = createDefaultWorkout();
  assert.deepEqual(normalizeWorkout(w), w);
});

test('normalizeWorkout round-trips a rich fixture', () => {
  const w = kitchenSinkWorkout();
  assert.deepEqual(normalizeWorkout(w), w);
});

test('normalizeWorkout rejects a bad poolLengthUnit', () => {
  assertNormalizeError(
    () => normalizeWorkout({ ...createDefaultWorkout(), poolLengthUnit: 'furlongs' }),
    'poolLengthUnit',
  );
});

test('normalizeWorkout accepts an optional savedAt', () => {
  const w = { ...createDefaultWorkout(), savedAt: '2026-01-01T00:00:00Z' };
  assert.deepEqual(normalizeWorkout(w), w);
});

test('normalizeWorkout rejects a non-string savedAt', () => {
  assertNormalizeError(
    () => normalizeWorkout({ ...createDefaultWorkout(), savedAt: 42 }),
    'savedAt',
  );
});

test('normalizeWorkout propagates a set error', () => {
  const w = kitchenSinkWorkout();
  (w.sets[0] as { name: unknown }).name = 42;
  assertNormalizeError(() => normalizeWorkout(w), 'name');
});
