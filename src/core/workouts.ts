import { asObject, bool, int, normalizeFail, oneOf, str, todayDateString } from './utils.ts';

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

export function normalizeWorkoutStep(raw: unknown): WorkoutStep {
  const obj = asObject(raw);
  rejectUnknown(obj, WORKOUT_STEP_KEYS, []);
  return {
    repetitions: int(obj.repetitions, 'repetitions', 1),
    strokeType: oneOf(obj.strokeType, STROKES, 'strokeType'),
    distance: int(obj.distance, 'distance', 1),
    equipment: equipmentList(obj.equipment, 'equipment'),
    track: bool(obj.track, 'track'),
    targetPace: str(obj.targetPace, 'targetPace'),
    description: str(obj.description, 'description'),
    restType: oneOf(obj.restType, REST_TYPES, 'restType'),
    restValue: int(obj.restValue, 'restValue', 0),
  };
}

export function normalizeWorkoutSet(raw: unknown): WorkoutSet {
  const obj = asObject(raw);
  rejectUnknown(obj, WORKOUT_SET_KEYS, []);
  if (!Array.isArray(obj.steps)) normalizeFail('steps must be an array');
  if (obj.steps.length === 0) normalizeFail('steps cannot be empty');
  return {
    name: str(obj.name, 'name'),
    iterations: int(obj.iterations, 'iterations', 1),
    steps: obj.steps.map(normalizeWorkoutStep),
  };
}

export function normalizeWorkout(raw: unknown): Workout {
  const obj = asObject(raw);
  rejectUnknown(obj, WORKOUT_KEYS, WORKOUT_OPTIONAL_KEYS);
  if (!Array.isArray(obj.sets)) normalizeFail('sets must be an array');
  const workout: Workout = {
    name: str(obj.name, 'name'),
    createdAt: str(obj.createdAt, 'createdAt'),
    description: str(obj.description, 'description'),
    poolLength: int(obj.poolLength, 'poolLength', 1),
    poolLengthUnit: oneOf(obj.poolLengthUnit, POOL_UNITS, 'poolLengthUnit'),
    sets: obj.sets.map(normalizeWorkoutSet),
  };
  if (obj.savedAt !== undefined) workout.savedAt = str(obj.savedAt, 'savedAt');
  return workout;
}

function rejectUnknown(obj: Record<string, unknown>, required: readonly string[], optional: readonly string[]): void {
  const known = new Set<string>([...required, ...optional]);
  for (const key of Object.keys(obj)) {
    if (!known.has(key)) normalizeFail(`unknown field \`${key}\``);
  }
}

function equipmentList(value: unknown, field: string): EquipmentType[] {
  if (!Array.isArray(value)) normalizeFail(`${field} must be an array`);
  return value.map(item => oneOf(item, EQUIPMENT, field));
}
