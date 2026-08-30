/* eslint-disable react-refresh/only-export-components -- editor state factory colocated with the component */
import type { Dispatch, SetStateAction } from 'react';
import { STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT, type ShowWarnings } from './header.tsx';
import type { Designer, Param } from '../core/designers.ts';
import { STARTER_DESIGNER, buildSetFromDesigner, createDefaultDesigner } from '../core/designers.ts';
import type { WorkoutSet } from '../core/workouts.ts';
import { SetCard } from './set-card.tsx';
import { ParamInputs, initValues, type Values } from './param-inputs.tsx';
import { SECTION_HEADING } from './styles.ts';
import { SidebarList } from './sidebar-list.tsx';

const ROW_GRID = 'grid grid-cols-[1fr_2fr_160px_28px] gap-2';
const ROW_INPUT = 'w-full min-w-0 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900';

type ParamRole = 'variation' | 'overload';

/** Design-time editing shape: options is a raw CSV string so the user can type freely; role picks
 * which array the param lands in on save. */
interface ParamEdit {
  identifier: string;
  optionsText: string;
  role: ParamRole;
}

interface DesignerEdit {
  id: string;
  description: string;
  params: ParamEdit[];
  source: string;
}

const EMPTY_PARAM: ParamEdit = { identifier: '', optionsText: '', role: 'variation' };

function toEdit(d: Designer): DesignerEdit {
  const toParam = (role: ParamRole) => (p: Param): ParamEdit => ({
    identifier: p.identifier,
    optionsText: p.options.join(', '),
    role,
  });
  return {
    id: d.id,
    description: d.description,
    params: [...d.variation.map(toParam('variation')), ...d.overload.map(toParam('overload'))],
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
    variation: d.params.filter(p => p.role === 'variation').map(toParam),
    overload: d.params.filter(p => p.role === 'overload').map(toParam),
    source: d.source,
  };
}

/** Editor state lifted to App so it survives tab switches. */
export interface DesignerEditor {
  editing: DesignerEdit;
  testVariation: Values;
  testOverload: Values;
  testSet: WorkoutSet | null;
}

export function initialDesignerEditor(): DesignerEditor {
  return {
    editing: toEdit(STARTER_DESIGNER),
    testVariation: {},
    testOverload: {},
    testSet: null,
  };
}

interface Props {
  designers: Designer[];
  onSaveDesigner: (designer: Designer) => void;
  onDeleteDesigner: (id: string) => void;
  showWarnings: ShowWarnings;
  editor: DesignerEditor;
  setEditor: Dispatch<SetStateAction<DesignerEditor>>;
}

export function DesignSet({ designers, onSaveDesigner, onDeleteDesigner, showWarnings, editor, setEditor }: Props) {
  const { editing, testVariation, testOverload, testSet } = editor;
  const setEditing = (v: DesignerEdit) => setEditor(e => ({ ...e, editing: v }));
  const setTestVariation = (v: Values) => setEditor(e => ({ ...e, testVariation: v }));
  const setTestOverload = (v: Values) => setEditor(e => ({ ...e, testOverload: v }));
  const setTestSet = (v: WorkoutSet | null) => setEditor(e => ({ ...e, testSet: v }));

  const patch = (p: Partial<DesignerEdit>) => setEditing({ ...editing, ...p });

  const runTest = () => {
    const designer = fromEdit(editing);
    const variation = { ...initValues(designer.variation), ...testVariation };
    const overload = { ...initValues(designer.overload), ...testOverload };
    const { value, warnings } = buildSetFromDesigner(designer, variation, overload);
    setTestSet(value);
    showWarnings(`designer ${designer.id || 'test'}`, warnings);
  };


  return (
    <div className="flex">
      <aside className={`w-64 shrink-0 bg-white border-r border-gray-200 no-print sticky ${STICKY_BELOW_HEADER_TOP} ${SIDEBAR_HEIGHT} overflow-hidden flex flex-col`}>
        <SidebarList
          title="Designers"
          isEmpty={designers.length === 0}
          emptyMessage="No designers yet."
          footer={
            <button
              onClick={() => setEditing(toEdit(createDefaultDesigner()))}
              className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
            >
              + New Designer
            </button>
          }
        >
          <ul className="p-3 space-y-1">
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
        </SidebarList>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <TextField label="Id" value={editing.id} onChange={v => patch({ id: v })} placeholder="kebab-case-id" mono />
            <TextArea label="Description" value={editing.description} onChange={v => patch({ description: v })} rows={2} />
          </section>

          <ParamSection rows={editing.params} onChange={rows => patch({ params: rows })} />

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
            <h2 className={SECTION_HEADING}>Source</h2>
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

          {(() => {
            const designer = fromEdit(editing);
            const variation = { ...initValues(designer.variation), ...testVariation };
            const overload = { ...initValues(designer.overload), ...testOverload };
            return (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                <h2 className={SECTION_HEADING}>Test</h2>
                <ParamInputs
                  title="Variation"
                  params={designer.variation}
                  values={variation}
                  onChange={(id, v) => setTestVariation({ ...testVariation, [id]: v })}
                />
                <ParamInputs
                  title="Overload"
                  params={designer.overload}
                  values={overload}
                  onChange={(id, v) => setTestOverload({ ...testOverload, [id]: v })}
                />
                <button
                  onClick={runTest}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Run
                </button>
                {testSet && (
                  <div className="border-t border-gray-200 pt-3">
                    <SetCard
                      set={testSet}
                      index={0}
                      onChange={setTestSet}
                      onRemove={() => setTestSet(null)}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      isFirst
                      isLast
                    />
                  </div>
                )}
              </section>
            );
          })()}
        </main>
      </div>
    </div>
  );
}

function ParamSection({
  rows, onChange,
}: {
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
      <h2 className={`${SECTION_HEADING} mb-3`}>Variables</h2>
      <div className="space-y-2">
        <div className={`${ROW_GRID} text-xs text-gray-500 px-1`}>
          <div>Identifier</div>
          <div>Options</div>
          <div>Role</div>
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
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`role-${i}`}
                  checked={row.role === 'variation'}
                  onChange={() => update(i, { role: 'variation' })}
                />
                variation
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`role-${i}`}
                  checked={row.role === 'overload'}
                  onChange={() => update(i, { role: 'overload' })}
                />
                overload
              </label>
            </div>
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
          + Add variable
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
