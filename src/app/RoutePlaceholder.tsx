import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { RouteDef } from '@/config/routes';

/** Phase 0 stand-in: shows the exact headline and tagline for a route. Replaced per phase. */
export function RoutePlaceholder({ route }: { route: RouteDef }) {
  const { t } = useTranslation([route.ns, 'common']);
  const key = route.id.replaceAll('.', '_');
  const h1 = useRef<HTMLHeadingElement>(null);
  const headline = t(`${route.ns}:routes.${key}.headline`);
  const tagline = t(`${route.ns}:routes.${key}.tagline`);
  const main = t(`${route.ns}:routes.${key}.main`);

  useEffect(() => {
    window.scrollTo(0, 0);
    h1.current?.focus();
    document.title = t('common:app.title', { headline });
  }, [headline, t]);

  return (
    <section className="page-header">
      <h1 ref={h1} tabIndex={-1}>
        {headline}
      </h1>
      {tagline && <p>{tagline}</p>}
      {main && (
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} disabled>
          {main}
        </button>
      )}
      <p>{t('common:placeholder')}</p>
    </section>
  );
}
