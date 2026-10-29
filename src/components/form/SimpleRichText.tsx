import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '@/domain/sanitize';
import { Field, describedBy, type FieldProps } from './Field';

interface Props extends Omit<FieldProps, 'id'> {
  name: string;
  value: string;
  onChange: (html: string) => void;
}

/** Bold, italic, bulleted list and link. Output is always sanitised. */
export function SimpleRichText({ name, value, onChange, ...f }: Props) {
  const { t } = useTranslation();
  const id = `f-${name}`;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = sanitizeHtml(value);
    // Only sync from outside when the value differs from what the editor holds.
  }, [value]);
  const cmd = (c: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand?.(c, false, arg);
    onChange(sanitizeHtml(ref.current?.innerHTML ?? ''));
  };
  return (
    <Field id={id} {...f}>
      <div className="rich">
        <div className="rich-bar" role="toolbar" aria-label={t('ui.rich.editor')}>
          <button type="button" className="btn" onClick={() => cmd('bold')}>
            <b>B</b>
            <span className="sr-only">{t('ui.rich.bold')}</span>
          </button>
          <button type="button" className="btn" onClick={() => cmd('italic')}>
            <i>I</i>
            <span className="sr-only">{t('ui.rich.italic')}</span>
          </button>
          <button type="button" className="btn" onClick={() => cmd('insertUnorderedList')}>
            • <span className="sr-only">{t('ui.rich.list')}</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const u = prompt('https://');
              if (u) cmd('createLink', u);
            }}
          >
            {t('ui.rich.link')}
          </button>
        </div>
        <div
          id={id}
          ref={ref}
          className="input rich-area"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${id}-label`}
          aria-required={f.required}
          aria-invalid={!!f.error}
          aria-describedby={describedBy(id, f)}
          suppressContentEditableWarning
          onInput={() => onChange(sanitizeHtml(ref.current?.innerHTML ?? ''))}
        />
      </div>
    </Field>
  );
}
