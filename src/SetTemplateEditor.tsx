import { useState } from 'react';
import type { SetParamKey, SetTemplate, WorkoutSet, WorkoutStep } from './types';
import { StepEditor } from './StepEditor';
import { cloneSetFresh, createDefaultSet, createDefaultStep, generateId } from './utils';

interface Props {
  /** null = creating a new template */
  template: SetTemplate | null;
  onSave: (template: SetTemplate) => void;
  onDelete: (id: string) => void;
}

const ALL_PARAMS: { key: SetParamKey; label: string }[] = [
  { key: 'stroke', label: 'Stroke' },
  { key: 'distance', label: 'Distance (scale)' },
  { key: 'iterations', label: 'Repetitions' },
];

export function SetTemplateEditor({ template, onSave, onDelete }: Props) {
  const isNew = template === null;
  const [title, setTitle] = useState(template?.title ?? '');
  const [tagsInput, setTagsInput] = useState(template?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(template?.notes ?? '');
  const [params, setParams] = useState<SetParamKey[]>(template?.params ?? ['stroke']);
  // Clone on init so edits don't mutate the stored template reference.
  const [set, setSet] = useState<WorkoutSet>(() =>
    template ? cloneSetFresh(template.set) : createDefaultSet(),
  );

  const toggleParam = (k: SetParamKey) => {
    setParams(p => (p.includes(k) ? p.filter(x => x !== k) : [...p, k]));
  };

  const updateStep = (index: number, updated: WorkoutStep) => {
    const steps = [...set.steps];
    steps[index] = updated;
    setSet({ ...set, steps });
  };

  const removeStep = (index: number) => {
    setSet({ ...set, steps: set.steps.filter((_, j) => j !== index) });
  };

  const addStep = () => {
    setSet({ ...set, steps: [...set.steps, createDefaultStep()] });
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }
    const now = new Date().toISOString();
    const result: SetTemplate = {
      id: template?.id ?? generateId(),
      title: title.trim(),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      set,
      params,
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(result);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isNew ? 'New Set Template' : 'Edit Set Template'}
          </h2>
          <div className="flex gap-2">
            {template && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${template.title}"?`)) onDelete(template.id);
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-red-50 text-red-600 rounded-lg border border-gray-300"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col text-sm text-gray-600">
            Title
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 8x100 descending"
              className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              autoFocus
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Tags (comma-separated)
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="warmup, threshold, kick"
              className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </label>
        </div>

        <label className="flex flex-col text-sm text-gray-600 mt-4">
          Notes
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none"
          />
        </label>

        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-1">Parameterize (prompt when inserting):</div>
          <div className="flex gap-4">
            {ALL_PARAMS.map(p => (
              <label key={p.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={params.includes(p.key)}
                  onChange={() => toggleParam(p.key)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Set editor */}
      <div className="border border-gray-200 rounded-lg border-l-4 border-l-gray-400 bg-white shadow-sm">
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase">Set</span>
          <label className="flex items-center gap-1 text-sm text-gray-600">
            &times;
            <input
              type="number"
              min={1}
              value={set.iterations}
              onChange={e => setSet({ ...set, iterations: Number(e.target.value) })}
              className="w-14 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
          <label className="flex items-center gap-1 text-sm text-gray-600 ml-auto">
            Rest after set (sec)
            <input
              type="number"
              min={0}
              step={5}
              value={set.restAfterSet}
              onChange={e => setSet({ ...set, restAfterSet: Number(e.target.value) })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
        </div>
        <div className="p-3 space-y-2">
          {set.steps.map((step, i) => (
            <StepEditor
              key={step.id}
              step={step}
              onChange={updated => updateStep(i, updated)}
              onRemove={() => removeStep(i)}
              canRemove={set.steps.length > 1}
            />
          ))}
          <button
            onClick={addStep}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add step
          </button>
        </div>
      </div>
    </div>
  );
}
