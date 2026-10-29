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
          <button type="button" className="btn" data-cancel onClick={onCancel}>
            {cancelLabel ?? t('ui.confirm.cancel')}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {body && <p>{body}</p>}
    </Dialog>
  );
}
