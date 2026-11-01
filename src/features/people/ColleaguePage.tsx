import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { ErrorState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { KeyValueList } from '@/components/KeyValueList';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { NotFound } from '@/app/NotFound';
import { useQ } from '@/data/hooks';

export default function ColleaguePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('people');
  const q = useQ('colleague', id);
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const c = q.data;
  return (
    <>
      <PageHeader
        headline={c.name}
        tagline={t('profile.meta', {
          designation: c.designation,
          posting: `${c.district}, ${c.department}`,
        })}
        image={<Avatar name={c.name} photoUrl={c.photoUrl} size={96} />}
        breadcrumb={[
          { label: t('routes.community_colleagues.headline'), to: '/community/colleagues' },
          { label: c.name },
        ]}
      />
      <div className="layout-side">
        <section className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
          <KeyValueList
            items={[
              { label: t('profile.service'), value: c.service },
              { label: t('profile.batch'), value: c.batch ? String(c.batch) : undefined },
              { label: t('profile.district'), value: c.district },
              { label: t('profile.department'), value: c.department },
              { label: t('profile.area'), value: c.areaOfExposure },
            ].filter((x) => x.value)}
          />
        </section>
        <section
          className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
          aria-labelledby="contact-h"
        >
          <h2 id="contact-h" className="ux4g-heading-xs-strong">
            {t('profile.officialEmail')}
          </h2>
          <a
            className="ux4g-text-link-m ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s"
            href={`mailto:${c.officialEmail}`}
          >
            <Icon name="requests" size={16} /> {c.officialEmail}
          </a>
        </section>
      </div>
    </>
  );
}
