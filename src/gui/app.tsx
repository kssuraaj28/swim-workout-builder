import { useState } from 'react';
import { Header, type AppMode, type ShowWarnings } from './header.tsx';
import type { Workout } from '../core/workouts.ts';
import type { AppState } from '../core/state.ts';
import { createEmptyState } from '../core/state.ts';
import { WorkoutBuilder } from './workout-builder.tsx';
import { InfoPage } from './info-page.tsx';
import { downloadState } from './import-export.ts';

const showWarnings: ShowWarnings = (source, warnings) => {
  if (warnings.length === 0) return;
  alert(`Loaded ${source} with ${warnings.length} warning(s):\n\n${[...warnings].join('\n')}`);
};

function App() {
  const [mode, setMode] = useState<AppMode>('workout');
  const [state, setState] = useState<AppState>(createEmptyState);

  const { workout, library } = state;
  const setWorkout = (workout: Workout) => setState(s => ({ ...s, workout }));
  const setLibrary = (library: Workout[]) => setState(s => ({ ...s, library }));

  const handleExport = () => downloadState(state);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        mode={mode}
        onModeChange={setMode}
        onImport={setState}
        onExport={handleExport}
        showWarnings={showWarnings}
      />
      {mode === 'workout' ? (
        <WorkoutBuilder
          workout={workout}
          onWorkoutChange={setWorkout}
          library={library}
          onLibraryChange={setLibrary}
          showWarnings={showWarnings}
        />
      ) : (
        <InfoPage />
      )}
    </div>
  );
}

export default App;
