/* eslint-disable react-refresh/only-export-components -- editor state factory colocated with the component */
import type { Dispatch, SetStateAction } from 'react';
import { STICKY_BELOW_HEADER_TOP, type ShowWarnings, SIDEBAR_HEIGHT } from './header.tsx';
import type { Designer } from '../core/designers.ts';
import type { Block, Day, DesignerUse, Ingredient, IngredientRef, Schedule } from '../core/blocks.ts';
import { DAYS, buildWorkoutFromDay, createDefaultBlock, enumerateDayDesigners } from '../core/blocks.ts';
import type { Workout } from '../core/workouts.ts';
import { ParamInputs, initValues, type Values } from './param-inputs.tsx';
import { SECTION_HEADING } from './styles.ts';
import { SidebarList } from './sidebar-list.tsx';

/** Add-designer panel target: either a brand-new ingredient or an existing one by index. */
type AddTarget = { kind: 'new' } | { kind: 'existing'; index: number };

interface AddState {
  target: AddTarget;
  designerId: string;
  variation: Values;
}

interface InstantiateState {
  day: Day;
  overloads: Values[];  // parallel to enumerateDayDesigners(block, day, designers)
}

/** Editor state lifted to App so it survives tab switches. */
export interface BlockEditor {
  id: string;
  description: string;
  ingredients: Ingredient[];
  schedule: Schedule;
  adding: AddState | null;
  instantiate: InstantiateState | null;
}

export function initialBlockEditor(): BlockEditor {
  return { ...createDefaultBlock(), adding: null, instantiate: null };
}

function toEditor(block: Block): BlockEditor {
  return { ...block, adding: null, instantiate: null };
}

function fromEditor(editor: BlockEditor): Block {
  return {
    id: editor.id,
    description: editor.description,
    ingredients: editor.ingredients,
    schedule: editor.schedule,
  };
}

interface Props {
  designers: Designer[];
  editor: BlockEditor;
  setEditor: Dispatch<SetStateAction<BlockEditor>>;
  blocks: Block[];
  onSaveBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onLoadWorkout: (workout: Workout) => void;
  showWarnings: ShowWarnings;
}

export function BlockBuilder({
  designers, editor, setEditor, blocks, onSaveBlock, onDeleteBlock, onLoadWorkout, showWarnings,
}: Props) {
  const { id, description, ingredients, schedule, adding, instantiate } = editor;
  const setId = (v: string) => setEditor(e => ({ ...e, id: v }));
  const setDescription = (v: string) => setEditor(e => ({ ...e, description: v }));
  const setIngredients = (v: Ingredient[]) => setEditor(e => ({ ...e, ingredients: v }));
  const setSchedule = (v: Schedule) => setEditor(e => ({ ...e, schedule: v }));
  const setAdding = (v: AddState | null | ((prev: AddState | null) => AddState | null)) =>
    setEditor(e => ({ ...e, adding: typeof v === 'function' ? v(e.adding) : v }));
  const setInstantiate = (v: InstantiateState | null) => setEditor(e => ({ ...e, instantiate: v }));

  const openInstantiate = (day: Day) => {
    const dayDesigners = enumerateDayDesigners(fromEditor(editor), day, designers);
    const overloads = dayDesigners.map(d => initValues(d.designer.overload));
    setInstantiate({ day, overloads });
  };

  const updateInstantiateOverload = (i: number, identifier: string, value: string) => {
    if (!instantiate) return;
    const overloads = [...instantiate.overloads];
    overloads[i] = { ...overloads[i], [identifier]: value };
    setInstantiate({ ...instantiate, overloads });
  };

  const loadWorkout = () => {
    if (!instantiate) return;
    const { value, warnings } = buildWorkoutFromDay(fromEditor(editor), instantiate.day, designers, instantiate.overloads);
    onLoadWorkout(value);
    setInstantiate(null);
    showWarnings(`block ${id || '(unsaved)'}: ${titleCase(instantiate.day)}`, warnings);
  };

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
          isEmpty={blocks.length === 0}
          emptyMessage="No blocks yet."
          footer={
            <button
              onClick={() => setEditor(initialBlockEditor())}
              className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
            >
              + New Block
            </button>
          }
        >
          <ul className="p-3 space-y-1">
            {blocks.map(b => (
              <li key={b.id} className="flex items-center gap-1">
                <button
                  onClick={() => setEditor(toEditor(b))}
                  className={`flex-1 min-w-0 text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                    b.id === id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="truncate font-mono">{b.id}</div>
                  {b.description && (
                    <div className="text-xs text-gray-500 truncate">{b.description}</div>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete block "${b.id}"?`)) onDeleteBlock(b.id);
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
            <div className="grid grid-cols-[100px_1fr_1fr_120px] gap-2 items-center text-sm">
              <div></div>
              <div className="text-xs text-gray-500 px-1">slot 1</div>
              <div className="text-xs text-gray-500 px-1">slot 2</div>
              <div></div>
              {DAYS.map(day => (
                <FragmentRow
                  key={day}
                  day={day}
                  slots={schedule[day]}
                  ingredients={ingredients}
                  onChange={updateSlot}
                  onInstantiate={() => openInstantiate(day)}
                />
              ))}
            </div>
          </section>

          {instantiate && (() => {
            const dayLabel = titleCase(instantiate.day);
            const dayDesigners = enumerateDayDesigners(fromEditor(editor), instantiate.day, designers);
            return (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                <h2 className={SECTION_HEADING}>Instantiate {dayLabel}</h2>
                {dayDesigners.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No swim designers scheduled for this day.</p>
                ) : (
                  dayDesigners.map((d, i) => (
                    <div key={i} className="border-t border-gray-100 pt-3">
                      <div className="text-sm font-mono text-gray-900 mb-2">{d.designerId}</div>
                      <ParamInputs
                        title="Overload"
                        params={d.designer.overload}
                        values={instantiate.overloads[i] ?? {}}
                        onChange={(id, v) => updateInstantiateOverload(i, id, v)}
                      />
                    </div>
                  ))
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={loadWorkout}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Load as workout
                  </button>
                  <button
                    onClick={() => setInstantiate(null)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            );
          })()}

          <div className="flex justify-end">
            <button
              onClick={() => onSaveBlock(fromEditor(editor))}
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

function titleCase(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

function FragmentRow({
  day, slots, ingredients, onChange, onInstantiate,
}: {
  day: Day;
  slots: [IngredientRef, IngredientRef];
  ingredients: Ingredient[];
  onChange: (day: Day, slot: 0 | 1, ref: IngredientRef) => void;
  onInstantiate: () => void;
}) {
  const hasAny = slots[0] !== null || slots[1] !== null;
  return (
    <>
      <div className="text-gray-700">{titleCase(day)}</div>
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
      <button
        onClick={onInstantiate}
        disabled={!hasAny}
        className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40 text-left"
      >
        Instantiate &rsaquo;
      </button>
    </>
  );
}
