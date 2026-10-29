import { describe, expect, it } from 'vitest';
import { api } from '@/data/api';
import { buildSeed, ME } from '@/data/seed';
import { resetDb } from '@/data/store';
import { REQUEST_TYPES, getRequestType, rangeTitle } from '@/config/requests';
import {
  canMove,
  canWithdraw,
  dayCount,
  findOverlap,
  generateTitle,
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
  it('has all 17 request types, each with a title generator', () => {
    expect(REQUEST_TYPES).toHaveLength(17);
    REQUEST_TYPES.forEach((t) => expect(typeof generateTitle(t, {})).toBe('string'));
  });
  it('generates the exact titles from the brief', () => {
    expect(generateTitle(leave, { dates: { from: '12/11/2026', to: '14/11/2026' } })).toBe(
      'Leave, 12 to 14 November',
    );
    expect(generateTitle(getRequestType('gpf')!, { amount: '250000' })).toBe(
      'GPF withdrawal, ₹2,50,000',
    );
    expect(generateTitle(getRequestType('mha-id')!, { applicationType: 'Renewal' })).toBe(
      'MHA identity card, Renewal',
    );
    expect(generateTitle(getRequestType('saf')!, {})).toBe('SAF Games Village housing');
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
  });
  it('requires a remark when casual or earned leave exceeds the balance', () => {
    const v = { type: 'Casual leave', dates: { from: '01/12/2026', to: '20/12/2026' } };
    expect(dayCount(v.dates)).toBe(20);
    expect(validateDetails(leave, v, ctx)[0]).toMatchObject({
      field: 'remarks',
      key: 'ui.errors.balance',
      params: { n: 12 },
    });
    expect(validateDetails(leave, { ...v, remarks: 'Family event' }, ctx)).toEqual([]);
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
  it('requires a medical certificate for medical leave and a country for Ex-India leave', () => {
    expect(validateDocuments(leave, { type: 'Medical leave' }, {}).map((e) => e.field)).toEqual([
      'doc.medicalCertificate',
    ]);
    expect(validateDocuments(leave, { type: 'Casual leave' }, {})).toEqual([]);
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
    expect(canMove('submitted', 'with-desk')).toBe(true);
    expect(canMove('ready-for-approval', 'returned')).toBe(true);
    expect(canMove('returned', 'submitted')).toBe(true);
    expect(canMove('approved', 'withdrawn')).toBe(false);
    expect(canWithdraw('with-desk')).toBe(true);
    expect(canWithdraw('approved')).toBe(false);
  });
});

describe('seed data', () => {
  const db = buildSeed();
  it('has the counts from the brief', () => {
    expect(db.career).toHaveLength(12);
    expect(db.leaves).toHaveLength(15);
    expect([
      db.trainings.length,
      db.travels.length,
      db.properties.length,
      db.benefits.length,
    ]).toEqual([4, 6, 4, 10]);
    expect(db.documents).toHaveLength(15);
    expect(db.colleagues).toHaveLength(60);
    expect(db.departments).toHaveLength(8);
    expect(db.ideas).toHaveLength(12);
    expect(db.posts).toHaveLength(10);
    expect(db.articles).toHaveLength(8);
    expect(db.library.filter((l) => l.kind === 'rule')).toHaveLength(6);
    expect(db.library.filter((l) => l.kind === 'circular' || l.kind === 'go')).toHaveLength(25);
    expect(db.library.filter((l) => l.kind === 'form')).toHaveLength(10);
    expect(db.library.filter((l) => l.kind === 'faq')).toHaveLength(15);
    expect(db.library.filter((l) => l.kind === 'announcement')).toHaveLength(8);
    expect(db.notifications.filter((n) => !n.read)).toHaveLength(4);
  });
  it('covers every request status', () => {
    const seen = new Set(db.requests.map((r) => r.status));
    [
      'draft',
      'submitted',
      'with-desk',
      'ready-for-approval',
      'returned',
      'approved',
      'rejected',
      'withdrawn',
    ].forEach((s) => expect(seen.has(s as never)).toBe(true));
    expect(db.requests.find((r) => r.status === 'returned')?.returnReason).toBeTruthy();
    expect(db.requests.find((r) => r.status === 'rejected')?.rejectReason).toBeTruthy();
  });
  it('is relative to today and never goes stale', () => {
    const later = buildSeed(new Date(Date.now() + 400 * 86400000));
    const first = (d: typeof db) =>
      d.requests.find((r) => r.id === 'req-4')!.values.dates as { from: string };
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
    'sensitive',
    'caste',
    'religion',
    'personalEmail',
    'properties',
    'leaves',
    'benefits',
  ];
  it('a colleague never exposes a sensitive field, anywhere in the payload', async () => {
    resetDb();
    const all = await api.colleagues();
    const json = JSON.stringify(all);
    FORBIDDEN.forEach((k) => expect(json).not.toContain(`"${k}"`));
    all.filter((c) => !c.sharedContact).forEach((c) => expect(c.sharedContact).toBeUndefined());
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
  it('sends, moves along the route, and applies an approved leave to the record', async () => {
    resetDb();
    const before = (await api.leaveBalance()).cl.used;
    const r = await api.saveRequest({
      type: 'leave',
      values: { type: 'Casual leave', dates: { from: '05/03/2027', to: '06/03/2027' } },
      attachments: [],
    });
    expect(r.status).toBe('submitted');
    expect(r.title).toBe('Leave, 5 to 6 March');
    for (const to of ['with-desk', 'ready-for-approval', 'approved'] as const)
      await api.advanceRequest(r.id, to);
    const done = await api.request(r.id);
    expect(done.status).toBe('approved');
    expect(done.orderId).toBeTruthy();
    expect(done.timeline.map((s) => s.title)).toEqual([
      'Sent',
      'With desk',
      'Ready for approval',
      'Approved',
      'Order issued',
    ]);
    expect((await api.leaveBalance()).cl.used).toBe(before + 2);
    expect((await api.notifications())[0].text).toBe('Your Leave, 5 to 6 March was approved.');
  });
  it('lets the officer fix a returned request and send again, but never withdraw an approved one', async () => {
    resetDb();
    const sent = await api.saveRequest({
      type: 'leave',
      values: { type: 'Casual leave', dates: { from: '05/03/2027', to: '06/03/2027' } },
      attachments: [],
    });
    await api.advanceRequest(sent.id, 'with-desk');
    await api.advanceRequest(sent.id, 'ready-for-approval');
    await api.advanceRequest(sent.id, 'returned', 'Dates unclear');
    expect((await api.request(sent.id)).returnReason).toBe('Dates unclear');
    const again = await api.saveRequest({
      type: 'leave',
      values: { type: 'Casual leave', dates: { from: '07/03/2027', to: '08/03/2027' } },
      attachments: [],
      existingId: sent.id,
    });
    expect(again.status).toBe('submitted');
    expect(again.returnReason).toBeUndefined();
    await expect(api.withdrawRequest('req-6')).rejects.toThrow();
  });
  it('saves contact changes at once as Self-reported and creates an Approved request', async () => {
    resetDb();
    const r = await api.saveRequest({
      type: 'update-details',
      values: { section: 'Contact', field: 'Mobile number 1', newValue: '+91 90000 99999' },
      attachments: [],
    });
    expect(r.status).toBe('approved');
    const o = await api.officer();
    expect(o.contact.mobile1).toBe('+91 90000 99999');
    expect(o.fieldMeta.mobile1).toBe('self-reported');
    const addr = await api.saveRequest({
      type: 'update-details',
      values: { section: 'Address', field: 'City', newValue: 'Madurai' },
      attachments: [],
    });
    expect(addr.status).toBe('submitted');
    expect((await api.officer()).address.city).toBe('Tirunelveli');
  });
  it('is the signed-in officer in the seed', () => expect(buildSeed().officer.id).toBe(ME));
});
