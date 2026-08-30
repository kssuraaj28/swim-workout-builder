/* eslint-disable react-refresh/only-export-components -- tiny helpers colocated with the component */
import type { Param } from '../core/designers.ts';
import { SECTION_LABEL } from './styles.ts';

export type Values = Record<string, string>;

/** Initial dropdown selection for each param: the first declared option, or empty. */
export function initValues(params: Param[]): Values {
  const r: Values = {};
  for (const p of params) r[p.identifier] = p.options[0] ?? '';
  return r;
}

export function ParamInputs({
  title, params, values, onChange,
}: {
  title: string;
  params: Param[];
  values: Values;
  onChange: (identifier: string, value: string) => void;
}) {
  if (params.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className={SECTION_LABEL}>{title}</div>
      {params.map(p => (
        <label key={p.identifier} className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-32 font-mono truncate">{p.identifier}</span>
          <select
            value={values[p.identifier] ?? ''}
            onChange={e => onChange(p.identifier, e.target.value)}
            className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          >
            {p.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
