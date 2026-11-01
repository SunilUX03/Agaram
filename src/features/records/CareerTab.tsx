import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog } from '@/components/Dialog';
import { FileViewer } from '@/components/FileViewer';
import { QueryView } from '@/components/QueryView';
import { Tag } from '@/components/Tag';
import { useToast } from '@/components/Toast';
import type { UploadedFile } from '@/components/form/FileUpload';
import { getRequestType } from '@/config/requests';
import { useMut, useQ } from '@/data/hooks';
import { formatDMY, formatDate, parseDMY } from '@/domain/dates';
import { validateDetails, validateDocuments, type Files, type Values } from '@/domain/requests';
import type { CareerEntry, PendingChange } from '@/domain/types';
import { RequestFields } from '../requests/RequestFields';
import { CorrectionDialog } from './CorrectionDialog';
import { careerLabel } from './profileFields';
import { useLocale } from './shared';

const iso2dmy = (iso?: string) => (iso ? formatDMY(new Date(iso)) : '');
const dayBefore = (text: string) => {
  const d = parseDMY(text);
  return d ? formatDMY(new Date(d.getTime() - 86400000)) : '';
};

type Filter = 'all' | 'posting' | 'promotion';

/** The Career tab: postings and promotions, newest first, with Add and Edit forms (v2, section 3.2). */
export function CareerTab({
  pending,
  editRequestId,
}: {
  pending: PendingChange[];
  editRequestId: string;
}) {
  const { t } = useTranslation('records');
  const loc = useLocale();
  const career = useQ('career');
  const docs = useQ('documents');
  const officer = useQ('officer');
  const withdraw = useMut('withdrawRequest');
  const toast = useToast();
  const requests = useQ('requests');
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [form, setForm] = useState<{ kind: 'posting' | 'promotion'; entry?: CareerEntry } | null>(
    null,
  );
  const [report, setReport] = useState<string | null>(null);
  const [order, setOrder] = useState<string | null>(null);
  const [drop, setDrop] = useState<PendingChange | null>(null);
  const existing = editRequestId
    ? (requests.data ?? []).find(
        (r) => r.id === editRequestId && (r.type === 'posting' || r.type === 'promotion'),
      )
    : undefined;
  const closeForm = () => {
    setForm(null);
    if (editRequestId) {
      const n = new URLSearchParams(params);
      n.delete('edit');
      setParams(n, { replace: true });
    }
  };
  const shown = form ?? (existing ? { kind: existing.type as 'posting' | 'promotion' } : null);
  const current = (career.data ?? []).find((c) => c.kind === 'posting' && !c.toDate);
  const pendingOf = (id: string) =>
    pending.find((p) => p.targetKind === 'career' && p.targetKey === id);
  const docOf = (id?: string) => (id ? docs.data?.find((d) => d.id === id) : undefined);
  const returned = (requests.data ?? []).filter(
    (r) => (r.type === 'posting' || r.type === 'promotion') && r.status === 'returned',
  );
  const o = officer.data;

  const range = (e: CareerEntry) =>
    e.kind === 'promotion'
      ? formatDate(e.fromDate, loc)
      : `${formatDate(e.fromDate, loc)} – ${e.toDate ? formatDate(e.toDate, loc) : t('career.present')}`;

  return (
    <>
      <div className="ux4g-d-flex ux4g-flex-wrap gap-s ux4g-mb-m">
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m"
          onClick={() => setForm({ kind: 'posting' })}
        >
          {t('career.addPosting')}
        </button>
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m"
          onClick={() => setForm({ kind: 'promotion' })}
        >
          {t('career.addPromotion')}
        </button>
      </div>
      {returned.map((r) => (
        <Banner key={r.id} variant="warning">
          {t('pending.returned', { group: r.title, reason: r.returnReason })}
        </Banner>
      ))}

      {o && (
        <section
          className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad ux4g-mb-m"
          aria-labelledby="cr-cur"
        >
          <div className="ux4g-d-flex ux4g-ai-center gap-s ux4g-mb-xs">
            <h2 id="cr-cur" className="ux4g-heading-s-strong">
              {t('career.current')}
            </h2>
            <Tag>{t('career.currentChip')}</Tag>
          </div>
          <p className="ux4g-body-m-strong">{o.currentPosting.designation}</p>
          <p className="ux4g-body-m-default">{o.currentPosting.department}</p>
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
            {o.currentPosting.postingIn} · {o.currentPosting.postType} ·{' '}
            {o.currentPosting.locationChange}
          </p>
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
            {o.officeContact.address}
          </p>
        </section>
      )}

      <div
        className="ux4g-d-flex ux4g-flex-wrap gap-xs ux4g-mb-m"
        role="group"
        aria-label={t('career.filter')}
      >
        {(['all', 'posting', 'promotion'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`ux4g-filter-chip-m${filter === f ? ' active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {t(`career.filters.${f}`)}
          </button>
        ))}
      </div>

      <QueryView
        query={career}
        skeleton="row"
        skeletonCount={5}
        empty={{
          message: t('career.empty'),
          actionLabel: t('career.addPosting'),
          onAction: () => setForm({ kind: 'posting' }),
        }}
      >
        {(all) => (
          <ol className="career-timeline plain-list">
            {all
              .filter((e) => filter === 'all' || e.kind === filter)
              .map((e) => {
                const p = pendingOf(e.id);
                const doc = docOf(e.orderId);
                return (
                  <li key={e.id} className="career-item">
                    <span className="career-dot" aria-hidden="true" />
                    <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
                      <p className="ux4g-body-s-default ux4g-text-neutral-secondary">{range(e)}</p>
                      <h3 className="ux4g-heading-xs-strong">
                        {e.kind === 'promotion'
                          ? t('career.promotionTo', { grade: e.toGrade })
                          : e.designation}
                      </h3>
                      <p className="ux4g-body-m-default">
                        {e.kind === 'promotion'
                          ? `${e.fromGrade} → ${e.toGrade}`
                          : [e.department, e.postingIn].filter(Boolean).join(', ')}
                      </p>
                      <div className="tags ux4g-my-xs">
                        {e.postType && <Tag>{e.postType}</Tag>}
                        {e.locationChange && <Tag>{e.locationChange}</Tag>}
                        {e === current && <Tag>{t('career.currentChip')}</Tag>}
                        {e.addedByOfficer && <Tag>{t('career.addedByYou')}</Tag>}
                        {p && <Tag>{t('pending.chip')}</Tag>}
                      </div>
                      {p && (
                        <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                          {t('pending.asked2', { value: p.proposedValue })}{' '}
                          <button
                            type="button"
                            className="ux4g-btn-text-primary ux4g-btn-xs"
                            onClick={() => setDrop(p)}
                          >
                            {t('pending.withdraw')}
                          </button>
                        </p>
                      )}
                      <div className="ux4g-d-flex ux4g-flex-wrap gap-s ux4g-mt-s">
                        {doc && (
                          <button
                            type="button"
                            className="ux4g-btn-outline-primary ux4g-btn-s"
                            onClick={() => setOrder(doc.id)}
                          >
                            {t('career.order')}
                            <span className="sr-only"> {e.designation}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="ux4g-btn-text-primary ux4g-btn-s"
                          disabled={!!p}
                          onClick={() => setForm({ kind: e.kind, entry: e })}
                        >
                          {t('career.edit')}
                          <span className="sr-only"> {careerLabel(e)}</span>
                        </button>
                        <button
                          type="button"
                          className="ux4g-btn-text-primary ux4g-btn-s"
                          onClick={() => setReport(careerLabel(e))}
                        >
                          {t('career.reportError')}
                          <span className="sr-only"> {careerLabel(e)}</span>
                        </button>
                      </div>
                      {p && (
                        <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-xs">
                          {t('pending.busy')}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        )}
      </QueryView>

      {shown && (
        <CareerForm
          key={`${shown.kind}-${(form?.entry ?? existing)?.id ?? 'new'}`}
          kind={shown.kind}
          entry={form?.entry}
          existing={existing}
          onClose={closeForm}
        />
      )}
      {report !== null && <CorrectionDialog initial={report} onClose={() => setReport(null)} />}
      {order && (
        <FileViewer
          title={docOf(order)?.orderNumber ?? ''}
          url={docOf(order)?.fileUrl}
          onClose={() => setOrder(null)}
        />
      )}
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
    </>
  );
}

function CareerForm({
  kind,
  entry,
  existing,
  onClose,
}: {
  kind: 'posting' | 'promotion';
  entry?: CareerEntry;
  existing?: { id: string; values: Values };
  onClose: () => void;
}) {
  const { t } = useTranslation('records');
  const careerQ = useQ('career');
  const career = useMemo(() => careerQ.data ?? [], [careerQ.data]);
  const common = useTranslation().t;
  const toast = useToast();
  const save = useMut('saveRequest');
  const def = getRequestType(kind)!;
  const initial: Values = existing
    ? (existing.values as Values)
    : entry
      ? kind === 'posting'
        ? {
            entryId: entry.id,
            postingIn: entry.postingIn ?? '',
            department: entry.department,
            designation: entry.designation,
            postType: entry.postType ?? '',
            locationChange: entry.locationChange ?? '',
            fromDate: iso2dmy(entry.fromDate),
            toDate: iso2dmy(entry.toDate),
            officeAddress: entry.officeAddress ?? '',
            orderNumber: entry.orderNumber ?? '',
            orderDate: iso2dmy(entry.orderDate),
          }
        : {
            entryId: entry.id,
            fromGrade: entry.fromGrade ?? '',
            toGrade: entry.toGrade ?? '',
            promotionDate: iso2dmy(entry.fromDate),
            orderNumber: entry.orderNumber ?? '',
            orderDate: iso2dmy(entry.orderDate),
          }
      : {};
  const [values, setValues] = useState<Values>(initial);
  const [files, setFiles] = useState<Files>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState(false);
  const sending = useRef(false);

  const set = (name: string, v: unknown) => {
    setValues((s) => {
      const next = { ...s, [name]: v };
      if (name === 'postingIn') {
        next.department = '';
        next.designation = '';
      }
      return next;
    });
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== name)));
  };

  const currentOther = career.find(
    (c) => c.kind === 'posting' && !c.toDate && c.id !== values.entryId,
  );
  const overlap = useMemo(() => {
    if (kind !== 'posting') return undefined;
    const a = parseDMY(String(values.fromDate ?? ''));
    const b = values.toDate ? parseDMY(String(values.toDate)) : new Date(8.64e15);
    if (!a || !b) return undefined;
    return career.find(
      (c) =>
        c.kind === 'posting' &&
        c.id !== values.entryId &&
        c.toDate &&
        new Date(c.fromDate) <= b &&
        a <= new Date(c.toDate),
    );
  }, [kind, values.fromDate, values.toDate, values.entryId, career]);

  const check = () => {
    const all = [
      ...validateDetails(def, values, { booked: [], today: new Date() }),
      ...validateDocuments(def, values, files),
    ];
    const map: Record<string, string> = {};
    all.forEach((e) => (map[e.field] ??= common(e.key, { ...e.params })));
    const a = parseDMY(String(values.fromDate ?? ''));
    const b = parseDMY(String(values.toDate ?? ''));
    if (kind === 'posting' && a && b && b < a) map.toDate = common('ui.errors.endBeforeStart');
    setErrors(map);
    return Object.keys(map).length === 0;
  };
  const post = async () => {
    if (sending.current) return;
    sending.current = true;
    try {
      await save.mutateAsync([
        {
          type: kind,
          values: { ...values, _files: files },
          attachments: Object.values(files).flat(),
          existingId: existing?.id,
        },
      ]);
      toast(t('panel.sent'));
      onClose();
    } catch {
      toast(t('panel.failed'));
    } finally {
      sending.current = false;
    }
  };
  const send = async () => {
    if (!check()) return;
    // Only one posting can be current: ask before ending the existing one. Wait for the list if it is still loading.
    const list = careerQ.data ?? (await careerQ.refetch()).data ?? [];
    const other = list.find((c) => c.kind === 'posting' && !c.toDate && c.id !== values.entryId);
    if (kind === 'posting' && !values.toDate && other) setAsk(true);
    else void post();
  };

  return (
    <Dialog
      title={t(entry || existing ? `career.formEdit.${kind}` : `career.formAdd.${kind}`)}
      variant="full"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={onClose}>
            {t('panel.cancel')}
          </button>
          <button
            type="button"
            className="ux4g-btn-primary ux4g-btn-m"
            disabled={save.isPending}
            onClick={send}
          >
            {t('panel.send')}
          </button>
        </>
      }
    >
      {overlap && (
        <Banner variant="warning">
          {t('career.overlap', {
            title: `${overlap.designation}, ${overlap.postingIn ?? overlap.department}`,
          })}
        </Banner>
      )}
      <RequestFields
        def={def}
        values={values}
        errors={errors}
        set={set}
        files={files}
        setFiles={(n: string, f: UploadedFile[]) => setFiles((s) => ({ ...s, [n]: f }))}
      />
      {ask && currentOther && (
        <ConfirmDialog
          title={t('career.endTitle')}
          body={t('career.endBody', { date: dayBefore(String(values.fromDate)) })}
          confirmLabel={t('career.endYes')}
          cancelLabel={t('panel.cancel')}
          onCancel={() => setAsk(false)}
          onConfirm={() => (setAsk(false), void post())}
        />
      )}
    </Dialog>
  );
}
