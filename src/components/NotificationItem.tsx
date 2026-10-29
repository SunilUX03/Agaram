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

export function NotificationItem({ type, text, createdAt, read, to, onOpen }: Props) {
  const { t } = useTranslation();
  return (
    <Link to={to} className={`notif${read ? '' : ' is-unread'}`} onClick={onOpen}>
      <Icon name={ICON[type]} />
      <span className="list-row-main">
        <span className="list-row-title">
          {!read && <span className="sr-only">{t('ui.unreadCount', { count: 1 })}. </span>}
          {text}
        </span>
        <span className="list-row-meta">
          {t(`ui.notification.${type}`)} · {formatTime(createdAt)}
        </span>
      </span>
      {!read && <span className="unread-dot" aria-hidden="true" />}
    </Link>
  );
}
