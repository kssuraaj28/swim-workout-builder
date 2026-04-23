import { useState } from 'react';
import { ENABLE_SET_BUILDER, type AppMode } from './Header';
import { WorkoutBuilder } from './WorkoutBuilder';
import { SetBuilder } from './SetBuilder';
import { InfoPage } from './InfoPage';

function App() {
  const [mode, setMode] = useState<AppMode>('workout');

  const handleModeChange = (next: AppMode) => {
    if (next === mode) return;
    if (next === 'set' && !ENABLE_SET_BUILDER) return;
    if (mode === 'set' && !confirm('Discard set template edits?')) return;
    setMode(next);
  };

  switch (mode) {
    case 'workout':
      return <WorkoutBuilder mode={mode} onModeChange={handleModeChange} />;
    case 'set':
      if (!ENABLE_SET_BUILDER) {
        return <WorkoutBuilder mode="workout" onModeChange={handleModeChange} />;
      }
      return <SetBuilder mode={mode} onModeChange={handleModeChange} />;
    case 'info':
      return <InfoPage mode={mode} onModeChange={handleModeChange} />;
  }
}

export default App;
