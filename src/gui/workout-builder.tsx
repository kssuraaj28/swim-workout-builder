import { useState } from 'react';
import type { Workout, WorkoutKey } from '../core/types.ts';
import { createDefaultWorkout, createDefaultSet, calcTotalDistance, todayDateString } from '../core/utils.ts';
import { DuplicateWorkoutError, removeWorkout, sameKey, upsertWorkout } from '../core/library.ts';
import { buildSetFromCode } from '../core/set-from-code.ts';
import { SetCard } from './set-card.tsx';
import { WorkoutPreview } from './workout-preview.tsx';
import { WorkoutLibrary } from './workout-library.tsx';
import { exportToGarmin } from '../core/garmin-export.ts';
import { STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT } from './header.tsx';

const STARTER_CODE = `return {
  name: 'Main Set',
  iterations: 1,
  steps: [
    { repetitions: 5, distance: 200, strokeType: 'free', restType: 'rest', restValue: 20 },
  ],
};
`;

interface Props {
  workout: Workout;
  onWorkoutChange: (workout: Workout) => void;
  library: Workout[];
  onLibraryChange: (library: Workout[]) => void;
}

export function WorkoutBuilder({
  workout,
  onWorkoutChange,
  library,
  onLibraryChange,
}: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [garminCopied, setGarminCopied] = useState(false);
  const [codeDraft, setCodeDraft] = useState<string | null>(null);

  const updateSets = (sets: Workout['sets']) => onWorkoutChange({ ...workout, sets });

  const addSet = () => updateSets([...workout.sets, createDefaultSet()]);

  const runCodeDraft = () => {
    updateSets([...workout.sets, buildSetFromCode()]);
    setCodeDraft(null);
  };

  const moveSet = (index: number, dir: -1 | 1) => {
    const sets = [...workout.sets];
    const target = index + dir;
    if (target < 0 || target >= sets.length) return;
    [sets[index], sets[target]] = [sets[target], sets[index]];
    updateSets(sets);
  };

  const handleExportGarmin = async () => {
    const garmin = exportToGarmin(workout);
    const json = JSON.stringify(garmin, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setGarminCopied(true);
      setTimeout(() => setGarminCopied(false), 1500);
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleSave = () => {
    const commit = (overwrite: boolean) => {
      onLibraryChange(upsertWorkout(library, workout, { overwrite }));
      onWorkoutChange({ ...workout, savedAt: new Date().toISOString() });
    };
    try {
      commit(false);
    } catch (err) {
      if (err instanceof DuplicateWorkoutError) {
        if (confirm(`${err.message}\n\nOverwrite it?`)) commit(true);
      } else {
        throw err;
      }
    }
  };

  const handleNew = () => {
    if (workout.sets.length > 0 && !confirm('Start a new workout? Unsaved changes will be lost.')) return;
    onWorkoutChange(createDefaultWorkout());
  };

  const handleSelectFromLibrary = (w: Workout) => {
    if (
      workout.sets.length > 0 &&
      !sameKey(workout, w) &&
      !confirm('Load this workout? Unsaved changes will be lost.')
    ) {
      return;
    }
    onWorkoutChange(w);
  };

  const handleCloneFromLibrary = (w: Workout) => {
    onWorkoutChange({
      ...w,
      name: `${w.name || 'Workout'} (copy)`,
      createdAt: todayDateString(),
      savedAt: undefined,
    });
  };

  const handleDeleteFromLibrary = (key: WorkoutKey) => {
    onLibraryChange(removeWorkout(library, key));
    if (sameKey(workout, key)) onWorkoutChange(createDefaultWorkout());
  };

  const totalDist = calcTotalDistance(workout);

  return (
    <div className="flex">
        <aside className={`w-64 shrink-0 bg-white border-r border-gray-200 no-print sticky ${STICKY_BELOW_HEADER_TOP} ${SIDEBAR_HEIGHT} overflow-hidden flex flex-col`}>
          <WorkoutLibrary
            workouts={library}
            currentKey={{ name: workout.name, createdAt: workout.createdAt }}
            onSelect={handleSelectFromLibrary}
            onClone={handleCloneFromLibrary}
            onDelete={handleDeleteFromLibrary}
          />
        </aside>

        <div className="flex-1 min-w-0">
          <main className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <button
              onClick={handleNew}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
            >
              New
            </button>
            <button
              onClick={handleSave}
              disabled={workout.sets.length === 0}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 disabled:opacity-50"
              title="Add this workout to the library (in memory)"
            >
              Save
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleExportGarmin}
              disabled={workout.sets.length === 0}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 ml-auto"
            >
              {garminCopied ? 'Copied!' : 'Copy Garmin Export Json'}
            </button>
          </div>

          {showPreview ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <WorkoutPreview workout={workout} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex flex-col text-sm text-gray-600">
                    Workout Name
                    <input
                      type="text"
                      value={workout.name}
                      onChange={e => onWorkoutChange({ ...workout, name: e.target.value })}
                      placeholder="e.g. Swim Workout"
                      className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col text-sm text-gray-600">
                    Created
                    <input
                      type="date"
                      value={workout.createdAt}
                      onChange={e => onWorkoutChange({ ...workout, createdAt: e.target.value })}
                      className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col text-sm text-gray-600">
                    Pool
                    <select
                      value={`${workout.poolLength}-${workout.poolLengthUnit}`}
                      onChange={e => {
                        const [len, unit] = e.target.value.split('-');
                        onWorkoutChange({ ...workout, poolLength: Number(len), poolLengthUnit: unit as 'yard' | 'meter' });
                      }}
                      className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="25-yard">25 yard</option>
                      <option value="25-meter">25 m</option>
                      <option value="50-meter">50 m</option>
                    </select>
                  </label>
                </div>
                <label className="flex flex-col text-sm text-gray-600 mt-4">
                  Description
                  <textarea
                    value={workout.description}
                    onChange={e => onWorkoutChange({ ...workout, description: e.target.value })}
                    placeholder="Workout description..."
                    rows={2}
                    className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none"
                  />
                </label>
                {totalDist > 0 && (
                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    Total Distance: {totalDist} {workout.poolLengthUnit}s
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {workout.sets.map((set, i) => (
                  <SetCard
                    key={i}
                    set={set}
                    index={i}
                    onChange={updated => {
                      const sets = [...workout.sets];
                      sets[i] = updated;
                      updateSets(sets);
                    }}
                    onRemove={() => updateSets(workout.sets.filter((_, j) => j !== i))}
                    onMoveUp={() => moveSet(i, -1)}
                    onMoveDown={() => moveSet(i, 1)}
                    isFirst={i === 0}
                    isLast={i === workout.sets.length - 1}
                  />
                ))}
              </div>

              {codeDraft !== null && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      New Set from Code
                    </span>
                    <span className="text-xs text-gray-400">
                      Not wired up yet — inserts a fixed 5 &times; 200
                    </span>
                  </div>
                  <textarea
                    value={codeDraft}
                    onChange={e => setCodeDraft(e.target.value)}
                    spellCheck={false}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={runCodeDraft}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Run
                    </button>
                    <button
                      onClick={() => setCodeDraft(null)}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <button
                  onClick={addSet}
                  className="px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
                >
                  + Add Set
                </button>
                <button
                  onClick={() => setCodeDraft(STARTER_CODE)}
                  disabled={codeDraft !== null}
                  className="px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 disabled:opacity-50"
                >
                  + Add Set from Code
                </button>
              </div>
            </div>
          )}
          </main>
        </div>
    </div>
  );
}
