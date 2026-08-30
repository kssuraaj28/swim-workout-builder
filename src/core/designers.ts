import type { Warned } from './utils.ts';
import { NormalizeWarnings, arrayInto, asObject, str, warnUnknown } from './utils.ts';
import type { WorkoutSet } from './workouts.ts';
import { createDefaultSet, normalizeWorkoutSet } from './workouts.ts';

export interface Param {
  identifier: string;
  options: string[];
}

export interface Designer {
  id: string;
  description: string;
  variation: Param[];
  overload: Param[];
  source: string;
}

export function createDefaultParam(): Param {
  return { identifier: '', options: [] };
}

export function createDefaultDesigner(): Designer {
  return {
    id: '',
    description: '',
    variation: [],
    overload: [],
    source: '',
  };
}

/** Populated example the Design Set editor opens with so a first-time user sees the shape. */
export const STARTER_DESIGNER: Designer = {
  id: 'endurance-free',
  description: 'Aerobic base pull sets.',
  variation: [
    { identifier: 'stroke', options: ['free', 'backstroke', 'breaststroke', 'butterfly'] },
    { identifier: 'distance', options: ['100', '200'] },
    { identifier: 'equipment', options: ['none', 'fins', 'pull_buoy', 'paddles'] },
  ],
  overload: [
    { identifier: 'reps', options: ['8', '10', '12'] },
    { identifier: 'sendOff', options: ['90', '95', '100'] },
    { identifier: 'targetPace', options: ['1:30', '1:35', '1:40', '1:45'] },
  ],
  source: `return {
  name: 'Endurance ' + variation.stroke,
  iterations: 1,
  steps: [
    {
      repetitions: Number(overload.reps),
      strokeType: variation.stroke,
      distance: Number(variation.distance),
      equipment: variation.equipment === 'none' ? [] : [variation.equipment],
      track: true,
      targetPace: overload.targetPace,
      description: '',
      restType: 'interval',
      restValue: Number(overload.sendOff),
    },
  ],
};
`,
};

export function normalizeDesigner(raw: unknown): Warned<Designer> {
  const warnings = new NormalizeWarnings();
  return { value: designerInto(raw, 'designer', warnings), warnings };
}

export function buildSetFromDesigner(
  designer: Designer,
  variation: Record<string, unknown>,
  overload: Record<string, unknown>,
): Warned<WorkoutSet> {
  let raw: unknown;
  try {
    raw = new Function('variation', 'overload', designer.source)(variation, overload);
  } catch (err) {
    const warnings = new NormalizeWarnings();
    warnings.add(`Designer "${designer.id}" failed to run: ${err instanceof Error ? err.message : String(err)}`);
    return { value: createDefaultSet(), warnings };
  }
  return normalizeWorkoutSet(raw);
}

const PARAM_KEYS     = Object.keys(createDefaultParam())    as (keyof Param)[];
const DESIGNER_KEYS  = Object.keys(createDefaultDesigner()) as (keyof Designer)[];

function paramInto(raw: unknown, field: string, warnings: NormalizeWarnings): Param {
  const base = createDefaultParam();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, PARAM_KEYS, warnings);
  return {
    identifier: str(obj.identifier, 'identifier', base.identifier, warnings),
    options:    arrayInto(obj.options, 'options', warnings, (o, i) => str(o, `options[${i}]`, '', warnings)),
  };
}

function designerInto(raw: unknown, field: string, warnings: NormalizeWarnings): Designer {
  const base = createDefaultDesigner();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, DESIGNER_KEYS, warnings);
  return {
    id:          str(obj.id, 'id', base.id, warnings),
    description: str(obj.description, 'description', base.description, warnings),
    variation:   arrayInto(obj.variation, 'variation', warnings, (p, i) => paramInto(p, `variation[${i}]`, warnings)),
    overload:    arrayInto(obj.overload, 'overload', warnings, (p, i) => paramInto(p, `overload[${i}]`, warnings)),
    source:      str(obj.source, 'source', base.source, warnings),
  };
}
