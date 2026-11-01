import { COUNTRIES, DEPARTMENTS, LEAVE_TYPES, TN_DISTRICTS } from './options';
import { formatINR, parseDMY } from '@/domain/dates';
import type { Mode } from '@/domain/types';

export type FieldKind =
  'text' | 'textarea' | 'select' | 'date' | 'dateRange' | 'amount' | 'radio' | 'number';
export type OptionsRef =
  | string[]
  | 'leaveTypes'
  | 'countries'
  | 'postingPlaces'
  | 'postingDepartments'
  | 'postingDesignations'
  | 'ownEntries';

export interface FieldDef {
  name: string;
  kind: FieldKind;
  label: string;
  required?: boolean;
  options?: OptionsRef;
  /** Required only when another field has one of these values. */
  requiredWhen?: Record<string, string | string[]>;
  help?: string;
  /** Wide field in the two-column form grid. */
  full?: boolean;
  searchable?: boolean;
}
export interface DocDef {
  name: string;
  label: string;
  required?: boolean;
  requiredWhen?: Record<string, string | string[]>;
  /** Required when this returns true for the entered values. */
  needed?: (v: Record<string, any>) => boolean; // eslint-disable-line @typescript-eslint/no-explicit-any
}
export type RuleName = 'noOverlap' | 'balanceWarning';
export type RequestKind = 'service' | 'career' | 'profile' | 'correction';

/** One request type. Every officer change goes through the same engine (v2, section 6). */
export interface RequestTypeDef {
  key: string;
  kind: RequestKind;
  /** The service card this type belongs to (a key of `services.cards`). */
  cardKey?: string;
  label: string;
  cardName: string;
  icon: string;
  /** `apply` and `past`, or only `record`. Types without a mode have none. */
  modes: Mode[];
  fields: FieldDef[];
  documents: DocDef[];
  rules?: RuleName[];
  /** Whether the form shows the optional "Order details" block. */
  orderBlock?: boolean;
  /** The scan of the paper record or order, required for these modes. */
  proofRequiredFor?: Mode[];
  title: (v: Record<string, any>) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type V = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
/** "12 to 14 November", or "28 November to 2 December" across months. */
export function rangeTitle(r?: { from?: string; to?: string }): string {
  const a = r?.from ? parseDMY(r.from) : null;
  const b = r?.to ? parseDMY(r.to) : null;
  if (!a || !b) return '';
  const [ad, bd, am, bm] = [
    a.getUTCDate(),
    b.getUTCDate(),
    MONTHS[a.getUTCMonth()],
    MONTHS[b.getUTCMonth()],
  ];
  if (a.getTime() === b.getTime()) return `${ad} ${am}`;
  return am === bm ? `${ad} to ${bd} ${bm}` : `${ad} ${am} to ${bd} ${bm}`;
}
const money = (n: unknown) =>
  formatINR(Number(String(n ?? '').replace(/,/g, '')) || 0).replace('₹', '');
const selfFamily = ['Self', 'Family'];

/** Order details are optional on every service form (v2, section 3.3). */
export const ORDER_TYPES = [
  'G.O. (RT)',
  'G.O. (Ms)',
  'G.O. (1D)',
  'G.O. (2D)',
  'G.O. (3D)',
  'G.O. (4D)',
  'Letter',
];
export const GRADES = [
  'Probation',
  'Junior Time Scale',
  'Senior Time Scale',
  'Junior Administrative Grade',
  'Selection Grade',
  'Super Time Scale',
  'Above Super Time Scale',
];
export const POSTING_PLACES = ['Chennai', ...TN_DISTRICTS.filter((d) => d !== 'Chennai'), 'Delhi'];
/** The department and designation lists depend on where the officer is posted. */
export const SECRETARIAT_DESIGNATIONS = [
  'Secretary',
  'Special Secretary',
  'Additional Secretary',
  'Joint Secretary',
  'Deputy Secretary',
  'Under Secretary',
];
export const DISTRICT_DESIGNATIONS = [
  'Collector',
  'Joint Collector',
  'Sub-Collector',
  'Project Officer',
  'Commissioner',
  'Assistant Collector (Training)',
];
export const DISTRICT_DEPARTMENTS = DEPARTMENTS.filter(
  (d) => d !== 'Public Department' && d !== 'Finance Department',
);

export const REQUEST_TYPES: RequestTypeDef[] = [
  {
    key: 'leave',
    kind: 'service',
    cardKey: 'leave',
    label: 'Apply for leave',
    cardName: 'Leave',
    icon: 'calendar',
    modes: ['apply', 'past'],
    orderBlock: true,
    proofRequiredFor: ['past'],
    fields: [
      { name: 'type', kind: 'select', label: 'Leave type', required: true, options: 'leaveTypes' },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
      {
        name: 'country',
        kind: 'select',
        label: 'Country',
        options: 'countries',
        requiredWhen: { type: 'Ex-India leave' },
      },
      { name: 'remarks', kind: 'textarea', label: 'Remarks', full: true },
    ],
    documents: [
      {
        name: 'medicalCertificate',
        label: 'Medical certificate',
        requiredWhen: { type: ['Medical leave', 'Half-pay leave (with medical certificate)'] },
      },
    ],
    rules: ['noOverlap', 'balanceWarning'],
    title: (v: V) => `Leave, ${rangeTitle(v.dates)}`,
  },
  {
    key: 'ltc',
    kind: 'service',
    cardKey: 'ltc',
    label: 'Record an LTC trip',
    cardName: 'Leave Travel Concession',
    icon: 'plane',
    modes: ['record'],
    orderBlock: true,
    fields: [
      {
        name: 'blockYear',
        kind: 'text',
        label: 'Block year',
        required: true,
        help: 'For example 2024 to 2027',
      },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
      { name: 'placeFrom', kind: 'text', label: 'Place from', required: true },
      { name: 'placeTo', kind: 'text', label: 'Place to', required: true },
      { name: 'who', kind: 'radio', label: 'Who travels', required: true, options: selfFamily },
      {
        name: 'leaveAvailed',
        kind: 'select',
        label: 'Leave availed',
        required: true,
        options: ['Casual leave', 'Earned leave'],
      },
      { name: 'remarks', kind: 'textarea', label: 'Remarks', full: true },
    ],
    documents: [],
    title: (v: V) => `LTC trip, block ${v.blockYear ?? ''}`.trim(),
  },
  {
    key: 'medical',
    kind: 'service',
    cardKey: 'medical',
    label: 'New medical claim',
    cardName: 'Medical Reimbursement',
    icon: 'medical',
    modes: ['apply', 'past'],
    orderBlock: true,
    proofRequiredFor: ['past'],
    fields: [
      { name: 'description', kind: 'textarea', label: 'Description', required: true, full: true },
      { name: 'hospital', kind: 'text', label: 'Hospital', required: true },
      { name: 'treatment', kind: 'text', label: 'Treatment taken for', required: true },
      { name: 'cost', kind: 'amount', label: 'Total cost (₹)', required: true },
      { name: 'who', kind: 'select', label: 'Self or family', required: true, options: selfFamily },
      { name: 'applicationDate', kind: 'date', label: 'Date of application', required: true },
      {
        name: 'dischargeEndorsed',
        kind: 'radio',
        label: 'Discharge summary endorsed',
        required: true,
        options: ['Yes', 'No', 'Others'],
      },
    ],
    documents: [
      { name: 'bills', label: 'Bills', required: true },
      { name: 'dischargeSummary', label: 'Discharge summary' },
    ],
    title: (v: V) => `Medical claim, ₹${money(v.cost)}`,
  },
  {
    key: 'gpf',
    kind: 'service',
    cardKey: 'gpf',
    label: 'Apply for a GPF withdrawal',
    cardName: 'General Provident Fund',
    icon: 'rupee',
    modes: ['apply', 'past'],
    orderBlock: true,
    proofRequiredFor: ['past'],
    fields: [
      {
        name: 'type',
        kind: 'select',
        label: 'Type',
        required: true,
        options: ['Temporary', 'Part final', '90 percent withdrawal'],
      },
      {
        name: 'purpose',
        kind: 'select',
        label: 'Purpose',
        required: true,
        options: ['Higher education', 'House construction', 'Medical', 'Marriage', 'Other'],
      },
      { name: 'amount', kind: 'amount', label: 'Amount (₹)', required: true },
      { name: 'date', kind: 'date', label: 'Date', required: true },
    ],
    documents: [],
    title: (v: V) => `GPF withdrawal, ₹${money(v.amount)}`,
  },
  {
    key: 'posting',
    kind: 'career',
    label: 'Add a posting',
    cardName: 'Posting',
    icon: 'building',
    modes: [],
    fields: [
      {
        name: 'postingIn',
        kind: 'select',
        label: 'Posting In',
        required: true,
        options: 'postingPlaces',
        searchable: true,
      },
      {
        name: 'department',
        kind: 'select',
        label: 'Department',
        required: true,
        options: 'postingDepartments',
      },
      {
        name: 'designation',
        kind: 'select',
        label: 'Designation',
        required: true,
        options: 'postingDesignations',
      },
      {
        name: 'postType',
        kind: 'radio',
        label: 'Post Type',
        required: true,
        options: ['Temporary', 'Permanent'],
      },
      {
        name: 'locationChange',
        kind: 'select',
        label: 'Location Change',
        required: true,
        options: ['In situ', 'Within state', 'Outside state'],
      },
      { name: 'fromDate', kind: 'date', label: 'From date', required: true },
      {
        name: 'toDate',
        kind: 'date',
        label: 'To date',
        help: 'Leave empty for your current posting.',
      },
      { name: 'officeAddress', kind: 'text', label: 'Office address', full: true },
      { name: 'orderNumber', kind: 'text', label: 'Order number' },
      { name: 'orderDate', kind: 'date', label: 'Order date' },
    ],
    documents: [
      { name: 'orderFile', label: 'Order file', needed: (v) => !!String(v.toDate ?? '').trim() },
    ],
    title: (v: V) => `Posting: ${v.designation ?? ''}, ${v.department ?? ''}`,
  },
  {
    key: 'promotion',
    kind: 'career',
    label: 'Add a promotion',
    cardName: 'Promotion',
    icon: 'book',
    modes: [],
    fields: [
      { name: 'fromGrade', kind: 'select', label: 'From grade', required: true, options: GRADES },
      { name: 'toGrade', kind: 'select', label: 'To grade', required: true, options: GRADES },
      { name: 'promotionDate', kind: 'date', label: 'Promotion date', required: true },
      { name: 'orderNumber', kind: 'text', label: 'Order number' },
      { name: 'orderDate', kind: 'date', label: 'Order date' },
    ],
    documents: [{ name: 'orderFile', label: 'Order file', required: true }],
    title: (v: V) => `Promotion to ${v.toGrade ?? ''}`,
  },
  {
    key: 'profile-edit',
    kind: 'profile',
    label: 'Update my details',
    cardName: 'Profile',
    icon: 'user',
    modes: [],
    fields: [],
    documents: [{ name: 'certificate', label: 'Certificate' }],
    title: (v: V) => `Update my details: ${v.group ?? ''}`,
  },
  {
    key: 'correction',
    kind: 'correction',
    label: 'Report a correction',
    cardName: 'Correction',
    icon: 'warning',
    modes: [],
    fields: [
      {
        name: 'field',
        kind: 'select',
        label: 'What is wrong',
        required: true,
        options: 'ownEntries',
        searchable: true,
        full: true,
      },
      {
        name: 'whatsWrong',
        kind: 'textarea',
        label: 'What is wrong with it',
        required: true,
        full: true,
      },
      { name: 'shouldSay', kind: 'text', label: 'What it should say', required: true, full: true },
    ],
    documents: [{ name: 'proof', label: 'Proof' }],
    title: (v: V) => `Correction: ${v.field ?? ''}`,
  },
];

export const getRequestType = (key?: string) => REQUEST_TYPES.find((t) => t.key === key);
export { COUNTRIES, DEPARTMENTS, LEAVE_TYPES };
