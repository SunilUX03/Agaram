import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { useIsMobile } from './hooks';

export interface ActiveFilter {
  key: string;
  label: string;
}

interface Props {
  /** The filter controls. Rendered inline on desktop and inside the sheet on mobile. */
  children: ReactNode;
  active: ActiveFilter[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

/** Filters above a list. On mobile they open in a bottom sheet with Apply and Clear. */
export function FilterBar({ children, active, onRemove, onClear }: Props) {
  const { t } = useTranslation();
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  return (
    <div className="filterbar">
      {mobile ? (
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} />
          {t('ui.filters.open')}
          {active.length > 0 && <span className="tab-count">{active.length}</span>}
        </button>
      ) : (
        <div className="filterbar-controls">{children}</div>
      )}
      {active.length > 0 && (
        <ul className="chips" aria-label={t('ui.filters.active')}>
          {active.map((f) => (
            <li key={f.key}>
              <button
                type="button"
                className="chip chip-neutral"
                onClick={() => onRemove(f.key)}
                aria-label={t('ui.filters.remove', { name: f.label })}
              >
                {f.label}
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Dialog
          title={t('ui.filters.title')}
          variant="sheet"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={onClear}>
                {t('ui.filters.clear')}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                {t('ui.filters.apply')}
              </button>
            </>
          }
        >
          <div className="filterbar-sheet">{children}</div>
        </Dialog>
      )}
    </div>
  );
}
