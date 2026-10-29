import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  label: ReactNode;
  allowed: number;
  used: number;
}

/** Circular UX4G progress indicator showing days left. */
export function BalanceMeter({ label, allowed, used }: Props) {
  const { t } = useTranslation();
  const remaining = Math.max(allowed - used, 0);
  const pct = allowed ? remaining / allowed : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <figure className="ux4g-card ux4g-card-outline ux4g-card-vertical meter">
      <div className="ux4g-card-body ux4g-d-flex ux4g-ai-center gap-m">
        <div className="ux4g-progress-circle meter-ring">
          <svg viewBox="0 0 80 80" width="96" height="96" aria-hidden="true">
            <circle cx="40" cy="40" r={r} className="meter-track" />
            <circle
              cx="40"
              cy="40"
              r={r}
              className="meter-fill"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="46" textAnchor="middle" className="meter-num">
              {remaining}
            </text>
          </svg>
        </div>
        <figcaption className="ux4g-d-flex ux4g-flex-column">
          <strong className="ux4g-label-l-strong">{label}</strong>
          <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
            {t('ui.balance.left', { remaining, allowed })}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
