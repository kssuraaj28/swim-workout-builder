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
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {/* Row 1 — the swim */}
        <div className="flex flex-wrap items-end gap-2">
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

          <span className="mb-1.5 text-gray-400 text-sm">×</span>

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

          <label className="flex flex-col text-xs text-gray-500">
            Target Pace
            <input
              type="text"
              value={step.targetPace}
              onChange={e => update({ targetPace: e.target.value })}
              /*placeholder="1:30" */
              className="w-20 mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
            />
          </label>

          <label className="flex flex-col items-center text-xs text-gray-500" title="Untick for drills / kick (exported as Garmin drill stroke)">
            Track?
            <input
              type="checkbox"
              checked={step.track}
              onChange={e => update({ track: e.target.checked })}
              className="mt-1 rounded border-gray-300"
            />
          </label>
        </div>

        {/* Row 2 — context */}
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2 pt-2 border-t border-gray-200">
          <div className="flex flex-col text-xs text-gray-500">
            Equipment
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-0.5 py-1.5">
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
              <option value="rest">Fixed</option>
              <option value="interval">Interval</option>
              <option value="lap_button">On Lap Press</option>
            </select>
          </label>

          {step.restType !== 'lap_button' && (
            <label className="flex flex-col text-xs text-gray-500">
              {step.restType === 'rest' ? 'Fixed (sec)' : 'Sendoff (sec)'}
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
        </div>
      </div>

      <label className="flex flex-col text-xs text-gray-500 w-72 shrink-0 self-stretch">
        Notes
        <textarea
          value={step.description}
          onChange={e => update({ description: e.target.value })}
          placeholder="e.g. focus on catch"
          className="mt-0.5 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 flex-1 resize-none min-h-[6rem]"
        />
      </label>

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
