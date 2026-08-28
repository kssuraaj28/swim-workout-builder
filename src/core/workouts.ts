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

export const STROKE_LABELS: Record<StrokeType, string> = {
  free: 'Freestyle',
  backstroke: 'Backstroke',
  breaststroke: 'Breaststroke',
  butterfly: 'Butterfly',
  mixed: 'Mixed',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  none: 'None',
  fins: 'Fins',
  kickboard: 'Kickboard',
  paddles: 'Paddles',
  pull_buoy: 'Pull Buoy',
  snorkel: 'Snorkel',
};


