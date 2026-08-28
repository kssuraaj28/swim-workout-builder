import { todayDateString } from './utils.ts';

export type StrokeType = 'free' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';
export type EquipmentType = 'none' | 'fins' | 'kickboard' | 'paddles' | 'pull_buoy' | 'snorkel';
export type RestType = 'rest' | 'interval' | 'lap_button';


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
  poolLengthUnit: 'yard' | 'meter';
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
