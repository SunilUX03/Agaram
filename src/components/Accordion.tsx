import { useState, type ReactNode } from 'react';
import { useIsMobile, useUid } from './hooks';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

/** UX4G accordion. One open at a time on mobile, many on desktop. Each header is a real button. */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState<string[]>([]);
  const uid = useUid('acc');
  const toggle = (id: string) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : mobile ? [id] : [...o, id]));
  return (
    <div className="ux4g-accordion ux4g-accordion-arrow-right ux4g-accordion-bordered">
      {items.map((it) => {
        const isOpen = open.includes(it.id);
        return (
          <div key={it.id} className={`ux4g-accordion__item${isOpen ? ' active' : ''}`}>
            <h3 className="acc-h">
              <button
                type="button"
                id={`${uid}-h-${it.id}`}
                className="ux4g-accordion__header"
                aria-expanded={isOpen}
                aria-controls={`${uid}-p-${it.id}`}
                onClick={() => toggle(it.id)}
              >
                <span className="ux4g-accordion__title">{it.title}</span>
              </button>
            </h3>
            <div
              id={`${uid}-p-${it.id}`}
              role="region"
              aria-labelledby={`${uid}-h-${it.id}`}
              className="ux4g-accordion__body"
              hidden={!isOpen}
            >
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
