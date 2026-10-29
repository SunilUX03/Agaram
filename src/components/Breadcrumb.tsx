import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface Crumb {
  label: string;
  to?: string;
}

/** Desktop only (hidden by CSS below 1024px). The last item is plain text. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('ui.breadcrumb')} className="breadcrumb">
      <ol>
        {items.map((c, i) => (
          <li key={i}>
            {c.to && i < items.length - 1 ? (
              <Link to={c.to}>{c.label}</Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
