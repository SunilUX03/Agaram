import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <PageHeader
      headline={t('notFound.title')}
      main={
        <Link to="/home" className="ux4g-btn-primary ux4g-btn-m">
          {t('notFound.button')}
        </Link>
      }
    />
  );
}
