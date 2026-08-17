import type { WorkoutSet } from '../core/types';
import { StepEditor } from './step-editor';
import { createDefaultStep } from '../core/utils';

interface SetCardProps {
  set: WorkoutSet;
  index: number;
  onChange: (set: WorkoutSet) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function SetCard({ set, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: SetCardProps) {
  const updateSteps = (newSteps: typeof set.steps) => onChange({ ...set, steps: newSteps });

  return (
    <div className="border border-gray-200 rounded-lg border-l-4 border-l-gray-400 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase">Set {index + 1}</span>

        <input
          type="text"
          value={set.name}
          onChange={e => onChange({ ...set, name: e.target.value })}
          placeholder="Set name (optional)"
          className="px-2 py-1 border border-gray-300 rounded text-sm w-44"
        />

        <label className="flex items-center gap-1 text-sm text-gray-600">
          &times;
          <input
            type="number"
            min={1}
            value={set.iterations}
            onChange={e => onChange({ ...set, iterations: Number(e.target.value) })}
            className="w-14 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </label>

        <div className="flex gap-1 ml-auto">
          <button onClick={onMoveUp} disabled={isFirst} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm px-1" title="Move up">&uarr;</button>
          <button onClick={onMoveDown} disabled={isLast} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm px-1" title="Move down">&darr;</button>
          <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm px-1" title="Remove set">&times;</button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {set.steps.map((step, i) => (
          <StepEditor
            key={step.id}
            step={step}
            onChange={updated => {
              const newSteps = [...set.steps];
              newSteps[i] = updated;
              updateSteps(newSteps);
            }}
            onRemove={() => updateSteps(set.steps.filter((_, j) => j !== i))}
            canRemove={set.steps.length > 1}
          />
        ))}
        <button
          onClick={() => updateSteps([...set.steps, createDefaultStep()])}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add step
        </button>
      </div>
    </div>
  );
}
