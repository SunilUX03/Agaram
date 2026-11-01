import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import type { UploadedFile } from '@/components/form/FileUpload';
import { getRequestType } from '@/config/requests';
import { useMut, useQ } from '@/data/hooks';
import { validateDetails, validateDocuments, type Files, type Values } from '@/domain/requests';
import { RequestFields } from '../requests/RequestFields';
import { ownTargets } from './profileFields';

/** "Report a correction" and Career "Report an error": one dialog, the `correction` request type. */
export function CorrectionDialog({
  initial,
  onClose,
}: {
  /** The label of the field or entry to start with, for example "Profile: Name". */
  initial?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('records');
  const common = useTranslation().t;
  const toast = useToast();
  const def = getRequestType('correction')!;
  const career = useQ('career');
  const save = useMut('saveRequest');
  const [values, setValues] = useState<Values>({ field: initial ?? '' });
  const [files, setFiles] = useState<Files>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const targets = useMemo(() => ownTargets(career.data), [career.data]);

  const set = (name: string, v: unknown) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== name)));
  };
  const send = async () => {
    const all = [
      ...validateDetails(def, values, { booked: [], today: new Date() }),
      ...validateDocuments(def, values, files),
    ];
    if (all.length) {
      const map: Record<string, string> = {};
      all.forEach((e) => (map[e.field] ??= common(e.key, { ...e.params })));
      return setErrors(map);
    }
    const target = targets.find((x) => x.label === values.field);
    try {
      await save.mutateAsync([
        {
          type: 'correction',
          values: { ...values, targetKind: target?.kind, targetKey: target?.key },
          attachments: Object.values(files).flat(),
        },
      ]);
      toast(t('correction.sent'));
      onClose();
    } catch {
      toast(t('correction.failed'));
    }
  };
  return (
    <Dialog
      title={t('correction.title')}
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
      <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-mb-m">
        {t('correction.intro')}
      </p>
      <RequestFields
        def={def}
        values={values}
        errors={errors}
        set={set}
        files={files}
        setFiles={(n: string, f: UploadedFile[]) => setFiles((s) => ({ ...s, [n]: f }))}
      />
    </Dialog>
  );
}
