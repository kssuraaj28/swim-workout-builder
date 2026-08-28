import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSetFromCode } from '../src/core/set-from-code.ts';
import { createDefaultSet } from '../src/core/workouts.ts';
import { assertClean, assertWarned } from './support.ts';

const FULL_SET = `return {
  name: 'Main',
  iterations: 2,
  steps: [
    { repetitions: 5, strokeType: 'free', distance: 200, equipment: [],
      track: true, targetPace: '', description: '', restType: 'rest', restValue: 20 },
  ],
};`;

test('buildSetFromCode returns the authored set with no warnings when fully specified', () => {
  const r = buildSetFromCode(FULL_SET);
  assertClean(r);
  assert.equal(r.value.name, 'Main');
  assert.equal(r.value.iterations, 2);
  assert.equal(r.value.steps.length, 1);
  assert.equal(r.value.steps[0].distance, 200);
});

test('buildSetFromCode warns when the authored set omits fields', () => {
  const r = buildSetFromCode(`return { steps: [{ distance: 100 }] };`);
  assertWarned(r, 'name');
  assert.equal(r.value.steps[0].distance, 100);
});

test('buildSetFromCode warns when the code has a syntax error', () => {
  const r = buildSetFromCode(`return {{;`);
  assertWarned(r, 'Code failed to run');
  assert.deepEqual(r.value, createDefaultSet());
});

test('buildSetFromCode warns when the code throws at runtime', () => {
  const r = buildSetFromCode(`throw new Error('boom');`);
  assertWarned(r, 'boom');
  assert.deepEqual(r.value, createDefaultSet());
});

test('buildSetFromCode handles code that returns nothing', () => {
  const r = buildSetFromCode(`const x = 1;`);
  assertWarned(r, 'not an object');
});

test('buildSetFromCode handles code that returns a non-object', () => {
  const r = buildSetFromCode(`return 42;`);
  assertWarned(r, 'not an object');
});
