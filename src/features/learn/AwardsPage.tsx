import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
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

export default function AwardsPage() {
  const { t, i18n } = useTranslation('learn');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const tabs = ['awards', 'awardees'].map((id) => ({ id, label: t(`awards.tabs.${id}`) }));
  const [tab] = useUrlTab(tabs);
  const [pick, setPick] = useState('');
  const q = useQ('awards');
  return (
    <>
      <RouteHeader id="learn.awards" />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="card" skeletonCount={3}>
          {(all) =>
            tab === 'awards' ? (
              <div className="grid-cards">
                {all.map((a) => {
                  const open = isOpen(a);
                  return (
                    <Card key={a.id}>
                      <StatusChip status={open ? 'award:open' : 'award:closed'} />
                      <h3 className="ux4g-heading-xs-strong ux4g-mt-xs">{a.name}</h3>
                      <p>{a.description}</p>
                      <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                        <strong>{t('awards.eligibility')}:</strong> {a.eligibility}
                      </p>
                      <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                        <strong>{t('awards.timeline')}:</strong> {a.timeline}
                      </p>
                      {a.opensOn && a.closesOn && (
                        <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                          {t('awards.window', {
                            from: formatDate(a.opensOn, loc),
                            to: formatDate(a.closesOn, loc),
                          })}
                        </p>
                      )}
                      {open && a.link && (
                        <div className="card-foot">
                          <a
                            className="ux4g-btn-primary ux4g-btn-s"
                            href={a.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('awards.apply')}
                          </a>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="form-narrow">
                <Select
                  name="award-pick"
                  label={t('awards.pick')}
                  value={pick || all[0]?.id}
                  onChange={setPick}
                  options={all.map((a) => ({ value: a.id, label: a.name }))}
                />
                {(() => {
                  const a = all.find((x) => x.id === (pick || all[0]?.id));
                  if (!a?.awardees.length)
                    return <p className="ux4g-text-neutral-secondary">{t('awards.empty')}</p>;
                  const years = [...new Set(a.awardees.map((w) => w.year))].sort((x, y) => y - x);
                  return years.map((y) => (
                    <section key={y} className="section">
                      <h3 className="ux4g-heading-xs-strong">{y}</h3>
                      <ul className="plain-list">
                        {a.awardees
                          .filter((w) => w.year === y)
                          .map((w) => (
                            <li key={w.name} className="list-row">
                              {t('awards.by', { name: w.name, designation: w.designation })}
                            </li>
                          ))}
                      </ul>
                    </section>
                  ));
                })()}
              </div>
            )
          }
        </QueryView>
      </div>
    </>
  );
}
