import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  label: ReactNode;
  allowed: number;
  used: number;
}

/** Circular meter showing days left. The label should already include its help text. */
export function BalanceMeter({ label, allowed, used }: Props) {
  const { t } = useTranslation();
  const remaining = Math.max(allowed - used, 0);
  const pct = allowed ? remaining / allowed : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <figure className="meter">
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
      <figcaption>
        <strong>{label}</strong>
        <span>{t('ui.balance.left', { remaining, allowed })}</span>
      </figcaption>
    </figure>
  );
}
