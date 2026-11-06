/**
 * "Your rights" library: short, plain-English explainers.
 *
 * General information only. These summaries must be reviewed against current
 * federal and state law before launch, and kept up to date — rules change.
 */

export interface RightsArticle {
  id: string;
  title: string;
  summary: string;
  body: string[];
}

export const rightsArticles: RightsArticle[] = [
  {
    id: 'itemized-bill',
    title: 'Always ask for an itemized bill',
    summary: 'Summary bills hide the details where most errors live.',
    body: [
      'An itemized bill lists every charge with its date, billing code and price. Most providers will send one if you ask, and some states require it.',
      'Ask for it before you pay anything. Compare it line by line with the Explanation of Benefits (EOB) from your insurer.',
    ],
  },
  {
    id: 'surprise-billing',
    title: 'Protection from surprise bills',
    summary: 'Federal law limits many out-of-network surprise bills.',
    body: [
      'Since 2022, the federal No Surprises Act protects most people with health coverage from surprise bills for emergency care, for many out-of-network providers who treat you at an in-network hospital or surgery center, and for air ambulance services.',
      'In those situations you generally owe only your normal in-network share. Ground ambulances are not covered by the federal law, though some states protect them.',
      'If you are uninsured or paying yourself, you can ask for a Good Faith Estimate before scheduled care. If the final bill is at least $400 more than the estimate, you may be able to dispute it.',
    ],
  },
  {
    id: 'appeals',
    title: 'Appealing an insurance denial',
    summary: 'You can ask your plan to reconsider, then ask an outside reviewer.',
    body: [
      'Most health plans must let you file an internal appeal, usually within 180 days of the denial notice. Your denial letter should say how and by when.',
      'If the plan still says no, you can usually request an external review by an independent reviewer. Urgent cases can be fast-tracked.',
      'Ask your doctor for a letter explaining why the care was medically necessary, and ask the plan for the records and criteria it used.',
    ],
  },
  {
    id: 'financial-assistance',
    title: 'Financial assistance at nonprofit hospitals',
    summary: 'Nonprofit hospitals must offer help to patients who qualify.',
    body: [
      'Nonprofit hospitals must have a written financial assistance policy, make it easy to find, and limit what they charge patients who qualify.',
      'You can usually apply even after you have been billed. Ask the billing office for the application, and ask them to pause collections while it is reviewed.',
      'Many middle-income families qualify for discounts, not just people with very low income.',
    ],
  },
  {
    id: 'credit-reports',
    title: 'Medical debt and your credit',
    summary: 'Many medical debts no longer appear on credit reports.',
    body: [
      'The three major credit bureaus have stopped reporting paid medical collections, medical collections under $500, and new medical debt for the first year.',
      'A federal rule that would have removed all medical debt from credit reports was struck down in 2025. Some states have passed their own limits, so check the rules where you live.',
    ],
  },
  {
    id: 'call-log',
    title: 'Keep a record of every call',
    summary: 'Names, dates and reference numbers make disputes stick.',
    body: [
      'Write down the date, who you spoke with, any reference number, and what they promised. Log it in your case right after the call.',
      'Follow up important calls in writing, and keep copies of everything you send.',
    ],
  },
];

export const RIGHTS_DISCLAIMER =
  'General information, not legal advice. Rules vary by state and change over time.';
