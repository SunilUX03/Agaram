import { useTranslation } from 'react-i18next';
import { MenuButton } from '@/components/MenuButton';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { StatusChip } from '@/components/StatusChip';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { RouteHeader, usePageText } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate, formatINR } from '@/domain/dates';

const KINDS = ['ltc', 'medical', 'hba', 'gpf', 'mha-id', 'saf', 'education'] as const;

export default function BenefitsPage() {
  const { t, i18n } = useTranslation('file');
  const p = usePageText('file.benefits');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const tabs = KINDS.map((k) => ({ id: k, label: t(`benefits.tabs.${k}`) }));
  const [tab] = useUrlTab(tabs);
  const q = useQ('benefits');
  return (
    <>
      <RouteHeader
        id="file.benefits"
        main={
          <MenuButton
            label={p.main}
            options={KINDS.map((k) => ({
              label: t(`benefits.menu.${k}`),
              to: `/requests/new/${k}`,
            }))}
          />
        }
      />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="table" skeletonCount={4}>
          {(rows) => {
            const shown = rows
              .filter((r) => r.kind === tab)
              .sort((a, b) => b.date.localeCompare(a.date));
            if (!shown.length) return <p className="muted">{t('benefits.empty')}</p>;
            const total = shown.reduce((s, r) => s + (r.amount ?? 0), 0);
            const strip =
              tab === 'ltc'
                ? t('benefits.strip.ltc', {
                    block: `${new Date().getFullYear()} to ${new Date().getFullYear() + 1}`,
                    n: shown.length,
                  })
                : tab === 'gpf'
                  ? t('benefits.strip.gpf', { amount: formatINR(total, loc) })
                  : t('benefits.strip.default', { n: shown.length });
            return (
              <>
                <p className="strip">{strip}</p>
                <ResponsiveTable
                  caption={t(`benefits.tabs.${tab}`)}
                  rows={shown}
                  rowKey={(r) => r.id}
                  columns={[
                    { key: 'summary', header: t('benefits.cols.summary'), mobile: 'title' },
                    {
                      key: 'amount',
                      header: t('benefits.cols.amount'),
                      render: (r) => (r.amount ? formatINR(r.amount, loc) : '—'),
                    },
                    {
                      key: 'date',
                      header: t('benefits.cols.date'),
                      render: (r) => formatDate(r.date, loc),
                    },
                    {
                      key: 'status',
                      header: t('benefits.cols.status'),
                      render: (r) => <StatusChip status={r.status} />,
                    },
                  ]}
                />
              </>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
