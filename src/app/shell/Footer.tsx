import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FOOTER_LINKS } from '@/config/nav';
import { formatDate, formatTime } from '@/domain/dates';
import { LangSwitch } from './LangSwitch';

const LAST_SIGNED_IN = new Date(Date.now() - 20 * 3600 * 1000);

/** UX4G footer, primary theme. */
export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="ux4g-footer-wrapper ux4g-footer-primary" role="contentinfo">
      <div className="ux4g-footer-row footer-inner">
        <ul className="ux4g-d-flex ux4g-flex-wrap ux4g-gap-m plain-list">
          {FOOTER_LINKS.map((l) => (
            <li key={l.label}>
              {/* Help desk, accessibility and terms have no pages in scope: shown as inert links. */}
              {l.to ? (
                <Link to={l.to} className="footer-link">
                  {t(l.label)}
                </Link>
              ) : (
                <a href="#main" className="footer-link" onClick={(e) => e.preventDefault()}>
                  {t(l.label)}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="ux4g-body-m-default">{t('footer.department')}</p>
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-jc-between ux4g-ai-center ux4g-gap-m">
          <LangSwitch />
          <span className="ux4g-body-s-default">
            {t('footer.lastSignedIn', {
              date: `${formatDate(LAST_SIGNED_IN)}, ${formatTime(LAST_SIGNED_IN)}`,
            })}
          </span>
        </div>
      </div>
    </footer>
  );
}
