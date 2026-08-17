import { useState } from 'react';
import type { AppMode } from './Header';
import { WorkoutBuilder } from './WorkoutBuilder';
import { InfoPage } from './InfoPage';

function App() {
  const [mode, setMode] = useState<AppMode>('workout');

  const handleModeChange = (next: AppMode) => {
    if (next === mode) return;
    setMode(next);
  };

  switch (mode) {
    case 'workout':
      return <WorkoutBuilder mode={mode} onModeChange={handleModeChange} />;
    case 'info':
      return <InfoPage mode={mode} onModeChange={handleModeChange} />;
  }
}

export default App;
