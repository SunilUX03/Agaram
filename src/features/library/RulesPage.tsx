import { useTranslation } from 'react-i18next';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { LibraryRow } from './parts';

export default function RulesPage() {
  const { t } = useTranslation('library');
  const [q, setQ] = useUrlState('q');
  const query = useQ('library', ['rule']);
  return (
    <>
      <RouteHeader id="library.rules" />
      <SearchField label={t('rules.search')} value={q} onChange={setQ} />
      <div className="ux4g-mt-m">
        <QueryView query={query} skeleton="row" skeletonCount={5}>
          {(all) => {
            const n = q.trim().toLowerCase();
            const rows = all.filter(
              (r) => !n || `${r.title} ${r.number} ${r.description}`.toLowerCase().includes(n),
            );
            return rows.length ? (
              <ul className="plain-list">
                {rows.map((r) => (
                  <LibraryRow key={r.id} item={r} />
                ))}
              </ul>
            ) : (
              <p className="ux4g-text-neutral-secondary">{t('common.empty')}</p>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
