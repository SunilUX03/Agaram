import { useTranslation } from 'react-i18next';
import { QueryView } from '@/components/QueryView';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { PostRow } from './parts';

export default function DiscussionsPage() {
  const { t } = useTranslation('community');
  const tabs = ['all', 'discussion', 'experience', 'poll'].map((id) => ({
    id,
    label: t(`discussions.tabs.${id}`),
  }));
  const [tab] = useUrlTab(tabs);
  const q = useQ('posts');
  return (
    <>
      <RouteHeader id="community.discussions" main={{ to: '/community/discussions/new' }} />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView
          query={q}
          skeleton="row"
          skeletonCount={5}
          empty={{
            message: t('discussions.empty'),
            actionLabel: t('discussions.emptyBtn'),
            to: '/community/discussions/new',
          }}
        >
          {(all) => {
            const rows = all.filter((p) => tab === 'all' || p.kind === tab);
            return rows.length ? (
              <div className="list">
                {rows.map((p) => (
                  <PostRow key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <p className="muted">{t('discussions.empty')}</p>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
