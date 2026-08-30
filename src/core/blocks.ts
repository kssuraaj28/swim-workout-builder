import type { Warned } from './utils.ts';
import { NormalizeWarnings, arrayInto, asObject, oneOf, str, warnUnknown } from './utils.ts';

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
