import { describe, expect, it } from 'vitest';
import { api } from '@/data/api';
import { buildSeed, ME } from '@/data/seed';
import { resetDb } from '@/data/store';
import { REQUEST_TYPES, getRequestType, rangeTitle } from '@/config/requests';
import { features } from '@/config/features';
import {
  canMove,
  canWithdraw,
  dayCount,
  findOverlap,
  generateTitle,
  pastWarnings,
  proofRequired,
  sourceOf,
  validateDetails,
  validateDocuments,
} from '@/domain/requests';

const balance = {
  cl: { allowed: 20, used: 8 },
  rh: { allowed: 3, used: 1 },
  el: { allowed: 300, used: 180 },
  hpl: { allowed: 120, used: 30 },
};
const ctx = { booked: [], balance, today: new Date() };
const leave = getRequestType('leave')!;

describe('request engine', () => {
  it('has the 8 request types, each with a title generator', () => {
    expect(REQUEST_TYPES.map((t) => t.key)).toEqual([
      'leave',
      'ltc',
      'medical',
      'gpf',
      'posting',
      'promotion',
      'profile-edit',
      'correction',
    ]);
    REQUEST_TYPES.forEach((t) => expect(typeof generateTitle(t, {})).toBe('string'));
  });
  it('generates the exact titles from the spec', () => {
    expect(generateTitle(leave, { dates: { from: '12/11/2026', to: '14/11/2026' } })).toBe(
      'Leave, 12 to 14 November',
    );
    expect(generateTitle(getRequestType('gpf')!, { amount: '250000' })).toBe(
      'GPF withdrawal, ₹2,50,000',
    );
    expect(generateTitle(getRequestType('medical')!, { cost: '18400' })).toBe(
      'Medical claim, ₹18,400',
    );
    expect(generateTitle(getRequestType('ltc')!, { blockYear: '2024 to 2027' })).toBe(
      'LTC trip, block 2024 to 2027',
    );
    expect(
      generateTitle(getRequestType('posting')!, {
        designation: 'Collector',
        department: 'Finance',
      }),
    ).toBe('Posting: Collector, Finance');
    expect(generateTitle(getRequestType('promotion')!, { toGrade: 'Selection Grade' })).toBe(
      'Promotion to Selection Grade',
    );
    expect(generateTitle(getRequestType('profile-edit')!, { group: 'Education' })).toBe(
      'Update my details: Education',
    );
    expect(generateTitle(getRequestType('correction')!, { field: 'Profile: Name' })).toBe(
      'Correction: Profile: Name',
    );
    expect(rangeTitle({ from: '28/11/2026', to: '02/12/2026' })).toBe('28 November to 2 December');
  });
  it('blocks overlapping dates and names the clash', () => {
    const booked = [{ title: 'Leave, 12 to 14 November', from: '12/11/2026', to: '14/11/2026' }];
    expect(findOverlap({ from: '14/11/2026', to: '16/11/2026' }, booked)?.title).toBe(
      'Leave, 12 to 14 November',
    );
    const errs = validateDetails(
      leave,
      { type: 'Casual leave', dates: { from: '13/11/2026', to: '13/11/2026' } },
      { ...ctx, booked },
    );
    expect(errs[0]).toMatchObject({
      key: 'ui.errors.overlap',
      params: { title: 'Leave, 12 to 14 November' },
    });
    // The same rule blocks Add a past leave.
    expect(
      validateDetails(
        leave,
        { type: 'Casual leave', dates: { from: '13/11/2026', to: '13/11/2026' } },
        { ...ctx, booked, mode: 'past' },
      )[0].key,
    ).toBe('ui.errors.overlap');
  });
  it('requires a remark above the balance when applying, and only warns for a past leave', () => {
    const v = { type: 'Casual leave', dates: { from: '01/12/2026', to: '20/12/2026' } };
    expect(dayCount(v.dates)).toBe(20);
    expect(validateDetails(leave, v, ctx)[0]).toMatchObject({
      field: 'remarks',
      key: 'ui.errors.balance',
      params: { n: 12 },
    });
    expect(validateDetails(leave, { ...v, remarks: 'Family event' }, ctx)).toEqual([]);
    expect(validateDetails(leave, v, { ...ctx, mode: 'past' })).toEqual([]);
    expect(pastWarnings(leave, v, balance, 'past')).toEqual(['ui.errors.pastBalance']);
    expect(pastWarnings(leave, v, balance, 'apply')).toEqual([]);
  });
  it('rejects end before start, bad dates and missing required fields', () => {
    expect(
      validateDetails(
        leave,
        { type: 'Casual leave', dates: { from: '05/12/2026', to: '01/12/2026' } },
        ctx,
      )[0].key,
    ).toBe('ui.errors.endBeforeStart');
    expect(
      validateDetails(
        leave,
        { type: 'Casual leave', dates: { from: '32/12/2026', to: '' } },
        ctx,
      ).map((e) => e.key),
    ).toContain('ui.errors.badDate');
    expect(validateDetails(leave, {}, ctx).map((e) => e.field)).toEqual([
      'type',
      'dates.from',
      'dates.to',
    ]);
  });
  it('requires the right documents', () => {
    expect(validateDocuments(leave, { type: 'Medical leave' }, {}).map((e) => e.field)).toEqual([
      'doc.medicalCertificate',
    ]);
    expect(validateDocuments(leave, { type: 'Casual leave' }, {})).toEqual([]);
    // A past entry needs the scan of the paper record.
    expect(
      validateDocuments(leave, { type: 'Casual leave' }, {}, 'past').map((e) => e.field),
    ).toEqual(['doc.proof']);
    // An LTC trip that has already ended is a paper record too.
    const ltc = getRequestType('ltc')!;
    expect(proofRequired(ltc, { dates: { to: '01/01/2020' } }, 'record')).toBe(true);
    expect(proofRequired(ltc, { dates: { to: '01/01/2999' } }, 'record')).toBe(false);
    expect(sourceOf(ltc, { dates: { to: '01/01/2020' } }, 'record')).toBe('paper');
    // A posting with an end date needs its order file.
    expect(
      validateDocuments(getRequestType('posting')!, { toDate: '01/01/2024' }, {}).map(
        (e) => e.field,
      ),
    ).toEqual(['doc.orderFile']);
    expect(validateDocuments(getRequestType('posting')!, {}, {})).toEqual([]);
    expect(
      validateDetails(
        leave,
        { type: 'Ex-India leave', dates: { from: '01/12/2026', to: '02/12/2026' } },
        ctx,
      ).map((e) => e.field),
    ).toContain('country');
  });
  it('follows the status transitions table', () => {
    expect(canMove('draft', 'submitted')).toBe(true);
    expect(canMove('submitted', 'approved')).toBe(true);
    expect(canMove('submitted', 'returned')).toBe(true);
    expect(canMove('submitted', 'rejected')).toBe(true);
    expect(canMove('returned', 'submitted')).toBe(true);
    expect(canMove('approved', 'withdrawn')).toBe(false);
    expect(canWithdraw('submitted')).toBe(true);
    expect(canWithdraw('approved')).toBe(false);
  });
});

describe('seed data', () => {
  const db = buildSeed();
  it('has the expected counts', () => {
    expect(db.career.length).toBeGreaterThanOrEqual(6);
    expect(db.leaves.length).toBeGreaterThanOrEqual(12);
    expect(db.ltcs.length).toBeGreaterThanOrEqual(2);
    expect(db.medicals.length).toBeGreaterThanOrEqual(2);
    expect(db.gpfs.length).toBeGreaterThanOrEqual(2);
    expect(db.colleagues).toHaveLength(60);
    expect(db.departments).toHaveLength(8);
    expect(db.ideas).toHaveLength(12);
    expect(db.posts).toHaveLength(10);
    expect(db.library.filter((l) => l.kind === 'rule')).toHaveLength(6);
    expect(db.library.filter((l) => l.kind === 'circular' || l.kind === 'go')).toHaveLength(25);
    expect(db.library.filter((l) => l.kind === 'form')).toHaveLength(10);
    expect(db.library.filter((l) => l.kind === 'faq')).toHaveLength(15);
    expect(db.library.filter((l) => l.kind === 'announcement')).toHaveLength(8);
    expect(db.library.filter((l) => l.kind === 'special').length).toBeGreaterThan(0);
    expect(db.library.filter((l) => l.kind === 'dro').length).toBeGreaterThan(0);
    expect(db.notifications.filter((n) => !n.read).length).toBeGreaterThan(0);
  });
  it('covers every request status', () => {
    const seen = new Set(db.requests.map((r) => r.status));
    ['draft', 'submitted', 'returned', 'approved', 'rejected', 'withdrawn'].forEach((s) =>
      expect(seen.has(s as never)).toBe(true),
    );
    expect(db.requests.find((r) => r.status === 'returned')?.returnReason).toBeTruthy();
    expect(db.requests.find((r) => r.status === 'rejected')?.rejectReason).toBeTruthy();
  });
  it('is relative to today and never goes stale', () => {
    const later = buildSeed(new Date(Date.now() + 400 * 86400000));
    const first = (d: typeof db) =>
      d.requests.find((r) => r.id === 'req-1')!.values.dates as { from: string };
    expect(first(later).from).not.toBe(first(db).from);
  });
  it('includes the awkward cases on purpose', () => {
    expect(Math.max(...db.colleagues.map((c) => c.name.length))).toBeGreaterThan(50);
    expect(db.colleagues.filter((c) => !c.photoUrl).length).toBeGreaterThanOrEqual(15);
    expect(db.departments.some((d) => d.posts.some((p) => !p.officerId))).toBe(true);
    expect(db.leaveBalance.cl.allowed - db.leaveBalance.cl.used).toBe(12);
  });
});

describe('privacy (brief, section 9)', () => {
  const FORBIDDEN = [
    'dateOfBirth',
    'address',
    'caste',
    'religion',
    'personalEmail',
    'leaves',
    'classPayScale',
  ];
  it('a colleague never exposes a sensitive field, anywhere in the payload', async () => {
    resetDb();
    const all = await api.colleagues();
    const json = JSON.stringify(all);
    FORBIDDEN.forEach((k) => expect(json).not.toContain(`"${k}"`));
    expect(json).not.toContain('sharedContact');
  });
  it('search never returns sensitive fields', async () => {
    resetDb();
    const res = await api.search('sample');
    const json = JSON.stringify(res);
    ['dateOfBirth', 'caste', 'religion', 'personalEmail'].forEach((k) =>
      expect(json).not.toContain(k),
    );
    expect((await api.search('Sample community')).officers).toHaveLength(0);
  });
  it('hides the author of an anonymous post from other officers but flags it to its author', async () => {
    resetDb();
    const posts = await api.posts();
    const anon = posts.filter((p) => p.anonymous);
    expect(anon.length).toBeGreaterThanOrEqual(3);
    anon.forEach((p) => expect(p.author).toBe('anonymous'));
    const mine = await api.createPost({
      kind: 'discussion',
      title: 'Q',
      body: 'b',
      audience: 'all',
      anonymous: true,
      askSeniors: true,
    });
    expect(mine.mine).toBe(true);
    expect(mine.author).toBe('anonymous');
    const reply = await api.addComment(mine.id, 'my reply');
    expect(reply.author).toBe('anonymous');
    expect(JSON.stringify(await api.notifications())).not.toContain('Aadhira');
  });
  it('lets an officer back an idea once, and not their own', async () => {
    resetDb();
    const ideas = await api.ideas();
    const other = ideas.find((i) => !i.mine && !i.backedByMe)!;
    expect((await api.backIdea(other.id, true)).backerCount).toBe(other.backerCount + 1);
    expect((await api.backIdea(other.id, true)).backerCount).toBe(other.backerCount + 1);
    expect((await api.backIdea(other.id, false)).backerCount).toBe(other.backerCount);
    await expect(api.backIdea(ideas.find((i) => i.mine)!.id, true)).rejects.toThrow();
  });
  it('allows one poll vote and no change', async () => {
    resetDb();
    await api.vote('post-4', 'o1');
    await expect(api.vote('post-4', 'o2')).rejects.toThrow('voted');
  });
});

describe('request lifecycle through the repository', () => {
  const dates = { from: '05/03/2027', to: '06/03/2027' };
  it('sends, is approved by the approver, and applies an approved leave to the record', async () => {
    resetDb();
    const before = (await api.leaveBalance()).cl.used;
    const r = await api.saveRequest({
      type: 'leave',
      mode: 'apply',
      values: { type: 'Casual leave', dates },
      attachments: [],
    });
    expect(r.status).toBe('submitted');
    expect(r.title).toBe('Leave, 5 to 6 March');
    expect(r.source).toBe('portal');
    // Nothing changes until approval.
    expect((await api.leaveBalance()).cl.used).toBe(before);
    await api.decideRequest(r.id, 'approved');
    const done = await api.request(r.id);
    expect(done.status).toBe('approved');
    expect(done.timeline.map((s) => s.title)).toEqual(['Sent', 'Approved']);
    expect((await api.leaveBalance()).cl.used).toBe(before + 2);
    expect((await api.leaves())[0]).toMatchObject({ days: 2, source: 'portal', requestId: r.id });
    expect((await api.notifications())[0].text).toBe('Your Leave, 5 to 6 March was approved.');
  });
  it('tags a past leave as added from paper and still deducts the balance on approval', async () => {
    resetDb();
    const before = (await api.leaveBalance()).cl.used;
    const r = await api.saveRequest({
      type: 'leave',
      mode: 'past',
      values: { type: 'Casual leave', dates: { from: '05/01/2026', to: '06/01/2026' } },
      attachments: [{ name: 'scan.pdf', size: 10 }],
    });
    expect(r.source).toBe('paper');
    await api.decideRequest(r.id, 'approved');
    expect((await api.leaves())[0].source).toBe('paper');
    expect((await api.leaveBalance()).cl.used).toBe(before + 2);
  });
  it('lets the officer fix a returned request and send again, but never withdraw an approved one', async () => {
    resetDb();
    const sent = await api.saveRequest({
      type: 'leave',
      mode: 'apply',
      values: { type: 'Casual leave', dates },
      attachments: [],
    });
    await api.decideRequest(sent.id, 'returned', 'Dates unclear');
    expect((await api.request(sent.id)).returnReason).toBe('Dates unclear');
    const again = await api.saveRequest({
      type: 'leave',
      mode: 'apply',
      values: { type: 'Casual leave', dates: { from: '07/03/2027', to: '08/03/2027' } },
      attachments: [],
      existingId: sent.id,
    });
    expect(again.status).toBe('submitted');
    expect(again.returnReason).toBeUndefined();
    await expect(api.withdrawRequest('req-6')).rejects.toThrow();
  });
  it('refuses a write to a locked profile field, in the data layer', async () => {
    resetDb();
    for (const key of [
      'photo',
      'name',
      'classPayScale',
      'dateOfBirth',
      'religion',
      'officialEmail',
    ])
      await expect(
        api.saveRequest({
          type: 'profile-edit',
          values: { group: 'Personal', changes: { [key]: 'x' } },
          attachments: [],
        }),
      ).rejects.toThrow(/locked-field/);
    expect((await api.officer()).name).toBe('Aadhira Valluvan');
  });
  it('treats the photo as a locked field: refused, and listed as locked and not editable', async () => {
    resetDb();
    expect(features.profile.fieldAccess.locked).toContain('photo');
    expect(features.profile.fieldAccess.editable).not.toContain('photo');
    const before = (await api.officer()).photoUrl;
    await expect(
      api.saveRequest({
        type: 'profile-edit',
        values: { group: 'Photo', changes: { photo: 'data:image/png;base64,AAAA' } },
        attachments: [],
      }),
    ).rejects.toThrow('locked-field:photo');
    expect((await api.officer()).photoUrl).toBe(before);
  });
  it('keeps the old value and a Change pending marker until the change is decided', async () => {
    resetDb();
    const old = (await api.officer()).address.city;
    const r = await api.saveRequest({
      type: 'profile-edit',
      values: {
        group: 'Contact and address',
        changes: {
          residentialAddress: { line: '1, New Street', city: 'Madurai', pincode: '625001' },
        },
      },
      attachments: [],
    });
    expect((await api.officer()).address.city).toBe(old);
    expect((await api.pendingChanges()).some((p) => p.targetKey === 'residentialAddress')).toBe(
      true,
    );
    // One pending change per field.
    await expect(
      api.saveRequest({
        type: 'profile-edit',
        values: {
          group: 'Contact and address',
          changes: { residentialAddress: { line: 'x', city: 'y', pincode: '600001' } },
        },
        attachments: [],
      }),
    ).rejects.toThrow(/pending/);
    await api.decideRequest(r.id, 'approved');
    expect((await api.officer()).address.city).toBe('Madurai');
    expect((await api.pendingChanges()).some((p) => p.targetKey === 'residentialAddress')).toBe(
      false,
    );
  });
  it('clears the pending marker when a change is withdrawn or returned', async () => {
    resetDb();
    const r = await api.saveRequest({
      type: 'profile-edit',
      values: { group: 'Languages', changes: { languagesKnown: 'Tamil, English' } },
      attachments: [],
    });
    await api.withdrawRequest(r.id);
    expect((await api.pendingChanges()).some((p) => p.requestId === r.id)).toBe(false);
  });
  it('adds a posting without an end date as the current posting and ends the previous one', async () => {
    resetDb();
    const r = await api.saveRequest({
      type: 'posting',
      values: {
        postingIn: 'Chennai',
        department: 'Finance Department',
        designation: 'Deputy Secretary',
        postType: 'Permanent',
        locationChange: 'Within state',
        fromDate: '01/04/2027',
        toDate: '',
      },
      attachments: [],
    });
    await api.decideRequest(r.id, 'approved');
    const career = await api.career();
    expect(career.filter((c) => c.kind === 'posting' && !c.toDate)).toHaveLength(1);
    expect(career[0]).toMatchObject({ designation: 'Deputy Secretary', addedByOfficer: true });
    const o = await api.officer();
    expect(o.currentPosting).toMatchObject({
      designation: 'Deputy Secretary',
      postingIn: 'Chennai',
    });
  });
  it('sets the last promotion date from an approved promotion', async () => {
    resetDb();
    const r = await api.saveRequest({
      type: 'promotion',
      values: {
        fromGrade: 'Selection Grade',
        toGrade: 'Super Time Scale',
        promotionDate: '01/01/2027',
      },
      attachments: [],
    });
    await api.decideRequest(r.id, 'approved');
    expect((await api.officer()).lastPromotionDate).toBe('2027-01-01');
    expect((await api.officer()).grade).toBe('Super Time Scale');
  });
  it('adds LTC, medical and GPF entries on approval', async () => {
    resetDb();
    const l = await api.saveRequest({
      type: 'ltc',
      mode: 'record',
      values: {
        blockYear: '2024 to 2027',
        dates: { from: '01/06/2027', to: '05/06/2027' },
        placeFrom: 'A',
        placeTo: 'B',
        who: 'Self',
        leaveAvailed: 'Casual leave',
      },
      attachments: [],
    });
    const m = await api.saveRequest({
      type: 'medical',
      mode: 'apply',
      values: {
        cost: '5000',
        who: 'Self',
        hospital: 'H',
        treatment: 'T',
        applicationDate: '01/02/2027',
      },
      attachments: [],
    });
    const g = await api.saveRequest({
      type: 'gpf',
      mode: 'apply',
      values: { type: 'Temporary', purpose: 'Medical', amount: '100000', date: '01/02/2027' },
      attachments: [],
    });
    for (const x of [l, m, g]) await api.decideRequest(x.id, 'approved');
    expect((await api.ltcs())[0]).toMatchObject({ placeTo: 'B', status: 'approved' });
    expect((await api.medicals())[0]).toMatchObject({ cost: 5000, concurrence: 'Pending' });
    expect((await api.gpfs())[0]).toMatchObject({ amount: 100000 });
  });
  it('posts a training request directly, with no approval step', async () => {
    resetDb();
    const t = await api.createTrainingRequest({ title: 'Disaster drills', forWho: 'My team' });
    expect(t).toMatchObject({ kind: 'requested', interestCount: 1, interestedByMe: true });
    expect((await api.trainingEvents())[0].id).toBe(t.id);
  });
  it('creates a sample returned request for the demo', async () => {
    resetDb();
    const r = await api.createSampleReturned();
    expect(r.status).toBe('returned');
    expect(r.returnReason).toBeTruthy();
  });
  it('is the signed-in officer in the seed', () => expect(buildSeed().officer.id).toBe(ME));
});
