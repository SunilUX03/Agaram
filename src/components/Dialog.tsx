import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogFocus, useIsDesktop, useUid } from './hooks';

export interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** `sheet` is a bottom drawer on phones; `full` is a large modal (full screen on phones). */
  variant?: 'center' | 'sheet' | 'full';
  initialFocus?: string;
  role?: 'dialog' | 'alertdialog';
}

/** UX4G Modal (and bottom Drawer on phones for `sheet`). Focus is trapped, Escape closes, focus returns to the opener. */
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
  const desktop = useIsDesktop();
  useDialogFocus(ref, onClose, initialFocus);
  const sheet = variant === 'sheet' && !desktop;

  if (sheet)
    return (
      <div
        className="ux4g-drawer-overlay ux4g-drawer-open"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={ref}
          className="ux4g-drawer ux4g-drawer-bottom ux4g-drawer-open sheet"
          role={role}
          aria-modal="true"
          aria-labelledby={id}
        >
          <div className="ux4g-drawer-header">
            <h2 id={id} className="ux4g-drawer-title">
              {title}
            </h2>
            <button
              type="button"
              className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-md"
              data-drawer-close
              onClick={onClose}
              aria-label={t('ui.sheet.close')}
            >
              <i className="ux4g-icon-outlined" aria-hidden="true">
                close
              </i>
            </button>
          </div>
          <div className="ux4g-drawer-body">{children}</div>
          {footer && (
            <div className="ux4g-drawer-footer ux4g-d-flex ux4g-gap-s ux4g-jc-end">{footer}</div>
          )}
        </div>
      </div>
    );

  return (
    <div
      className="ux4g-modal-backdrop ux4g-modal-backdrop-50"
      style={{ display: 'flex' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={`ux4g-modal-box ${variant === 'full' ? 'ux4g-modal-l modal-full' : 'ux4g-modal-m'}`}
        role={role}
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="ux4g-modal-header">
          <h2 id={id} className="ux4g-modal-header-title">
            {title}
          </h2>
          <button
            type="button"
            className="ux4g-modal-close"
            data-close-modal
            onClick={onClose}
            aria-label={t('ui.sheet.close')}
          >
            <i className="ux4g-icon-outlined ux4g-modal-close-icon" aria-hidden="true">
              close
            </i>
          </button>
        </div>
        <div className="ux4g-modal-body">{children}</div>
        {footer && (
          <div className="ux4g-modal-actions ux4g-d-flex ux4g-gap-s ux4g-jc-end ux4g-pt-m">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
