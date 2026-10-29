import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';

interface Props {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** For destructive actions only. Default focus is on Cancel. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      role="alertdialog"
      initialFocus="[data-cancel]"
      footer={
        <>
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-m"
            data-cancel
            onClick={onCancel}
          >
            {cancelLabel ?? t('ui.confirm.cancel')}
          </button>
          <button type="button" className="ux4g-btn-danger ux4g-btn-m" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {body && <p className="ux4g-body-m-default">{body}</p>}
    </Dialog>
  );
}
