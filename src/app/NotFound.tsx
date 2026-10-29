import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const { t } = useTranslation();
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h1.current?.focus();
    document.title = t('app.title', { headline: t('notFound.title') });
  }, [t]);
  return (
    <section className="page-header">
      <h1 ref={h1} tabIndex={-1}>
        {t('notFound.title')}
      </h1>
      <Link to="/home" className="btn btn-primary" style={{ marginTop: 16 }}>
        {t('notFound.button')}
      </Link>
    </section>
  );
}
