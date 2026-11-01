import { REQUEST_TYPES, type DocDef, type FieldDef, type RequestTypeDef } from '@/config/requests';
import { parseDMY, rangesOverlap } from './dates';
import type { RequestStatus } from './status';
import type { LeaveBalance, Mode, Request } from './types';

export type Values = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Files = Record<string, { name: string; size: number; type: string }[]>;

/** Allowed status moves (v2, section 6). The super admin's moves are simulated by the demo controls. */
export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'returned', 'rejected', 'withdrawn'],
  returned: ['submitted'],
  approved: [],
  rejected: [],
  withdrawn: [],
};
export const canMove = (from: RequestStatus, to: RequestStatus) => TRANSITIONS[from].includes(to);
export const canWithdraw = (s: RequestStatus) => TRANSITIONS[s].includes('withdrawn');

export const generateTitle = (type: RequestTypeDef, values: Values) => {
  try {
    const out = type.title(values).replace(/,\s*$/, '').trim();
    return !out || /undefined|NaN|null/.test(out) ? type.cardName : out;
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
  !!d.required || matchesWhen(d.requiredWhen, values) || !!d.needed?.(values);

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
  mode?: Mode;
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
    if (type.rules?.includes('balanceWarning') && ctx.balance && ctx.mode !== 'past') {
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
  mode?: Mode,
  today: Date = new Date(),
): FieldError[] {
  const errors = type.documents
    .filter((d) => isDocRequired(d, values) && !(files[d.name]?.length > 0))
    .map((d) => ({
      field: `doc.${d.name}`,
      key: 'ui.errors.docRequired',
      params: { label: d.label },
    }));
  if (proofRequired(type, values, mode, today) && !(files.proof?.length > 0))
    errors.push({
      field: 'doc.proof',
      key: 'ui.errors.docRequired',
      params: { label: 'Scan of the paper record or order' },
    });
  return errors;
}

const isPastDate = (text: string | undefined, today: Date) => {
  const d = text ? parseDMY(text) : null;
  const t = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return !!d && d < t;
};
/** A proof file ("Scan of the paper record or order") is required for past entries. */
export function proofRequired(
  type: RequestTypeDef,
  values: Values,
  mode: Mode | undefined,
  today: Date = new Date(),
): boolean {
  if (mode && type.proofRequiredFor?.includes(mode)) return true;
  // An LTC trip that has already ended is a paper record.
  return type.key === 'ltc' && isPastDate((values.dates as { to?: string } | undefined)?.to, today);
}
/** Which source a request carries: paper for past entries and past LTC trips. */
export function sourceOf(
  type: RequestTypeDef,
  values: Values,
  mode: Mode | undefined,
): 'portal' | 'paper' {
  return mode === 'past' || proofRequired(type, values, mode) ? 'paper' : 'portal';
}
/** Warnings that do not block sending (past leave that takes the balance below zero). */
export function pastWarnings(
  type: RequestTypeDef,
  values: Values,
  balance: LeaveBalance | undefined,
  mode: Mode | undefined,
): string[] {
  if (mode !== 'past' || !type.rules?.includes('balanceWarning') || !balance) return [];
  const key = balanceKey(values.type);
  const days = dayCount(values.dates as { from?: string; to?: string });
  return key && days > remaining(balance, key) ? ['ui.errors.pastBalance'] : [];
}

/** True when an Apply form is given a date that has already passed. */
export function pastDateNotice(values: Values, mode: Mode | undefined, today: Date): boolean {
  if (mode !== 'apply') return false;
  const r = (values.dates ?? {}) as { from?: string };
  return isPastDate(r.from, today);
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
