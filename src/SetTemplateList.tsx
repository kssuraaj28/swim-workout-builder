import type { SetTemplate } from './types';
import { calcSetBaseDistance } from './utils';
import { useTemplateFilter } from './useTemplateFilter';

interface Props {
  templates: SetTemplate[];
  currentId: string | null;
  onSelect: (template: SetTemplate) => void;
}

export function SetTemplateList({ templates, currentId, onSelect }: Props) {
  const { search, setSearch, activeTag, setActiveTag, allTags, filtered } =
    useTemplateFilter(templates);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Set Templates</h2>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-gray-400 p-3">No saved sets yet.</p>
      ) : (
        <>
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <TagChip label="All" active={!activeTag} onClick={() => setActiveTag(null)} />
                {allTags.map(tag => (
                  <TagChip
                    key={tag}
                    label={tag}
                    active={activeTag === tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 p-3">No matches.</p>
            ) : (
              <ul>
                {filtered.map(t => (
                  <SetTemplateRow
                    key={t.id}
                    template={t}
                    isActive={t.id === currentId}
                    onSelect={() => onSelect(t)}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SetTemplateRow({
  template,
  isActive,
  onSelect,
}: {
  template: SetTemplate;
  isActive: boolean;
  onSelect: () => void;
}) {
  const baseDist = calcSetBaseDistance(template.set);
  return (
    <li className={`border-b border-gray-100 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <button onClick={onSelect} className="w-full text-left p-3">
        <div className="text-sm font-medium text-gray-900 truncate">{template.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {template.set.iterations}&times; {baseDist}
          {template.tags.length > 0 && <span className="ml-2">{template.tags.join(', ')}</span>}
        </div>
      </button>
    </li>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-0.5 rounded-full border ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
