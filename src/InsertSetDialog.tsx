import { useState } from 'react';
import type { SetTemplate, StrokeType, WorkoutSet } from './types';
import { STROKE_LABELS } from './types';
import { applySetOverrides, calcSetBaseDistance, cloneSetFresh } from './utils';
import { useTemplateFilter } from './useTemplateFilter';

interface Props {
  templates: SetTemplate[];
  onInsert: (set: WorkoutSet) => void;
  onClose: () => void;
}

const STROKE_KEYS = Object.keys(STROKE_LABELS) as StrokeType[];

export function InsertSetDialog({ templates, onInsert, onClose }: Props) {
  const { search, setSearch, activeTag, setActiveTag, allTags, filtered } =
    useTemplateFilter(templates);
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const selected = templates.find(t => t.id === selectedId) ?? null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Insert Set from Library</h2>

        {templates.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">
            No saved sets yet. Create one from the Build Set page.
          </div>
        ) : (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left: list */}
            <div className="w-1/2 flex flex-col min-h-0">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  <TagChip label="All" active={!activeTag} onClick={() => setActiveTag(null)} />
                  {allTags.map(tag => (
                    <TagChip
                      key={tag}
                      label={tag}
                      active={activeTag === tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    />
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                {filtered.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-2 border-b border-gray-100 ${
                      selectedId === t.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {t.set.iterations}&times; {calcSetBaseDistance(t.set)}
                      {t.tags.length > 0 && `  ·  ${t.tags.join(', ')}`}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-gray-400 p-3 text-center">No matches.</div>
                )}
              </div>
            </div>

            {/* Right: preview + parameters */}
            <div className="w-1/2 flex flex-col min-h-0 overflow-y-auto">
              {selected ? (
                // `key` remounts the form when the selection changes, so defaults re-initialize.
                <TemplateInsertForm key={selected.id} template={selected} onInsert={onInsert} />
              ) : (
                <div className="text-sm text-gray-400">Select a template.</div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Form for previewing a template and entering parameter overrides.
 * Remounted (via `key`) whenever the selected template changes so that
 * override defaults reinitialize cleanly.
 */
function TemplateInsertForm({
  template,
  onInsert,
}: {
  template: SetTemplate;
  onInsert: (set: WorkoutSet) => void;
}) {
  const baseDist = calcSetBaseDistance(template.set);
  const [stroke, setStroke] = useState<StrokeType | ''>('');
  const [newDistance, setNewDistance] = useState<string>(String(baseDist));
  const [iterations, setIterations] = useState<string>(String(template.set.iterations));

  const handleInsert = () => {
    const targetDist = Number(newDistance) || baseDist;
    const applied = applySetOverrides(template.set, {
      stroke: template.params.includes('stroke') && stroke ? stroke : undefined,
      distanceScale:
        template.params.includes('distance') && baseDist > 0 ? targetDist / baseDist : 1,
      iterations: template.params.includes('iterations')
        ? Number(iterations) || template.set.iterations
        : undefined,
    });
    onInsert(cloneSetFresh(applied));
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
      {template.notes && <p className="text-xs text-gray-500 mb-2">{template.notes}</p>}

      <div className="border border-gray-200 rounded p-2 mb-3 bg-gray-50 text-xs">
        <div className="font-medium text-gray-700 mb-1">{template.set.iterations}&times; through:</div>
        {template.set.steps.map(step => (
          <div key={step.id} className="text-gray-600">
            {step.repetitions > 1 && `${step.repetitions}× `}
            {step.distance} {STROKE_LABELS[step.strokeType]}
            {step.description && ` — ${step.description}`}
          </div>
        ))}
      </div>

      {template.params.length === 0 ? (
        <div className="text-xs text-gray-400 mb-3">No parameters — will insert as-is.</div>
      ) : (
        <div className="space-y-2 mb-3">
          {template.params.includes('stroke') && (
            <label className="flex flex-col text-sm text-gray-600">
              Stroke
              <select
                value={stroke}
                onChange={e => setStroke(e.target.value as StrokeType | '')}
                className="mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
              >
                <option value="">(keep original)</option>
                {STROKE_KEYS.map(s => (
                  <option key={s} value={s}>
                    {STROKE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {template.params.includes('distance') && (
            <label className="flex flex-col text-sm text-gray-600">
              Total distance per round
              <input
                type="number"
                min={1}
                value={newDistance}
                onChange={e => setNewDistance(e.target.value)}
                className="mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
              />
            </label>
          )}
          {template.params.includes('iterations') && (
            <label className="flex flex-col text-sm text-gray-600">
              Repetitions
              <input
                type="number"
                min={1}
                value={iterations}
                onChange={e => setIterations(e.target.value)}
                className="mt-1 px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
              />
            </label>
          )}
        </div>
      )}

      <button
        onClick={handleInsert}
        className="self-start px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
      >
        Insert
      </button>
    </>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded-full border ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
