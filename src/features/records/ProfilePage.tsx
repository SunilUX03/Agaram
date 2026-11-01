import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Icon } from '@/components/Icon';
import { KeyValueList, type KeyValue } from '@/components/KeyValueList';
import { MenuButton } from '@/components/MenuButton';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { UrlTabs, useUrlTab, type TabDef } from '@/components/UrlTabs';
import { useToast } from '@/components/Toast';
import { RouteHeader } from '@/app/usePage';
import { features } from '@/config/features';
import { useMut, useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { Education, Officer, PendingChange } from '@/domain/types';
import { CareerTab } from './CareerTab';
import { CorrectionDialog } from './CorrectionDialog';
import { EditPanel, type PanelGroup } from './EditPanel';
import { proposedText } from './profileFields';
import { useLocale } from './shared';

type Row = {
  key: string;
  label: string;
  value: ReactNode;
  /** The key used for Change pending, when the field is editable. */
  pendingKey?: string;
};
interface Group {
  id: string;
  title: string;
  edit?: PanelGroup;
  rows: Row[];
  /** Label used when the officer reports a correction from this group. */
  report?: string;
}

/** Profile and Career (v2, section 3.2). Locked fields show a lock; editable ones go to the super admin. */
export default function ProfilePage() {
  const { t } = useTranslation('records');
  const officer = useQ('officer');
  const pending = useQ('pendingChanges');
  const tabs: TabDef[] = [
    { id: 'profile', label: t('profile.tabProfile') },
    { id: 'career', label: t('profile.tabCareer') },
  ];
  const [tab] = useUrlTab(tabs);
  const [panel, setPanel] = useState<PanelGroup | null>(null);
  const [params, setParams] = useSearchParams();
  const editId = params.get('edit') ?? '';
  const editing = useQ('request', editId || 'none');
  const existing = editId && editing.data ? editing.data : undefined;
  const fromReq =
    existing?.type === 'profile-edit'
      ? (Object.keys((existing.values as { changes?: object }).changes ?? {})[0] as
          string | undefined)
      : undefined;
  const reqGroup: PanelGroup | null = fromReq
    ? fromReq === 'education'
      ? 'education'
      : fromReq === 'languagesKnown'
        ? 'languages'
        : fromReq === 'officeContact'
          ? 'office'
          : fromReq === 'photo'
            ? 'photo'
            : 'contact'
    : null;
  const shown = panel ?? reqGroup;
  const closePanel = () => {
    setPanel(null);
    if (editId) {
      const n = new URLSearchParams(params);
      n.delete('edit');
      setParams(n, { replace: true });
    }
  };

  const options = (['contact', 'education', 'languages', 'photo', 'office'] as const).map((g) => ({
    label: t(`groups.${g}`),
    onClick: () => setPanel(g),
  }));

  return (
    <>
      <RouteHeader
        id="records.profile"
        main={<MenuButton label={t('profile.update')} options={options} />}
        breadcrumb={[{ label: t('crumb.records'), to: '/records' }, { label: t('crumb.profile') }]}
      />
      <UrlTabs tabs={tabs} label={t('profile.tabs')} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'career' ? (
          <CareerTab pending={pending.data ?? []} editRequestId={editId} />
        ) : (
          <QueryView query={officer} skeleton="card" skeletonCount={3}>
            {(o) => <ProfileTab o={o} pending={pending.data ?? []} onEdit={setPanel} />}
          </QueryView>
        )}
      </div>
      {shown && officer.data && (
        <EditPanel
          key={shown + editId}
          group={shown}
          officer={officer.data}
          pending={pending.data ?? []}
          existing={existing?.type === 'profile-edit' ? existing : undefined}
          onClose={closePanel}
        />
      )}
    </>
  );
}

function ProfileTab({
  o,
  pending,
  onEdit,
}: {
  o: Officer;
  pending: PendingChange[];
  onEdit: (g: PanelGroup) => void;
}) {
  const { t } = useTranslation('records');
  const loc = useLocale();
  const toast = useToast();
  const withdraw = useMut('withdrawRequest');
  const requests = useQ('requests');
  const [report, setReport] = useState<string | null>(null);
  const [drop, setDrop] = useState<PendingChange | null>(null);
  const d = (iso?: string) => (iso ? formatDate(iso, loc) : '—');
  const locked = features.profile.fieldAccess.locked;

  const groups: Group[] = [
    {
      id: 'service',
      title: t('groups.service'),
      report: 'Profile: Allotment Year',
      rows: [
        { key: 'allotmentYear', label: t('fields.allotmentYear'), value: String(o.allotmentYear) },
        { key: 'batch', label: t('fields.batch'), value: String(o.batch) },
        { key: 'cadreAndDomicile', label: t('fields.cadreAndDomicile'), value: o.cadreAndDomicile },
        { key: 'recruitmentType', label: t('fields.recruitmentType'), value: o.recruitmentType },
        { key: 'dateOfJoining', label: t('fields.dateOfJoining'), value: d(o.dateOfJoining) },
        {
          key: 'dateOfRetirement',
          label: t('fields.dateOfRetirement'),
          value: d(o.dateOfRetirement),
        },
        { key: 'classPayScale', label: t('fields.classPayScale'), value: o.classPayScale },
        { key: 'grade', label: t('fields.grade'), value: o.grade },
        { key: 'seniorityNumber', label: t('fields.seniorityNumber'), value: o.seniorityNumber },
        {
          key: 'lastPromotionDate',
          label: t('fields.lastPromotionDate'),
          value: d(o.lastPromotionDate),
        },
        { key: 'ifhrmsId', label: t('fields.ifhrmsId'), value: o.ifhrmsId },
      ],
    },
    {
      id: 'personal',
      title: t('groups.personal'),
      edit: 'languages',
      report: 'Profile: Gender',
      rows: [
        { key: 'gender', label: t('fields.gender'), value: o.gender },
        { key: 'dateOfBirth', label: t('fields.dateOfBirth'), value: d(o.dateOfBirth) },
        {
          key: 'languagesKnown',
          label: t('fields.languagesKnown'),
          value: o.languages.join(', '),
          pendingKey: 'languagesKnown',
        },
        { key: 'religion', label: t('fields.religion'), value: o.religion },
        { key: 'caste', label: t('fields.caste'), value: o.caste ?? '—' },
      ],
    },
    {
      id: 'contact',
      title: t('groups.contact'),
      edit: 'contact',
      report: 'Profile: Mobile No 1',
      rows: [
        { key: 'mobile1', label: t('fields.mobile1'), value: o.contact.mobile1 },
        {
          key: 'personalEmail',
          label: t('fields.personalEmail'),
          value: o.contact.personalEmail ?? '—',
          pendingKey: 'personalEmail',
        },
        { key: 'officialEmail', label: t('fields.officialEmail'), value: o.contact.officialEmail },
        {
          key: 'residentialAddress',
          label: t('fields.residentialAddress'),
          value: `${o.address.line}, ${o.address.city} ${o.address.pincode}`,
          pendingKey: 'residentialAddress',
        },
      ],
    },
    {
      id: 'posting',
      title: t('groups.posting'),
      edit: 'office',
      report: 'Profile: Name',
      rows: [
        {
          key: 'currentPosting.postingIn',
          label: t('fields.postingIn'),
          value: o.currentPosting.postingIn,
        },
        {
          key: 'currentPosting.department',
          label: t('fields.department'),
          value: o.currentPosting.department,
        },
        {
          key: 'currentPosting.designation',
          label: t('fields.designation'),
          value: o.currentPosting.designation,
        },
        {
          key: 'currentPosting.postType',
          label: t('fields.postType'),
          value: o.currentPosting.postType,
        },
        {
          key: 'currentPosting.locationChange',
          label: t('fields.locationChange'),
          value: o.currentPosting.locationChange,
        },
        {
          key: 'officeContact',
          label: t('fields.officeContact'),
          value: [
            o.officeContact.address,
            o.officeContact.phone,
            o.officeContact.fax,
            o.officeContact.mobile,
          ]
            .filter(Boolean)
            .join(' · '),
          pendingKey: 'officeContact',
        },
      ],
    },
  ];
  const pendingOf = (k?: string) =>
    k ? pending.find((p) => p.targetKind === 'profile' && p.targetKey === k) : undefined;
  const item = (r: Row): KeyValue => {
    const p = pendingOf(r.pendingKey);
    const isLocked = locked.includes(r.key);
    return {
      id: r.key,
      label: (
        <span className="ux4g-d-flex ux4g-ai-center gap-xs">
          {r.label}
          {isLocked && (
            <span className="lock" title={t('lock.tip')}>
              <Icon name="lock" size={14} label={t('lock.tip')} />
            </span>
          )}
        </span>
      ),
      value: (
        <span className="ux4g-d-flex ux4g-flex-column gap-xs">
          <span>{r.value}</span>
          {p && (
            <span className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s">
              <Tag>{t('pending.chip')}</Tag>
              <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                {t('pending.asked2', { value: p.proposedValue })}
              </span>
              <button
                type="button"
                className="ux4g-btn-text-primary ux4g-btn-xs"
                onClick={() => setDrop(p)}
              >
                {t('pending.withdraw')}
              </button>
            </span>
          )}
        </span>
      ),
    };
  };
  const returned = (requests.data ?? []).filter(
    (r) => r.type === 'profile-edit' && r.status === 'returned',
  );

  return (
    <div className="ux4g-d-flex ux4g-flex-column gap-m">
      {returned.map((r) => (
        <div key={r.id} role="alert" className="ux4g-alert ux4g-alert-warning">
          <i className="ux4g-icon-outlined ux4g-alert-icon" aria-hidden="true">
            warning
          </i>
          <div className="ux4g-alert-content ux4g-d-flex ux4g-flex-wrap gap-s">
            <span className="ux4g-alert-message">
              {t('pending.returned', {
                group: String((r.values as { group?: string }).group ?? ''),
                reason: r.returnReason,
              })}
            </span>
            <Link className="ux4g-text-link-m" to={`/records/profile?edit=${r.id}`}>
              {t('pending.editAgain')}
            </Link>
          </div>
        </div>
      ))}
      <section
        className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
        aria-labelledby="pf-about"
      >
        <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-m">
          <Avatar name={o.name} photoUrl={o.photoUrl} size={80} />
          <div className="ux4g-flex-1">
            <h2 id="pf-about" className="ux4g-heading-m-strong">
              {o.salutation} {o.name}
            </h2>
            <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-d-flex ux4g-ai-center gap-xs">
              {t('fields.identityNo')}: {o.officerId}
              <span className="lock" title={t('lock.tip')}>
                <Icon name="lock" size={14} label={t('lock.tip')} />
              </span>
            </p>
            <p className="ux4g-mt-xs">
              <StatusChip status="officer:serving" />
            </p>
            {pendingOf('photo') && (
              <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-xs">
                <Tag>{t('pending.chip')}</Tag>{' '}
                {t('pending.asked2', { value: pendingOf('photo')!.proposedValue })}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-m"
            onClick={() => onEdit('photo')}
          >
            {t('profile.changePhoto')}
          </button>
        </div>
      </section>

      {groups.map((g) => (
        <section
          key={g.id}
          className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
          aria-labelledby={`pf-${g.id}`}
        >
          <div className="ux4g-d-flex ux4g-jc-between ux4g-ai-center gap-s ux4g-mb-s">
            <h2 id={`pf-${g.id}`} className="ux4g-heading-s-strong">
              {g.title}
            </h2>
            {g.edit && (
              <button
                type="button"
                className="ux4g-btn-outline-primary ux4g-btn-s"
                onClick={() => onEdit(g.edit!)}
              >
                {t('profile.edit')}
                <span className="sr-only"> {g.title}</span>
              </button>
            )}
          </div>
          {g.id === 'posting' && (
            <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mb-s">
              {t('profile.changeInCareer')}{' '}
              <Link className="ux4g-text-link-m" to="/records/profile?tab=career">
                {t('profile.openCareer')}
              </Link>
            </p>
          )}
          <KeyValueList items={g.rows.map(item)} />
          {g.rows.some((r) => locked.includes(r.key)) && (
            <p className="ux4g-mt-s">
              <button
                type="button"
                className="ux4g-text-link-m link-label"
                onClick={() => setReport(g.report ?? '')}
              >
                {t('profile.reportCorrection')}
                <span className="sr-only"> {g.title}</span>
              </button>
            </p>
          )}
        </section>
      ))}

      <section
        className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
        aria-labelledby="pf-edu"
      >
        <div className="ux4g-d-flex ux4g-jc-between ux4g-ai-center gap-s ux4g-mb-s">
          <h2 id="pf-edu" className="ux4g-heading-s-strong">
            {t('groups.education')}
          </h2>
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-s"
            onClick={() => onEdit('education')}
          >
            {t('profile.edit')}
            <span className="sr-only"> {t('groups.education')}</span>
          </button>
        </div>
        <ResponsiveTable<Education>
          caption={t('groups.education')}
          rows={o.qualifications}
          rowKey={(q) => q.id}
          columns={[
            { key: 'level', header: t('panel.eduLevel'), mobile: 'title' },
            { key: 'degree', header: t('panel.eduDegree') },
            { key: 'specialisation', header: t('panel.eduSpec') },
            { key: 'institute', header: t('panel.eduInstitute') },
            { key: 'state', header: t('panel.eduState') },
            { key: 'country', header: t('panel.eduCountry') },
            { key: 'year', header: t('panel.eduYear') },
          ]}
        />
        {pendingOf('education') && (
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-s">
            <Tag>{t('pending.chip')}</Tag>{' '}
            {t('pending.asked2', {
              value: proposedText('education', []) || pendingOf('education')!.proposedValue,
            })}{' '}
            <button
              type="button"
              className="ux4g-btn-text-primary ux4g-btn-xs"
              onClick={() => setDrop(pendingOf('education')!)}
            >
              {t('pending.withdraw')}
            </button>
          </p>
        )}
      </section>

      {report !== null && <CorrectionDialog initial={report} onClose={() => setReport(null)} />}
      {drop && (
        <ConfirmDialog
          title={t('pending.withdrawTitle')}
          body={t('pending.withdrawBody')}
          confirmLabel={t('pending.withdraw')}
          cancelLabel={t('pending.keep')}
          onCancel={() => setDrop(null)}
          onConfirm={() =>
            withdraw.mutate([drop.requestId], {
              onSuccess: () => (setDrop(null), toast(t('pending.withdrawn'))),
            })
          }
        />
      )}
    </div>
  );
}
