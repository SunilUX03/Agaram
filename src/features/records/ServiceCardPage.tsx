import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Abbr } from '@/components/Abbr';
import { BalanceMeter } from '@/components/BalanceMeter';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable, type Column } from '@/components/ResponsiveTable';
import { Select } from '@/components/form/inputs';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { UrlTabs, useUrlTab, type TabDef } from '@/components/UrlTabs';
import { useUrlState } from '@/components/useUrlState';
import { NotFound } from '@/app/NotFound';
import { RouteHeader } from '@/app/usePage';
import { getServiceCard, supportsPast, type ServiceCardDef } from '@/config/services';
import { useQ } from '@/data/hooks';
import { formatDate, formatINR } from '@/domain/dates';
import { useLocale } from './shared';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const KEYS = ['cl', 'rh', 'el', 'hpl'] as const;

/** One service card's page: summary, history and the two buttons. Built from `services.cards`. */
export default function ServiceCardPage() {
  const { card: key } = useParams();
  const card = getServiceCard(key);
  if (!card) return <NotFound />;
  return <CardView card={card} />;
}

function CardView({ card }: { card: ServiceCardDef }) {
  const { t } = useTranslation('records');
  const common = useTranslation().t;
  const loc = useLocale();
  const nav = useNavigate();
  const rows = useQ('cardRows', card.key);
  const balance = useQ('leaveBalance');
  const [year, setYear] = useUrlState('year');
  const tabs: TabDef[] = [
    { id: 'balance', label: t('leave.tabBalance') },
    { id: 'history', label: t('leave.tabHistory') },
  ];
  const [tab] = useUrlTab(tabs);
  const showBalance = card.balanceTab && tab === 'balance';

  const columns: Column<Row>[] = card.columns.map((c) => ({
    key: c.key,
    header: c.header,
    mobile: c.mobile,
    render: (r: Row) => {
      switch (c.kind) {
        case 'date':
          return formatDate(r[c.key], loc);
        case 'inr':
          return formatINR(Number(r[c.key]));
        case 'status':
          return <StatusChip status={r[c.key]} />;
        case 'source':
          return r.source === 'paper' ? <Tag>{t('source.paper')}</Tag> : '';
        case 'readonly':
          return (
            <span>
              {r[c.key]}
              <span className="sr-only"> ({t('medical.readonly')})</span>
            </span>
          );
        default:
          return String(c.value ? c.value(r) : (r[c.key] ?? ''));
      }
    },
  }));

  const year0 = (r: Row) => String(r.from ?? r.date ?? '').slice(0, 4);
  const years = [...new Set((rows.data ?? []).map(year0))].sort().reverse();
  const secondary = supportsPast(card) ? (
    <Link
      className="ux4g-btn-outline-primary ux4g-btn-m"
      to={`/records/services/${card.key}/add-past`}
    >
      {card.pastLabel}
    </Link>
  ) : undefined;

  return (
    <>
      <RouteHeader
        id="records.service"
        headline={t(`cards.${card.key}.headline`, { defaultValue: card.headline })}
        tagline={t(`cards.${card.key}.tagline`, { defaultValue: card.tagline })}
        main={{
          label: t(`cards.${card.key}.main`, { defaultValue: card.main }),
          to: `/records/services/${card.key}/new`,
        }}
        secondary={secondary}
        breadcrumb={[
          { label: common('nav.records'), to: '/records' },
          { label: common('nav.services'), to: '/records/services' },
          { label: card.title },
        ]}
      />
      {card.balanceTab && <UrlTabs tabs={tabs} label={card.title} />}
      <div id="tabpanel" role="tabpanel">
        {showBalance ? (
          <QueryView query={balance} skeleton="card" skeletonCount={2}>
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
                <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-m">
                  {t('leave.balanceNote')}
                </p>
              </>
            )}
          </QueryView>
        ) : (
          <>
            {card.note && (
              <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-mb-s">
                {t(`cards.${card.key}.note`, { defaultValue: card.note })}
              </p>
            )}
            <QueryView
              query={rows}
              skeleton="row"
              skeletonCount={5}
              empty={{
                message: t('history.empty'),
                actionLabel: card.main,
                to: `/records/services/${card.key}/new`,
              }}
            >
              {(all) => {
                const list = (all as Row[]).filter((r) => !year || year0(r) === year);
                const strip = card.strip(all as unknown[], {
                  balance: balance.data,
                  year: new Date().getFullYear(),
                });
                return (
                  <>
                    <p className="ux4g-body-m-strong ux4g-mb-m">{strip}</p>
                    {card.balanceTab && (
                      <div className="filterbar-controls ux4g-mb-m">
                        <Select
                          name="hist-year"
                          label={t('history.year')}
                          value={year}
                          onChange={setYear}
                          placeholder={t('history.allYears')}
                          options={years.map((y) => ({ value: y, label: y }))}
                        />
                      </div>
                    )}
                    <ResponsiveTable
                      caption={t('history.caption', { name: card.title })}
                      columns={columns}
                      rows={list}
                      rowKey={(r) => r.id}
                      onRowClick={(r) => r.requestId && nav(`/records/requests/${r.requestId}`)}
                    />
                  </>
                );
              }}
            </QueryView>
          </>
        )}
      </div>
    </>
  );
}
