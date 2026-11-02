import { formatDate } from '@/domain/dates';
import type { Officer } from '@/domain/types';

/** Profile field keys (the same keys as `features.profile.fieldAccess`) and the wording shown for them. */
export const PROFILE_FIELD_LABELS: Record<string, string> = {
  photo: 'Photo',
  name: 'Name',
  identityNo: 'Identity No',
  serviceStatus: 'Service status',
  allotmentYear: 'Allotment Year',
  batch: 'Batch',
  cadreAndDomicile: 'Cadre & Domicile',
  recruitmentType: 'Recruitment Type',
  dateOfJoining: 'Date of Joining',
  dateOfRetirement: 'Date of Retirement',
  classPayScale: 'Class (Pay Scale)',
  grade: 'Grade',
  seniorityNumber: 'Seniority Number',
  lastPromotionDate: 'Last Promotion Date',
  ifhrmsId: 'IFHRMS ID',
  gender: 'Gender',
  dateOfBirth: 'Date of Birth',
  languagesKnown: 'Languages Known',
  religion: 'Religion',
  caste: 'Caste',
  mobile1: 'Mobile No 1',
  personalEmail: 'Personal Email',
  officialEmail: 'Official Mail ID',
  residentialAddress: 'Residential address',
  education: 'Education',
  officeContact: 'Office contact',
};

export type FieldValue = (o: Officer) => string;

const dmy = (iso?: string) => (iso ? formatDate(iso) : '');

/** The current value of a profile key, as text. */
export function currentText(key: string, o: Officer): string {
  switch (key) {
    case 'languagesKnown':
      return o.languages.join(', ');
    case 'personalEmail':
      return o.contact.personalEmail ?? '';
    case 'residentialAddress':
      return `${o.address.line}, ${o.address.city} ${o.address.pincode}`;
    case 'education':
      return o.qualifications.map((q) => `${q.degree}, ${q.specialisation}`).join('; ');
    case 'officeContact':
      return [
        o.officeContact.address,
        o.officeContact.phone,
        o.officeContact.fax,
        o.officeContact.mobile,
      ]
        .filter(Boolean)
        .join(', ');
    case 'photo':
      return 'Current photo';
    default:
      return '';
  }
}

/** A proposed value, as text (the "You asked for" line). */
export function proposedText(key: string, v: unknown): string {
  if (key === 'residentialAddress') {
    const a = v as Officer['address'];
    return `${a.line}, ${a.city} ${a.pincode}`;
  }
  if (key === 'education')
    return (v as { degree: string; specialisation: string }[])
      .map((q) => `${q.degree}, ${q.specialisation}`)
      .join('; ');
  if (key === 'officeContact') {
    const c = v as Officer['officeContact'];
    return [c.address, c.phone, c.fax, c.mobile].filter(Boolean).join(', ');
  }
  if (key === 'photo') return 'A new photo';
  return String(v ?? '');
}
export const dateText = dmy;

export interface Target {
  label: string;
  kind: 'profile' | 'career';
  key: string;
}
/** Everything an officer can report as wrong: profile fields and Career entries. */
export function ownTargets(career: import('@/domain/types').CareerEntry[] = []): Target[] {
  return [
    ...Object.entries(PROFILE_FIELD_LABELS).map(([key, label]) => ({
      label: `Profile: ${label}`,
      kind: 'profile' as const,
      key,
    })),
    ...career.map((e) => ({ label: careerLabel(e), kind: 'career' as const, key: e.id })),
  ];
}
export const careerLabel = (e: import('@/domain/types').CareerEntry) =>
  `Career: ${e.kind === 'promotion' ? `Promotion to ${e.toGrade}` : `${e.designation}, ${e.postingIn ?? e.department}`}`;
