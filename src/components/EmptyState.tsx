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

export function EmptyState({ message, actionLabel, to, onAction, icon = 'check' }: Props) {
  const { t } = useTranslation();
  return (
    <div className="empty">
      <span className="empty-art" aria-hidden="true">
        <Icon name={icon} size={32} />
      </span>
      <p>{message ?? t('ui.empty.default')}</p>
      {actionLabel &&
        (to ? (
          <Link className="btn btn-primary" to={to}>
            {actionLabel}
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        ))}
    </div>
  );
}

/** Friendly load error with a Retry button. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="empty" role="alert">
      <span className="empty-art" aria-hidden="true">
        <Icon name="warning" size={32} />
      </span>
      <p>{t('error.load')}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        {t('error.retry')}
      </button>
    </div>
  );
}
