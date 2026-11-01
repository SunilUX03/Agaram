import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useOutsideClick } from '@/components/hooks';
import { TOP_NAV } from '@/config/nav';
import { useUnreadCount } from '@/features/notifications/useUnread';
import { DesktopMenu } from './DesktopMenu';
import { useSignOut } from '../auth';
import { ChangePasswordDialog } from './ChangePasswordDialog';

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
  const [pw, setPw] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signOut = useSignOut();
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
          <button
            role="menuitem"
            type="button"
            className="menu-pop-item ux4g-body-m-default"
            onClick={() => (setOpen(false), setPw(true))}
          >
            {t('nav.changePassword')}
          </button>
          <button
            role="menuitem"
            type="button"
            className="menu-pop-item ux4g-body-m-default"
            onClick={() => (setOpen(false), signOut())}
          >
            {t('nav.logout')}
          </button>
        </div>
      )}
      {pw && <ChangePasswordDialog onClose={() => setPw(false)} />}
    </div>
  );
}

/** Desktop: UX4G navbar with the two sections. Mobile and tablet: emblem on the left, the bell on the right. */
export function TopBar({ desktop }: { desktop: boolean }) {
  const { t } = useTranslation();
  return (
    <header role="banner" className="topbar">
      <nav className="ux4g-navbar" aria-label={t('nav.primary')}>
        <div className="ux4g-navbar-wrap ux4g-container">
          <Link to="/home" className="brand">
            <Emblem />
            <span className="ux4g-heading-xs-strong">{t('app.name')}</span>
          </Link>
          {desktop && <DesktopMenu items={TOP_NAV} />}
          <div className="ux4g-navbar-right">
            <BellLink />
            {desktop && <AvatarMenu />}
          </div>
        </div>
      </nav>
    </header>
  );
}
