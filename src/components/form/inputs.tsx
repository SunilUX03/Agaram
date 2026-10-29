import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDMY, parseDMY } from '@/domain/dates';
import { features } from '@/config/features';
import { Icon } from '../Icon';
import { Field, describedBy, type FieldProps } from './Field';

type Base = Omit<FieldProps, 'id'> & { name: string; autoComplete?: string };

export function TextField({
  name,
  value,
  onChange,
  type = 'text',
  autoComplete,
  ...f
}: Base & { value: string; onChange: (v: string) => void; type?: string }) {
  const id = `f-${name}`;
  return (
    <Field id={id} {...f}>
      <input
        id={id}
        name={name}
        type={type}
        className="input"
        value={value}
        readOnly={f.locked}
        autoComplete={autoComplete}
        aria-required={f.required}
        aria-invalid={!!f.error}
        aria-describedby={describedBy(id, f)}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function PasswordField(
  p: Base & { value: string; onChange: (v: string) => void; showLabel: string; hideLabel: string },
) {
  const [show, setShow] = useState(false);
  const id = `f-${p.name}`;
  return (
    <Field id={id} label={p.label} help={p.help} error={p.error} required={p.required}>
      <div className="input-group">
        <input
          id={id}
          name={p.name}
          className="input"
          type={show ? 'text' : 'password'}
          value={p.value}
          autoComplete={p.autoComplete}
          aria-required={p.required}
          aria-invalid={!!p.error}
          aria-describedby={describedBy(id, p)}
          onChange={(e) => p.onChange(e.target.value)}
        />
        <button type="button" className="btn" aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? p.hideLabel : p.showLabel}
        </button>
      </div>
    </Field>
  );
}

export function TextArea({
  name,
  value,
  onChange,
  rows = 4,
  maxLength,
  ...f
}: Base & { value: string; onChange: (v: string) => void; rows?: number; maxLength?: number }) {
  const id = `f-${name}`;
  return (
    <Field id={id} {...f}>
      <textarea
        id={id}
        name={name}
        className="input"
        rows={rows}
        maxLength={maxLength}
        value={value}
        readOnly={f.locked}
        aria-required={f.required}
        aria-invalid={!!f.error}
        aria-describedby={describedBy(id, f)}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export interface Option {
  value: string;
  label: string;
}

/** Native select. With `searchable`, a type-ahead input with a list of matching options. */
export function Select({
  name,
  value,
  onChange,
  options,
  placeholder,
  searchable,
  ...f
}: Base & {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
}) {
  const id = `f-${name}`;
  if (searchable) {
    const label = options.find((o) => o.value === value)?.label ?? value;
    return (
      <Field id={id} {...f}>
        <input
          id={id}
          name={name}
          className="input"
          list={`${id}-list`}
          value={label}
          disabled={f.locked}
          aria-required={f.required}
          aria-invalid={!!f.error}
          aria-describedby={describedBy(id, f)}
          onChange={(e) =>
            onChange(options.find((o) => o.label === e.target.value)?.value ?? e.target.value)
          }
        />
        <datalist id={`${id}-list`}>
          {options.map((o) => (
            <option key={o.value} value={o.label} />
          ))}
        </datalist>
      </Field>
    );
  }
  return (
    <Field id={id} {...f}>
      <select
        id={id}
        name={name}
        className="input"
        value={value}
        disabled={f.locked}
        aria-required={f.required}
        aria-invalid={!!f.error}
        aria-describedby={describedBy(id, f)}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder ?? ''}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Text input that accepts dd/mm/yyyy. Validation happens in the form schema via `validateDate`. */
export function DatePicker({
  name,
  value,
  onChange,
  ...f
}: Base & { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const id = `f-${name}`;
  const error = f.error ?? (value && !parseDMY(value) ? t('ui.errors.badDate') : undefined);
  return (
    <Field id={id} {...f} error={error} help={f.help ?? t('ui.date.hint')}>
      <input
        id={id}
        name={name}
        className="input"
        inputMode="numeric"
        placeholder={t('ui.date.hint')}
        value={value}
        readOnly={f.locked}
        autoComplete="off"
        aria-required={f.required}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { help: f.help ?? 'x', error })}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function DateRangePicker({
  name,
  from,
  to,
  onChange,
  ...f
}: Base & { from: string; to: string; onChange: (r: { from: string; to: string }) => void }) {
  const { t } = useTranslation();
  const [a, b] = [parseDMY(from), parseDMY(to)];
  const endError = a && b && b < a ? t('ui.errors.endBeforeStart') : undefined;
  return (
    <fieldset className="range">
      <legend>
        {f.label}
        {f.required && <span aria-hidden="true"> *</span>}
      </legend>
      <DatePicker
        name={`${name}-from`}
        label={t('ui.date.from')}
        value={from}
        required={f.required}
        error={f.error}
        onChange={(v) => onChange({ from: v, to })}
      />
      <DatePicker
        name={`${name}-to`}
        label={t('ui.date.to')}
        value={to}
        required={f.required}
        error={endError}
        onChange={(v) => onChange({ from, to: v })}
      />
    </fieldset>
  );
}

export function Checkbox({
  name,
  label,
  checked,
  onChange,
  help,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  help?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className="check">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
      {help && (
        <div id={`${id}-help`} className="help">
          {help}
        </div>
      )}
    </div>
  );
}

export function RadioGroup({
  name,
  legend,
  value,
  onChange,
  options,
  required,
  error,
}: {
  name: string;
  legend: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  required?: boolean;
  error?: string;
}) {
  return (
    <fieldset className="radios" aria-describedby={error ? `${name}-err` : undefined}>
      <legend>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      {options.map((o) => (
        <label key={o.value} className="radio">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
      {error && (
        <div id={`${name}-err`} className="err">
          <Icon name="warning" size={14} /> {error}
        </div>
      )}
    </fieldset>
  );
}

export const todayDMY = () => formatDMY(new Date());
export const maxUploadMB = features.uploads.maxSizeMB;
