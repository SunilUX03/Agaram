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

/** UX4G input container: label above, helper text, inline error linked by aria-describedby, required marker, locked state. */
export function Field({
  id,
  label,
  help,
  error,
  required,
  locked,
  children,
  size = 'lg',
  kind = 'input',
}: FieldProps & {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 'textarea' uses the UX4G textarea container for multi-line editors. */
  kind?: 'input' | 'textarea';
}) {
  const { t } = useTranslation();
  const state = error ? 'ux4g-input-error' : 'ux4g-input-default';
  const box =
    kind === 'textarea'
      ? `ux4g-textarea-container ux4g-textarea-m ${error ? 'ux4g-textarea-error' : 'ux4g-textarea-default'}`
      : `ux4g-input-container ux4g-input-${size === 'lg' ? 'l' : size === 'md' ? 'm' : size === 'sm' ? 's' : 'xl'} ${state}`;
  return (
    <div className={`${box}${locked ? ' ux4g-input-is-disabled' : ''} field-wrap`}>
      <label
        htmlFor={id}
        id={`${id}-label`}
        className={
          kind === 'textarea'
            ? 'ux4g-label-l-default ux4g-text-neutral-secondary'
            : 'ux4g-label-m-default'
        }
      >
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
      <div className={kind === 'textarea' ? 'ux4g-textarea' : 'ux4g-input'}>{children}</div>
      {help && !error && (
        <span id={`${id}-help`} className="ux4g-input-helper">
          <span className="ux4g-input-helper-text">{help}</span>
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="ux4g-input-helper">
          <i className="ux4g-icon-outlined ux4g-input-helper-icon" aria-hidden="true">
            warning
          </i>
          <span className="ux4g-input-helper-text">{error}</span>
        </span>
      )}
    </div>
  );
}

export const describedBy = (id: string, p: { help?: string; error?: string }) =>
  p.error ? `${id}-err` : p.help ? `${id}-help` : undefined;
