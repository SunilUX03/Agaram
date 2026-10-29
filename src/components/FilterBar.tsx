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

/** Filters above a list. On mobile they open in a bottom sheet with Apply and Clear. Active filters are UX4G input chips. */
export function FilterBar({ children, active, onRemove, onClear }: Props) {
  const { t } = useTranslation();
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  return (
    <div className="ux4g-my-m">
      {mobile ? (
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m"
          onClick={() => setOpen(true)}
        >
          <Icon name="plus" size={18} />
          {t('ui.filters.open')}
          {active.length > 0 && (
            <span className="ux4g-tag-tonal-primary ux4g-tag-s ux4g-ml-xs">{active.length}</span>
          )}
        </button>
      ) : (
        <div className="filterbar-controls">{children}</div>
      )}
      {active.length > 0 && (
        <ul
          className="ux4g-d-flex ux4g-flex-wrap gap-s ux4g-mt-s plain-list"
          aria-label={t('ui.filters.active')}
        >
          {active.map((f) => (
            <li key={f.key}>
              <button
                type="button"
                className="ux4g-input-chip-m"
                onClick={() => onRemove(f.key)}
                aria-label={t('ui.filters.remove', { name: f.label })}
              >
                {f.label}
                <i className="ux4g-icon-outlined" aria-hidden="true">
                  close
                </i>
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
              <button
                type="button"
                className="ux4g-btn-outline-primary ux4g-btn-m"
                onClick={onClear}
              >
                {t('ui.filters.clear')}
              </button>
              <button
                type="button"
                className="ux4g-btn-primary ux4g-btn-m"
                onClick={() => setOpen(false)}
              >
                {t('ui.filters.apply')}
              </button>
            </>
          }
        >
          {children}
        </Dialog>
      )}
    </div>
  );
}
