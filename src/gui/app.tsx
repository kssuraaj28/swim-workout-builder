import { useState } from 'react';
import { Header, type AppMode, type ShowWarnings } from './header.tsx';
import type { Workout } from '../core/workouts.ts';
import { createDefaultWorkout } from '../core/workouts.ts';
import type { Designer } from '../core/designers.ts';
import type { Block } from '../core/blocks.ts';
import type { AppState } from '../core/state.ts';
import { createEmptyState } from '../core/state.ts';
import { hasId, removeById, upsertById } from '../core/library.ts';
import { WorkoutBuilder } from './workout-builder.tsx';
import { InfoPage } from './info-page.tsx';
import { DesignSet, initialDesignerEditor, type DesignerEditor } from './design-set.tsx';
import { BlockBuilder, initialBlockEditor, type BlockEditor } from './block-builder.tsx';
import { downloadState } from './import-export.ts';

const showWarnings: ShowWarnings = (source, warnings) => {
  if (warnings.length === 0) return;
  alert(`Loaded ${source} with ${warnings.length} warning(s):\n\n${[...warnings].join('\n')}`);
};

/** Prompt before overwriting an existing library entry; returns the new list, or null if cancelled. */
function saveWithConfirm<T extends { id: string }>(items: T[], item: T, kind: string): T[] | null {
  if (hasId(items, item.id) && !confirm(`Overwrite ${kind} "${item.id}"?`)) return null;
  return upsertById(items, item);
}

function App() {
  const [mode, setMode] = useState<AppMode>('workout');
  const [state, setState] = useState<AppState>(createEmptyState);
  const [workout, setWorkout] = useState<Workout>(createDefaultWorkout);
  const [designerEditor, setDesignerEditor] = useState<DesignerEditor>(initialDesignerEditor);
  const [blockEditor, setBlockEditor] = useState<BlockEditor>(initialBlockEditor);

  const { library, designers, blocks } = state;

  const handleExport = () => downloadState(state);

  const handleSaveWorkout = (w: Workout) => {
    const stamped = { ...w, savedAt: new Date().toISOString() };
    const next = saveWithConfirm(library, stamped, 'workout');
    if (next) {
      setState(s => ({ ...s, library: next }));
      setWorkout(stamped);
    }
  };

  const handleDeleteWorkout = (id: string) => {
    setState(s => ({ ...s, library: removeById(s.library, id) }));
    if (workout.id === id) setWorkout(createDefaultWorkout());
  };

  const handleNewWorkout = () => setWorkout(createDefaultWorkout());

  const handleSaveDesigner = (designer: Designer) => {
    const next = saveWithConfirm(designers, designer, 'designer');
    if (next) setState(s => ({ ...s, designers: next }));
  };

  const handleDeleteDesigner = (id: string) => {
    setState(s => ({ ...s, designers: removeById(s.designers, id) }));
  };

  const handleSaveBlock = (block: Block) => {
    const next = saveWithConfirm(blocks, block, 'block');
    if (next) setState(s => ({ ...s, blocks: next }));
  };

  const handleDeleteBlock = (id: string) => {
    setState(s => ({ ...s, blocks: removeById(s.blocks, id) }));
  };

  const handleLoadWorkout = (w: Workout) => {
    setWorkout(w);
    setMode('workout');
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
          onSaveWorkout={handleSaveWorkout}
          onDeleteWorkout={handleDeleteWorkout}
          onNewWorkout={handleNewWorkout}
          designers={designers}
          showWarnings={showWarnings}
        />
      )}
      {mode === 'design' && (
        <DesignSet
          designers={designers}
          onSaveDesigner={handleSaveDesigner}
          onDeleteDesigner={handleDeleteDesigner}
          showWarnings={showWarnings}
          editor={designerEditor}
          setEditor={setDesignerEditor}
        />
      )}
      {mode === 'block' && (
        <BlockBuilder
          designers={designers}
          editor={blockEditor}
          setEditor={setBlockEditor}
          blocks={blocks}
          onSaveBlock={handleSaveBlock}
          onDeleteBlock={handleDeleteBlock}
          onLoadWorkout={handleLoadWorkout}
          showWarnings={showWarnings}
        />
      )}
      {mode === 'info' && <InfoPage />}
    </div>
  );
}

export default App;
