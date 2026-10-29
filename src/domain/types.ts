import type { IdeaStatus, RequestStatus } from './status';

export type Provenance = 'verified' | 'self-reported';
export interface PersonRef {
  id: string;
  name: string;
  designation?: string;
  department?: string;
  district?: string;
}

export interface Officer {
  id: string;
  officerId: string;
  ifhrmsId: string;
  name: string;
  salutation: string;
  photoUrl?: string;
  service: 'IAS';
  batch: number;
  status: 'serving' | 'retired';
  dateOfBirth: string;
  gender: string;
  homeState: string;
  nativeDistrict: string;
  languages: string[];
  contact: {
    mobile1: string;
    mobile2?: string;
    landline?: string;
    officialEmail: string;
    personalEmail?: string;
  };
  address: { line: string; city: string; pincode: string };
  qualifications: {
    id: string;
    level: string;
    degree: string;
    specialisation: string;
    institute: string;
    state: string;
    country: string;
    year: number;
  }[];
  dateOfJoining: string;
  dateOfRetirement: string;
  recruitmentType: string;
  grade: string;
  payLevel: string;
  seniorityNumber: string;
  currentPosting: {
    postingIn: string;
    department: string;
    designation: string;
    officeAddress: string;
    phone?: string;
    fax?: string;
    postType: 'Temporary' | 'Permanent' | 'Ex-cadre';
    locationChange: 'In situ' | 'Within state' | 'Outside state';
    since: string;
  };
  lastPromotionDate?: string;
  areaOfExposure?: string;
  sensitive: { class: string; religion: string; caste?: string };
  fieldMeta: Record<string, Provenance>;
}

export interface CareerEntry {
  id: string;
  kind: 'posting' | 'transfer' | 'promotion';
  fromDate: string;
  toDate?: string;
  designation: string;
  department: string;
  postingIn?: string;
  postType?: string;
  locationChange?: string;
  fromGrade?: string;
  toGrade?: string;
  orderId?: string;
}
export type LeaveKey = 'cl' | 'rh' | 'el' | 'hpl';
export type LeaveBalance = Record<LeaveKey, { allowed: number; used: number }>;
export interface LeaveRecord {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: RequestStatus;
  orderId?: string;
  requestId?: string;
}
export interface TrainingRecord {
  id: string;
  type: string;
  from: string;
  to: string;
  institute: string;
  country?: string;
  orderId?: string;
}
export interface TravelRecord {
  id: string;
  kind: 'foreign' | 'tour' | 'private';
  place: string;
  from: string;
  to: string;
  purpose?: string;
  status: RequestStatus;
  orderId?: string;
  politicalClearance?: boolean;
  fcraClearance?: boolean;
}
export interface PropertyRecord {
  id: string;
  kind: 'immovable' | 'movable' | 'intimation';
  type: string;
  details: string;
  funding: string;
  cost: number;
  shownInReturn: boolean;
  selfOrFamily: string;
}
export interface BenefitRecord {
  id: string;
  kind: 'ltc' | 'medical' | 'hba' | 'gpf' | 'mha-id' | 'saf' | 'education';
  summary: string;
  amount?: number;
  date: string;
  status: RequestStatus;
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
export interface Note {
  id: string;
  from: 'officer' | 'desk';
  text: string;
  createdAt: string;
}
export interface Request {
  id: string;
  ref: string;
  type: string;
  title: string;
  status: RequestStatus;
  holder: 'officer' | 'desk' | 'desk-officer' | 'none';
  values: Record<string, unknown>;
  attachments: Attachment[];
  timeline: TimelineEntry[];
  notes: Note[];
  returnReason?: string;
  rejectReason?: string;
  orderId?: string;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
  lastStep?: number;
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
export interface Article {
  id: string;
  title: string;
  authorRole: string;
  author: PersonRef;
  district?: string;
  summary: string;
  tags: string[];
  sections: { heading: string; body: string }[];
  attachments: Attachment[];
  leadImageUrl?: string;
  status: 'draft' | 'published';
  kind: 'article' | 'handover-note';
  savedByMe: boolean;
  mine: boolean;
  createdAt: string;
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
  /** Present only when the officer chose to share. */
  sharedContact?: { phone?: string; email?: string };
  officialEmail: string;
  savedByMe: boolean;
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
  kind: 'rule' | 'circular' | 'go' | 'form' | 'faq' | 'announcement';
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
  savedByMe?: boolean;
}
export interface Notification {
  id: string;
  type: 'request' | 'reply' | 'idea-status' | 'circular' | 'training';
  text: string;
  targetRoute: string;
  createdAt: string;
  read: boolean;
}
export interface DeskTask {
  id: string;
  text: string;
  done: boolean;
  due?: string;
  createdAt: string;
}
export interface DeskNote {
  id: string;
  text: string;
  createdAt: string;
}
export interface SavedItem {
  id: string;
  kind: 'person' | 'article' | 'idea' | 'library';
  refId: string;
}
export interface Settings {
  sharePhone: boolean;
  shareEmail: boolean;
  notify: Record<'requests' | 'replies' | 'circulars' | 'trainings', boolean>;
}
