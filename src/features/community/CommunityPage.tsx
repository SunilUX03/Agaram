import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { QueryView } from '@/components/QueryView';
import { features } from '@/config/features';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import { downloadIcs } from '../learn/CapacityPage';
import { IdeaCard, PostRow, useLoc } from './parts';

function Row({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  const { t } = useTranslation('community');
  return (
    <section className="section ux4g-mb-xl" aria-label={title}>
      <div className="ux4g-d-flex ux4g-jc-between ux4g-ai-center gap-m ux4g-mb-s">
        <h2 className="ux4g-heading-m-strong">{title}</h2>
        <Link to={to} className="ux4g-text-link-m">
          {t('hub.seeAll')}
        </Link>
      </div>
      {children}
    </section>
  );
}

/** Community Home (v2, section 4.1). */
export default function CommunityPage() {
  const { t } = useTranslation('community');
  const loc = useLoc();
  const nav = useNavigate();
  const proposals = useQ('ideas');
  const posts = useQ('posts');
  const trainings = useQ('trainingEvents');
  const [who, setWho] = useState('');
  const on = features.community.pages;
  return (
    <>
      <RouteHeader
        id="community"
        main={{ to: '/community/proposals/new' }}
        secondary={
          <Link to="/community/discourse/new" className="ux4g-btn-outline-primary ux4g-btn-m">
            {t('hub.discussion')}
          </Link>
        }
        image={
          features.home.heroImage === 'illustration' ? (
            <Illustration name="people" size={260} />
          ) : undefined
        }
      />
      {on.proposals && (
        <Row title={t('hub.topIdeas')} to="/community/proposals">
          <QueryView query={proposals} skeleton="card" skeletonCount={3}>
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
      )}
      {on.discourse && (
        <Row title={t('hub.latestDiscussions')} to="/community/discourse">
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
      )}
      {on.capacity && (
        <Row title={t('hub.comingUp')} to="/community/capacity-building">
          <QueryView query={trainings} skeleton="card" skeletonCount={2}>
            {(d) => (
              <div className="cols-auto">
                {d
                  .filter((e) => e.kind === 'official' && !e.past)
                  .slice(0, 2)
                  .map((e) => (
                    <article
                      key={e.id}
                      className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
                    >
                      <h3 className="ux4g-heading-xs-strong">{e.title}</h3>
                      <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-xs">
                        <Icon name="calendar" size={16} /> {e.date ? formatDate(e.date, loc) : ''}{' '}
                        {e.time}
                      </p>
                      <div className="card-foot">
                        <button
                          type="button"
                          className="ux4g-btn-outline-primary ux4g-btn-s"
                          onClick={() => downloadIcs(e)}
                        >
                          {t('hub.addCal')}
                          <span className="sr-only"> {e.title}</span>
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </QueryView>
        </Row>
      )}
      {on.colleagues && (
        <section className="section ux4g-mb-xl" aria-labelledby="hub-find">
          <h2 id="hub-find" className="ux4g-heading-m-strong ux4g-mb-s">
            {t('hub.find')}
          </h2>
          <form
            role="search"
            className="ux4g-d-flex ux4g-flex-wrap gap-s"
            onSubmit={(e) => {
              e.preventDefault();
              nav(`/community/colleagues?q=${encodeURIComponent(who.trim())}`);
            }}
          >
            <div className="ux4g-search-container ux4g-search-m grow">
              <label className="sr-only" htmlFor="hub-who">
                {t('hub.findLabel')}
              </label>
              <input
                id="hub-who"
                className="ux4g-search-input"
                type="search"
                placeholder={t('hub.findLabel')}
                value={who}
                onChange={(e) => setWho(e.target.value)}
              />
            </div>
            <button type="submit" className="ux4g-btn-primary ux4g-btn-m">
              {t('hub.findBtn')}
            </button>
          </form>
          <p className="ux4g-mt-s ux4g-d-flex gap-m">
            <Link className="ux4g-text-link-m" to="/community/colleagues?tab=people">
              {t('hub.searchPeople')}
            </Link>
            <Link className="ux4g-text-link-m" to="/community/colleagues?tab=subject">
              {t('hub.searchSubject')}
            </Link>
          </p>
        </section>
      )}
      <section className="section" aria-labelledby="hub-more">
        <h2 id="hub-more" className="ux4g-heading-m-strong ux4g-mb-s">
          {t('hub.more')}
        </h2>
        <div className="cols-auto">
          {on.beyond && (
            <Link
              to="/community/beyond-the-file"
              className="ux4g-card ux4g-card-outline ux4g-card-vertical card-link"
            >
              <span className="ux4g-card-body ux4g-d-flex ux4g-flex-column gap-xs tile-body">
                <span className="tile-icon" aria-hidden="true">
                  <Icon name="help" size={28} />
                </span>
                <span className="ux4g-heading-xs-strong">{t('hub.beyondTitle')}</span>
                <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t('hub.beyondBody')}
                </span>
              </span>
            </Link>
          )}
          {on.awards && (
            <Link
              to="/community/awards"
              className="ux4g-card ux4g-card-outline ux4g-card-vertical card-link"
            >
              <span className="ux4g-card-body ux4g-d-flex ux4g-flex-column gap-xs tile-body">
                <span className="tile-icon" aria-hidden="true">
                  <Icon name="promotion" size={28} />
                </span>
                <span className="ux4g-heading-xs-strong">{t('hub.awardsTitle')}</span>
                <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t('hub.awardsBody')}
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
