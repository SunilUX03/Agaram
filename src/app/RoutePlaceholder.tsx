import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import type { RouteDef } from '@/config/routes';

/** Stand-in for pages not built yet: exact headline, tagline and main button from the brief. */
export function RoutePlaceholder({ route }: { route: RouteDef }) {
  const { t } = useTranslation([route.ns, 'common']);
  const key = `${route.ns}:routes.${route.id.replaceAll('.', '_')}`;
  const main = t(`${key}.main`);
  return (
    <>
      <PageHeader
        headline={t(`${key}.headline`)}
        tagline={t(`${key}.tagline`) || undefined}
        main={
          main ? (
            <button type="button" className="ux4g-btn-primary ux4g-btn-m" disabled>
              {main}
            </button>
          ) : undefined
        }
      />
      <p>{t('common:placeholder')}</p>
    </>
  );
}
