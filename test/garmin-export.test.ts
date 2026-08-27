import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { Workout } from '../src/core/workouts.ts';
import { exportToGarmin, STEP_ID_BASE } from '../src/core/garmin-export.ts';
import { kitchenSinkWorkout, metricWorkout } from './example-workouts.ts';

// Satisfy linter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dto = Record<string, any>;

function exportOf(workout: Workout): Dto {
  return exportToGarmin(workout) as Dto;
}

function topLevelSteps(result: Dto): Dto[] {
  return result.workoutSegments[0].workoutSteps as Dto[];
}

/** Every DTO in the tree, parents before children, in stepOrder-assignment order. */
function allDtos(steps: Dto[]): Dto[] {
  const out: Dto[] = [];
  for (const step of steps) {
    out.push(step);
    if (Array.isArray(step.workoutSteps)) out.push(...allDtos(step.workoutSteps));
  }
  return out;
}

function executableSteps(result: Dto): Dto[] {
  return allDtos(topLevelSteps(result)).filter(d => d.type === 'ExecutableStepDTO');
}

function restSteps(result: Dto): Dto[] {
  return executableSteps(result).filter(d => d.stepType.stepTypeKey === 'rest');
}

function intervalSteps(result: Dto): Dto[] {
  return executableSteps(result).filter(d => d.stepType.stepTypeKey === 'interval');
}

function lapButtonRests(result: Dto): Dto[] {
  return restSteps(result).filter(d => d.endCondition.conditionTypeKey === 'lap.button');
}

function emptyWorkout(): Workout {
  return { ...metricWorkout(), sets: [] };
}

// --- snapshots ---------------------------------------------------------------

test('kitchen-sink workout exports unchanged', (t: TestContext) => {
  t.assert.snapshot(exportOf(kitchenSinkWorkout()));
});

test('metric workout exports unchanged', (t: TestContext) => {
  t.assert.snapshot(exportOf(metricWorkout()));
});

// --- top-level payload -------------------------------------------------------

test('copies workout name and description', () => {
  const result = exportOf(kitchenSinkWorkout());
  assert.equal(result.workoutName, 'Kitchen Sink');
  assert.equal(result.description, 'Exercises every branch of the Garmin exporter.');
});

test('sport type is swimming', () => {
  const result = exportOf(kitchenSinkWorkout());
  assert.deepEqual(result.sportType, { sportTypeId: 4, sportTypeKey: 'swimming', displayOrder: 3 });
  assert.deepEqual(result.workoutSegments[0].sportType, result.sportType);
});

test('pool length and unit map to Garmin ids', () => {
  const yards = exportOf(kitchenSinkWorkout());
  assert.equal(yards.poolLength, 25);
  assert.equal(yards.poolLengthUnit.unitId, 230);
  assert.equal(yards.poolLengthUnit.unitKey, 'yard');

  const meters = exportOf(metricWorkout());
  assert.equal(meters.poolLength, 50);
  assert.equal(meters.poolLengthUnit.unitId, 229);
  assert.equal(meters.poolLengthUnit.unitKey, 'meter');
});

test('emits exactly one segment', () => {
  const result = exportOf(kitchenSinkWorkout());
  assert.equal(result.workoutSegments.length, 1);
  assert.equal(result.workoutSegments[0].segmentOrder, 1);
});

test('estimated distance applies the pool unit factor', () => {
  // 3 * (4*100 + 200) + 1 * (2*50 + 100) = 2000 yards
  assert.equal(exportOf(kitchenSinkWorkout()).estimatedDistanceInMeters, 2000 * 0.9144);
  // 2 * 200 = 400 metres, factor 1
  assert.equal(exportOf(metricWorkout()).estimatedDistanceInMeters, 400);
});

test('carries the constant top-level fields', () => {
  const result = exportOf(kitchenSinkWorkout());
  assert.equal(result.avgTrainingSpeed, 0);
  assert.equal(result.shared, false);
  assert.deepEqual(result.estimatedDistanceUnit, {});
});

// --- set structure -----------------------------------------------------------

test('emits one repeat group per set, in order', () => {
  const groups = topLevelSteps(exportOf(kitchenSinkWorkout()))
    .filter(d => d.type === 'RepeatGroupDTO');
  assert.equal(groups.length, 2);
  assert.equal(groups[0].numberOfIterations, 3);
  assert.equal(groups[1].numberOfIterations, 1);
});

test('set repeat group iterations appear in both fields', () => {
  const group = topLevelSteps(exportOf(kitchenSinkWorkout()))[0];
  assert.equal(group.numberOfIterations, 3);
  assert.equal(group.endConditionValue, 3);
});

test('set repeat groups end on iterations and skip the last rest', () => {
  for (const group of topLevelSteps(exportOf(kitchenSinkWorkout()))) {
    if (group.type !== 'RepeatGroupDTO') continue;
    assert.deepEqual(group.endCondition, {
      conditionTypeId: 7, conditionTypeKey: 'iterations', displayOrder: 7, displayable: false,
    });
    assert.equal(group.skipLastRestStep, true);
    assert.equal(group.smartRepeat, false);
  }
});

test('a lap-button rest follows every set', () => {
  const top = topLevelSteps(exportOf(kitchenSinkWorkout()));
  // 2 sets -> group, rest, group, rest
  assert.equal(top.length, 4);
  assert.equal(top[0].type, 'RepeatGroupDTO');
  assert.equal(top[1].stepType.stepTypeKey, 'rest');
  assert.equal(top[2].type, 'RepeatGroupDTO');
  assert.equal(top[3].stepType.stepTypeKey, 'rest');
});

test('a lap-button rest follows every step within a set', () => {
  const firstSet = topLevelSteps(exportOf(kitchenSinkWorkout()))[0];
  const inner = firstSet.workoutSteps as Dto[];
  // 2 steps -> stepThing, rest, stepThing, rest
  assert.equal(inner.length, 4);
  assert.equal(inner[1].endCondition.conditionTypeKey, 'lap.button');
  assert.equal(inner[3].endCondition.conditionTypeKey, 'lap.button');
});

// --- step structure ----------------------------------------------------------

test('a step with repetitions > 1 becomes a nested repeat group', () => {
  const firstSet = topLevelSteps(exportOf(kitchenSinkWorkout()))[0];
  const nested = (firstSet.workoutSteps as Dto[])[0];
  assert.equal(nested.type, 'RepeatGroupDTO');
  assert.equal(nested.numberOfIterations, 4);
  assert.equal(nested.endConditionValue, 4);
});

test('a step with repetitions === 1 stays a bare executable step', () => {
  const firstSet = topLevelSteps(exportOf(kitchenSinkWorkout()))[0];
  const single = (firstSet.workoutSteps as Dto[])[2];
  assert.equal(single.type, 'ExecutableStepDTO');
  assert.equal(single.endConditionValue, 200);
});

test('nested repeat group includes a within-rest when the step rests', () => {
  const firstSet = topLevelSteps(exportOf(kitchenSinkWorkout()))[0];
  const nested = (firstSet.workoutSteps as Dto[])[0];
  const inner = nested.workoutSteps as Dto[];
  assert.equal(inner.length, 2);
  assert.equal(inner[1].stepType.stepTypeKey, 'rest');
  assert.equal(inner[1].endCondition.conditionTypeKey, 'fixed.rest');
});

test('nested repeat group omits the within-rest when restValue is 0', () => {
  const workout = kitchenSinkWorkout();
  workout.sets[1].steps[0].restType = 'rest';
  workout.sets[1].steps[0].restValue = 0;
  // Top level is [group, rest, group, rest] — the second set's group is at index 2.
  const drillSet = topLevelSteps(exportOf(workout))[2];
  const nested = (drillSet.workoutSteps as Dto[])[0];
  assert.equal((nested.workoutSteps as Dto[]).length, 1);
});

test('swim steps end on distance', () => {
  for (const step of intervalSteps(exportOf(kitchenSinkWorkout()))) {
    assert.deepEqual(step.endCondition, {
      conditionTypeId: 3, conditionTypeKey: 'distance', displayOrder: 3, displayable: true,
    });
  }
  const distances = intervalSteps(exportOf(kitchenSinkWorkout())).map(s => s.endConditionValue);
  assert.deepEqual(distances, [100, 200, 50, 100]);
});

// --- Garmin workarounds (see TODO.txt) ---------------------------------------

test('every lap.button rest carries endConditionValue 0', () => {
  // Garmin sums this into the reported total on upload; the canonical 200 inflates it.
  const rests = lapButtonRests(exportOf(kitchenSinkWorkout()));
  assert.ok(rests.length > 0);
  for (const rest of rests) assert.equal(rest.endConditionValue, 0);
});

test('untracked steps export as a drill', () => {
  const drill = intervalSteps(exportOf(kitchenSinkWorkout()))
    .find(s => s.endConditionValue === 50)!;
  assert.equal(drill.strokeType.strokeTypeId, 4);
  assert.equal(drill.strokeType.strokeTypeKey, 'drill');
  assert.equal(drill.drillType.drillTypeId, 3);
  assert.equal(drill.drillType.drillTypeKey, 'drill');
});

test('tracked steps keep their real stroke and no drill type', () => {
  const free = intervalSteps(exportOf(kitchenSinkWorkout()))
    .find(s => s.endConditionValue === 100 && s.strokeType.strokeTypeKey === 'free')!;
  assert.equal(free.strokeType.strokeTypeId, 6);
  assert.deepEqual(free.drillType, { drillTypeId: 0, drillTypeKey: null, displayOrder: 0 });
});

test('equipmentType is always none', () => {
  // Garmin allows one equipment per step; ours allows several, so it goes in the description.
  for (const step of executableSteps(exportOf(kitchenSinkWorkout()))) {
    assert.deepEqual(step.equipmentType, { equipmentTypeId: 0, displayOrder: 0 });
  }
});

test('equipment is encoded into the description', () => {
  const step = intervalSteps(exportOf(kitchenSinkWorkout()))
    .find(s => s.endConditionValue === 100 && s.strokeType.strokeTypeKey === 'free')!;
  assert.match(step.description, /^FIN \| PDL/);
});

test('target type is always no.target', () => {
  for (const step of executableSteps(exportOf(kitchenSinkWorkout()))) {
    assert.deepEqual(step.targetType, {
      workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target', displayOrder: 1,
    });
  }
});

// --- description assembly ----------------------------------------------------

test('joins equipment, pace and notes with a double dash', () => {
  const step = intervalSteps(exportOf(kitchenSinkWorkout()))
    .find(s => s.strokeType.strokeTypeKey === 'free')!;
  assert.equal(step.description, 'FIN | PDL -- 1:30 -- focus on catch');
});

test('skips absent description parts', () => {
  const drill = intervalSteps(exportOf(kitchenSinkWorkout()))
    .find(s => s.endConditionValue === 50)!;
  assert.equal(drill.description, 'SNK -- catch-up');
});

test('omits the description key entirely when there is nothing to say', () => {
  const bare = intervalSteps(exportOf(kitchenSinkWorkout()))
    .find(s => s.strokeType.strokeTypeKey === 'backstroke')!;
  assert.ok(!('description' in bare));
  assert.ok(!('notes' in bare));
});

test('notes mirrors description', () => {
  for (const step of intervalSteps(exportOf(kitchenSinkWorkout()))) {
    if ('description' in step) assert.equal(step.notes, step.description);
  }
});

test('equipment "none" contributes nothing', () => {
  const workout = kitchenSinkWorkout();
  workout.sets[0].steps[0].equipment = ['none'];
  workout.sets[0].steps[0].targetPace = '';
  workout.sets[0].steps[0].description = '';
  const step = intervalSteps(exportOf(workout)).find(s => s.endConditionValue === 100)!;
  assert.ok(!('description' in step));
});

// --- rest types --------------------------------------------------------------

test('rest types map to their Garmin end conditions', () => {
  const conditionFor = (restType: 'rest' | 'interval' | 'lap_button') => {
    const w = kitchenSinkWorkout();
    w.sets[0].steps[0].restType = restType;
    w.sets[0].steps[0].restValue = 20;
    const nested = (topLevelSteps(exportOf(w))[0].workoutSteps as Dto[])[0];
    return (nested.workoutSteps as Dto[])[1].endCondition.conditionTypeKey;
  };
  assert.equal(conditionFor('rest'), 'fixed.rest');
  assert.equal(conditionFor('interval'), 'fixed.repetition');
  assert.equal(conditionFor('lap_button'), 'lap.button');
});

test('within-step rest carries restValue, except lap_button which is 0', () => {
  const valueFor = (restType: 'rest' | 'interval' | 'lap_button') => {
    const w = kitchenSinkWorkout();
    w.sets[0].steps[0].restType = restType;
    w.sets[0].steps[0].restValue = 45;
    const nested = (topLevelSteps(exportOf(w))[0].workoutSteps as Dto[])[0];
    return (nested.workoutSteps as Dto[])[1].endConditionValue;
  };
  assert.equal(valueFor('rest'), 45);
  assert.equal(valueFor('interval'), 45);
  assert.equal(valueFor('lap_button'), 0);
});

// --- ordering and ids --------------------------------------------------------

test('stepOrder values are unique and start at 1', () => {
  const orders = allDtos(topLevelSteps(exportOf(kitchenSinkWorkout()))).map(d => d.stepOrder);
  assert.equal(new Set(orders).size, orders.length);
  assert.equal(Math.min(...orders), 1);
  assert.equal(Math.max(...orders), orders.length);
});

test('stepIds start at the base and increment by one', () => {
  const ids = allDtos(topLevelSteps(exportOf(kitchenSinkWorkout())))
    .map(d => d.stepId)
    .sort((a, b) => a - b);
  assert.equal(ids[0], STEP_ID_BASE);
  ids.forEach((id, i) => assert.equal(id, STEP_ID_BASE + i));
});

test('two consecutive exports are identical', () => {
  // The stepId counter is module-level state; it must reset on every call.
  assert.deepEqual(exportOf(kitchenSinkWorkout()), exportOf(kitchenSinkWorkout()));
});

// --- edge cases --------------------------------------------------------------

test('a workout with no sets produces no steps', () => {
  const result = exportOf(emptyWorkout());
  assert.deepEqual(topLevelSteps(result), []);
  assert.equal(result.estimatedDistanceInMeters, 0);
});
