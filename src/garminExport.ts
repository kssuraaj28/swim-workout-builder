import type {
  EquipmentType,
  Workout,
  WorkoutStep,
} from './types';
import {
  STROKE_TYPE_MAP,
  DRILL_STROKE,
  DRILL_SUBTYPE,
  POOL_UNIT_MAP,
} from './types';
import { calcTotalDistance } from './utils';

const EQUIPMENT_CODE: Record<EquipmentType, string | null> = {
  none: null,
  fins: 'FIN',
  kickboard: 'KCK',
  paddles: 'PDL',
  pull_buoy: 'BUO',
  snorkel: 'SNK',
};

// We don't use Garmin's per-step equipmentType field — Garmin only allows one equipment per step,
// and our steps can have several. Equipment is encoded into the step description instead (see
// EQUIPMENT_CODE and buildExecutableStep), so equipmentType on every step is left as "none".
const NO_EQUIPMENT = { equipmentTypeId: 0, displayOrder: 0 };
const NO_STROKE = { strokeTypeId: 0, displayOrder: 0 };
const NO_DRILL = { drillTypeId: 0, drillTypeKey: null, displayOrder: 0 };
const NO_TARGET = { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target', displayOrder: 1 };
const REST_STEP_TYPE = { stepTypeId: 5, stepTypeKey: 'rest', displayOrder: 5 };
const INTERVAL_STEP_TYPE = { stepTypeId: 3, stepTypeKey: 'interval', displayOrder: 3 };

const STEP_ID_BASE = 12834535360;
let stepIdCounter = 0;

function nextStepId(): number {
  return STEP_ID_BASE + stepIdCounter++;
}

function buildLapButtonRestStep() {
  return {
    type: 'ExecutableStepDTO',
    stepId: nextStepId(),
    stepOrder: 0, // will be reassigned
    stepType: REST_STEP_TYPE,
    description: 'Rest until lap press',
    endCondition: { conditionTypeId: 1, conditionTypeKey: 'lap.button', displayOrder: 1, displayable: true },
    // Garmin upload bug: Garmin Connect UI uses endConditionValue: 200 for
    // lap.button rests (canonical value, confirmed by inspecting a UI-created workout) 
    // The value is otherwise meaningless, and actually actively confusing.
    //
    // Moreover, when uploading the json, this value gets added to total distance.
    // We set it to 0.
    endConditionValue: 0,
    strokeType: NO_STROKE,
    equipmentType: NO_EQUIPMENT,
    targetType: NO_TARGET,
  };
}

function buildStepRest(step: WorkoutStep, childStepId: number) {
  const endConditionMap = {
    rest: { conditionTypeId: 8, conditionTypeKey: 'fixed.rest', displayOrder: 8, displayable: true },
    interval: { conditionTypeId: 9, conditionTypeKey: 'fixed.repetition', displayOrder: 9, displayable: true },
    lap_button: { conditionTypeId: 1, conditionTypeKey: 'lap.button', displayOrder: 1, displayable: true },
  };

  return {
    type: 'ExecutableStepDTO',
    stepId: nextStepId(),
    stepOrder: 0,
    stepType: REST_STEP_TYPE,
    childStepId: childStepId,
    endCondition: endConditionMap[step.restType],
    // For lap_button rests, send 0 (not step.restValue) — see buildLapButtonRestStep for why.
    endConditionValue: step.restType === 'lap_button' ? 0 : step.restValue,
    strokeType: NO_STROKE,
    equipmentType: NO_EQUIPMENT,
    targetType: NO_TARGET,
  };
}

function buildExecutableStep(step: WorkoutStep, childStepId: number, poolUnit: string) {
  const stroke = step.track ? STROKE_TYPE_MAP[step.strokeType] : DRILL_STROKE;
  const equipCodes = step.equipment.map(e => EQUIPMENT_CODE[e]).filter(Boolean);
  const equipTag = equipCodes.join(' | ');
  const description = [equipTag, step.targetPace, step.description].filter(Boolean).join(' -- ');

  return {
    type: 'ExecutableStepDTO',
    stepId: nextStepId(),
    stepOrder: 0,
    stepType: INTERVAL_STEP_TYPE,
    childStepId: childStepId,
    ...(description && { description, notes: description }),
    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance', displayOrder: 3, displayable: true },
    endConditionValue: step.distance,
    preferredEndConditionUnit: POOL_UNIT_MAP[poolUnit],
    strokeType: { strokeTypeId: stroke.id, strokeTypeKey: stroke.key, displayOrder: stroke.displayOrder },
    equipmentType: NO_EQUIPMENT,
    drillType: step.track
      ? NO_DRILL
      : { drillTypeId: DRILL_SUBTYPE.id, drillTypeKey: DRILL_SUBTYPE.key, displayOrder: DRILL_SUBTYPE.displayOrder },
    targetType: NO_TARGET,
  };
}

export function exportToGarmin(workout: Workout): object {
  stepIdCounter = 0;
  const poolUnit = POOL_UNIT_MAP[workout.poolLengthUnit];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutSteps: any[] = [];
  let stepOrder = 1;
  let childStepIdCounter = 1;

  for (const set of workout.sets) {
    const childStepId = childStepIdCounter++;

    // Build inner steps for the repeat group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const innerSteps: any[] = [];
    for (let stepIdx = 0; stepIdx < set.steps.length; stepIdx++) {
      const step = set.steps[stepIdx];
      const isLastStepInSet = stepIdx === set.steps.length - 1;
      const needsWithinRest = step.restType === 'lap_button' || step.restValue > 0;

      if (step.repetitions > 1) {
        // Wrap in a nested repeat group — step's own rest applies between its internal repetitions
        const nestedChildId = childStepIdCounter++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nestedSteps: any[] = [];
        const exec = buildExecutableStep(step, nestedChildId, workout.poolLengthUnit);
        exec.stepOrder = stepOrder++;
        nestedSteps.push(exec);
        if (needsWithinRest) {
          const rest = buildStepRest(step, nestedChildId);
          rest.stepOrder = stepOrder++;
          nestedSteps.push(rest);
        }
        innerSteps.push({
          type: 'RepeatGroupDTO',
          stepId: nextStepId(),
          stepOrder: stepOrder++,
          stepType: { stepTypeId: 6, stepTypeKey: 'repeat', displayOrder: 6 },
          childStepId: nestedChildId,
          numberOfIterations: step.repetitions,
          workoutSteps: nestedSteps,
          endConditionValue: step.repetitions,
          endCondition: { conditionTypeId: 7, conditionTypeKey: 'iterations', displayOrder: 7, displayable: false },
          skipLastRestStep: true,
          smartRepeat: false,
        });
      } else {
        const execStep = buildExecutableStep(step, childStepId, workout.poolLengthUnit);
        execStep.stepOrder = stepOrder++;
        innerSteps.push(execStep);
      }

      // Lap-button rest between steps within the set — skip after the last step
      if (!isLastStepInSet) {
        const betweenRest = buildLapButtonRestStep();
        betweenRest.stepOrder = stepOrder++;
        innerSteps.push(betweenRest);
      }
    }

    const repeatGroup = {
      type: 'RepeatGroupDTO',
      stepId: nextStepId(),
      stepOrder: stepOrder++,
      stepType: { stepTypeId: 6, stepTypeKey: 'repeat', displayOrder: 6 },
      childStepId: childStepId,
      numberOfIterations: set.iterations,
      workoutSteps: innerSteps,
      endConditionValue: set.iterations,
      endCondition: { conditionTypeId: 7, conditionTypeKey: 'iterations', displayOrder: 7, displayable: false },
      skipLastRestStep: false,
      smartRepeat: false,
    };

    workoutSteps.push(repeatGroup);

    // Lap-button rest after every set
    const setRest = buildLapButtonRestStep();
    setRest.stepOrder = stepOrder++;
    workoutSteps.push(setRest);
  }

  return {
    workoutName: workout.name,
    description: workout.description,
    sportType: { sportTypeId: 4, sportTypeKey: 'swimming', displayOrder: 3 },
    workoutSegments: [{
      segmentOrder: 1,
      sportType: { sportTypeId: 4, sportTypeKey: 'swimming', displayOrder: 3 },
      workoutSteps,
    }],
    poolLength: workout.poolLength,
    poolLengthUnit: poolUnit,
    avgTrainingSpeed: 0,
    // Garmin quirk: despite the name, this field expects the raw distance in pool units, not meters.
    estimatedDistanceInMeters: calcTotalDistance(workout),
    estimatedDistanceUnit: {},
    shared: false,
  };
}
