import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { Select } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useIsDesktop } from '@/components/hooks';
import { useQ } from '@/data/hooks';
import type { Department, OrgPost } from '@/domain/types';

const subjectsOf = (p: OrgPost) => p.sections.flatMap((s) => s.subjects);
const matches = (p: OrgPost, n: string) =>
  !!n &&
  `${p.title} ${p.officerName ?? ''} ${p.sections.map((s) => s.name).join(' ')} ${subjectsOf(p).join(' ')}`
    .toLowerCase()
    .includes(n);

export default function WhoDoesWhatPage() {
  const { t } = useTranslation('people');
  const desktop = useIsDesktop();
  const [params] = useSearchParams();
  const [q, setQ] = useUrlState('q');
  const [dep, setDep] = useUrlState('dept');
  const [filter, setFilter] = useState('');
  const box = useRef<HTMLInputElement>(null);
  const query = useQ('departments');
  useEffect(() => {
    if (params.get('focus') === 'search') box.current?.focus();
  }, [params]);
  const n = q.trim().toLowerCase();
  const list = (all: Department[]) =>
    all.filter(
      (d) =>
        (!n || d.posts.some((p) => matches(p, n))) &&
        d.name.toLowerCase().includes(filter.toLowerCase()),
    );
  return (
    <>
      <RouteHeader id="people.whodoeswhat" main={{ onClick: () => box.current?.focus() }} />
      <QueryView query={query} skeleton="row" skeletonCount={6}>
        {(all) => {
          const depts = list(all);
          const current = all.find((d) => d.id === dep) ?? (desktop ? depts[0] : undefined);
          return (
            <div className="who">
              <aside className="who-list" aria-label={t('who.dept')}>
                {desktop ? (
                  <>
                    <label className="sr-only" htmlFor="dept-filter">
                      {t('who.filterDepts')}
                    </label>
                    <input
                      id="dept-filter"
                      className="input"
                      placeholder={t('who.filterDepts')}
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                    <ul className="plain-list">
                      {depts.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            className="who-dept"
                            aria-current={current?.id === d.id}
                            onClick={() => setDep(d.id)}
                          >
                            {d.name}
                          </button>
                        </li>
                      ))}
                      {!depts.length && <li className="muted">{t('who.noMatch')}</li>}
                    </ul>
                  </>
                ) : (
                  <Select
                    name="who-dept"
                    label={t('who.dept')}
                    value={dep}
                    placeholder={t('who.selectDept')}
                    onChange={setDep}
                    options={depts.map((d) => ({ value: d.id, label: d.name }))}
                  />
                )}
              </aside>
              <div>
                <SearchField ref={box} label={t('who.searchSubject')} value={q} onChange={setQ} />
                {current ? (
                  <section aria-label={current.name} style={{ marginTop: 16 }}>
                    <h2 className="h-sm">{current.name}</h2>
                    <p className="small muted">{t('who.chain')}</p>
                    <div className="stack-sm">
                      {current.posts.map((p) => {
                        const hit = matches(p, n);
                        return (
                          <Card
                            key={p.id}
                            to={`/people/who-does-what/${current.id}/${p.id}`}
                            className={hit ? 'is-hit' : undefined}
                          >
                            <div className="row" style={{ justifyContent: 'space-between' }}>
                              <h3>{p.title}</h3>
                              {hit && (
                                <span className="chip chip-warning-soft">{t('who.match')}</span>
                              )}
                            </div>
                            <p>
                              {p.officerName ?? <span className="muted">{t('who.notOnFile')}</span>}
                            </p>
                            <p className="card-meta clamp-2">
                              {t('who.handles', { subjects: subjectsOf(p).slice(0, 6).join(', ') })}
                            </p>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <p className="muted" style={{ marginTop: 16 }}>
                    {t('who.selectDept')}
                  </p>
                )}
              </div>
            </div>
          );
        }}
      </QueryView>
      <Link to="/people/colleagues" className="sr-only">
        {t('routes.people_colleagues.headline')}
      </Link>
    </>
  );
}
