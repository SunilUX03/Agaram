import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { Select, TextField } from '@/components/form/inputs';
import { toOptions } from '@/config/options';
import { useMut, useQ } from '@/data/hooks';
import type { Education, Officer, PendingChange, Request } from '@/domain/types';

export type PanelGroup = 'contact' | 'education' | 'languages' | 'office';
const LEVELS = ['Graduate degree', 'Postgraduate degree', 'Doctorate', 'Diploma'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s-]{6,}$/;

type Draft = {
  personalEmail: string;
  address: Officer['address'];
  languages: string;
  education: Omit<Education, 'id'>[] & { id?: string }[];
  office: Officer['officeContact'];
};

/** The edit panel for one group of editable profile fields. Locked fields in the group are shown read-only. */
export function EditPanel({
  group,
  officer,
  pending,
  existing,
  onClose,
}: {
  group: PanelGroup;
  officer: Officer;
  pending: PendingChange[];
  existing?: Request;
  onClose: () => void;
}) {
  const { t } = useTranslation('records');
  const common = useTranslation().t;
  const toast = useToast();
  const save = useMut('saveRequest');
  const asked = ((existing?.values as { changes?: Record<string, unknown> } | undefined)?.changes ??
    {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const [d, setD] = useState<Draft>({
    personalEmail: asked.personalEmail ?? officer.contact.personalEmail ?? '',
    address: asked.residentialAddress ?? { ...officer.address },
    languages: asked.languagesKnown ?? officer.languages.join(', '),
    education: asked.education ?? officer.qualifications.map((q) => ({ ...q })),
    office: asked.officeContact ?? { ...officer.officeContact },
  });
  const [cert, setCert] = useState<UploadedFile[]>([]);
  const [tried, setTried] = useState(false);
  const busy = (key: string) =>
    pending.some((p) => p.targetKey === key && p.requestId !== existing?.id);
  const err = (k: string) => (busy(k) ? t('pending.busy') : undefined);

  /** Only the fields that differ from the record are sent. */
  const changes = useMemo(() => {
    const c: Record<string, unknown> = {};
    if (group === 'contact') {
      if (d.personalEmail !== (officer.contact.personalEmail ?? ''))
        c.personalEmail = d.personalEmail;
      if (JSON.stringify(d.address) !== JSON.stringify(officer.address))
        c.residentialAddress = d.address;
    }
    if (group === 'languages' && d.languages !== officer.languages.join(', '))
      c.languagesKnown = d.languages;
    if (
      group === 'education' &&
      JSON.stringify(d.education) !== JSON.stringify(officer.qualifications)
    )
      c.education = d.education;
    if (group === 'office' && JSON.stringify(d.office) !== JSON.stringify(officer.officeContact))
      c.officeContact = d.office;
    return c;
  }, [d, group, officer]);

  const errors: Record<string, string> = {};
  const thisYear = new Date().getFullYear();
  if (group === 'contact') {
    if (d.personalEmail && !EMAIL.test(d.personalEmail)) errors.email = t('panel.errEmail');
    if (!/^\d{6}$/.test(d.address.pincode.replace(/\s/g, '')))
      errors.pincode = t('panel.errPincode');
    if (!d.address.line.trim()) errors.line = common('ui.errors.required');
    if (!d.address.city.trim()) errors.city = common('ui.errors.required');
  }
  if (group === 'languages' && !d.languages.trim()) errors.languages = common('ui.errors.required');
  if (group === 'office') {
    for (const k of ['phone', 'fax', 'mobile'] as const)
      if (d.office[k] && !PHONE.test(d.office[k])) errors[k] = t('panel.errPhone');
  }
  if (group === 'education')
    d.education.forEach((q, i) => {
      if (!q.degree?.trim() || !q.institute?.trim())
        errors[`edu${i}`] = common('ui.errors.required');
      if (Number(q.year) > thisYear) errors[`year${i}`] = t('panel.errYear');
    });
  if (group === 'education' && Object.keys(changes).length && cert.length === 0)
    errors.cert = common('ui.errors.docRequired', { label: t('panel.certificate') });

  const keys = Object.keys(changes);
  const blocked = keys.some(busy);
  const canSend = keys.length > 0 && !blocked;

  const send = async () => {
    setTried(true);
    if (Object.keys(errors).length || !canSend) return;
    try {
      await save.mutateAsync([
        {
          type: 'profile-edit',
          values: { group: t(`groups.${group}`), changes },
          attachments: cert,
          existingId: existing?.id,
        },
      ]);
      toast(t('panel.sent'));
      onClose();
    } catch {
      toast(t('panel.failed'));
    }
  };

  const locked = (label: string, value: string, name: string) => (
    <TextField name={`lock-${name}`} label={label} value={value} onChange={() => {}} locked />
  );
  const setAddr = (k: keyof Officer['address']) => (v: string) =>
    setD((s) => ({ ...s, address: { ...s.address, [k]: v } }));
  const setOff = (k: keyof Officer['officeContact']) => (v: string) =>
    setD((s) => ({ ...s, office: { ...s.office, [k]: v } }));

  return (
    <Dialog
      title={t(`panel.title.${group}`)}
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
            disabled={!canSend || save.isPending}
            aria-busy={save.isPending}
            onClick={send}
          >
            {t('panel.send')}
          </button>
        </>
      }
    >
      <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-mb-m">
        {t('panel.intro')}
      </p>
      {group === 'contact' && (
        <div className="form-grid">
          {locked(t('fields.mobile1'), officer.contact.mobile1, 'mobile')}
          {locked(t('fields.officialEmail'), officer.contact.officialEmail, 'email')}
          <div className="full">
            <TextField
              name="pe-email"
              label={t('fields.personalEmail')}
              value={d.personalEmail}
              onChange={(v) => setD((s) => ({ ...s, personalEmail: v }))}
              error={err('personalEmail') ?? (tried ? errors.email : undefined)}
              help={t('panel.emailHelp')}
              locked={busy('personalEmail')}
            />
          </div>
          <div className="full">
            <TextField
              name="pe-line"
              label={t('panel.addrLine')}
              value={d.address.line}
              onChange={setAddr('line')}
              error={err('residentialAddress') ?? (tried ? errors.line : undefined)}
              locked={busy('residentialAddress')}
              required
            />
          </div>
          <TextField
            name="pe-city"
            label={t('panel.addrCity')}
            value={d.address.city}
            onChange={setAddr('city')}
            error={tried ? errors.city : undefined}
            locked={busy('residentialAddress')}
            required
          />
          <TextField
            name="pe-pin"
            label={t('panel.addrPin')}
            value={d.address.pincode}
            onChange={setAddr('pincode')}
            error={tried ? errors.pincode : undefined}
            locked={busy('residentialAddress')}
            required
          />
        </div>
      )}
      {group === 'languages' && (
        <TextField
          name="pe-lang"
          label={t('fields.languagesKnown')}
          value={d.languages}
          onChange={(v) => setD((s) => ({ ...s, languages: v }))}
          help={t('panel.langHelp')}
          error={err('languagesKnown') ?? (tried ? errors.languages : undefined)}
          locked={busy('languagesKnown')}
          required
        />
      )}
      {group === 'office' && (
        <div className="form-grid">
          <div className="full">
            <TextField
              name="pe-oaddr"
              label={t('panel.officeAddress')}
              value={d.office.address}
              onChange={setOff('address')}
              error={err('officeContact')}
              locked={busy('officeContact')}
            />
          </div>
          <TextField
            name="pe-ophone"
            label={t('panel.officePhone')}
            value={d.office.phone}
            onChange={setOff('phone')}
            error={tried ? errors.phone : undefined}
            locked={busy('officeContact')}
          />
          <TextField
            name="pe-ofax"
            label={t('panel.officeFax')}
            value={d.office.fax}
            onChange={setOff('fax')}
            error={tried ? errors.fax : undefined}
            locked={busy('officeContact')}
          />
          <TextField
            name="pe-omob"
            label={t('panel.officeMobile')}
            value={d.office.mobile}
            onChange={setOff('mobile')}
            error={tried ? errors.mobile : undefined}
            locked={busy('officeContact')}
          />
        </div>
      )}
      {group === 'education' && (
        <>
          {err('education') && (
            <p className="ux4g-body-s-default ux4g-text-error ux4g-mb-s">{err('education')}</p>
          )}
          {d.education.map((q, i) => {
            const put = (k: string) => (v: string) =>
              setD((s) => ({
                ...s,
                education: s.education.map((x, j) =>
                  j === i ? { ...x, [k]: k === 'year' ? Number(v.replace(/\D/g, '')) || 0 : v } : x,
                ) as Draft['education'],
              }));
            return (
              <fieldset key={i} className="form-grid repeat-row ux4g-mb-m">
                <legend className="ux4g-label-l-default ux4g-text-neutral-secondary">
                  {t('panel.eduRow', { n: i + 1 })}
                </legend>
                <Select
                  name={`edu-level-${i}`}
                  label={t('panel.eduLevel')}
                  value={q.level}
                  onChange={put('level')}
                  options={toOptions(LEVELS)}
                  placeholder={common('ui.select', { defaultValue: 'Choose' })}
                  locked={busy('education')}
                />
                <TextField
                  name={`edu-degree-${i}`}
                  label={t('panel.eduDegree')}
                  value={q.degree}
                  onChange={put('degree')}
                  error={tried ? errors[`edu${i}`] : undefined}
                  locked={busy('education')}
                  required
                />
                <TextField
                  name={`edu-spec-${i}`}
                  label={t('panel.eduSpec')}
                  value={q.specialisation}
                  onChange={put('specialisation')}
                  locked={busy('education')}
                />
                <TextField
                  name={`edu-inst-${i}`}
                  label={t('panel.eduInstitute')}
                  value={q.institute}
                  onChange={put('institute')}
                  locked={busy('education')}
                  required
                />
                <TextField
                  name={`edu-state-${i}`}
                  label={t('panel.eduState')}
                  value={q.state}
                  onChange={put('state')}
                  locked={busy('education')}
                />
                <TextField
                  name={`edu-country-${i}`}
                  label={t('panel.eduCountry')}
                  value={q.country}
                  onChange={put('country')}
                  locked={busy('education')}
                />
                <TextField
                  name={`edu-year-${i}`}
                  label={t('panel.eduYear')}
                  value={String(q.year || '')}
                  onChange={put('year')}
                  error={tried ? errors[`year${i}`] : undefined}
                  locked={busy('education')}
                />
                <div>
                  <button
                    type="button"
                    className="ux4g-btn-text-primary ux4g-btn-s"
                    disabled={busy('education')}
                    onClick={() =>
                      setD((s) => ({
                        ...s,
                        education: s.education.filter((_, j) => j !== i) as Draft['education'],
                      }))
                    }
                  >
                    {t('panel.eduRemove', { n: i + 1 })}
                  </button>
                </div>
              </fieldset>
            );
          })}
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-s ux4g-mb-m"
            disabled={busy('education')}
            onClick={() =>
              setD((s) => ({
                ...s,
                education: [
                  ...s.education,
                  {
                    level: 'Graduate degree',
                    degree: '',
                    specialisation: '',
                    institute: '',
                    state: '',
                    country: 'India',
                    year: 0,
                  },
                ] as Draft['education'],
              }))
            }
          >
            {t('panel.eduAdd')}
          </button>
          <FileUpload
            name="pe-cert"
            label={t('panel.certificate')}
            required
            files={cert}
            onChange={setCert}
            error={tried ? errors.cert : undefined}
          />
        </>
      )}
    </Dialog>
  );
}

export function usePending() {
  return useQ('pendingChanges');
}
