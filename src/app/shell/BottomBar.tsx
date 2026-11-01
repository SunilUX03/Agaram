import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { BOTTOM_BAR, isCurrent } from '@/config/nav';
import { useSignOut } from '../auth';
import { ChangePasswordDialog } from './ChangePasswordDialog';

/** "Me": a small sheet with Change Password and Logout (v2, section 2). */
function MeSheet({ onClose, onPassword }: { onClose: () => void; onPassword: () => void }) {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return (
    <Dialog title={t('nav.me')} variant="sheet" onClose={onClose}>
      <ul className="ux4g-list ux4g-list-default ux4g-list-m">
        <li className="ux4g-list-item">
          <button
            type="button"
            className="ux4g-list-item-row more-link"
            onClick={() => (onClose(), onPassword())}
          >
            <Icon name="lock" /> {t('nav.changePassword')}
          </button>
        </li>
        <li className="ux4g-list-item">
          <button
            type="button"
            className="ux4g-list-item-row more-link"
            onClick={() => (onClose(), signOut())}
          >
            <Icon name="close" /> {t('nav.logout')}
          </button>
        </li>
      </ul>
    </Dialog>
  );
}

/** Four fixed items on phones and tablets. UX4G has no bottom bar, so this is custom (see app.css). */
export function BottomBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [me, setMe] = useState(false);
  const [pw, setPw] = useState(false);
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
        <button type="button" aria-haspopup="dialog" onClick={() => setMe(true)}>
          <Icon name="user" size={24} />
          <span className="ux4g-label-s-default">{t('nav.me')}</span>
        </button>
      </nav>
      {me && <MeSheet onClose={() => setMe(false)} onPassword={() => setPw(true)} />}
      {pw && <ChangePasswordDialog onClose={() => setPw(false)} />}
    </>
  );
}
