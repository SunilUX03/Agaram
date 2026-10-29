import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { KeyValueList, type KeyValue } from '@/components/KeyValueList';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { useIsDesktop } from '@/components/hooks';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { Officer } from '@/domain/types';

/** A card on desktop. A collapsible section on mobile, with Personal open by default. */
function Block({
  title,
  section,
  defaultOpen,
  children,
}: {
  title: string;
  section: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation('file');
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(!!defaultOpen);
  const update = (
    <Link
      className="ux4g-text-link-m ux4g-body-s-default"
      to={`/requests/new/update-details?section=${encodeURIComponent(section)}`}
    >
      {t('profile.update')}
    </Link>
  );
  if (desktop)
    return (
      <section
        className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
        aria-label={title}
      >
        <div className="cardhead">
          <h2 className="ux4g-heading-s-strong">{title}</h2>
          {update}
        </div>
        {children}
      </section>
    );
  return (
    <details
      className="collapsible"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>
        {title}
        <Icon name="down" />
      </summary>
      <div>
        <div className="cardhead">
          <span />
          {update}
        </div>
        {children}
      </div>
    </details>
  );
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('officer');
  const d = (iso: string) => formatDate(iso, loc);
  const kv = (o: Officer, rows: [string, string, ReactNode, string?][]): KeyValue[] =>
    rows
      .filter(([, , v]) => v !== undefined && v !== '')
      .map(([k, label, value, meta]) => ({
        label: t(`profile.${label}`),
        value,
        meta: (meta ? o.fieldMeta[meta] : o.fieldMeta[k]) as KeyValue['meta'],
      }));

  return (
    <>
      <RouteHeader
        id="file.profile"
        main={{ to: '/requests/new/update-details' }}
        image={q.data && <Avatar name={q.data.name} photoUrl={q.data.photoUrl} size={96} />}
      />
      <QueryView query={q} skeleton="card" skeletonCount={3}>
        {(o) => (
          <div className="stack">
            <Block title={t('profile.personal')} section="Personal" defaultOpen>
              <KeyValueList
                items={kv(o, [
                  ['name', 'name', o.name],
                  ['gender', 'gender', o.gender],
                  ['dateOfBirth', 'dob', d(o.dateOfBirth)],
                  ['homeState', 'homeState', o.homeState],
                  ['nativeDistrict', 'nativeDistrict', o.nativeDistrict],
                  ['languages', 'languages', o.languages.join(', ')],
                ])}
              />
            </Block>
            <Block title={t('profile.contact')} section="Contact">
              <KeyValueList
                items={kv(o, [
                  ['mobile1', 'mobile1', o.contact.mobile1],
                  ['mobile2', 'mobile2', o.contact.mobile2],
                  ['landline', 'landline', o.contact.landline],
                  ['officialEmail', 'officialEmail', o.contact.officialEmail],
                  ['personalEmail', 'personalEmail', o.contact.personalEmail],
                ])}
              />
            </Block>
            <Block title={t('profile.qualifications')} section="Qualifications">
              <ResponsiveTable
                caption={t('profile.qualifications')}
                rows={o.qualifications}
                rowKey={(r) => r.id}
                columns={[
                  { key: 'degree', header: t('profile.degree'), mobile: 'title' },
                  { key: 'level', header: t('profile.level') },
                  { key: 'specialisation', header: t('profile.specialisation') },
                  { key: 'institute', header: t('profile.institute') },
                  { key: 'year', header: t('profile.year') },
                ]}
              />
            </Block>
            <Block title={t('profile.address')} section="Address">
              <KeyValueList
                items={kv(o, [
                  ['addressLine', 'line', o.address.line],
                  ['city', 'city', o.address.city],
                  ['pincode', 'pincode', o.address.pincode],
                ])}
              />
            </Block>
            <Block title={t('profile.officer')} section="Officer details">
              <KeyValueList
                items={kv(o, [
                  ['officerId', 'officerId', o.officerId],
                  ['ifhrmsId', 'ifhrmsId', o.ifhrmsId],
                  ['dateOfJoining', 'joining', d(o.dateOfJoining)],
                  ['dateOfRetirement', 'retirement', d(o.dateOfRetirement)],
                  ['batch', 'batch', String(o.batch)],
                  ['recruitmentType', 'recruitment', o.recruitmentType],
                  ['grade', 'grade', o.grade],
                  ['payLevel', 'payLevel', o.payLevel],
                  ['seniorityNumber', 'seniority', o.seniorityNumber],
                ])}
              />
            </Block>
            <details className="collapsible">
              <summary>
                {t('profile.other')}
                <Icon name="down" />
              </summary>
              <div>
                <KeyValueList
                  items={[
                    { label: t('profile.class'), value: o.sensitive.class },
                    { label: t('profile.religion'), value: o.sensitive.religion },
                    { label: t('profile.caste'), value: o.sensitive.caste },
                  ].filter((x) => x.value)}
                />
              </div>
            </details>
          </div>
        )}
      </QueryView>
    </>
  );
}
