import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Block } from '../src/core/blocks.ts';
import { buildWorkoutFromDay, createDefaultBlock, emptySchedule, enumerateDayDesigners, normalizeBlock } from '../src/core/blocks.ts';
import type { Designer } from '../src/core/designers.ts';
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

function sampleDesigner(id: string): Designer {
  return {
    id,
    description: '',
    variation: [{ identifier: 'stroke', options: ['free'] }],
    overload: [{ identifier: 'reps', options: ['8', '10'] }],
    source: `return {
      name: '${id}', iterations: 1, steps: [{
        repetitions: Number(overload.reps), strokeType: variation.stroke, distance: 100,
        equipment: [], track: true, targetPace: '', description: '', restType: 'rest', restValue: 15,
      }],
    };`,
  };
}

function scheduledBlock(): Block {
  return {
    id: 'test-block',
    description: '',
    ingredients: [
      { kind: 'swim', description: '', designers: [{ designerId: 'a', variation: { stroke: 'free' } }] },
      { kind: 'other', text: 'gym' },
      { kind: 'swim', description: '', designers: [
        { designerId: 'b', variation: { stroke: 'free' } },
        { designerId: 'a', variation: { stroke: 'free' } },
      ] },
    ],
    schedule: { ...emptySchedule(), monday: [0, 2], tuesday: [1, null] },
  };
}

test('enumerateDayDesigners returns swim designers in slot order, skipping non-swim slots', () => {
  const block = scheduledBlock();
  const designers = [sampleDesigner('a'), sampleDesigner('b')];
  const result = enumerateDayDesigners(block, 'monday', designers);
  assert.equal(result.length, 3);
  assert.deepEqual(result.map(d => d.designerId), ['a', 'b', 'a']);
});

test('enumerateDayDesigners silently skips other ingredients', () => {
  const block = scheduledBlock();
  const designers = [sampleDesigner('a'), sampleDesigner('b')];
  const result = enumerateDayDesigners(block, 'tuesday', designers);
  assert.equal(result.length, 0);
});

test('enumerateDayDesigners silently skips designer refs that no longer exist', () => {
  const block = scheduledBlock();
  const designers = [sampleDesigner('a')];  // 'b' is missing
  const result = enumerateDayDesigners(block, 'monday', designers);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(d => d.designerId), ['a', 'a']);
});

test('buildWorkoutFromDay produces a workout with warmup, designer sets, and cooldown', () => {
  const block = scheduledBlock();
  const designers = [sampleDesigner('a'), sampleDesigner('b')];
  const r = buildWorkoutFromDay(block, 'monday', designers, [{ reps: '10' }, { reps: '8' }, { reps: '10' }]);
  assert.equal(r.value.sets.length, 5);  // warmup + 3 designer sets + cooldown
  assert.equal(r.value.sets[0].name, 'Warmup');
  assert.equal(r.value.sets[4].name, 'Cooldown');
});

test('buildWorkoutFromDay warns about missing designers and skips them', () => {
  const block = scheduledBlock();
  const designers = [sampleDesigner('a')];  // 'b' is missing
  const r = buildWorkoutFromDay(block, 'monday', designers, [{ reps: '10' }, { reps: '10' }]);
  assertWarned(r, 'b');
  assert.equal(r.value.sets.length, 4);  // warmup + 2 sets (a, a — skipped b) + cooldown
});

test('buildWorkoutFromDay stamps block id, day, and overloads into the description', () => {
  const block = scheduledBlock();
  const designers = [sampleDesigner('a'), sampleDesigner('b')];
  const r = buildWorkoutFromDay(block, 'monday', designers, [{ reps: '10' }, { reps: '8' }, { reps: '12' }]);
  assert.match(r.value.description, /Block: test-block/);
  assert.match(r.value.description, /Day: Monday/);
  assert.match(r.value.description, /a: reps=10/);
  assert.match(r.value.description, /b: reps=8/);
});
