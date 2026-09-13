import type { WorkoutSet } from '../core/workouts.ts';
import { SetPreviewCard } from './set-preview-card.tsx';

/** Preview toggle for a single set. Parent owns the value; button click computes when hidden,
 * clears when shown. Rendered set is read-only via SetPreviewCard. */
export function SetPreview({
  value, onChange, compute,
}: {
  value: WorkoutSet | null;
  onChange: (v: WorkoutSet | null) => void;
  compute: () => WorkoutSet;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onChange(value === null ? compute() : null)}
        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
      >
        {value === null ? 'Preview' : 'Hide preview'}
      </button>
      {value && (
        <div className="pt-2">
          <SetPreviewCard set={value} />
        </div>
      )}
    </div>
  );
}
