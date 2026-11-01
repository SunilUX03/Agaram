import { useTranslation } from 'react-i18next';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import type { RequestTypeDef } from '@/config/requests';
import { isDocRequired, proofRequired, type Files, type Values } from '@/domain/requests';
import type { Mode } from '@/domain/types';
import { DynamicField, useOptions } from './DynamicField';

/** The fields and document uploads of one request type, from its config. Used by every form in the portal. */
export function RequestFields({
  def,
  values,
  errors,
  set,
  files,
  setFiles,
  mode,
  skip = [],
}: {
  def: RequestTypeDef;
  values: Values;
  errors: Record<string, string>;
  set: (name: string, v: unknown) => void;
  files: Files;
  setFiles: (name: string, f: UploadedFile[]) => void;
  mode?: Mode;
  /** Field names rendered elsewhere. */
  skip?: string[];
}) {
  const { t } = useTranslation('requests');
  const options = useOptions();
  const proof = proofRequired(def, values, mode);
  return (
    <>
      <div className="form-grid">
        {def.fields
          .filter((f) => !skip.includes(f.name))
          .map((f) => (
            <div key={f.name} className={f.full || f.kind === 'dateRange' ? 'full' : undefined}>
              <DynamicField
                type={def.key}
                def={f}
                values={values}
                errors={errors}
                set={set}
                options={options(f.options, values)}
              />
            </div>
          ))}
      </div>
      {def.documents.map((d) => (
        <FileUpload
          key={d.name}
          name={`${def.key}-${d.name}`}
          label={d.label}
          required={isDocRequired(d, values)}
          files={files[d.name] ?? []}
          onChange={(f) => setFiles(d.name, f)}
          error={errors[`doc.${d.name}`]}
        />
      ))}
      {proof && (
        <FileUpload
          name={`${def.key}-proof`}
          label={t('form.proof')}
          required
          files={files.proof ?? []}
          onChange={(f) => setFiles('proof', f)}
          error={errors['doc.proof']}
        />
      )}
    </>
  );
}
