import type { IdeaStatus, RequestStatus } from './status';

export type Provenance = 'verified' | 'self-reported';
export interface PersonRef {
  id: string;
  name: string;
  designation?: string;
  department?: string;
  district?: string;
}

export interface Education {
  id: string;
  level: string;
  degree: string;
  specialisation: string;
  institute: string;
  state: string;
  country: string;
  year: number;
}
export interface Officer {
  id: string;
  /** Identity No (locked). */
  officerId: string;
  ifhrmsId: string;
  name: string;
  salutation: string;
  photoUrl?: string;
  service: 'IAS';
  allotmentYear: number;
  batch: number;
  cadreAndDomicile: string;
  status: 'serving' | 'retired';
  dateOfBirth: string;
  gender: string;
  languages: string[];
  contact: { mobile1: string; officialEmail: string; personalEmail?: string };
  /** Residential address (editable). */
  address: { line: string; city: string; pincode: string };
  qualifications: Education[];
  dateOfJoining: string;
  dateOfRetirement: string;
  recruitmentType: string;
  grade: string;
  /** ONE field: the level of the pay scale, for example "Level 14". */
  classPayScale: string;
  seniorityNumber: string;
  currentPosting: {
    postingIn: string;
    department: string;
    designation: string;
    postType: 'Temporary' | 'Permanent';
    locationChange: 'In situ' | 'Within state' | 'Outside state';
    since: string;
  };
  officeContact: { address: string; phone: string; fax: string; mobile: string };
  lastPromotionDate?: string;
  areaOfExposure?: string;
  /** Visible only to the signed-in officer. */
  religion: string;
  caste?: string;
}

export interface CareerEntry {
  id: string;
  kind: 'posting' | 'promotion';
  fromDate: string;
  toDate?: string;
  designation: string;
  department: string;
  postingIn?: string;
  postType?: string;
  locationChange?: string;
  officeAddress?: string;
  fromGrade?: string;
  toGrade?: string;
  orderNumber?: string;
  orderDate?: string;
  orderId?: string;
  addedByOfficer: boolean;
}
export type Source = 'portal' | 'paper';
export type Mode = 'apply' | 'past' | 'record';
export type LeaveKey = 'cl' | 'rh' | 'el' | 'hpl';
export type LeaveBalance = Record<LeaveKey, { allowed: number; used: number }>;
export interface LeaveRecord {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: RequestStatus;
  source: Source;
  orderId?: string;
  requestId?: string;
}
/** An entry on a service card that has no list of its own (a card added by config only). */
export interface ServiceRecord {
  id: string;
  status: RequestStatus;
  source: Source;
  requestId?: string;
  /** ISO date used as the main date of the row. */
  date: string;
  from?: string;
  to?: string;
  [field: string]: unknown;
}
export interface LtcRecord {
  id: string;
  blockYear: string;
  from: string;
  to: string;
  placeFrom: string;
  placeTo: string;
  who: 'Self' | 'Family';
  leaveAvailed: string;
  status: RequestStatus;
  source: Source;
  requestId?: string;
}
export interface MedicalClaim {
  id: string;
  date: string;
  forWhom: 'Self' | 'Family';
  hospital: string;
  treatment: string;
  cost: number;
  status: RequestStatus;
  /** Set by the department. Read-only for the officer. */
  concurrence: 'Pending' | 'Received' | 'Not received';
  source: Source;
  requestId?: string;
}
export interface GpfWithdrawal {
  id: string;
  date: string;
  type: string;
  purpose: string;
  amount: number;
  status: RequestStatus;
  source: Source;
  requestId?: string;
}
export interface DocumentItem {
  id: string;
  title: string;
  kind: string;
  orderNumber?: string;
  date: string;
  linkedTo?: { kind: string; id: string; label: string; to: string };
  fileUrl: string;
}

export interface Attachment {
  name: string;
  size: number;
}
export interface TimelineEntry {
  id: string;
  title: string;
  date: string;
  role?: string;
  note?: string;
}
export interface Request {
  id: string;
  ref: string;
  type: string;
  title: string;
  status: RequestStatus;
  mode?: Mode;
  source: Source;
  values: Record<string, unknown>;
  attachments: Attachment[];
  timeline: TimelineEntry[];
  returnReason?: string;
  rejectReason?: string;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
}
/** A change waiting for approval, shown as "Change pending" on the page it belongs to. */
export interface PendingChange {
  requestId: string;
  targetKind: 'profile' | 'career';
  /** A profile field key, or a career entry id. */
  targetKey: string;
  proposedValue: string;
}

export type IdeaType =
  | 'Flagship initiative'
  | 'Best practice'
  | 'Pilot proposal'
  | 'Policy request'
  | 'Resource request'
  | 'Coordination issue'
  | 'Scheme feedback'
  | 'Last-mile gap'
  | 'Law and order'
  | 'General suggestion'
  | 'Other';
export interface Idea {
  id: string;
  title: string;
  type: IdeaType;
  description: string;
  budget?: string;
  visibility: 'all' | 'admin';
  status: IdeaStatus;
  statusReason?: string;
  author: PersonRef;
  department?: string;
  district?: string;
  attachments: Attachment[];
  backers: string[]; // officer ids
  grievance: boolean;
  createdAt: string;
  backerCount: number;
  backedByMe: boolean;
  commentCount: number;
  mine: boolean;
}
export interface Comment {
  id: string;
  parentId: string;
  author: PersonRef | 'anonymous';
  text: string;
  createdAt: string;
  mine: boolean;
  replyTo?: string;
}
export interface Post {
  id: string;
  kind: 'discussion' | 'experience' | 'poll';
  title: string;
  body: string;
  audience: 'all' | 'district' | 'department';
  anonymous: boolean;
  askSeniors: boolean;
  author: PersonRef | 'anonymous';
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
  mine: boolean;
  poll?: {
    options: { id: string; label: string; votes: number }[];
    closesAt: string;
    myVote?: string;
  };
}
export interface Colleague {
  id: string;
  name: string;
  designation: string;
  service: 'IAS' | 'IPS' | 'IFS' | 'TNCS';
  batch?: number;
  district?: string;
  department?: string;
  areaOfExposure?: string;
  statusNote?: 'On leave' | 'On training';
  photoUrl?: string;
  officialEmail: string;
}
export interface OrgPost {
  id: string;
  title: string;
  rank: string;
  officerId?: string;
  officerName?: string;
  sections: { id: string; name: string; subjects: string[] }[];
}
export interface Department {
  id: string;
  name: string;
  posts: OrgPost[];
}
export interface Expert {
  id: string;
  kind: 'organisation' | 'individual';
  name: string;
  description: string;
  website?: string;
  phone?: string;
  addedBy: string;
  pending?: boolean;
}
export interface TrainingEvent {
  id: string;
  kind: 'official' | 'requested';
  title: string;
  description: string;
  date?: string;
  time?: string;
  links: { label: string; url: string }[];
  interestCount: number;
  interestedByMe: boolean;
  past: boolean;
}
export interface Resource {
  id: string;
  name: string;
  note?: string;
  links: { label: string; url: string }[];
  sharedBy: string;
}
export interface Award {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  timeline: string;
  opensOn?: string;
  closesOn?: string;
  link?: string;
  awardees: { year: number; name: string; designation: string }[];
}
export interface LibraryItem {
  id: string;
  kind: 'rule' | 'circular' | 'go' | 'form' | 'faq' | 'announcement' | 'special' | 'dro';
  number?: string;
  date: string;
  title: string;
  description?: string;
  topic?: string;
  situation?: string;
  type?: 'Circular' | 'GO' | 'Special entry';
  fileUrl?: string;
  answer?: string;
  pinned?: boolean;
}
export interface Notification {
  id: string;
  type: 'request' | 'reply' | 'idea-status' | 'circular' | 'training';
  /** Bell filter: request alerts and community alerts. */
  category: 'requests' | 'community';
  text: string;
  targetRoute: string;
  createdAt: string;
  read: boolean;
}
