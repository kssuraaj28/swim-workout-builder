import type { SetTemplate } from './types';

const SET_LIBRARY_KEY = 'swim-workout-set-library';

export function loadSetLibrary(): SetTemplate[] {
  try {
    const raw = localStorage.getItem(SET_LIBRARY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(templates: SetTemplate[]) {
  localStorage.setItem(SET_LIBRARY_KEY, JSON.stringify(templates));
}

export function upsertSetTemplate(template: SetTemplate): SetTemplate[] {
  const lib = loadSetLibrary();
  const idx = lib.findIndex(t => t.id === template.id);
  if (idx >= 0) lib[idx] = template;
  else lib.unshift(template);
  persist(lib);
  return lib;
}

export function deleteSetTemplate(id: string): SetTemplate[] {
  const lib = loadSetLibrary().filter(t => t.id !== id);
  persist(lib);
  return lib;
}
