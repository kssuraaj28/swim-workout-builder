import type {
  Workout,
  WorkoutStep,
} from './types';
import {
  STROKE_TYPE_MAP,
  EQUIPMENT_TYPE_MAP,
  DRILL_TYPE_MAP,
  POOL_UNIT_MAP,
} from './types';

let stepIdCounter = 0;

function nextStepId(): number {
  return Date.now() * 1000 + stepIdCounter++;
}

function buildStepType() {
  return { stepTypeId: 7, stepTypeKey: 'other', displayOrder: 7 };
}

function buildRestStep(seconds: number, childStepId: number | null) {
  return {
    type: 'ExecutableStepDTO',
    stepId: nextStepId(),
    stepOrder: 0, // will be reassigned
    stepType: { stepTypeId: 5, stepTypeKey: 'rest', displayOrder: 5 },
    childStepId: childStepId,
    description: seconds >= 60 ? `Rest for ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : `Rest for 0:${String(seconds).padStart(2, '0')}`,
    endCondition: { conditionTypeId: 8, conditionTypeKey: 'fixed.rest', displayOrder: 8, displayable: true },
    endConditionValue: seconds,
    preferredEndConditionUnit: null,
    endConditionCompare: null,
    targetType: null, targetValueOne: null, targetValueTwo: null, targetValueUnit: null, zoneNumber: null,
    secondaryTargetType: null, secondaryTargetValueOne: null, secondaryTargetValueTwo: null, secondaryTargetValueUnit: null, secondaryZoneNumber: null,
    endConditionZone: null,
    strokeType: { strokeTypeId: 0, strokeTypeKey: null, displayOrder: 0 },
    equipmentType: { equipmentTypeId: 0, equipmentTypeKey: null, displayOrder: 0 },
    category: null, exerciseName: null, workoutProvider: null, providerExerciseSourceId: null, weightValue: null, weightUnit: null,
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
    description: null,
    endCondition: endConditionMap[step.restType],
    endConditionValue: step.restType === 'lap_button' ? 200 : step.restValue,
    preferredEndConditionUnit: null,
    endConditionCompare: null,
    targetType: null, targetValueOne: null, targetValueTwo: null, targetValueUnit: null, zoneNumber: null,
    secondaryTargetType: null, secondaryTargetValueOne: null, secondaryTargetValueTwo: null, secondaryTargetValueUnit: null, secondaryZoneNumber: null,
    endConditionZone: null,
    strokeType: { strokeTypeId: 0, strokeTypeKey: null, displayOrder: 0 },
    equipmentType: { equipmentTypeId: 0, equipmentTypeKey: null, displayOrder: 0 },
    category: null, exerciseName: null, workoutProvider: null, providerExerciseSourceId: null, weightValue: null, weightUnit: null,
  };
}

function buildExecutableStep(step: WorkoutStep, childStepId: number, poolUnit: string) {
  const stroke = STROKE_TYPE_MAP[step.strokeType];
  const firstEquip = step.equipment.length > 0 ? step.equipment[0] : 'none';
  const equip = EQUIPMENT_TYPE_MAP[firstEquip];
  const needsDrill = step.strokeType === 'drill' && step.drillType;

  return {
    type: 'ExecutableStepDTO',
    stepId: nextStepId(),
    stepOrder: 0,
    stepType: buildStepType(),
    childStepId: childStepId,
    description: [step.targetPace ? `Target: ${step.targetPace}/100` : '', step.description].filter(Boolean).join(', ') || null,
    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance', displayOrder: 3, displayable: true },
    endConditionValue: step.distance,
    preferredEndConditionUnit: POOL_UNIT_MAP[poolUnit],
    endConditionCompare: null,
    targetType: null, targetValueOne: null, targetValueTwo: null, targetValueUnit: null, zoneNumber: null,
    secondaryTargetType: null,
    secondaryTargetValueOne: null,
    secondaryTargetValueTwo: null,
    secondaryTargetValueUnit: null,
    secondaryZoneNumber: null,
    endConditionZone: null,
    strokeType: { strokeTypeId: stroke.id, strokeTypeKey: stroke.key, displayOrder: stroke.displayOrder },
    equipmentType: { equipmentTypeId: equip.id, equipmentTypeKey: equip.key, displayOrder: equip.displayOrder },
    category: null, exerciseName: null, workoutProvider: null, providerExerciseSourceId: null, weightValue: null, weightUnit: null,
    ...(needsDrill && step.drillType ? {
      drillType: {
        drillTypeId: DRILL_TYPE_MAP[step.drillType].id,
        drillTypeKey: DRILL_TYPE_MAP[step.drillType].key,
        drillTypeDisplay: DRILL_TYPE_MAP[step.drillType].displayOrder,
      }
    } : {}),
  };
}

export function exportToGarmin(workout: Workout): object {
  stepIdCounter = 0;
  const poolUnit = POOL_UNIT_MAP[workout.poolLengthUnit];

  let totalDistance = 0;
  let totalDuration = 0;

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
          preferredEndConditionUnit: null,
          endConditionCompare: null,
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

      totalDistance += step.distance * step.repetitions * set.iterations;
      totalDuration += (step.distance / 50) * 60 * step.repetitions * set.iterations;
      if (step.restType !== 'lap_button') {
        totalDuration += step.restValue * step.repetitions * set.iterations;
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
      preferredEndConditionUnit: null,
      endConditionCompare: null,
      endCondition: { conditionTypeId: 7, conditionTypeKey: 'iterations', displayOrder: 7, displayable: false },
      skipLastRestStep: false,
      smartRepeat: false,
    };

    workoutSteps.push(repeatGroup);

    // Rest after set
    if (set.restAfterSet > 0) {
      const setRest = buildRestStep(set.restAfterSet, null);
      setRest.stepOrder = stepOrder++;
      workoutSteps.push(setRest);
      totalDuration += set.restAfterSet;
    }
  }

  return {
    workoutId: null,
    ownerId: null,
    workoutName: workout.name,
    description: workout.description,
    updatedDate: new Date().toISOString(),
    createdDate: new Date().toISOString(),
    sportType: { sportTypeId: 4, sportTypeKey: 'swimming', displayOrder: 3 },
    subSportType: null,
    trainingPlanId: null,
    author: null,
    sharedWithUsers: null,
    estimatedDurationInSecs: Math.round(totalDuration),
    estimatedDistanceInMeters: Math.round(totalDistance * (poolUnit.factor / 100)),
    workoutSegments: [{
      segmentOrder: 1,
      sportType: { sportTypeId: 4, sportTypeKey: 'swimming', displayOrder: 3 },
      poolLengthUnit: null,
      poolLength: null,
      avgTrainingSpeed: null,
      estimatedDurationInSecs: null,
      estimatedDistanceInMeters: null,
      estimatedDistanceUnit: null,
      estimateType: null,
      description: null,
      workoutSteps,
    }],
    poolLength: workout.poolLength,
    poolLengthUnit: poolUnit,
    locale: null,
    workoutProvider: null,
    workoutSourceId: null,
    uploadTimestamp: null,
    atpPlanId: null,
    consumer: null,
    consumerName: null,
    consumerImageURL: null,
    consumerWebsiteURL: null,
    workoutNameI18nKey: null,
    descriptionI18nKey: null,
    avgTrainingSpeed: 0,
    estimateType: null,
    estimatedDistanceUnit: { unitId: null, unitKey: null, factor: null },
    workoutThumbnailUrl: null,
    isSessionTransitionEnabled: null,
    shared: false,
  };
}
