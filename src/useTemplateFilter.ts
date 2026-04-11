import { useMemo, useState } from 'react';
import type { SetTemplate } from './types';

/**
 * Shared search + tag-filter state for any list of SetTemplates.
 * Returns the filtered list plus controls to drive a search box and tag chips.
 */
export function useTemplateFilter(templates: SetTemplate[]) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    templates.forEach(t => t.tags.forEach(tag => s.add(tag)));
    return Array.from(s).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter(t => {
      if (activeTag && !t.tags.includes(activeTag)) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [templates, search, activeTag]);

  return { search, setSearch, activeTag, setActiveTag, allTags, filtered };
}
