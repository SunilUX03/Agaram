import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import type { Crumb } from '@/components/Breadcrumb';
import { ROUTES } from '@/config/routes';

export interface HeaderProps {
  id: string;
  /** Overrides the catalogue wording where the page's headline comes from data. */
  headline?: string;
  tagline?: ReactNode;
  /** The page's single filled button. Its label comes from the catalogue. */
  main?: { to?: string; onClick?: () => void; disabled?: boolean; label?: string } | ReactNode;
  secondary?: ReactNode;
  image?: ReactNode;
  breadcrumb?: Crumb[];
  hideMain?: boolean;
  stickyMain?: boolean;
}

export function usePageText(id: string) {
  const route = ROUTES.find((r) => r.id === id)!;
  const { t } = useTranslation(route.ns);
  const key = `routes.${id.replaceAll('.', '_')}`;
  return {
    t,
    ns: route.ns,
    headline: t(`${key}.headline`),
    tagline: t(`${key}.tagline`),
    main: t(`${key}.main`),
  };
}

/** Standard header for a route, with the exact headline, tagline and main button wording from the brief. */
export function RouteHeader({
  id,
  headline,
  tagline,
  main,
  secondary,
  image,
  breadcrumb,
}: HeaderProps) {
  const p = usePageText(id);
  let mainNode: ReactNode = null;
  const spec = main as
    { to?: string; onClick?: () => void; disabled?: boolean; label?: string } | undefined;
  if (
    spec &&
    typeof spec === 'object' &&
    ('to' in spec || 'onClick' in spec || 'disabled' in spec || 'label' in spec)
  ) {
    const label = spec.label ?? p.main;
    mainNode = spec.to ? (
      <Link to={spec.to} className="btn btn-primary">
        {label}
      </Link>
    ) : (
      <button
        type="button"
        className="btn btn-primary"
        onClick={spec.onClick}
        disabled={spec.disabled}
      >
        {label}
      </button>
    );
  } else if (main) mainNode = main as ReactNode;
  return (
    <PageHeader
      headline={headline ?? p.headline}
      tagline={tagline ?? (p.tagline || undefined)}
      main={mainNode}
      secondary={secondary}
      image={image}
      breadcrumb={breadcrumb}
    />
  );
}
