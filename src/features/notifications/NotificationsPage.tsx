import { useTranslation } from 'react-i18next';
import { NotificationItem } from '@/components/NotificationItem';
import { QueryView } from '@/components/QueryView';
import { RouteHeader } from '@/app/usePage';
import { useMut, useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';

const dayKey = (iso: string) => new Date(iso).toDateString();

export default function NotificationsPage() {
  const { t, i18n } = useTranslation('notifications');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('notifications');
  const all = useMut('markAllRead');
  const read = useMut('markRead');
  const label = (iso: string) => {
    if (dayKey(iso) === new Date().toDateString()) return t('today');
    if (dayKey(iso) === new Date(Date.now() - 86400000).toDateString()) return t('yesterday');
    return formatDate(iso, loc);
  };
  return (
    <>
      <RouteHeader
        id="notifications"
        main={{ onClick: () => all.mutate([]), disabled: q.data?.every((n) => n.read) ?? true }}
      />
      <QueryView
        query={q}
        skeleton="row"
        skeletonCount={6}
        empty={{ message: t('empty'), icon: 'bell' }}
      >
        {(rows) => {
          const groups = [...new Set(rows.map((n) => dayKey(n.createdAt)))];
          return groups.map((g) => {
            const items = rows.filter((n) => dayKey(n.createdAt) === g);
            return (
              <section key={g} className="section" aria-label={label(items[0].createdAt)}>
                <h2 className="ux4g-heading-xs-strong" style={{ marginBottom: 4 }}>
                  {label(items[0].createdAt)}
                </h2>
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    type={n.type}
                    text={n.text}
                    createdAt={n.createdAt}
                    read={n.read}
                    to={n.targetRoute}
                    onOpen={() => read.mutate([n.id])}
                  />
                ))}
              </section>
            );
          });
        }}
      </QueryView>
    </>
  );
}
