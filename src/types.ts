export type StrokeType = 'free' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';
export type EquipmentType = 'none' | 'fins' | 'kickboard' | 'paddles' | 'pull_buoy' | 'snorkel';
export type RestType = 'rest' | 'interval' | 'lap_button';


export interface WorkoutStep {
  id: string;
  repetitions: number;
  strokeType: StrokeType;
  distance: number;
  equipment: EquipmentType[];
  /** Marks the step as a drill / kick — exported as drill stroke type with a generic drill sub-type. */
  trackable: boolean;
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
  restAfterSet: number; // seconds
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
  id: string;
  name: string;
  description: string;
  poolLength: number;
  poolLengthUnit: 'yard' | 'meter';
  sets: WorkoutSet[];
  volume: number; // 1-5, default 3 (neutral)
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

/** Garmin drill stroke type — used when WorkoutStep.trackable is true. */
export const DRILL_STROKE = { id: 4, key: 'drill', displayOrder: 4 };
/** Garmin generic drill sub-type — paired with DRILL_STROKE when exporting trackable steps. */
export const DRILL_SUBTYPE = { id: 3, key: 'drill', displayOrder: 3 };

export const EQUIPMENT_TYPE_MAP: Record<EquipmentType, { id: number; key: string | null; displayOrder: number }> = {
  none: { id: 0, key: null, displayOrder: 0 },
  fins: { id: 1, key: 'fins', displayOrder: 1 },
  kickboard: { id: 2, key: 'kickboard', displayOrder: 2 },
  paddles: { id: 3, key: 'paddles', displayOrder: 3 },
  pull_buoy: { id: 4, key: 'pull_buoy', displayOrder: 4 },
  snorkel: { id: 5, key: 'snorkel', displayOrder: 5 },
};

export const POOL_UNIT_MAP: Record<string, { unitId: number; unitKey: string; factor: number }> = {
  yard: { unitId: 230, unitKey: 'yard', factor: 91.44 },
  meter: { unitId: 229, unitKey: 'meter', factor: 100 },
};

export const STROKE_LABELS: Record<StrokeType, string> = {
  free: 'Freestyle',
  backstroke: 'Backstroke',
  breaststroke: 'Breaststroke',
  butterfly: 'Butterfly',
  mixed: 'Mixed / IM',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  none: 'None',
  fins: 'Fins',
  kickboard: 'Kickboard',
  paddles: 'Paddles',
  pull_buoy: 'Pull Buoy',
  snorkel: 'Snorkel',
};


