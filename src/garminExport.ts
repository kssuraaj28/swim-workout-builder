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

const NO_EQUIPMENT = { equipmentTypeId: 0, displayOrder: 0 };

const STEP_ID_BASE = 12834535360;
let stepIdCounter = 0;

function nextStepId(): number {
  return STEP_ID_BASE + stepIdCounter++;
}

function buildStepType() {
  return { stepTypeId: 7, stepTypeKey: 'other', displayOrder: 7 };
}

const NO_DRILL = { drillTypeId: 0, drillTypeKey: null, displayOrder: 0 };

function buildRestStep(seconds: number, childStepId: number | undefined) {
  return {
    type: 'ExecutableStepDTO',
    stepId: nextStepId(),
    stepOrder: 0, // will be reassigned
    stepType: { stepTypeId: 5, stepTypeKey: 'rest', displayOrder: 5 },
    ...(childStepId !== undefined && { childStepId }),
    description: seconds >= 60 ? `Rest for ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : `Rest for 0:${String(seconds).padStart(2, '0')}`,
    endCondition: { conditionTypeId: 8, conditionTypeKey: 'fixed.rest', displayOrder: 8, displayable: true },
    endConditionValue: seconds,
    strokeType: { strokeTypeId: 0, displayOrder: 0 },
    equipmentType: { equipmentTypeId: 0, displayOrder: 0 },
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
    stepType: { stepTypeId: 5, stepTypeKey: 'rest', displayOrder: 5 },
    childStepId: childStepId,
    endCondition: endConditionMap[step.restType],
    endConditionValue: step.restType === 'lap_button' ? 200 : step.restValue,
    strokeType: { strokeTypeId: 0, displayOrder: 0 },
    equipmentType: { equipmentTypeId: 0, displayOrder: 0 },
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
    stepType: buildStepType(),
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
    for (const step of set.steps) {
      const needsRest = step.restType === 'lap_button' || step.restValue > 0;

      if (step.repetitions > 1) {
        // Wrap in a nested repeat group
        const nestedChildId = childStepIdCounter++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nestedSteps: any[] = [];
        const exec = buildExecutableStep(step, nestedChildId, workout.poolLengthUnit);
        exec.stepOrder = stepOrder++;
        nestedSteps.push(exec);
        if (needsRest) {
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
          skipLastRestStep: false,
          smartRepeat: false,
        });
      } else {
        const execStep = buildExecutableStep(step, childStepId, workout.poolLengthUnit);
        execStep.stepOrder = stepOrder++;
        innerSteps.push(execStep);

        if (needsRest) {
          const rest = buildStepRest(step, childStepId);
          rest.stepOrder = stepOrder++;
          innerSteps.push(rest);
        }
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

    // Rest after set
    if (set.restAfterSet > 0) {
      const setRest = buildRestStep(set.restAfterSet, undefined);
      setRest.stepOrder = stepOrder++;
      workoutSteps.push(setRest);
    }
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
