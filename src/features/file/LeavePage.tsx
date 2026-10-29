import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Abbr } from '@/components/Abbr';
import { BalanceMeter } from '@/components/BalanceMeter';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { StatusChip } from '@/components/StatusChip';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { Select } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import { OrderLink } from './Order';

const KEYS = ['cl', 'rh', 'el', 'hpl'] as const;

export default function LeavePage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const nav = useNavigate();
  const tabs = [
    { id: 'balance', label: t('leave.tabs.balance') },
    { id: 'history', label: t('leave.tabs.history') },
  ];
  const [tab] = useUrlTab(tabs);
  const [year, setYear] = useUrlState('year', 'all');
  const bal = useQ('leaveBalance');
  const leaves = useQ('leaves');
  return (
    <>
      <RouteHeader id="file.leave" main={{ to: '/requests/new/leave' }} />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'balance' ? (
          <QueryView query={bal} skeleton="card" skeletonCount={4}>
            {(b) => (
              <>
                <div className="meters">
                  {KEYS.map((k) => (
                    <BalanceMeter
                      key={k}
                      label={<Abbr k={k.toUpperCase() as 'CL'}>{t(`leave.labels.${k}`)}</Abbr>}
                      allowed={b[k].allowed}
                      used={b[k].used}
                    />
                  ))}
                </div>
                <p className="ux4g-text-neutral-secondary">{t('leave.updatedNote')}</p>
              </>
            )}
          </QueryView>
        ) : (
          <QueryView
            query={leaves}
            skeleton="table"
            skeletonCount={5}
            empty={{
              message: t('leave.empty'),
              actionLabel: t('leave.emptyBtn'),
              to: '/requests/new/leave',
            }}
          >
            {(rows) => {
              const years = [...new Set(rows.map((r) => r.from.slice(0, 4)))].sort().reverse();
              const shown = rows
                .filter((r) => year === 'all' || r.from.startsWith(year))
                .sort((a, b) => b.from.localeCompare(a.from));
              return (
                <>
                  <div className="toolbar">
                    <Select
                      name="leave-year"
                      label={t('leave.year')}
                      value={year === 'all' ? '' : year}
                      placeholder={t('leave.allYears')}
                      onChange={(v) => setYear(v || 'all')}
                      options={years.map((y) => ({ value: y, label: y }))}
                    />
                  </div>
                  <ResponsiveTable
                    caption={t('leave.history')}
                    rows={shown}
                    rowKey={(r) => r.id}
                    onRowClick={(r) => r.requestId && nav(`/requests/${r.requestId}`)}
                    columns={[
                      {
                        key: 'type',
                        header: t('leave.cols.type'),
                        mobile: 'title',
                        sortValue: (r) => r.type,
                      },
                      {
                        key: 'from',
                        header: t('leave.from'),
                        render: (r) => formatDate(r.from, loc),
                        sortValue: (r) => r.from,
                      },
                      { key: 'to', header: t('leave.to'), render: (r) => formatDate(r.to, loc) },
                      { key: 'days', header: t('leave.days'), sortValue: (r) => r.days },
                      {
                        key: 'status',
                        header: t('leave.status'),
                        render: (r) => (
                          <>
                            <StatusChip status={r.status} /> <OrderLink orderId={r.orderId} />
                          </>
                        ),
                      },
                    ]}
                  />
                </>
              );
            }}
          </QueryView>
        )}
      </div>
    </>
  );
}
