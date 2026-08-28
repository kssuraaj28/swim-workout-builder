import type { EquipmentType, StrokeType } from '../core/workouts.ts';

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
