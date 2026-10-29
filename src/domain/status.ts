export const REQUEST_STATUSES = [
  'draft',
  'submitted',
  'with-desk',
  'ready-for-approval',
  'returned',
  'approved',
  'rejected',
  'withdrawn',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const IDEA_STATUSES = [
  'submitted',
  'under-review',
  'accepted',
  'not-taken-forward',
] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export type Tone =
  'neutral' | 'info' | 'warning-soft' | 'warning-strong' | 'success' | 'success-soft' | 'critical';

/** Status chip config (brief, section 9). Wording lives in common.json under status.*. */
export const STATUS_STYLE: Record<string, { tone: Tone; label: string }> = {
  draft: { tone: 'neutral', label: 'status.draft' },
  submitted: { tone: 'info', label: 'status.submitted' },
  'with-desk': { tone: 'info', label: 'status.withDesk' },
  'ready-for-approval': { tone: 'warning-soft', label: 'status.readyForApproval' },
  returned: { tone: 'warning-strong', label: 'status.returned' },
  approved: { tone: 'success', label: 'status.approved' },
  rejected: { tone: 'critical', label: 'status.rejected' },
  withdrawn: { tone: 'neutral', label: 'status.withdrawn' },
  'idea:submitted': { tone: 'neutral', label: 'status.submitted' },
  'idea:under-review': { tone: 'info', label: 'status.underReview' },
  'idea:accepted': { tone: 'success', label: 'status.accepted' },
  'idea:not-taken-forward': { tone: 'neutral', label: 'status.notTakenForward' },
  'award:open': { tone: 'success', label: 'status.awardOpen' },
  'award:closed': { tone: 'neutral', label: 'status.awardClosed' },
  'officer:serving': { tone: 'success-soft', label: 'status.serving' },
};
