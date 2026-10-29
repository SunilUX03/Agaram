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
  return (
    <>
      <PageHeader
        headline={post.title}
        tagline={dep.name}
        main={
          post.officerId ? (
            <Link to={`/people/colleagues/${post.officerId}`} className="btn btn-primary">
              {t('routes.people_section.main')}
            </Link>
          ) : undefined
        }
        breadcrumb={[
          { label: t('routes.people_whodoeswhat.headline'), to: '/people/who-does-what' },
          { label: dep.name, to: `/people/who-does-what?dept=${dep.id}` },
          { label: post.title },
        ]}
      />
      <div className="form-narrow stack">
        <section className="card row" aria-label={t('section.inCharge')}>
          {officer ? (
            <Avatar name={officer.name} photoUrl={officer.photoUrl} size={56} />
          ) : (
            <Icon name="user" size={32} />
          )}
          <div>
            <p className="card-meta">{t('section.inCharge')}</p>
            <strong>{post.officerName ?? t('section.notOnFile')}</strong>
          </div>
        </section>
        <section aria-labelledby="sec-h">
          <h2 id="sec-h" className="h-sm">
            {t('section.oversees', { n: post.sections.length })}
          </h2>
          <ul className="accordion plain-list">
            {post.sections.map((s) => {
              const isOpen = open.includes(s.id);
              return (
                <li key={s.id} className="acc-item">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpen(isOpen ? open.filter((x) => x !== s.id) : [...open, s.id])
                      }
                    >
                      <span>
                        {s.name}{' '}
                        <span className="muted small">
                          · {t('section.subjects', { count: s.subjects.length })}
                        </span>
                      </span>
                      <Icon name="down" size={18} />
                    </button>
                  </h3>
                  <div hidden={!isOpen}>
                    <div className="tags">
                      {s.subjects.map((x) => (
                        <span key={x} className="tag">
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
