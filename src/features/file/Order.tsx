import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileViewer } from '@/components/FileViewer';
import { useQ } from '@/data/hooks';

/** "Order" link. Opens the order in the file viewer. Renders nothing when the record has no order. */
export function OrderLink({ orderId }: { orderId?: string }) {
  const { t } = useTranslation();
  const docs = useQ('documents');
  const [open, setOpen] = useState(false);
  const doc = orderId ? docs.data?.find((d) => d.id === orderId) : undefined;
  if (!orderId || !doc) return null; // shown once the order is known, so the button never appears disabled
  return (
    <>
      <button
        type="button"
        className="ux4g-btn-text-primary ux4g-btn-s"
        onClick={() => setOpen(true)}
      >
        {t('common.order')}
      </button>
      {open && (
        <FileViewer
          title={doc.orderNumber ?? doc.title}
          url={doc.fileUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
