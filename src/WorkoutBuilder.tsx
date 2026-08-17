import { useState, useEffect } from 'react';
import type { Workout } from './types';
import { createDefaultWorkout, createDefaultSet, calcTotalDistance, todayDateString } from './utils';
import { loadLibrary, saveWorkoutToLibrary, deleteFromLibrary, DuplicateWorkoutError, type WorkoutKey } from './library';
import { SetCard } from './SetCard';
import { WorkoutPreview } from './WorkoutPreview';
import { WorkoutLibrary } from './WorkoutLibrary';
import { exportToGarmin } from './garminExport';
import { Header, STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT, type AppMode } from './Header';

const CURRENT_KEY = 'swim-workout-builder-current';

function loadCurrent(): Workout | null {
  try {
    const saved = localStorage.getItem(CURRENT_KEY);
    if (saved) {
      const parsed: Workout = JSON.parse(saved);
      if (!parsed.createdAt) parsed.createdAt = todayDateString();
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function WorkoutBuilder({ mode, onModeChange }: Props) {
  const [workout, setWorkout] = useState<Workout>(() => loadCurrent() || createDefaultWorkout());
  const [library, setLibrary] = useState<Workout[]>(() => loadLibrary());
  const [showPreview, setShowPreview] = useState(false);
  const [garminCopied, setGarminCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(workout));
  }, [workout]);

  const updateSets = (sets: Workout['sets']) => setWorkout({ ...workout, sets });

  const addSet = () => updateSets([...workout.sets, createDefaultSet()]);

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
      const updated = saveWorkoutToLibrary(workout, { overwrite });
      setLibrary(updated);
      setWorkout({ ...workout, savedAt: new Date().toISOString() });
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
    setWorkout(createDefaultWorkout());
  };

  const handleSelectFromLibrary = (w: Workout) => {
    const sameKey = workout.name === w.name && workout.createdAt === w.createdAt;
    if (
      workout.sets.length > 0 &&
      !sameKey &&
      !confirm('Load this workout? Unsaved changes will be lost.')
    ) {
      return;
    }
    setWorkout(w);
  };

  const handleCloneFromLibrary = (w: Workout) => {
    setWorkout({
      ...w,
      name: `${w.name || 'Workout'} (copy)`,
      createdAt: todayDateString(),
      savedAt: undefined,
    });
  };

  const handleDeleteFromLibrary = (key: WorkoutKey) => {
    const updated = deleteFromLibrary(key);
    setLibrary(updated);
    if (workout.name === key.name && workout.createdAt === key.createdAt) {
      setWorkout(createDefaultWorkout());
    }
  };

  const totalDist = calcTotalDistance(workout);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header mode={mode} onModeChange={onModeChange} />

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
          <div className="flex gap-2 flex-wrap mb-4">
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
                      onChange={e => setWorkout({ ...workout, name: e.target.value })}
                      placeholder="e.g. Swim Workout"
                      className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col text-sm text-gray-600">
                    Created
                    <input
                      type="date"
                      value={workout.createdAt}
                      onChange={e => setWorkout({ ...workout, createdAt: e.target.value })}
                      className="mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col text-sm text-gray-600">
                    Pool
                    <select
                      value={`${workout.poolLength}-${workout.poolLengthUnit}`}
                      onChange={e => {
                        const [len, unit] = e.target.value.split('-');
                        setWorkout({ ...workout, poolLength: Number(len), poolLengthUnit: unit as 'yard' | 'meter' });
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
                    onChange={e => setWorkout({ ...workout, description: e.target.value })}
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
                    key={set.id}
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

              <div className="flex justify-center gap-2">
                <button
                  onClick={addSet}
                  className="px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
                >
                  + Add Set
                </button>
              </div>
            </div>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}
