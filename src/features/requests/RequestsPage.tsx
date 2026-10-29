import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { ListRow } from '@/components/ListRow';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { StatusChip } from '@/components/StatusChip';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { Select } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { REQUEST_TYPES, getRequestType } from '@/config/requests';
import { useQ } from '@/data/hooks';
import { formatDate, formatTime } from '@/domain/dates';
import { nextStepKey } from '@/domain/requests';
import type { RequestStatus } from '@/domain/status';
import type { Request } from '@/domain/types';

const GROUPS: Record<string, RequestStatus[] | null> = {
  all: null,
  'needs-action': ['returned', 'draft'],
  'in-review': ['submitted', 'with-desk', 'ready-for-approval'],
  approved: ['approved'],
  closed: ['rejected', 'withdrawn'],
};
export const requestLink = (r: Request) =>
  r.status === 'draft'
    ? `/requests/new/${r.type}?draft=${r.id}&step=${r.lastStep ?? 0}`
    : `/requests/${r.id}`;

export default function RequestsPage() {
  const { t, i18n } = useTranslation('requests');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('requests');
  const counts = Object.fromEntries(
    Object.entries(GROUPS).map(([k, v]) => [
      k,
      q.data ? q.data.filter((r) => !v || v.includes(r.status)).length : undefined,
    ]),
  );
  const tabs = Object.keys(GROUPS).map((id) => ({
    id,
    label: t(`list.tabs.${id}`),
    count: counts[id],
  }));
  const [tab] = useUrlTab(tabs);
  const [type, setType] = useUrlState('type');
  const [text, setText] = useUrlState('q');
  return (
    <>
      <RouteHeader id="requests" main={{ to: '/requests/new' }} />
      <UrlTabs tabs={tabs} />
      <div className="toolbar">
        <div className="grow">
          <SearchField label={t('list.search')} value={text} onChange={setText} />
        </div>
        <Select
          name="req-type"
          label={t('list.type')}
          value={type}
          onChange={setType}
          placeholder={t('list.allTypes')}
          options={REQUEST_TYPES.map((x) => ({ value: x.key, label: x.cardName }))}
        />
      </div>
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView
          query={q}
          skeleton="row"
          skeletonCount={5}
          empty={{ message: t('list.empty'), actionLabel: t('list.emptyBtn'), to: '/requests/new' }}
        >
          {(all) => {
            const g = GROUPS[tab];
            const n = text.trim().toLowerCase();
            const rows = all.filter(
              (r) =>
                (!g || g.includes(r.status)) &&
                (!type || r.type === type) &&
                (!n || r.title.toLowerCase().includes(n)),
            );
            if (!rows.length) return <EmptyState message={t('list.noMatch')} icon="search" />;
            return (
              <div className="ux4g-d-flex ux4g-flex-column">
                {rows.map((r) => (
                  <ListRow
                    key={r.id}
                    to={requestLink(r)}
                    icon={<Icon name={getRequestType(r.type)?.icon ?? 'requests'} />}
                    title={r.title}
                    meta={
                      <>
                        {r.submittedAt
                          ? t('list.sent', { date: formatDate(r.submittedAt, loc) })
                          : t('list.draftSaved')}{' '}
                        · {t(nextStepKey(r.status).replace('requests:', ''))} ·{' '}
                        {t('list.updated', {
                          time: `${formatDate(r.updatedAt, loc)}, ${formatTime(r.updatedAt, loc)}`,
                        })}
                      </>
                    }
                    chip={<StatusChip status={r.status} />}
                  />
                ))}
              </div>
            );
          }}
        </QueryView>
      </div>
      <Link to="/requests/new" className="ux4g-btn-primary ux4g-btn-m ux4g-radius-full fab">
        <Icon name="plus" /> {t('list.emptyBtn')}
      </Link>
    </>
  );
}
