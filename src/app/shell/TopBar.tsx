import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useOutsideClick } from '@/components/hooks';
import { features } from '@/config/features';
import { NAV_ITEMS } from '@/config/nav';
import { useUnreadCount } from '@/features/notifications/useUnread';
import { DesktopMenu } from './DesktopMenu';
import { LangSwitch } from './LangSwitch';

export const Emblem = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <circle cx="16" cy="16" r="15" fill="var(--primary)" />
    <path
      d="M9 22l7-13 7 13M12 18h8"
      stroke="#fff"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export function BellLink() {
  const { t } = useTranslation();
  const n = useUnreadCount();
  return (
    <Link
      to="/notifications"
      className="icon-btn"
      aria-label={`${t('nav.notifications')}, ${n > 9 ? t('ui.unreadMany') : t('ui.unreadCount', { count: n })}`}
    >
      <Icon name="bell" />
      {n > 0 && (
        <span className="badge" aria-hidden="true">
          {n > 9 ? '9+' : n}
        </span>
      )}
    </Link>
  );
}

function AvatarMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  useOutsideClick(ref, () => setOpen(false), open);
  return (
    <div className="avatar-menu" ref={ref} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        className={`icon-btn${open ? ' is-active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.avatarMenu')}
        onClick={() => setOpen(!open)}
      >
        <Avatar name="Meenakshi Sundaram" size={32} decorative />
      </button>
      {open && (
        <div className="dd dd-right" role="menu">
          <Link role="menuitem" to="/account" onClick={() => setOpen(false)}>
            {t('nav.account')}
          </Link>
          <button role="menuitem" type="button" onClick={() => (setOpen(false), nav('/login'))}>
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Desktop: full menu. Mobile and tablet: emblem on the left, Search and Bell on the right. */
export function TopBar({ desktop }: { desktop: boolean }) {
  const { t } = useTranslation();
  const items = features.nav.items
    .map((id) => NAV_ITEMS.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n);
  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <Link to="/home" className="brand">
          <Emblem />
          <span>{t('app.name')}</span>
        </Link>
        {desktop && <DesktopMenu items={items} />}
        <div className="topbar-right">
          {desktop && (
            <Link to="/requests/new" className="btn btn-primary">
              {t('nav.startRequest')}
            </Link>
          )}
          <Link to="/search" className="icon-btn" aria-label={t('nav.search')}>
            <Icon name="search" />
          </Link>
          <BellLink />
          {desktop && (
            <>
              <Link to="/desk" className="icon-btn" aria-label={t('nav.myDesk')}>
                <Icon name="desk" />
              </Link>
              <LangSwitch />
              <AvatarMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
