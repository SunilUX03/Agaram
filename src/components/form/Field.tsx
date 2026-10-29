import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon';

export interface FieldProps {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  locked?: boolean;
}

/** Label above, help text, inline error linked by aria-describedby, required marker, locked state. */
export function Field({
  id,
  label,
  help,
  error,
  required,
  locked,
  children,
}: FieldProps & { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id} id={`${id}-label`}>
        {label}
        {required && (
          <span className="req">
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> ({t('ui.field.required')})</span>
          </span>
        )}
        {locked && (
          <span className="lock" title={t('ui.field.locked')}>
            <Icon name="lock" size={14} label={t('ui.field.locked')} />
          </span>
        )}
      </label>
      {help && (
        <div id={`${id}-help`} className="help">
          {help}
        </div>
      )}
      {children}
      {error && (
        <div id={`${id}-err`} className="err">
          <Icon name="warning" size={14} /> {error}
        </div>
      )}
    </div>
  );
}

export const describedBy = (id: string, p: { help?: string; error?: string }) =>
  [p.help && `${id}-help`, p.error && `${id}-err`].filter(Boolean).join(' ') || undefined;
