import { SidebarList } from './sidebar-list.tsx';

/** Generic library sidebar: title + list with delete + `+ New` footer. Used by Build Workout,
 * Design Set, and Block Builder — each supplies items and per-item label/subtitle. */
export function LibrarySidebar<T extends { id: string }>({
  title, items, currentId, onSelect, onDelete, onNew, labelOf, subtitleOf, deleteKind, newLabel,
}: {
  title: string;
  items: T[];
  currentId: string;
  onSelect: (item: T) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  labelOf: (item: T) => string;
  subtitleOf?: (item: T) => string | undefined;
  deleteKind: string;
  newLabel: string;
}) {
  return (
    <SidebarList
      title={title}
      isEmpty={items.length === 0}
      emptyMessage={`No ${deleteKind}s yet.`}
      footer={
        <button
          onClick={onNew}
          className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
        >
          {newLabel}
        </button>
      }
    >
      <ul className="p-3 space-y-1">
        {items.map(item => {
          const subtitle = subtitleOf?.(item);
          return (
            <li key={item.id} className="flex items-center gap-1">
              <button
                onClick={() => onSelect(item)}
                className={`flex-1 min-w-0 text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                  item.id === currentId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="truncate font-mono">{labelOf(item)}</div>
                {subtitle && (
                  <div className="text-xs text-gray-500 truncate">{subtitle}</div>
                )}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${deleteKind} "${item.id}"?`)) onDelete(item.id);
                }}
                className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                title="Delete"
              >
                &times;
              </button>
            </li>
          );
        })}
      </ul>
    </SidebarList>
  );
}
