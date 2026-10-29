import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { QueryView } from '@/components/QueryView';
import { Skeleton } from '@/components/Skeleton';
import { StatusChip } from '@/components/StatusChip';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';

const latest = (dates: (string | undefined)[]) => dates.filter(Boolean).sort().at(-1);

export default function FilePage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const o = useQ('officer');
  const career = useQ('career'),
    leaves = useQ('leaves'),
    bal = useQ('leaveBalance'),
    tr = useQ('trainings'),
    tv = useQ('travels'),
    pr = useQ('properties'),
    be = useQ('benefits'),
    docs = useQ('documents');
  const ready = [o, career, leaves, bal, tr, tv, pr, be, docs].every((q) => q.isSuccess);
  const upd = (d?: string) =>
    t('hub.updated', { date: d ? formatDate(d, loc) : formatDate(new Date(), loc) });
  const left = (k: 'cl' | 'el') => (bal.data ? bal.data[k].allowed - bal.data[k].used : 0);
  const tiles = ready
    ? [
        { to: '/file/profile', icon: 'user', id: 'profile', n: {}, d: undefined },
        {
          to: '/file/career',
          icon: 'building',
          id: 'career',
          n: { n: career.data!.length },
          d: latest(career.data!.map((c) => c.fromDate)),
        },
        {
          to: '/file/leave',
          icon: 'calendar',
          id: 'leave',
          n: { cl: left('cl'), el: left('el') },
          d: latest(leaves.data!.map((l) => l.to)),
        },
        {
          to: '/file/training',
          icon: 'book',
          id: 'training',
          n: { n: tr.data!.length },
          d: latest(tr.data!.map((x) => x.to)),
        },
        {
          to: '/file/travel',
          icon: 'plane',
          id: 'travel',
          n: { n: tv.data!.length },
          d: latest(tv.data!.map((x) => x.to)),
        },
        {
          to: '/file/property',
          icon: 'lock',
          id: 'property',
          n: { n: pr.data!.length },
          d: undefined,
        },
        {
          to: '/file/benefits',
          icon: 'rupee',
          id: 'benefits',
          n: { n: be.data!.length },
          d: latest(be.data!.map((x) => x.date)),
        },
        {
          to: '/file/documents',
          icon: 'file',
          id: 'documents',
          n: { n: docs.data!.length },
          d: latest(docs.data!.map((x) => x.date)),
        },
      ]
    : [];
  return (
    <>
      <RouteHeader id="file" main={{ to: '/requests/new/update-details' }} />
      <QueryView query={o} skeleton="card" skeletonCount={1}>
        {(of) => (
          <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad hub-card">
            <div className="hub-head">
              <Avatar name={of.name} photoUrl={of.photoUrl} size={88} />
              <div>
                <h2>
                  {of.salutation} {of.name}
                </h2>
                <p className="ux4g-text-neutral-secondary">
                  {t('hub.idLine', { year: of.batch })} · {t('hub.officerId', { id: of.officerId })}
                </p>
                <p>
                  {of.currentPosting.designation}, {of.currentPosting.postingIn}{' '}
                  <StatusChip status="officer:serving" />
                </p>
              </div>
            </div>
          </div>
        )}
      </QueryView>
      <section className="section" aria-label={t('hub.profile.title')}>
        {!ready ? (
          <Skeleton variant="tile" count={8} />
        ) : (
          <div className="tiles-4">
            {tiles.map((x) => (
              <Link
                key={x.id}
                to={x.to}
                className="ux4g-card ux4g-card-outline ux4g-card-vertical card-link"
              >
                <span className="ux4g-card-body ux4g-d-flex ux4g-gap-s ux4g-ai-center">
                  <span className="tile-icon" aria-hidden="true">
                    <Icon name={x.icon} size={28} />
                  </span>
                  <span className="ux4g-d-flex ux4g-flex-column">
                    <span className="ux4g-label-l-strong">{t(`hub.${x.id}.title`)}</span>
                    <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {t(`hub.${x.id}.count`, x.n)}
                    </span>
                    <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {upd(x.d)}
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <p>
        <Link to="/requests/new/correction" className="ux4g-text-link-md">
          {t('hub.report')}
        </Link>
      </p>
    </>
  );
}
