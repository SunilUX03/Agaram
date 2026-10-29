import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';

const GROUPS = ['officers', 'ideas', 'discussions', 'articles', 'library', 'requests'] as const;
type G = (typeof GROUPS)[number];
const SHOWN = 3;

export default function SearchPage() {
  const { t } = useTranslation('search');
  const [q, setQ] = useUrlState('q');
  const [only, setOnly] = useUrlState('group');
  const [expanded, setExpanded] = useState<G[]>([]);
  const box = useRef<HTMLInputElement>(null);
  const ready = q.trim().length >= 2;
  const query = useQ('search', ready ? q.trim() : '');
  return (
    <>
      <RouteHeader id="search" />
      <SearchField ref={box} label={t('label')} value={q} onChange={setQ} />
      {!ready ? (
        <p className="ux4g-text-neutral-secondary ux4g-mt-m">{t('hint')}</p>
      ) : (
        <QueryView query={query} skeleton="row" skeletonCount={5}>
          {(res) => {
            const counts = Object.fromEntries(GROUPS.map((g) => [g, res[g].length])) as Record<
              G,
              number
            >;
            const total = GROUPS.reduce((s, g) => s + counts[g], 0);
            if (!total)
              return (
                <div className="empty">
                  <p>{t('none', { query: q })}</p>
                </div>
              );
            return (
              <>
                <div
                  className="ux4g-d-flex ux4g-flex-wrap gap-xs ux4g-mt-m ux4g-mb-xs"
                  role="group"
                >
                  {['', ...GROUPS.filter((g) => counts[g])].map((g) => (
                    <button
                      key={g || 'all'}
                      type="button"
                      className={`ux4g-filter-chip-m${only === g ? ' active' : ''}`}
                      aria-pressed={only === g}
                      onClick={() => setOnly(g)}
                    >
                      {g ? `${t(`groups.${g}`)} (${counts[g as G]})` : t('all')}
                    </button>
                  ))}
                </div>
                {GROUPS.filter((g) => counts[g] && (!only || only === g)).map((g) => {
                  const open = expanded.includes(g) || !!only;
                  const list = res[g].slice(0, open ? 50 : SHOWN) as Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
                  return (
                    <section key={g} className="section" aria-label={t(`groups.${g}`)}>
                      <div className="section-head">
                        <h2 className="ux4g-heading-m-strong">
                          {t(`groups.${g}`)}{' '}
                          <span className="ux4g-text-neutral-secondary ux4g-body-s-default">
                            ({counts[g]})
                          </span>
                        </h2>
                        {!only && counts[g] > SHOWN && (
                          <button
                            type="button"
                            className="ux4g-btn-text-primary ux4g-btn-s"
                            onClick={() =>
                              setExpanded(open ? expanded.filter((x) => x !== g) : [...expanded, g])
                            }
                          >
                            {open ? t('showLess') : t('showAll')}
                          </button>
                        )}
                      </div>
                      <ul className="plain-list">
                        {list.map((r) => (
                          <li key={r.id}>
                            {g === 'officers' && (
                              <Link className="list-row" to={`/people/colleagues/${r.id}`}>
                                <Avatar name={r.name} photoUrl={r.photoUrl} size={40} />
                                <span className="list-row-main">
                                  <span className="ux4g-body-m-strong">{r.name}</span>
                                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                    {r.designation}, {r.district}
                                  </span>
                                </span>
                              </Link>
                            )}
                            {g === 'ideas' && (
                              <Link className="list-row" to={`/community/ideas/${r.id}`}>
                                <span className="list-row-main">
                                  <span className="ux4g-body-m-strong">{r.title}</span>
                                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                    {r.type}
                                  </span>
                                </span>
                                <StatusChip status={`idea:${r.status}`} />
                              </Link>
                            )}
                            {g === 'discussions' && (
                              <Link className="list-row" to={`/community/discussions/${r.id}`}>
                                <span className="list-row-main">
                                  <span className="ux4g-body-m-strong">{r.title}</span>
                                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                    {r.anonymous ? '' : r.author?.name}
                                  </span>
                                </span>
                              </Link>
                            )}
                            {g === 'articles' && (
                              <Link className="list-row" to={`/community/knowledge/${r.id}`}>
                                <span className="list-row-main">
                                  <span className="ux4g-body-m-strong">{r.title}</span>
                                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                    {r.tags?.map((x: string) => (
                                      <Tag key={x}>{x}</Tag>
                                    ))}
                                  </span>
                                </span>
                              </Link>
                            )}
                            {g === 'library' && (
                              <Link
                                className="list-row"
                                to={
                                  r.kind === 'form'
                                    ? '/library/forms'
                                    : r.kind === 'faq'
                                      ? '/library/faqs'
                                      : r.kind === 'rule'
                                        ? '/library/rules'
                                        : r.kind === 'announcement'
                                          ? '/library/announcements'
                                          : '/library/circulars'
                                }
                              >
                                <span className="list-row-main">
                                  <span className="ux4g-body-m-strong">{r.title}</span>
                                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                    {r.number}
                                  </span>
                                </span>
                              </Link>
                            )}
                            {g === 'requests' && (
                              <Link className="list-row" to={`/requests/${r.id}`}>
                                <span className="list-row-main">
                                  <span className="ux4g-body-m-strong">{r.title}</span>
                                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                                    {r.ref}
                                  </span>
                                </span>
                                <StatusChip status={r.status} />
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </>
            );
          }}
        </QueryView>
      )}
    </>
  );
}
