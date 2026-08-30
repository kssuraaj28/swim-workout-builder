import type { ReactNode } from 'react';
import { EMPTY_STATE, SECTION_LABEL } from './styles.ts';

/** Shared sidebar shell: header + scrollable body + optional footer. Callers render the item list. */
export function SidebarList({
  title, isEmpty, emptyMessage, children, footer,
}: {
  title: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 border-b border-gray-200 ${SECTION_LABEL}`}>{title}</div>
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? <div className={`${EMPTY_STATE} p-3`}>{emptyMessage}</div> : children}
      </div>
      {footer && <div className="p-3 border-t border-gray-200">{footer}</div>}
    </div>
  );
}
