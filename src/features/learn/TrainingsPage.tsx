import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { QueryView } from '@/components/QueryView';
import { ToggleButton } from '@/components/ToggleButton';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { RouteHeader } from '@/app/usePage';
import { useMut, useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { TrainingEvent } from '@/domain/types';

/** Builds a standard calendar file for one event and downloads it. */
export function downloadIcs(ev: TrainingEvent) {
  const d = (ev.date ?? new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const [h = '10', m = '00'] = (ev.time ?? '10:00').split(':');
  const start = `${d}T${h}${m}00`;
  const end = `${d}T${String(Number(h) + 2).padStart(2, '0')}${m}00`;
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agaram//Demo//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}@agaram.example`,
    `DTSTAMP:${start}`,
    `DTSTART;TZID=Asia/Kolkata:${start}`,
    `DTEND;TZID=Asia/Kolkata:${end}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${ev.title.replace(/\W+/g, '-')}.ics`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "{n} officers need this" plus the toggle. Count and state change at once, then settle. */
function InterestToggle({
  e,
  onChange,
}: {
  e: TrainingEvent;
  onChange: (on: boolean) => Promise<unknown>;
}) {
  const { t } = useTranslation('learn');
  const [delta, setDelta] = useState<number | null>(null);
  const shown = e.interestCount + (delta ?? 0);
  return (
    <>
      <span className="ux4g-body-s-default ux4g-text-neutral-secondary" aria-live="polite">
        {t('trainings.need', { count: shown })}
      </span>
      <ToggleButton
        label={t('trainings.needBtn')}
        onLabel={t('trainings.needOn')}
        pressed={e.interestedByMe}
        onChange={async (on) => {
          setDelta(on ? 1 : -1);
          try {
            await onChange(on);
          } finally {
            setDelta(null);
          }
        }}
      />
    </>
  );
}

export default function TrainingsPage() {
  const { t, i18n } = useTranslation('learn');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const tabs = ['upcoming', 'requested', 'past'].map((id) => ({
    id,
    label: t(`trainings.tabs.${id}`),
  }));
  const [tab] = useUrlTab(tabs);
  const q = useQ('trainingEvents');
  const need = useMut('toggleInterest');
  return (
    <>
      <RouteHeader id="learn.trainings" main={{ to: '/requests/new/training-request' }} />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="card" skeletonCount={3}>
          {(all) => {
            const rows = all.filter((e) =>
              tab === 'past'
                ? e.past
                : !e.past && (tab === 'upcoming' ? e.kind === 'official' : e.kind === 'requested'),
            );
            if (!rows.length)
              return <p className="ux4g-text-neutral-secondary">{t('trainings.empty')}</p>;
            if (tab === 'past')
              return (
                <ul className="plain-list">
                  {rows.map((e) => (
                    <li key={e.id} className="list-row">
                      <span className="list-row-main">
                        <span className="ux4g-body-m-strong">{e.title}</span>
                        <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                          {e.date && formatDate(e.date, loc)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              );
            return (
              <div className="grid-cards">
                {rows.map((e) => (
                  <Card key={e.id}>
                    <h3>{e.title}</h3>
                    <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {e.description}
                    </p>
                    {tab === 'upcoming' ? (
                      <>
                        <p style={{ marginTop: 8 }}>
                          <Icon name="calendar" size={16} />{' '}
                          {t('trainings.dateTime', {
                            date: e.date ? formatDate(e.date, loc) : '',
                            time: e.time,
                          })}
                        </p>
                        <div className="card-foot">
                          <button
                            type="button"
                            className="ux4g-btn-outline-primary ux4g-btn-s"
                            onClick={() => downloadIcs(e)}
                          >
                            {t('trainings.addCal')}
                          </button>
                          {e.links.map((l) => (
                            <a
                              key={l.url}
                              className="ux4g-text-link-md"
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('trainings.openRes')}
                            </a>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="card-foot">
                        <InterestToggle e={e} onChange={(on) => need.mutateAsync([e.id, on])} />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
