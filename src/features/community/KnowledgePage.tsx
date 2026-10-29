import { useTranslation } from 'react-i18next';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { ArticleCard } from './parts';

export default function KnowledgePage() {
  const { t } = useTranslation('community');
  const tabs = ['article', 'handover', 'mine'].map((id) => ({
    id,
    label: t(`knowledge.tabs.${id}`),
  }));
  const [tab] = useUrlTab(tabs);
  const [q, setQ] = useUrlState('q');
  const [tag, setTag] = useUrlState('tag');
  const query = useQ('articles');
  return (
    <>
      <RouteHeader id="community.knowledge" main={{ to: '/community/knowledge/new' }} />
      <UrlTabs tabs={tabs} />
      <SearchField label={t('knowledge.search')} value={q} onChange={setQ} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView
          query={query}
          skeleton="card"
          skeletonCount={6}
          empty={{
            message: t('knowledge.empty'),
            actionLabel: t('knowledge.emptyBtn'),
            to: '/community/knowledge/new',
          }}
        >
          {(all) => {
            const base = all.filter((a) =>
              tab === 'mine'
                ? a.mine
                : a.status === 'published' &&
                  a.kind === (tab === 'handover' ? 'handover-note' : 'article'),
            );
            const tags = [...new Set(base.flatMap((a) => a.tags))].sort();
            const n = q.trim().toLowerCase();
            const rows = base.filter(
              (a) =>
                (!tag || a.tags.includes(tag)) &&
                (!n || `${a.title} ${a.summary} ${a.tags.join(' ')}`.toLowerCase().includes(n)),
            );
            return (
              <>
                <div
                  className="ux4g-d-flex ux4g-flex-wrap gap-xs ux4g-mb-s ux4g-mt-s"
                  role="group"
                  aria-label={t('knowledge.tags')}
                >
                  {tags.map((x) => (
                    <button
                      key={x}
                      type="button"
                      className={`ux4g-filter-chip-m${tag === x ? ' active' : ''}`}
                      aria-pressed={tag === x}
                      onClick={() => setTag(tag === x ? '' : x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
                {rows.length ? (
                  <div className="grid-cards">
                    {rows.map((a) => (
                      <ArticleCard key={a.id} a={a} />
                    ))}
                  </div>
                ) : (
                  <p className="ux4g-text-neutral-secondary">{t('knowledge.empty')}</p>
                )}
              </>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
