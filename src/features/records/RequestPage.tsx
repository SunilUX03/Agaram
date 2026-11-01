import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/EmptyState';
import { FileViewer } from '@/components/FileViewer';
import { KeyValueList } from '@/components/KeyValueList';
import { Skeleton } from '@/components/Skeleton';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { Timeline, type TimelineStep } from '@/components/Timeline';
import { useToast } from '@/components/Toast';
import { NotFound } from '@/app/NotFound';
import { RouteHeader } from '@/app/usePage';
import { getRequestType } from '@/config/requests';
import { useMut, useQ } from '@/data/hooks';
import { formatDate, formatTime } from '@/domain/dates';
import { summaryRows, type Values } from '@/domain/requests';
import type { CareerEntry, Officer, Request } from '@/domain/types';
import { PROFILE_FIELD_LABELS, currentText, dateText, proposedText } from './profileFields';
import { useLocale } from './shared';

/** Where an approved request now lives in the officer's record. */
export const recordLink = (r: Request) =>
  r.type === 'posting' || r.type === 'promotion'
    ? '/records/profile?tab=career'
    : r.type === 'profile-edit' || r.type === 'correction'
      ? '/records/profile'
      : `/records/services/${r.type}${r.type === 'leave' ? '?tab=history' : ''}`;

/** The form that continues or restarts a request. */
export const formLink = (r: Request, restart = false) => {
  const draft = restart ? '' : `draft=${r.id}`;
  if (['posting', 'promotion', 'profile-edit', 'correction'].includes(r.type))
    return `/records/profile?${r.type === 'profile-edit' ? '' : 'tab=career&'}edit=${r.id}`;
  const past = r.mode === 'past';
  return `/records/services/${r.type}/${past ? 'add-past' : 'new'}${draft ? `?${draft}` : ''}`;
};

export default function RequestPage() {
  const { id = '' } = useParams();
  const q = useQ('request', id);
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  return <RequestView r={q.data} />;
}

function changeRows(r: Request, officer?: Officer, career?: CareerEntry[]) {
  const v = r.values as Values;
  const def = getRequestType(r.type)!;
  if (r.type === 'profile-edit' && officer)
    return Object.entries((v.changes ?? {}) as Record<string, unknown>).map(([k, val]) => ({
      label: PROFILE_FIELD_LABELS[k] ?? k,
      current: currentText(k, officer),
      asked: proposedText(k, val),
    }));
  if ((r.type === 'posting' || r.type === 'promotion') && v.entryId && career) {
    const e = career.find((c) => c.id === v.entryId);
    if (!e) return null;
    const cur: Record<string, string> = {
      postingIn: e.postingIn ?? '',
      department: e.department,
      designation: e.designation,
      postType: e.postType ?? '',
      locationChange: e.locationChange ?? '',
      fromDate: dateText(e.fromDate),
      toDate: dateText(e.toDate),
      officeAddress: e.officeAddress ?? '',
      fromGrade: e.fromGrade ?? '',
      toGrade: e.toGrade ?? '',
      promotionDate: dateText(e.fromDate),
    };
    return def.fields
      .filter((f) => String(v[f.name] ?? '') !== '' && String(v[f.name]) !== cur[f.name])
      .map((f) => ({ label: f.label, current: cur[f.name] ?? '', asked: String(v[f.name]) }));
  }
  return null;
}

function RequestView({ r }: { r: Request }) {
  const { t } = useTranslation('records');
  const common = useTranslation().t;
  const loc = useLocale();
  const toast = useToast();
  const withdraw = useMut('withdrawRequest');
  const officer = useQ('officer');
  const career = useQ('career');
  const [confirm, setConfirm] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const def = getRequestType(r.type)!;
  const rows = changeRows(r, officer.data, career.data);

  const step = (
    id: string,
    title: string,
    e?: Request['timeline'][number],
    pending = false,
  ): TimelineStep => ({
    id,
    title,
    date: e ? `${formatDate(e.date, loc)}, ${formatTime(e.date, loc)}` : undefined,
    role: e?.role,
    note: e?.note,
    pending,
  });
  const ev = (title: string) => [...r.timeline].reverse().find((x) => x.title.startsWith(title));
  const sent = ev('Sent');
  const decided = ['approved', 'returned', 'rejected'].includes(r.status);
  const decision = ev('Approved') ?? ev('Returned') ?? ev('Not approved');
  const steps: TimelineStep[] = [
    step('sent', t('request.steps.sent'), sent, !sent),
    {
      ...step('review', t('request.steps.review'), undefined, !sent),
      current: r.status === 'submitted',
    },
    {
      ...step('decision', t(`request.steps.decision`), decided ? decision : undefined, !decided),
      title: decided ? t(`request.steps.${r.status}`) : t('request.steps.decision'),
    },
  ];

  const main =
    r.status === 'draft' ? (
      <Link className="ux4g-btn-primary ux4g-btn-m" to={formLink(r)}>
        {t('request.continue')}
      </Link>
    ) : r.status === 'returned' ? (
      <Link className="ux4g-btn-primary ux4g-btn-m" to={formLink(r)}>
        {t('request.editSend')}
      </Link>
    ) : r.status === 'submitted' ? (
      <button
        type="button"
        className="ux4g-btn-primary ux4g-btn-m"
        onClick={() => setConfirm(true)}
      >
        {t('request.withdraw')}
      </button>
    ) : r.status === 'approved' ? (
      <Link className="ux4g-btn-primary ux4g-btn-m" to={recordLink(r)}>
        {t('request.viewRecord')}
      </Link>
    ) : (
      <Link className="ux4g-btn-primary ux4g-btn-m" to={formLink(r, true)}>
        {t('request.startAgain')}
      </Link>
    );

  return (
    <>
      <RouteHeader
        id="records.request"
        headline={r.title}
        tagline={t('request.tagline', {
          date: formatDate(r.submittedAt ?? r.createdAt, loc),
          status: common(`status.${r.status}`),
        })}
        main={main}
        breadcrumb={[{ label: common('nav.records'), to: '/records' }, { label: r.title }]}
      />
      {r.status === 'returned' && (
        <Banner variant="warning">{t('request.returned', { reason: r.returnReason })}</Banner>
      )}
      {r.status === 'rejected' && (
        <Banner variant="critical">{t('request.rejected', { reason: r.rejectReason })}</Banner>
      )}
      <div className="layout-side">
        <div className="ux4g-d-flex ux4g-flex-column gap-m">
          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
            aria-labelledby="rq-tl"
          >
            <div className="ux4g-d-flex ux4g-jc-between ux4g-ai-start gap-s ux4g-mb-s">
              <h2 id="rq-tl" className="ux4g-heading-s-strong">
                {t('request.progress')}
              </h2>
              <div className="ux4g-d-flex ux4g-ai-center gap-xs">
                {r.source === 'paper' && <Tag>{t('source.paper')}</Tag>}
                <StatusChip status={r.status} />
              </div>
            </div>
            <p className="ux4g-body-s-default ux4g-mb-m">
              {t('request.ref')} <strong>{r.ref}</strong>
            </p>
            <Timeline steps={steps} label={t('request.progress')} />
          </section>

          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
            aria-labelledby="rq-sum"
          >
            <h2 id="rq-sum" className="ux4g-heading-s-strong ux4g-mb-s">
              {t('request.submitted')}
            </h2>
            {rows ? (
              <table className="ux4g-table change-table">
                <caption className="sr-only">{t('request.changes')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('request.field')}</th>
                    <th scope="col">{t('pending.current')}</th>
                    <th scope="col">{t('pending.asked')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x) => (
                    <tr key={x.label}>
                      <th scope="row">{x.label}</th>
                      <td>{x.current || '—'}</td>
                      <td>{x.asked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <KeyValueList
                items={summaryRows(def, r.values as Values).map((s) => ({
                  label: s.label,
                  value: s.value,
                }))}
              />
            )}
          </section>

          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
            aria-labelledby="rq-att"
          >
            <h2 id="rq-att" className="ux4g-heading-s-strong ux4g-mb-s">
              {t('request.attachments')}
            </h2>
            {r.attachments.length === 0 ? (
              <p className="ux4g-body-m-default ux4g-text-neutral-secondary">
                {t('request.noFiles')}
              </p>
            ) : (
              <ul className="plain-list">
                {r.attachments.map((a, i) => (
                  <li
                    key={`${a.name}-${i}`}
                    className="ux4g-d-flex ux4g-ai-center gap-s ux4g-py-xs"
                  >
                    <span className="ux4g-body-m-default ux4g-flex-1">{a.name}</span>
                    <button
                      type="button"
                      className="ux4g-btn-outline-primary ux4g-btn-s"
                      onClick={() => setView(a.name)}
                    >
                      {t('request.view')}
                    </button>
                    <a
                      className="ux4g-btn-outline-primary ux4g-btn-s"
                      href={`${import.meta.env.BASE_URL}sample.pdf`}
                      download
                    >
                      {t('request.download')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      {view && <FileViewer title={view} onClose={() => setView(null)} />}
      {confirm && (
        <ConfirmDialog
          title={t('request.withdrawTitle')}
          body={t('request.withdrawBody')}
          confirmLabel={t('request.withdraw')}
          cancelLabel={t('request.keep')}
          onCancel={() => setConfirm(false)}
          onConfirm={() =>
            withdraw.mutate([r.id], {
              onSuccess: () => (setConfirm(false), toast(t('request.withdrawn'))),
            })
          }
        />
      )}
    </>
  );
}
