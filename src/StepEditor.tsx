import type {
  WorkoutStep,
  StrokeType,
  EquipmentType,
  RestType,
} from './types';
import {
  STROKE_LABELS,
  EQUIPMENT_LABELS,
} from './types';

interface StepEditorProps {
  step: WorkoutStep;
  onChange: (step: WorkoutStep) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function StepEditor({ step, onChange, onRemove, canRemove }: StepEditorProps) {
  const update = (patch: Partial<WorkoutStep>) => onChange({ ...step, ...patch });

  return (
    <div className="flex flex-wrap items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-wrap gap-2 flex-1 min-w-0">
        <label className="flex flex-col text-xs text-gray-500">
          Reps
          <input
            type="number"
            min={1}
            value={step.repetitions}
            onChange={e => update({ repetitions: Number(e.target.value) })}
            className="w-16 mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
          />
        </label>

        <label className="flex flex-col text-xs text-gray-500">
          Distance
          <input
            type="number"
            min={25}
            step={25}
            value={step.distance}
            onChange={e => update({ distance: Number(e.target.value) })}
            className="w-20 mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
          />
        </label>

        <label className="flex flex-col text-xs text-gray-500">
          Stroke
          <select
            value={step.strokeType}
            onChange={e => update({ strokeType: e.target.value as StrokeType })}
            className="mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
          >
            {Object.entries(STROKE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs text-gray-500" title="Use this for drills / kick">
          Trackable
          <input
            type="checkbox"
            checked={step.trackable}
            onChange={e => update({ trackable: e.target.checked })}
            className="mt-1 self-start rounded border-gray-300"
          />
        </label>

        <label className="flex flex-col text-xs text-gray-500">
          Target Pace
          <input
            type="text"
            value={step.targetPace}
            onChange={e => update({ targetPace: e.target.value })}
            placeholder="1:30"
            className="w-20 mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
          />
        </label>

        <div className="flex flex-col text-xs text-gray-500">
          Equipment
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
            {Object.entries(EQUIPMENT_LABELS).filter(([k]) => k !== 'none').map(([k, v]) => (
              <label key={k} className="flex items-center gap-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={step.equipment.includes(k as EquipmentType)}
                  onChange={e => {
                    const eq = k as EquipmentType;
                    update({
                      equipment: e.target.checked
                        ? [...step.equipment, eq]
                        : step.equipment.filter(e2 => e2 !== eq),
                    });
                  }}
                  className="rounded border-gray-300"
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        <label className="flex flex-col text-xs text-gray-500">
          Rest Type
          <select
            value={step.restType}
            onChange={e => update({ restType: e.target.value as RestType })}
            className="mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
          >
            <option value="rest">Rest</option>
            <option value="interval">Interval</option>
            <option value="lap_button">On Lap Press</option>
          </select>
        </label>

        {step.restType !== 'lap_button' && (
          <label className="flex flex-col text-xs text-gray-500">
            {step.restType === 'rest' ? 'Rest (sec)' : 'Sendoff (sec)'}
            <input
              type="number"
              min={0}
              step={5}
              value={step.restValue}
              onChange={e => update({ restValue: Number(e.target.value) })}
              className="w-20 mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
            />
          </label>
        )}

        <label className="flex flex-col text-xs text-gray-500 flex-1 min-w-[140px]">
          Notes
          <input
            type="text"
            value={step.description}
            onChange={e => update({ description: e.target.value })}
            placeholder="e.g. focus on catch"
            className="mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
          />
        </label>
      </div>

      {canRemove && (
        <button
          onClick={onRemove}
          className="mt-4 text-red-400 hover:text-red-600 text-lg leading-none px-1"
          title="Remove step"
        >
          &times;
        </button>
      )}
    </div>
  );
}
