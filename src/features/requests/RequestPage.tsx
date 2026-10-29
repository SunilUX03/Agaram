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
import { Timeline, type TimelineStep } from '@/components/Timeline';
import { useToast } from '@/components/Toast';
import { TextArea } from '@/components/form/inputs';
import { NotFound } from '@/app/NotFound';
import { PageHeader } from '@/components/PageHeader';
import { STATUS_STYLE } from '@/domain/status';
import { getRequestType } from '@/config/requests';
import { useMut, useQ } from '@/data/hooks';
import { formatDate, formatTime } from '@/domain/dates';
import { canWithdraw, summaryRows } from '@/domain/requests';
import type { Request } from '@/domain/types';
import { useCfg } from './cfg';

const DECISION = ['Ready for approval', 'Approved', 'Not approved', 'Returned', 'Withdrawn'];

function stages(r: Request, t: (k: string) => string, loc: string): TimelineStep[] {
  const find = (names: string[]) => [...r.timeline].reverse().find((e) => names.includes(e.title));
  const spec: [string, string[]][] = [
    ['sent', ['Sent', 'Sent again']],
    ['with-desk', ['With desk']],
    ['decision', DECISION],
    ['order', ['Order issued']],
  ];
  const rows = spec.map(([id, names]) => ({ id, ev: find(names) }));
  const lastDone = rows.reduce((acc, x, i) => (x.ev ? i : acc), -1);
  return rows.map((x, i) => ({
    id: x.id,
    title: x.id === 'decision' && x.ev ? x.ev.title : t(`detail.stages.${x.id}`),
    date: x.ev
      ? `${formatDate(x.ev.date, loc)}, ${formatTime(x.ev.date, loc)}`
      : t('detail.pending'),
    role: x.ev?.role ? t(`detail.roles.${x.ev.role}`) : undefined,
    note: x.ev?.note,
    current: i === lastDone,
  }));
}

export default function RequestPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation('requests');
  const c = useCfg();
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const toast = useToast();
  const q = useQ('request', id);
  const docs = useQ('documents');
  const withdraw = useMut('withdrawRequest');
  const addNote = useMut('addNote');
  const [confirm, setConfirm] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (q.isPending) return <Skeleton variant="card" count={3} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const r = q.data;
  const def = getRequestType(r.type);
  const status = t(STATUS_STYLE[r.status].label, { ns: 'common' });
  const order = r.orderId ? docs.data?.find((d) => d.id === r.orderId) : undefined;

  const main = (() => {
    switch (r.status) {
      case 'draft':
        return (
          <Link
            className="btn btn-primary"
            to={`/requests/new/${r.type}?draft=${r.id}&step=${r.lastStep ?? 0}`}
          >
            {t('detail.continue')}
          </Link>
        );
      case 'returned':
        return (
          <Link className="btn btn-primary" to={`/requests/new/${r.type}?draft=${r.id}&step=1`}>
            {t('detail.editSend')}
          </Link>
        );
      case 'approved':
        return (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setViewer(r.orderId ?? 'sample')}
          >
            {t('detail.downloadOrder')}
          </button>
        );
      case 'rejected':
      case 'withdrawn':
        return (
          <Link className="btn btn-primary" to="/requests/new">
            {t('detail.startNew')}
          </Link>
        );
      default:
        return canWithdraw(r.status) ? (
          <button type="button" className="btn btn-primary" onClick={() => setConfirm(true)}>
            {t('detail.withdraw')}
          </button>
        ) : null;
    }
  })();

  return (
    <>
      <PageHeader
        headline={r.title}
        tagline={
          <>
            {r.submittedAt ? t('detail.sentOn', { date: formatDate(r.submittedAt, loc) }) : ''}{' '}
            {t('detail.currently', { status })}
          </>
        }
        main={main}
        stickyMain
        breadcrumb={[{ label: t('routes.requests.headline'), to: '/requests' }, { label: r.title }]}
      />
      {r.status === 'returned' && (
        <Banner variant="warning">{t('detail.returned', { reason: r.returnReason })}</Banner>
      )}
      {r.status === 'rejected' && (
        <Banner variant="critical">{t('detail.rejected', { reason: r.rejectReason })}</Banner>
      )}
      <div className="layout-side request-layout">
        <div className="stack">
          <section className="card order-1" aria-labelledby="rq-tl">
            <div className="cardhead">
              <h2 id="rq-tl">{t('detail.timeline')}</h2>
              <StatusChip status={r.status} />
            </div>
            <p className="small muted">
              {t('detail.ref')}: <strong>{r.ref}</strong>
            </p>
            <Timeline steps={stages(r, t, loc)} label={t('detail.timeline')} />
          </section>
          <section className="card order-2" aria-labelledby="rq-sum">
            <h2 id="rq-sum" className="h-sm">
              {t('detail.summary')}
            </h2>
            {def && (
              <KeyValueList
                items={summaryRows(def, r.values).map((x) => ({
                  label: c(
                    def.key,
                    `f.${def.fields.find((f) => f.label === x.label)?.name ?? x.label}`,
                    x.label,
                  ),
                  value: x.value,
                }))}
              />
            )}
          </section>
          <section className="card order-2" aria-labelledby="rq-att">
            <h2 id="rq-att" className="h-sm">
              {t('detail.attachments')}
            </h2>
            {r.attachments.length === 0 ? (
              <p className="muted">{t('detail.noAttachments')}</p>
            ) : (
              <ul className="files">
                {r.attachments.map((a, i) => (
                  <li key={i}>
                    <span className="grow">{a.name}</span>
                    <button type="button" className="link-btn" onClick={() => setViewer('sample')}>
                      {t('detail.view')}
                    </button>
                    <a className="link" href={`${import.meta.env.BASE_URL}sample.pdf`} download>
                      {t('detail.download')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <section className="card order-3 sticky" aria-labelledby="rq-notes">
          <h2 id="rq-notes" className="h-sm">
            {t('detail.notes')}
          </h2>
          {r.notes.length === 0 ? (
            <p className="muted">{t('detail.notesEmpty')}</p>
          ) : (
            <ul className="notes">
              {r.notes.map((n) => (
                <li key={n.id} className={`note note-${n.from}`}>
                  <strong>{n.from === 'officer' ? t('detail.you') : t('detail.desk')}</strong>{' '}
                  <span className="muted small">{formatDate(n.createdAt, loc)}</span>
                  <p>{n.text}</p>
                </li>
              ))}
            </ul>
          )}
          <TextArea
            name="rq-note"
            label={t('detail.noteLabel')}
            value={note}
            onChange={setNote}
            rows={3}
          />
          <button
            type="button"
            className="btn"
            disabled={!note.trim() || addNote.isPending}
            onClick={() => addNote.mutate([r.id, note.trim()], { onSuccess: () => setNote('') })}
          >
            {t('detail.addNote')}
          </button>
        </section>
      </div>
      {confirm && (
        <ConfirmDialog
          title={t('detail.withdrawTitle')}
          body={t('detail.withdrawBody')}
          confirmLabel={t('detail.withdraw')}
          cancelLabel={t('detail.keep')}
          onCancel={() => setConfirm(false)}
          onConfirm={() =>
            withdraw.mutate([r.id], {
              onSuccess: () => {
                setConfirm(false);
                toast(t('detail.withdrawn'));
              },
            })
          }
        />
      )}
      {viewer && (
        <FileViewer
          title={order?.orderNumber ?? r.title}
          url={order?.fileUrl}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}
