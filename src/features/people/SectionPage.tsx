import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { ErrorState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { NotFound } from '@/app/NotFound';
import { useQ } from '@/data/hooks';
import { teamOf } from '@/domain/people';

export default function SectionPage() {
  const { departmentId = '', postId = '' } = useParams();
  const { t } = useTranslation('people');
  const q = useQ('departments');
  const colleagues = useQ('colleagues');
  const [open, setOpen] = useState<string[]>([]);
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  const dep = q.data.find((d) => d.id === departmentId);
  const post = dep?.posts.find((p) => p.id === postId);
  if (!dep || !post) return <NotFound />;
  const officer = colleagues.data?.find((c) => c.id === post.officerId);
  const above = dep.posts.find((p) => p.id === post.reportsToPostId);
  const team = teamOf(dep, post);
  return (
    <>
      <PageHeader
        headline={post.title}
        tagline={dep.name}
        breadcrumb={[
          {
            label: t('routes.community_colleagues.headline'),
            to: '/community/colleagues?tab=subject',
          },
          { label: dep.name, to: `/community/colleagues?tab=subject&dept=${dep.id}` },
          { label: post.title },
        ]}
      />
      <div className="form-narrow stack">
        {officer ? (
          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad officer-card"
            aria-label={t('section.officer')}
          >
            <Avatar name={officer.name} photoUrl={officer.photoUrl} size={64} decorative />
            <div className="officer-card-body">
              <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                {t('section.officer')}
              </p>
              <p>
                <Link to={`/community/colleagues/${officer.id}`} className="ux4g-heading-xs-strong">
                  {officer.name}
                </Link>
              </p>
              <p>{officer.designation}</p>
              <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                {[
                  officer.batch
                    ? t('colleague.service', { service: officer.service, batch: officer.batch })
                    : officer.service,
                  officer.department,
                ].join(' · ')}
              </p>
              <p className="ux4g-body-s-default">
                <a href={`mailto:${officer.officialEmail}`}>{officer.officialEmail}</a>
              </p>
              <Link
                to={`/community/colleagues/${officer.id}`}
                className="ux4g-btn-outline-primary ux4g-btn-m ux4g-mt-s"
              >
                {t('section.openProfile')}
              </Link>
            </div>
          </section>
        ) : (
          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad ux4g-d-flex ux4g-ai-center gap-s"
            aria-label={t('section.officer')}
          >
            <Icon name="user" size={32} />
            <p>{t('section.noOfficer')}</p>
          </section>
        )}
        {(above || team.length > 0) && (
          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
            aria-labelledby="chain-h"
          >
            <h2 id="chain-h" className="ux4g-heading-xs-strong">
              {t('colleague.reporting')}
            </h2>
            {above && (
              <p>
                <span className="ux4g-text-neutral-secondary">{t('section.reportsTo')}: </span>
                <Link to={`/community/colleagues/subject/${dep.id}/${above.id}`}>
                  {t('section.postLine', {
                    post: above.title,
                    name: above.officerName ?? t('section.vacant'),
                  })}
                </Link>
              </p>
            )}
            {team.length > 0 && (
              <>
                <h3 className="ux4g-label-l-default ux4g-text-neutral-secondary ux4g-mt-s">
                  {t('section.team')}
                </h3>
                <ul className="plain-list stack-sm">
                  {team.map((x) => (
                    <li key={x.id}>
                      <Link to={`/community/colleagues/subject/${dep.id}/${x.id}`}>
                        {t('section.postLine', {
                          post: x.title,
                          name: x.officerName ?? t('section.vacant'),
                        })}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
        <section aria-labelledby="sec-h">
          <h2 id="sec-h" className="ux4g-heading-xs-strong">
            {t('section.oversees', { n: post.sections.length })}
          </h2>
          <ul className="accordion plain-list">
            {post.sections.map((s) => {
              const isOpen = open.includes(s.id);
              if (s === post.sections[0])
                return (
                  <li key={s.id} className="acc-item acc-static">
                    <h3 className="ux4g-heading-xs-strong">
                      {s.name}{' '}
                      <span className="ux4g-text-neutral-secondary ux4g-body-s-default">
                        · {t('section.subjects', { count: s.subjects.length })}
                      </span>
                    </h3>
                    <div className="tags">
                      {s.subjects.map((x) => (
                        <span key={x} className="ux4g-tag-tonal-neutral ux4g-tag-s">
                          {x}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              return (
                <li key={s.id} className="acc-item">
                  <h3 className="ux4g-heading-xs-strong">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpen(isOpen ? open.filter((x) => x !== s.id) : [...open, s.id])
                      }
                    >
                      <span>
                        {s.name}{' '}
                        <span className="ux4g-text-neutral-secondary ux4g-body-s-default">
                          · {t('section.subjects', { count: s.subjects.length })}
                        </span>
                      </span>
                      <Icon name="down" size={18} />
                    </button>
                  </h3>
                  <div hidden={!isOpen}>
                    <div className="tags">
                      {s.subjects.map((x) => (
                        <span key={x} className="ux4g-tag-tonal-neutral ux4g-tag-s">
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
