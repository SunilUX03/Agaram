import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface TimelineStep {
  id: string;
  title: ReactNode;
  date?: string;
  role?: string;
  note?: ReactNode;
  current?: boolean;
  /** A step that has not happened yet. */
  pending?: boolean;
}

/** UX4G journey timeline (vertical). Marks the current step and supports a note under a step. */
export function Timeline({ steps, label }: { steps: TimelineStep[]; label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="ux4g-journey-timeline ux4g-journey-timeline--vertical"
      role="list"
      aria-label={label}
    >
      {steps.map((s) => (
        <div
          key={s.id}
          className={`ux4g-journey-step${!s.pending && !s.current ? ' ux4g-journey-step-completed' : ''}${s.current ? ' ux4g-journey-step-active' : ''}`}
          role="listitem"
          aria-current={s.current ? 'step' : undefined}
        >
          <span className="ux4g-journey-indicator" aria-hidden="true">
            <i className="ux4g-icon-outlined">check</i>
          </span>
          <div className="ux4g-journey-info">
            <div className="ux4g-journey-title">
              {s.title}
              {s.current && <span className="sr-only"> ({t('ui.timeline.current')})</span>}
            </div>
            {(s.date || s.role) && (
              <div className="ux4g-journey-date">
                {[s.date, s.role].filter(Boolean).join(' · ')}
              </div>
            )}
            {s.note && <div className="ux4g-journey-description">{s.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
