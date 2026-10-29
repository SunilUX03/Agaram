// All data here is fictional. Dates are generated relative to today so it never looks old.
import { formatDMY } from '@/domain/dates';
import type * as T from '@/domain/types';
import type { IdeaStatus } from '@/domain/status';
import { rangeTitle } from '@/config/requests';

const DAY = 86400000;
export const SAMPLE_PDF = `${import.meta.env.BASE_URL}sample.pdf`;

export interface Db {
  officer: T.Officer;
  career: T.CareerEntry[];
  leaveBalance: T.LeaveBalance;
  leaves: T.LeaveRecord[];
  trainings: T.TrainingRecord[];
  travels: T.TravelRecord[];
  properties: T.PropertyRecord[];
  benefits: T.BenefitRecord[];
  documents: T.DocumentItem[];
  requests: T.Request[];
  notifications: T.Notification[];
  ideas: (Omit<T.Idea, 'backerCount' | 'backedByMe' | 'mine' | 'commentCount'> & {
    authorId: string;
  })[];
  comments: (Omit<T.Comment, 'mine'> & { authorId: string })[];
  posts: (Omit<T.Post, 'mine' | 'author' | 'replyCount'> & {
    author: T.PersonRef;
    authorId: string;
  })[];
  articles: (Omit<T.Article, 'savedByMe' | 'mine'> & { authorId: string })[];
  colleagues: T.Colleague[];
  departments: T.Department[];
  experts: T.Expert[];
  trainingEvents: T.TrainingEvent[];
  resources: T.Resource[];
  awards: T.Award[];
  library: T.LibraryItem[];
  tasks: T.DeskTask[];
  notes: T.DeskNote[];
  saved: T.SavedItem[];
  settings: T.Settings;
  pollVotes: Record<string, string>;
  seq: number;
}

export const ME = 'off-me';

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** A neutral head-and-shoulders drawing used as a stand-in photo. */
export function photoDataUri(seed: number): string {
  const bg = ['#f2e9e4', '#e4ecf2', '#e8f0e4', '#f2e4ee', '#efe9d8', '#e4e8f2'][seed % 6];
  const fg = ['#c9b8ad', '#adbcc9', '#b5c9ad', '#c9adbf', '#c9bf9a', '#adb3c9'][seed % 6];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${bg}"/><circle cx="48" cy="38" r="17" fill="${fg}"/><path d="M14 96c0-22 15-34 34-34s34 12 34 34z" fill="${fg}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildSeed(now = new Date()): Db {
  const at = (days: number, hour = 10) => {
    const d = new Date(now.getTime() + days * DAY);
    d.setHours(hour, (Math.abs(days) * 7) % 60, 0, 0);
    return d.toISOString();
  };
  const dmy = (days: number) =>
    formatDMY(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days)));
  const dateOnly = (days: number) => at(days).slice(0, 10);
  let n = 0;
  const id = (p: string) => `${p}-${++n}`;
  const rand = rng(42);
  const year = now.getFullYear();

  const me: T.PersonRef = {
    id: ME,
    name: 'Aadhira Valluvan',
    designation: 'Joint Collector',
    department: 'Revenue and Disaster Management',
    district: 'Tirunelveli',
  };

  const officer: T.Officer = {
    id: ME,
    officerId: 'TNIAS-2018-0417',
    ifhrmsId: 'IFH-48213907',
    name: 'Aadhira Valluvan',
    salutation: 'Tmt.',
    photoUrl: photoDataUri(1),
    service: 'IAS',
    batch: 2018,
    status: 'serving',
    dateOfBirth: '1990-03-14',
    gender: 'Female',
    homeState: 'Tamil Nadu',
    nativeDistrict: 'Thanjavur',
    languages: ['Tamil', 'English', 'Hindi'],
    contact: {
      mobile1: '+91 90000 10417',
      mobile2: '+91 90000 20417',
      landline: '0462 000 0417',
      officialEmail: 'aadhira.valluvan@example.gov.test',
      personalEmail: 'aadhira.v@example.test',
    },
    address: { line: '12, Sample Colony, Sample Nagar', city: 'Tirunelveli', pincode: '627 000' },
    qualifications: [
      {
        id: 'q1',
        level: 'Postgraduate degree',
        degree: 'M.A.',
        specialisation: 'Public Policy',
        institute: 'Example Institute of Policy Studies',
        state: 'Tamil Nadu',
        country: 'India',
        year: 2014,
      },
      {
        id: 'q2',
        level: 'Graduate degree',
        degree: 'B.E.',
        specialisation: 'Civil Engineering',
        institute: 'Sample College of Engineering',
        state: 'Tamil Nadu',
        country: 'India',
        year: 2011,
      },
    ],
    dateOfJoining: '2019-09-02',
    dateOfRetirement: '2050-03-31',
    recruitmentType: 'Direct recruit',
    grade: 'Selection Grade',
    payLevel: 'Level 13',
    seniorityNumber: 'S-0417',
    currentPosting: {
      postingIn: 'Tirunelveli',
      department: 'Revenue and Disaster Management',
      designation: 'Joint Collector',
      officeAddress: 'Collectorate Campus, Sample Road, Tirunelveli 627 000',
      phone: '0462 000 1100',
      fax: '0462 000 1101',
      postType: 'Permanent',
      locationChange: 'Within state',
      since: dateOnly(-420),
    },
    lastPromotionDate: dateOnly(-900),
    areaOfExposure: 'Land revenue, disaster management, rural development',
    sensitive: { class: 'General', religion: 'Hindu', caste: 'Sample community' },
    fieldMeta: {
      name: 'verified',
      gender: 'verified',
      dateOfBirth: 'verified',
      homeState: 'verified',
      nativeDistrict: 'verified',
      languages: 'self-reported',
      mobile1: 'self-reported',
      mobile2: 'self-reported',
      landline: 'self-reported',
      officialEmail: 'verified',
      personalEmail: 'self-reported',
      addressLine: 'self-reported',
      city: 'self-reported',
      pincode: 'self-reported',
      officerId: 'verified',
      ifhrmsId: 'verified',
      dateOfJoining: 'verified',
      dateOfRetirement: 'verified',
      batch: 'verified',
      recruitmentType: 'verified',
      grade: 'verified',
      payLevel: 'verified',
      seniorityNumber: 'verified',
    },
  };

  const departments = [
    'Public Department',
    'Finance Department',
    'Revenue and Disaster Management',
    'Rural Development and Panchayat Raj',
    'School Education',
    'Health and Family Welfare',
    'Agriculture and Farmers Welfare',
    'Municipal Administration and Water Supply',
  ];
  const districts = [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tirunelveli',
    'Salem',
    'Thanjavur',
    'Vellore',
    'Cuddalore',
    'Tiruchirappalli',
    'Chengalpattu',
  ];

  // --- career: 12 entries, newest first
  const career: T.CareerEntry[] = [
    {
      id: 'c1',
      kind: 'posting',
      fromDate: dateOnly(-420),
      designation: 'Joint Collector',
      department: 'Revenue and Disaster Management',
      postingIn: 'Tirunelveli',
      postType: 'Permanent',
      locationChange: 'Within state',
      orderId: 'd1',
    },
    {
      id: 'c2',
      kind: 'transfer',
      fromDate: dateOnly(-420),
      designation: 'Joint Collector',
      department: 'Revenue and Disaster Management',
      postingIn: 'Tirunelveli',
      locationChange: 'Within state',
      orderId: 'd2',
    },
    {
      id: 'c3',
      kind: 'promotion',
      fromDate: dateOnly(-900),
      designation: 'Joint Collector',
      department: 'Revenue and Disaster Management',
      fromGrade: 'Junior Time Scale',
      toGrade: 'Senior Time Scale',
      orderId: 'd3',
    },
    {
      id: 'c4',
      kind: 'posting',
      fromDate: dateOnly(-1100),
      toDate: dateOnly(-421),
      designation: 'Sub-Collector',
      department: 'Revenue and Disaster Management',
      postingIn: 'Madurai',
      postType: 'Temporary',
      locationChange: 'Within state',
      orderId: 'd4',
    },
    {
      id: 'c5',
      kind: 'transfer',
      fromDate: dateOnly(-1100),
      designation: 'Sub-Collector',
      department: 'Revenue and Disaster Management',
      postingIn: 'Madurai',
      locationChange: 'Within state',
    },
    {
      id: 'c6',
      kind: 'posting',
      fromDate: dateOnly(-1500),
      toDate: dateOnly(-1101),
      designation: 'Assistant Collector (Training)',
      department: 'Revenue and Disaster Management',
      postingIn: 'Coimbatore',
      postType: 'Temporary',
      locationChange: 'Within state',
    },
    {
      id: 'c7',
      kind: 'transfer',
      fromDate: dateOnly(-1500),
      designation: 'Assistant Collector (Training)',
      department: 'Revenue and Disaster Management',
      postingIn: 'Coimbatore',
      locationChange: 'Within state',
    },
    {
      id: 'c8',
      kind: 'posting',
      fromDate: dateOnly(-1900),
      toDate: dateOnly(-1501),
      designation: 'Deputy Secretary',
      department: 'Rural Development and Panchayat Raj',
      postingIn: 'Chennai',
      postType: 'Permanent',
      locationChange: 'In situ',
    },
    {
      id: 'c9',
      kind: 'transfer',
      fromDate: dateOnly(-1900),
      designation: 'Deputy Secretary',
      department: 'Rural Development and Panchayat Raj',
      postingIn: 'Chennai',
      locationChange: 'In situ',
    },
    {
      id: 'c10',
      kind: 'posting',
      fromDate: dateOnly(-2300),
      toDate: dateOnly(-1901),
      designation: 'Project Officer',
      department: 'Rural Development and Panchayat Raj',
      postingIn: 'Salem',
      postType: 'Temporary',
      locationChange: 'Within state',
    },
    {
      id: 'c11',
      kind: 'transfer',
      fromDate: dateOnly(-2300),
      designation: 'Project Officer',
      department: 'Rural Development and Panchayat Raj',
      postingIn: 'Salem',
      locationChange: 'Within state',
    },
    {
      id: 'c12',
      kind: 'promotion',
      fromDate: dateOnly(-2300),
      designation: 'Project Officer',
      department: 'Rural Development and Panchayat Raj',
      fromGrade: 'Probation',
      toGrade: 'Junior Time Scale',
    },
  ];

  const leaveBalance: T.LeaveBalance = {
    cl: { allowed: 20, used: 8 },
    rh: { allowed: 3, used: 1 },
    el: { allowed: 300, used: 180 },
    hpl: { allowed: 120, used: 30 },
  };

  const L = (
    type: string,
    f: number,
    t: number,
    status: T.LeaveRecord['status'],
    extra: Partial<T.LeaveRecord> = {},
  ): T.LeaveRecord => ({
    id: id('l'),
    type,
    from: dateOnly(f),
    to: dateOnly(t),
    days: t - f + 1,
    status,
    ...extra,
  });
  const leaves: T.LeaveRecord[] = [
    L('Casual leave', 9, 11, 'approved', { orderId: 'd5' }),
    L('Earned leave', 40, 46, 'approved'),
    L('Casual leave', -30, -28, 'approved', { orderId: 'd6' }),
    L('Restricted holiday', -60, -60, 'approved'),
    L('Earned leave', -95, -89, 'approved', { orderId: 'd7' }),
    L('Medical leave', -140, -136, 'approved'),
    L('Casual leave', -170, -170, 'approved'),
    L('Casual leave', -200, -199, 'approved'),
    L('Ex-India leave', -260, -252, 'approved', { orderId: 'd8' }),
    L('Casual leave', -300, -298, 'rejected'),
    L('Earned leave', -340, -334, 'approved'),
    L('Casual leave', -380, -379, 'approved'),
    L('Half-pay leave', -430, -426, 'approved'),
    L('Casual leave', -470, -470, 'withdrawn'),
    L('Special casual leave', -520, -519, 'approved'),
  ];
  const trainings: T.TrainingRecord[] = [
    {
      id: 't1',
      type: 'Induction',
      from: dateOnly(-2500),
      to: dateOnly(-2440),
      institute: 'Example Academy of Administration',
    },
    {
      id: 't2',
      type: 'Mid-career phase 1',
      from: dateOnly(-700),
      to: dateOnly(-680),
      institute: 'Sample Institute of Public Policy',
      orderId: 'd9',
    },
    {
      id: 't3',
      type: 'LBSNAA',
      from: dateOnly(-1700),
      to: dateOnly(-1690),
      institute: 'National Academy of Administration (sample)',
      country: undefined,
    },
    {
      id: 't4',
      type: 'District training',
      from: dateOnly(-1500),
      to: dateOnly(-1400),
      institute: 'Coimbatore District Training Centre',
    },
  ];
  const travels: T.TravelRecord[] = [
    {
      id: 'v1',
      kind: 'foreign',
      place: 'Singapore',
      from: dateOnly(-250),
      to: dateOnly(-245),
      purpose: 'Study visit: urban water management',
      status: 'approved',
      orderId: 'd10',
      politicalClearance: true,
      fcraClearance: true,
    },
    {
      id: 'v2',
      kind: 'foreign',
      place: 'Japan',
      from: dateOnly(-640),
      to: dateOnly(-632),
      purpose: 'Disaster preparedness workshop',
      status: 'approved',
      politicalClearance: true,
      fcraClearance: true,
    },
    {
      id: 'v3',
      kind: 'tour',
      place: 'Chennai',
      from: dateOnly(-90),
      to: dateOnly(-89),
      purpose: 'Review meeting',
      status: 'approved',
    },
    {
      id: 'v4',
      kind: 'tour',
      place: 'Madurai',
      from: dateOnly(-20),
      to: dateOnly(-19),
      purpose: 'Flood preparedness inspection',
      status: 'approved',
    },
    {
      id: 'v5',
      kind: 'private',
      place: 'Sri Lanka',
      from: dateOnly(-330),
      to: dateOnly(-325),
      status: 'approved',
    },
    {
      id: 'v6',
      kind: 'private',
      place: 'United Arab Emirates',
      from: dateOnly(-520),
      to: dateOnly(-514),
      status: 'approved',
    },
  ];
  const properties: T.PropertyRecord[] = [
    {
      id: 'p1',
      kind: 'immovable',
      type: 'Flat',
      details: 'Two-bedroom flat, Sample Heights, Chennai',
      funding: 'Loan',
      cost: 6500000,
      shownInReturn: true,
      selfOrFamily: 'Self',
    },
    {
      id: 'p2',
      kind: 'immovable',
      type: 'Agricultural land',
      details: '2.5 acres near Thanjavur (ancestral share)',
      funding: 'Inheritance',
      cost: 1800000,
      shownInReturn: true,
      selfOrFamily: 'Family',
    },
    {
      id: 'p3',
      kind: 'movable',
      type: 'Vehicle',
      details: 'Hatchback car, 2023 model',
      funding: 'Savings',
      cost: 950000,
      shownInReturn: false,
      selfOrFamily: 'Self',
    },
    {
      id: 'p4',
      kind: 'intimation',
      type: 'Gift',
      details: 'Gold jewellery received at a family wedding',
      funding: 'Gift',
      cost: 250000,
      shownInReturn: false,
      selfOrFamily: 'Self',
    },
  ];
  const B = (
    kind: T.BenefitRecord['kind'],
    summary: string,
    amount: number | undefined,
    d: number,
    status: T.BenefitRecord['status'] = 'approved',
  ): T.BenefitRecord => ({ id: id('b'), kind, summary, amount, date: dateOnly(d), status });
  const benefits: T.BenefitRecord[] = [
    B('ltc', `LTC, block ${year - 1} to ${year}: Chennai to Port Blair`, 85000, -200),
    B('ltc', `LTC, block ${year - 3} to ${year - 2}: Chennai to Delhi`, 62000, -900),
    B('medical', 'Medical claim: dental treatment', 14500, -120),
    B('medical', 'Medical claim: annual health check', 8200, -400),
    B('hba', 'House building advance: Sample Heights flat', 2500000, -1200),
    B('gpf', 'GPF withdrawal: higher education', 150000, -600),
    B('gpf', 'GPF withdrawal: medical', 250000, -300),
    B('mha-id', 'MHA identity card: renewal', undefined, -500),
    B('saf', 'SAF Games Village housing: applied', undefined, -80, 'with-desk'),
    B('education', 'Education: M.A. Public Policy', 120000, -2000),
  ];

  const docs: [string, string, string, string?][] = [
    ['d1', 'Posting order: Joint Collector, Tirunelveli', 'Posting', 'G.O. (Ms) No. 412'],
    ['d2', 'Transfer order', 'Transfer', 'G.O. (Ms) No. 410'],
    ['d3', 'Promotion order: Senior Time Scale', 'Promotion', 'G.O. (Ms) No. 96'],
    ['d4', 'Posting order: Sub-Collector, Madurai', 'Posting', 'G.O. (Ms) No. 233'],
    ['d5', 'Leave order: casual leave', 'Leave', 'Proc. No. 118'],
    ['d6', 'Leave order: casual leave', 'Leave', 'Proc. No. 77'],
    ['d7', 'Leave order: earned leave', 'Leave', 'Proc. No. 54'],
    ['d8', 'Leave order: Ex-India leave', 'Leave', 'G.O. (Ms) No. 301'],
    ['d9', 'Training nomination: mid-career phase 1', 'Training', 'Letter No. 88'],
    ['d10', 'Foreign visit permission: Singapore', 'Travel', 'G.O. (Ms) No. 187'],
    ['d11', 'HBA sanction order', 'Benefits', 'G.O. (Ms) No. 45'],
    ['d12', 'GPF withdrawal sanction', 'Benefits', 'Proc. No. 12'],
    ['d13', 'LTC sanction order', 'Benefits', 'Proc. No. 130'],
    ['d14', 'Property return acknowledgement', 'Property', 'Ack. No. 9921'],
    ['d15', 'Medical reimbursement order', 'Benefits', 'Proc. No. 66'],
  ];
  const linkMap: Record<string, [string, string, string]> = {
    d1: ['career', 'c1', '/file/career'],
    d2: ['career', 'c2', '/file/career'],
    d3: ['career', 'c3', '/file/career'],
    d4: ['career', 'c4', '/file/career'],
    d5: ['leave', 'l', '/file/leave'],
    d6: ['leave', 'l', '/file/leave'],
    d7: ['leave', 'l', '/file/leave'],
    d8: ['leave', 'l', '/file/leave'],
    d9: ['training', 't2', '/file/training'],
    d10: ['travel', 'v1', '/file/travel?tab=foreign'],
    d11: ['benefits', 'b', '/file/benefits?tab=housing'],
    d12: ['benefits', 'b', '/file/benefits?tab=gpf'],
    d13: ['benefits', 'b', '/file/benefits'],
    d14: ['property', 'p', '/file/property'],
    d15: ['benefits', 'b', '/file/benefits?tab=medical'],
  };
  const documents: T.DocumentItem[] = docs.map(([i, title, kind, num], k) => ({
    id: i,
    title,
    kind,
    orderNumber: num,
    date: dateOnly(-30 - k * 60),
    linkedTo: { kind: linkMap[i][0], id: linkMap[i][1], label: kind, to: linkMap[i][2] },
    fileUrl: SAMPLE_PDF,
  }));

  // --- requests (9: every status at least once)
  const step = (title: string, d: number, role?: string, note?: string): T.TimelineEntry => ({
    id: id('s'),
    title,
    date: at(d),
    role,
    note,
  });
  const R = (
    ref: number,
    type: string,
    title: string,
    status: T.Request['status'],
    holder: T.Request['holder'],
    values: T.Request['values'],
    d: number,
    tl: T.TimelineEntry[],
    extra: Partial<T.Request> = {},
  ): T.Request => ({
    id: `req-${ref}`,
    ref: `AGR-${year}-${String(1000 + ref)}`,
    type,
    title,
    status,
    holder,
    values,
    attachments: [],
    timeline: tl,
    notes: [],
    createdAt: at(d),
    submittedAt: status === 'draft' ? undefined : at(d),
    updatedAt: at(d + 1),
    ...extra,
  });
  const requests: T.Request[] = [
    R(
      1,
      'leave',
      `Leave, ${rangeTitle({ from: dmy(25), to: dmy(27) })}`,
      'draft',
      'officer',
      { type: 'Casual leave', dates: { from: dmy(25), to: dmy(27) } },
      -1,
      [],
      { lastStep: 1, updatedAt: at(-1, 17), submittedAt: undefined },
    ),
    R(
      2,
      'medical',
      'Medical claim, ₹18,400',
      'submitted',
      'desk',
      {
        description: 'Outpatient treatment and tests',
        hospital: 'Sample General Hospital',
        treatment: 'Orthopaedic care',
        cost: '18400',
        applicationDate: dmy(-1),
        dischargeEndorsed: 'Yes',
      },
      -1,
      [step('Sent', -1, 'You')],
      { attachments: [{ name: 'bills.pdf', size: 420000 }] },
    ),
    R(
      3,
      'education',
      'Education, PG Diploma in Disaster Management',
      'with-desk',
      'desk',
      {
        level: 'Diploma',
        degree: 'PG Diploma in Disaster Management',
        institute: 'Example Institute of Disaster Studies',
        completion: dmy(-20),
      },
      -6,
      [
        step('Sent', -6, 'You'),
        step('With desk', -4, 'Desk Assistant', 'Checking the certificate.'),
      ],
      {
        notes: [
          {
            id: id('n'),
            from: 'desk',
            text: 'We are checking the certificate. No action needed from you yet.',
            createdAt: at(-4),
          },
        ],
      },
    ),
    R(
      4,
      'tour',
      `Official tour to Madurai, ${rangeTitle({ from: dmy(20), to: dmy(21) })}`,
      'ready-for-approval',
      'desk-officer',
      {
        state: 'Tamil Nadu',
        district: 'Madurai',
        dates: { from: dmy(20), to: dmy(21) },
        purpose: 'Review of flood relief works',
        host: 'District Collector, Madurai',
      },
      -9,
      [
        step('Sent', -9, 'You'),
        step('With desk', -8, 'Desk Assistant'),
        step('Ready for approval', -3, 'Desk Assistant'),
      ],
    ),
    R(
      5,
      'ltc',
      `LTC, block ${year}`,
      'returned',
      'officer',
      {
        blockYear: String(year),
        dates: { from: dmy(60), to: dmy(66) },
        placeFrom: 'Chennai',
        placeTo: 'Kochi',
        selfOrFamily: 'Family',
        leaveAvailed: 'Earned leave',
      },
      -12,
      [
        step('Sent', -12, 'You'),
        step('With desk', -11, 'Desk Assistant'),
        step('Returned', -5, 'Desk Officer', 'Dates do not match your earned leave request.'),
      ],
      {
        returnReason:
          'The travel dates do not match your earned leave. Correct the dates and send again.',
      },
    ),
    R(
      6,
      'leave',
      `Leave, ${rangeTitle({ from: dmy(-30), to: dmy(-28) })}`,
      'approved',
      'none',
      { type: 'Casual leave', dates: { from: dmy(-30), to: dmy(-28) } },
      -40,
      [
        step('Sent', -40, 'You'),
        step('With desk', -39, 'Desk Assistant'),
        step('Approved', -34, 'Desk Officer'),
        step('Order issued', -33, 'Desk Officer'),
      ],
      { orderId: 'd6' },
    ),
    R(
      7,
      'gpf',
      'GPF withdrawal, ₹2,50,000',
      'approved',
      'none',
      { type: 'Part final', purpose: 'Medical', amount: '250000' },
      -310,
      [
        step('Sent', -310, 'You'),
        step('With desk', -309, 'Desk Assistant'),
        step('Approved', -300, 'Desk Officer'),
        step('Order issued', -299, 'Desk Officer'),
      ],
      { orderId: 'd12' },
    ),
    R(
      8,
      'private-visit',
      'Private visit to Singapore',
      'rejected',
      'none',
      {
        country: 'Singapore',
        dates: { from: dmy(-150), to: dmy(-145) },
        selfOrFamily: 'Family',
        cost: '220000',
      },
      -170,
      [
        step('Sent', -170, 'You'),
        step('With desk', -169, 'Desk Assistant'),
        step('Not approved', -160, 'Desk Officer'),
      ],
      { rejectReason: 'Sanction was sought after the travel dates had begun.' },
    ),
    R(
      9,
      'training-request',
      'Training request: Data for district administration',
      'withdrawn',
      'none',
      { title: 'Data for district administration', for: 'Myself' },
      -50,
      [
        step('Sent', -50, 'You'),
        step('With desk', -49, 'Desk Assistant'),
        step('Withdrawn', -45, 'You'),
      ],
    ),
  ];
  // an approved future leave so the overlap check has something to hit
  requests.push(
    R(
      10,
      'leave',
      `Leave, ${rangeTitle({ from: dmy(40), to: dmy(46) })}`,
      'approved',
      'none',
      { type: 'Earned leave', dates: { from: dmy(40), to: dmy(46) } },
      -20,
      [
        step('Sent', -20, 'You'),
        step('With desk', -19, 'Desk Assistant'),
        step('Approved', -14, 'Desk Officer'),
        step('Order issued', -13, 'Desk Officer'),
      ],
      { orderId: 'd7' },
    ),
  );

  const N = (
    type: T.Notification['type'],
    text: string,
    route: string,
    d: number,
    read: boolean,
  ): T.Notification => ({
    id: id('n'),
    type,
    text,
    targetRoute: route,
    createdAt: at(d, 9 + (n % 8)),
    read,
  });
  const notifications: T.Notification[] = [
    N(
      'request',
      'Your LTC, block ' +
        year +
        ' was returned. Reason: The travel dates do not match your earned leave. Correct the dates and send again.',
      '/requests/req-5',
      -5,
      false,
    ),
    N(
      'request',
      'Your Education, PG Diploma in Disaster Management is now with the desk.',
      '/requests/req-3',
      -4,
      false,
    ),
    N(
      'reply',
      'An officer replied to your discussion “Flood relief rosters”.',
      '/community/discussions/post-1',
      -2,
      false,
    ),
    N(
      'circular',
      'New circular: Revised procedure for GPF part-final withdrawal.',
      '/library/circulars',
      -1,
      false,
    ),
    N(
      'request',
      'Your Official tour to Madurai is ready for approval.',
      '/requests/req-4',
      -3,
      true,
    ),
    N(
      'idea-status',
      'Your idea “Single window for flood-relief claims” is now under review.',
      '/community/ideas/idea-1',
      -6,
      true,
    ),
    N(
      'training',
      'New training announced: Data-driven district administration.',
      '/learn/trainings',
      -8,
      true,
    ),
    N('request', `Your ${requests[5].title} was approved.`, '/requests/req-6', -33, true),
    N(
      'reply',
      'An officer replied to your comment on “Village-level water audits”.',
      '/community/ideas/idea-3',
      -9,
      true,
    ),
    N(
      'circular',
      'New announcement: Annual property return due dates.',
      '/library/announcements',
      -12,
      true,
    ),
  ];

  // --- people
  const first = [
    'Karthik',
    'Priya',
    'Senthil',
    'Lakshmi',
    'Arjun',
    'Divya',
    'Murugan',
    'Kavitha',
    'Ravi',
    'Meena',
    'Vignesh',
    'Anitha',
    'Prakash',
    'Sangeetha',
    'Balaji',
    'Revathi',
    'Gokul',
    'Nandhini',
    'Harish',
    'Janani',
    'Surya',
    'Deepa',
    'Manoj',
    'Pooja',
    'Ilango',
    'Thenmozhi',
    'Aravind',
    'Selvi',
    'Dinesh',
    'Yamini',
  ];
  const last = [
    'Kumar',
    'Natarajan',
    'Subramanian',
    'Raman',
    'Pillai',
    'Chandran',
    'Iyer',
    'Nair',
    'Varadharajan',
    'Sekar',
    'Ganesan',
    'Narayanan',
    'Mohan',
    'Rajendran',
    'Palani',
    'Thangavel',
  ];
  const desigs: Record<string, string[]> = {
    IAS: [
      'Collector',
      'Joint Collector',
      'Sub-Collector',
      'Deputy Secretary',
      'Director',
      'Commissioner',
      'Additional Secretary',
    ],
    IPS: ['Superintendent of Police', 'Deputy Inspector General', 'Commissioner of Police'],
    IFS: ['Conservator of Forests', 'District Forest Officer'],
    TNCS: ['Revenue Divisional Officer', 'Deputy Collector', 'Section Officer'],
  };
  const services: T.Colleague['service'][] = [
    'IAS',
    'IAS',
    'IAS',
    'IAS',
    'IAS',
    'IAS',
    'IPS',
    'IFS',
    'TNCS',
    'IAS',
    'IAS',
    'TNCS',
  ];
  const areas = [
    'Land revenue',
    'Rural development',
    'Public health',
    'School education',
    'Disaster management',
    'Urban water supply',
    'Agriculture',
    'Finance and budget',
    'Coastal management',
  ];
  const colleagues: T.Colleague[] = Array.from({ length: 60 }, (_, i) => {
    const service = services[i % services.length];
    const name =
      i === 7
        ? 'Thiruvalluvar Subramanian Venkatachalapathi Ramanujam Iyengar'
        : `${first[i % first.length]} ${last[(i * 3) % last.length]}`;
    const share = i % 2 === 0;
    const dep =
      i === 11
        ? 'Rural Development and Panchayat Raj, Department of Panchayat Raj Institutions and Rural Local Bodies Coordination'
        : departments[i % departments.length];
    const slug = name
      .toLowerCase()
      .replace(/[^a-z]+/g, '.')
      .slice(0, 24);
    return {
      id: `col-${i + 1}`,
      name,
      designation: desigs[service][i % desigs[service].length],
      service,
      batch: service === 'IAS' ? 2005 + (i % 18) : undefined,
      district: districts[i % districts.length],
      department: dep,
      areaOfExposure: areas[i % areas.length],
      statusNote: i % 17 === 3 ? 'On leave' : i % 23 === 5 ? 'On training' : undefined,
      photoUrl: i % 3 === 2 ? undefined : photoDataUri(i + 2),
      sharedContact: share
        ? {
            phone: `+91 90000 ${String(30000 + i * 17).slice(0, 5)}`,
            email: i % 4 === 0 ? `${slug}@example.test` : undefined,
          }
        : undefined,
      officialEmail: `${slug}@example.gov.test`,
      savedByMe: false,
    };
  });

  const ranks = [
    'Secretary',
    'Special Secretary',
    'Additional Secretary',
    'Joint Secretary',
    'Deputy Secretary',
    'Under Secretary',
    'Section Officer',
    'Assistant Section Officer',
  ];
  const subjectPool = [
    'GPF',
    'Budget estimates',
    'Sugarcane procurement',
    'Land acquisition',
    'Disaster relief',
    'Pension cases',
    'Service matters',
    'Audit objections',
    'Court cases',
    'Grants to local bodies',
    'School infrastructure',
    'Scholarships',
    'Hospital equipment',
    'Drug supply',
    'Crop insurance',
    'Irrigation tanks',
    'Water supply schemes',
    'Street lighting',
    'Property tax',
    'Rural roads',
    'Housing schemes',
    'Training programmes',
    'Leave and travel',
    'Cadre management',
  ];
  const depts: T.Department[] = departments.map((name, di) => ({
    id: `dep-${di + 1}`,
    name,
    posts: ranks.map((rank, ri) => {
      const sectionCount = ri >= 6 ? 2 : 3 + (ri % 2);
      const officer = colleagues[(di * 8 + ri) % colleagues.length];
      const notOnFile = di === 2 && ri === 3;
      return {
        id: `post-${di + 1}-${ri + 1}`,
        title: `${rank}${ri === 0 ? '' : ri < 5 ? ` (${['Policy', 'Establishment', 'Finance', 'Schemes', 'Coordination'][ri % 5]})` : ''}`,
        rank,
        officerId: notOnFile ? undefined : officer.id,
        officerName: notOnFile ? undefined : officer.name,
        sections: Array.from({ length: sectionCount }, (_, si) => ({
          id: `sec-${di + 1}-${ri + 1}-${si + 1}`,
          name:
            ['Establishment', 'Accounts', 'Schemes', 'Coordination', 'Legal', 'Monitoring'][
              (si + ri) % 6
            ] + (si > 2 ? ' II' : ''),
          subjects: Array.from(
            { length: 4 + ((di + ri + si) % 5) },
            (_, k) => subjectPool[(di * 5 + ri * 3 + si * 7 + k * 2) % subjectPool.length],
          ),
        })),
      };
    }),
  }));

  const experts: T.Expert[] = [
    {
      id: 'ex1',
      kind: 'organisation',
      name: 'Example Water Foundation',
      description: 'Village water audits and tank restoration support.',
      website: 'https://example.org/water',
      phone: '+91 44 0000 1101',
      addedBy: 'Karthik Kumar',
    },
    {
      id: 'ex2',
      kind: 'organisation',
      name: 'Sample Disaster Response Trust',
      description: 'Trained volunteers and boats for flood response.',
      website: 'https://example.org/response',
      phone: '+91 44 0000 1102',
      addedBy: 'Priya Natarajan',
    },
    {
      id: 'ex3',
      kind: 'individual',
      name: 'Dr. Example Mathivanan',
      description: 'Soil scientist who advises on saline-affected farmland.',
      phone: '+91 90000 40001',
      addedBy: 'Senthil Raman',
    },
    {
      id: 'ex4',
      kind: 'individual',
      name: 'Ms. Sample Rajeswari',
      description: 'Legal expert on land acquisition and tenancy law.',
      website: 'https://example.org/law',
      phone: '+91 90000 40002',
      addedBy: 'Lakshmi Iyer',
    },
    {
      id: 'ex5',
      kind: 'organisation',
      name: 'Demo Health Collective',
      description: 'Mobile clinics and training for rural health workers.',
      website: 'https://example.org/health',
      addedBy: 'Arjun Nair',
    },
    {
      id: 'ex6',
      kind: 'individual',
      name: 'Mr. Placeholder Anbarasan',
      description: 'Data analyst who builds simple dashboards for districts.',
      phone: '+91 90000 40003',
      addedBy: 'Divya Sekar',
    },
  ];
  const trainingEvents: T.TrainingEvent[] = [
    {
      id: 'te1',
      kind: 'official',
      title: 'Data-driven district administration',
      description: 'Two days on using dashboards and field data for decisions.',
      date: dateOnly(5),
      time: '10:00',
      links: [{ label: 'Joining instructions', url: 'https://example.org/join1' }],
      interestCount: 0,
      interestedByMe: false,
      past: false,
    },
    {
      id: 'te2',
      kind: 'official',
      title: 'Disaster management refresher',
      description: 'Flood and cyclone response planning for district teams.',
      date: dateOnly(18),
      time: '09:30',
      links: [],
      interestCount: 0,
      interestedByMe: false,
      past: false,
    },
    {
      id: 'te3',
      kind: 'official',
      title: 'Public finance for administrators',
      description: 'Budgets, grants and audit for senior officers.',
      date: dateOnly(35),
      time: '10:30',
      links: [{ label: 'Open resource', url: 'https://example.org/join3' }],
      interestCount: 0,
      interestedByMe: false,
      past: false,
    },
    {
      id: 'te4',
      kind: 'requested',
      title: 'Writing short, clear government orders',
      description: 'A practical workshop on drafting orders and notes.',
      links: [],
      interestCount: 14,
      interestedByMe: false,
      past: false,
    },
    {
      id: 'te5',
      kind: 'requested',
      title: 'Mental health for officers in field posts',
      description: 'Managing stress and burnout in demanding postings.',
      links: [],
      interestCount: 31,
      interestedByMe: true,
      past: false,
    },
    {
      id: 'te6',
      kind: 'official',
      title: 'Right to Information: practice and pitfalls',
      description: 'Handling RTI requests and appeals.',
      date: dateOnly(-30),
      time: '11:00',
      links: [],
      interestCount: 0,
      interestedByMe: false,
      past: true,
    },
  ];
  const resources: T.Resource[] = [
    {
      id: 'r1',
      name: 'A short course on public budgeting',
      note: 'Free, self-paced, with exercises.',
      links: [{ label: 'Course page', url: 'https://example.org/budget' }],
      sharedBy: 'Karthik Kumar',
    },
    {
      id: 'r2',
      name: 'Land records: a field guide',
      note: 'Plain explanations of patta, chitta and adangal.',
      links: [
        { label: 'Read online', url: 'https://example.org/land' },
        { label: 'Download PDF', url: 'https://example.org/land.pdf' },
      ],
      sharedBy: 'Priya Natarajan',
    },
    {
      id: 'r3',
      name: 'Disaster response videos',
      links: [{ label: 'Playlist', url: 'https://example.org/dr' }],
      sharedBy: 'Senthil Raman',
    },
    {
      id: 'r4',
      name: 'Writing for government',
      note: 'Short articles on drafting clearly.',
      links: [
        { label: 'Article one', url: 'https://example.org/w1' },
        { label: 'Article two', url: 'https://example.org/w2' },
        { label: 'Article three', url: 'https://example.org/w3' },
      ],
      sharedBy: 'Lakshmi Iyer',
    },
    {
      id: 'r5',
      name: 'Rural sanitation case studies',
      links: [{ label: 'Case studies', url: 'https://example.org/sanitation' }],
      sharedBy: 'Arjun Nair',
    },
    {
      id: 'r6',
      name: 'Introduction to open data',
      note: 'For officers new to data work.',
      links: [{ label: 'Start here', url: 'https://example.org/data' }],
      sharedBy: 'Divya Sekar',
    },
  ];
  const awards: T.Award[] = [
    {
      id: 'a1',
      name: 'Excellence in Public Administration',
      description: 'Recognises outstanding work that improved services for citizens.',
      eligibility: 'Civil servants with at least five years of service.',
      timeline: 'Applications close in the next two months. Results are announced in January.',
      opensOn: dateOnly(-20),
      closesOn: dateOnly(40),
      link: 'https://example.org/award1',
      awardees: [
        { year: year - 1, name: 'Example Awardee One', designation: 'District Collector' },
        { year: year - 2, name: 'Example Awardee Two', designation: 'Commissioner' },
      ],
    },
    {
      id: 'a2',
      name: 'Innovation in Governance',
      description: 'For new methods that made a scheme easier to use.',
      eligibility: 'Any serving officer or team.',
      timeline: 'Open until the end of the financial year.',
      opensOn: dateOnly(-5),
      closesOn: dateOnly(120),
      link: 'https://example.org/award2',
      awardees: [],
    },
    {
      id: 'a3',
      name: 'Service to Rural Communities',
      description: 'For sustained work in remote areas.',
      eligibility: 'Officers posted in rural districts.',
      timeline: 'Last cycle closed. The next cycle opens next year.',
      opensOn: dateOnly(-200),
      closesOn: dateOnly(-60),
      awardees: [],
    },
    {
      id: 'a4',
      name: 'Disaster Response Commendation',
      description: 'For leadership during a flood, cyclone or similar event.',
      eligibility: 'Officers who led a response in the past year.',
      timeline: 'Closed. Awardees are listed.',
      opensOn: dateOnly(-300),
      closesOn: dateOnly(-120),
      awardees: [{ year: year - 1, name: 'Example Awardee Three', designation: 'Joint Collector' }],
    },
  ];

  const lib: T.LibraryItem[] = [];
  const libAdd = (kind: T.LibraryItem['kind'], title: string, extra: Partial<T.LibraryItem> = {}) =>
    lib.push({
      id: id('lib'),
      kind,
      title,
      date: dateOnly(-5 * lib.length - 3),
      fileUrl: SAMPLE_PDF,
      ...extra,
    });
  [
    'All India Services (Conduct) Rules',
    'All India Services (Leave) Rules',
    'All India Services (Discipline and Appeal) Rules',
    'All India Services (Death-cum-Retirement Benefits) Rules',
    'Tamil Nadu Government Servants’ Conduct Rules',
    'General Provident Fund (Central Services) Rules',
  ].forEach((t, i) =>
    libAdd('rule', t, {
      number: `Rule set ${i + 1}`,
      description: 'The consolidated text with amendments.',
    }),
  );
  const circSubjects = [
    'Revised procedure for GPF part-final withdrawal',
    'Leave travel concession: block year clarification',
    'Annual property return: last date and format',
    'Medical reimbursement: updated hospital list',
    'House building advance: revised limits',
    'Foreign visit permission: required clearances',
    'Casual leave: counting of holidays',
    'Earned leave encashment: clarification',
    'Training nominations: new procedure',
    'Identity card renewal: process',
    'Special entry: acknowledgement of service record',
    'Transfer and posting: guidelines',
    'Official tour: advance and settlement',
    'Pay fixation on promotion',
    'Death-cum-retirement benefits: forms',
    'Performance appraisal: timelines',
    'Deputation to the Centre: eligibility',
    'Study leave: conditions',
    'Child care leave: clarification',
    'Maternity and paternity leave: summary',
    'Observance of holidays: list',
    'Use of official vehicles',
    'Declaration of assets: guidance',
    'Gift rules: limits',
    'Conduct on social media: advisory',
  ];
  circSubjects.forEach((s, i) =>
    libAdd(i % 7 === 6 ? 'go' : 'circular', s, {
      number: `${i % 7 === 6 ? 'G.O. (Ms) No.' : 'Circular No.'} ${20 + i * 3}/${year - (i % 3)}`,
      type: i % 11 === 10 ? 'Special entry' : i % 7 === 6 ? 'GO' : 'Circular',
      topic: ['GPF', 'Leave', 'LTC', 'Medical'][i % 4],
    }),
  );
  [
    'Leave application (blank)',
    'LTC claim form',
    'Medical reimbursement claim',
    'GPF withdrawal application',
    'House building advance application',
    'Annual property return',
    'Foreign visit permission form',
    'Intimation of transaction',
    'MHA identity card application',
    'Change of address form',
  ].forEach((t, i) =>
    libAdd('form', t, {
      situation: [
        'you need to apply for leave',
        'you travel with your family on leave',
        'you pay for treatment',
        'you need a part of your savings',
        'you plan to build or buy a home',
        'the annual return is due',
        'you plan to travel abroad',
        'you buy or sell property',
        'your card is new or expires',
        'you move to a new home',
      ][i],
    }),
  );
  lib
    .filter((l) => l.kind === 'circular' || l.kind === 'go')
    .forEach((l) => (l.number = l.number!.replace(/\/\d{4}$/, `/${l.date.slice(0, 4)}`)));
  const faqs: [string, string, string][] = [
    [
      'Who can claim LTC?',
      'Every serving officer can claim LTC once in each block year for self and family. Check the circular for the current block.',
      'LTC',
    ],
    [
      'How many LTC journeys are allowed in a block?',
      'Two journeys are allowed in a four-year block, one to the home town and one to any place in India.',
      'LTC',
    ],
    [
      'Which leave can I combine with LTC?',
      'Casual leave or earned leave. Show the leave you availed in your claim.',
      'LTC',
    ],
    [
      'What bills do I attach to a medical claim?',
      'Original bills, prescriptions and, for admission, a discharge summary endorsed by the hospital.',
      'Medical',
    ],
    [
      'How long does a medical claim take?',
      'The desk reviews claims in the order received. You can follow the status on My requests.',
      'Medical',
    ],
    [
      'Can I claim for family members?',
      'Yes, for dependent family members. Choose Family in the claim form.',
      'Medical',
    ],
    [
      'How much can I withdraw from my GPF?',
      'The limit depends on the purpose. Part-final withdrawals have a separate ceiling from temporary advances.',
      'GPF',
    ],
    [
      'Do I need to attach papers for GPF?',
      'Only for some purposes, such as higher education or house construction.',
      'GPF',
    ],
    [
      'When is a 90 percent withdrawal allowed?',
      'In the final years before retirement, as set out in the rules.',
      'GPF',
    ],
    [
      'How do I apply for casual leave?',
      'Choose Apply for leave on Home, pick Casual leave and the dates, and send.',
      'Leave',
    ],
    [
      'What happens if my dates overlap?',
      'The portal blocks it and tells you which request you overlap with.',
      'Leave',
    ],
    [
      'Can I apply for leave in the past?',
      'Only for Leave, Medical claims and LTC, with a notice.',
      'Leave',
    ],
    [
      'How do I change my mobile number?',
      'Use Update my details, choose Contact. It changes at once.',
      'Other',
    ],
    [
      'Who can see my phone number?',
      'Only you, unless you switch on sharing in Account and settings.',
      'Other',
    ],
    [
      'How do I report a mistake in my file?',
      'Use Report a correction and tell us what is wrong.',
      'Other',
    ],
  ];
  faqs.forEach(([q, a, topic]) => libAdd('faq', q, { answer: a, topic, fileUrl: undefined }));
  [
    'Annual property return due dates',
    'Portal maintenance on Sunday',
    'New training calendar published',
    'Revised LTC block year notice',
    'Holiday list updated',
    'Awards nominations open',
    'Help desk timings changed',
    'Identity card camp in Chennai',
  ].forEach((t, i) =>
    libAdd('announcement', t, {
      description: 'Please read the notice and share it with your office.',
      pinned: i < 2,
      date: dateOnly(-i * 4 - 1),
    }),
  );

  // --- community
  const person = (c: number): T.PersonRef => {
    const x = colleagues[c];
    return {
      id: x.id,
      name: x.name,
      designation: x.designation,
      department: x.department,
      district: x.district,
    };
  };
  const idea = (
    i: number,
    title: string,
    type: T.IdeaType,
    status: IdeaStatus,
    author: T.PersonRef,
    backers: number,
    mineBack: boolean,
    extra: Partial<Db['ideas'][number]> = {},
  ): Db['ideas'][number] => ({
    id: `idea-${i}`,
    title,
    type,
    description:
      'A short description of the idea, why it matters and how it could be tried first in one district before wider use. The department can review and say what would be needed.',
    visibility: 'all',
    status,
    author,
    authorId: author.id,
    department: author.department,
    district: author.district,
    attachments: [],
    backers: [
      ...Array.from({ length: backers }, (_, k) => `col-${k + 1}`),
      ...(mineBack ? [ME] : []),
    ],
    grievance: i % 5 === 0,
    createdAt: at(-i * 3 - 1),
    ...extra,
  });
  const ideas: Db['ideas'] = [
    idea(
      1,
      'Single window for flood-relief claims',
      'Flagship initiative',
      'under-review',
      me,
      24,
      false,
      { budget: '₹25 lakh' },
    ),
    idea(
      2,
      'Monthly data review in every block office',
      'Best practice',
      'accepted',
      person(1),
      41,
      true,
    ),
    idea(3, 'Village-level water audits', 'Pilot proposal', 'submitted', person(2), 12, true),
    idea(
      4,
      'Faster approval for small-tank repairs',
      'Policy request',
      'not-taken-forward',
      person(3),
      18,
      false,
      { statusReason: 'Covered by the existing emergency repair order.' },
    ),
    idea(
      5,
      'Shared vehicle pool for field inspections',
      'Resource request',
      'submitted',
      person(4),
      9,
      false,
    ),
    idea(
      6,
      'One portal for inter-department file status',
      'Coordination issue',
      'under-review',
      person(5),
      33,
      true,
      { grievance: true },
    ),
    idea(
      7,
      'Simplify the scheme-eligibility checklist',
      'Scheme feedback',
      'accepted',
      person(6),
      27,
      false,
    ),
    idea(
      8,
      'Road link for the last hamlet in hill blocks',
      'Last-mile gap',
      'submitted',
      person(7),
      15,
      false,
      { grievance: true },
    ),
    idea(
      9,
      'Night-time patrol coordination in border blocks',
      'Law and order',
      'under-review',
      person(8),
      6,
      false,
    ),
    idea(
      10,
      'Standard format for handing over charge',
      'General suggestion',
      'accepted',
      me,
      19,
      false,
    ),
    idea(
      11,
      'Open data for rainfall and tank levels',
      'Pilot proposal',
      'not-taken-forward',
      person(9),
      11,
      true,
      { statusReason: 'Planned as part of an existing state data initiative.' },
    ),
    idea(
      12,
      'Mentor pairing for new officers',
      'Best practice',
      'submitted',
      person(10),
      22,
      false,
    ),
  ];
  ideas[1].createdAt = at(-4);
  const comments: Db['comments'] = [
    {
      id: 'cm1',
      parentId: 'idea-1',
      author: person(1),
      authorId: 'col-2',
      text: 'This would save our teams a lot of repeat work. Could we start with two districts?',
      createdAt: at(-3),
    },
    {
      id: 'cm2',
      parentId: 'idea-1',
      author: person(2),
      authorId: 'col-3',
      text: 'Happy to share the claim formats we use in Salem.',
      createdAt: at(-2),
    },
    {
      id: 'cm3',
      parentId: 'idea-3',
      author: me,
      authorId: ME,
      text: 'We tried a version of this in Madurai. It worked best with school students helping.',
      createdAt: at(-8),
    },
  ];
  const posts: Db['posts'] = [];
  const post = (
    i: number,
    kind: T.Post['kind'],
    title: string,
    anonymous: boolean,
    c: number,
    extra: Partial<Db['posts'][number]> = {},
  ) =>
    posts.push({
      id: `post-${i}`,
      kind,
      title,
      body: 'A few lines of context. Others who have faced the same situation are invited to reply with what worked.',
      audience: 'all',
      anonymous,
      askSeniors: false,
      author: c < 0 ? me : person(c),
      authorId: c < 0 ? ME : `col-${c + 1}`,
      lastActivityAt: at(-i),
      createdAt: at(-i * 2),
      ...extra,
    });
  post(1, 'discussion', 'Flood relief rosters: how do you split shifts?', false, -1, {
    askSeniors: true,
  });
  post(2, 'discussion', 'Handling a sudden transfer in the middle of a scheme review', true, 3);
  post(3, 'experience', 'What worked: a weekly grievance hour in every taluk', false, 4);
  post(4, 'poll', 'Which training topic matters most this year?', false, 5, {
    poll: {
      options: [
        { id: 'o1', label: 'Data for administration', votes: 18 },
        { id: 'o2', label: 'Public finance', votes: 11 },
        { id: 'o3', label: 'Disaster response', votes: 24 },
        { id: 'o4', label: 'Writing and drafting', votes: 7 },
      ],
      closesAt: at(14),
    },
  });
  post(5, 'discussion', 'Is anyone using QR-based attendance for field staff?', true, 6);
  post(6, 'discussion', 'Advice on balancing field work and family', true, 7, { askSeniors: true });
  post(7, 'experience', 'Lessons from a cyclone response in a coastal district', false, 8);
  post(8, 'discussion', 'Good tools for tracking court cases?', false, 9, {
    audience: 'department',
  });
  post(9, 'discussion', 'Reading list for a new Sub-Collector', false, 10, {
    audience: 'district',
  });
  post(10, 'discussion', 'Property return: how do you keep records organised?', false, 11);
  const seniors = (i: number): T.PersonRef => ({
    ...person(i),
    designation: 'Principal Secretary (earlier batch)',
  });
  const rep = (
    parent: string,
    a: T.PersonRef | 'anonymous',
    text: string,
    d: number,
    replyTo?: string,
  ): Db['comments'][number] => ({
    id: id('rp'),
    parentId: parent,
    author: a,
    authorId: a === 'anonymous' ? ME : a.id,
    text,
    createdAt: at(d),
    replyTo,
  });
  comments.push(
    rep(
      'post-1',
      seniors(20),
      'Rotate shifts weekly and keep one officer on call. Put the roster on a shared sheet that every block office can see.',
      -1,
    ),
    rep(
      'post-1',
      person(12),
      'We also paired each shift with a driver and a data entry operator. It kept reports consistent.',
      -1,
    ),
    rep(
      'post-2',
      seniors(21),
      'Write a one-page handover with open items, contacts and dates. Share it before you leave.',
      -2,
    ),
    rep('post-2', 'anonymous', 'Thank you. That is helpful.', -1),
    rep('post-3', person(13), 'How many complaints did you get in the first month?', -4),
    rep('post-5', person(14), 'Yes, in two blocks. Happy to share the vendor details.', -3),
    rep(
      'post-6',
      seniors(22),
      'Protect one evening a week. It becomes a habit and your team learns to plan around it.',
      -4,
    ),
  );
  const art = (
    i: number,
    title: string,
    kind: T.Article['kind'],
    status: T.Article['status'],
    c: number,
    tags: string[],
    extra: Partial<Db['articles'][number]> = {},
  ): Db['articles'][number] => ({
    id: `art-${i}`,
    title,
    authorRole: ['District Collector', 'Sub-Collector', 'Joint Collector', 'Commissioner'][i % 4],
    author: c < 0 ? me : person(c),
    authorId: c < 0 ? ME : `col-${c + 1}`,
    district: districts[i % districts.length],
    summary:
      'A short summary of the problem faced and the approach that worked, written for officers who may face the same.',
    tags,
    status,
    kind,
    attachments: [],
    createdAt: at(-i * 5),
    sections: [
      { heading: 'The problem', body: 'Describe what was not working and who it affected.' },
      { heading: 'What we tried', body: 'The steps taken, in order, with who did what.' },
      { heading: 'What changed', body: 'Results after three months, with simple numbers.' },
    ],
    ...extra,
  });
  const articles: Db['articles'] = [
    art(1, 'Clearing a backlog of 3,000 mutation files in 90 days', 'article', 'published', 11, [
      'land revenue',
      'backlog',
    ]),
    art(2, 'A simple dashboard for monitoring school attendance', 'article', 'published', 12, [
      'education',
      'data',
    ]),
    art(
      3,
      'Running a cyclone shelter drill that people actually attend',
      'article',
      'published',
      13,
      ['disaster', 'community'],
    ),
    art(4, 'Restoring a village tank with local donations', 'article', 'published', 14, [
      'water',
      'community',
    ]),
    art(5, 'How we cut hospital stock-outs by half', 'article', 'published', -1, [
      'health',
      'supply',
    ]),
    art(6, 'Making the grievance day work in a large taluk', 'article', 'published', 15, [
      'grievance',
      'administration',
    ]),
    art(7, 'Handover note: Joint Collector, Madurai', 'handover-note', 'published', 16, [
      'handover',
      'revenue',
    ]),
    art(8, 'Handover note: draft for my next posting', 'handover-note', 'draft', -1, ['handover']),
  ];

  const tasks: T.DeskTask[] = [
    {
      id: 'tk1',
      text: 'Review the flood preparedness plan',
      done: false,
      due: dateOnly(3),
      createdAt: at(-4),
    },
    {
      id: 'tk2',
      text: 'Send comments on the draft circular',
      done: false,
      due: dateOnly(6),
      createdAt: at(-3),
    },
    {
      id: 'tk3',
      text: 'Plan the block office visits for next month',
      done: false,
      createdAt: at(-2),
    },
    { id: 'tk4', text: 'Update the handover note', done: true, createdAt: at(-9) },
  ];
  const notes: T.DeskNote[] = [
    { id: 'nt1', text: 'Ask the finance team about the grant release date.', createdAt: at(-5) },
    {
      id: 'nt2',
      text: 'Ideas for the monthly review: show one number per block.',
      createdAt: at(-3),
    },
    { id: 'nt3', text: 'Call the water foundation about the tank audit.', createdAt: at(-1) },
  ];
  const saved: T.SavedItem[] = [
    { id: 'sv1', kind: 'person', refId: 'col-3' },
    { id: 'sv2', kind: 'article', refId: 'art-1' },
    { id: 'sv3', kind: 'idea', refId: 'idea-2' },
    { id: 'sv4', kind: 'library', refId: lib.find((l) => l.kind === 'circular')!.id },
    { id: 'sv5', kind: 'library', refId: lib.find((l) => l.kind === 'form')!.id },
  ];
  colleagues[2].savedByMe = true;

  void rand;
  return {
    officer,
    career,
    leaveBalance,
    leaves,
    trainings,
    travels,
    properties,
    benefits,
    documents,
    requests,
    notifications,
    ideas,
    comments,
    posts,
    articles,
    colleagues,
    departments: depts,
    experts,
    trainingEvents,
    resources,
    awards,
    library: lib,
    tasks,
    notes,
    saved,
    settings: {
      sharePhone: false,
      shareEmail: false,
      notify: { requests: true, replies: true, circulars: true, trainings: false },
    },
    pollVotes: {},
    seq: 1000,
  };
}
