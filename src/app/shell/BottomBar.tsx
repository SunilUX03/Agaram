import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { BOTTOM_BAR, NAV_ITEMS, isCurrent } from '@/config/nav';
import { LangSwitch } from './LangSwitch';

function MoreSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const groups = [
    { label: 'nav.people', links: NAV_ITEMS.find((n) => n.id === 'people')!.links! },
    ...NAV_ITEMS.find((n) => n.id === 'learnLibrary')!.groups!.map((g) => ({
      label: g.label,
      links: g.items,
    })),
  ];
  return (
    <Dialog title={t('nav.more')} variant="sheet" onClose={onClose}>
      {groups.map((g) => (
        <section key={g.label} className="ux4g-mb-m">
          <h3 className="ux4g-label-m-strong ux4g-text-neutral-secondary">{t(g.label)}</h3>
          <ul className="ux4g-list ux4g-list-default ux4g-list-m">
            {g.links.map((l) => (
              <li key={l.to} className="ux4g-list-item">
                <Link to={l.to} className="ux4g-list-item-row more-link" onClick={onClose}>
                  {t(l.label)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <ul className="ux4g-list ux4g-list-default ux4g-list-m">
        <li className="ux4g-list-item">
          <Link to="/desk" className="ux4g-list-item-row more-link" onClick={onClose}>
            <Icon name="desk" /> {t('nav.myDesk')}
          </Link>
        </li>
        <li className="ux4g-list-item">
          <Link to="/account" className="ux4g-list-item-row more-link" onClick={onClose}>
            <Icon name="user" /> {t('nav.account')}
          </Link>
        </li>
        <li className="ux4g-list-item">
          <span className="ux4g-list-item-row">
            <Icon name="globe" /> <LangSwitch />
          </span>
        </li>
        <li className="ux4g-list-item">
          <button
            type="button"
            className="ux4g-list-item-row more-link"
            onClick={() => (onClose(), nav('/login'))}
          >
            {t('nav.signOut')}
          </button>
        </li>
      </ul>
    </Dialog>
  );
}

/** Five fixed items on phones and tablets. "More" is highlighted while the current page lives under it. UX4G has no bottom bar, so this is custom (see app.css). */
export function BottomBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [more, setMore] = useState(false);
  const underMore = isCurrent(pathname, ['/people', '/learn', '/library', '/desk', '/account']);
  return (
    <>
      <nav className="bottombar" aria-label={t('nav.bottom')}>
        {BOTTOM_BAR.map((b) => (
          <NavLink
            key={b.id}
            to={b.to}
            className={isCurrent(pathname, b.match) ? 'is-current' : undefined}
            aria-current={isCurrent(pathname, b.match) ? 'page' : undefined}
          >
            <Icon name={b.icon} size={24} />
            <span className="ux4g-label-s-default">{t(b.label)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={underMore ? 'is-current' : undefined}
          aria-haspopup="dialog"
          onClick={() => setMore(true)}
        >
          <Icon name="more" size={24} />
          <span className="ux4g-label-s-default">{t('nav.more')}</span>
        </button>
      </nav>
      {more && <MoreSheet onClose={() => setMore(false)} />}
    </>
  );
}
