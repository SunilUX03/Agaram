import { useTranslation } from 'react-i18next';
import { QueryView } from '@/components/QueryView';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { FilterBar } from '@/components/FilterBar';
import { Checkbox, Select } from '@/components/form/inputs';
import { useUrlClear, useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { DEPARTMENTS, TN_DISTRICTS, toOptions } from '@/config/options';
import { useQ } from '@/data/hooks';
import type { Idea } from '@/domain/types';
import { IdeaCard } from './parts';

const IDEA_TYPES = [
  'Flagship initiative',
  'Best practice',
  'Pilot proposal',
  'Policy request',
  'Resource request',
  'Coordination issue',
  'Scheme feedback',
  'Last-mile gap',
  'Law and order',
  'General suggestion',
  'Other',
];
const DAY = 86400000;
/** Trending sorts by backers with a boost for recent ideas. */
export const trendScore = (i: Idea) =>
  i.backerCount + Math.max(0, 14 - (Date.now() - new Date(i.createdAt).getTime()) / DAY) * 1.5;

export default function IdeasPage() {
  const { t } = useTranslation('community');
  const tabs = ['trending', 'latest', 'backed', 'mine'].map((id) => ({
    id,
    label: t(`ideas.tabs.${id}`),
  }));
  const [tab] = useUrlTab(tabs);
  const [type, setType] = useUrlState('type');
  const [district, setDistrict] = useUrlState('district');
  const [dept, setDept] = useUrlState('dept');
  const [grievance, setGrievance] = useUrlState('grievance');
  const q = useQ('ideas');
  const clearUrl = useUrlClear();
  const active = [
    type && { key: 'type', label: type },
    district && { key: 'district', label: district },
    dept && { key: 'dept', label: dept },
    grievance && { key: 'grievance', label: t('ideas.grievance') },
  ].filter(Boolean) as { key: string; label: string }[];
  const clear = (k: string) => clearUrl([k]);
  return (
    <>
      <RouteHeader id="community.ideas" main={{ to: '/community/ideas/new' }} />
      <UrlTabs tabs={tabs} />
      <FilterBar
        active={active}
        onRemove={clear}
        onClear={() => clearUrl(['type', 'district', 'dept', 'grievance'])}
      >
        <Select
          name="f-type"
          label={t('ideas.type')}
          value={type}
          onChange={setType}
          placeholder={t('ideas.all')}
          options={toOptions(IDEA_TYPES)}
        />
        <Select
          name="f-district"
          label={t('ideas.district')}
          value={district}
          onChange={setDistrict}
          placeholder={t('ideas.all')}
          options={toOptions(TN_DISTRICTS)}
        />
        <Select
          name="f-dept"
          label={t('ideas.department')}
          value={dept}
          onChange={setDept}
          placeholder={t('ideas.all')}
          options={toOptions(DEPARTMENTS)}
        />
        <Checkbox
          name="f-grievance"
          label={t('ideas.grievance')}
          checked={!!grievance}
          onChange={(v) => setGrievance(v ? '1' : '')}
        />
      </FilterBar>
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="card" skeletonCount={6}>
          {(all) => {
            let rows = all.filter(
              (i) =>
                (!type || i.type === type) &&
                (!district || i.district === district) &&
                (!dept || i.department === dept) &&
                (!grievance || i.grievance),
            );
            if (tab === 'backed') rows = rows.filter((i) => i.backedByMe);
            if (tab === 'mine') rows = rows.filter((i) => i.mine);
            rows = rows
              .slice()
              .sort(
                tab === 'trending'
                  ? (a, b) => trendScore(b) - trendScore(a)
                  : (a, b) => b.createdAt.localeCompare(a.createdAt),
              );
            if (!rows.length)
              return (
                <div className="empty">
                  <p>{t('ideas.empty')}</p>
                  <a className="btn btn-primary" href="/community/ideas/new">
                    {t('ideas.emptyBtn')}
                  </a>
                </div>
              );
            return (
              <div className="grid-cards">
                {rows.map((i) => (
                  <IdeaCard key={i.id} idea={i} />
                ))}
              </div>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
