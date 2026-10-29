// The repository. Pages reach it only through hooks (see hooks.ts). Every method returns a promise
// with 300 to 800 ms of delay. To use a real API, write another object with the same shape.
import { REQUEST_TYPES, getRequestType } from '@/config/requests';
import { DEPARTMENTS } from '@/config/options';
import { formatDMY } from '@/domain/dates';
import {
  balanceKey,
  canMove,
  canWithdraw,
  dayCount,
  generateTitle,
  type Booked,
  type Values,
} from '@/domain/requests';
import type { RequestStatus } from '@/domain/status';
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

// ---- privacy: what other officers may see (brief, section 9) ----
const publicColleague = (c: T.Colleague, db: Db): T.Colleague => ({
  ...c,
  savedByMe: db.saved.some((s) => s.kind === 'person' && s.refId === c.id),
});

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
const mapArticle = (a: Db['articles'][number], db: Db): T.Article => ({
  ...a,
  mine: a.authorId === ME,
  savedByMe: db.saved.some((s) => s.kind === 'article' && s.refId === a.id),
});
const mapLib = (l: T.LibraryItem, db: Db): T.LibraryItem => ({
  ...l,
  savedByMe: db.saved.some((s) => s.kind === 'library' && s.refId === l.id),
});

function notify(db: Db, type: T.Notification['type'], text: string, route: string) {
  db.notifications.unshift({
    id: nextId('n'),
    type,
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
  values: Values;
  attachments: T.Attachment[];
  draft?: boolean;
  lastStep?: number;
  existingId?: string;
}

/** Applies an approved request to the officer's records. */
function applyApproval(db: Db, r: T.Request) {
  const order: T.DocumentItem = {
    id: nextId('d'),
    title: `Order: ${r.title}`,
    kind: 'Order',
    orderNumber: `G.O. (Ms) No. ${100 + db.documents.length}`,
    date: now().slice(0, 10),
    linkedTo: { kind: 'request', id: r.id, label: 'Request', to: `/requests/${r.id}` },
    fileUrl: SAMPLE_PDF,
  };
  db.documents.unshift(order);
  r.orderId = order.id;
  const v = r.values as Values;
  const range = v.dates as { from: string; to: string } | undefined;
  if (r.type === 'leave' && range) {
    const days = dayCount(range);
    db.leaves.unshift({
      id: nextId('l'),
      type: v.type,
      from: dmyToIso(range.from),
      to: dmyToIso(range.to),
      days,
      status: 'approved',
      orderId: order.id,
      requestId: r.id,
    });
    const k = balanceKey(v.type);
    if (k) db.leaveBalance[k].used += days;
  } else if (r.type === 'training-request') {
    /* a request is not a completed course: nothing is added */
  } else if (
    (r.type === 'foreign-visit' || r.type === 'tour' || r.type === 'private-visit') &&
    range
  ) {
    db.travels.unshift({
      id: nextId('v'),
      kind: r.type === 'foreign-visit' ? 'foreign' : r.type === 'tour' ? 'tour' : 'private',
      place: v.country ?? v.district,
      from: dmyToIso(range.from),
      to: dmyToIso(range.to),
      purpose: v.purpose,
      status: 'approved',
      orderId: order.id,
      politicalClearance: r.type === 'foreign-visit',
      fcraClearance: r.type === 'foreign-visit',
    });
  } else if (['ltc', 'medical', 'hba', 'gpf', 'mha-id', 'saf', 'education'].includes(r.type)) {
    db.benefits.unshift({
      id: nextId('b'),
      kind: r.type as T.BenefitRecord['kind'],
      summary: r.title,
      amount:
        Number(String(v.cost ?? v.amount ?? v.amountRequested ?? '').replace(/,/g, '')) ||
        undefined,
      date: now().slice(0, 10),
      status: 'approved',
    });
  } else if (['immovable', 'movable', 'intimation'].includes(r.type)) {
    db.properties.unshift({
      id: nextId('p'),
      kind: r.type as T.PropertyRecord['kind'],
      type: v.type,
      details: v.details,
      funding: v.source,
      cost: Number(String(v.cost ?? '').replace(/,/g, '')) || 0,
      shownInReturn: v.shownInIpr === 'Yes',
      selfOrFamily: v.selfOrFamily,
    });
  }
}

const NOTE: Record<string, (t: string, reason?: string) => string> = {
  'with-desk': (t) => `Your ${t} is now with the desk.`,
  'ready-for-approval': (t) => `Your ${t} is ready for approval.`,
  returned: (t, r) => `Your ${t} was returned. Reason: ${r}`,
  approved: (t) => `Your ${t} was approved.`,
  rejected: (t, r) => `Your ${t} was not approved. Reason: ${r}`,
  withdrawn: (t) => `Your ${t} was withdrawn.`,
};

export const api = {
  // ---- officer and file ----
  officer: () => run((db) => clone(db.officer)),
  career: () => run((db) => clone(db.career), { list: true }),
  leaveBalance: () => run((db) => clone(db.leaveBalance)),
  leaves: () => run((db) => clone(db.leaves), { list: true }),
  trainings: () => run((db) => clone(db.trainings), { list: true }),
  travels: () => run((db) => clone(db.travels), { list: true }),
  properties: () => run((db) => clone(db.properties), { list: true }),
  benefits: () => run((db) => clone(db.benefits), { list: true }),
  documents: () => run((db) => clone(db.documents), { list: true }),
  booked: () =>
    run((db): Booked[] => [
      ...db.requests
        .filter(
          (r) =>
            ['submitted', 'with-desk', 'ready-for-approval', 'approved'].includes(r.status) &&
            (r.values.dates as { from?: string })?.from,
        )
        .map((r) => ({
          title: r.title,
          from: (r.values.dates as { from: string }).from,
          to: (r.values.dates as { to: string }).to,
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
        const type = getRequestType(input.type)!;
        const title = generateTitle(type, input.values);
        let r = input.existingId ? db.requests.find((x) => x.id === input.existingId) : undefined;
        if (!r) {
          const num = 1000 + db.requests.length + 1;
          r = {
            id: nextId('req'),
            ref: `AGR-${new Date().getFullYear()}-${num}`,
            type: input.type,
            title,
            status: 'draft',
            holder: 'officer',
            values: {},
            attachments: [],
            timeline: [],
            notes: [],
            createdAt: now(),
            updatedAt: now(),
          };
          db.requests.unshift(r);
        }
        r.values = clone(input.values);
        r.attachments = input.attachments;
        r.title = title;
        r.lastStep = input.lastStep;
        if (input.draft) {
          r.updatedAt = now();
          return clone(r);
        }
        const wasReturned = r.status === 'returned';
        r.status = 'submitted';
        r.holder = 'desk';
        r.submittedAt = now();
        r.returnReason = undefined;
        addTimeline(r, wasReturned ? 'Sent again' : 'Sent', 'You');
        if (type.autoApprove && ['Contact'].includes(String(input.values.section))) {
          applyDetailsChange(db, input.values);
          r.status = 'approved';
          r.holder = 'none';
          addTimeline(r, 'Approved', 'Desk Officer');
          notify(db, 'request', `Your ${r.title} was approved.`, `/requests/${r.id}`);
        }
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
        r.holder = 'none';
        addTimeline(r, 'Withdrawn', 'You');
        notify(db, 'request', NOTE.withdrawn(r.title), `/requests/${r.id}`);
        return clone(r);
      },
      { write: true },
    ),
  addNote: (id: string, text: string) =>
    run(
      (db) => {
        const r = db.requests.find((x) => x.id === id)!;
        r.notes.push({ id: nextId('n'), from: 'officer', text, createdAt: now() });
        r.updatedAt = now();
        return clone(r);
      },
      { write: true },
    ),
  /** Demo control: move the request one step along its route. */
  advanceRequest: (id: string, to?: RequestStatus, reason?: string) =>
    run(
      (db) => {
        const r = db.requests.find((x) => x.id === id);
        if (!r) throw new Error('not-found');
        const order: RequestStatus[] = ['submitted', 'with-desk', 'ready-for-approval', 'approved'];
        const target = to ?? order[order.indexOf(r.status) + 1];
        if (!target || !canMove(r.status, target)) throw new Error('bad-transition');
        const why = reason ?? 'Please check the dates and papers, then send again.';
        r.status = target;
        r.holder =
          target === 'with-desk'
            ? 'desk'
            : target === 'ready-for-approval'
              ? 'desk-officer'
              : target === 'returned'
                ? 'officer'
                : 'none';
        if (target === 'returned') r.returnReason = why;
        if (target === 'rejected') r.rejectReason = why;
        const label: Partial<Record<RequestStatus, [string, string]>> = {
          'with-desk': ['With desk', 'Desk Assistant'],
          'ready-for-approval': ['Ready for approval', 'Desk Assistant'],
          approved: ['Approved', 'Desk Officer'],
          rejected: ['Not approved', 'Desk Officer'],
          returned: ['Returned', 'Desk Officer'],
        };
        addTimeline(
          r,
          label[target]![0],
          label[target]![1],
          target === 'returned' ? why : undefined,
        );
        if (target === 'approved') {
          applyApproval(db, r);
          addTimeline(r, 'Order issued', 'Desk Officer');
        }
        notify(db, 'request', NOTE[target](r.title, why), `/requests/${r.id}`);
        return clone(r);
      },
      { write: true },
    ),
  updateOfficer: (patch: Partial<T.Officer['contact']>) =>
    run(
      (db) => {
        Object.assign(db.officer.contact, patch);
        return clone(db.officer);
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
  report: (_id: string, _reason: string) => run(() => true, { write: true }),
  articles: () =>
    run(
      (db) =>
        db.articles.map((a) => mapArticle(a, db)).filter((a) => a.status === 'published' || a.mine),
      { list: true },
    ),
  article: (id: string) =>
    run((db) => {
      const a = db.articles.find((x) => x.id === id);
      if (!a) throw new Error('not-found');
      return mapArticle(a, db);
    }),
  createArticle: (v: {
    kind: T.Article['kind'];
    title: string;
    authorRole: string;
    summary: string;
    sections: T.Article['sections'];
    attachments: T.Attachment[];
    tags: string[];
    status: 'draft' | 'published';
  }) =>
    run(
      (db) => {
        const o = db.officer;
        const a = {
          id: nextId('art'),
          ...v,
          author: {
            id: ME,
            name: o.name,
            designation: o.currentPosting.designation,
          } as T.PersonRef,
          authorId: ME,
          district: o.currentPosting.postingIn,
          createdAt: now(),
        };
        db.articles.unshift(a);
        return mapArticle(a, db);
      },
      { write: true },
    ),

  // ---- people ----
  colleagues: () => run((db) => db.colleagues.map((c) => publicColleague(c, db)), { list: true }),
  colleague: (id: string) =>
    run((db) => {
      const c = db.colleagues.find((x) => x.id === id);
      if (!c) throw new Error('not-found');
      return publicColleague(c, db);
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
  library: (kind?: T.LibraryItem['kind'][]) =>
    run(
      (db) => db.library.filter((l) => !kind || kind.includes(l.kind)).map((l) => mapLib(l, db)),
      { list: true },
    ),

  // ---- desk ----
  tasks: () => run((db) => clone(db.tasks), { list: true }),
  addTask: (text: string, due?: string) =>
    run(
      (db) => {
        db.tasks.unshift({ id: nextId('tk'), text, done: false, due, createdAt: now() });
        return true;
      },
      { write: true },
    ),
  toggleTask: (id: string) =>
    run(
      (db) => {
        const t = db.tasks.find((x) => x.id === id);
        if (t) t.done = !t.done;
        return true;
      },
      { write: true },
    ),
  deleteTask: (id: string) =>
    run(
      (db) => {
        db.tasks = db.tasks.filter((x) => x.id !== id);
        return true;
      },
      { write: true },
    ),
  notes: () => run((db) => clone(db.notes), { list: true }),
  addNote2: (text: string) =>
    run(
      (db) => {
        db.notes.unshift({ id: nextId('nt'), text, createdAt: now() });
        return true;
      },
      { write: true },
    ),
  deleteNote: (id: string) =>
    run(
      (db) => {
        db.notes = db.notes.filter((x) => x.id !== id);
        return true;
      },
      { write: true },
    ),
  saved: () => run((db) => clone(db.saved), { list: true }),
  toggleSaved: (kind: T.SavedItem['kind'], refId: string, on: boolean) =>
    run(
      (db) => {
        db.saved = db.saved.filter((s) => !(s.kind === kind && s.refId === refId));
        if (on) db.saved.push({ id: nextId('sv'), kind, refId });
        return true;
      },
      { write: true },
    ),

  // ---- search (never returns sensitive fields) ----
  search: (q: string) =>
    run((db) => {
      const n = q.trim().toLowerCase();
      const has = (...s: (string | undefined)[]) => s.some((x) => x?.toLowerCase().includes(n));
      return {
        officers: db.colleagues
          .filter((c) => has(c.name, c.designation, c.district, c.department, c.areaOfExposure))
          .map((c) => publicColleague(c, db)),
        ideas: db.ideas.filter((i) => has(i.title, i.description)).map((i) => mapIdea(i, db)),
        discussions: db.posts.filter((p) => has(p.title, p.body)).map((p) => mapPost(p, db)),
        articles: db.articles
          .filter((a) => a.status === 'published' && has(a.title, a.summary, ...a.tags))
          .map((a) => mapArticle(a, db)),
        library: db.library
          .filter((l) => has(l.title, l.number, l.description, l.answer))
          .map((l) => mapLib(l, db)),
        requests: db.requests.filter((r) => has(r.title, r.ref)).map((r) => clone(r)),
      };
    }),

  // ---- settings ----
  settings: () => run((db) => clone(db.settings)),
  saveSettings: (v: T.Settings, contact: Partial<T.Officer['contact']>) =>
    run(
      (db) => {
        db.settings = clone(v);
        Object.assign(db.officer.contact, contact);
        return true;
      },
      { write: true },
    ),
  resetDemo: () =>
    run(() => {
      resetDb();
      return true;
    }),
};

function applyDetailsChange(db: Db, v: Values) {
  const map: Record<string, keyof T.Officer['contact']> = {
    'Mobile number 1': 'mobile1',
    'Mobile number 2': 'mobile2',
    Landline: 'landline',
    'Personal email': 'personalEmail',
  };
  const key = map[String(v.field)];
  if (key) {
    db.officer.contact[key] = String(v.newValue);
    db.officer.fieldMeta[key] = 'self-reported';
  }
}
export { REQUEST_TYPES, DEPARTMENTS, formatDMY };
