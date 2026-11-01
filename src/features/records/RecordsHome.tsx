import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { QueryView } from '@/components/QueryView';
import { Select } from '@/components/form/inputs';
import { Tag } from '@/components/Tag';
import { UrlTabs, useUrlTab, type TabDef } from '@/components/UrlTabs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { REQUEST_TYPES } from '@/config/requests';
import { useQ } from '@/data/hooks';
import type { Request } from '@/domain/types';
import { NewRequestFab, NewRequestMenu, RequestRow, SectionHead } from './shared';

const WAITING_ON_YOU: Request['status'][] = ['returned', 'draft'];
const CHANGE_TYPES = ['profile-edit', 'posting', 'promotion', 'correction'];

const GROUPS = {
  all: () => true,
  action: (r: Request) => WAITING_ON_YOU.includes(r.status),
  waiting: (r: Request) => r.status === 'submitted',
  approved: (r: Request) => r.status === 'approved',
  closed: (r: Request) => ['rejected', 'withdrawn'].includes(r.status),
} as const;

/** Records & Requests Home: what is waiting on you, your requests, pending changes, and where to go. */
export default function RecordsHome() {
  const { t } = useTranslation('records');
  const requests = useQ('requests');
  const [type, setType] = useUrlState('type');
  const data = requests.data ?? [];
  const count = (k: keyof typeof GROUPS) => data.filter(GROUPS[k]).length;
  const tabs: TabDef[] = (['all', 'action', 'waiting', 'approved', 'closed'] as const).map((k) => ({
    id: k,
    label: t(`home.tabs.${k}`),
    count: requests.data ? count(k) : undefined,
  }));
  const [tab] = useUrlTab(tabs);

  return (
    <>
      <RouteHeader id="records" main={<NewRequestMenu />} />

      <section aria-labelledby="rh-waiting" className="ux4g-mb-xl">
        <SectionHead id="rh-waiting" title={t('home.waiting')} />
        <QueryView query={requests} skeleton="row" skeletonCount={2}>
          {(all) => {
            const rows = all
              .filter(GROUPS.action)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            return rows.length ? (
              <ul className="plain-list">
                {rows.map((r) => (
                  <li key={r.id}>
                    <RequestRow r={r} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message={t('home.caughtUp')} icon="check" />
            );
          }}
        </QueryView>
      </section>

      <section aria-labelledby="rh-mine" className="ux4g-mb-xl">
        <SectionHead id="rh-mine" title={t('home.mine')} />
        <UrlTabs tabs={tabs} label={t('home.mine')} />
        <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          <div className="filterbar-controls ux4g-mb-m">
            <Select
              name="req-type"
              label={t('home.type')}
              value={type}
              onChange={setType}
              placeholder={t('home.allTypes')}
              options={REQUEST_TYPES.map((x) => ({ value: x.key, label: x.cardName }))}
            />
          </div>
          <QueryView
            query={requests}
            skeleton="row"
            skeletonCount={5}
            empty={{ message: t('home.noRequests') }}
          >
            {(all) => {
              const rows = all
                .filter(GROUPS[tab as keyof typeof GROUPS])
                .filter((r) => !type || r.type === type);
              return rows.length ? (
                <ul className="plain-list">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <RequestRow r={r} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ux4g-body-m-default ux4g-text-neutral-secondary">
                  {t('home.noRequests')}
                </p>
              );
            }}
          </QueryView>
        </div>
      </section>

      {(requests.data ?? []).some(
        (r) => CHANGE_TYPES.includes(r.type) && r.status === 'submitted',
      ) && (
        <section aria-labelledby="rh-changes" className="ux4g-mb-xl">
          <SectionHead id="rh-changes" title={t('home.changes')} tagline={t('home.changesTag')} />
          <ul className="plain-list">
            {(requests.data ?? [])
              .filter((r) => CHANGE_TYPES.includes(r.type) && r.status === 'submitted')
              .map((r) => (
                <li key={r.id}>
                  <RequestRow r={r} extra={<Tag>{t('pending.chip')}</Tag>} />
                </li>
              ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="rh-goto">
        <SectionHead id="rh-goto" title={t('home.goto')} />
        <div className="cols-auto">
          {(
            [
              ['profile', '/records/profile', 'user'],
              ['services', '/records/services', 'work'],
              ['downloads', '/records/downloads', 'download'],
            ] as const
          ).map(([k, to, icon]) => (
            <Link
              key={k}
              to={to}
              className="ux4g-card ux4g-card-outline ux4g-card-vertical card-link"
            >
              <span className="ux4g-card-body ux4g-d-flex ux4g-flex-column gap-xs tile-body">
                <span className="tile-icon" aria-hidden="true">
                  <Icon name={icon} size={28} />
                </span>
                <span className="ux4g-heading-xs-strong">{t(`home.go.${k}.title`)}</span>
                <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t(`home.go.${k}.body`)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <NewRequestFab />
    </>
  );
}
