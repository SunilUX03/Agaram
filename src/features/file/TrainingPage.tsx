import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon';
import { QueryView } from '@/components/QueryView';
import { Tag } from '@/components/Tag';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import { OrderLink } from './Order';

export default function TrainingPage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('trainings');
  return (
    <>
      <RouteHeader id="file.training" main={{ to: '/requests/new/training-request' }} />
      <QueryView query={q} skeleton="row" empty={{ message: t('training.empty') }}>
        {(rows) => (
          <ul className="plain-list">
            {rows
              .slice()
              .sort((a, b) => b.from.localeCompare(a.from))
              .map((r) => (
                <li key={r.id} className="list-row">
                  <span className="list-row-icon">
                    <Icon name="book" />
                  </span>
                  <span className="list-row-main">
                    <span className="list-row-title">{r.type}</span>
                    <span className="list-row-meta">
                      {t('training.dates', {
                        from: formatDate(r.from, loc),
                        to: formatDate(r.to, loc),
                      })}{' '}
                      · {r.institute}
                      {r.country && (
                        <>
                          {' '}
                          · <Tag>{r.country}</Tag>
                        </>
                      )}
                    </span>
                  </span>
                  <OrderLink orderId={r.orderId} />
                </li>
              ))}
          </ul>
        )}
      </QueryView>
    </>
  );
}
