// The repository. Pages reach it only through hooks (see hooks.ts). Every method returns a promise
// with 300 to 800 ms of delay. To use a real API, write another object with the same shape.
import { getRequestType, rangeTitle } from '@/config/requests';
import { DEPARTMENTS } from '@/config/options';
import { features } from '@/config/features';
import { formatDMY, parseDMY } from '@/domain/dates';
import {
  balanceKey,
  canMove,
  canWithdraw,
  dayCount,
  generateTitle,
  sourceOf,
  type Booked,
  type Values,
} from '@/domain/requests';
import type * as T from '@/domain/types';
import { ME, SAMPLE_PDF, type Db } from './seed';
import { demo, getDb, nextId, resetDb, save } from './store';

const wait = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500));
const NEVER = new Promise<never>(() => {});

async function run<R>(
  fn: (db: Db) => R,
  opts: { list?: boolean; write?: boolean } = {},
): Promise<R> {
  await wait();
  if (demo.forceLoading) await NEVER;
  if (demo.forceError && !opts.write) throw new Error('Demo: forced error');
  const db = getDb();
  const out = fn(db);
  if (opts.write) save();
  if (demo.forceEmpty && opts.list && Array.isArray(out)) return [] as R;
  return out;
}
const now = () => new Date().toISOString();
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
const dmyToIso = (s: string) => {
  const [d, m, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
};
const isoToDmy = (iso: string) => formatDMY(new Date(iso));
const dayBefore = (iso: string) =>
  new Date(new Date(iso).getTime() - 86400000).toISOString().slice(0, 10);

// ---- privacy: what other officers may see ----
// Colleague records carry service, batch, district, department, area of exposure and the official email only.
// Religion and caste exist only on the signed-in officer's own record and never leave the officer() call.
const publicColleague = (c: T.Colleague): T.Colleague => ({ ...c });

const mapPost = (p: Db['posts'][number], db: Db): T.Post => {
  const mine = p.authorId === ME;
  const poll = p.poll
    ? {
        ...p.poll,
        options: p.poll.options.map((o) => ({
          ...o,
          votes: o.votes + (db.pollVotes[p.id] === o.id ? 1 : 0),
        })),
        myVote: db.pollVotes[p.id],
      }
    : undefined;
  return {
    ...p,
    author: p.anonymous ? 'anonymous' : p.author,
    mine,
    poll,
    replyCount: db.comments.filter((c) => c.parentId === p.id).length,
  };
};
const mapComment = (c: Db['comments'][number]): T.Comment => ({
  ...c,
  mine: c.authorId === ME,
  author: c.author,
});
const mapIdea = (i: Db['ideas'][number], db: Db): T.Idea => ({
  ...i,
  backerCount: i.backers.length,
  backedByMe: i.backers.includes(ME),
  mine: i.authorId === ME,
  commentCount: db.comments.filter((c) => c.parentId === i.id).length,
});

function notify(db: Db, type: T.Notification['type'], text: string, route: string) {
  db.notifications.unshift({
    id: nextId('n'),
    type,
    category: type === 'request' ? 'requests' : 'community',
    text,
    targetRoute: route,
    createdAt: now(),
    read: false,
  });
}

function addTimeline(r: T.Request, title: string, role?: string, note?: string) {
  r.timeline.push({ id: nextId('s'), title, date: now(), role, note });
  r.updatedAt = now();
}

export interface NewRequest {
  type: string;
  mode?: T.Mode;
  values: Values;
  attachments: T.Attachment[];
  draft?: boolean;
  existingId?: string;
}

// ---- locked fields are enforced here, not only in the interface (v2, section 7) ----
const lockedKeys = () => features.profile.fieldAccess.locked;
const editableKeys = () => features.profile.fieldAccess.editable;
export const isLockedField = (key: string) => lockedKeys().includes(key);

/** Short text for "You asked for: ...". */
function describeChange(key: string, v: unknown): string {
  if (key === 'residentialAddress') {
    const a = v as T.Officer['address'];
    return `${a.line}, ${a.city} ${a.pincode}`;
  }
  if (key === 'education') return `${(v as unknown[]).length} education entries`;
  if (key === 'officeContact') {
    const o = v as T.Officer['officeContact'];
    return [o.address, o.phone, o.fax, o.mobile].filter(Boolean).join(', ');
  }
  return String(v);
}

/** The pending change a request creates on the record, one per field or entry. */
function pendingFor(r: T.Request): T.PendingChange[] {
  const v = r.values as Values;
  if (r.type === 'profile-edit')
    return Object.entries((v.changes ?? {}) as Record<string, unknown>).map(([k, val]) => ({
      requestId: r.id,
      targetKind: 'profile' as const,
      targetKey: k,
      proposedValue: describeChange(k, val),
    }));
  if ((r.type === 'posting' || r.type === 'promotion') && v.entryId)
    return [
      {
        requestId: r.id,
        targetKind: 'career',
        targetKey: String(v.entryId),
        proposedValue: r.title,
      },
    ];
  if (r.type === 'correction' && v.targetKey)
    return [
      {
        requestId: r.id,
        targetKind: v.targetKind === 'career' ? 'career' : 'profile',
        targetKey: String(v.targetKey),
        proposedValue: String(v.shouldSay ?? ''),
      },
    ];
  return [];
}
const clearPending = (db: Db, requestId: string) => {
  db.pendingChanges = db.pendingChanges.filter((p) => p.requestId !== requestId);
};

const setPath = (o: Record<string, unknown>, path: string, val: unknown) => {
  const parts = path.split('.');
  const last = parts.pop()!;
  const target = parts.reduce((acc, k) => acc[k] as Record<string, unknown>, o);
  target[last] = val;
};

/** Writes an approved profile change. */
function writeProfile(db: Db, key: string, val: unknown) {
  const o = db.officer;
  switch (key) {
    case 'languagesKnown':
      o.languages = String(val)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      break;
    case 'personalEmail':
      o.contact.personalEmail = String(val);
      break;
    case 'residentialAddress':
      o.address = clone(val as T.Officer['address']);
      break;
    case 'education':
      o.qualifications = (val as Omit<T.Education, 'id'>[]).map((q, i) => ({
        ...q,
        id: (q as T.Education).id ?? `q${i + 1}-${nextId('q')}`,
      }));
      break;
    case 'officeContact':
      o.officeContact = clone(val as T.Officer['officeContact']);
      break;
    default: {
      // Only a correction may write a locked field.
      const map: Record<string, string> = {
        name: 'name',
        identityNo: 'officerId',
        classPayScale: 'classPayScale',
        grade: 'grade',
        mobile1: 'contact.mobile1',
        officialEmail: 'contact.officialEmail',
        religion: 'religion',
        caste: 'caste',
        photo: 'photoUrl',
        gender: 'gender',
        batch: 'batch',
        seniorityNumber: 'seniorityNumber',
        ifhrmsId: 'ifhrmsId',
        recruitmentType: 'recruitmentType',
      };
      if (map[key]) setPath(o as unknown as Record<string, unknown>, map[key], val);
    }
  }
}

const recomputeCurrent = (db: Db) => {
  const cur = db.career
    .filter((c) => c.kind === 'posting' && !c.toDate)
    .sort((a, b) => b.fromDate.localeCompare(a.fromDate))[0];
  if (cur)
    Object.assign(db.officer.currentPosting, {
      postingIn: cur.postingIn ?? db.officer.currentPosting.postingIn,
      department: cur.department,
      designation: cur.designation,
      postType: (cur.postType as 'Temporary' | 'Permanent') ?? db.officer.currentPosting.postType,
      locationChange:
        (cur.locationChange as T.Officer['currentPosting']['locationChange']) ??
        db.officer.currentPosting.locationChange,
      since: cur.fromDate,
    });
  const promos = db.career.filter((c) => c.kind === 'promotion').map((c) => c.fromDate);
  if (promos.length) db.officer.lastPromotionDate = promos.sort().at(-1);
};

/** Applies an approved request to the officer's record (v2, section 6). */
function applyApproval(db: Db, r: T.Request) {
  const v = r.values as Values;
  const range = v.dates as { from: string; to: string } | undefined;
  const source = r.source;
  const common = { status: 'approved' as const, source, requestId: r.id };
  if (r.type === 'leave' && range) {
    const days = dayCount(range);
    db.leaves.unshift({
      id: nextId('l'),
      type: v.type,
      from: dmyToIso(range.from),
      to: dmyToIso(range.to),
      days,
      ...common,
    });
    const k = balanceKey(v.type);
    if (k) db.leaveBalance[k].used += days;
  } else if (r.type === 'ltc' && range) {
    db.ltcs.unshift({
      id: nextId('ltc'),
      blockYear: v.blockYear,
      from: dmyToIso(range.from),
      to: dmyToIso(range.to),
      placeFrom: v.placeFrom,
      placeTo: v.placeTo,
      who: v.who,
      leaveAvailed: v.leaveAvailed,
      ...common,
    });
  } else if (r.type === 'medical') {
    db.medicals.unshift({
      id: nextId('med'),
      date: dmyToIso(v.applicationDate),
      forWhom: v.who,
      hospital: v.hospital,
      treatment: v.treatment,
      cost: Number(String(v.cost ?? '').replace(/,/g, '')) || 0,
      concurrence: 'Pending',
      ...common,
    });
  } else if (r.type === 'gpf') {
    db.gpfs.unshift({
      id: nextId('gpf'),
      date: dmyToIso(v.date),
      type: v.type,
      purpose: v.purpose,
      amount: Number(String(v.amount ?? '').replace(/,/g, '')) || 0,
      ...common,
    });
  } else if (getRequestType(r.type)?.kind === 'service') {
    // A service card added by config only: keep what the officer entered, with the dates as ISO.
    const { _files, ...rest } = v;
    void _files;
    const card = getRequestType(r.type)!.cardKey ?? r.type;
    (db.serviceRecords[card] ??= []).unshift({
      ...rest,
      id: nextId('sr'),
      date: range ? dmyToIso(range.from) : now().slice(0, 10),
      from: range ? dmyToIso(range.from) : undefined,
      to: range ? dmyToIso(range.to) : undefined,
      ...common,
    });
  } else if (r.type === 'posting') {
    const from = dmyToIso(v.fromDate);
    const to = v.toDate ? dmyToIso(v.toDate) : undefined;
    const entry: T.CareerEntry = {
      id: v.entryId ?? nextId('c'),
      kind: 'posting',
      fromDate: from,
      toDate: to,
      designation: v.designation,
      department: v.department,
      postingIn: v.postingIn,
      postType: v.postType,
      locationChange: v.locationChange,
      officeAddress: v.officeAddress,
      orderNumber: v.orderNumber,
      orderDate: v.orderDate ? dmyToIso(v.orderDate) : undefined,
      addedByOfficer: true,
    };
    const i = db.career.findIndex((c) => c.id === entry.id);
    if (i >= 0)
      db.career[i] = { ...db.career[i], ...entry, addedByOfficer: db.career[i].addedByOfficer };
    else db.career.unshift(entry);
    if (!to) {
      // Only one posting can be current: end the previous one the day before.
      db.career
        .filter((c) => c.kind === 'posting' && !c.toDate && c.id !== entry.id)
        .forEach((c) => (c.toDate = dayBefore(from)));
      if (v.officeAddress) db.officer.officeContact.address = v.officeAddress;
    }
    db.career.sort((a, b) => b.fromDate.localeCompare(a.fromDate));
    recomputeCurrent(db);
  } else if (r.type === 'promotion') {
    const entry: T.CareerEntry = {
      id: v.entryId ?? nextId('c'),
      kind: 'promotion',
      fromDate: dmyToIso(v.promotionDate),
      designation: db.officer.currentPosting.designation,
      department: db.officer.currentPosting.department,
      fromGrade: v.fromGrade,
      toGrade: v.toGrade,
      orderNumber: v.orderNumber,
      orderDate: v.orderDate ? dmyToIso(v.orderDate) : undefined,
      addedByOfficer: true,
    };
    const i = db.career.findIndex((c) => c.id === entry.id);
    if (i >= 0)
      db.career[i] = { ...db.career[i], ...entry, addedByOfficer: db.career[i].addedByOfficer };
    else db.career.unshift(entry);
    db.career.sort((a, b) => b.fromDate.localeCompare(a.fromDate));
    db.officer.grade = v.toGrade;
    recomputeCurrent(db);
  } else if (r.type === 'profile-edit') {
    for (const [k, val] of Object.entries((v.changes ?? {}) as Record<string, unknown>))
      writeProfile(db, k, val);
  } else if (r.type === 'correction') {
    if (v.targetKey && v.shouldSay) {
      if (v.targetKind === 'career') {
        const c = db.career.find((x) => x.id === v.targetKey);
        if (c) c.designation = String(v.shouldSay);
      } else writeProfile(db, String(v.targetKey), v.shouldSay);
    }
  }
}

const NOTE: Record<string, (t: string, reason?: string) => string> = {
  submitted: (t) => `Your ${t} was sent for approval.`,
  returned: (t, r) => `Your ${t} was returned. Reason: ${r}`,
  approved: (t) => `Your ${t} was approved.`,
  rejected: (t, r) => `Your ${t} was not approved. Reason: ${r}`,
  withdrawn: (t) => `Your ${t} was withdrawn.`,
};

export const api = {
  // ---- officer and records ----
  officer: () => run((db) => clone(db.officer)),
  career: () => run((db) => clone(db.career), { list: true }),
  leaveBalance: () => run((db) => clone(db.leaveBalance)),
  leaves: () => run((db) => clone(db.leaves), { list: true }),
  ltcs: () => run((db) => clone(db.ltcs), { list: true }),
  medicals: () => run((db) => clone(db.medicals), { list: true }),
  gpfs: () => run((db) => clone(db.gpfs), { list: true }),
  /** The approved entries of any service card. A card added by config only reads its own list. */
  cardRows: (card: string) =>
    run(
      (db) =>
        clone(
          card === 'leave'
            ? db.leaves
            : card === 'ltc'
              ? db.ltcs
              : card === 'medical'
                ? db.medicals
                : card === 'gpf'
                  ? db.gpfs
                  : (db.serviceRecords[card] ?? []),
        ) as unknown as Record<string, unknown>[],
      { list: true },
    ),
  documents: () => run((db) => clone(db.documents), { list: true }),
  pendingChanges: () => run((db) => clone(db.pendingChanges)),
  /** Approved and pending leave, for the overlap check. */
  booked: () =>
    run((db): Booked[] => [
      ...db.requests
        .filter(
          (r) =>
            r.type === 'leave' &&
            ['submitted', 'approved'].includes(r.status) &&
            (r.values.dates as { from?: string })?.from,
        )
        .map((r) => ({
          title: r.title,
          from: (r.values.dates as { from: string }).from,
          to: (r.values.dates as { to: string }).to,
        })),
      ...db.leaves
        .filter((l) => l.status === 'approved' && !l.requestId)
        .map((l) => ({
          title: `Leave, ${isoToDmy(l.from)}`,
          from: isoToDmy(l.from),
          to: isoToDmy(l.to),
        })),
    ]),

  // ---- requests ----
  requests: () =>
    run((db) => clone(db.requests).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), {
      list: true,
    }),
  request: (id: string) =>
    run((db) => {
      const r = db.requests.find((x) => x.id === id);
      if (!r) throw new Error('not-found');
      return clone(r);
    }),
  saveRequest: (input: NewRequest) =>
    run(
      (db) => {
        const type = getRequestType(input.type);
        if (!type) throw new Error('unknown-type');
        const title = generateTitle(type, input.values);
        let r = input.existingId ? db.requests.find((x) => x.id === input.existingId) : undefined;
        // Locked fields cannot be written by a profile edit. Report a correction instead.
        if (input.type === 'profile-edit' && !input.draft) {
          const keys = Object.keys((input.values.changes ?? {}) as object);
          const bad = keys.find((k) => isLockedField(k) || !editableKeys().includes(k));
          if (bad) throw new Error(`locked-field:${bad}`);
          const busy = keys.find((k) =>
            db.pendingChanges.some(
              (p) => p.targetKind === 'profile' && p.targetKey === k && p.requestId !== r?.id,
            ),
          );
          if (busy) throw new Error(`pending:${busy}`);
        }
        if (!r) {
          const num = 1000 + db.requests.length + 1;
          r = {
            id: nextId('req'),
            ref: `AGR-${new Date().getFullYear()}-${num}`,
            type: input.type,
            title,
            status: 'draft',
            source: 'portal',
            values: {},
            attachments: [],
            timeline: [],
            createdAt: now(),
            updatedAt: now(),
          };
          db.requests.unshift(r);
        }
        r.values = clone(input.values);
        r.attachments = input.attachments;
        r.title = title;
        r.mode = input.mode ?? r.mode;
        r.source = sourceOf(type, input.values, r.mode);
        if (input.draft) {
          r.updatedAt = now();
          return clone(r);
        }
        const wasReturned = r.status === 'returned';
        r.status = 'submitted';
        r.submittedAt = now();
        r.returnReason = undefined;
        addTimeline(r, wasReturned ? 'Sent again' : 'Sent', 'You');
        clearPending(db, r.id);
        db.pendingChanges.push(...pendingFor(r));
        notify(db, 'request', NOTE.submitted(r.title), `/records/requests/${r.id}`);
        return clone(r);
      },
      { write: true },
    ),
  withdrawRequest: (id: string) =>
    run(
      (db) => {
        const r = db.requests.find((x) => x.id === id)!;
        if (!canWithdraw(r.status)) throw new Error('locked');
        r.status = 'withdrawn';
        addTimeline(r, 'Withdrawn', 'You');
        clearPending(db, r.id);
        notify(db, 'request', NOTE.withdrawn(r.title), `/records/requests/${r.id}`);
        return clone(r);
      },
      { write: true },
    ),
  deleteDraft: (id: string) =>
    run(
      (db) => {
        const r = db.requests.find((x) => x.id === id);
        if (r?.status !== 'draft') throw new Error('locked');
        db.requests = db.requests.filter((x) => x.id !== id);
        return true;
      },
      { write: true },
    ),
  /** Demo control: the approver's decision on a submitted request. */
  decideRequest: (id: string, to: 'approved' | 'returned' | 'rejected', reason?: string) =>
    run(
      (db) => {
        const r = db.requests.find((x) => x.id === id);
        if (!r) throw new Error('not-found');
        if (!canMove(r.status, to)) throw new Error('bad-transition');
        const why = reason?.trim() || 'Please check the details and papers, then send again.';
        r.status = to;
        if (to === 'returned') r.returnReason = why;
        if (to === 'rejected') r.rejectReason = why;
        addTimeline(
          r,
          to === 'approved' ? 'Approved' : to === 'returned' ? 'Returned' : 'Not approved',
          features.approver.title,
          to === 'approved' ? undefined : why,
        );
        clearPending(db, r.id);
        if (to === 'approved') applyApproval(db, r);
        notify(db, 'request', NOTE[to](r.title, why), `/records/requests/${r.id}`);
        return clone(r);
      },
      { write: true },
    ),
  /** Demo control: creates a returned leave request so the fix-and-send-again flow can be shown. */
  createSampleReturned: () =>
    run(
      (db) => {
        const f = new Date();
        const d = (n: number) =>
          formatDMY(new Date(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate() + n)));
        const r: T.Request = {
          id: nextId('req'),
          ref: `AGR-${f.getFullYear()}-${1000 + db.requests.length + 1}`,
          type: 'leave',
          title: `Leave, ${rangeTitle({ from: d(60), to: d(61) })}`,
          status: 'returned',
          mode: 'apply',
          source: 'portal',
          values: { type: 'Casual leave', dates: { from: d(60), to: d(61) } },
          attachments: [],
          timeline: [],
          returnReason: 'The dates fall on a holiday. Correct the dates and send again.',
          createdAt: now(),
          submittedAt: now(),
          updatedAt: now(),
        };
        addTimeline(r, 'Sent', 'You');
        addTimeline(r, 'Returned', features.approver.title, r.returnReason);
        db.requests.unshift(r);
        notify(db, 'request', NOTE.returned(r.title, r.returnReason), `/records/requests/${r.id}`);
        return clone(r);
      },
      { write: true },
    ),

  // ---- notifications ----
  notifications: () =>
    run((db) => clone(db.notifications).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), {
      list: true,
    }),
  unreadCount: () => run((db) => db.notifications.filter((n) => !n.read).length),
  markRead: (id: string) =>
    run(
      (db) => {
        const n = db.notifications.find((x) => x.id === id);
        if (n) n.read = true;
        return true;
      },
      { write: true },
    ),
  markAllRead: () =>
    run(
      (db) => {
        db.notifications.forEach((n) => (n.read = true));
        return true;
      },
      { write: true },
    ),

  // ---- community ----
  ideas: () => run((db) => db.ideas.map((i) => mapIdea(i, db)), { list: true }),
  idea: (id: string) =>
    run((db) => {
      const i = db.ideas.find((x) => x.id === id);
      if (!i) throw new Error('not-found');
      return mapIdea(i, db);
    }),
  createIdea: (v: {
    title: string;
    type: T.IdeaType;
    description: string;
    budget?: string;
    visibility: 'all' | 'admin';
    district?: string;
    department?: string;
    attachments: T.Attachment[];
  }) =>
    run(
      (db) => {
        const o = db.officer;
        const i = {
          id: nextId('idea'),
          ...v,
          status: 'submitted' as const,
          author: {
            id: ME,
            name: o.name,
            designation: o.currentPosting.designation,
            department: v.department,
            district: v.district,
          },
          authorId: ME,
          backers: [],
          grievance: false,
          createdAt: now(),
        };
        db.ideas.unshift(i);
        return mapIdea(i, db);
      },
      { write: true },
    ),
  updateIdea: (id: string, v: Partial<Pick<T.Idea, 'title' | 'description' | 'budget' | 'type'>>) =>
    run(
      (db) => {
        const i = db.ideas.find((x) => x.id === id)!;
        if (i.authorId !== ME || i.status !== 'submitted') throw new Error('locked');
        Object.assign(i, v);
        return mapIdea(i, db);
      },
      { write: true },
    ),
  backIdea: (id: string, on: boolean) =>
    run(
      (db) => {
        const i = db.ideas.find((x) => x.id === id)!;
        if (i.authorId === ME) throw new Error('own');
        i.backers = i.backers.filter((b) => b !== ME);
        if (on) i.backers.push(ME);
        return mapIdea(i, db);
      },
      { write: true },
    ),
  comments: (parentId: string) =>
    run(
      (db) =>
        db.comments
          .filter((c) => c.parentId === parentId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map(mapComment),
      { list: true },
    ),
  addComment: (
    parentId: string,
    text: string,
    opts: { replyTo?: string; anonymous?: boolean } = {},
  ) =>
    run(
      (db) => {
        const o = db.officer;
        const post = db.posts.find((p) => p.id === parentId);
        const anon = !!opts.anonymous || (!!post && post.anonymous && post.authorId === ME); // replies on one's own anonymous post stay anonymous
        const c = {
          id: nextId('cm'),
          parentId,
          author: anon
            ? ('anonymous' as const)
            : { id: ME, name: o.name, designation: o.currentPosting.designation },
          authorId: ME,
          text,
          createdAt: now(),
          replyTo: opts.replyTo,
        };
        db.comments.push(c);
        if (post) post.lastActivityAt = now();
        return mapComment(c);
      },
      { write: true },
    ),
  posts: () =>
    run(
      (db) =>
        db.posts
          .map((p) => mapPost(p, db))
          .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
      { list: true },
    ),
  post: (id: string) =>
    run((db) => {
      const p = db.posts.find((x) => x.id === id);
      if (!p) throw new Error('not-found');
      return mapPost(p, db);
    }),
  createPost: (v: {
    kind: T.Post['kind'];
    title: string;
    body: string;
    audience: T.Post['audience'];
    anonymous: boolean;
    askSeniors: boolean;
    options?: string[];
    closesAt?: string;
  }) =>
    run(
      (db) => {
        const o = db.officer;
        const p = {
          id: nextId('post'),
          kind: v.kind,
          title: v.title,
          body: v.body,
          audience: v.audience,
          anonymous: v.anonymous,
          askSeniors: v.askSeniors,
          author: {
            id: ME,
            name: o.name,
            designation: o.currentPosting.designation,
          } as T.PersonRef,
          authorId: ME,
          lastActivityAt: now(),
          createdAt: now(),
          poll:
            v.kind === 'poll'
              ? {
                  options: (v.options ?? []).map((l, i) => ({
                    id: `o${i + 1}`,
                    label: l,
                    votes: 0,
                  })),
                  closesAt: v.closesAt ?? now(),
                }
              : undefined,
        };
        db.posts.unshift(p);
        return mapPost(p, db);
      },
      { write: true },
    ),
  vote: (postId: string, optionId: string) =>
    run(
      (db) => {
        const p = db.posts.find((x) => x.id === postId)!;
        if (db.pollVotes[postId]) throw new Error('voted');
        if (p.poll && new Date(p.poll.closesAt) < new Date()) throw new Error('closed');
        db.pollVotes[postId] = optionId;
        return mapPost(p, db);
      },
      { write: true },
    ),
  report: (id: string, reason: string) => run(() => !!id && !!reason, { write: true }),
  // ---- people ----
  colleagues: () => run((db) => db.colleagues.map((c) => publicColleague(c)), { list: true }),
  colleague: (id: string) =>
    run((db) => {
      const c = db.colleagues.find((x) => x.id === id);
      if (!c) throw new Error('not-found');
      return publicColleague(c);
    }),
  departments: () => run((db) => clone(db.departments), { list: true }),
  experts: () => run((db) => clone(db.experts), { list: true }),
  addExpert: (v: {
    kind: T.Expert['kind'];
    name: string;
    description: string;
    website?: string;
    phone?: string;
  }) =>
    run(
      (db) => {
        const e: T.Expert = { id: nextId('ex'), ...v, addedBy: db.officer.name, pending: true };
        db.experts.unshift(e);
        return e;
      },
      { write: true },
    ),

  // ---- learn and library ----
  trainingEvents: () => run((db) => clone(db.trainingEvents), { list: true }),
  toggleInterest: (id: string, on: boolean) =>
    run(
      (db) => {
        const t = db.trainingEvents.find((x) => x.id === id)!;
        if (t.interestedByMe !== on) {
          t.interestedByMe = on;
          t.interestCount += on ? 1 : -1;
        }
        return clone(t);
      },
      { write: true },
    ),
  resources: () => run((db) => clone(db.resources), { list: true }),
  addResource: (v: { name: string; note?: string; links: { label: string; url: string }[] }) =>
    run(
      (db) => {
        const r: T.Resource = { id: nextId('r'), ...v, sharedBy: db.officer.name };
        db.resources.unshift(r);
        return r;
      },
      { write: true },
    ),
  awards: () => run((db) => clone(db.awards), { list: true }),
  // ---- downloads ----
  library: (kind?: T.LibraryItem['kind'][]) =>
    run((db) => clone(db.library).filter((l) => !kind || kind.includes(l.kind)), { list: true }),

  // ---- search (never returns sensitive fields) ----
  search: (q: string) =>
    run((db) => {
      const n = q.trim().toLowerCase();
      const has = (...s: (string | undefined)[]) => s.some((x) => x?.toLowerCase().includes(n));
      return {
        officers: db.colleagues
          .filter((c) => has(c.name, c.designation, c.district, c.department, c.areaOfExposure))
          .map(publicColleague),
        proposals: db.ideas.filter((i) => has(i.title, i.description)).map((i) => mapIdea(i, db)),
        discussions: db.posts.filter((p) => has(p.title, p.body)).map((p) => mapPost(p, db)),
        library: clone(db.library).filter((l) => has(l.title, l.number, l.description, l.answer)),
        requests: db.requests.filter((r) => has(r.title, r.ref)).map((r) => clone(r)),
      };
    }),

  /** Direct post, not an approval request: visible to other officers at once. */
  createTrainingRequest: (v: {
    title: string;
    description?: string;
    from?: string;
    to?: string;
    forWho: 'Myself' | 'My team';
  }) =>
    run(
      (db) => {
        const t: T.TrainingEvent = {
          id: nextId('tr'),
          kind: 'requested',
          title: v.title,
          description: v.description ?? '',
          date: undefined,
          time: undefined,
          links: [],
          interestCount: 1,
          interestedByMe: true,
          past: false,
        };
        db.trainingEvents.unshift(t);
        return clone(t);
      },
      { write: true },
    ),
  resetDemo: () =>
    run(() => {
      resetDb();
      return true;
    }),
};
export { DEPARTMENTS, formatDMY, parseDMY, SAMPLE_PDF };
