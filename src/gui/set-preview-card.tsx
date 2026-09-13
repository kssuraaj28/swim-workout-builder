import type { WorkoutSet, WorkoutStep, PoolUnit } from '../core/workouts.ts';
import { calcSetBaseDistance } from '../core/workouts.ts';
import { formatTime } from '../core/utils.ts';
import { STROKE_LABELS, EQUIPMENT_LABELS } from './labels.ts';

/** Read-only render of a single WorkoutSet. Used by WorkoutPreview per set, and by SetPreview
 * for on-demand designer previews. */
export function SetPreviewCard({ set, unit = 'yard', index }: { set: WorkoutSet; unit?: PoolUnit; index?: number }) {
  const setDist = calcSetBaseDistance(set);
  const fallbackName = index === undefined ? 'Set' : `Set ${index + 1}`;
  return (
    <div className="border-l-2 border-gray-300 pl-3 text-left text-sm">
      <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">
        {set.name || fallbackName}
        <span className="font-normal text-gray-500 ml-2">
          {set.iterations} &times; {setDist} {unit}s = {set.iterations * setDist} {unit}s
        </span>
      </div>
      {set.steps.map((step, j) => (
        <div key={j} className="flex gap-2 py-0.5">
          <span className="text-gray-400 w-4 text-right shrink-0">{j + 1}.</span>
          <div>
            <span className="text-gray-800">
              {step.repetitions > 1 && <span className="font-semibold">{step.repetitions}&times; </span>}
              {stepSummary(step, unit)}
            </span>
            {step.restType === 'rest' && step.restValue > 0 && (
              <span className="text-gray-400 ml-2">rest {formatTime(step.restValue)}</span>
            )}
            {step.restType === 'interval' && step.restValue > 0 && (
              <span className="text-gray-400 ml-2">on {formatTime(step.restValue)}</span>
            )}
            {step.restType === 'lap_button' && (
              <span className="text-gray-400 ml-2">on lap press</span>
            )}
            {step.description && (
              <span className="text-gray-500 ml-2 italic">&mdash; {step.description}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function stepSummary(step: WorkoutStep, unit: PoolUnit): string {
  const parts: string[] = [];
  parts.push(`${step.distance} ${unit}s`);
  parts.push(STROKE_LABELS[step.strokeType]);
  if (!step.track) parts.push('(drill)');
  if (step.equipment.length > 0) parts.push(`w/ ${step.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}`);
  if (step.targetPace) parts.push(`@ ${step.targetPace}/100`);
  return parts.join(' ');
}
