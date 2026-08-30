import { useState } from 'react';
import { STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT } from './header.tsx';
import type { Designer, Param } from '../core/designers.ts';
import { STARTER_DESIGNER, createDefaultDesigner } from '../core/designers.ts';

const ROW_GRID = 'grid grid-cols-[1fr_2fr_28px] gap-2';
const ROW_INPUT = 'w-full min-w-0 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900';

/** Design-time editing shape: options is a raw comma-separated string so the user can type freely. */
interface ParamEdit {
  identifier: string;
  optionsText: string;
}

interface DesignerEdit {
  id: string;
  description: string;
  variation: ParamEdit[];
  overload: ParamEdit[];
  source: string;
}

const EMPTY_PARAM: ParamEdit = { identifier: '', optionsText: '' };

function toEdit(d: Designer): DesignerEdit {
  const toParam = (p: Param): ParamEdit => ({
    identifier: p.identifier,
    optionsText: p.options.join(', '),
  });
  return {
    id: d.id,
    description: d.description,
    variation: d.variation.map(toParam),
    overload: d.overload.map(toParam),
    source: d.source,
  };
}

function fromEdit(d: DesignerEdit): Designer {
  const toParam = (p: ParamEdit): Param => ({
    identifier: p.identifier,
    options: p.optionsText.split(',').map(s => s.trim()).filter(Boolean),
  });
  return {
    id: d.id,
    description: d.description,
    variation: d.variation.map(toParam),
    overload: d.overload.map(toParam),
    source: d.source,
  };
}

interface Props {
  designers: Designer[];
  onSaveDesigner: (designer: Designer) => void;
  onDeleteDesigner: (id: string) => void;
}

export function DesignSet({ designers, onSaveDesigner, onDeleteDesigner }: Props) {
  const [editing, setEditing] = useState<DesignerEdit>(() => toEdit(STARTER_DESIGNER));

  const patch = (p: Partial<DesignerEdit>) => setEditing({ ...editing, ...p });

  return (
    <div className="flex">
      <aside className={`w-64 shrink-0 bg-white border-r border-gray-200 no-print sticky ${STICKY_BELOW_HEADER_TOP} ${SIDEBAR_HEIGHT} overflow-hidden flex flex-col`}>
        <div className="p-3 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Designers
        </div>
        <div className="flex-1 overflow-auto p-3">
          {designers.length === 0 ? (
            <div className="text-sm text-gray-400 italic">No designers yet.</div>
          ) : (
            <ul className="space-y-1">
              {designers.map(d => (
                <li key={d.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing(toEdit(d))}
                    className={`flex-1 min-w-0 text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                      d.id === editing.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="truncate font-mono">{d.id}</div>
                    {d.description && (
                      <div className="text-xs text-gray-500 truncate">{d.description}</div>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete designer "${d.id}"?`)) onDeleteDesigner(d.id);
                    }}
                    className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                    title="Delete"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setEditing(toEdit(createDefaultDesigner()))}
            className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
          >
            + New Designer
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <TextField label="Id" value={editing.id} onChange={v => patch({ id: v })} placeholder="kebab-case-id" mono />
            <TextArea label="Description" value={editing.description} onChange={v => patch({ description: v })} rows={2} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ParamSection title="Variation" rows={editing.variation} onChange={rows => patch({ variation: rows })} />
            <ParamSection title="Overload"  rows={editing.overload}  onChange={rows => patch({ overload: rows })} />
          </div>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Source</h2>
            <textarea
              value={editing.source}
              onChange={e => patch({ source: e.target.value })}
              spellCheck={false}
              rows={14}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-y"
            />
          </section>

          <div className="flex justify-end">
            <button
              onClick={() => onSaveDesigner(fromEdit(editing))}
              disabled={!editing.id.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              title={editing.id.trim() ? 'Save designer' : 'Give the designer an id first'}
            >
              Save Designer
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function ParamSection({
  title, rows, onChange,
}: {
  title: string;
  rows: ParamEdit[];
  onChange: (rows: ParamEdit[]) => void;
}) {
  const update = (i: number, p: Partial<ParamEdit>) => {
    const next = [...rows];
    next[i] = { ...next[i], ...p };
    onChange(next);
  };
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const add = () => onChange([...rows, EMPTY_PARAM]);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      <div className="space-y-2">
        <div className={`${ROW_GRID} text-xs text-gray-500 px-1`}>
          <div>Identifier</div>
          <div>Options</div>
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
            <input
              type="text"
              value={row.optionsText}
              onChange={e => update(i, { optionsText: e.target.value })}
              placeholder="option1, option2"
              className={ROW_INPUT}
            />
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
