import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { QueryView } from '@/components/QueryView';
import { StatusChip } from '@/components/StatusChip';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { Select } from '@/components/form/inputs';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { Award } from '@/domain/types';

/** Open or closed is worked out from the dates. */
export const isOpen = (a: Award, now = new Date()) =>
  !!a.opensOn && !!a.closesOn && new Date(a.opensOn) <= now && now <= new Date(a.closesOn);

const daysUntil = (iso: string, now = new Date()) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000));

/** Within this many days the "closes in" line is emphasised. */
const URGENT_DAYS = 30;

export default function AwardsPage() {
  const { t, i18n } = useTranslation('learn');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const tabs = ['awards', 'awardees'].map((id) => ({ id, label: t(`awards.tabs.${id}`) }));
  const [tab] = useUrlTab(tabs);
  const [pick, setPick] = useState('');
  const [detail, setDetail] = useState<Award | null>(null);
  const q = useQ('awards');

  const windowOf = (a: Award) =>
    a.opensOn && a.closesOn
      ? t('awards.windowValue', {
          from: formatDate(a.opensOn, loc),
          to: formatDate(a.closesOn, loc),
        })
      : t('awards.noWindow');

  const AwardCard = ({ a }: { a: Award }) => {
    const open = isOpen(a);
    const days = a.closesOn ? daysUntil(a.closesOn) : 0;
    return (
      <Card className={`award-card${open ? '' : ' is-closed'}`}>
        <div className="award-top">
          <StatusChip status={open ? 'award:open' : 'award:closed'} />
          {open && a.closesOn && (
            <span
              className={`ux4g-body-s-default ${days <= URGENT_DAYS ? 'award-urgent' : 'ux4g-text-neutral-secondary'}`}
            >
              {t('awards.closesIn', { count: days })}
            </span>
          )}
        </div>
        <h3 className="ux4g-heading-xs-strong award-title">{a.name}</h3>
        <p className="ux4g-text-neutral-secondary clamp-2">{a.summary}</p>
        <hr className="award-divider" />
        <dl className="award-facts">
          <div>
            <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">{t('awards.who')}</dt>
            <dd>{a.whoCanApply}</dd>
          </div>
          <div>
            <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">
              {t('awards.windowLabel')}
            </dt>
            <dd>{windowOf(a)}</dd>
          </div>
        </dl>
        <div className="award-foot">
          {open && a.link && (
            <a
              className="ux4g-btn-primary ux4g-btn-m"
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('awards.apply')}
            </a>
          )}
          <button
            type="button"
            className="ux4g-btn-text-primary ux4g-btn-m"
            onClick={() => setDetail(a)}
          >
            {t('awards.details')}
            <span className="sr-only"> {a.name}</span>
          </button>
          {!open && a.nextCycle && (
            <p className="ux4g-body-s-default ux4g-text-neutral-secondary award-next">
              {t('awards.next', { text: a.nextCycle })}
            </p>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <RouteHeader id="community.awards" />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="card" skeletonCount={3}>
          {(all) => {
            if (tab === 'awards') {
              const open = all.filter((a) => isOpen(a));
              const closed = all.filter((a) => !isOpen(a));
              const group = (id: string, label: string, list: Award[]) =>
                list.length > 0 && (
                  <section aria-labelledby={id} className="award-group">
                    <h2 id={id} className="ux4g-heading-s-strong">
                      {label}
                    </h2>
                    <div className="award-grid">
                      {list.map((a) => (
                        <AwardCard key={a.id} a={a} />
                      ))}
                    </div>
                  </section>
                );
              return (
                <>
                  {group('aw-open', t('awards.open', { n: open.length }), open)}
                  {group('aw-closed', t('awards.closed', { n: closed.length }), closed)}
                </>
              );
            }
            const a = all.find((x) => x.id === (pick || all[0]?.id));
            const years = a
              ? [...new Set(a.awardees.map((w) => w.year))].sort((x, y) => y - x)
              : [];
            return (
              <div className="form-narrow">
                <Select
                  name="award-pick"
                  label={t('awards.pick')}
                  value={pick || all[0]?.id}
                  onChange={setPick}
                  options={all.map((x) => ({ value: x.id, label: x.name }))}
                />
                {!a?.awardees.length ? (
                  <p className="ux4g-text-neutral-secondary">{t('awards.empty')}</p>
                ) : (
                  years.map((y) => (
                    <section key={y} className="section" aria-labelledby={`yr-${y}`}>
                      <h3 id={`yr-${y}`} className="ux4g-heading-xs-strong">
                        {y}
                      </h3>
                      <ul className="plain-list">
                        {a.awardees
                          .filter((w) => w.year === y)
                          .map((w) => (
                            <li key={w.name} className="list-row person-row">
                              <Avatar name={w.name} size={40} decorative />
                              <span>
                                <strong>{w.name}</strong>
                                <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                  {w.designation}
                                </span>
                              </span>
                            </li>
                          ))}
                      </ul>
                    </section>
                  ))
                )}
              </div>
            );
          }}
        </QueryView>
      </div>
      {detail && (
        <Dialog
          title={t('awards.detailsTitle', { name: detail.name })}
          variant="full"
          onClose={() => setDetail(null)}
        >
          <div className="stack">
            <p>{detail.description}</p>
            <dl className="award-facts">
              <div>
                <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t('awards.eligibility')}
                </dt>
                <dd>{detail.eligibility}</dd>
              </div>
              <div>
                <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t('awards.timeline')}
                </dt>
                <dd>{detail.timeline}</dd>
              </div>
              <div>
                <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t('awards.windowLabel')}
                </dt>
                <dd>{windowOf(detail)}</dd>
              </div>
              {detail.resultsOn && (
                <div>
                  <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">
                    {t('awards.results')}
                  </dt>
                  <dd>{formatDate(detail.resultsOn, loc)}</dd>
                </div>
              )}
              {detail.link && (
                <div>
                  <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">
                    {t('awards.link')}
                  </dt>
                  <dd>
                    <a href={detail.link} target="_blank" rel="noopener noreferrer">
                      {detail.link}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {!isOpen(detail) && detail.awardees.length > 0 && (
              <section aria-labelledby="aw-people">
                <h3 id="aw-people" className="ux4g-heading-xs-strong">
                  {t('awards.awardees')}
                </h3>
                <ul className="plain-list">
                  {[...detail.awardees]
                    .sort((x, y) => y.year - x.year)
                    .map((w) => (
                      <li key={w.name} className="list-row person-row">
                        <Avatar name={w.name} size={40} decorative />
                        <span>
                          <strong>{w.name}</strong>
                          <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                            {w.designation}, {w.year}
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
