import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Designer } from '../src/core/designers.ts';
import { createDefaultDesigner, normalizeDesigner } from '../src/core/designers.ts';
import { assertClean, assertWarned } from './support.ts';

function richDesigner(): Designer {
  return {
    id: 'endurance-free',
    description: 'Aerobic base pull sets',
    variation: [
      { identifier: 'stroke', kind: 'string' },
      { identifier: 'distance', kind: 'number' },
    ],
    overload: [
      { identifier: 'reps', kind: 'number' },
      { identifier: 'sendOff', kind: 'number' },
    ],
    source: 'return { name: "x", iterations: 1, steps: [] };',
  };
}

test('normalizeDesigner round-trips the default designer with no warnings', () => {
  const d = createDefaultDesigner();
  const r = normalizeDesigner(d);
  assert.deepEqual(r.value, d);
  assertClean(r);
});

test('normalizeDesigner round-trips a rich designer with no warnings', () => {
  const d = richDesigner();
  const r = normalizeDesigner(d);
  assert.deepEqual(r.value, d);
  assertClean(r);
});

test('normalizeDesigner warns about unknown fields', () => {
  const r = normalizeDesigner({ ...richDesigner(), extra: 1 });
  assertWarned(r, 'extra');
});

test('normalizeDesigner defaults a missing id to empty string and warns', () => {
  const { id: _drop, ...rest } = richDesigner();
  void _drop;
  const r = normalizeDesigner(rest);
  assertWarned(r, 'id');
  assert.equal(r.value.id, '');
});

test('normalizeDesigner defaults a missing variation array to []', () => {
  const { variation: _drop, ...rest } = richDesigner();
  void _drop;
  const r = normalizeDesigner(rest);
  assert.deepEqual(r.value.variation, []);
});

test('normalizeDesigner warns when variation is not an array', () => {
  const r = normalizeDesigner({ ...richDesigner(), variation: 'nope' });
  assertWarned(r, 'variation');
  assert.deepEqual(r.value.variation, []);
});

test('normalizeDesigner warns on a bad param kind', () => {
  const r = normalizeDesigner({
    ...richDesigner(),
    overload: [{ identifier: 'reps', kind: 'complex' }],
  });
  assertWarned(r, 'kind');
  assert.equal(r.value.overload[0].kind, 'number');
});

test('normalizeDesigner handles non-object input by returning a default designer', () => {
  const r = normalizeDesigner(null);
  assertWarned(r, 'not an object');
  assert.deepEqual(r.value, createDefaultDesigner());
});
