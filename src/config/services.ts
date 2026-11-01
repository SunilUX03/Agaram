import { features } from './features';
import { formatINR } from '@/domain/dates';
import type { LeaveBalance } from '@/domain/types';

export type ColumnKind = 'text' | 'date' | 'inr' | 'status' | 'source' | 'readonly';
export interface ServiceColumn {
  key: string;
  header: string;
  kind?: ColumnKind;
  /** The cell text for `text`, `date`, `inr` and `readonly` columns. Defaults to row[key]. */
  value?: (row: any) => string | number | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  mobile?: 'title' | 'hide';
}
export interface SummaryContext {
  balance?: LeaveBalance;
  year: number;
}
/** What every service card page needs. A new card is one entry here plus a form config in config/requests.ts. */
export interface ServiceCardDef {
  key: string;
  title: string;
  /** Page header lines (headline | tagline | main button). */
  headline: string;
  tagline: string;
  icon: string;
  /** Key of the form config in the request engine (config/requests.ts). */
  formKey: string;
  main: string;
  /** Label of the outline "Add a past ..." button, when the card supports past records. */
  pastLabel?: string;
  /** Computes the one-line summary on the My Services card. */
  summary: (rows: any[], ctx: SummaryContext) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Summary strip on the card page. */
  strip: (rows: any[], ctx: SummaryContext) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
  columns: ServiceColumn[];
  /** Leave has Balance and History tabs. */
  balanceTab?: boolean;
  /** An extra note shown under the header (LTC). */
  note?: string;
}

const inr = (n: number) => formatINR(n);
const left = (b: LeaveBalance | undefined, k: keyof LeaveBalance) =>
  b ? b[k].allowed - b[k].used : 0;
const thisYear = (iso: string, y: number) => new Date(iso).getFullYear() === y;

export const SERVICE_CARDS: ServiceCardDef[] = [
  {
    key: 'leave',
    title: 'Leave',
    headline: 'Leave',
    tagline: 'Your balances, your leave history, and a way to apply.',
    icon: 'calendar',
    formKey: 'leave',
    main: 'Apply for leave',
    pastLabel: 'Add a past leave',
    balanceTab: true,
    summary: (_r, c) => `CL ${left(c.balance, 'cl')} left, EL ${left(c.balance, 'el')} left`,
    strip: (_r, c) => `CL ${left(c.balance, 'cl')} left, EL ${left(c.balance, 'el')} left`,
    columns: [
      { key: 'type', header: 'Leave type', mobile: 'title' },
      { key: 'from', header: 'From', kind: 'date' },
      { key: 'to', header: 'To', kind: 'date' },
      { key: 'days', header: 'Days' },
      { key: 'status', header: 'Status', kind: 'status' },
      { key: 'source', header: 'Source', kind: 'source' },
    ],
  },
  {
    key: 'ltc',
    title: 'Leave Travel Concession (LTC)',
    headline: 'Leave Travel Concession (LTC)',
    tagline:
      'A record of your LTC trips by block year. This page records trips. It does not process claims.',
    icon: 'plane',
    formKey: 'ltc',
    main: 'Record an LTC trip',
    note: 'This page records trips. It does not process claims.',
    summary: (r, c) => {
      const block = `${c.year - 3} to ${c.year}`;
      const n = r.filter((x) => x.blockYear === block && x.status === 'approved').length;
      return `Block ${block}: ${n} ${n === 1 ? 'trip' : 'trips'} recorded`;
    },
    strip: (r, c) => {
      const block = `${c.year - 3} to ${c.year}`;
      const n = r.filter((x) => x.blockYear === block && x.status === 'approved').length;
      return `Current block: ${block}. Trips recorded: ${n}.`;
    },
    columns: [
      { key: 'blockYear', header: 'Block year', mobile: 'title' },
      { key: 'from', header: 'From', kind: 'date' },
      { key: 'to', header: 'To', kind: 'date' },
      { key: 'placeFrom', header: 'From place' },
      { key: 'placeTo', header: 'To place' },
      { key: 'who', header: 'Self or family' },
      { key: 'leaveAvailed', header: 'Leave availed' },
      { key: 'status', header: 'Status', kind: 'status' },
      { key: 'source', header: 'Source', kind: 'source' },
    ],
  },
  {
    key: 'medical',
    title: 'Medical Reimbursement',
    headline: 'Medical Reimbursement',
    tagline: 'Your medical claims and where each one stands.',
    icon: 'medical',
    formKey: 'medical',
    main: 'New medical claim',
    pastLabel: 'Add a past claim',
    summary: (r, c) => {
      const y = r.filter((x) => thisYear(x.date, c.year) && x.status === 'approved');
      return `${y.length} ${y.length === 1 ? 'claim' : 'claims'} this year, ${inr(y.reduce((a, x) => a + x.cost, 0))} claimed`;
    },
    strip: (r, c) => {
      const y = r.filter((x) => thisYear(x.date, c.year) && x.status === 'approved');
      return `${y.length} ${y.length === 1 ? 'claim' : 'claims'} this year. Total claimed: ${inr(y.reduce((a, x) => a + x.cost, 0))}.`;
    },
    columns: [
      { key: 'date', header: 'Date of application', kind: 'date', mobile: 'title' },
      { key: 'forWhom', header: 'For' },
      { key: 'hospital', header: 'Hospital' },
      { key: 'treatment', header: 'Treatment for' },
      { key: 'cost', header: 'Total cost (₹)', kind: 'inr' },
      { key: 'status', header: 'Status', kind: 'status' },
      { key: 'concurrence', header: features.medical.concurrenceLabel, kind: 'readonly' },
      { key: 'source', header: 'Source', kind: 'source' },
    ],
  },
  {
    key: 'gpf',
    title: 'General Provident Fund (GPF)',
    headline: 'General Provident Fund (GPF)',
    tagline: 'Your withdrawals from the GPF.',
    icon: 'rupee',
    formKey: 'gpf',
    main: 'Apply for a withdrawal',
    pastLabel: 'Add a past withdrawal',
    summary: (r) =>
      `Withdrawn so far: ${inr(r.filter((x) => x.status === 'approved').reduce((a, x) => a + x.amount, 0))}`,
    strip: (r) =>
      `Withdrawn so far: ${inr(r.filter((x) => x.status === 'approved').reduce((a, x) => a + x.amount, 0))}`,
    columns: [
      { key: 'date', header: 'Date', kind: 'date', mobile: 'title' },
      { key: 'type', header: 'Type' },
      { key: 'purpose', header: 'Purpose' },
      { key: 'amount', header: 'Amount (₹)', kind: 'inr' },
      { key: 'status', header: 'Status', kind: 'status' },
      { key: 'source', header: 'Source', kind: 'source' },
    ],
  },
];

export const getServiceCard = (key?: string) => SERVICE_CARDS.find((c) => c.key === key);
/** Whether a card offers "Add a past ...". */
export const supportsPast = (c: ServiceCardDef) =>
  !!c.pastLabel && features.services.pastRecords[c.key] !== false;
