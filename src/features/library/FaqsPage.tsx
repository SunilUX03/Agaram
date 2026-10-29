import { useTranslation } from 'react-i18next';
import { Accordion } from '@/components/Accordion';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';

const TOPICS = ['all', 'LTC', 'Medical', 'GPF', 'Leave', 'Other'];

export default function FaqsPage() {
  const { t } = useTranslation('library');
  const [q, setQ] = useUrlState('q');
  const [topic, setTopic] = useUrlState('topic', 'all');
  const query = useQ('library', ['faq']);
  return (
    <>
      <RouteHeader
        id="library.faqs"
        main={{ to: '/community/discussions/new?type=discussion&ask=1' }}
      />
      <SearchField label={t('faqs.search')} value={q} onChange={setQ} />
      <div className="pick-chips" role="group" style={{ margin: '16px 0' }}>
        {TOPICS.map((x) => (
          <button
            key={x}
            type="button"
            className="pick"
            aria-pressed={topic === x}
            onClick={() => setTopic(x)}
          >
            {t(`faqs.topics.${x}`)}
          </button>
        ))}
      </div>
      <QueryView query={query} skeleton="row" skeletonCount={6}>
        {(all) => {
          const n = q.trim().toLowerCase();
          const rows = all.filter(
            (f) =>
              (topic === 'all' || f.topic === topic) &&
              (!n || `${f.title} ${f.answer}`.toLowerCase().includes(n)),
          );
          return rows.length ? (
            <Accordion
              items={rows.map((f) => ({ id: f.id, title: f.title, content: <p>{f.answer}</p> }))}
            />
          ) : (
            <p className="muted">{t('common.empty')}</p>
          );
        }}
      </QueryView>
    </>
  );
}
