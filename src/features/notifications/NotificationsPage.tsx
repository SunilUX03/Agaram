import { useTranslation } from 'react-i18next';
import { NotificationItem } from '@/components/NotificationItem';
import { QueryView } from '@/components/QueryView';
import { RouteHeader } from '@/app/usePage';
import { useUrlState } from '@/components/useUrlState';
import { useMut, useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';

const dayKey = (iso: string) => new Date(iso).toDateString();

export default function NotificationsPage() {
  const { t, i18n } = useTranslation('notifications');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('notifications');
  const [filter, setFilter] = useUrlState('filter');
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
      <div
        className="ux4g-d-flex ux4g-flex-wrap gap-xs ux4g-mb-m"
        role="group"
        aria-label={t('filters.label')}
      >
        {['', 'requests', 'community'].map((f) => (
          <button
            key={f || 'all'}
            type="button"
            className={`ux4g-filter-chip-m${filter === f ? ' active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {t(`filters.${f || 'all'}`)}
          </button>
        ))}
      </div>
      <QueryView
        query={q}
        skeleton="row"
        skeletonCount={6}
        empty={{ message: t('empty'), icon: 'bell' }}
      >
        {(all) => {
          const rows = all.filter((n) => !filter || n.category === filter);
          if (!rows.length)
            return (
              <p className="ux4g-body-m-default ux4g-text-neutral-secondary">{t('emptyFilter')}</p>
            );
          const groups = [...new Set(rows.map((n) => dayKey(n.createdAt)))];
          return groups.map((g) => {
            const items = rows.filter((n) => dayKey(n.createdAt) === g);
            return (
              <section key={g} className="section" aria-label={label(items[0].createdAt)}>
                <h2 className="ux4g-heading-xs-strong ux4g-mb-2xs">{label(items[0].createdAt)}</h2>
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
