// All data here is fictional. Dates are generated relative to today so it never looks old.
import { formatDMY } from '@/domain/dates';
import type * as T from '@/domain/types';
import type { IdeaStatus } from '@/domain/status';
import { rangeTitle } from '@/config/requests';
import { features } from '@/config/features';

const DAY = 86400000;
export const SAMPLE_PDF = `${import.meta.env.BASE_URL}sample.pdf`;

export interface Db {
  officer: T.Officer;
  career: T.CareerEntry[];
  leaveBalance: T.LeaveBalance;
  leaves: T.LeaveRecord[];
  ltcs: T.LtcRecord[];
  medicals: T.MedicalClaim[];
  gpfs: T.GpfWithdrawal[];
  /** Entries of service cards added by config only, by card key. */
  serviceRecords: Record<string, T.ServiceRecord[]>;
  pendingChanges: T.PendingChange[];
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
  colleagues: T.Colleague[];
  departments: T.Department[];
  experts: T.Expert[];
  trainingEvents: T.TrainingEvent[];
  resources: T.Resource[];
  awards: T.Award[];
  library: T.LibraryItem[];
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
    allotmentYear: 2018,
    batch: 2018,
    cadreAndDomicile: 'Tamil Nadu, domicile Tamil Nadu',
    status: 'serving',
    dateOfBirth: '1990-03-14',
    gender: 'Female',
    languages: ['Tamil', 'English', 'Hindi'],
    contact: {
      mobile1: '+91 90000 10417',
      officialEmail: 'aadhira.valluvan@example.gov.test',
      personalEmail: 'aadhira.v@example.test',
    },
    address: { line: '12, Sample Colony, Sample Nagar', city: 'Tirunelveli', pincode: '627000' },
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
    classPayScale: 'Level 13',
    seniorityNumber: 'S-0417',
    currentPosting: {
      postingIn: 'Tirunelveli',
      department: 'Revenue and Disaster Management',
      designation: 'Joint Collector',
      postType: 'Permanent',
      locationChange: 'Within state',
      since: dateOnly(-420),
    },
    officeContact: {
      address: 'Collectorate Campus, Sample Road, Tirunelveli 627000',
      phone: '0462 000 1100',
      fax: '0462 000 1101',
      mobile: '+91 90000 11100',
    },
    lastPromotionDate: dateOnly(-900),
    areaOfExposure: 'Land revenue, disaster management, rural development',
    religion: 'Hindu',
    caste: 'Sample community',
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

  // --- career: postings and promotions, newest first
  const posting = (
    cid: string,
    from: number,
    to: number | undefined,
    designation: string,
    department: string,
    postingIn: string,
    postType: string,
    orderId?: string,
  ): T.CareerEntry => ({
    id: cid,
    kind: 'posting',
    fromDate: dateOnly(from),
    toDate: to === undefined ? undefined : dateOnly(to),
    designation,
    department,
    postingIn,
    postType,
    locationChange: 'Within state',
    orderId,
    addedByOfficer: false,
  });
  const career: T.CareerEntry[] = [
    posting(
      'c1',
      -420,
      undefined,
      'Joint Collector',
      'Revenue and Disaster Management',
      'Tirunelveli',
      'Permanent',
      'd1',
    ),
    {
      id: 'c3',
      kind: 'promotion',
      fromDate: dateOnly(-900),
      designation: 'Joint Collector',
      department: 'Revenue and Disaster Management',
      fromGrade: 'Junior Time Scale',
      toGrade: 'Senior Time Scale',
      orderId: 'd3',
      addedByOfficer: false,
    },
    posting(
      'c4',
      -1100,
      -421,
      'Sub-Collector',
      'Revenue and Disaster Management',
      'Madurai',
      'Temporary',
      'd4',
    ),
    posting(
      'c6',
      -1500,
      -1101,
      'Assistant Collector (Training)',
      'Revenue and Disaster Management',
      'Coimbatore',
      'Temporary',
    ),
    {
      ...posting(
        'c8',
        -1900,
        -1501,
        'Deputy Secretary',
        'Rural Development and Panchayat Raj',
        'Chennai',
        'Permanent',
      ),
      locationChange: 'In situ',
      addedByOfficer: true,
    },
    posting(
      'c10',
      -2300,
      -1901,
      'Project Officer',
      'Rural Development and Panchayat Raj',
      'Salem',
      'Temporary',
    ),
    {
      id: 'c12',
      kind: 'promotion',
      fromDate: dateOnly(-2300),
      designation: 'Project Officer',
      department: 'Rural Development and Panchayat Raj',
      fromGrade: 'Probation',
      toGrade: 'Junior Time Scale',
      addedByOfficer: false,
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
    source: 'portal',
    ...extra,
  });
  const leaves: T.LeaveRecord[] = [
    L('Casual leave', 9, 11, 'approved', { orderId: 'd5' }),
    L('Earned leave', 40, 46, 'approved'),
    L('Casual leave', -30, -28, 'approved', { orderId: 'd6' }),
    L('Restricted holiday', -60, -60, 'approved'),
    L('Earned leave', -95, -89, 'approved', { orderId: 'd7' }),
    L('Medical leave', -140, -136, 'approved'),
    L('Casual leave', -170, -170, 'approved', { source: 'paper' }),
    L('Casual leave', -200, -199, 'approved'),
    L('Ex-India leave', -260, -252, 'approved', { orderId: 'd8' }),
    L('Casual leave', -300, -298, 'rejected'),
    L('Earned leave', -340, -334, 'approved'),
    L('Half-pay leave', -430, -426, 'approved', { source: 'paper' }),
    L('Casual leave', -470, -470, 'withdrawn'),
  ];
  const ltcs: T.LtcRecord[] = [
    {
      id: id('ltc'),
      blockYear: `${year - 3} to ${year}`,
      from: dateOnly(-400),
      to: dateOnly(-392),
      placeFrom: 'Tirunelveli',
      placeTo: 'Kochi',
      who: 'Family',
      leaveAvailed: 'Earned leave',
      status: 'approved',
      source: 'portal',
    },
    {
      id: id('ltc'),
      blockYear: `${year - 3} to ${year}`,
      from: dateOnly(-700),
      to: dateOnly(-695),
      placeFrom: 'Tirunelveli',
      placeTo: 'Delhi',
      who: 'Self',
      leaveAvailed: 'Casual leave',
      status: 'approved',
      source: 'paper',
    },
  ];
  const medicals: T.MedicalClaim[] = [
    {
      id: id('med'),
      date: dateOnly(-35),
      forWhom: 'Self',
      hospital: 'Sample General Hospital',
      treatment: 'Orthopaedic care',
      cost: 42600,
      status: 'approved',
      concurrence: 'Received',
      source: 'portal',
    },
    {
      id: id('med'),
      date: dateOnly(-150),
      forWhom: 'Family',
      hospital: 'Example Children’s Hospital',
      treatment: 'Paediatric care',
      cost: 18900,
      status: 'approved',
      concurrence: 'Pending',
      source: 'paper',
    },
  ];
  const gpfs: T.GpfWithdrawal[] = [
    {
      id: id('gpf'),
      date: dateOnly(-210),
      type: 'Part final',
      purpose: 'House construction',
      amount: 250000,
      status: 'approved',
      source: 'portal',
    },
    {
      id: id('gpf'),
      date: dateOnly(-900),
      type: 'Temporary',
      purpose: 'Higher education',
      amount: 120000,
      status: 'approved',
      source: 'paper',
    },
  ];

  const docs: [string, string, string, string?][] = [
    ['d1', 'Posting order: Joint Collector, Tirunelveli', 'Posting', 'G.O. (Ms) No. 412'],
    ['d3', 'Promotion order: Senior Time Scale', 'Promotion', 'G.O. (Ms) No. 96'],
    ['d4', 'Posting order: Sub-Collector, Madurai', 'Posting', 'G.O. (Ms) No. 233'],
    ['d5', 'Leave order: casual leave', 'Leave', 'Proc. No. 118'],
    ['d6', 'Leave order: casual leave', 'Leave', 'Proc. No. 77'],
    ['d7', 'Leave order: earned leave', 'Leave', 'Proc. No. 54'],
    ['d8', 'Leave order: Ex-India leave', 'Leave', 'G.O. (Ms) No. 301'],
  ];
  const linkMap: Record<string, [string, string, string]> = {
    d1: ['career', 'c1', '/records/profile?tab=career'],
    d3: ['career', 'c3', '/records/profile?tab=career'],
    d4: ['career', 'c4', '/records/profile?tab=career'],
    d5: ['leave', 'l', '/records/services/leave'],
    d6: ['leave', 'l', '/records/services/leave'],
    d7: ['leave', 'l', '/records/services/leave'],
    d8: ['leave', 'l', '/records/services/leave'],
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

  // --- requests: every status at least once
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
    source: 'portal',
    values,
    attachments: [],
    timeline: tl,
    createdAt: at(d),
    submittedAt: status === 'draft' ? undefined : at(d),
    // Never later than now: a request cannot have been updated in the future, whatever the time of day.
    updatedAt: new Date(Math.min(new Date(at(d + 1)).getTime(), now.getTime())).toISOString(),
    ...extra,
  });
  const requests: T.Request[] = [
    R(
      1,
      'leave',
      `Leave, ${rangeTitle({ from: dmy(25), to: dmy(27) })}`,
      'draft',
      { type: 'Casual leave', dates: { from: dmy(25), to: dmy(27) } },
      -1,
      [],
      { mode: 'apply', updatedAt: at(-1, 17), submittedAt: undefined },
    ),
    R(
      2,
      'medical',
      'Medical claim, ₹18,400',
      'submitted',
      {
        description: 'Outpatient treatment and tests',
        hospital: 'Sample General Hospital',
        treatment: 'Orthopaedic care',
        cost: '18400',
        who: 'Self',
        applicationDate: dmy(-1),
        dischargeEndorsed: 'Yes',
      },
      -1,
      [step('Sent', -1, 'You')],
      { mode: 'apply', attachments: [{ name: 'bills.pdf', size: 420000 }] },
    ),
    R(
      3,
      'profile-edit',
      'Update my details: Contact and address',
      'submitted',
      {
        group: 'Contact and address',
        changes: { personalEmail: 'aadhira.valluvan@example.test' },
      },
      -2,
      [step('Sent', -2, 'You')],
    ),
    R(
      4,
      'ltc',
      `LTC trip, block ${year - 3} to ${year}`,
      'returned',
      {
        blockYear: `${year - 3} to ${year}`,
        dates: { from: dmy(28), to: dmy(34) },
        placeFrom: 'Tirunelveli',
        placeTo: 'Kochi',
        who: 'Family',
        leaveAvailed: 'Earned leave',
      },
      -6,
      [
        step('Sent', -6, 'You'),
        step(
          'Returned',
          -5,
          features.approver.title,
          'The travel dates do not match your earned leave.',
        ),
      ],
      {
        mode: 'record',
        returnReason:
          'The travel dates do not match your earned leave. Correct the dates and send again.',
      },
    ),
    R(
      5,
      'leave',
      `Leave, ${rangeTitle({ from: dmy(-95), to: dmy(-89) })}`,
      'approved',
      { type: 'Earned leave', dates: { from: dmy(-95), to: dmy(-89) } },
      -100,
      [step('Sent', -100, 'You'), step('Approved', -97, features.approver.title)],
      { mode: 'apply' },
    ),
    R(
      6,
      'gpf',
      'GPF withdrawal, ₹2,50,000',
      'approved',
      { type: 'Part final', purpose: 'House construction', amount: '250000', date: dmy(-210) },
      -215,
      [step('Sent', -215, 'You'), step('Approved', -212, features.approver.title)],
      { mode: 'apply' },
    ),
    R(
      7,
      'medical',
      'Medical claim, ₹6,200',
      'rejected',
      {
        description: 'Dental treatment',
        hospital: 'Example Dental Clinic',
        treatment: 'Dental care',
        cost: '6200',
        who: 'Self',
        applicationDate: dmy(-120),
        dischargeEndorsed: 'No',
      },
      -125,
      [
        step('Sent', -125, 'You'),
        step('Not approved', -121, features.approver.title, 'Dental care is not covered.'),
      ],
      { mode: 'apply', rejectReason: 'Dental care is not covered under this scheme.' },
    ),
    R(
      8,
      'leave',
      `Leave, ${rangeTitle({ from: dmy(-470), to: dmy(-470) })}`,
      'withdrawn',
      { type: 'Casual leave', dates: { from: dmy(-470), to: dmy(-470) } },
      -472,
      [step('Sent', -472, 'You'), step('Withdrawn', -471, 'You')],
      { mode: 'apply' },
    ),
  ];
  const pendingChanges: T.PendingChange[] = [
    {
      requestId: 'req-3',
      targetKind: 'profile',
      targetKey: 'personalEmail',
      proposedValue: 'aadhira.valluvan@example.test',
    },
  ];

  const N = (
    type: T.Notification['type'],
    text: string,
    route: string,
    d: number,
    read: boolean,
  ): T.Notification => ({
    id: id('n'),
    type,
    category: type === 'request' ? 'requests' : 'community',
    text,
    targetRoute: route,
    createdAt: at(d, 9 + (n % 8)),
    read,
  });
  const notifications: T.Notification[] = [
    N(
      'request',
      `Your LTC trip, block ${year - 3} to ${year} was returned. Reason: The travel dates do not match your earned leave. Correct the dates and send again.`,
      '/records/requests/req-4',
      -5,
      false,
    ),
    N(
      'request',
      'Your Update my details: Contact and address was sent for approval.',
      '/records/requests/req-3',
      -2,
      false,
    ),
    N(
      'request',
      'Your Medical claim, ₹18,400 was sent for approval.',
      '/records/requests/req-2',
      -1,
      false,
    ),
    N(
      'reply',
      'An officer replied to your discussion “Flood relief rosters”.',
      '/community/discourse/post-1',
      -2,
      false,
    ),
    N(
      'circular',
      'New circular: Revised procedure for GPF part-final withdrawal.',
      '/records/downloads?tab=circulars',
      -1,
      false,
    ),
    N(
      'training',
      'New training: Data-driven district administration.',
      '/community/capacity-building',
      -3,
      true,
    ),
    N(
      'idea-status',
      'Your proposal “Single window for flood-relief claims” is now under review.',
      '/community/proposals/idea-2',
      -8,
      true,
    ),
    N(
      'request',
      'Your GPF withdrawal, ₹2,50,000 was approved.',
      '/records/requests/req-6',
      -212,
      true,
    ),
    N(
      'request',
      'Your Medical claim, ₹6,200 was not approved. Reason: Dental care is not covered under this scheme.',
      '/records/requests/req-7',
      -121,
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
  // Department sizes: Public Department is the large one (it has an officer with eight direct reports).
  const deptSizes = [12, 8, 8, 7, 7, 6, 6, 6];
  const deptStart = deptSizes.map((_, d) => deptSizes.slice(0, d).reduce((x, y) => x + y, 0));
  const people = Array.from({ length: 60 }, (_, i) => {
    const service = services[i % services.length];
    const name =
      i === 7
        ? 'Thiruvalluvar Subramanian Venkatachalapathi Ramanujam Iyengar'
        : `${first[i % first.length]} ${last[(i * 3) % last.length]}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z]+/g, '.')
      .slice(0, 24);
    return {
      id: `col-${i + 1}`,
      name,
      service,
      batch: service === 'IAS' ? 2005 + (i % 18) : undefined,
      district: districts[i % districts.length],
      areaOfExposure: areas[i % areas.length],
      statusNote: (i % 17 === 3
        ? 'On leave'
        : i % 23 === 5
          ? 'On training'
          : undefined) as T.Colleague['statusNote'],
      photoUrl: i % 3 === 2 ? undefined : photoDataUri(i + 2),
      officialEmail: `${slug}@example.gov.test`,
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
  // The post chain. Post 0 is the single top post. In the Public Department, post 2 has eight direct
  // reports; elsewhere each post reports to the one two places above it.
  const parentIndex = (di: number, ri: number): number | undefined =>
    ri === 0 ? undefined : di === 0 ? (ri <= 2 ? 0 : ri === 11 ? 1 : 2) : ri <= 2 ? 0 : ri - 2;
  const VACANT = { di: 2, ri: 3 }; // a post with nobody on file
  const titleOf = (ri: number) =>
    ri < 8
      ? `${ranks[ri]}${ri === 0 ? '' : ri < 5 ? ` (${['Policy', 'Establishment', 'Finance', 'Schemes', 'Coordination'][ri % 5]})` : ''}`
      : `${ranks[ri % 8]} (${['Records', 'Audit', 'Legal', 'Monitoring'][ri % 4]})`;
  const depts: T.Department[] = departments.map((name, di) => ({
    id: `dep-${di + 1}`,
    name,
    posts: Array.from({ length: deptSizes[di] + (di === VACANT.di ? 1 : 0) }, (_, ri) => {
      const sectionCount = ri % 8 >= 6 ? 2 : 3 + (ri % 2);
      const k = di === VACANT.di && ri > VACANT.ri ? ri - 1 : ri;
      const vacant = di === VACANT.di && ri === VACANT.ri;
      const officer = vacant ? undefined : people[deptStart[di] + k];
      const parent = parentIndex(di, ri);
      return {
        id: `post-${di + 1}-${ri + 1}`,
        title: titleOf(ri),
        rank: ranks[ri % 8],
        officerId: officer?.id,
        officerName: officer?.name,
        reportsToPostId: parent === undefined ? undefined : `post-${di + 1}-${parent + 1}`,
        sections: Array.from({ length: sectionCount }, (_, si) => ({
          id: `sec-${di + 1}-${ri + 1}-${si + 1}`,
          name:
            ['Establishment', 'Accounts', 'Schemes', 'Coordination', 'Legal', 'Monitoring'][
              (si + ri) % 6
            ] + (si > 2 ? ' II' : ''),
          subjects: Array.from(
            { length: 4 + ((di + ri + si) % 5) },
            (_, k2) => subjectPool[(di * 5 + ri * 3 + si * 7 + k2 * 2) % subjectPool.length],
          ),
        })),
      };
    }),
  }));

  // Each officer takes the designation of the post they hold and reports to the officer in the nearest
  // filled post above. Everything below is derived from the chain, so the two cannot disagree.
  const langPool = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'];
  const degreePool = [
    ['B.E.', 'Civil Engineering', 'Anna University'],
    ['M.A.', 'Public Administration', 'University of Madras'],
    ['B.Sc.', 'Agriculture', 'Tamil Nadu Agricultural University'],
    ['LL.B.', 'Law', 'Government Law College, Chennai'],
    ['M.B.B.S.', 'Medicine', 'Madras Medical College'],
    ['B.A.', 'Economics', 'Presidency College, Chennai'],
    ['M.Sc.', 'Physics', 'Loyola College, Chennai'],
    ['M.Tech.', 'Environmental Engineering', 'IIT Madras'],
  ];
  const allPosts = depts.flatMap((d) => d.posts.map((p) => ({ d, p })));
  const colleagues: T.Colleague[] = people.map((c, i) => {
    const hit = allPosts.find((x) => x.p.officerId === c.id)!;
    const { d, p } = hit;
    let up = hit.p.reportsToPostId;
    let boss: string | undefined;
    while (up && !boss) {
      const above = d.posts.find((x) => x.id === up)!;
      boss = above.officerId;
      up = above.reportsToPostId;
    }
    const prior = i === 9 ? 0 : i === 20 ? 9 : i === 21 ? 7 : 2 + (i % 4);
    const since = 2026 - 1 - (i % 3);
    return {
      ...c,
      designation: p.title,
      department: d.name,
      postId: p.id,
      reportsToId: boss,
      languages:
        i === 13
          ? []
          : langPool.filter((_, k) => k === 0 || k === 1 || (i + k) % 3 === 0).slice(0, 4),
      qualifications: Array.from({ length: 1 + (i % 3) }, (_, k) => {
        const [degree, subject, institute] = degreePool[(i + k * 3) % degreePool.length];
        return { degree, subject, institute };
      }),
      officeAddress:
        c.district === 'Chennai'
          ? `${d.name}, Secretariat, Fort St George, Chennai 600 009`
          : `Collectorate Complex, ${c.district} 600 000`,
      officePhone: `+91 44 0000 ${1100 + i}`,
      previousPostings: Array.from({ length: prior }, (_, j) => ({
        designation: desigs[c.service][(i + j) % desigs[c.service].length],
        department: departments[(i + j + 1) % departments.length],
        place: districts[(i + j * 2) % districts.length],
        from: since - 2 * (j + 1),
        to: since - 2 * j,
      })),
      postedSince: dateOnly(-(120 + ((i * 53) % 900))),
      handles: p.sections
        .flatMap((s) => s.subjects)
        .filter((x, k, arr) => arr.indexOf(x) === k)
        .slice(0, 8)
        .map((label) => ({ label, departmentId: d.id, postId: p.id })),
    };
  });

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

  [
    'Special entry: acknowledgement of service record',
    'Special entry: change of name in the service book',
    'Special entry: recording of training completed',
    'Special entry: correction of date of birth',
    'Special entry: addition of educational qualification',
  ].forEach((t, i) =>
    libAdd('special', t, {
      number: `Entry No. ${14 + i * 5}/${year}`,
      description: 'The procedure and the form to use.',
    }),
  );
  [
    'DRO order: allotment of work, first quarter',
    'DRO order: leave sanction authority',
    'DRO order: delegation of powers',
    'DRO order: transfer of charge',
    'DRO order: cadre review committee',
  ].forEach((t, i) =>
    libAdd('dro', t, {
      number: `DRO No. ${6 + i * 4}/${year}`,
      description: 'The order as issued by the department.',
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
  // A thread with three replies, so "View more replies" has something to show.
  const rootOne = comments.find((c) => c.parentId === 'post-1' && !c.replyTo)!;
  comments.push(
    rep(
      'post-1',
      person(15),
      'Thank you. Does the on-call officer get a rest day after?',
      -1,
      rootOne.id,
    ),
    rep(
      'post-1',
      seniors(20),
      'Yes. We gave the next working day off, and it was worth it.',
      -1,
      rootOne.id,
    ),
    rep(
      'post-1',
      person(16),
      'We did the same in two blocks. It reduced sick leave.',
      0,
      rootOne.id,
    ),
  );
  void rand;
  return {
    officer,
    career,
    leaveBalance,
    leaves,
    ltcs,
    medicals,
    gpfs,
    serviceRecords: {},
    pendingChanges,
    documents,
    requests,
    notifications,
    ideas,
    comments,
    posts,
    colleagues,
    departments: depts,
    experts,
    trainingEvents,
    resources,
    awards,
    library: lib,
    pollVotes: {},
    seq: 1000,
  };
}
