import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { ErrorState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { KeyValueList } from '@/components/KeyValueList';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { ToggleButton } from '@/components/ToggleButton';
import { NotFound } from '@/app/NotFound';
import { useMut, useQ } from '@/data/hooks';

export default function ColleaguePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('people');
  const q = useQ('colleague', id);
  const save = useMut('toggleSaved');
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const c = q.data;
  const shared = c.sharedContact;
  return (
    <>
      <PageHeader
        headline={c.name}
        tagline={t('profile.meta', {
          designation: c.designation,
          posting: `${c.district}, ${c.department}`,
        })}
        main={
          <ToggleButton
            label={t('profile.save')}
            onLabel={t('profile.saved')}
            icon="bookmark"
            pressed={c.savedByMe}
            onChange={(on) => save.mutateAsync(['person', c.id, on])}
          />
        }
        image={<Avatar name={c.name} photoUrl={c.photoUrl} size={96} />}
        breadcrumb={[
          { label: t('routes.people_colleagues.headline'), to: '/people/colleagues' },
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
            {t('profile.contact')}
          </h2>
          {shared?.phone || shared?.email ? (
            <ul className="plain-list">
              {shared.phone && (
                <li>
                  <a
                    className="ux4g-text-link-m ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s"
                    href={`tel:${shared.phone.replace(/\s/g, '')}`}
                  >
                    <Icon name="user" size={16} /> {shared.phone}
                  </a>
                </li>
              )}
              {shared.email && (
                <li>
                  <a
                    className="ux4g-text-link-m ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s"
                    href={`mailto:${shared.email}`}
                  >
                    <Icon name="requests" size={16} /> {shared.email}
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="ux4g-text-neutral-secondary">{t('profile.none')}</p>
          )}
        </section>
      </div>
    </>
  );
}
