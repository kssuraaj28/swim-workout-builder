/* eslint-disable react-refresh/only-export-components -- editor state factory colocated with the component */
import type { Dispatch, SetStateAction } from 'react';
import { STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT } from './header.tsx';
import type { Designer } from '../core/designers.ts';
import { ParamInputs, initValues, type Values } from './param-inputs.tsx';
import { SECTION_HEADING } from './styles.ts';
import { SidebarList } from './sidebar-list.tsx';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof DAYS[number];

interface DesignerUse {
  designerId: string;
  variation: Values;
}

type Ingredient =
  | { kind: 'swim'; description: string; designers: DesignerUse[] }
  | { kind: 'other'; text: string };

type IngredientRef = number | null;
type Schedule = Record<Day, [IngredientRef, IngredientRef]>;

const emptySchedule = (): Schedule => Object.fromEntries(
  DAYS.map(d => [d, [null, null] as [IngredientRef, IngredientRef]]),
) as Schedule;

/** Add-designer panel target: either a brand-new ingredient or an existing one by index. */
type AddTarget = { kind: 'new' } | { kind: 'existing'; index: number };

interface AddState {
  target: AddTarget;
  designerId: string;
  variation: Values;
}

/** Editor state lifted to App so it survives tab switches. */
export interface BlockEditor {
  id: string;
  description: string;
  ingredients: Ingredient[];
  schedule: Schedule;
  adding: AddState | null;
}

export function initialBlockEditor(): BlockEditor {
  return {
    id: '',
    description: '',
    ingredients: [],
    schedule: emptySchedule(),
    adding: null,
  };
}

interface Props {
  designers: Designer[];
  editor: BlockEditor;
  setEditor: Dispatch<SetStateAction<BlockEditor>>;
}

export function BlockBuilder({ designers, editor, setEditor }: Props) {
  const { id, description, ingredients, schedule, adding } = editor;
  const setId = (v: string) => setEditor(e => ({ ...e, id: v }));
  const setDescription = (v: string) => setEditor(e => ({ ...e, description: v }));
  const setIngredients = (v: Ingredient[]) => setEditor(e => ({ ...e, ingredients: v }));
  const setSchedule = (v: Schedule) => setEditor(e => ({ ...e, schedule: v }));
  const setAdding = (v: AddState | null | ((prev: AddState | null) => AddState | null)) =>
    setEditor(e => ({ ...e, adding: typeof v === 'function' ? v(e.adding) : v }));

  const openAdd = (target: AddTarget) => {
    if (designers.length === 0) return;
    const first = designers[0];
    setAdding({ target, designerId: first.id, variation: initValues(first.variation) });
  };

  const changeAddDesigner = (designerId: string) => {
    const d = designers.find(x => x.id === designerId);
    if (!d) return;
    setAdding(a => a && ({ ...a, designerId, variation: initValues(d.variation) }));
  };

  const updateAddVariation = (identifier: string, value: string) => {
    setAdding(a => a && ({ ...a, variation: { ...a.variation, [identifier]: value } }));
  };

  const commitAdd = () => {
    if (!adding) return;
    const use: DesignerUse = { designerId: adding.designerId, variation: adding.variation };
    if (adding.target.kind === 'new') {
      setIngredients([...ingredients, { kind: 'swim', description: '', designers: [use] }]);
    } else {
      const i = adding.target.index;
      const target = ingredients[i];
      if (target.kind !== 'swim') return;
      const next = [...ingredients];
      next[i] = { ...target, designers: [...target.designers, use] };
      setIngredients(next);
    }
    setAdding(null);
  };

  const addOtherIngredient = () => {
    setIngredients([...ingredients, { kind: 'other', text: '' }]);
  };

  const updateOtherText = (i: number, text: string) => {
    const target = ingredients[i];
    if (target.kind !== 'other') return;
    const next = [...ingredients];
    next[i] = { kind: 'other', text };
    setIngredients(next);
  };

  const removeIngredient = (i: number) => {
    setIngredients(ingredients.filter((_, j) => j !== i));
  };

  const removeDesignerFromIngredient = (ingIdx: number, useIdx: number) => {
    const target = ingredients[ingIdx];
    if (target.kind !== 'swim') return;
    const next = [...ingredients];
    next[ingIdx] = { ...target, designers: target.designers.filter((_, j) => j !== useIdx) };
    setIngredients(next);
  };

  const updateSwimDescription = (i: number, description: string) => {
    const target = ingredients[i];
    if (target.kind !== 'swim') return;
    const next = [...ingredients];
    next[i] = { ...target, description };
    setIngredients(next);
  };

  const updateSlot = (day: Day, slot: 0 | 1, ref: IngredientRef) => {
    setSchedule({ ...schedule, [day]: slot === 0 ? [ref, schedule[day][1]] : [schedule[day][0], ref] });
  };

  const addingDesigner = adding && designers.find(d => d.id === adding.designerId);
  const addTargetLabel = adding
    ? adding.target.kind === 'new'
      ? 'new ingredient'
      : `ingredient [${adding.target.index + 1}]`
    : '';

  return (
    <div className="flex">
      <aside className={`w-64 shrink-0 bg-white border-r border-gray-200 no-print sticky ${STICKY_BELOW_HEADER_TOP} ${SIDEBAR_HEIGHT} overflow-hidden flex flex-col`}>
        <SidebarList
          title="Blocks"
          isEmpty
          emptyMessage="No blocks yet."
          footer={
            <button
              className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
            >
              + New Block
            </button>
          }
        >
          <ul />
        </SidebarList>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <label className="flex flex-col text-sm text-gray-600">
              Id
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="kebab-case-id"
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono"
              />
            </label>
            <label className="flex flex-col text-sm text-gray-600">
              Description
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none"
              />
            </label>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className={`${SECTION_HEADING} mb-3`}>Ingredients</h2>
            {ingredients.length === 0 && !adding && (
              <p className="text-sm text-gray-400 italic mb-3">No ingredients yet.</p>
            )}
            <ul className="space-y-3 mb-3">
              {ingredients.map((ing, i) => (
                <li key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">[{i + 1}] {ing.kind}</span>
                    <button
                      onClick={() => removeIngredient(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                      title="Remove ingredient"
                    >
                      &times;
                    </button>
                  </div>
                  {ing.kind === 'swim' ? (
                    <>
                      <input
                        type="text"
                        value={ing.description}
                        onChange={e => updateSwimDescription(i, e.target.value)}
                        placeholder="description"
                        className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      />
                      <ul className="space-y-1 pl-2">
                        {ing.designers.map((use, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-mono text-gray-900 truncate">{use.designerId}</div>
                              <div className="text-xs text-gray-500 truncate">{summarizeUse(use)}</div>
                            </div>
                            <button
                              onClick={() => removeDesignerFromIngredient(i, j)}
                              className="text-red-400 hover:text-red-600 text-sm leading-none"
                              title="Remove designer"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                        {ing.designers.length === 0 && (
                          <li className="text-xs text-gray-400 italic">(no designers)</li>
                        )}
                      </ul>
                      <button
                        onClick={() => openAdd({ kind: 'existing', index: i })}
                        disabled={designers.length === 0 || adding !== null}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        + Add designer
                      </button>
                    </>
                  ) : (
                    <textarea
                      value={ing.text}
                      onChange={e => updateOtherText(i, e.target.value)}
                      placeholder="e.g. Gym: squat 3x8"
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 resize-none"
                    />
                  )}
                </li>
              ))}
            </ul>

            {adding && addingDesigner ? (
              <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                <div className="text-xs text-gray-500">Adding designer to <span className="font-mono">{addTargetLabel}</span></div>
                <label className="flex flex-col text-sm text-gray-600">
                  Designer
                  <select
                    value={adding.designerId}
                    onChange={e => changeAddDesigner(e.target.value)}
                    className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono bg-white"
                  >
                    {designers.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                  </select>
                </label>
                <ParamInputs
                  title="Variation"
                  params={addingDesigner.variation}
                  values={adding.variation}
                  onChange={updateAddVariation}
                />
                <div className="flex gap-2">
                  <button
                    onClick={commitAdd}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(null)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => openAdd({ kind: 'new' })}
                  disabled={designers.length === 0}
                  title={designers.length === 0 ? 'Author designers in the Design Set tab first' : ''}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  + Add swim ingredient
                </button>
                <button
                  onClick={addOtherIngredient}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add other ingredient
                </button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className={`${SECTION_HEADING} mb-3`}>Schedule</h2>
            <div className="grid grid-cols-[100px_1fr_1fr] gap-2 items-center text-sm">
              <div></div>
              <div className="text-xs text-gray-500 px-1">slot 1</div>
              <div className="text-xs text-gray-500 px-1">slot 2</div>
              {DAYS.map(day => (
                <FragmentRow key={day} day={day} slots={schedule[day]} ingredients={ingredients} onChange={updateSlot} />
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              disabled={!id.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              title={id.trim() ? 'Save block' : 'Give the block an id first'}
            >
              Save Block
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function summarizeUse(use: DesignerUse): string {
  return Object.entries(use.variation).map(([k, v]) => `${k}=${v}`).join(', ');
}

function summarizeIngredient(ing: Ingredient): string {
  if (ing.kind === 'other') return ing.text.trim() || '(untitled)';
  if (ing.description.trim()) return ing.description.trim();
  return ing.designers.length === 0 ? '(empty)' : ing.designers.map(d => d.designerId).join(', ');
}

function FragmentRow({
  day, slots, ingredients, onChange,
}: {
  day: Day;
  slots: [IngredientRef, IngredientRef];
  ingredients: Ingredient[];
  onChange: (day: Day, slot: 0 | 1, ref: IngredientRef) => void;
}) {
  const label = day[0].toUpperCase() + day.slice(1);
  return (
    <>
      <div className="text-gray-700">{label}</div>
      {[0, 1].map(slotNum => {
        const slot = slotNum as 0 | 1;
        const ref = slots[slot];
        return (
          <select
            key={slot}
            value={ref === null ? '' : String(ref)}
            onChange={e => onChange(day, slot, e.target.value === '' ? null : Number(e.target.value))}
            className="w-full min-w-0 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
          >
            <option value="">—</option>
            {ingredients.map((ing, i) => (
              <option key={i} value={i}>[{i + 1}] {summarizeIngredient(ing)}</option>
            ))}
          </select>
        );
      })}
    </>
  );
}
