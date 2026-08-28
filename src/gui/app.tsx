import { useState } from 'react';
import { Header, type AppMode, type ShowWarnings } from './header.tsx';
import type { Workout } from '../core/workouts.ts';
import type { Designer } from '../core/designers.ts';
import type { AppState } from '../core/state.ts';
import { createEmptyState } from '../core/state.ts';
import { WorkoutBuilder } from './workout-builder.tsx';
import { InfoPage } from './info-page.tsx';
import { DesignSet } from './design-set.tsx';
import { downloadState } from './import-export.ts';

const showWarnings: ShowWarnings = (source, warnings) => {
  if (warnings.length === 0) return;
  alert(`Loaded ${source} with ${warnings.length} warning(s):\n\n${[...warnings].join('\n')}`);
};

function App() {
  const [mode, setMode] = useState<AppMode>('workout');
  const [state, setState] = useState<AppState>(createEmptyState);

  const { workout, library, designers } = state;
  const setWorkout = (workout: Workout) => setState(s => ({ ...s, workout }));
  const setLibrary = (library: Workout[]) => setState(s => ({ ...s, library }));

  const handleExport = () => downloadState(state);

  const handleSaveDesigner = (designer: Designer) => {
    setState(s => ({
      ...s,
      designers: [...s.designers.filter(d => d.id !== designer.id), designer],
    }));
  };

  const handleDeleteDesigner = (id: string) => {
    setState(s => ({ ...s, designers: s.designers.filter(d => d.id !== id) }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        mode={mode}
        onModeChange={setMode}
        onImport={setState}
        onExport={handleExport}
        showWarnings={showWarnings}
      />
      {mode === 'workout' && (
        <WorkoutBuilder
          workout={workout}
          onWorkoutChange={setWorkout}
          library={library}
          onLibraryChange={setLibrary}
          showWarnings={showWarnings}
        />
      )}
      {mode === 'design' && (
        <DesignSet
          designers={designers}
          onSaveDesigner={handleSaveDesigner}
          onDeleteDesigner={handleDeleteDesigner}
        />
      )}
      {mode === 'info' && <InfoPage />}
    </div>
  );
}

export default App;
