import { useState } from 'react';
import type { SetTemplate } from './types';
import { loadSetLibrary, upsertSetTemplate, deleteSetTemplate } from './setLibrary';
import { SetTemplateList } from './SetTemplateList';
import { SetTemplateEditor } from './SetTemplateEditor';
import { Header, STICKY_BELOW_HEADER_TOP, SIDEBAR_HEIGHT, type AppMode } from './Header';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function SetBuilder({ mode, onModeChange }: Props) {
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
    <div className="min-h-screen bg-gray-100">
      <Header mode={mode} onModeChange={onModeChange} />

      <div className="flex">
        <aside className={`w-64 shrink-0 bg-white border-r border-gray-200 no-print sticky ${STICKY_BELOW_HEADER_TOP} ${SIDEBAR_HEIGHT} overflow-hidden flex flex-col`}>
          <SetTemplateList
            templates={setTemplates}
            currentId={editingTemplate?.id ?? null}
            onSelect={setEditingTemplate}
          />
        </aside>

        <div className="flex-1 min-w-0">
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
    </div>
  );
}
