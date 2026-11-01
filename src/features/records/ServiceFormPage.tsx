import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion } from '@/components/Accordion';
import { Banner } from '@/components/Banner';
import { ErrorState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { DatePicker, Select, TextArea, TextField } from '@/components/form/inputs';
import { NotFound } from '@/app/NotFound';
import { RouteHeader } from '@/app/usePage';
import { features } from '@/config/features';
import { ORDER_TYPES, getRequestType, type RequestTypeDef } from '@/config/requests';
import { getServiceCard, supportsPast, type ServiceCardDef } from '@/config/services';
import { toOptions } from '@/config/options';
import { useMut, useQ } from '@/data/hooks';
import {
  balanceKey,
  dayCount,
  pastDateNotice,
  pastWarnings,
  remaining,
  validateDetails,
  validateDocuments,
  type Files,
  type Values,
} from '@/domain/requests';
import type { Mode, Request } from '@/domain/types';
import { RequestFields } from '../requests/RequestFields';
import { UnsavedGuard } from '../requests/UnsavedGuard';

const ORDER_FIELDS = ['orderType', 'orderNumber', 'orderDate', 'orderRemarks'] as const;

/** Apply, Record or Add a past record. One page for every service card, built from config. */
export default function ServiceFormPage({ past = false }: { past?: boolean }) {
  const { card: key } = useParams();
  const card = getServiceCard(key);
  const def = getRequestType(card?.formKey);
  const [params] = useSearchParams();
  const draft = params.get('draft') ?? '';
  if (!card || !def) return <NotFound />;
  if (past && !supportsPast(card)) return <NotFound />;
  const mode: Mode = past ? 'past' : def.modes.includes('record') ? 'record' : 'apply';
  return draft ? (
    <WithDraft card={card} def={def} mode={mode} id={draft} />
  ) : (
    <ServiceForm card={card} def={def} mode={mode} initial={{}} />
  );
}

function WithDraft(props: { card: ServiceCardDef; def: RequestTypeDef; mode: Mode; id: string }) {
  const q = useQ('request', props.id);
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  return (
    <ServiceForm
      card={props.card}
      def={props.def}
      mode={props.mode}
      initial={q.data.values}
      existing={q.data}
    />
  );
}

function ServiceForm({
  card,
  def,
  mode,
  initial,
  existing,
}: {
  card: ServiceCardDef;
  def: RequestTypeDef;
  mode: Mode;
  initial: Values;
  existing?: Request;
}) {
  const { t } = useTranslation('records');
  const tr = useTranslation('requests').t;
  const common = useTranslation().t;
  const nav = useNavigate();
  const toast = useToast();
  const bypass = useRef(false);
  const save = useMut('saveRequest');
  const officer = useQ('officer');
  const booked = useQ('booked');
  const bal = useQ('leaveBalance');
  const [values, setValues] = useState<Values>(initial);
  const [files, setFiles] = useState<Files>((initial._files as Files) ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const draftId = useRef(existing?.id);
  const summaryRef = useRef<HTMLDivElement>(null);
  const orderMode = features.requests.officerOrderDetails;

  const set = (name: string, v: unknown) => {
    setDirty(true);
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) =>
      Object.fromEntries(
        Object.entries(e).filter(([k]) => k !== name && !k.startsWith(`${name}.`)),
      ),
    );
  };
  const setDoc = (name: string, f: UploadedFile[]) => {
    setDirty(true);
    setFiles((s) => ({ ...s, [name]: f }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== `doc.${name}`)));
  };
  const payload = (draftOnly: boolean) => ({
    type: def.key,
    mode,
    values: { ...values, _files: files },
    attachments: Object.values(files).flat(),
    draft: draftOnly,
    existingId: draftId.current,
  });
  const tx = (e: { key: string; params?: Record<string, string | number> }) =>
    common(e.key, { ...e.params });

  const range = values.dates as { from?: string; to?: string } | undefined;
  const days = dayCount(range);
  const bk = balanceKey(values.type);
  const left = bal.data && bk ? remaining(bal.data, bk) : undefined;
  const warn = useMemo(
    () => pastWarnings(def, values, bal.data, mode),
    [def, values, bal.data, mode],
  );

  const fail = (list: string[], map: Record<string, string>) => {
    setErrors(map);
    setSummary(list);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };
  const send = async () => {
    const today = new Date();
    const all = [
      ...validateDetails(def, values, {
        booked: booked.data ?? [],
        balance: bal.data,
        today,
        mode,
      }),
      ...validateDocuments(def, values, files, mode, today),
    ];
    if (pastDateNotice(values, mode, today))
      all.push({ field: 'dates.from', key: 'ui.errors.usePast' });
    if (orderMode === 'required')
      for (const f of ORDER_FIELDS.slice(0, 3))
        if (!String(values[f] ?? '').trim()) all.push({ field: f, key: 'ui.errors.required' });
    if (all.length) {
      const map: Record<string, string> = {};
      all.forEach((e) => (map[e.field] ??= tx(e)));
      return fail(all.map(tx), map);
    }
    setErrors({});
    setSummary([]);
    try {
      const r = await save.mutateAsync([payload(false)]);
      bypass.current = true;
      toast(t('form.sent'));
      nav(`/records/requests/${r.id}`);
    } catch {
      toast(tr('form.saveFailed'));
    }
  };
  const saveDraft = async () => {
    try {
      const r = await save.mutateAsync([payload(true)]);
      draftId.current = r.id;
      setDirty(false);
      toast(tr('form.draftSaved'));
    } catch {
      toast(tr('form.saveFailed'));
    }
  };

  const o = officer.data;
  const headline = mode === 'past' ? t(`form.pastTitle`, { title: card.title }) : card.main;
  const orderBlock = def.orderBlock && orderMode !== 'hidden' && (
    <Accordion
      items={[
        {
          id: 'order',
          title: t('form.orderTitle'),
          content: (
            <div className="form-grid">
              <Select
                name={`${def.key}-orderType`}
                label={t('form.orderType')}
                value={String(values.orderType ?? '')}
                onChange={(x) => set('orderType', x)}
                placeholder={tr('form.select')}
                options={toOptions(ORDER_TYPES)}
                required={orderMode === 'required'}
                error={errors.orderType}
              />
              <TextField
                name={`${def.key}-orderNumber`}
                label={t('form.orderNumber')}
                value={String(values.orderNumber ?? '')}
                onChange={(x) => set('orderNumber', x)}
                required={orderMode === 'required'}
                error={errors.orderNumber}
              />
              <DatePicker
                name={`${def.key}-orderDate`}
                label={t('form.orderDate')}
                value={String(values.orderDate ?? '')}
                onChange={(x) => set('orderDate', x)}
                required={orderMode === 'required'}
                error={errors.orderDate}
              />
              <FileUpload
                name={`${def.key}-orderFile`}
                label={t('form.orderFile')}
                files={files.orderFile ?? []}
                onChange={(f) => setDoc('orderFile', f)}
              />
              <div className="full">
                <TextArea
                  name={`${def.key}-orderRemarks`}
                  label={t('form.orderRemarks')}
                  value={String(values.orderRemarks ?? '')}
                  onChange={(x) => set('orderRemarks', x)}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  );

  return (
    <>
      <UnsavedGuard bypass={bypass} dirty={dirty && !save.isPending} />
      <RouteHeader
        id={mode === 'past' ? 'records.service.past' : 'records.service.new'}
        headline={headline}
        tagline={
          mode === 'past'
            ? t('form.pastTagline')
            : t(`form.tagline.${card.key}`, { defaultValue: card.tagline })
        }
        breadcrumb={[
          { label: common('nav.records'), to: '/records' },
          { label: common('nav.services'), to: '/records/services' },
          { label: card.title, to: `/records/services/${card.key}` },
          { label: headline },
        ]}
      />
      <div className="form-narrow">
        {mode === 'past' && <Banner variant="info">{t('form.pastBanner')}</Banner>}
        {summary.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="ux4g-alert ux4g-alert-error ux4g-mb-m"
          >
            <div className="ux4g-alert-content">
              <strong className="ux4g-alert-title">{common('ui.field.errorSummary')}</strong>
              <ul className="ux4g-alert-message">
                {summary.map((e, k) => (
                  <li key={k}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <form noValidate onSubmit={(e) => e.preventDefault()}>
          <h2 className="ux4g-heading-s-strong ux4g-mb-xs">{t('form.about')}</h2>
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mb-m">
            {t('form.aboutHelp')}
          </p>
          <div className="form-grid ux4g-mb-m">
            <TextField
              name="about-name"
              label={t('form.name')}
              value={o?.name ?? ''}
              onChange={() => {}}
              locked
            />
            <TextField
              name="about-id"
              label={t('form.officerId')}
              value={o?.officerId ?? ''}
              onChange={() => {}}
              locked
            />
            <TextField
              name="about-desig"
              label={t('form.designation')}
              value={o?.currentPosting.designation ?? ''}
              onChange={() => {}}
              locked
            />
            <TextField
              name="about-dept"
              label={t('form.department')}
              value={o?.currentPosting.department ?? ''}
              onChange={() => {}}
              locked
            />
          </div>

          <h2 className="ux4g-heading-s-strong ux4g-mb-s">{t('form.details')}</h2>
          <RequestFields
            def={def}
            values={values}
            errors={errors}
            set={set}
            files={files}
            setFiles={setDoc}
            mode={mode}
          />
          {def.key === 'leave' && days > 0 && (
            <p className="ux4g-body-m-default ux4g-mb-m" aria-live="polite">
              {left !== undefined
                ? t('form.usesDays', { n: days, m: Math.max(left - days, 0) })
                : t('form.usesDaysOnly', { n: days })}
            </p>
          )}
          {warn.map((w) => (
            <Banner key={w} variant="warning">
              {common(w)}
            </Banner>
          ))}
          {orderBlock}

          <div className="stepper-bar ux4g-d-flex ux4g-ai-center gap-s">
            <button
              type="button"
              className="ux4g-btn-outline-primary ux4g-btn-m"
              onClick={saveDraft}
            >
              {tr('ui.stepper.saveDraft', { defaultValue: common('ui.stepper.saveDraft') })}
            </button>
            <span className="ux4g-flex-1" />
            <button
              type="button"
              className="ux4g-btn-primary ux4g-btn-m"
              disabled={save.isPending}
              aria-busy={save.isPending}
              onClick={send}
            >
              {t('form.send')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
