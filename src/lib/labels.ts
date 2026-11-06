import type { CaseStatus, DisputeScore, IssueSeverity } from '../types';

export type Tone = 'teal' | 'orange' | 'blue' | 'gray';

export const caseStatus: Record<CaseStatus, { label: string; tone: Tone }> = {
  not_started: { label: 'Not started', tone: 'gray' },
  in_progress: { label: 'In progress', tone: 'blue' },
  letter_sent: { label: 'Letter sent', tone: 'teal' },
  needs_you: { label: 'Needs you', tone: 'orange' },
  resolved: { label: 'Resolved', tone: 'teal' },
};

export const severity: Record<IssueSeverity, { label: string; tone: Tone }> = {
  likely_error: { label: 'Likely error', tone: 'orange' },
  worth_asking: { label: 'Worth asking', tone: 'blue' },
};

export const score: Record<DisputeScore, { label: string; bars: number }> = {
  low: { label: 'Low', bars: 1 },
  medium: { label: 'Medium', bars: 2 },
  high: { label: 'High', bars: 3 },
};
