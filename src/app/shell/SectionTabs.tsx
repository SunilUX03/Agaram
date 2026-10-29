import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS, flattenLinks, isCurrent } from '@/config/nav';

/** Mobile and tablet: a horizontally scrolling row of the current section's pages. */
export function SectionTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((n) => isCurrent(pathname, n.match));
  const links = item ? flattenLinks(item) : [];
  if (links.length < 2) return null;
  return (
    <nav className="section-tabs" aria-label={t('nav.sections')}>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end>
          {t(l.label)}
        </NavLink>
      ))}
    </nav>
  );
}
