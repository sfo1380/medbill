import type { ActionStep, Analysis, Bill } from '../types';

/**
 * Turns an analysis into an ordered checklist of things the user can do.
 * The order matters: get the itemized bill first, then dispute, then the
 * money-saving extras.
 */
export function buildActionPlan(bill: Bill, analysis: Analysis): ActionStep[] {
  const kinds = new Set(analysis.issues.map((i) => i.kind));
  const steps: ActionStep[] = [];

  steps.push({
    id: `${bill.id}-itemized`,
    kind: 'itemized_bill',
    title: 'Request an itemized bill',
    detail: bill.isItemized
      ? 'You already have every charge listed with its code.'
      : 'Summary bills hide errors. Ask for every charge with its code.',
    status: bill.isItemized ? 'done' : 'ready',
  });

  if (kinds.has('claim_denied')) {
    steps.push({
      id: `${bill.id}-appeal`,
      kind: 'insurance_appeal',
      title: 'Appeal the denial with your insurer',
      detail: 'We drafted the appeal from your EOB. Send it before the deadline.',
      status: 'ready',
    });
  }

  if (kinds.has('eob_mismatch') || kinds.has('duplicate_charge') || kinds.has('billed_before_insurance')) {
    steps.push({
      id: `${bill.id}-dispute`,
      kind: 'dispute_letter',
      title: 'Send dispute letter to billing',
      detail: 'Ready to send. Edit anything before it goes.',
      status: 'ready',
    });
  }

  if (bill.isNonprofitHospital) {
    steps.push({
      id: `${bill.id}-assistance`,
      kind: 'financial_assistance',
      title: 'Check financial assistance',
      detail: `${bill.providerShortName} is a nonprofit hospital and must offer a financial assistance program.`,
      status: 'todo',
    });
  }

  if (kinds.has('high_level_er')) {
    steps.push({
      id: `${bill.id}-records`,
      kind: 'request_records',
      title: 'Ask for your ER records',
      detail: 'Checks whether the level-5 visit charge matches your care.',
      status: 'todo',
      optional: true,
    });
  }

  return steps;
}
