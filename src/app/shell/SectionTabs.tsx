import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS, flattenLinks, isCurrent } from '@/config/nav';

/** Phones and tablets: a horizontally scrolling UX4G tab row of the current section's pages. */
export function SectionTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((n) => isCurrent(pathname, n.match));
  const links = item ? flattenLinks(item) : [];
  if (links.length < 2) return null;
  return (
    <nav
      className="ux4g-tab ux4g-tab-underline ux4g-tab-m section-tabs"
      aria-label={t('nav.sections')}
    >
      <ul className="ux4g-tab-list">
        {links.map((l) => (
          <li key={l.to} className="tab-li">
            <NavLink
              to={l.to}
              end
              className={({ isActive }) => `ux4g-tab-item${isActive ? ' is-active active' : ''}`}
            >
              {t(l.label)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
