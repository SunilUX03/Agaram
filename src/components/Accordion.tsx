import { useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { useIsMobile, useUid } from './hooks';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

/** One open at a time on mobile, many on desktop. Each header is a real button. */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState<string[]>([]);
  const uid = useUid('acc');
  const toggle = (id: string) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : mobile ? [id] : [...o, id]));
  return (
    <div className="accordion">
      {items.map((it) => {
        const isOpen = open.includes(it.id);
        return (
          <div key={it.id} className="acc-item">
            <h3>
              <button
                type="button"
                id={`${uid}-h-${it.id}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-p-${it.id}`}
                onClick={() => toggle(it.id)}
              >
                <span>{it.title}</span>
                <Icon name="down" size={18} />
              </button>
            </h3>
            <div
              id={`${uid}-p-${it.id}`}
              role="region"
              aria-labelledby={`${uid}-h-${it.id}`}
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
