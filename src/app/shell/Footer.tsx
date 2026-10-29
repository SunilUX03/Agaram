import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FOOTER_LINKS } from '@/config/nav';
import { formatDate, formatTime } from '@/domain/dates';
import { LangSwitch } from './LangSwitch';

const LAST_SIGNED_IN = new Date(Date.now() - 20 * 3600 * 1000);

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer" role="contentinfo">
      <div className="wrap">
        <ul>
          {FOOTER_LINKS.map((l) => (
            <li key={l.label}>
              {/* Help desk, accessibility and terms have no pages in scope: shown as inert links. */}
              {l.to ? (
                <Link to={l.to}>{t(l.label)}</Link>
              ) : (
                <a href="#main" onClick={(e) => e.preventDefault()}>
                  {t(l.label)}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p>{t('footer.department')}</p>
        <div className="footer-row">
          <LangSwitch />
          <span>
            {t('footer.lastSignedIn', {
              date: `${formatDate(LAST_SIGNED_IN)}, ${formatTime(LAST_SIGNED_IN)}`,
            })}
          </span>
        </div>
      </div>
    </footer>
  );
}
