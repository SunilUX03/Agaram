import { useTranslation } from 'react-i18next';
import { Dialog } from './Dialog';

export const SAMPLE_PDF = `${import.meta.env.BASE_URL}sample.pdf`;

interface Props {
  title: string;
  url?: string;
  onClose: () => void;
}

/** Opens a PDF or image inside the portal. Full-screen on mobile. A Download link is always offered. */
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
          <a className="btn" href={url} download>
            {t('ui.file.download')}
          </a>
          <button type="button" className="btn btn-primary" onClick={onClose}>
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
