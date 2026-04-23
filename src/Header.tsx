export type AppMode = 'workout' | 'set' | 'info';

// Flip to true to re-enable the Build Set tab and route.
// TODO: This is WIP
export const ENABLE_SET_BUILDER = false;

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ mode, onModeChange, sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm no-print sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="text-gray-400 hover:text-gray-600 text-lg"
              title={sidebarOpen ? 'Hide library' : 'Show library'}
            >
              {sidebarOpen ? '«' : '»'}
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">Swim Workout Builder</h1>
          <div className="ml-4 flex rounded-lg border border-gray-300 overflow-hidden">
            <ModeButton label="Build Workout" active={mode === 'workout'} onClick={() => onModeChange('workout')} />
            {ENABLE_SET_BUILDER && (
              <ModeButton label="Build Set" active={mode === 'set'} onClick={() => onModeChange('set')} borderLeft />
            )}
            <ModeButton label="Info" active={mode === 'info'} onClick={() => onModeChange('info')} borderLeft />
          </div>
        </div>
      </div>
    </header>
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
