import { COUNTRIES, DEPARTMENTS, FUNDING, LEAVE_TYPES, SOURCE_OF_FUNDS } from './options';
import { formatINR, parseDMY } from '@/domain/dates';

export type FieldKind =
  'text' | 'textarea' | 'select' | 'date' | 'dateRange' | 'amount' | 'radio' | 'number' | 'repeat';
export type OptionsRef =
  string[] | 'leaveTypes' | 'countries' | 'states' | 'districts' | 'ownEntries' | 'updateFields';

export interface FieldDef {
  name: string;
  kind: FieldKind;
  label: string;
  required?: boolean;
  options?: OptionsRef;
  /** Required only when another field has one of these values. */
  requiredWhen?: Record<string, string | string[]>;
  help?: string;
  /** For `repeat`: the fields of each row. */
  sub?: FieldDef[];
  addLabel?: string;
  /** Wide field in the two-column form grid. */
  full?: boolean;
  searchable?: boolean;
}
export interface DocDef {
  name: string;
  label: string;
  required?: boolean;
  requiredWhen?: Record<string, string | string[]>;
}
export type RuleName = 'noOverlap' | 'balanceWarning';
export type RequestGroup =
  'leave-and-travel' | 'money-and-benefits' | 'property' | 'record-and-learning';

export interface RequestTypeDef {
  key: string;
  group: RequestGroup;
  icon: string;
  label: string;
  cardName: string;
  help: string;
  keepReady: string;
  fields: FieldDef[];
  documents: DocDef[];
  rules?: RuleName[];
  autoApprove?: boolean;
  /** A line shown above the fields. */
  note?: string;
  /** Dates in the past are allowed (with a notice) only for these. */
  allowPast?: boolean;
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
const money = (n: unknown) => formatINR(Number(n) || 0).replace('₹', '');
const yn = ['Yes', 'No'];
const selfFamily = ['Self', 'Family'];

const propertyFields = (types: string[]): FieldDef[] => [
  { name: 'type', kind: 'select', label: 'Type of property', required: true, options: types },
  { name: 'details', kind: 'textarea', label: 'Details', required: true, full: true },
  {
    name: 'source',
    kind: 'select',
    label: 'Source of funds',
    required: true,
    options: SOURCE_OF_FUNDS,
  },
  { name: 'cost', kind: 'amount', label: 'Total cost (₹)' },
  { name: 'sellerName', kind: 'text', label: 'Seller name' },
  { name: 'sellerContact', kind: 'text', label: 'Seller contact', required: true },
  { name: 'sellerAddress', kind: 'text', label: 'Seller address', required: true, full: true },
  {
    name: 'shownInIpr',
    kind: 'radio',
    label: 'Shown in annual property return (IPR)',
    required: true,
    options: yn,
  },
  {
    name: 'selfOrFamily',
    kind: 'select',
    label: 'Self or family',
    required: true,
    options: selfFamily,
  },
  { name: 'previousSanction', kind: 'text', label: 'Previous sanction order', required: true },
  { name: 'date', kind: 'date', label: 'Date', required: true },
];

export const UPDATE_FIELDS: Record<string, string[]> = {
  Contact: ['Mobile number 1', 'Mobile number 2', 'Landline', 'Personal email'],
  Personal: ['Name', 'Date of birth', 'Home state', 'Native district', 'Languages known'],
  Address: ['Address line', 'City', 'Pincode'],
  Qualifications: ['Add a qualification', 'Correct a qualification'],
  'Officer details': ['Grade', 'Pay level', 'Seniority number', 'Recruitment type'],
};

export const REQUEST_TYPES: RequestTypeDef[] = [
  {
    key: 'leave',
    group: 'leave-and-travel',
    icon: 'calendar',
    label: 'Apply for leave',
    cardName: 'Leave',
    help: 'Casual, earned, medical and other leave.',
    keepReady: 'dates',
    allowPast: true,
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
    key: 'foreign-visit',
    group: 'leave-and-travel',
    icon: 'plane',
    label: 'Foreign visit',
    cardName: 'Foreign visit',
    help: 'Permission for travel abroad.',
    keepReady: 'invitation, clearances',
    fields: [
      { name: 'country', kind: 'select', label: 'Country', required: true, options: 'countries' },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
      { name: 'purpose', kind: 'textarea', label: 'Purpose', required: true, full: true },
      { name: 'delegates', kind: 'text', label: 'Other delegates', full: true },
      {
        name: 'fundsSource',
        kind: 'select',
        label: 'Source of funds',
        required: true,
        options: ['State Government', 'Central Government', 'Foreign funds', 'Others'],
      },
      { name: 'fundsAmount', kind: 'amount', label: 'Amount of funds' },
      { name: 'invitingAuthority', kind: 'text', label: 'Inviting authority', required: true },
      {
        name: 'invitationEnclosed',
        kind: 'radio',
        label: 'Invitation enclosed',
        required: true,
        options: yn,
      },
    ],
    documents: [
      { name: 'invitation', label: 'Invitation', requiredWhen: { invitationEnclosed: 'Yes' } },
      { name: 'politicalClearance', label: 'Political clearance', required: true },
      { name: 'fcraClearance', label: 'FCRA clearance', required: true },
    ],
    rules: ['noOverlap'],
    title: (v: V) => `Foreign visit to ${v.country}, ${rangeTitle(v.dates)}`,
  },
  {
    key: 'tour',
    group: 'leave-and-travel',
    icon: 'globe',
    label: 'Official tour',
    cardName: 'Official tour',
    help: 'Tours within India for official work.',
    keepReady: 'place, dates, purpose',
    fields: [
      { name: 'state', kind: 'select', label: 'State', required: true, options: 'states' },
      { name: 'district', kind: 'select', label: 'District', required: true, options: 'districts' },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
      { name: 'purpose', kind: 'textarea', label: 'Purpose', required: true, full: true },
      { name: 'host', kind: 'text', label: 'Host organisation', required: true, full: true },
      {
        name: 'staff',
        kind: 'repeat',
        label: 'Accompanying staff',
        addLabel: 'Add another person',
        full: true,
        sub: [
          { name: 'name', kind: 'text', label: 'Name' },
          { name: 'designation', kind: 'text', label: 'Designation' },
        ],
      },
    ],
    documents: [],
    rules: ['noOverlap'],
    title: (v: V) => `Official tour to ${v.district}, ${rangeTitle(v.dates)}`,
  },
  {
    key: 'private-visit',
    group: 'leave-and-travel',
    icon: 'plane',
    label: 'Private visit',
    cardName: 'Private visit',
    help: 'Private travel abroad.',
    keepReady: 'dates, estimated cost',
    fields: [
      { name: 'country', kind: 'select', label: 'Country', required: true, options: 'countries' },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
      {
        name: 'selfOrFamily',
        kind: 'select',
        label: 'Self or family',
        required: true,
        options: selfFamily,
      },
      { name: 'cost', kind: 'amount', label: 'Estimated expenditure (₹)', required: true },
      { name: 'remarks', kind: 'textarea', label: 'Remarks', full: true },
    ],
    documents: [],
    rules: ['noOverlap'],
    title: (v: V) => `Private visit to ${v.country}`,
  },
  {
    key: 'ltc',
    group: 'leave-and-travel',
    icon: 'plane',
    label: 'LTC',
    cardName: 'LTC',
    help: 'Leave travel concession for you and your family.',
    keepReady: 'block year, places',
    allowPast: true,
    fields: [
      {
        name: 'blockYear',
        kind: 'select',
        label: 'Block year',
        required: true,
        options: ['2024', '2025', '2026', '2027'],
      },
      { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
      { name: 'placeFrom', kind: 'text', label: 'Place from', required: true },
      { name: 'placeTo', kind: 'text', label: 'Place to', required: true },
      {
        name: 'selfOrFamily',
        kind: 'select',
        label: 'Self or family',
        required: true,
        options: selfFamily,
      },
      {
        name: 'leaveAvailed',
        kind: 'select',
        label: 'Leave availed',
        required: true,
        options: ['Casual leave', 'Earned leave'],
      },
    ],
    documents: [],
    title: (v: V) => `LTC, block ${v.blockYear}`,
  },
  {
    key: 'medical',
    group: 'money-and-benefits',
    icon: 'rupee',
    label: 'Medical claim',
    cardName: 'Medical claim',
    help: 'Reimbursement of medical expenses.',
    keepReady: 'bills, discharge summary',
    allowPast: true,
    fields: [
      { name: 'description', kind: 'textarea', label: 'Description', required: true, full: true },
      { name: 'hospital', kind: 'text', label: 'Hospital', required: true },
      { name: 'treatment', kind: 'text', label: 'Treatment taken for', required: true },
      { name: 'cost', kind: 'amount', label: 'Total cost (₹)' },
      { name: 'selfOrFamily', kind: 'select', label: 'Self or family', options: selfFamily },
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
      { name: 'discharge', label: 'Discharge summary' },
    ],
    title: (v: V) => `Medical claim, ₹${money(v.cost)}`,
  },
  {
    key: 'hba',
    group: 'money-and-benefits',
    icon: 'building',
    label: 'House building advance',
    cardName: 'House building advance',
    help: 'An advance to build or buy a home.',
    keepReady: 'property details, cost',
    fields: [
      { name: 'scheme', kind: 'text', label: 'Scheme', required: true },
      {
        name: 'propertyState',
        kind: 'select',
        label: 'Property state',
        required: true,
        options: 'states',
      },
      {
        name: 'propertyDistrict',
        kind: 'select',
        label: 'Property district',
        required: true,
        options: 'districts',
      },
      {
        name: 'propertyType',
        kind: 'radio',
        label: 'Property type',
        required: true,
        options: ['Ready built', 'Construction'],
      },
      { name: 'applicationDate', kind: 'date', label: 'Date of application', required: true },
      { name: 'cost', kind: 'amount', label: 'Total cost (₹)' },
      { name: 'existingResidence', kind: 'radio', label: 'Existing residence', options: yn },
      { name: 'relaxation2b', kind: 'text', label: '2B relaxation' },
      { name: 'amountRequested', kind: 'amount', label: 'Amount requested (₹)' },
      { name: 'instalments', kind: 'number', label: 'Number of instalments' },
    ],
    documents: [{ name: 'propertyDocs', label: 'Property documents' }],
    title: (v: V) => `House building advance, ₹${money(v.amountRequested || v.cost)}`,
  },
  {
    key: 'gpf',
    group: 'money-and-benefits',
    icon: 'rupee',
    label: 'GPF withdrawal',
    cardName: 'GPF withdrawal',
    help: 'Part-final withdrawal from your GPF.',
    keepReady: 'amount, purpose',
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
        options: [
          'Higher education',
          'House construction',
          'Medical',
          '90 percent withdrawal',
          'Marriage',
        ],
      },
      { name: 'amount', kind: 'amount', label: 'Amount (₹)' },
      { name: 'date', kind: 'date', label: 'Date' },
    ],
    documents: [],
    title: (v: V) => `GPF withdrawal, ₹${money(v.amount)}`,
  },
  {
    key: 'mha-id',
    group: 'money-and-benefits',
    icon: 'user',
    label: 'MHA identity card',
    cardName: 'MHA identity card',
    help: 'Apply for or renew the identity card.',
    keepReady: 'application form',
    fields: [
      {
        name: 'applicationType',
        kind: 'radio',
        label: 'Application type',
        required: true,
        options: ['New', 'Renewal'],
      },
      {
        name: 'previousCard',
        kind: 'text',
        label: 'Previous card number',
        requiredWhen: { applicationType: 'Renewal' },
        help: 'For renewal only.',
      },
    ],
    documents: [{ name: 'applicationForm', label: 'Application form', required: true }],
    title: (v: V) => `MHA identity card, ${v.applicationType}`,
  },
  {
    key: 'saf',
    group: 'money-and-benefits',
    icon: 'building',
    label: 'SAF Games Village housing',
    cardName: 'SAF Games Village housing',
    help: 'Apply for a flat.',
    keepReady: 'nothing',
    note: 'The department will allot a flat by seniority and waiting period.',
    fields: [{ name: 'remarks', kind: 'textarea', label: 'Remarks', full: true }],
    documents: [],
    title: () => 'SAF Games Village housing',
  },
  {
    key: 'education',
    group: 'money-and-benefits',
    icon: 'book',
    label: 'Education',
    cardName: 'Education',
    help: 'Add a qualification or course.',
    keepReady: 'certificate',
    fields: [
      {
        name: 'level',
        kind: 'select',
        label: 'Course level',
        required: true,
        options: [
          'Diploma',
          'Bachelor’s degree',
          'Master’s degree',
          'Doctorate',
          'Certificate course',
        ],
      },
      { name: 'degree', kind: 'text', label: 'Degree', required: true },
      { name: 'specialisation', kind: 'text', label: 'Specialisation' },
      { name: 'institute', kind: 'text', label: 'Institute', required: true },
      { name: 'state', kind: 'select', label: 'State', options: 'states' },
      { name: 'country', kind: 'select', label: 'Country', options: 'countries' },
      {
        name: 'duration',
        kind: 'select',
        label: 'Duration in years',
        options: ['1', '2', '3', '4', '5'],
      },
      { name: 'funding', kind: 'select', label: 'Funding', options: FUNDING },
      { name: 'fee', kind: 'amount', label: 'Fee (₹)' },
      { name: 'completion', kind: 'date', label: 'Completion date', required: true },
    ],
    documents: [{ name: 'certificate', label: 'Certificate' }],
    title: (v: V) => `Education, ${v.degree}`,
  },
  {
    key: 'immovable',
    group: 'property',
    icon: 'building',
    label: 'Immovable property',
    cardName: 'Immovable property',
    help: 'Land, a house or a flat.',
    keepReady: 'sale deed details',
    fields: propertyFields(['House', 'Flat', 'Plot', 'Agricultural land', 'Other']),
    documents: [{ name: 'papers', label: 'Sale deed or related papers' }],
    title: (v: V) => `Property: ${v.type}`,
  },
  {
    key: 'movable',
    group: 'property',
    icon: 'building',
    label: 'Movable property',
    cardName: 'Movable property',
    help: 'Vehicles and valuables.',
    keepReady: 'invoice',
    fields: propertyFields(['Vehicle', 'Jewellery', 'Electronics', 'Other']),
    documents: [{ name: 'papers', label: 'Invoice or related papers' }],
    title: (v: V) => `Property: ${v.type}`,
  },
  {
    key: 'intimation',
    group: 'property',
    icon: 'file',
    label: 'Intimation',
    cardName: 'Intimation',
    help: 'Tell the government about a transaction.',
    keepReady: 'details',
    fields: [
      { name: 'details', kind: 'textarea', label: 'Details', required: true, full: true },
      {
        name: 'source',
        kind: 'select',
        label: 'Source of funds',
        required: true,
        options: SOURCE_OF_FUNDS,
      },
      {
        name: 'type',
        kind: 'select',
        label: 'Type',
        required: true,
        options: ['Job for a family member', 'Purchase', 'Sale', 'Gift', 'Other'],
      },
      { name: 'previousSanction', kind: 'text', label: 'Previous sanction order' },
      {
        name: 'selfOrFamily',
        kind: 'select',
        label: 'Self or family',
        required: true,
        options: selfFamily,
      },
    ],
    documents: [{ name: 'papers', label: 'Supporting papers' }],
    title: (v: V) => `Intimation: ${v.type}`,
  },
  {
    key: 'update-details',
    group: 'record-and-learning',
    icon: 'user',
    label: 'Update my details',
    cardName: 'Update my details',
    help: 'Change your contact or official details.',
    keepReady: 'proof for official changes',
    fields: [
      {
        name: 'section',
        kind: 'select',
        label: 'Section',
        required: true,
        options: Object.keys(UPDATE_FIELDS),
      },
      {
        name: 'field',
        kind: 'select',
        label: 'The field to change',
        required: true,
        options: 'updateFields',
      },
      { name: 'newValue', kind: 'text', label: 'New value', required: true, full: true },
    ],
    documents: [
      {
        name: 'proof',
        label: 'Proof',
        requiredWhen: { section: ['Address', 'Personal', 'Qualifications', 'Officer details'] },
      },
    ],
    autoApprove: true,
    title: (v: V) => `Update my details: ${v.section}`,
  },
  {
    key: 'correction',
    group: 'record-and-learning',
    icon: 'warning',
    label: 'Report a correction',
    cardName: 'Report a correction',
    help: 'Tell the department something in your file is wrong.',
    keepReady: 'what is wrong, proof',
    fields: [
      {
        name: 'entry',
        kind: 'select',
        label: 'Which entry is wrong',
        required: true,
        options: 'ownEntries',
        searchable: true,
        full: true,
      },
      { name: 'wrong', kind: 'textarea', label: 'What is wrong', required: true, full: true },
      { name: 'right', kind: 'textarea', label: 'What it should say', required: true, full: true },
    ],
    documents: [{ name: 'proof', label: 'Proof' }],
    title: (v: V) => `Correction: ${v.entry}`,
  },
  {
    key: 'training-request',
    group: 'record-and-learning',
    icon: 'book',
    label: 'Training request',
    cardName: 'Training request',
    help: 'Ask for a training that is not scheduled.',
    keepReady: 'nothing',
    fields: [
      { name: 'title', kind: 'text', label: 'Title', required: true, full: true },
      { name: 'description', kind: 'textarea', label: 'Description', full: true },
      { name: 'dates', kind: 'dateRange', label: 'Preferred dates' },
      { name: 'for', kind: 'radio', label: 'For', required: true, options: ['Myself', 'My team'] },
    ],
    documents: [],
    title: (v: V) => `Training request: ${v.title}`,
  },
];

export const REQUEST_GROUPS: { id: RequestGroup; label: string }[] = [
  { id: 'leave-and-travel', label: 'Leave and travel' },
  { id: 'money-and-benefits', label: 'Money and benefits' },
  { id: 'property', label: 'Property' },
  { id: 'record-and-learning', label: 'My record and learning' },
];
export const getRequestType = (key?: string) => REQUEST_TYPES.find((t) => t.key === key);
export { COUNTRIES, DEPARTMENTS, LEAVE_TYPES };
