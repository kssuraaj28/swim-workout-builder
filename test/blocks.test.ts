import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Block } from '../src/core/blocks.ts';
import { createDefaultBlock, emptySchedule, normalizeBlock } from '../src/core/blocks.ts';
import { assertClean, assertWarned } from './support.ts';

function richBlock(): Block {
  return {
    id: 'base',
    description: 'Base block',
    ingredients: [
      { kind: 'swim', description: 'Endurance', designers: [{ designerId: 'endurance', variation: { stroke: 'free' } }] },
      { kind: 'other', text: 'Gym' },
    ],
    schedule: { ...emptySchedule(), monday: [0, 1], friday: [0, null] },
  };
}

test('normalizeBlock round-trips the default block with no warnings', () => {
  const b = createDefaultBlock();
  const r = normalizeBlock(b);
  assert.deepEqual(r.value, b);
  assertClean(r);
});

test('normalizeBlock round-trips a rich block with no warnings', () => {
  const b = richBlock();
  const r = normalizeBlock(b);
  assert.deepEqual(r.value, b);
  assertClean(r);
});

test('normalizeBlock warns about unknown top-level fields', () => {
  const r = normalizeBlock({ ...richBlock(), extra: 1 });
  assertWarned(r, 'extra');
});

test('normalizeBlock defaults a missing id to empty string and warns', () => {
  const { id: _drop, ...rest } = richBlock();
  void _drop;
  const r = normalizeBlock(rest);
  assertWarned(r, 'id');
  assert.equal(r.value.id, '');
});

test('normalizeBlock defaults a missing ingredients array to []', () => {
  const { ingredients: _drop, ...rest } = richBlock();
  void _drop;
  const r = normalizeBlock(rest);
  assert.deepEqual(r.value.ingredients, []);
});

test('normalizeBlock warns on a bad ingredient kind and defaults it to swim', () => {
  const bad = { ...richBlock(), ingredients: [{ kind: 'weightlifting' }] };
  const r = normalizeBlock(bad);
  assertWarned(r, 'kind');
  assert.equal(r.value.ingredients[0].kind, 'swim');
});

test('normalizeBlock warns when schedule is not an object', () => {
  const r = normalizeBlock({ ...richBlock(), schedule: 'nope' });
  assertWarned(r, 'schedule');
});

test('normalizeBlock warns when a schedule day is not a 2-element array', () => {
  const r = normalizeBlock({ ...richBlock(), schedule: { ...emptySchedule(), monday: [0] } });
  assertWarned(r, 'monday');
});

test('normalizeBlock warns when a schedule slot is neither null nor a non-negative int', () => {
  const r = normalizeBlock({ ...richBlock(), schedule: { ...emptySchedule(), monday: ['x', null] } });
  assertWarned(r, 'monday[0]');
});

test('normalizeBlock handles non-object input by returning a default block', () => {
  const r = normalizeBlock(null);
  assertWarned(r, 'not an object');
  assert.deepEqual(r.value, createDefaultBlock());
});
