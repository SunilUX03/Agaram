import { REQUEST_TYPES, type DocDef, type FieldDef, type RequestTypeDef } from '@/config/requests';
import { parseDMY, rangesOverlap } from './dates';
import type { RequestStatus } from './status';
import type { LeaveBalance, Request } from './types';

export type Values = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Files = Record<string, { name: string; size: number }[]>;

/** Allowed status moves (brief, section 8). */
export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ['submitted'],
  submitted: ['with-desk', 'withdrawn'],
  'with-desk': ['ready-for-approval', 'withdrawn'],
  'ready-for-approval': ['approved', 'rejected', 'returned', 'withdrawn'],
  returned: ['submitted'],
  approved: [],
  rejected: [],
  withdrawn: [],
};
export const canMove = (from: RequestStatus, to: RequestStatus) => TRANSITIONS[from].includes(to);
export const canWithdraw = (s: RequestStatus) => TRANSITIONS[s].includes('withdrawn');

export const generateTitle = (type: RequestTypeDef, values: Values) => {
  try {
    return type.title(values).replace(/,\s*$/, '');
  } catch {
    return type.cardName;
  }
};

export function matchesWhen(
  when: Record<string, string | string[]> | undefined,
  values: Values,
): boolean {
  if (!when) return false;
  return Object.entries(when).every(([k, v]) =>
    (Array.isArray(v) ? v : [v]).includes(String(values[k] ?? '')),
  );
}
export const isFieldRequired = (f: FieldDef, values: Values) =>
  !!f.required || matchesWhen(f.requiredWhen, values);
export const isDocRequired = (d: DocDef, values: Values) =>
  !!d.required || matchesWhen(d.requiredWhen, values);

/** Number of calendar days in an inclusive dd/mm/yyyy range, or 0 if invalid. */
export function dayCount(r?: { from?: string; to?: string }): number {
  const a = r?.from ? parseDMY(r.from) : null;
  const b = r?.to ? parseDMY(r.to) : null;
  return a && b && b >= a ? Math.round((b.getTime() - a.getTime()) / 86400000) + 1 : 0;
}

/** Which balance a leave type draws on, if any. */
export function balanceKey(type?: string): keyof LeaveBalance | null {
  if (!type) return null;
  if (type === 'Casual leave') return 'cl';
  if (type === 'Restricted holiday') return 'rh';
  if (type === 'Earned leave') return 'el';
  if (type.startsWith('Half-pay')) return 'hpl';
  return null;
}
export const remaining = (b: LeaveBalance, k: keyof LeaveBalance) => b[k].allowed - b[k].used;

export interface Booked {
  title: string;
  from: string; // dd/mm/yyyy
  to: string;
}
/** Approved or in-review leave, tours and foreign visits, for the overlap check. */
export function findOverlap(
  range: { from?: string; to?: string } | undefined,
  booked: Booked[],
): Booked | undefined {
  const a = range?.from ? parseDMY(range.from) : null;
  const b = range?.to ? parseDMY(range.to) : null;
  if (!a || !b) return undefined;
  return booked.find((x) => {
    const [c, d] = [parseDMY(x.from), parseDMY(x.to)];
    return c && d && rangesOverlap(a, b, c, d);
  });
}

export interface ValidationContext {
  booked: Booked[];
  balance?: LeaveBalance;
  today: Date;
  /** Request id being edited, so it does not overlap with itself. */
  files: Files;
}
/** `key` is a common.json key; `params` fill its placeholders. */
export interface FieldError {
  field: string;
  key: string;
  params?: Record<string, string | number>;
}

/** Validates the Details step. Messages are the exact copy from the brief. */
export function validateDetails(
  type: RequestTypeDef,
  values: Values,
  ctx: Omit<ValidationContext, 'files'>,
): FieldError[] {
  const errors: FieldError[] = [];
  const req = 'ui.errors.required';
  for (const f of type.fields) {
    const v = values[f.name];
    if (f.kind === 'dateRange') {
      const r = (v ?? {}) as { from?: string; to?: string };
      const [a, b] = [r.from ? parseDMY(r.from) : null, r.to ? parseDMY(r.to) : null];
      if (isFieldRequired(f, values) && !r.from) errors.push({ field: `${f.name}.from`, key: req });
      else if (r.from && !a) errors.push({ field: `${f.name}.from`, key: 'ui.errors.badDate' });
      if (isFieldRequired(f, values) && !r.to) errors.push({ field: `${f.name}.to`, key: req });
      else if (r.to && !b) errors.push({ field: `${f.name}.to`, key: 'ui.errors.badDate' });
      if (a && b && b < a) errors.push({ field: `${f.name}.to`, key: 'ui.errors.endBeforeStart' });
      continue;
    }
    const empty = v === undefined || v === null || String(v).trim() === '';
    if (isFieldRequired(f, values) && empty) {
      errors.push({ field: f.name, key: req });
      continue;
    }
    if (empty) continue;
    if (f.kind === 'date' && !parseDMY(String(v)))
      errors.push({ field: f.name, key: 'ui.errors.badDate' });
    if (f.kind === 'amount' && !(Number(String(v).replace(/,/g, '')) > 0))
      errors.push({ field: f.name, key: 'ui.errors.amount' });
  }
  const range = values.dates as { from?: string; to?: string } | undefined;
  if (errors.length === 0 && range) {
    if (type.rules?.includes('noOverlap')) {
      const hit = findOverlap(range, ctx.booked);
      if (hit)
        errors.push({
          field: 'dates.from',
          key: 'ui.errors.overlap',
          params: { title: hit.title },
        });
    }
    if (type.rules?.includes('balanceWarning') && ctx.balance) {
      const key = balanceKey(values.type);
      const days = dayCount(range);
      if (
        (key === 'cl' || key === 'el') &&
        days > remaining(ctx.balance, key) &&
        !String(values.remarks ?? '').trim()
      ) {
        errors.push({
          field: 'remarks',
          key: 'ui.errors.balance',
          params: { n: remaining(ctx.balance, key) },
        });
      }
    }
  }
  return errors;
}

export function validateDocuments(
  type: RequestTypeDef,
  values: Values,
  files: Files,
): FieldError[] {
  return type.documents
    .filter((d) => isDocRequired(d, values) && !(files[d.name]?.length > 0))
    .map((d) => ({
      field: `doc.${d.name}`,
      key: 'ui.errors.docRequired',
      params: { label: d.label },
    }));
}

/** True when a past date is used in a type that does not allow it. */
export function pastDateNotice(
  type: RequestTypeDef,
  values: Values,
  today: Date,
): 'blocked' | 'notice' | null {
  const r = (values.dates ?? {}) as { from?: string };
  const a = r.from ? parseDMY(r.from) : null;
  if (!a) return null;
  const t = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (a >= t) return null;
  return type.allowPast ? 'notice' : 'blocked';
}

/** Summary lines for the Review step and the request page. */
export function summaryRows(
  type: RequestTypeDef,
  values: Values,
): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const f of type.fields) {
    const v = values[f.name];
    if (v === undefined || v === '' || v === null) continue;
    if (f.kind === 'dateRange') {
      const r = v as { from?: string; to?: string };
      if (r.from || r.to) out.push({ label: f.label, value: `${r.from ?? ''} to ${r.to ?? ''}` });
    } else if (f.kind === 'repeat') {
      const rows = (v as Values[]).filter((r) => Object.values(r).some(Boolean));
      if (rows.length)
        out.push({
          label: f.label,
          value: rows.map((r) => Object.values(r).filter(Boolean).join(', ')).join('; '),
        });
    } else if (f.kind === 'amount') {
      out.push({
        label: f.label,
        value: `₹${Number(String(v).replace(/,/g, '')).toLocaleString('en-IN')}`,
      });
    } else out.push({ label: f.label, value: String(v) });
  }
  return out;
}

export const typeOf = (r: Pick<Request, 'type'>) => REQUEST_TYPES.find((t) => t.key === r.type);

/** Message key for the "next step" line shown on My requests. */
export const nextStepKey = (status: RequestStatus) => `requests:next.${status}`;
