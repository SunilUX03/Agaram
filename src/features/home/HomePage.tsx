import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { KeyValueList } from '@/components/KeyValueList';
import { ListRow } from '@/components/ListRow';
import { PageHeader } from '@/components/PageHeader';
import { QuickActionTile } from '@/components/QuickActionTile';
import { QueryView } from '@/components/QueryView';
import { Skeleton } from '@/components/Skeleton';
import { StatusChip } from '@/components/StatusChip';
import { Avatar } from '@/components/Avatar';
import { Tag } from '@/components/Tag';
import { usePageText } from '@/app/usePage';
import { features } from '@/config/features';
import { formatDate } from '@/domain/dates';
import { nextStepKey } from '@/domain/requests';
import { useQ } from '@/data/hooks';

const QUICK: Record<string, { to: string; icon: string }> = {
  'apply-leave': { to: '/requests/new/leave', icon: 'calendar' },
  'start-request': { to: '/requests/new', icon: 'requests' },
  'share-idea': { to: '/community/ideas/new', icon: 'heart' },
  'ask-question': { to: '/community/discussions/new?type=discussion&ask=1', icon: 'help' },
  'find-colleague': { to: '/people/colleagues?focus=search', icon: 'search' },
  'open-file': { to: '/file', icon: 'file' },
};

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};
const DAY = 86400000;

export default function HomePage() {
  const { t, i18n } = useTranslation('home');
  const p = usePageText('home');
  const officer = useQ('officer');
  const first = officer.data?.name.split(' ')[0] ?? '';
  const headline = t(`greeting.${greetingKey()}`, { name: first });
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';

  return (
    <>
      <section className="hero">
        <div>
          <PageHeaderlessHero headline={headline} tagline={p.tagline} />
          <p className="small muted">
            {officer.data
              ? t('today', {
                  date: formatDate(new Date(), loc),
                  posting: `${officer.data.currentPosting.designation}, ${officer.data.currentPosting.postingIn}`,
                })
              : ' '}
          </p>
          <div className="page-header-actions">
            <Link to="/requests/new" className="btn btn-primary">
              {p.main}
            </Link>
            <Link to="/file" className="btn">
              {t('openFile')}
            </Link>
          </div>
        </div>
        {features.home.heroImage === 'illustration' && (
          <div className="art">
            <Illustration name="people" size={320} />
          </div>
        )}
      </section>

      <WaitingOnYou />
      <QuickActions />
      <Glance />
      <MyRequests />
      <WhatIsNew />
      <Link to="/requests/new" className="fab btn btn-primary btn-pill" aria-label={p.main}>
        <Icon name="plus" /> {p.main}
      </Link>
    </>
  );
}

/** The hero owns the page's one H1 and focus handling, via PageHeader's effects. */
function PageHeaderlessHero({ headline, tagline }: { headline: string; tagline: string }) {
  return <PageHeader headline={headline} tagline={tagline} />;
}

function Section({
  title,
  tagline,
  link,
  to,
  children,
}: {
  title: string;
  tagline: string;
  link?: string;
  to?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section" aria-label={title}>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{tagline}</p>
        </div>
        {link && to && (
          <Link to={to} className="link">
            {link}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function WaitingOnYou() {
  const { t, i18n } = useTranslation('home');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const requests = useQ('requests');
  const tasks = useQ('tasks');
  const leaves = useQ('leaves');
  const trainings = useQ('trainingEvents');
  const q = [requests, tasks, leaves, trainings];
  const pending = q.some((x) => x.isPending);
  const failed = q.find((x) => x.isError);

  const rows: {
    key: string;
    to: string;
    title: string;
    meta: string;
    chip?: React.ReactNode;
    icon: string;
  }[] = [];
  if (requests.data) {
    [
      ...requests.data.filter((r) => r.status === 'returned'),
      ...requests.data.filter((r) => r.status === 'draft'),
    ].forEach((r) =>
      rows.push({
        key: r.id,
        to: r.status === 'draft' ? `/requests/new/${r.type}?draft=${r.id}` : `/requests/${r.id}`,
        title: r.title,
        meta: t(nextStepKey(r.status), { ns: 'requests' }),
        chip: <StatusChip status={r.status} />,
        icon: 'requests',
      }),
    );
  }
  const soon = (iso: string, days: number) => {
    const d = new Date(iso).getTime() - Date.now();
    return d >= -DAY && d <= days * DAY;
  };
  tasks.data
    ?.filter((x) => !x.done && x.due && soon(x.due, 7))
    .forEach((x) =>
      rows.push({
        key: x.id,
        to: '/desk',
        title: x.text,
        meta: t('waiting.taskDue', { date: formatDate(x.due!, loc) }),
        icon: 'desk',
      }),
    );
  trainings.data
    ?.filter((x) => !x.past && x.date && soon(x.date, 14))
    .forEach((x) =>
      rows.push({
        key: x.id,
        to: '/learn/trainings',
        title: x.title,
        meta: t('waiting.trainingStarts', { date: formatDate(x.date!, loc) }),
        icon: 'book',
      }),
    );
  leaves.data
    ?.filter(
      (x) =>
        x.status === 'approved' &&
        soon(x.from, 14) &&
        new Date(x.from) >= new Date(Date.now() - DAY),
    )
    .forEach((x) =>
      rows.push({
        key: x.id,
        to: '/file/leave?tab=history',
        title: x.type,
        meta: t('waiting.leaveStarts', { date: formatDate(x.from, loc) }),
        icon: 'calendar',
      }),
    );

  return (
    <Section
      title={t('waiting.title')}
      tagline={t('waiting.tagline')}
      link={t('waiting.viewAll')}
      to="/requests?tab=needs-action"
    >
      {pending ? (
        <Skeleton variant="row" count={3} />
      ) : failed ? (
        <button type="button" className="btn" onClick={() => q.forEach((x) => void x.refetch())}>
          {t('error.retry', { ns: 'common' })}
        </button>
      ) : rows.length === 0 ? (
        <div className="empty empty-inline">
          <Illustration name="tick" size={160} />
          <p>{t('waiting.empty')}</p>
        </div>
      ) : (
        <div className="list">
          {rows.slice(0, 5).map((r) => (
            <ListRow
              key={r.key}
              to={r.to}
              title={r.title}
              meta={r.meta}
              chip={r.chip}
              icon={<Icon name={r.icon} />}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

function QuickActions() {
  const { t } = useTranslation('home');
  return (
    <Section title={t('quick.title')} tagline={t('quick.tagline')}>
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
    </Section>
  );
}

function Glance() {
  const { t, i18n } = useTranslation('home');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const officer = useQ('officer');
  const bal = useQ('leaveBalance');
  return (
    <Section
      title={t('glance.title')}
      tagline={t('glance.tagline')}
      link={t('glance.link')}
      to="/file"
    >
      <QueryView query={officer} skeleton="card" skeletonCount={1}>
        {(o) => (
          <Card>
            <div className="glance">
              <Avatar name={o.name} photoUrl={o.photoUrl} size={96} />
              <div className="glance-kv">
                <KeyValueList
                  items={[
                    {
                      label: t('glance.posting'),
                      value: `${o.currentPosting.designation}, ${o.currentPosting.department}`,
                    },
                    { label: t('glance.gradePay'), value: `${o.grade}, ${o.payLevel}` },
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
                      value: o.lastPromotionDate ? formatDate(o.lastPromotionDate, loc) : '—',
                    },
                    { label: t('glance.retirement'), value: formatDate(o.dateOfRetirement, loc) },
                  ]}
                />
              </div>
            </div>
          </Card>
        )}
      </QueryView>
    </Section>
  );
}

function MyRequests() {
  const { t, i18n } = useTranslation('home');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('requests');
  if (q.isSuccess && q.data.length === 0) return null;
  return (
    <Section
      title={t('requests.title')}
      tagline={t('requests.tagline')}
      link={t('requests.link')}
      to="/requests"
    >
      <QueryView query={q} skeleton="row" skeletonCount={3}>
        {(rs) => (
          <div className="list">
            {rs.slice(0, 3).map((r) => (
              <ListRow
                key={r.id}
                to={
                  r.status === 'draft'
                    ? `/requests/new/${r.type}?draft=${r.id}`
                    : `/requests/${r.id}`
                }
                title={r.title}
                meta={
                  r.submittedAt
                    ? t('requests.sent', { date: formatDate(r.submittedAt, loc) })
                    : t('waiting.draftSaved')
                }
                chip={<StatusChip status={r.status} />}
              />
            ))}
          </div>
        )}
      </QueryView>
    </Section>
  );
}

function WhatIsNew() {
  const { t, i18n } = useTranslation('home');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const lib = useQ('library', ['circular', 'go', 'announcement']);
  const ideas = useQ('ideas');
  const trainings = useQ('trainingEvents');
  const all = [lib, ideas, trainings];
  if (
    all.every((x) => x.isSuccess) &&
    !lib.data?.length &&
    !ideas.data?.length &&
    !trainings.data?.length
  )
    return null;
  const cols = [
    {
      id: 'circulars',
      title: t('new.circulars'),
      to: '/library/circulars',
      rows: (lib.data ?? [])
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
        .map((l) => ({
          k: l.id,
          title: l.title,
          meta: formatDate(l.date, loc),
          to: l.kind === 'announcement' ? '/library/announcements' : '/library/circulars',
        })),
    },
    {
      id: 'ideas',
      title: t('new.ideas'),
      to: '/community/ideas',
      rows: (ideas.data ?? [])
        .slice()
        .sort((a, b) => b.backerCount - a.backerCount)
        .slice(0, 2)
        .map((i) => ({
          k: i.id,
          title: i.title,
          meta: t('new.backers', { count: i.backerCount }),
          to: `/community/ideas/${i.id}`,
        })),
    },
    {
      id: 'trainings',
      title: t('new.trainings'),
      to: '/learn/trainings',
      rows: (trainings.data ?? [])
        .filter((x) => !x.past && x.date)
        .slice(0, 2)
        .map((x) => ({
          k: x.id,
          title: x.title,
          meta: formatDate(x.date!, loc),
          to: '/learn/trainings',
        })),
    },
  ];
  return (
    <Section title={t('new.title')} tagline={t('new.tagline')}>
      {all.some((x) => x.isPending) ? (
        <Skeleton variant="card" count={3} />
      ) : (
        <div className="cols cols-3 swipe">
          {cols.map((c) => (
            <Card key={c.id}>
              <div className="section-head">
                <h3>{c.title}</h3>
                <Link to={c.to} className="link small">
                  {t('new.seeAll')}
                </Link>
              </div>
              <div className="list">
                {c.rows.map((r) => (
                  <Link key={r.k} to={r.to} className="mini-row">
                    <span className="clamp-2">{r.title}</span>
                    <span className="card-meta">{r.meta}</span>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
export { EmptyState };
