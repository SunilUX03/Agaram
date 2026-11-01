import { useState, type ComponentType, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { KeyValueList } from '@/components/KeyValueList';
import { PageHeader } from '@/components/PageHeader';
import { QueryView } from '@/components/QueryView';
import { QuickActionTile } from '@/components/QuickActionTile';
import { Tag } from '@/components/Tag';
import { usePageText } from '@/app/usePage';
import { features } from '@/config/features';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import { NewRequestMenu, RequestRow, SectionHead } from '../records/shared';
import { NewRequestFab } from '../records/shared';

const QUICK: Record<string, { to: string; icon: string }> = {
  'apply-leave': { to: '/records/services/leave/new', icon: 'calendar' },
  'record-ltc': { to: '/records/services/ltc/new', icon: 'plane' },
  'new-medical': { to: '/records/services/medical/new', icon: 'medical' },
  'submit-proposal': { to: '/community/proposals/new', icon: 'heart' },
  'start-discussion': { to: '/community/discourse/new', icon: 'requests' },
  'find-colleague': { to: '/community/colleagues', icon: 'search' },
};

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

const loc = (lang: string) => (lang === 'ta' ? 'ta-IN' : 'en-IN');

function HomeSearch() {
  const { t } = useTranslation('home');
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return (
    <section className="section ux4g-mb-xl" aria-label={t('search.title')}>
      <form
        role="search"
        className="ux4g-d-flex ux4g-flex-wrap gap-s"
        onSubmit={(e) => {
          e.preventDefault();
          nav(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <div className="ux4g-search-container ux4g-search-l grow">
          <label className="sr-only" htmlFor="home-search">
            {t('search.label')}
          </label>
          <input
            id="home-search"
            className="ux4g-search-input"
            type="search"
            placeholder={t('search.label')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="submit" className="ux4g-btn-primary ux4g-btn-m">
          {t('search.button')}
        </button>
      </form>
    </section>
  );
}

/** Returned requests and drafts, up to five. Always shows. */
function Waiting() {
  const { t } = useTranslation('home');
  const requests = useQ('requests');
  return (
    <section className="section ux4g-mb-xl" aria-labelledby="hm-waiting">
      <SectionHead
        id="hm-waiting"
        title={t('waiting.title')}
        tagline={t('waiting.tagline')}
        link={t('waiting.viewAll')}
        to="/records?tab=action"
      />
      <QueryView query={requests} skeleton="row" skeletonCount={3}>
        {(all) => {
          const rows = all
            .filter((r) => r.status === 'returned' || r.status === 'draft')
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 5);
          return rows.length ? (
            <ul className="plain-list">
              {rows.map((r) => (
                <li key={r.id}>
                  <RequestRow r={r} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message={t('waiting.empty')} icon="check" />
          );
        }}
      </QueryView>
    </section>
  );
}

function Quick() {
  const { t } = useTranslation('home');
  return (
    <section className="section ux4g-mb-xl" aria-labelledby="hm-quick">
      <SectionHead id="hm-quick" title={t('quick.title')} tagline={t('quick.tagline')} />
      <div className="tiles">
        {features.home.quickActions
          .filter((k) => QUICK[k])
          .map((k) => (
            <QuickActionTile
              key={k}
              to={QUICK[k].to}
              icon={QUICK[k].icon}
              label={t(`quick.${k}`)}
            />
          ))}
      </div>
    </section>
  );
}

function Glance() {
  const { t, i18n } = useTranslation('home');
  const officer = useQ('officer');
  const bal = useQ('leaveBalance');
  const l = loc(i18n.language);
  return (
    <section className="section ux4g-mb-xl" aria-labelledby="hm-glance">
      <SectionHead
        id="hm-glance"
        title={t('glance.title')}
        tagline={t('glance.tagline')}
        link={t('glance.link')}
        to="/records/profile"
      />
      <QueryView query={officer} skeleton="card" skeletonCount={1}>
        {(o) => (
          <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
            <div className="glance">
              <Avatar name={o.name} photoUrl={o.photoUrl} size={96} />
              <div className="glance-kv">
                <KeyValueList
                  items={[
                    {
                      label: t('glance.posting'),
                      value: `${o.currentPosting.designation}, ${o.currentPosting.department}`,
                    },
                    { label: t('glance.classPay'), value: o.classPayScale },
                    {
                      label: t('glance.balances'),
                      value: bal.data
                        ? (['cl', 'rh', 'el', 'hpl'] as const).map((k) => (
                            <Tag key={k}>
                              {t(`glance.${k}`, { n: bal.data[k].allowed - bal.data[k].used })}
                            </Tag>
                          ))
                        : '…',
                    },
                    {
                      label: t('glance.lastPromotion'),
                      value: o.lastPromotionDate ? formatDate(o.lastPromotionDate, l) : '—',
                    },
                    { label: t('glance.retirement'), value: formatDate(o.dateOfRetirement, l) },
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </QueryView>
    </section>
  );
}

function MyRequests() {
  const { t } = useTranslation('home');
  const q = useQ('requests');
  if (q.isSuccess && q.data.length === 0) return null;
  return (
    <section className="section ux4g-mb-xl" aria-labelledby="hm-requests">
      <SectionHead
        id="hm-requests"
        title={t('requests.title')}
        tagline={t('requests.tagline')}
        link={t('requests.link')}
        to="/records"
      />
      <QueryView query={q} skeleton="row" skeletonCount={3}>
        {(all) => (
          <ul className="plain-list">
            {all.slice(0, 3).map((r) => (
              <li key={r.id}>
                <RequestRow r={r} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </section>
  );
}

function NewInDownloads() {
  const { t, i18n } = useTranslation('home');
  const lib = useQ('library', ['circular', 'go', 'announcement']);
  const l = loc(i18n.language);
  if (lib.isSuccess && lib.data.length === 0) return null;
  return (
    <section className="section ux4g-mb-xl" aria-labelledby="hm-dl">
      <SectionHead
        id="hm-dl"
        title={t('downloads.title')}
        link={t('downloads.link')}
        to="/records/downloads"
      />
      <QueryView query={lib} skeleton="row" skeletonCount={3}>
        {(all) => (
          <ul className="plain-list">
            {all
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((x) => (
                <li key={x.id}>
                  <Link
                    className="ux4g-list-item list-row"
                    to={`/records/downloads?tab=${x.kind === 'announcement' ? 'updates' : x.kind === 'go' ? 'gos' : 'circulars'}`}
                  >
                    <span className="ux4g-list-item-row">
                      <span className="list-row-icon">
                        <Icon name="file" />
                      </span>
                      <span className="ux4g-list-item-start list-row-main">
                        <span className="ux4g-body-m-strong">{x.title}</span>
                        <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                          {[x.number, formatDate(x.date, l)].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </QueryView>
    </section>
  );
}

function FromCommunity() {
  const { t, i18n } = useTranslation('home');
  const ideas = useQ('ideas');
  const posts = useQ('posts');
  const trainings = useQ('trainingEvents');
  const l = loc(i18n.language);
  const next = trainings.data?.find((e) => e.kind === 'official' && !e.past);
  return (
    <section className="section ux4g-mb-xl" aria-labelledby="hm-comm">
      <SectionHead
        id="hm-comm"
        title={t('community.title')}
        link={t('community.link')}
        to="/community"
      />
      <div className="tiles-3">
        <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
          <h3 className="ux4g-heading-xs-strong ux4g-mb-xs">{t('community.proposals')}</h3>
          <ul className="plain-list">
            {(ideas.data ?? [])
              .slice()
              .sort((a, b) => b.backerCount - a.backerCount)
              .slice(0, 2)
              .map((i) => (
                <li key={i.id} className="task-row ux4g-d-flex ux4g-flex-column">
                  <Link className="ux4g-body-m-strong" to={`/community/proposals/${i.id}`}>
                    {i.title}
                  </Link>
                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                    {t('community.backers', { count: i.backerCount })}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
          <h3 className="ux4g-heading-xs-strong ux4g-mb-xs">{t('community.discourse')}</h3>
          <ul className="plain-list">
            {(posts.data ?? []).slice(0, 2).map((p) => (
              <li key={p.id} className="task-row ux4g-d-flex ux4g-flex-column">
                <Link className="ux4g-body-m-strong" to={`/community/discourse/${p.id}`}>
                  {p.title}
                </Link>
                <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {t('community.replies', { count: p.replyCount })}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
          <h3 className="ux4g-heading-xs-strong ux4g-mb-xs">{t('community.training')}</h3>
          {next ? (
            <Link className="ux4g-body-m-strong" to="/community/capacity-building">
              {next.title}
              <span className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-d-block">
                {next.date ? formatDate(next.date, l) : ''}
              </span>
            </Link>
          ) : (
            <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
              {t('community.noTraining')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Home is provisional (v2, section 5). The sections come from `features.home.sections`, so a change of order, a hidden
 *  section or a replacement needs only a config edit. */
export const HOME_SECTIONS: Record<string, ComponentType> = {
  search: HomeSearch,
  waiting: Waiting,
  quick: Quick,
  glance: Glance,
  requests: MyRequests,
  downloads: NewInDownloads,
  community: FromCommunity,
};

export default function HomePage() {
  const { t, i18n } = useTranslation('home');
  const p = usePageText('home');
  const officer = useQ('officer');
  const first = officer.data?.name.split(' ')[0] ?? '';
  const headline = t(`greeting.${greetingKey()}`, { name: first });
  const l = loc(i18n.language);
  return (
    <>
      <section className="hero">
        <div>
          <PageHeader headline={headline} tagline={p.tagline} />
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
            {officer.data
              ? t('today', {
                  date: formatDate(new Date(), l),
                  posting: `${officer.data.currentPosting.designation}, ${officer.data.currentPosting.postingIn}`,
                })
              : ' '}
          </p>
          <div className="ux4g-d-flex ux4g-flex-wrap gap-s ux4g-mt-m">
            <NewRequestMenu />
          </div>
        </div>
        {features.home.heroImage === 'illustration' && (
          <div className="art">
            <Illustration name="people" size={320} />
          </div>
        )}
      </section>
      {features.home.sections
        .filter((s) => s.enabled && HOME_SECTIONS[s.key])
        .map((s) => {
          const C = HOME_SECTIONS[s.key];
          return <C key={s.key} />;
        })}
      <NewRequestFab />
    </>
  );
}
export type { ReactNode };
