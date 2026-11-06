import type { Analysis, Bill, Cents, DisputeScore, Issue, LineItem } from '../types';
import { money } from '../lib/format';

/**
 * Rule-based error detection for a parsed bill.
 *
 * In the MVP the bill arrives already structured (sample data). Later, the
 * OCR/AI step will produce the same `Bill` shape from a photo or PDF, and
 * these rules keep working unchanged. Each rule is small and testable.
 */

/** Differences below this are treated as rounding, not errors. */
const TOLERANCE: Cents = 100;

/** A "likely error" total at or above this makes the dispute score High. */
const HIGH_SCORE_THRESHOLD: Cents = 10_000;

/** Highest-level emergency department visit codes. */
const HIGH_LEVEL_ER_CODES = new Set(['99285']);

export function analyzeBill(bill: Bill): Analysis {
  const issues: Issue[] = [
    ...checkDenial(bill),
    ...checkEobMismatch(bill),
    ...checkBilledBeforeInsurance(bill),
    ...checkDuplicates(bill),
    ...checkHighLevelEr(bill),
  ];

  const likelyTotal = issues
    .filter((i) => i.severity === 'likely_error')
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  const denialAmount = issues
    .filter((i) => i.kind === 'claim_denied')
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  const amountAtStake = Math.min(likelyTotal + denialAmount, bill.amountDue);

  return {
    billId: bill.id,
    issues,
    score: scoreFor(issues, likelyTotal),
    amountAtStake,
    expectedPatientOwes: bill.eob && !bill.eob.denied ? bill.eob.patientResponsibility : null,
  };
}

function scoreFor(issues: Issue[], likelyTotal: Cents): DisputeScore {
  if (likelyTotal >= HIGH_SCORE_THRESHOLD) return 'high';
  if (issues.some((i) => i.kind === 'claim_denied')) return 'high';
  if (issues.length > 0) return 'medium';
  return 'low';
}

/** The insurer denied the claim outright — the fix is an appeal. */
function checkDenial(bill: Bill): Issue[] {
  if (!bill.eob?.denied) return [];
  return [
    {
      id: `${bill.id}-denied`,
      kind: 'claim_denied',
      severity: 'worth_asking',
      title: 'Insurance denied this claim',
      detail: bill.eob.denialReason
        ? `Reason given: ${bill.eob.denialReason}. Denials are often reversed on appeal.`
        : 'Denials are often reversed on appeal.',
      amount: bill.amountDue,
      lineItemIds: [],
    },
  ];
}

/** The provider is asking for more than the EOB says the patient owes. */
function checkEobMismatch(bill: Bill): Issue[] {
  const eob = bill.eob;
  if (!eob || eob.denied) return [];
  const overage = bill.amountDue - eob.patientResponsibility;
  if (overage <= TOLERANCE) return [];
  return [
    {
      id: `${bill.id}-eob`,
      kind: 'eob_mismatch',
      severity: 'likely_error',
      title: 'Billed more than your insurance allows',
      detail: `Your EOB says you owe ${money(eob.patientResponsibility)}. The bill asks for ${money(bill.amountDue)}.`,
      amount: overage,
      lineItemIds: [],
    },
  ];
}

/** No EOB yet and no insurance payment shown: the bill may be premature. */
function checkBilledBeforeInsurance(bill: Bill): Issue[] {
  if (bill.eob) return [];
  if (bill.insurancePaid > 0) return [];
  if (bill.amountDue < bill.totalCharges - TOLERANCE) return [];
  return [
    {
      id: `${bill.id}-preinsurance`,
      kind: 'billed_before_insurance',
      severity: 'worth_asking',
      title: 'This bill may not reflect insurance yet',
      detail: 'No insurance payment is shown. Wait for your EOB before paying, or ask the provider to bill your plan.',
      amount: null,
      lineItemIds: [],
    },
  ];
}

/** The same code, on the same day, at the same price, listed more than once. */
function checkDuplicates(bill: Bill): Issue[] {
  const groups = new Map<string, LineItem[]>();
  for (const item of bill.lineItems) {
    const key = `${item.code}|${item.serviceDate}|${item.charge}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const issues: Issue[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const first = group[0];
    const extra = group.length - 1;
    issues.push({
      id: `${bill.id}-dup-${first.code}`,
      kind: 'duplicate_charge',
      severity: 'likely_error',
      title: `${first.plainName} charged ${group.length === 2 ? 'twice' : `${group.length} times`}`,
      detail: `${first.plainName} (${first.code}) appears ${group.length} times on the same day.`,
      amount: first.charge * extra,
      lineItemIds: group.slice(1).map((i) => i.id),
    });
  }
  return issues;
}

/** Highest-level ER visit: often correct, but worth confirming with records. */
function checkHighLevelEr(bill: Bill): Issue[] {
  const item = bill.lineItems.find((i) => HIGH_LEVEL_ER_CODES.has(i.code));
  if (!item) return [];
  return [
    {
      id: `${bill.id}-er-level`,
      kind: 'high_level_er',
      severity: 'worth_asking',
      title: 'ER visit billed at the highest level',
      detail: 'Level 5 is for severe cases. Ask for your records to confirm.',
      amount: null,
      lineItemIds: [item.id],
    },
  ];
}

/** IDs of line items flagged by any issue, for highlighting in the explainer. */
export function flaggedLineItems(analysis: Analysis): Map<string, Issue> {
  const map = new Map<string, Issue>();
  for (const issue of analysis.issues) {
    for (const id of issue.lineItemIds) map.set(id, issue);
  }
  return map;
}
