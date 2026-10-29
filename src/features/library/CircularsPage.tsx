import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '@/components/FilterBar';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { Select } from '@/components/form/inputs';
import { useUrlClear, useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { LibraryRow } from './parts';

export default function CircularsPage() {
  const { t } = useTranslation('library');
  const [q, setQ] = useUrlState('q');
  const [type, setType] = useUrlState('type');
  const [year, setYear] = useUrlState('year');
  const clear = useUrlClear();
  const box = useRef<HTMLInputElement>(null);
  const query = useQ('library', ['circular', 'go']);
  const years = [...new Set((query.data ?? []).map((r) => r.date.slice(0, 4)))]
    .sort()
    .reverse()
    .map((y) => ({ value: y, label: y }));
  const active = [
    type && { key: 'type', label: t(`circulars.types.${type}`) },
    year && { key: 'year', label: year },
  ].filter(Boolean) as { key: string; label: string }[];
  return (
    <>
      <RouteHeader id="library.circulars" main={{ onClick: () => box.current?.focus() }} />
      <SearchField ref={box} label={t('circulars.search')} value={q} onChange={setQ} />
      <FilterBar
        active={active}
        onRemove={(k) => clear([k])}
        onClear={() => clear(['type', 'year'])}
      >
        <Select
          name="circ-type"
          label={t('circulars.type')}
          value={type}
          onChange={setType}
          placeholder={t('circulars.all')}
          options={['Circular', 'GO', 'Special entry'].map((x) => ({
            value: x,
            label: t(`circulars.types.${x}`),
          }))}
        />
        <Select
          name="circ-year"
          label={t('circulars.year')}
          value={year}
          onChange={setYear}
          placeholder={t('circulars.all')}
          options={years}
        />
      </FilterBar>
      <QueryView query={query} skeleton="row" skeletonCount={6}>
        {(all) => {
          const n = q.trim().toLowerCase();
          const rows = all.filter(
            (r) =>
              (!type || r.type === type) &&
              (!year || (r.number ?? '').endsWith(`/${year}`) || r.date.startsWith(year)) &&
              (!n || `${r.title} ${r.number} ${r.date}`.toLowerCase().includes(n)),
          );
          return rows.length ? (
            <ul className="plain-list">
              {rows.map((r) => (
                <LibraryRow key={r.id} item={r} save />
              ))}
            </ul>
          ) : (
            <p className="ux4g-text-neutral-secondary">{t('common.empty')}</p>
          );
        }}
      </QueryView>
    </>
  );
}
