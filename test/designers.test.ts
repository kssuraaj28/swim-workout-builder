import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Designer, Param } from '../src/core/designers.ts';
import { STARTER_DESIGNER, buildSetFromDesigner, createDefaultDesigner, normalizeDesigner } from '../src/core/designers.ts';
import { createDefaultSet } from '../src/core/workouts.ts';
import { assertClean, assertWarned } from './support.ts';

function richDesigner(): Designer {
  return {
    id: 'endurance-free',
    description: 'Aerobic base pull sets',
    variation: [
      { identifier: 'stroke', options: ['free', 'backstroke'] },
      { identifier: 'distance', options: ['100', '200'] },
    ],
    overload: [
      { identifier: 'reps', options: ['8', '10', '12'] },
      { identifier: 'sendOff', options: ['90', '95', '100'] },
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

test('normalizeDesigner warns when a param options entry is not a string', () => {
  const r = normalizeDesigner({
    ...richDesigner(),
    overload: [{ identifier: 'reps', options: [10] }],
  });
  assertWarned(r, 'options');
});

test('normalizeDesigner handles non-object input by returning a default designer', () => {
  const r = normalizeDesigner(null);
  assertWarned(r, 'not an object');
  assert.deepEqual(r.value, createDefaultDesigner());
});

function runnableDesigner(): Designer {
  return {
    id: 'runnable',
    description: '',
    variation: [{ identifier: 'stroke', options: ['free', 'backstroke'] }],
    overload: [{ identifier: 'reps', options: ['8', '10'] }],
    source: `return {
      name: 'D-' + variation.stroke,
      iterations: 1,
      steps: [{
        repetitions: Number(overload.reps),
        strokeType: variation.stroke,
        distance: 100,
        equipment: [],
        track: true,
        targetPace: '',
        description: '',
        restType: 'rest',
        restValue: 15,
      }],
    };`,
  };
}

test('buildSetFromDesigner returns the produced set with no warnings for valid string inputs', () => {
  const r = buildSetFromDesigner(runnableDesigner(), { stroke: 'free' }, { reps: '10' });
  assertClean(r);
  assert.equal(r.value.name, 'D-free');
  assert.equal(r.value.steps[0].repetitions, 10);
  assert.equal(r.value.steps[0].strokeType, 'free');
});

test('buildSetFromDesigner warns when the source throws at runtime', () => {
  const d: Designer = { ...runnableDesigner(), source: `throw new Error('boom');` };
  const r = buildSetFromDesigner(d, {}, {});
  assertWarned(r, 'boom');
  assert.deepEqual(r.value, createDefaultSet());
});

test('buildSetFromDesigner warns when the source has a syntax error', () => {
  const d: Designer = { ...runnableDesigner(), source: `return {{;` };
  const r = buildSetFromDesigner(d, {}, {});
  assertWarned(r, 'failed to run');
  assert.deepEqual(r.value, createDefaultSet());
});

test('buildSetFromDesigner surfaces normalize warnings from the produced set', () => {
  const d: Designer = { ...runnableDesigner(), source: `return { steps: [{ strokeType: 'butterly' }] };` };
  const r = buildSetFromDesigner(d, {}, {});
  assertWarned(r, 'strokeType');
});

test('buildSetFromDesigner warns when the source returns a non-object', () => {
  const d: Designer = { ...runnableDesigner(), source: `return 42;` };
  const r = buildSetFromDesigner(d, {}, {});
  assertWarned(r, 'not an object');
});

/** Every declared option for every param must produce a clean set — catches option values that don't
 * match the enums the source ultimately targets (e.g. StrokeType, EquipmentType). */
function assertStarterProducesCleanSets(designer: Designer): void {
  const combos = (params: Param[]): Record<string, string>[] => {
    let acc: Record<string, string>[] = [{}];
    for (const p of params) {
      const next: Record<string, string>[] = [];
      for (const values of acc) {
        for (const opt of p.options) next.push({ ...values, [p.identifier]: opt });
      }
      acc = next;
    }
    return acc;
  };

  for (const variation of combos(designer.variation)) {
    for (const overload of combos(designer.overload)) {
      const r = buildSetFromDesigner(designer, variation, overload);
      if (r.warnings.length > 0) {
        assert.fail(
          `starter "${designer.id}" produced warnings for variation=${JSON.stringify(variation)} overload=${JSON.stringify(overload)}:\n${[...r.warnings].join('\n')}`,
        );
      }
    }
  }
}

test('STARTER_DESIGNER produces a clean set for every combination of its declared options', () => {
  assertStarterProducesCleanSets(STARTER_DESIGNER);
});
