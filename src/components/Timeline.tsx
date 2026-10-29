import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface TimelineStep {
  id: string;
  title: ReactNode;
  date?: string;
  role?: string;
  note?: ReactNode;
  current?: boolean;
}

export function Timeline({ steps, label }: { steps: TimelineStep[]; label?: string }) {
  const { t } = useTranslation();
  return (
    <ol className="timeline" aria-label={label}>
      {steps.map((s) => (
        <li
          key={s.id}
          className={s.current ? 'is-current' : undefined}
          aria-current={s.current ? 'step' : undefined}
        >
          <span className="timeline-dot" aria-hidden="true" />
          <div>
            <div className="timeline-title">
              {s.title}
              {s.current && <span className="sr-only"> ({t('ui.timeline.current')})</span>}
            </div>
            {(s.date || s.role) && (
              <div className="timeline-meta">{[s.date, s.role].filter(Boolean).join(' · ')}</div>
            )}
            {s.note && <div className="timeline-note">{s.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
