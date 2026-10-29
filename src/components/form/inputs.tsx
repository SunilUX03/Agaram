import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDMY, parseDMY } from '@/domain/dates';
import { features } from '@/config/features';
import { useOutsideClick } from '../hooks';
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
        className="ux4g-input-input"
        id={id}
        name={name}
        type={type}
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
      <>
        <input
          className="ux4g-input-input"
          id={id}
          name={p.name}
          type={show ? 'text' : 'password'}
          value={p.value}
          autoComplete={p.autoComplete}
          aria-required={p.required}
          aria-invalid={!!p.error}
          aria-describedby={describedBy(id, p)}
          onChange={(e) => p.onChange(e.target.value)}
        />
        <button
          type="button"
          className="ux4g-btn-text-primary ux4g-btn-xs"
          aria-pressed={show}
          onClick={() => setShow(!show)}
        >
          {show ? p.hideLabel : p.showLabel}
        </button>
      </>
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
  const { t } = useTranslation();
  const id = `f-${name}`;
  return (
    <div
      className={`ux4g-textarea-container ux4g-textarea-m ${f.error ? 'ux4g-textarea-error' : 'ux4g-textarea-default'} field-wrap`}
    >
      <label className="ux4g-label-m-default" htmlFor={id} id={`${id}-label`}>
        {f.label}
        {f.required && <span aria-hidden="true"> *</span>}
        {f.required && <span className="sr-only"> ({t('ui.field.required')})</span>}
      </label>
      <div className="ux4g-textarea">
        <textarea
          id={id}
          name={name}
          className="ux4g-textarea-input"
          rows={rows}
          maxLength={maxLength}
          value={value}
          readOnly={f.locked}
          aria-required={f.required}
          aria-invalid={!!f.error}
          aria-describedby={describedBy(id, f)}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {(f.help || f.error || maxLength) && (
        <div className="ux4g-textarea-helper">
          {(f.help || f.error) && (
            <span id={f.error ? `${id}-err` : `${id}-help`} className="ux4g-textarea-helper-text">
              {f.error ?? f.help}
            </span>
          )}
          {maxLength && (
            <span className="ux4g-textarea-counter">
              {value.length} / {maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
}

/**
 * UX4G dropdown (single selection) wired as an accessible listbox: Enter, Space and arrows open and move,
 * Escape closes, typing a letter jumps to a match. With `searchable` it becomes a UX4G combobox you can type into.
 */
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
  const { t } = useTranslation();
  const id = `f-${name}`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  useOutsideClick(root, () => setOpen(false), open);
  const selected = options.find((o) => o.value === value);
  const shown =
    searchable && query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
  const all = [{ value: '', label: placeholder ?? '' }, ...shown].filter(
    (_o, i) => i > 0 || !searchable,
  );
  const state = f.error ? 'error' : 'default';

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
    root.current?.querySelector<HTMLElement>('button, input')?.focus();
  };
  const openAt = () => {
    setActive(
      Math.max(
        0,
        all.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return void (open && (e.stopPropagation(), setOpen(false)));
    if (
      !open &&
      ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) &&
      !(searchable && (e.key === ' ' || e.key === 'Enter'))
    ) {
      e.preventDefault();
      return openAt();
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, all.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(all.length - 1);
    } else if (e.key === 'Enter' || (e.key === ' ' && !searchable)) {
      e.preventDefault();
      if (all[active]) pick(all[active].value);
    } else if (!searchable && e.key.length === 1) {
      const i = all.findIndex(
        (o, k) => k > 0 && o.label.toLowerCase().startsWith(e.key.toLowerCase()),
      );
      if (i >= 0) setActive(i);
    }
  };
  useEffect(() => {
    if (open)
      menu.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const listId = `${id}-list`;
  return (
    <div
      className={`field-wrap ux4g-dropdown ux4g-dropdown-selection ux4g-dropdown-single ux4g-dropdown-m ux4g-dropdown-${state}${open ? ' is-open' : ''}`}
      ref={root}
      onKeyDown={key}
    >
      <label htmlFor={id} id={`${id}-label`} className="ux4g-label-m-strong">
        {f.label}
        {f.required && <span aria-hidden="true"> *</span>}
        {f.required && <span className="sr-only"> ({t('ui.field.required')})</span>}
      </label>
      {searchable ? (
        <div className="ux4g-combobox ux4g-combobox-single ux4g-combobox-m ux4g-combobox-default">
          <input
            className="ux4g-input-input"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-required={f.required}
            aria-invalid={!!f.error}
            aria-describedby={describedBy(id, f)}
            disabled={f.locked}
            value={open ? query : (selected?.label ?? '')}
            placeholder={selected?.label ?? placeholder}
            autoComplete="off"
            onFocus={openAt}
            onChange={(e) => (setQuery(e.target.value), setOpen(true), setActive(0))}
          />
        </div>
      ) : (
        <button
          type="button"
          id={id}
          className="ux4g-dropdown-control"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${id}-label ${id}`}
          aria-invalid={!!f.error}
          aria-describedby={describedBy(id, f)}
          disabled={f.locked}
          onClick={() => (open ? setOpen(false) : openAt())}
        >
          <span className="ux4g-dropdown-value">{selected?.label ?? placeholder ?? ''}</span>
          <i className="ux4g-icon-outlined ux4g-dropdown-caret" aria-hidden="true">
            expand_more
          </i>
        </button>
      )}
      <ul
        id={listId}
        ref={menu}
        role="listbox"
        aria-labelledby={`${id}-label`}
        className="ux4g-dropdown-menu select-menu"
      >
        {all.map((o, i) => (
          <li
            key={o.value || '__none'}
            role="option"
            aria-selected={o.value === value}
            aria-label={o.label ? undefined : t('ui.field.noSelection')}
            data-active={i === active}
            className={`ux4g-dropdown-option ux4g-dropdown-single-option${o.value === value ? ' is-selected' : ''}${i === active ? ' is-active' : ''}`}
            onMouseDown={(e) => (e.preventDefault(), pick(o.value))}
            onMouseEnter={() => setActive(i)}
          >
            {o.label || '\u00a0'}
          </li>
        ))}
        {all.length === 0 && (
          <li className="ux4g-dropdown-option" aria-disabled="true">
            {t('ui.empty.default')}
          </li>
        )}
      </ul>
      {(f.error || f.help) && (
        <span id={f.error ? `${id}-err` : `${id}-help`} className="ux4g-dropdown-help">
          {f.error ?? f.help}
        </span>
      )}
    </div>
  );
}

/** Text input that accepts dd/mm/yyyy (UX4G input). Validation also happens in the form schema. */
export function DatePicker({
  name,
  value,
  onChange,
  ...f
}: Base & { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const id = `f-${name}`;
  const error = f.error ?? (value && !parseDMY(value) ? t('ui.errors.badDate') : undefined);
  const help = f.help ?? t('ui.date.hint');
  return (
    <Field id={id} {...f} error={error} help={help}>
      <input
        className="ux4g-input-input"
        id={id}
        name={name}
        inputMode="numeric"
        placeholder={t('ui.date.hint')}
        value={value}
        readOnly={f.locked}
        autoComplete="off"
        aria-required={f.required}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { help, error })}
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
  toError,
  ...f
}: Base & {
  from: string;
  to: string;
  onChange: (r: { from: string; to: string }) => void;
  toError?: string;
}) {
  const { t } = useTranslation();
  const [a, b] = [parseDMY(from), parseDMY(to)];
  const endError = a && b && b < a ? t('ui.errors.endBeforeStart') : undefined;
  return (
    <fieldset className="range">
      <legend className="ux4g-label-m-strong">
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
        error={toError ?? endError}
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
    <div className="ux4g-mb-s">
      <label className="ux4g-checkbox ux4g-checkbox-md" htmlFor={id}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className="ux4g-checkbox-input"
          checked={checked}
          aria-describedby={help ? `${id}-help` : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="ux4g-radio-control">
          <span className="ux4g-checkmark"></span>
        </span>
        <span className="ux4g-checkbox-content">{label}</span>
      </label>
      {help && (
        <div id={`${id}-help`} className="ux4g-body-s-default ux4g-text-neutral-secondary">
          {help}
        </div>
      )}
    </div>
  );
}

/** UX4G switch for on/off settings. */
export function Switch({
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
    <div className="ux4g-mb-s">
      <label className="ux4g-switch ux4g-switch-md" htmlFor={id}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className="ux4g-switch-input"
          role="switch"
          checked={checked}
          aria-checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="ux4g-switch-control">
          <span className="ux4g-switch-track">
            <span className="ux4g-switch-thumb"></span>
          </span>
        </span>
        <span className="ux4g-switch-content">{label}</span>
      </label>
      {help && <div className="ux4g-body-s-default ux4g-text-neutral-secondary">{help}</div>}
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
    <fieldset className="ux4g-mb-m" aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="ux4g-label-m-strong ux4g-mb-xs">
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={`ux4g-radio ux4g-radio-md${error ? ' ux4g-radio-error' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            className="ux4g-radio-input"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className="ux4g-radio-control">
            <span className="ux4g-radiomark"></span>
          </span>
          <span className="ux4g-radio-content">{o.label}</span>
        </label>
      ))}
      {error && (
        <div id={`${name}-err`} className="ux4g-input-helper">
          <span className="ux4g-input-helper-text">{error}</span>
        </div>
      )}
    </fieldset>
  );
}

export const todayDMY = () => formatDMY(new Date());
export const maxUploadMB = features.uploads.maxSizeMB;
