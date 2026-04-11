import { useState, useEffect } from 'react';
import type { SetTemplate, Workout, WorkoutSet } from './types';
import { createDefaultWorkout, createDefaultSet, calcTotalDistance, generateId, applyVolume } from './utils';
import { loadLibrary, saveWorkoutToLibrary, deleteFromLibrary } from './library';
import { loadSetLibrary, upsertSetTemplate, deleteSetTemplate } from './setLibrary';
import { SetCard } from './SetCard';
import { WorkoutPreview } from './WorkoutPreview';
import { WorkoutLibrary } from './WorkoutLibrary';
import { InsertSetDialog } from './InsertSetDialog';
import { SetTemplateList } from './SetTemplateList';
import { SetTemplateEditor } from './SetTemplateEditor';
import { exportToGarmin } from './garminExport';

const CURRENT_KEY = 'swim-workout-builder-current';

function loadCurrent(): Workout | null {
  try {
    const saved = localStorage.getItem(CURRENT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old workouts without an id
      if (!parsed.id) parsed.id = generateId();
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

type Mode = 'workout' | 'set-template';

function App() {
  const [workout, setWorkout] = useState<Workout>(() => loadCurrent() || createDefaultWorkout());
  const [library, setLibrary] = useState<Workout[]>(() => loadLibrary());
  const [setTemplates, setSetTemplates] = useState<SetTemplate[]>(() => loadSetLibrary());
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<Mode>('workout');
  /** Only meaningful when mode === 'set-template'. null means "creating new". */
  const [editingTemplate, setEditingTemplate] = useState<SetTemplate | null>(null);
  const [insertingSet, setInsertingSet] = useState(false);

  // Auto-save current workout to localStorage
  useEffect(() => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(workout));
  }, [workout]);

  const updateSets = (sets: Workout['sets']) => setWorkout({ ...workout, sets });

  const addSet = () => {
    updateSets([...workout.sets, createDefaultSet()]);
  };

  const moveSet = (index: number, dir: -1 | 1) => {
    const sets = [...workout.sets];
    const target = index + dir;
    if (target < 0 || target >= sets.length) return;
    [sets[index], sets[target]] = [sets[target], sets[index]];
    updateSets(sets);
  };

  const handleExportGarmin = () => {
    const garmin = exportToGarmin(applyVolume(workout));
    const json = JSON.stringify(garmin, null, 2);
    downloadJson(json, `${workout.name || 'workout'}.json`);
  };

  const handleExportFile = () => {
    const json = JSON.stringify(workout, null, 2);
    downloadJson(json, `${workout.name || 'workout'}.swim.json`);
  };

  const handleSave = () => {
    const updated = saveWorkoutToLibrary(workout);
    setLibrary(updated);
    setWorkout({ ...workout, savedAt: new Date().toISOString() });
  };

  const handleNew = () => {
    if (workout.sets.length > 0 && !confirm('Start a new workout? Unsaved changes will be lost.')) return;
    setWorkout(createDefaultWorkout());
  };

  const handleSelectFromLibrary = (w: Workout) => {
    if (
      workout.sets.length > 0 &&
      workout.id !== w.id &&
      !confirm('Load this workout? Unsaved changes will be lost.')
    ) {
      return;
    }
    setWorkout(w);
  };

  const handleCloneFromLibrary = (w: Workout) => {
    setWorkout({ ...w, id: generateId(), name: `${w.name || 'Workout'} (copy)`, savedAt: undefined });
  };

  const handleDeleteFromLibrary = (id: string) => {
    const updated = deleteFromLibrary(id);
    setLibrary(updated);
    if (workout.id === id) {
      setWorkout(createDefaultWorkout());
    }
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.swim.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.sets && Array.isArray(data.sets)) {
            const imported: Workout = { ...data, id: data.id || generateId() };
            const updated = saveWorkoutToLibrary(imported);
            setLibrary(updated);
            setWorkout(imported);
          } else {
            alert('Unrecognized file format.');
          }
        } catch {
          alert('Failed to parse file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveTemplate = (template: SetTemplate) => {
    setSetTemplates(upsertSetTemplate(template));
    setEditingTemplate(template);
  };

  const handleDeleteSetTemplate = (id: string) => {
    setSetTemplates(deleteSetTemplate(id));
    setEditingTemplate(null);
  };

  const handleInsertSetFromLibrary = (set: WorkoutSet) => {
    updateSets([...workout.sets, set]);
    setInsertingSet(false);
  };

  const switchToWorkoutMode = () => {
    if (mode === 'set-template' && !confirm('Discard set template edits?')) return;
    setMode('workout');
    setEditingTemplate(null);
  };

  const switchToSetMode = () => {
    if (mode === 'set-template') return;
    setMode('set-template');
    setEditingTemplate(null);
  };

  const effectiveWorkout = applyVolume(workout);
  const totalDist = calcTotalDistance(effectiveWorkout);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 no-print h-screen sticky top-0 overflow-hidden flex flex-col">
          {mode === 'workout' ? (
            <WorkoutLibrary
              workouts={library}
              currentId={workout.id}
              onSelect={handleSelectFromLibrary}
              onClone={handleCloneFromLibrary}
              onDelete={handleDeleteFromLibrary}
              onImport={handleImportFile}
            />
          ) : (
            <SetTemplateList
              templates={setTemplates}
              currentId={editingTemplate?.id ?? null}
              onSelect={setEditingTemplate}
            />
          )}
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm no-print sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-gray-600 text-lg"
                title={sidebarOpen ? 'Hide library' : 'Show library'}
              >
                {sidebarOpen ? '\u00AB' : '\u00BB'}
              </button>
              <h1 className="text-xl font-bold text-gray-900">Swim Workout Builder</h1>
              <div className="ml-4 flex rounded-lg border border-gray-300 overflow-hidden">
                <ModeButton
                  label="Build Workout"
                  active={mode === 'workout'}
                  onClick={switchToWorkoutMode}
                />
                <ModeButton
                  label="Build Set"
                  active={mode === 'set-template'}
                  onClick={switchToSetMode}
                  borderLeft
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          {mode === 'workout' && (
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
                onClick={handleExportFile}
                disabled={workout.sets.length === 0}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                Export File
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
                Export Garmin
              </button>
            </div>
          )}
          {mode === 'set-template' ? (
            <SetTemplateEditor
              // Remount on selection change so form state re-initializes.
              key={editingTemplate?.id ?? 'new'}
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onDelete={handleDeleteSetTemplate}
            />
          ) : showPreview ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <WorkoutPreview workout={effectiveWorkout} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workout Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Sets */}
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

              {/* Add Set Button */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={addSet}
                  className="px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
                >
                  + Add Set
                </button>
                <button
                  onClick={() => setInsertingSet(true)}
                  className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300"
                >
                  + Insert from Library
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {insertingSet && (
        <InsertSetDialog
          templates={setTemplates}
          onInsert={handleInsertSetFromLibrary}
          onClose={() => setInsertingSet(false)}
        />
      )}
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick,
  borderLeft,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  borderLeft?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium ${borderLeft ? 'border-l border-gray-300' : ''} ${
        active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default App;
