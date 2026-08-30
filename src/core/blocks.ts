import type { Warned } from './utils.ts';
import { NormalizeWarnings, arrayInto, asObject, oneOf, str, todayDateString, warnUnknown } from './utils.ts';
import type { Designer } from './designers.ts';
import { buildSetFromDesigner } from './designers.ts';
import type { Workout, WorkoutSet } from './workouts.ts';
import { createDefaultStep, createDefaultWorkout } from './workouts.ts';

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Day = typeof DAYS[number];

export interface DesignerUse {
  designerId: string;
  variation: Record<string, string>;
}

const INGREDIENT_KINDS = ['swim', 'other'] as const;
export type Ingredient =
  | { kind: 'swim'; description: string; designers: DesignerUse[] }
  | { kind: 'other'; text: string };

export type IngredientRef = number | null;
export type Schedule = Record<Day, [IngredientRef, IngredientRef]>;

export interface Block {
  id: string;
  description: string;
  ingredients: Ingredient[];
  schedule: Schedule;
}

export function emptySchedule(): Schedule {
  return Object.fromEntries(
    DAYS.map(d => [d, [null, null] as [IngredientRef, IngredientRef]]),
  ) as Schedule;
}

export function createDefaultBlock(): Block {
  return {
    id: '',
    description: '',
    ingredients: [],
    schedule: emptySchedule(),
  };
}

export function normalizeBlock(raw: unknown): Warned<Block> {
  const warnings = new NormalizeWarnings();
  return { value: blockInto(raw, 'block', warnings), warnings };
}

const BLOCK_KEYS = Object.keys(createDefaultBlock()) as (keyof Block)[];
const SWIM_KEYS = ['kind', 'description', 'designers'];
const OTHER_KEYS = ['kind', 'text'];
const USE_KEYS = ['designerId', 'variation'];

function blockInto(raw: unknown, field: string, warnings: NormalizeWarnings): Block {
  const base = createDefaultBlock();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, BLOCK_KEYS, warnings);
  return {
    id:          str(obj.id, 'id', base.id, warnings),
    description: str(obj.description, 'description', base.description, warnings),
    ingredients: arrayInto(obj.ingredients, 'ingredients', warnings, (r, i) => ingredientInto(r, `ingredients[${i}]`, warnings)),
    schedule:    scheduleInto(obj.schedule, warnings),
  };
}

function ingredientInto(raw: unknown, field: string, warnings: NormalizeWarnings): Ingredient {
  const obj = asObject(raw, field, warnings);
  const kind = oneOf(obj.kind, INGREDIENT_KINDS, `${field}.kind`, 'swim', warnings);
  if (kind === 'swim') {
    warnUnknown(obj, SWIM_KEYS, warnings);
    return {
      kind: 'swim',
      description: str(obj.description, `${field}.description`, '', warnings),
      designers:   arrayInto(obj.designers, `${field}.designers`, warnings, (u, i) => designerUseInto(u, `${field}.designers[${i}]`, warnings)),
    };
  }
  warnUnknown(obj, OTHER_KEYS, warnings);
  return {
    kind: 'other',
    text: str(obj.text, `${field}.text`, '', warnings),
  };
}

function designerUseInto(raw: unknown, field: string, warnings: NormalizeWarnings): DesignerUse {
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, USE_KEYS, warnings);
  return {
    designerId: str(obj.designerId, `${field}.designerId`, '', warnings),
    variation:  valuesInto(obj.variation, `${field}.variation`, warnings),
  };
}

function valuesInto(raw: unknown, field: string, warnings: NormalizeWarnings): Record<string, string> {
  if (raw === undefined) return {};
  const obj = asObject(raw, field, warnings);
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = v;
    } else {
      warnings.add(`${field}.${k} was not a string; ignored`);
    }
  }
  return result;
}

function scheduleInto(raw: unknown, warnings: NormalizeWarnings): Schedule {
  const base = emptySchedule();
  if (raw === undefined) return base;
  const obj = asObject(raw, 'schedule', warnings);
  const result = { ...base };
  for (const day of DAYS) {
    const cells = obj[day];
    if (cells === undefined) continue;
    if (!Array.isArray(cells) || cells.length !== 2) {
      warnings.add(`schedule.${day} must be a 2-element array; using [null, null]`);
      continue;
    }
    result[day] = [
      slotRefInto(cells[0], `schedule.${day}[0]`, warnings),
      slotRefInto(cells[1], `schedule.${day}[1]`, warnings),
    ];
  }
  return result;
}

function slotRefInto(raw: unknown, field: string, warnings: NormalizeWarnings): IngredientRef {
  if (raw === null) return null;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) return raw;
  warnings.add(`${field} must be a non-negative integer or null; using null`);
  return null;
}

// ── Instantiation ──────────────────────────────────────────────────────────

export interface DayDesigner {
  designerId: string;
  variation: Record<string, string>;
  designer: Designer;
}

/** Walks a day's schedule slots and resolves each swim-ingredient designer use against the current
 * designer library. Missing designers and non-swim ingredients are silently skipped. */
export function enumerateDayDesigners(block: Block, day: Day, designers: Designer[]): DayDesigner[] {
  const result: DayDesigner[] = [];
  for (const ref of block.schedule[day]) {
    if (ref === null) continue;
    const ing = block.ingredients[ref];
    if (!ing || ing.kind !== 'swim') continue;
    for (const use of ing.designers) {
      const designer = designers.find(d => d.id === use.designerId);
      if (!designer) continue;
      result.push({ designerId: use.designerId, variation: use.variation, designer });
    }
  }
  return result;
}

/** Produce a Workout for one day of the block, given per-designer overload values (parallel to
 * enumerateDayDesigners). Prepends warmup, appends cooldown, and stamps the block/day/overload trace
 * as the workout description. */
export function buildWorkoutFromDay(
  block: Block,
  day: Day,
  designers: Designer[],
  overloads: Record<string, string>[],
): Warned<Workout> {
  const warnings = new NormalizeWarnings();
  const dayDesigners: DayDesigner[] = [];

  // Re-walk with warnings so missing designers are surfaced (enumerate is silent for GUI use).
  for (const ref of block.schedule[day]) {
    if (ref === null) continue;
    const ing = block.ingredients[ref];
    if (!ing || ing.kind !== 'swim') continue;
    for (const use of ing.designers) {
      const designer = designers.find(d => d.id === use.designerId);
      if (!designer) {
        warnings.add(`Designer "${use.designerId}" no longer exists; skipped`);
        continue;
      }
      dayDesigners.push({ designerId: use.designerId, variation: use.variation, designer });
    }
  }

  const sets: WorkoutSet[] = [hardcodedWarmup()];
  for (let i = 0; i < dayDesigners.length; i++) {
    const { designer, variation } = dayDesigners[i];
    const overload = overloads[i] ?? {};
    const { value, warnings: w } = buildSetFromDesigner(designer, variation, overload);
    sets.push(value);
    warnings.merge(w);
  }
  sets.push(hardcodedCooldown());

  const dayLabel = day[0].toUpperCase() + day.slice(1);
  const overloadLines = dayDesigners.map((d, i) => {
    const entries = Object.entries(overloads[i] ?? {}).map(([k, v]) => `${k}=${v}`).join(', ');
    return `  ${d.designerId}: ${entries}`;
  });

  const workout: Workout = {
    ...createDefaultWorkout(),
    name: todayDateString(),
    description: [`Block: ${block.id || '(unsaved)'}`, `Day: ${dayLabel}`, `Overloads:`, ...overloadLines].join('\n'),
    sets,
  };

  return { value: workout, warnings };
}

// TODO: replace hardcoded warmup/cooldown with per-user preferences.
function hardcodedWarmup(): WorkoutSet {
  return {
    name: 'Warmup',
    iterations: 1,
    steps: [{ ...createDefaultStep(), repetitions: 4, strokeType: 'mixed', distance: 100 }],
  };
}

function hardcodedCooldown(): WorkoutSet {
  return {
    name: 'Cooldown',
    iterations: 1,
    steps: [{ ...createDefaultStep(), repetitions: 4, strokeType: 'mixed', distance: 100 }],
  };
}
