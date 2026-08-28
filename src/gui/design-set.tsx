import { useState } from 'react';
import { STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT } from './header.tsx';

const KINDS = ['number', 'string', 'boolean'] as const;
type ParamKind = typeof KINDS[number];

interface ParamRow {
  identifier: string;
  kind: ParamKind;
}

const EMPTY_ROW: ParamRow = { identifier: '', kind: 'number' };

const ROW_GRID = 'grid grid-cols-[1fr_110px_28px] gap-2';
const ROW_INPUT = 'w-full min-w-0 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900';

const STARTER_VARIATION: ParamRow[] = [
  { identifier: 'stroke', kind: 'string' },
  { identifier: 'distance', kind: 'number' },
];

const STARTER_OVERLOAD: ParamRow[] = [
  { identifier: 'reps', kind: 'number' },
  { identifier: 'sendOff', kind: 'number' },
];

const STARTER_SOURCE = `return {
  name: 'Endurance ' + variation.stroke,
  iterations: 1,
  steps: [
    {
      repetitions: overload.reps,
      strokeType: variation.stroke,
      distance: variation.distance,
      equipment: [],
      track: true,
      targetPace: '',
      description: '',
      restType: 'interval',
      restValue: overload.sendOff,
    },
  ],
};
`;

export function DesignSet() {
  const [id, setId] = useState('endurance-free');
  const [description, setDescription] = useState('Aerobic base pull sets.');
  const [variation, setVariation] = useState<ParamRow[]>(STARTER_VARIATION);
  const [overload, setOverload] = useState<ParamRow[]>(STARTER_OVERLOAD);
  const [source, setSource] = useState(STARTER_SOURCE);

  return (
    <div className="flex">
      <aside className={`w-64 shrink-0 bg-white border-r border-gray-200 no-print sticky ${STICKY_BELOW_HEADER_TOP} ${SIDEBAR_HEIGHT} overflow-hidden flex flex-col`}>
        <div className="p-3 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Designers
        </div>
        <div className="flex-1 overflow-auto p-3 text-sm text-gray-400 italic">
          No designers yet.
        </div>
        <div className="p-3 border-t border-gray-200">
          <button className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
            + New Designer
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <TextField label="Id" value={id} onChange={setId} placeholder="kebab-case-id" mono />
            <TextArea label="Description" value={description} onChange={setDescription} rows={2} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ParamSection title="Variation" rows={variation} onChange={setVariation} />
            <ParamSection title="Overload" rows={overload} onChange={setOverload} />
          </div>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Source</h2>
            <textarea
              value={source}
              onChange={e => setSource(e.target.value)}
              spellCheck={false}
              rows={14}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-y"
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function ParamSection({
  title, rows, onChange,
}: {
  title: string;
  rows: ParamRow[];
  onChange: (rows: ParamRow[]) => void;
}) {
  const update = (i: number, patch: Partial<ParamRow>) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const add = () => onChange([...rows, EMPTY_ROW]);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      <div className="space-y-2">
        <div className={`${ROW_GRID} text-xs text-gray-500 px-1`}>
          <div>Identifier</div>
          <div>Kind</div>
          <div></div>
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`${ROW_GRID} items-center`}>
            <input
              type="text"
              value={row.identifier}
              onChange={e => update(i, { identifier: e.target.value })}
              placeholder="identifier"
              className={`${ROW_INPUT} font-mono`}
            />
            <select
              value={row.kind}
              onChange={e => update(i, { kind: e.target.value as ParamKind })}
              className={`${ROW_INPUT} bg-white`}
            >
              {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <button
              onClick={() => remove(i)}
              className="text-red-400 hover:text-red-600 text-lg leading-none"
              title="Remove"
            >
              &times;
            </button>
          </div>
        ))}
        <button onClick={add} className="text-sm text-blue-600 hover:text-blue-700">
          + Add {title.toLowerCase()} param
        </button>
      </div>
    </section>
  );
}

function TextField({
  label, value, onChange, placeholder, mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col text-sm text-gray-600">
      {label}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 ${mono ? 'font-mono' : ''}`}
      />
    </label>
  );
}

function TextArea({
  label, value, onChange, rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="flex flex-col text-sm text-gray-600">
      {label}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none"
      />
    </label>
  );
}
