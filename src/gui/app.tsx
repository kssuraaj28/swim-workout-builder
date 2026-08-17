import { useState } from 'react';
import { Header, type AppMode } from './header';
import type { Workout } from '../core/types';
import type { AppState } from '../core/state';
import { createEmptyState } from '../core/state';
import { WorkoutBuilder } from './workout-builder';
import { InfoPage } from './info-page';
import { downloadState } from './import-export';

function App() {
  const [mode, setMode] = useState<AppMode>('workout');
  const [state, setState] = useState<AppState>(createEmptyState);

  const { workout, library } = state;
  const setWorkout = (workout: Workout) => setState(s => ({ ...s, workout }));
  const setLibrary = (library: Workout[]) => setState(s => ({ ...s, library }));

  const handleExport = () => downloadState(state);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header mode={mode} onModeChange={setMode} onImport={setState} onExport={handleExport} />
      {mode === 'workout' ? (
        <WorkoutBuilder
          workout={workout}
          onWorkoutChange={setWorkout}
          library={library}
          onLibraryChange={setLibrary}
        />
      ) : (
        <InfoPage />
      )}
    </div>
  );
}

export default App;
