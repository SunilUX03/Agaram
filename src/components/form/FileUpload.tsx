import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { features } from '@/config/features';
import { Icon } from '../Icon';
import { Field, describedBy, type FieldProps } from './Field';

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

/** Checks type and size in the browser before accepting a file. Up to 5 per field. */
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
    <Field id={id} {...f} error={error} help={f.help ?? t('ui.upload.hint', { size: maxMB })}>
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        className="input"
        multiple
        aria-describedby={describedBy(id, { help: 'x', error })}
        aria-invalid={!!error}
        onChange={(e) => add(e.target.files)}
      />
      {files.length > 0 && (
        <ul className="files">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`}>
              <Icon name="file" size={16} />
              <span>{file.name}</span>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                aria-label={t('ui.upload.remove', { name: file.name })}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                <Icon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}
