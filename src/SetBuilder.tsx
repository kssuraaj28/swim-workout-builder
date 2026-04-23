import { useState } from 'react';
import type { SetTemplate } from './types';
import { loadSetLibrary, upsertSetTemplate, deleteSetTemplate } from './setLibrary';
import { SetTemplateList } from './SetTemplateList';
import { SetTemplateEditor } from './SetTemplateEditor';
import { Header, type AppMode } from './Header';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function SetBuilder({ mode, onModeChange, sidebarOpen, onToggleSidebar }: Props) {
  const [setTemplates, setSetTemplates] = useState<SetTemplate[]>(() => loadSetLibrary());
  const [editingTemplate, setEditingTemplate] = useState<SetTemplate | null>(null);

  const handleSaveTemplate = (template: SetTemplate) => {
    setSetTemplates(upsertSetTemplate(template));
    setEditingTemplate(template);
  };

  const handleDeleteSetTemplate = (id: string) => {
    setSetTemplates(deleteSetTemplate(id));
    setEditingTemplate(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && (
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 no-print h-screen sticky top-0 overflow-hidden flex flex-col">
          <SetTemplateList
            templates={setTemplates}
            currentId={editingTemplate?.id ?? null}
            onSelect={setEditingTemplate}
          />
        </aside>
      )}

      <div className="flex-1 min-w-0">
        <Header
          mode={mode}
          onModeChange={onModeChange}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
        />

        <main className="max-w-5xl mx-auto px-4 py-6">
          <SetTemplateEditor
            // Remount on selection change so form state re-initializes.
            key={editingTemplate?.id ?? 'new'}
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onDelete={handleDeleteSetTemplate}
          />
        </main>
      </div>
    </div>
  );
}
