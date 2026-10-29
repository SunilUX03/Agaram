import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';

interface Props {
  message?: string;
  actionLabel?: string;
  to?: string;
  onAction?: () => void;
  icon?: IconName;
}

/** UX4G empty state with an optional main action. */
export function EmptyState({ message, actionLabel, to, onAction, icon = 'check' }: Props) {
  const { t } = useTranslation();
  return (
    <div className="ux4g-empty-state">
      <span className="ux4g-empty-state-icon" aria-hidden="true">
        <Icon name={icon} size={40} />
      </span>
      <div className="ux4g-empty-state-content">
        <p>{message ?? t('ui.empty.default')}</p>
        {actionLabel &&
          (to ? (
            <Link className="ux4g-btn-primary ux4g-btn-m" to={to}>
              {actionLabel}
            </Link>
          ) : (
            <button type="button" className="ux4g-btn-primary ux4g-btn-m" onClick={onAction}>
              {actionLabel}
            </button>
          ))}
      </div>
    </div>
  );
}

/** Friendly load error with a Retry button. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="ux4g-empty-state" role="alert">
      <span className="ux4g-empty-state-icon" aria-hidden="true">
        <Icon name="warning" size={40} />
      </span>
      <div className="ux4g-empty-state-content">
        <p>{t('error.load')}</p>
        <button type="button" className="ux4g-btn-primary ux4g-btn-m" onClick={onRetry}>
          {t('error.retry')}
        </button>
      </div>
    </div>
  );
}
