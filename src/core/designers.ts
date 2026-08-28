import type { Warned } from './utils.ts';
import { NormalizeWarnings, arrayInto, asObject, oneOf, str, warnUnknown } from './utils.ts';

export const KINDS = ['number', 'string', 'boolean'] as const;
export type ParamKind = typeof KINDS[number];

export interface Param {
  identifier: string;
  kind: ParamKind;
}

export interface Designer {
  id: string;
  description: string;
  variation: Param[];
  overload: Param[];
  source: string;
}

export function createDefaultParam(): Param {
  return { identifier: '', kind: 'number' };
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

export function normalizeDesigner(raw: unknown): Warned<Designer> {
  const warnings = new NormalizeWarnings();
  return { value: designerInto(raw, 'designer', warnings), warnings };
}

const PARAM_KEYS     = Object.keys(createDefaultParam())    as (keyof Param)[];
const DESIGNER_KEYS  = Object.keys(createDefaultDesigner()) as (keyof Designer)[];

function paramInto(raw: unknown, field: string, warnings: NormalizeWarnings): Param {
  const base = createDefaultParam();
  const obj = asObject(raw, field, warnings);
  warnUnknown(obj, PARAM_KEYS, warnings);
  return {
    identifier: str(obj.identifier, 'identifier', base.identifier, warnings),
    kind:       oneOf(obj.kind, KINDS, 'kind', base.kind, warnings),
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
