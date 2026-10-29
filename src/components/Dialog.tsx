import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useDialogFocus, useUid } from './hooks';

export interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** `sheet` slides up from the bottom on mobile; `full` is full-screen on mobile. */
  variant?: 'center' | 'sheet' | 'full';
  initialFocus?: string;
  role?: 'dialog' | 'alertdialog';
}

/** Focus-trapped modal. Base for ConfirmDialog, FilterSheet, MoreSheet and FileViewer. */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  variant = 'center',
  initialFocus,
  role = 'dialog',
}: DialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const id = useUid('dlg');
  useDialogFocus(ref, onClose, initialFocus);
  return (
    <div className="dlg-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className={`dlg dlg-${variant}`}
        role={role}
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="dlg-head">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('ui.sheet.close')}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="dlg-body">{children}</div>
        {footer && <div className="dlg-foot">{footer}</div>}
      </div>
    </div>
  );
}
