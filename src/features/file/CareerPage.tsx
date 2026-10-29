import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { KeyValueList } from '@/components/KeyValueList';
import { QueryView } from '@/components/QueryView';
import { Tag } from '@/components/Tag';
import { Timeline } from '@/components/Timeline';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import { OrderLink } from './Order';

const FILTERS = ['all', 'posting', 'transfer', 'promotion'] as const;

export default function CareerPage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const [filter, setFilter] = useUrlState('filter', 'all');
  const career = useQ('career');
  const officer = useQ('officer');
  return (
    <>
      <RouteHeader id="file.career" main={{ to: '/requests/new/correction' }} />
      {officer.data && (
        <section className="section" aria-label={t('career.current')}>
          <Card>
            <h2 className="ux4g-heading-xs-strong">{t('career.current')}</h2>
            <div className="tags" style={{ margin: '8px 0 12px' }}>
              <Tag>{officer.data.currentPosting.postType}</Tag>
              <Tag>{officer.data.currentPosting.locationChange}</Tag>
            </div>
            <KeyValueList
              items={[
                { label: t('career.postingIn'), value: officer.data.currentPosting.postingIn },
                { label: t('career.department'), value: officer.data.currentPosting.department },
                { label: t('career.designation'), value: officer.data.currentPosting.designation },
                { label: t('career.office'), value: officer.data.currentPosting.officeAddress },
                { label: t('career.phone'), value: officer.data.currentPosting.phone },
                { label: t('career.fax'), value: officer.data.currentPosting.fax },
              ].filter((x) => x.value)}
            />
          </Card>
        </section>
      )}
      <div
        className="ux4g-d-flex ux4g-flex-wrap ux4g-gap-xs ux4g-mb-s"
        role="group"
        aria-label={t('career.filter')}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`ux4g-filter-chip-m${filter === f ? ' active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {t(`career.filters.${f}`)}
          </button>
        ))}
      </div>
      <QueryView query={career} skeleton="row" empty={{ message: t('career.empty') }}>
        {(rows) => {
          const shown = rows.filter((c) => filter === 'all' || c.kind === filter);
          if (!shown.length)
            return <p className="ux4g-text-neutral-secondary">{t('career.empty')}</p>;
          return (
            <Timeline
              label={t('career.timeline')}
              steps={shown.map((c, i) => ({
                id: c.id,
                current: i === 0 && filter === 'all',
                title: (
                  <>
                    <Tag>{t(`career.kind.${c.kind}`)}</Tag> {c.designation}
                  </>
                ),
                date: c.toDate
                  ? t('career.fromTo', {
                      from: formatDate(c.fromDate, loc),
                      to: formatDate(c.toDate, loc),
                    })
                  : t('career.since', { from: formatDate(c.fromDate, loc) }),
                role: c.department + (c.postingIn ? `, ${c.postingIn}` : ''),
                note: (
                  <>
                    {c.kind === 'promotion' && (
                      <p>{t('career.promoted', { from: c.fromGrade, to: c.toGrade })}</p>
                    )}
                    <OrderLink orderId={c.orderId} />
                  </>
                ),
              }))}
            />
          );
        }}
      </QueryView>
    </>
  );
}
