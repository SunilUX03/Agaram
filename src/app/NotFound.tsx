import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <PageHeader
      headline={t('notFound.title')}
      main={
        <Link to="/home" className="btn btn-primary">
          {t('notFound.button')}
        </Link>
      }
    />
  );
}
