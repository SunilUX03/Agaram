import { useTranslation } from 'react-i18next';
import { QueryView } from '@/components/QueryView';
import { Tag } from '@/components/Tag';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';

export default function AnnouncementsPage() {
  const { t, i18n } = useTranslation('library');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const query = useQ('library', ['announcement']);
  return (
    <>
      <RouteHeader id="library.announcements" main={{ to: '/account#notifications' }} />
      <QueryView
        query={query}
        skeleton="row"
        skeletonCount={5}
        empty={{ message: t('announcements.empty') }}
      >
        {(all) => (
          <ul className="plain-list">
            {all
              .slice()
              .sort(
                (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date),
              )
              .map((a) => (
                <li key={a.id} className="list-row">
                  <span className="list-row-main">
                    <span className="ux4g-body-m-strong">
                      {a.title} {a.pinned && <Tag>{t('ui.tag.pinned', { ns: 'common' })}</Tag>}
                    </span>
                    <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {formatDate(a.date, loc)} · {a.description}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        )}
      </QueryView>
    </>
  );
}
