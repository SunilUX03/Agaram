import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { features } from '@/config/features';
import { Icon } from '../Icon';
import type { FieldProps } from './Field';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const MAX_FILES = 5;
export const checkFile = (
  f: UploadedFile,
  maxMB: number,
  accept: string[],
): 'type' | 'size' | null => {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
  if (!accept.includes(ext === 'jpeg' ? 'jpg' : ext)) return 'type';
  return f.size > maxMB * 1024 * 1024 ? 'size' : null;
};

interface Props extends Omit<FieldProps, 'id'> {
  name: string;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  /** Community attachments keep their own 25 MB limit and accept any file. */
  maxMB?: number;
  accept?: string[] | 'any';
}

/** UX4G file upload. Checks type and size in the browser before accepting a file. Up to 5 per field. */
export function FileUpload({
  name,
  files,
  onChange,
  maxMB = features.uploads.maxSizeMB,
  accept = features.uploads.accept,
  ...f
}: Props) {
  const { t } = useTranslation();
  const id = `f-${name}`;
  const input = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string>();
  const error = f.error ?? localError;
  const help = f.help ?? t('ui.upload.hint', { size: maxMB });

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    setLocalError(undefined);
    for (const file of Array.from(list)) {
      const bad =
        accept === 'any'
          ? file.size > maxMB * 1024 * 1024
            ? 'size'
            : null
          : checkFile(file, maxMB, accept);
      if (bad === 'type') return setLocalError(t('ui.errors.fileType'));
      if (bad === 'size')
        return setLocalError(t('ui.errors.fileTooLarge', { size: `${maxMB} MB` }));
      if (next.length < MAX_FILES) next.push({ name: file.name, size: file.size, type: file.type });
    }
    onChange(next);
    if (input.current) input.current.value = '';
  };

  return (
    <div className="ux4g-mb-m">
      <span id={`${id}-label`} className="ux4g-label-l-default ux4g-text-neutral-secondary">
        {f.label}
        {f.required && <span aria-hidden="true"> *</span>}
        {f.required && <span className="sr-only"> ({t('ui.field.required')})</span>}
      </span>
      <div
        className={`ux4g-upload ${error ? 'ux4g-upload-state-error' : files.length ? 'ux4g-upload-state-uploaded' : 'ux4g-upload-state-default'} ux4g-mt-2xs`}
      >
        <div className="ux4g-upload-panel">
          <div className="ux4g-upload-content">
            <div className="ux4g-upload-option">
              <span className="ux4g-upload-icon-wrap">
                <i className="ux4g-icon-outlined ux4g-upload-icon" aria-hidden="true">
                  upload_file
                </i>
              </span>
              <div className="ux4g-upload-titleblock">
                <span
                  id={error ? `${id}-err` : `${id}-help`}
                  className={`ux4g-body-s-default ux4g-upload-hint${error ? ' ux4g-text-error' : ' ux4g-text-neutral-secondary'}`}
                >
                  {error ?? help}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="ux4g-btn-outline-primary ux4g-btn-m ux4g-upload-btn"
              aria-labelledby={`${id}-label ${id}-btn`}
              aria-describedby={error ? `${id}-err` : `${id}-help`}
              id={`${id}-btn`}
              onClick={() => input.current?.click()}
            >
              {t('ui.upload.choose')}
            </button>
          </div>
        </div>
        <input
          ref={input}
          id={id}
          name={name}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => add(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="plain-list ux4g-mt-xs">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="ux4g-d-flex ux4g-ai-center gap-s">
              <Icon name="file" size={18} />
              <span className="ux4g-body-m-default ux4g-flex-1">{file.name}</span>
              <button
                type="button"
                className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-s"
                aria-label={t('ui.upload.remove', { name: file.name })}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                <Icon name="close" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
