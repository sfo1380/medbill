/**
 * Core data model for Medbill.
 *
 * All money values are stored as whole cents (integers) to avoid
 * floating-point rounding errors. Dates are ISO strings: "YYYY-MM-DD".
 */

export type ISODate = string;
export type Cents = number;

/** One charge on a provider's bill. */
export interface LineItem {
  id: string;
  /** CPT/HCPCS procedure code, or a hospital revenue code. */
  code: string;
  codeType: 'CPT' | 'HCPCS' | 'REV';
  /** Plain-English name shown to the user. */
  plainName: string;
  /** Optional longer explanation shown when the charge is expanded. */
  explanation?: string;
  serviceDate: ISODate;
  units: number;
  charge: Cents;
}

/** Summary of the insurer's Explanation of Benefits (EOB) for the claim. */
export interface EobSummary {
  claimNumber?: string;
  billedAmount: Cents;
  allowedAmount: Cents;
  planPaid: Cents;
  /** What the insurer says the patient owes. */
  patientResponsibility: Cents;
  inNetwork: boolean;
  denied?: boolean;
  denialReason?: string;
}

/** A bill from a provider, as parsed from a photo or PDF. */
export interface Bill {
  id: string;
  providerName: string;
  providerShortName: string;
  /** e.g. "ER visit", "MRI", "Office visit" */
  visitType: string;
  serviceDate: ISODate;
  uploadedOn: ISODate;
  accountNumber?: string;
  /** Nonprofit hospitals must offer financial assistance. */
  isNonprofitHospital?: boolean;
  /** True when the bill lists every charge with codes. */
  isItemized: boolean;
  totalCharges: Cents;
  insurancePaid: Cents;
  /** What the provider is asking the patient to pay. */
  amountDue: Cents;
  lineItems: LineItem[];
  eob?: EobSummary;
}

export type IssueKind =
  | 'eob_mismatch'
  | 'duplicate_charge'
  | 'billed_before_insurance'
  | 'high_level_er'
  | 'claim_denied';

export type IssueSeverity = 'likely_error' | 'worth_asking';

export interface Issue {
  id: string;
  kind: IssueKind;
  severity: IssueSeverity;
  title: string;
  detail: string;
  /** Dollars potentially wrong, or null when the amount can't be estimated. */
  amount: Cents | null;
  lineItemIds: string[];
}

export type DisputeScore = 'low' | 'medium' | 'high';

export interface Analysis {
  billId: string;
  issues: Issue[];
  score: DisputeScore;
  /** Total that may be wrong, capped at the amount due. */
  amountAtStake: Cents;
  /** What the patient should owe according to the EOB, if known. */
  expectedPatientOwes: Cents | null;
}

export type StepKind =
  | 'itemized_bill'
  | 'dispute_letter'
  | 'insurance_appeal'
  | 'financial_assistance'
  | 'request_records';

export type StepStatus = 'todo' | 'ready' | 'done';

export interface ActionStep {
  id: string;
  kind: StepKind;
  title: string;
  detail: string;
  status: StepStatus;
  optional?: boolean;
}

export interface TimelineEvent {
  id: string;
  date: ISODate;
  title: string;
  detail?: string;
}

export interface CallLogEntry {
  id: string;
  date: ISODate;
  who: string;
  reference?: string;
  notes: string;
}

export interface Deadline {
  title: string;
  date: ISODate;
  detail?: string;
}

export type CaseStatus = 'not_started' | 'in_progress' | 'letter_sent' | 'needs_you' | 'resolved';

/** A dispute the user is working on — one per bill. */
export interface CaseFile {
  id: string;
  billId: string;
  status: CaseStatus;
  openedOn: ISODate;
  steps: ActionStep[];
  timeline: TimelineEvent[];
  calls: CallLogEntry[];
  documents: string[];
  nextDeadline?: Deadline;
  /** The user's edited letter text, if they changed the draft. */
  letterText?: string;
  savedAmount?: Cents;
  resolvedOn?: ISODate;
}

/** A past dispute that was resolved, for the savings total. */
export interface ResolvedRecord {
  providerName: string;
  savedAmount: Cents;
  resolvedOn: ISODate;
}
