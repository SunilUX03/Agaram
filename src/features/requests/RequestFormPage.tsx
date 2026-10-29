import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';
import { ErrorState } from '@/components/EmptyState';
import { FormStepper, type StepDef } from '@/components/FormStepper';
import { KeyValueList } from '@/components/KeyValueList';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { TextField } from '@/components/form/inputs';
import { NotFound } from '@/app/NotFound';
import { RouteHeader } from '@/app/usePage';
import { getRequestType, type RequestTypeDef } from '@/config/requests';
import { useMut, useQ } from '@/data/hooks';
import {
  balanceKey,
  dayCount,
  isDocRequired,
  pastDateNotice,
  remaining,
  summaryRows,
  validateDetails,
  validateDocuments,
  type Files,
  type Values,
} from '@/domain/requests';
import type { Request } from '@/domain/types';
import { DynamicField, useOptions } from './DynamicField';
import { UnsavedGuard } from './UnsavedGuard';
import { useCfg } from './cfg';

export default function RequestFormPage() {
  const { type } = useParams();
  const def = getRequestType(type);
  const [params] = useSearchParams();
  const draftId = params.get('draft') ?? '';
  if (!def) return <NotFound />;
  return draftId ? (
    <WithDraft def={def} id={draftId} step={Number(params.get('step') ?? 0)} />
  ) : (
    <RequestForm def={def} initial={prefill(def, params)} />
  );
}

function prefill(def: RequestTypeDef, params: URLSearchParams): Values {
  const v: Values = {};
  if (def.key === 'update-details' && params.get('section')) v.section = params.get('section');
  return v;
}

function WithDraft({ def, id, step }: { def: RequestTypeDef; id: string; step: number }) {
  const q = useQ('request', id);
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />;
  return (
    <RequestForm
      def={def}
      initial={q.data.values}
      existing={q.data}
      initialStep={Math.min(step, 3)}
    />
  );
}

function RequestForm({
  def,
  initial,
  existing,
  initialStep = 0,
}: {
  def: RequestTypeDef;
  initial: Values;
  existing?: Request;
  initialStep?: number;
}) {
  const { t } = useTranslation('requests');
  const c = useCfg();
  const nav = useNavigate();
  const toast = useToast();
  const save = useMut('saveRequest');
  const officer = useQ('officer');
  const booked = useQ('booked');
  const bal = useQ('leaveBalance');
  const options = useOptions();
  const [values, setValues] = useState<Values>(initial);
  const [files, setFiles] = useState<Files>((initial._files as Files) ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const draftId = useRef(existing?.id);
  const stepper = useRef<{ goTo: (i: number) => void } | null>(null);

  const label = c(def.key, 'label', def.label);
  const tx = (e: { key: string; params?: Record<string, string | number> }) =>
    t(e.key, { ns: 'common', ...e.params });
  const set = (name: string, v: unknown) => {
    setDirty(true);
    setValues((s) => {
      const next = { ...s, [name]: v };
      if (name === 'section') next.field = '';
      if (name === 'state') next.district = '';
      if (name === 'propertyState') next.propertyDistrict = '';
      return next;
    });
    setErrors((e) =>
      Object.fromEntries(
        Object.entries(e).filter(([k]) => k !== name && !k.startsWith(`${name}.`)),
      ),
    );
  };
  const payload = (draft: boolean, lastStep: number) => ({
    type: def.key,
    values: { ...values, _files: files },
    attachments: Object.values(files).flat(),
    draft,
    lastStep,
    existingId: draftId.current,
  });

  const today = useMemo(() => new Date(), []);
  const range = values.dates as { from?: string } | undefined;
  const past = range?.from ? pastDateNotice(def, values, today) : null;
  const key = balanceKey(values.type);
  const days = dayCount(values.dates);
  const over =
    def.rules?.includes('balanceWarning') &&
    bal.data &&
    key &&
    (key === 'cl' || key === 'el') &&
    days > remaining(bal.data, key)
      ? remaining(bal.data, key)
      : null;

  const validateDetailsStep = () => {
    const errs = validateDetails(def, values, {
      booked: booked.data ?? [],
      balance: bal.data,
      today,
    });
    const map: Record<string, string> = {};
    const msgs: string[] = [];
    errs.forEach((e) => {
      map[e.field] = tx(e);
      msgs.push(
        `${c(def.key, `f.${e.field.split('.')[0]}`, def.fields.find((f) => f.name === e.field.split('.')[0])?.label ?? e.field)}: ${tx(e)}`,
      );
    });
    if (past === 'blocked') {
      map['dates.from'] = t('form.past_blocked');
      msgs.push(t('form.past_blocked'));
    }
    setErrors(map);
    return msgs;
  };
  const validateDocsStep = () => {
    const errs = validateDocuments(def, values, files);
    const map: Record<string, string> = {};
    errs.forEach((e) => (map[e.field] = tx(e)));
    setErrors(map);
    return errs.map(tx);
  };
  const autosave = async (i: number) => {
    if (i < 1) return;
    const r = await save.mutateAsync([payload(true, i + 1)]);
    draftId.current = r.id;
    setDirty(false);
  };
  const saveDraft = async () => {
    const r = await save.mutateAsync([payload(true, 1)]);
    draftId.current = r.id;
    setDirty(false);
    toast(t('form.saved'));
  };
  const send = async () => {
    const r = await save.mutateAsync([payload(false, 3)]);
    setDirty(false);
    toast(r.status === 'approved' ? t('form.detailsSaved') : t('form.sent'));
    nav(`/requests/${r.id}`);
  };

  const o = officer.data;
  const steps: StepDef[] = [
    {
      id: 'about',
      title: t('form.steps.about'),
      content: (
        <div className="form-grid form-narrow">
          <p className="help full">{t('form.aboutHelp')}</p>
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
      ),
    },
    {
      id: 'details',
      title: t('form.steps.details'),
      validate: validateDetailsStep,
      content: (
        <div className="form-narrow">
          {def.note && <Banner variant="info">{c(def.key, 'note', def.note)}</Banner>}
          {def.autoApprove && String(values.section) === 'Contact' && (
            <Banner variant="info">{t('form.autoApprove')}</Banner>
          )}
          {past === 'notice' && <Banner variant="warning">{t('form.pastNotice')}</Banner>}
          {over !== null && <Banner variant="warning">{t('form.balanceWarn', { n: over })}</Banner>}
          <div className="form-grid">
            {def.fields.map((f) => (
              <div
                key={f.name}
                className={
                  f.full || f.kind === 'dateRange' || f.kind === 'textarea' ? 'full' : undefined
                }
              >
                <DynamicField
                  type={def.key}
                  def={f}
                  values={values}
                  errors={errors}
                  set={set}
                  options={options(f.options, values, f.name)}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'documents',
      title: t('form.steps.documents'),
      validate: validateDocsStep,
      content: (
        <div className="form-narrow">
          {def.documents.length === 0 ? (
            <p className="muted">{t('form.docsNone')}</p>
          ) : (
            <>
              <p className="help">
                {t('form.docsExpected', {
                  items: def.documents
                    .map(
                      (d) =>
                        `${c(def.key, `d.${d.name}`, d.label)} (${isDocRequired(d, values) ? t('form.docRequired') : t('form.docOptional')})`,
                    )
                    .join(', '),
                })}
              </p>
              {def.documents.map((d) => (
                <FileUpload
                  key={d.name}
                  name={`${def.key}-${d.name}`}
                  label={c(def.key, `d.${d.name}`, d.label)}
                  required={isDocRequired(d, values)}
                  files={(files[d.name] ?? []) as UploadedFile[]}
                  error={errors[`doc.${d.name}`]}
                  onChange={(f) => {
                    setDirty(true);
                    setFiles({ ...files, [d.name]: f });
                    setErrors({});
                  }}
                />
              ))}
            </>
          )}
        </div>
      ),
    },
    {
      id: 'review',
      title: t('form.steps.review'),
      content: (
        <div className="form-narrow stack-sm">
          <p className="help">{t('form.reviewHelp')}</p>
          {past === 'notice' && <Banner variant="warning">{t('form.pastNotice')}</Banner>}
          <section className="card">
            <div className="cardhead">
              <h2>{t('form.steps.details')}</h2>
              <button type="button" className="link-btn" onClick={() => stepper.current?.goTo(1)}>
                {t('form.edit')}
              </button>
            </div>
            <KeyValueList
              items={summaryRows(def, values).map((r) => ({
                label: c(
                  def.key,
                  `f.${def.fields.find((f) => f.label === r.label)?.name ?? r.label}`,
                  r.label,
                ),
                value: r.value,
              }))}
            />
          </section>
          <section className="card">
            <div className="cardhead">
              <h2>{t('form.attachments')}</h2>
              <button type="button" className="link-btn" onClick={() => stepper.current?.goTo(2)}>
                {t('form.edit')}
              </button>
            </div>
            {Object.values(files).flat().length ? (
              <ul className="files">
                {Object.values(files)
                  .flat()
                  .map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
              </ul>
            ) : (
              <p className="muted">{t('form.none')}</p>
            )}
          </section>
        </div>
      ),
    },
  ];

  return (
    <>
      <UnsavedGuard dirty={dirty} />
      <RouteHeader
        id="requests.form"
        headline={label}
        breadcrumb={[{ label: t('routes.requests.headline'), to: '/requests' }, { label }]}
      />
      <FormStepper
        steps={steps}
        stepRef={stepper}
        initialStep={initialStep}
        onAutosave={autosave}
        onSaveDraft={saveDraft}
        onSend={send}
      />
    </>
  );
}
