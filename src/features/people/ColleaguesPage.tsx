import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { FilterBar } from '@/components/FilterBar';
import { LoadMore } from '@/components/Pagination';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { Tag } from '@/components/Tag';
import { Select } from '@/components/form/inputs';
import { useUrlClear, useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { DEPARTMENTS, TN_DISTRICTS, toOptions } from '@/config/options';
import { useQ } from '@/data/hooks';
import type { Colleague } from '@/domain/types';

const PAGE = 24;
const SERVICES = ['IAS', 'IPS', 'IFS', 'TNCS'];

export function ColleagueCard({ c }: { c: Colleague }) {
  const { t } = useTranslation('people');
  return (
    <Link
      to={`/people/colleagues/${c.id}`}
      className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad card-link colleague-card"
    >
      <Avatar name={c.name} photoUrl={c.photoUrl} size={56} />
      <div className="colleague-main">
        <h3>{c.name}</h3>
        <p className="ux4g-body-s-default ux4g-text-neutral-secondary">{c.designation}</p>
        <div className="tags" style={{ margin: '6px 0' }}>
          <Tag>
            {c.service}
            {c.batch ? ` · ${t('colleagues.batch', { year: c.batch })}` : ''}
          </Tag>
          {c.statusNote && <Tag>{t(`colleagues.status.${c.statusNote}`)}</Tag>}
        </div>
        <p className="ux4g-body-s-default ux4g-text-neutral-secondary clamp-2">
          {t('colleagues.posting', { district: c.district, department: c.department })}
        </p>
      </div>
    </Link>
  );
}

export default function ColleaguesPage() {
  const { t } = useTranslation('people');
  const [q, setQ] = useUrlState('q');
  const [district, setDistrict] = useUrlState('district');
  const [dept, setDept] = useUrlState('dept');
  const [service, setService] = useUrlState('service');
  const clearUrl = useUrlClear();
  const [params] = useSearchParams();
  const [shown, setShown] = useState(PAGE);
  const box = useRef<HTMLInputElement>(null);
  const query = useQ('colleagues');
  useEffect(() => {
    if (params.get('focus') === 'search') box.current?.focus();
  }, [params]);
  const active = [
    district && { key: 'district', label: district },
    dept && { key: 'dept', label: dept },
  ].filter(Boolean) as { key: string; label: string }[];
  return (
    <>
      <RouteHeader id="people.colleagues" main={{ onClick: () => box.current?.focus() }} />
      <div className="sticky-search">
        <SearchField
          ref={box}
          label={t('colleagues.search')}
          value={q}
          onChange={(v) => (setQ(v), setShown(PAGE))}
        />
      </div>
      <FilterBar
        active={active}
        onRemove={(k) => clearUrl([k])}
        onClear={() => clearUrl(['district', 'dept'])}
      >
        <Select
          name="col-district"
          label={t('colleagues.district')}
          value={district}
          onChange={setDistrict}
          placeholder={t('colleagues.all')}
          options={toOptions(TN_DISTRICTS)}
        />
        <Select
          name="col-dept"
          label={t('colleagues.department')}
          value={dept}
          onChange={setDept}
          placeholder={t('colleagues.all')}
          options={toOptions(DEPARTMENTS)}
        />
      </FilterBar>
      <div
        className="ux4g-d-flex ux4g-flex-wrap ux4g-gap-xs ux4g-mb-s"
        role="group"
        aria-label={t('colleagues.services')}
      >
        {['', ...SERVICES].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={`ux4g-filter-chip-m${service === s ? ' active' : ''}`}
            aria-pressed={service === s}
            onClick={() => setService(s)}
          >
            {s || t('colleagues.all')}
          </button>
        ))}
      </div>
      <QueryView query={query} skeleton="card" skeletonCount={6}>
        {(all) => {
          const n = q.trim().toLowerCase();
          const rows = all.filter(
            (c) =>
              (!service || c.service === service) &&
              (!district || c.district === district) &&
              (!dept || c.department?.startsWith(dept)) &&
              (!n ||
                `${c.name} ${c.designation} ${c.district} ${c.department} ${c.areaOfExposure}`
                  .toLowerCase()
                  .includes(n)),
          );
          return (
            <>
              <p className="ux4g-text-neutral-secondary" aria-live="polite">
                {t('colleagues.found', { count: rows.length })}
              </p>
              {rows.length === 0 ? (
                <EmptyState
                  message={t('colleagues.empty')}
                  icon="search"
                  actionLabel={t('colleagues.clear')}
                  onAction={() => (clearUrl(['district', 'dept', 'service', 'q']), setQ(''))}
                />
              ) : (
                <>
                  <div className="grid-cards">
                    {rows.slice(0, shown).map((c) => (
                      <ColleagueCard key={c.id} c={c} />
                    ))}
                  </div>
                  <LoadMore hidden={shown >= rows.length} onClick={() => setShown(shown + PAGE)} />
                </>
              )}
            </>
          );
        }}
      </QueryView>
    </>
  );
}
