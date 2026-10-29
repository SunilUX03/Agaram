import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';

export const SAMPLE_PDF = `${import.meta.env.BASE_URL}sample.pdf`;

interface Props {
  title: string;
  url?: string;
  onClose: () => void;
}

/** Opens a PDF or image inside the portal in a large UX4G modal. A Download link is always offered. */
export function FileViewer({ title, url = SAMPLE_PDF, onClose }: Props) {
  const { t } = useTranslation();
  const isImage = /\.(png|jpe?g)$/i.test(url);
  return (
    <Dialog
      title={title}
      variant="full"
      onClose={onClose}
      footer={
        <>
          <a className="ux4g-btn-outline-primary ux4g-btn-m" href={url} download>
            {t('ui.file.download')}
          </a>
          <button type="button" className="ux4g-btn-primary ux4g-btn-m" onClick={onClose}>
            {t('ui.file.close')}
          </button>
        </>
      }
    >
      {isImage ? (
        <img className="viewer" src={url} alt={title} />
      ) : (
        <object className="viewer" data={url} type="application/pdf" aria-label={title}>
          <p>{t('ui.file.fallback')}</p>
        </object>
      )}
    </Dialog>
  );
}
