import type { Warned } from './utils.ts';
import { NormalizeWarnings, asObject, bool, int, oneOf, str, todayDateString, warnUnknown } from './utils.ts';

// Runtime tuple → derived type pattern:
//   `as const` freezes the array so each element is its own literal type ('free', not string).
//   `typeof STROKES[number]` then unions those literals: 'free' | 'backstroke' | ...
// One source of truth: the array is the runtime list, the type mirrors it automatically.
const STROKES     = ['free', 'backstroke', 'breaststroke', 'butterfly', 'mixed'] as const;
const EQUIPMENT   = ['none', 'fins', 'kickboard', 'paddles', 'pull_buoy', 'snorkel'] as const;
const REST_TYPES  = ['rest', 'interval', 'lap_button'] as const;
const POOL_UNITS  = ['yard', 'meter'] as const;

export type StrokeType    = typeof STROKES[number];
export type EquipmentType = typeof EQUIPMENT[number];
export type RestType      = typeof REST_TYPES[number];
export type PoolUnit      = typeof POOL_UNITS[number];


export interface WorkoutStep {
  repetitions: number;
  strokeType: StrokeType;
  distance: number;
  equipment: EquipmentType[];
  /** When false, the step is exported as a drill (drill stroke type + generic drill sub-type) so Garmin doesn't auto-track it. */
  track: boolean;
  targetPace: string; // mm:ss per 100, e.g. "1:30"
  description: string;
  restType: RestType;
  restValue: number; // seconds (ignored for lap_button)
}

export interface WorkoutSet {
  name: string;
  iterations: number;
  steps: WorkoutStep[];
}

export interface Workout {
  name: string;
  /** YYYY-MM-DD. Together with `name`, forms the workout's identity in the library. User-editable. */
  createdAt: string;
  description: string;
  poolLength: number;
  poolLengthUnit: PoolUnit;
  sets: WorkoutSet[];
  savedAt?: string; // ISO date string
}

export interface WorkoutKey {
  name: string;
  createdAt: string;
}

export function createDefaultStep(): WorkoutStep {
  return {
    repetitions: 1,
    strokeType: 'free',
    distance: 100,
    equipment: [],
    track: true,
    targetPace: '',
    description: '',
    restType: 'rest',
    restValue: 15,
  };
}

export function createDefaultSet(): WorkoutSet {
  return {
    name: '',
    iterations: 1,
    steps: [createDefaultStep()],
  };
}

export function createDefaultWorkout(): Workout {
  return {
    name: '',
    createdAt: todayDateString(),
    description: '',
    poolLength: 25,
    poolLengthUnit: 'yard',
    sets: [],
  };
}

/** Distance covered in a single iteration of the set (sum of step.distance * step.repetitions). */
export function calcSetBaseDistance(set: WorkoutSet): number {
  return set.steps.reduce((d, s) => d + s.distance * s.repetitions, 0);
}

export function calcTotalDistance(workout: Workout): number {
  return workout.sets.reduce(
    (total, set) => total + calcSetBaseDistance(set) * set.iterations,
    0,
  );
}

// Required keys derived from the default constructors — one source of truth for shape.
// The cast is safe because Object.keys of a fully-typed default is exactly the required keys.
const WORKOUT_STEP_KEYS    = Object.keys(createDefaultStep())    as (keyof WorkoutStep)[];
const WORKOUT_SET_KEYS     = Object.keys(createDefaultSet())     as (keyof WorkoutSet)[];
const WORKOUT_KEYS         = Object.keys(createDefaultWorkout()) as (keyof Workout)[];
const WORKOUT_OPTIONAL_KEYS: (keyof Workout)[] = ['savedAt'];

export function normalizeWorkoutStep(raw: unknown): Warned<WorkoutStep> {
  const warnings = new NormalizeWarnings();
  return { value: stepInto(raw, 'step', warnings), warnings };
}

export function normalizeWorkoutSet(raw: unknown): Warned<WorkoutSet> {
  const warnings = new NormalizeWarnings();
  return { value: setInto(raw, 'set', warnings), warnings };
}

export function normalizeWorkout(raw: unknown): Warned<Workout> {
  const warnings = new NormalizeWarnings();
  return { value: workoutInto(raw, 'workout', warnings), warnings };
}

function stepInto(raw: unknown, field: string, warnings: NormalizeWarnings): WorkoutStep {
  const base = createDefaultStep();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, WORKOUT_STEP_KEYS, warnings);
  return {
    repetitions: int(obj.repetitions, 'repetitions', 1, base.repetitions, warnings),
    strokeType:  oneOf(obj.strokeType, STROKES, 'strokeType', base.strokeType, warnings),
    distance:    int(obj.distance, 'distance', 1, base.distance, warnings),
    equipment:   equipmentInto(obj.equipment, 'equipment', warnings),
    track:       bool(obj.track, 'track', base.track, warnings),
    targetPace:  str(obj.targetPace, 'targetPace', base.targetPace, warnings),
    description: str(obj.description, 'description', base.description, warnings),
    restType:    oneOf(obj.restType, REST_TYPES, 'restType', base.restType, warnings),
    restValue:   int(obj.restValue, 'restValue', 0, base.restValue, warnings),
  };
}

function setInto(raw: unknown, field: string, warnings: NormalizeWarnings): WorkoutSet {
  const base = createDefaultSet();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, WORKOUT_SET_KEYS, warnings);
  return {
    name:       str(obj.name, 'name', base.name, warnings),
    iterations: int(obj.iterations, 'iterations', 1, base.iterations, warnings),
    steps:      arrayInto(obj.steps, 'steps', warnings, (s, i) => stepInto(s, `step ${i + 1}`, warnings)),
  };
}

function workoutInto(raw: unknown, field: string, warnings: NormalizeWarnings): Workout {
  const base = createDefaultWorkout();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, [...WORKOUT_KEYS, ...WORKOUT_OPTIONAL_KEYS], warnings);
  const workout: Workout = {
    name:           str(obj.name, 'name', base.name, warnings),
    createdAt:      str(obj.createdAt, 'createdAt', base.createdAt, warnings),
    description:    str(obj.description, 'description', base.description, warnings),
    poolLength:     int(obj.poolLength, 'poolLength', 1, base.poolLength, warnings),
    poolLengthUnit: oneOf(obj.poolLengthUnit, POOL_UNITS, 'poolLengthUnit', base.poolLengthUnit, warnings),
    sets:           arrayInto(obj.sets, 'sets', warnings, (s, i) => setInto(s, `set ${i + 1}`, warnings)),
  };
  if (obj.savedAt !== undefined) workout.savedAt = str(obj.savedAt, 'savedAt', '', warnings);
  return workout;
}

function equipmentInto(value: unknown, field: string, warnings: NormalizeWarnings): EquipmentType[] {
  return arrayInto(value, field, warnings, (item, i) => oneOf(item, EQUIPMENT, `${field}[${i}]`, 'none', warnings));
}

function arrayInto<T>(value: unknown, field: string, warnings: NormalizeWarnings, item: (v: unknown, i: number) => T): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    warnings.add(`${field} was not an array; using []`);
    return [];
  }
  return value.map(item);
}
