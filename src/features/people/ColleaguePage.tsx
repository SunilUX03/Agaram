import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Dialog } from '@/components/Dialog';
import { ErrorState } from '@/components/EmptyState';
import { KeyValueList, type KeyValue } from '@/components/KeyValueList';
import { Skeleton } from '@/components/Skeleton';
import { Tag } from '@/components/Tag';
import { NotFound } from '@/app/NotFound';
import { features } from '@/config/features';
import { useQ } from '@/data/hooks';
import { getDirectReports, getReportingLine, postOf } from '@/domain/people';
import type { Colleague } from '@/domain/types';
import { useLoc } from '@/features/community/parts';

const card = 'ux4g-card ux4g-card-outline ux4g-card-vertical card-pad';
const person = (c: Colleague) => `/community/colleagues/${c.id}`;

/** One linked officer: small avatar, name, designation. */
function PersonLink({ c, size = 40 }: { c: Colleague; size?: number }) {
  return (
    <Link to={person(c)} className="person-link">
      <Avatar name={c.name} photoUrl={c.photoUrl} size={size} decorative />
      <span>
        <strong>{c.name}</strong>
        <span className="ux4g-body-s-default ux4g-text-neutral-secondary">{c.designation}</span>
      </span>
    </Link>
  );
}

/** The colleague profile: header, About, Current posting, Handles, Previous postings, Reporting structure, Contact. */
export default function ColleaguePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('people');
  const loc = useLoc();
  const q = useQ('colleague', id);
  const all = useQ('colleagues');
  const deps = useQ('departments');
  const [showAllPrev, setShowAllPrev] = useState(false);
  const [panel, setPanel] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);
  const name = q.data?.name;
  useEffect(() => {
    window.scrollTo(0, 0);
    h1.current?.focus({ preventScroll: true });
  }, [name]);
  useEffect(() => {
    if (name) document.title = t('app.title', { ns: 'common', headline: name });
  }, [name, t]);
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const c = q.data;
  const everyone = all.data ?? [];
  const held = deps.data ? postOf(deps.data, c) : undefined;
  const line = getReportingLine(everyone, c.id, 4);
  const boss = line[0];
  const reports = getDirectReports(everyone, c.id);
  const prev = c.previousPostings;
  const shownPrev = showAllPrev ? prev.slice(0, 10) : prev.slice(0, 5);

  const about: KeyValue[] = (
    [
      {
        label: t('colleague.serviceBatch'),
        value: c.batch
          ? t('colleague.service', { service: c.service, batch: c.batch })
          : t('colleague.serviceOnly', { service: c.service }),
      },
      c.languages.length
        ? { label: t('colleague.languages'), value: c.languages.join(', ') }
        : undefined,
      features.colleagues.showEducation && c.qualifications.length
        ? {
            label: t('colleague.qualifications'),
            value: (
              <ul className="plain-list">
                {c.qualifications.slice(0, 3).map((x) => (
                  <li key={x.degree + x.institute}>{t('colleague.qualification', x)}</li>
                ))}
              </ul>
            ),
          }
        : undefined,
      c.areaOfExposure
        ? {
            label: t('colleague.area'),
            value: (
              <span className="chips">
                {c.areaOfExposure.split(',').map((a) => (
                  <Tag key={a}>{a.trim()}</Tag>
                ))}
              </span>
            ),
          }
        : undefined,
    ] as (KeyValue | undefined)[]
  ).filter((x): x is KeyValue => !!x);

  const current: KeyValue[] = (
    [
      { label: t('colleague.designation'), value: c.designation },
      c.department ? { label: t('colleague.department'), value: c.department } : undefined,
      c.district ? { label: t('colleague.location'), value: c.district } : undefined,
      c.postedSince
        ? {
            label: t('colleague.since'),
            value: new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(
              new Date(c.postedSince),
            ),
          }
        : undefined,
      c.officeAddress ? { label: t('colleague.officeAddress'), value: c.officeAddress } : undefined,
      c.officePhone ? { label: t('colleague.officePhone'), value: c.officePhone } : undefined,
      c.officialEmail
        ? {
            label: t('colleague.officialEmail'),
            value: <a href={`mailto:${c.officialEmail}`}>{c.officialEmail}</a>,
          }
        : undefined,
    ] as (KeyValue | undefined)[]
  ).filter((x): x is KeyValue => !!x);

  return (
    <>
      <Breadcrumb
        items={[
          { label: t('routes.community_colleagues.headline'), to: '/community/colleagues' },
          { label: c.name },
        ]}
      />
      <section className={`${card} profile-head ux4g-mb-m`} aria-labelledby="col-name">
        <Avatar name={c.name} photoUrl={c.photoUrl} size={96} decorative />
        <div className="profile-head-body">
          <h1
            id="col-name"
            ref={h1}
            tabIndex={-1}
            className="ux4g-heading-l-strong profile-head-name"
          >
            {c.name}
          </h1>
          <p className="ux4g-body-m-default">{c.designation}</p>
          {c.district && c.department && (
            <p className="ux4g-body-m-default ux4g-text-neutral-secondary">
              {t('colleague.posting', { place: c.district, department: c.department })}
            </p>
          )}
          <div className="chips ux4g-mt-xs">
            <Tag>
              {c.batch
                ? t('colleague.service', { service: c.service, batch: c.batch })
                : t('colleague.serviceOnly', { service: c.service })}
            </Tag>
            {c.statusNote && <Tag>{c.statusNote}</Tag>}
          </div>
          <div className="ux4g-d-flex ux4g-flex-wrap gap-s ux4g-mt-m">
            <a className="ux4g-btn-primary ux4g-btn-m" href={`mailto:${c.officialEmail}`}>
              {t('colleague.email')}
            </a>
            {held && (
              <Link
                className="ux4g-btn-outline-primary ux4g-btn-m"
                to={`/community/colleagues/subject/${held.dept.id}/${held.post.id}`}
              >
                {t('colleague.seeInSubject')}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <aside className="profile-side">
          <section className={card} aria-labelledby="rep-h">
            <h2 id="rep-h" className="ux4g-heading-xs-strong">
              {t('colleague.reporting')}
            </h2>
            <h3 className="ux4g-label-l-default ux4g-text-neutral-secondary ux4g-mt-s">
              {t('colleague.reportsTo')}
            </h3>
            {boss ? <PersonLink c={boss} /> : <p>{t('colleague.reportsNone')}</p>}
            {line.length > 1 && (
              <>
                <h3 className="ux4g-label-l-default ux4g-text-neutral-secondary ux4g-mt-s">
                  {t('colleague.line')}
                </h3>
                <ol className="plain-list line-list">
                  {line.map((x) => (
                    <li key={x.id}>
                      <Link to={person(x)}>{x.name}</Link>
                      <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                        {' '}
                        · {x.designation}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {reports.length > 0 && (
              <>
                <h3 className="ux4g-label-l-default ux4g-text-neutral-secondary ux4g-mt-s">
                  {t('colleague.direct')} ({reports.length})
                </h3>
                <ul className="plain-list mini-people">
                  {reports.slice(0, 5).map((x) => (
                    <li key={x.id}>
                      <Link to={person(x)} className="person-link">
                        <Avatar name={x.name} photoUrl={x.photoUrl} size={32} decorative />
                        <span>{x.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {reports.length > 5 && (
                  <button
                    type="button"
                    className="ux4g-btn-text-primary ux4g-btn-s"
                    onClick={() => setPanel(true)}
                  >
                    {t('colleague.seeAll', { n: reports.length })}
                  </button>
                )}
              </>
            )}
          </section>
          <section className={card} aria-labelledby="contact-h">
            <h2 id="contact-h" className="ux4g-heading-xs-strong">
              {t('colleague.contact')}
            </h2>
            <ul className="plain-list contact-list">
              <li>
                <a href={`mailto:${c.officialEmail}`}>{c.officialEmail}</a>
              </li>
              {c.officePhone && <li>{c.officePhone}</li>}
              {c.officeAddress && <li>{c.officeAddress}</li>}
            </ul>
            <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
              {t('colleague.personal')}
            </p>
          </section>
        </aside>

        <div className="profile-main">
          {about.length > 0 && (
            <section className={card} aria-labelledby="about-h">
              <h2 id="about-h" className="ux4g-heading-xs-strong">
                {t('colleague.about')}
              </h2>
              <KeyValueList items={about} />
            </section>
          )}
          {current.length > 0 && (
            <section className={card} aria-labelledby="cur-h">
              <h2 id="cur-h" className="ux4g-heading-xs-strong">
                {t('colleague.current')}
              </h2>
              <KeyValueList items={current} />
            </section>
          )}
          {c.handles.length > 0 && (
            <section className={card} aria-labelledby="hand-h">
              <h2 id="hand-h" className="ux4g-heading-xs-strong">
                {t('colleague.handles')}
              </h2>
              <ul className="chips plain-list">
                {c.handles.map((h) => (
                  <li key={h.label}>
                    <Link
                      className="ux4g-tag-tonal-neutral ux4g-tag-s chip-link"
                      to={`/community/colleagues/subject/${h.departmentId}/${h.postId}`}
                    >
                      {h.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {features.colleagues.showCareerHistory && prev.length > 0 && (
            <section className={card} aria-labelledby="prev-h">
              <h2 id="prev-h" className="ux4g-heading-xs-strong">
                {t('colleague.previous')}
              </h2>
              <ol className="plain-list prev-list">
                {shownPrev.map((x) => (
                  <li key={`${x.designation}${x.from}`}>
                    <strong>{x.designation}</strong>
                    <span className="ux4g-text-neutral-secondary">
                      {x.department}, {x.place}
                    </span>
                    <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {t('colleague.years', { from: x.from, to: x.to })}
                    </span>
                  </li>
                ))}
              </ol>
              {prev.length > 5 && (
                <button
                  type="button"
                  className="ux4g-btn-text-primary ux4g-btn-s"
                  aria-expanded={showAllPrev}
                  onClick={() => setShowAllPrev((v) => !v)}
                >
                  {showAllPrev ? t('colleague.showFewer') : t('colleague.showAll')}
                </button>
              )}
            </section>
          )}
        </div>
      </div>

      {panel && (
        <Dialog
          title={t('colleague.directPanel', { name: c.name })}
          variant="full"
          onClose={() => setPanel(false)}
        >
          <ul className="plain-list stack-sm">
            {reports.map((x) => (
              <li key={x.id}>
                <PersonLink c={x} />
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </>
  );
}
