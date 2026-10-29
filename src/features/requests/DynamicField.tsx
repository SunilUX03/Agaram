import { useTranslation } from 'react-i18next';
import {
  DateRangePicker,
  DatePicker,
  RadioGroup,
  Select,
  TextArea,
  TextField,
  type Option,
} from '@/components/form/inputs';
import { COUNTRIES, LEAVE_TYPES, STATE_DISTRICTS, toOptions } from '@/config/options';
import { UPDATE_FIELDS, type FieldDef } from '@/config/requests';
import { isFieldRequired, type Values } from '@/domain/requests';
import { useQ } from '@/data/hooks';
import { useCfg } from './cfg';

/** Resolves a field's option source. "Which entry is wrong" lists the officer's own records. */
export function useOptions() {
  const career = useQ('career'),
    leaves = useQ('leaves'),
    trainings = useQ('trainings'),
    benefits = useQ('benefits'),
    travels = useQ('travels');
  const { t } = useTranslation('requests');
  return (ref: FieldDef['options'], values: Values, name: string): Option[] => {
    if (Array.isArray(ref)) return toOptions(ref);
    switch (ref) {
      case 'leaveTypes':
        return toOptions(LEAVE_TYPES);
      case 'countries':
        return toOptions(COUNTRIES);
      case 'states':
        return toOptions(Object.keys(STATE_DISTRICTS));
      case 'districts':
        return toOptions(
          STATE_DISTRICTS[
            String(values[name === 'propertyDistrict' ? 'propertyState' : 'state'] ?? '')
          ] ?? [],
        );
      case 'updateFields':
        return toOptions(UPDATE_FIELDS[String(values.section ?? '')] ?? []);
      case 'ownEntries': {
        const own = [
          ...(career.data ?? []).map(
            (x) => `Career: ${x.designation}, ${x.postingIn ?? x.department}`,
          ),
          ...(leaves.data ?? []).slice(0, 6).map((x) => `Leave: ${x.type}, ${x.from}`),
          ...(trainings.data ?? []).map((x) => `Training: ${x.type}`),
          ...(travels.data ?? []).map((x) => `Travel: ${x.place}, ${x.from}`),
          ...(benefits.data ?? []).map((x) => `Benefits: ${x.summary}`),
        ];
        return [...toOptions(own), { value: 'Something else', label: t('form.somethingElse') }];
      }
      default:
        return [];
    }
  };
}

interface Props {
  type: string;
  def: FieldDef;
  values: Values;
  errors: Record<string, string>;
  set: (name: string, v: unknown) => void;
  options: Option[];
}

const digits = (s: string) => s.replace(/[^\d]/g, '');
const group = (s: string) => (s ? Number(s).toLocaleString('en-IN') : '');

export function DynamicField({ type, def, values, errors, set, options }: Props) {
  const { t } = useTranslation('requests');
  const c = useCfg();
  const label = c(type, `f.${def.name}`, def.label);
  const common = {
    name: `${type}-${def.name}`,
    label,
    help: def.help ? c(type, `h.${def.name}`, def.help) : undefined,
    required: isFieldRequired(def, values),
    error: errors[def.name],
  };
  const v = values[def.name];
  switch (def.kind) {
    case 'text':
      return <TextField {...common} value={v ?? ''} onChange={(x) => set(def.name, x)} />;
    case 'textarea':
      return <TextArea {...common} value={v ?? ''} onChange={(x) => set(def.name, x)} />;
    case 'number':
      return (
        <TextField {...common} type="number" value={v ?? ''} onChange={(x) => set(def.name, x)} />
      );
    case 'amount':
      return (
        <TextField
          {...common}
          value={group(digits(String(v ?? '')))}
          onChange={(x) => set(def.name, digits(x))}
        />
      );
    case 'date':
      return <DatePicker {...common} value={v ?? ''} onChange={(x) => set(def.name, x)} />;
    case 'dateRange': {
      const r = (v ?? { from: '', to: '' }) as { from: string; to: string };
      return (
        <DateRangePicker
          {...common}
          error={errors[`${def.name}.from`]}
          toError={errors[`${def.name}.to`]}
          from={r.from}
          to={r.to}
          onChange={(x) => set(def.name, x)}
        />
      );
    }
    case 'radio':
      return (
        <RadioGroup
          name={common.name}
          legend={label}
          required={common.required}
          error={common.error}
          value={v ?? ''}
          onChange={(x) => set(def.name, x)}
          options={options}
        />
      );
    case 'select':
      return (
        <Select
          {...common}
          searchable={def.searchable}
          placeholder={t('form.select')}
          value={v ?? ''}
          onChange={(x) => set(def.name, x)}
          options={options}
        />
      );
    case 'repeat': {
      const rows = ((v as Values[] | undefined) ?? [{}]) as Values[];
      const put = (next: Values[]) => set(def.name, next);
      return (
        <fieldset>
          <legend>{label}</legend>
          {rows.map((row, i) => (
            <div key={i} className="form-grid repeat-row">
              {def.sub!.map((sf) => (
                <TextField
                  key={sf.name}
                  name={`${type}-${def.name}-${i}-${sf.name}`}
                  label={c(type, `f.${def.name}.${sf.name}`, sf.label)}
                  value={row[sf.name] ?? ''}
                  onChange={(x) => put(rows.map((r, j) => (j === i ? { ...r, [sf.name]: x } : r)))}
                />
              ))}
              {rows.length > 1 && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => put(rows.filter((_, j) => j !== i))}
                >
                  {t('form.remove')}
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-sm" onClick={() => put([...rows, {}])}>
            {def.addLabel ? c(type, `add.${def.name}`, def.addLabel) : t('form.addAnother')}
          </button>
        </fieldset>
      );
    }
  }
}
