export type StrokeType = 'free' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';
export type EquipmentType = 'none' | 'fins' | 'kickboard' | 'paddles' | 'pull_buoy' | 'snorkel';
export type RestType = 'rest' | 'interval' | 'lap_button';


export interface WorkoutStep {
  id: string;
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
  id: string;
  name: string;
  iterations: number;
  steps: WorkoutStep[];
}

export type SetParamKey = 'stroke' | 'distance' | 'iterations';

export interface SetTemplate {
  id: string;
  title: string;
  tags: string[];
  notes?: string;
  set: WorkoutSet;
  params: SetParamKey[];
  createdAt: string;
  updatedAt: string;
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

// Garmin enum mappings
export const STROKE_TYPE_MAP: Record<StrokeType, { id: number; key: string; displayOrder: number }> = {
  backstroke: { id: 2, key: 'backstroke', displayOrder: 2 },
  breaststroke: { id: 3, key: 'breaststroke', displayOrder: 3 },
  butterfly: { id: 5, key: 'fly', displayOrder: 5 },
  free: { id: 6, key: 'free', displayOrder: 6 },
  mixed: { id: 8, key: 'mixed', displayOrder: 8 },
};

/** Garmin drill stroke type — used when WorkoutStep.track is false. */
export const DRILL_STROKE = { id: 4, key: 'drill', displayOrder: 4 };
/** Garmin generic drill sub-type — paired with DRILL_STROKE when exporting untracked steps. */
export const DRILL_SUBTYPE = { id: 3, key: 'drill', displayOrder: 3 };

export const POOL_UNIT_MAP: Record<string, { unitId: number; unitKey: string; factor: number }> = {
  yard: { unitId: 230, unitKey: 'yard', factor: 91.44 },
  meter: { unitId: 229, unitKey: 'meter', factor: 100 },
};

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


