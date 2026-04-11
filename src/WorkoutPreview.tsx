import type { Workout, WorkoutStep } from './types';
import {
  STROKE_LABELS,
  EQUIPMENT_LABELS,
} from './types';
import { formatTime, calcTotalDistance } from './utils';

function stepSummary(step: WorkoutStep, unit: string): string {
  const parts: string[] = [];
  parts.push(`${step.distance} ${unit}s`);
  parts.push(STROKE_LABELS[step.strokeType]);
  if (step.drillType) parts.push(`(${step.drillType})`);
  if (step.equipment.length > 0) parts.push(`w/ ${step.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}`);
  if (step.targetPace) parts.push(`@ ${step.targetPace}/100`);
  return parts.join(' ');
}

export function WorkoutPreview({ workout }: { workout: Workout }) {
  const totalDist = calcTotalDistance(workout);
  const unit = workout.poolLengthUnit;

  if (workout.sets.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">
        Add sets to see a preview
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left text-sm">
      <div className="text-center border-b border-gray-200 pb-3">
        <h2 className="text-xl font-bold text-gray-900">{workout.name || 'Untitled Workout'}</h2>
        {workout.description && <p className="text-gray-500 mt-1 text-xs italic">{workout.description}</p>}
        <p className="text-gray-700 font-semibold mt-2">
          Total: {totalDist} {unit}s &middot; Pool: {workout.poolLength} {unit} pool
        </p>
      </div>

      {workout.sets.map((set, i) => {
        const setDist = set.steps.reduce((d, s) => d + s.distance * s.repetitions, 0);
        return (
          <div key={set.id} className="border-l-2 border-gray-300 pl-3">
            <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">
              {set.name || `Set ${i + 1}`}
              <span className="font-normal text-gray-500 ml-2">
                {set.iterations} &times; {setDist} {unit}s = {set.iterations * setDist} {unit}s
              </span>
            </div>
            {set.steps.map((step, j) => (
              <div key={step.id} className="flex gap-2 py-0.5">
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
                    <span className="text-gray-500 ml-2 italic">— {step.description}</span>
                  )}
                </div>
              </div>
            ))}
            {set.restAfterSet > 0 && (
              <div className="text-gray-400 text-xs mt-1">Rest {formatTime(set.restAfterSet)} before next set</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
