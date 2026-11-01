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
import { COUNTRIES, LEAVE_TYPES, toOptions } from '@/config/options';
import {
  DISTRICT_DEPARTMENTS,
  DISTRICT_DESIGNATIONS,
  POSTING_PLACES,
  SECRETARIAT_DESIGNATIONS,
  type FieldDef,
} from '@/config/requests';
import { DEPARTMENTS } from '@/config/options';
import { isFieldRequired, type Values } from '@/domain/requests';
import { useQ } from '@/data/hooks';
import { ownTargets } from '@/features/records/profileFields';
import { useCfg } from './cfg';

/** Resolves a field's option source. Posting lists depend on where the officer is posted. */
export function useOptions() {
  const career = useQ('career');
  const { t } = useTranslation('requests');
  return (ref: FieldDef['options'], values: Values): Option[] => {
    if (Array.isArray(ref)) return toOptions(ref);
    const secretariat = values.postingIn === 'Chennai' || values.postingIn === 'Delhi';
    switch (ref) {
      case 'leaveTypes':
        return toOptions(LEAVE_TYPES);
      case 'countries':
        return toOptions(COUNTRIES);
      case 'postingPlaces':
        return toOptions(POSTING_PLACES);
      case 'postingDepartments':
        return toOptions(secretariat ? DEPARTMENTS : DISTRICT_DEPARTMENTS);
      case 'postingDesignations':
        return toOptions(secretariat ? SECRETARIAT_DESIGNATIONS : DISTRICT_DESIGNATIONS);
      case 'ownEntries':
        return [
          ...toOptions(ownTargets(career.data).map((x) => x.label)),
          { value: 'Something else', label: t('form.somethingElse') },
        ];
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
  }
}
