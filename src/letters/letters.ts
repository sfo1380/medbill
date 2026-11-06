import type { Analysis, Bill } from '../types';
import { longDate, money } from '../lib/format';

export interface Letter {
  to: string;
  subject: string;
  body: string;
}

/** Placeholders the user fills in before sending. */
export const PLACEHOLDERS = {
  name: '[YOUR NAME]',
  account: '[ACCOUNT NUMBER]',
  claim: '[CLAIM NUMBER]',
  memberId: '[MEMBER ID]',
};

/**
 * Dispute letter to the provider's billing office. Built only from the
 * issues the analysis found, so every sentence is backed by the user's own
 * documents.
 */
export function disputeLetter(bill: Bill, analysis: Analysis): Letter {
  const account = bill.accountNumber ?? PLACEHOLDERS.account;
  const points: string[] = [];

  for (const issue of analysis.issues) {
    switch (issue.kind) {
      case 'eob_mismatch':
        if (bill.eob) {
          points.push(
            `My insurer's Explanation of Benefits shows my responsibility is ${money(bill.eob.patientResponsibility)}, but you have billed me ${money(bill.amountDue)}.`,
          );
        }
        break;
      case 'duplicate_charge': {
        const item = bill.lineItems.find((i) => issue.lineItemIds.includes(i.id));
        if (item) {
          points.push(
            `The ${item.plainName.toLowerCase()} (${item.codeType} ${item.code}) is listed more than once for ${longDate(item.serviceDate)}.`,
          );
        }
        break;
      }
      case 'billed_before_insurance':
        points.push('This bill does not show any payment from my health plan. Please bill my insurance before billing me.');
        break;
      default:
        break;
    }
  }

  const wantsRecords = analysis.issues.some((i) => i.kind === 'high_level_er');
  const correctBalance =
    analysis.expectedPatientOwes !== null
      ? `Please correct my balance to ${money(analysis.expectedPatientOwes)}`
      : 'Please correct my balance';

  const paragraphs = [
    `I am writing to dispute charges on account ${account} for services on ${longDate(bill.serviceDate)}.`,
    points.length === 1 ? points[0] : points.map((p, n) => `${n + 1}. ${p}`).join('\n'),
    `${correctBalance}, send me a corrected itemized statement, and hold the account from collections while this dispute is reviewed.`,
  ];

  if (wantsRecords) {
    paragraphs.push('Please also send a copy of my medical records for this visit, including the emergency department notes.');
  }

  paragraphs.push('Thank you. Please reply in writing.');

  return {
    to: `${bill.providerName} — Patient Financial Services`,
    subject: `Billing dispute — account ${account}`,
    body: ['To whom it may concern:', ...paragraphs, `Sincerely,\n${PLACEHOLDERS.name}`].join('\n\n'),
  };
}

/** First-level (internal) appeal of a denied claim, addressed to the insurer. */
export function appealLetter(bill: Bill): Letter {
  const claim = bill.eob?.claimNumber ?? PLACEHOLDERS.claim;
  const reason = bill.eob?.denialReason ? ` The reason given was: "${bill.eob.denialReason}."` : '';

  const body = [
    'To the appeals department:',
    `I am requesting an internal appeal of the denial of claim ${claim} for ${bill.visitType.toLowerCase()} services from ${bill.providerName} on ${longDate(bill.serviceDate)}.${reason}`,
    'This care was medically necessary and ordered by my doctor. I am asking my provider for a letter of medical necessity and supporting records, which I will forward.',
    'Please send me a copy of all documents, records and criteria used in deciding this claim, and reconsider the denial. If it is upheld, please tell me how to request an external review.',
    `Sincerely,\n${PLACEHOLDERS.name}\nMember ID: ${PLACEHOLDERS.memberId}`,
  ].join('\n\n');

  return {
    to: 'Your health plan — Appeals department',
    subject: `Appeal of denied claim ${claim}`,
    body,
  };
}
