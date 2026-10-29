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
        <section key={g.label} className="more-group">
          <h3>{t(g.label)}</h3>
          <ul>
            {g.links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={onClose}>
                  {t(l.label)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <ul className="more-list">
        <li>
          <Link to="/desk" onClick={onClose}>
            <Icon name="desk" /> {t('nav.myDesk')}
          </Link>
        </li>
        <li>
          <Link to="/account" onClick={onClose}>
            <Icon name="user" /> {t('nav.account')}
          </Link>
        </li>
        <li>
          <Icon name="globe" /> <LangSwitch />
        </li>
        <li>
          <button type="button" onClick={() => (onClose(), nav('/login'))}>
            {t('nav.signOut')}
          </button>
        </li>
      </ul>
    </Dialog>
  );
}

/** Five fixed items. "More" is highlighted while the current page lives under it. */
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
            <Icon name={b.icon} />
            <span>{t(b.label)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={underMore ? 'is-current' : undefined}
          aria-haspopup="dialog"
          onClick={() => setMore(true)}
        >
          <Icon name="more" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
      {more && <MoreSheet onClose={() => setMore(false)} />}
    </>
  );
}
