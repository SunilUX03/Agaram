import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface Crumb {
  label: string;
  to?: string;
}

/** UX4G breadcrumb. Desktop only. The last item is plain text. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('ui.breadcrumb')}
      className="ux4g-breadcrumb ux4g-breadcrumb-divider ux4g-d-none ux4g-lg-d-block ux4g-mb-s"
    >
      <ol className="ux4g-breadcrumb-list ux4g-d-flex plain-list">
        {items.map((c, i) => (
          <li key={i} className={`ux4g-breadcrumb-item${i === items.length - 1 ? ' active' : ''}`}>
            {c.to && i < items.length - 1 ? (
              <Link to={c.to} className="ux4g-breadcrumb-link">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
