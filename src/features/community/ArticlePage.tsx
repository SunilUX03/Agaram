import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { NotFound } from '@/app/NotFound';
import { useMut, useQ } from '@/data/hooks';
import { sanitizeHtml } from '@/domain/sanitize';
import { ArticleCard } from './parts';

export default function ArticlePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('community');
  const q = useQ('article', id);
  const all = useQ('articles');
  const save = useMut('toggleSaved');
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const a = q.data;
  const related = (all.data ?? [])
    .filter(
      (x) => x.id !== a.id && x.status === 'published' && x.tags.some((tg) => a.tags.includes(tg)),
    )
    .slice(0, 3);
  return (
    <>
      <PageHeader
        headline={a.title}
        tagline={t('knowledge.role', { role: a.authorRole, district: a.district ?? '' })}
        main={
          <ToggleButton
            label={t('knowledge.saveDesk')}
            onLabel={t('knowledge.savedDesk')}
            icon="bookmark"
            pressed={a.savedByMe}
            onChange={(on) => save.mutateAsync(['article', a.id, on])}
          />
        }
        image={
          <div className="article-lead card-image" style={{ margin: 0, borderRadius: 14 }}>
            {a.leadImageUrl ? <img src={a.leadImageUrl} alt="" /> : <span className="lead-tint" />}
          </div>
        }
        breadcrumb={[
          { label: t('routes.community_knowledge.headline'), to: '/community/knowledge' },
          { label: a.title },
        ]}
      />
      <article className="form-narrow stack">
        <div className="tags">
          {a.tags.map((x) => (
            <Tag key={x}>{x}</Tag>
          ))}
        </div>
        <p style={{ fontSize: 18 }}>{a.summary}</p>
        {a.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="ux4g-heading-xs-strong">{s.heading}</h2>
            <div className="rich-out" dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.body) }} />
          </section>
        ))}
        {a.attachments.length > 0 && (
          <section>
            <h2 className="ux4g-heading-xs-strong">{t('knowledge.attachments')}</h2>
            <ul className="files">
              {a.attachments.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          </section>
        )}
      </article>
      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{t('knowledge.related')}</h2>
          </div>
          <div className="grid-cards">
            {related.map((r) => (
              <ArticleCard key={r.id} a={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
