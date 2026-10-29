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

/** The brand mark: a simple emblem circle. */
export const Emblem = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <circle cx="16" cy="16" r="15" fill="var(--ux4g-bg-primary-strong)" />
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
      className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-m bell"
      aria-label={`${t('nav.notifications')}, ${n > 9 ? t('ui.unreadMany') : t('ui.unreadCount', { count: n })}`}
    >
      <Icon name="bell" size={24} />
      {n > 0 && (
        <span className="ux4g-badge-dot-danger ux4g-badge-m bell-badge" aria-hidden="true" />
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
    <div className="menu-button" ref={ref} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-m"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`AV, ${t('nav.avatarMenu')}`}
        onClick={() => setOpen(!open)}
      >
        <Avatar name="Aadhira Valluvan" size={32} decorative />
      </button>
      {open && (
        <div
          className="menu-pop menu-pop-right ux4g-card ux4g-card-outline ux4g-shadow-l2"
          role="menu"
        >
          <Link
            role="menuitem"
            to="/desk"
            className="menu-pop-item ux4g-body-m-default narrow-only"
            onClick={() => setOpen(false)}
          >
            {t('nav.myDesk')}
          </Link>
          <Link
            role="menuitem"
            to="/account"
            className="menu-pop-item ux4g-body-m-default"
            onClick={() => setOpen(false)}
          >
            {t('nav.account')}
          </Link>
          <div className="menu-pop-item narrow-only">
            <LangSwitch />
          </div>
          <button
            role="menuitem"
            type="button"
            className="menu-pop-item ux4g-body-m-default"
            onClick={() => (setOpen(false), nav('/login'))}
          >
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Desktop: UX4G navbar with the full menu. Mobile and tablet: emblem on the left, Search and Bell on the right. */
export function TopBar({ desktop }: { desktop: boolean }) {
  const { t } = useTranslation();
  const items = features.nav.items
    .map((id) => NAV_ITEMS.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n);
  return (
    <header role="banner" className="topbar">
      <nav className="ux4g-navbar" aria-label={t('nav.primary')}>
        <div className="ux4g-navbar-wrap ux4g-container">
          <Link to="/home" className="brand">
            <Emblem />
            <span className="ux4g-heading-xs-strong">{t('app.name')}</span>
          </Link>
          {desktop && <DesktopMenu items={items} />}
          <div className="ux4g-navbar-right">
            {desktop && (
              <Link
                to="/requests/new"
                className="ux4g-btn-primary ux4g-btn-m btn-start"
                aria-label={t('nav.startRequest')}
              >
                <Icon name="plus" size={18} />
                <span className="btn-label">{t('nav.startRequest')}</span>
              </Link>
            )}
            <Link
              to="/search"
              className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-m"
              aria-label={t('nav.search')}
            >
              <Icon name="search" size={24} />
            </Link>
            <BellLink />
            {desktop && (
              <>
                <Link
                  to="/desk"
                  className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-m wide-only"
                  aria-label={t('nav.myDesk')}
                >
                  <Icon name="desk" size={24} />
                </Link>
                <span className="wide-only">
                  <LangSwitch />
                </span>
                <AvatarMenu />
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
