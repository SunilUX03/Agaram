import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Illustration } from '@/components/Illustration';
import { QueryView } from '@/components/QueryView';
import { features } from '@/config/features';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { ArticleCard, IdeaCard, PostRow } from './parts';

function Row({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  const { t } = useTranslation('community');
  return (
    <section className="section" aria-label={title}>
      <div className="section-head">
        <h2 className="ux4g-heading-m-strong">{title}</h2>
        <Link to={to} className="ux4g-text-link-m">
          {t('hub.seeAll')}
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function CommunityPage() {
  const { t } = useTranslation('community');
  const ideas = useQ('ideas'),
    posts = useQ('posts'),
    articles = useQ('articles');
  return (
    <>
      <RouteHeader
        id="community"
        main={{ to: '/community/ideas/new' }}
        secondary={
          <>
            <Link to="/community/discussions/new" className="ux4g-btn-outline-primary ux4g-btn-m">
              {t('hub.discussion')}
            </Link>
            <Link to="/community/knowledge/new" className="ux4g-btn-outline-primary ux4g-btn-m">
              {t('hub.article')}
            </Link>
          </>
        }
        image={
          features.home.heroImage === 'illustration' ? (
            <Illustration name="people" size={260} />
          ) : undefined
        }
      />
      <Row title={t('hub.topIdeas')} to="/community/ideas">
        <QueryView query={ideas} skeleton="card" skeletonCount={3}>
          {(d) => (
            <div className="grid-cards swipe">
              {d
                .slice()
                .sort((a, b) => b.backerCount - a.backerCount)
                .slice(0, 3)
                .map((i) => (
                  <IdeaCard key={i.id} idea={i} />
                ))}
            </div>
          )}
        </QueryView>
      </Row>
      <Row title={t('hub.latestDiscussions')} to="/community/discussions">
        <QueryView query={posts} skeleton="row" skeletonCount={3}>
          {(d) => (
            <div className="ux4g-d-flex ux4g-flex-column">
              {d.slice(0, 3).map((p) => (
                <PostRow key={p.id} post={p} />
              ))}
            </div>
          )}
        </QueryView>
      </Row>
      <Row title={t('hub.latestArticles')} to="/community/knowledge">
        <QueryView query={articles} skeleton="card" skeletonCount={3}>
          {(d) => (
            <div className="grid-cards swipe">
              {d
                .filter((a) => a.status === 'published')
                .slice(0, 3)
                .map((a) => (
                  <ArticleCard key={a.id} a={a} />
                ))}
            </div>
          )}
        </QueryView>
      </Row>
    </>
  );
}
