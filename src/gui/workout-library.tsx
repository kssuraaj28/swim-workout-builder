import type { Workout, WorkoutKey } from '../core/types';
import { calcTotalDistance } from '../core/utils';

interface WorkoutLibraryProps {
  workouts: Workout[];
  currentKey: WorkoutKey;
  onSelect: (workout: Workout) => void;
  onClone: (workout: Workout) => void;
  onDelete: (key: WorkoutKey) => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function WorkoutLibrary({ workouts, currentKey, onSelect, onClone, onDelete }: WorkoutLibraryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Library</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {workouts.length === 0 ? (
          <p className="text-xs text-gray-400 p-3">No saved workouts yet. Click Save to add one.</p>
        ) : (
          <ul>
            {workouts.map((w, i) => {
              const dist = calcTotalDistance(w);
              const isActive = w.name === currentKey.name && w.createdAt === currentKey.createdAt;
              return (
                <li
                  key={`${w.name}-${w.createdAt}-${i}`}
                  className={`border-b border-gray-100 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <button
                    onClick={() => onSelect(w)}
                    className="w-full text-left p-3"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {w.name || 'Untitled'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {dist > 0 && <span>{dist} {w.poolLengthUnit}s</span>}
                      {w.savedAt && <span className="ml-2">{formatDate(w.savedAt)}</span>}
                    </div>
                  </button>
                  <div className="flex gap-2 px-3 pb-2">
                    <button
                      onClick={() => onClone(w)}
                      className="text-xs text-gray-400 hover:text-blue-600"
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${w.name || 'Untitled'}"?`)) onDelete({ name: w.name, createdAt: w.createdAt });
                      }}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
