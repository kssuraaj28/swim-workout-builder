import type { Workout } from '../core/workouts.ts';
import { calcTotalDistance } from '../core/workouts.ts';
import { SetPreviewCard } from './set-preview-card.tsx';

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
        <h2 className="text-xl font-bold text-gray-900">{workout.id || 'Untitled Workout'}</h2>
        {workout.description && <p className="text-gray-500 mt-1 text-xs italic">{workout.description}</p>}
        <p className="text-gray-700 font-semibold mt-2">
          Total: {totalDist} {unit}s &middot; Pool: {workout.poolLength} {unit} pool
        </p>
      </div>

      {workout.sets.map((set, i) => (
        <div key={i}>
          <SetPreviewCard set={set} unit={unit} index={i} />
          <div className="text-gray-400 text-xs mt-1 pl-3">Rest until lap press before next set</div>
        </div>
      ))}
    </div>
  );
}
