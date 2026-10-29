import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatTime } from '@/domain/dates';
import { Icon } from './Icon';

export type NotificationType = 'request' | 'reply' | 'idea-status' | 'circular' | 'training';
const ICON: Record<NotificationType, string> = {
  request: 'requests',
  reply: 'community',
  'idea-status': 'heart',
  circular: 'file',
  training: 'book',
};

interface Props {
  type: NotificationType;
  text: string;
  createdAt: string;
  read: boolean;
  to: string;
  onOpen?: () => void;
}

/** One notification as a UX4G list item. Unread ones are bold with a dot badge. */
export function NotificationItem({ type, text, createdAt, read, to, onOpen }: Props) {
  const { t } = useTranslation();
  return (
    <Link to={to} className={`ux4g-list-item list-row${read ? '' : ' is-unread'}`} onClick={onOpen}>
      <span className="ux4g-list-item-row">
        <span className="list-row-icon">
          <Icon name={ICON[type]} />
        </span>
        <span className="ux4g-list-item-start list-row-main">
          <span className={read ? 'ux4g-body-m-default' : 'ux4g-body-m-strong'}>
            {!read && <span className="sr-only">{t('ui.unreadCount', { count: 1 })}. </span>}
            {text}
          </span>
          <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
            {t(`ui.notification.${type}`)} · {formatTime(createdAt)}
          </span>
        </span>
        {!read && <span className="ux4g-badge-dot-primary" aria-hidden="true" />}
      </span>
    </Link>
  );
}
