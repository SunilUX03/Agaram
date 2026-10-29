import { useTranslation } from 'react-i18next';

interface Props {
  label: string;
  votes: number;
  total: number;
  showResult: boolean;
  mine?: boolean;
}

/** One poll option with a UX4G progress bar after the officer has voted. */
export function PollBar({ label, votes, total, showResult, mine }: Props) {
  const { t } = useTranslation();
  const pct = total ? Math.round((votes / total) * 100) : 0;
  return (
    <div className="ux4g-mb-m">
      <div className="ux4g-d-flex ux4g-jc-between gap-m ux4g-body-m-default">
        <span>
          {label}{' '}
          {mine && <span className="ux4g-tag-tonal-neutral ux4g-tag-s">{t('ui.poll.yours')}</span>}
        </span>
        {showResult && (
          <span>
            {pct}% · {t('ui.poll.votes', { count: votes })}
          </span>
        )}
      </div>
      {showResult && (
        <div
          className="ux4g-progress-bar ux4g-mt-xs"
          data-ux-progress-bar
          data-ux-shape="rounded"
          role="img"
          aria-label={`${label}: ${pct}%`}
          style={{ '--ux4g-progress-value': pct } as React.CSSProperties}
        >
          <div className="ux4g-progress-bar-track">
            <div className="ux4g-progress-bar-fill" />
          </div>
        </div>
      )}
    </div>
  );
}
