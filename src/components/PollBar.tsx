import { useTranslation } from 'react-i18next';

interface Props {
  label: string;
  votes: number;
  total: number;
  showResult: boolean;
  mine?: boolean;
}

export function PollBar({ label, votes, total, showResult, mine }: Props) {
  const { t } = useTranslation();
  const pct = total ? Math.round((votes / total) * 100) : 0;
  return (
    <div className="pollbar">
      <div className="pollbar-top">
        <span>
          {label}
          {mine && <span className="tag">{t('ui.poll.yours')}</span>}
        </span>
        {showResult && (
          <span>
            {pct}% · {t('ui.poll.votes', { count: votes })}
          </span>
        )}
      </div>
      {showResult && (
        <div className="pollbar-track" role="img" aria-label={`${label}: ${pct}%`}>
          <div className="pollbar-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
