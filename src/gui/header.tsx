import { useRef } from 'react';
import type { AppState } from '../core/state.ts';
import { FILE_NAME, readStateFromFile } from './import-export.ts';

export type AppMode = 'workout' | 'info';

/** Header height — kept in sync with `h-14` so sidebars can offset their sticky position. */
const HEADER_HEIGHT_CLASS = 'h-14';
export const STICKY_BELOW_HEADER_TOP = 'top-14';
export const SIDEBAR_HEIGHT = 'h-[calc(100vh-3.5rem)]';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onImport: (state: AppState) => void;
  onExport: () => void;
}

export function Header({ mode, onModeChange, onImport, onExport }: HeaderProps) {
  const importRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      onImport(await readStateFromFile(file));
    } catch (err) {
      alert(`Could not read ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm no-print sticky top-0 z-20">
      <div className={`max-w-5xl mx-auto px-4 ${HEADER_HEIGHT_CLASS} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Swim Workout Builder</h1>

          <input
            ref={importRef}
            type="file"
            accept=".cbor,application/cbor"
            className="hidden"
            onChange={e => {
              void handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <StateButton
              label="Import"
              title="Replace everything with a previously exported state file"
              onClick={() => importRef.current?.click()}
            />
            <StateButton
              label="Export"
              title={`Download everything as ${FILE_NAME}`}
              onClick={onExport}
              borderLeft
            />
          </div>

          <div className="ml-4 flex rounded-lg border border-gray-300 overflow-hidden">
            <ModeButton label="Build Workout" active={mode === 'workout'} onClick={() => onModeChange('workout')} />
            <ModeButton label="Info" active={mode === 'info'} onClick={() => onModeChange('info')} borderLeft />
          </div>
        </div>
        <span
          className="text-xs text-gray-400 font-mono"
          title={`Built ${__BUILD_DATE__}`}
        >
          {__BUILD_SHA__}
        </span>
      </div>
    </header>
  );
}

function StateButton({
  label,
  title,
  onClick,
  borderLeft,
}: {
  label: string;
  title: string;
  onClick: () => void;
  borderLeft?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 ${
        borderLeft ? 'border-l border-gray-300' : ''
      }`}
    >
      {label}
    </button>
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
