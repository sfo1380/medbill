import type { Bill, CaseFile, ResolvedRecord } from '../types';
import { analyzeBill } from '../analysis/analyzeBill';
import { buildActionPlan } from '../analysis/buildActionPlan';

/**
 * Sample data for the MVP demo. Every name, amount and date here is made up.
 * Real data will come from uploads and insurer connections later.
 */

export const stMarysBill: Bill = {
  id: 'st-marys-er',
  providerName: "St. Mary's Hospital",
  providerShortName: "St. Mary's",
  visitType: 'ER visit',
  serviceDate: '2026-09-14',
  uploadedOn: '2026-10-02',
  isNonprofitHospital: true,
  isItemized: true,
  totalCharges: 394_000,
  insurancePaid: 236_000,
  amountDue: 158_000,
  lineItems: [
    {
      id: 'sm-1',
      code: '99285',
      codeType: 'CPT',
      plainName: 'ER visit — highest level',
      explanation: 'Level 5 of 5. Meant for severe or life-threatening cases. If your visit was routine, it may be "upcoded."',
      serviceDate: '2026-09-14',
      units: 1,
      charge: 189_000,
    },
    {
      id: 'sm-2',
      code: '85025',
      codeType: 'CPT',
      plainName: 'Complete blood count',
      explanation: 'A standard blood test that counts red cells, white cells and platelets.',
      serviceDate: '2026-09-14',
      units: 1,
      charge: 18_600,
    },
    {
      id: 'sm-3',
      code: '85025',
      codeType: 'CPT',
      plainName: 'Complete blood count',
      explanation: 'A standard blood test that counts red cells, white cells and platelets.',
      serviceDate: '2026-09-14',
      units: 1,
      charge: 18_600,
    },
    {
      id: 'sm-4',
      code: '71046',
      codeType: 'CPT',
      plainName: 'Chest X-ray, 2 views',
      explanation: 'Two X-ray images of the chest, usually front and side.',
      serviceDate: '2026-09-14',
      units: 1,
      charge: 41_200,
    },
    {
      id: 'sm-5',
      code: '96374',
      codeType: 'CPT',
      plainName: 'Medicine given by IV',
      explanation: 'A single dose of medicine pushed through an IV line.',
      serviceDate: '2026-09-14',
      units: 1,
      charge: 59_800,
    },
    {
      id: 'sm-6',
      code: '0250',
      codeType: 'REV',
      plainName: 'Pharmacy — anti-nausea medicine',
      explanation: 'Hospital pharmacy charge for medicine given during the visit.',
      serviceDate: '2026-09-14',
      units: 1,
      charge: 66_800,
    },
  ],
  eob: {
    claimNumber: 'SAMPLE-2026-0914',
    billedAmount: 394_000,
    allowedAmount: 300_000,
    planPaid: 236_000,
    patientResponsibility: 64_000,
    inNetwork: true,
  },
};

export const lakesideBill: Bill = {
  id: 'lakeside-mri',
  providerName: 'Lakeside Imaging',
  providerShortName: 'Lakeside Imaging',
  visitType: 'MRI',
  serviceDate: '2026-09-03',
  uploadedOn: '2026-10-05',
  isItemized: true,
  totalCharges: 61_200,
  insurancePaid: 0,
  amountDue: 61_200,
  lineItems: [
    {
      id: 'lk-1',
      code: '70553',
      codeType: 'CPT',
      plainName: 'MRI of the brain, with and without contrast',
      explanation: 'Brain MRI taken twice — once plain, once after a contrast dye injection.',
      serviceDate: '2026-09-03',
      units: 1,
      charge: 61_200,
    },
  ],
  eob: {
    claimNumber: 'SAMPLE-2026-0903',
    billedAmount: 61_200,
    allowedAmount: 0,
    planPaid: 0,
    patientResponsibility: 61_200,
    inNetwork: true,
    denied: true,
    denialReason: 'Prior authorization not on file',
  },
};

/** The bill the "scan" demo produces, as if read from a photo. */
export function sampleScannedBill(id: string, today: string): Bill {
  return {
    id,
    providerName: 'Riverside Urgent Care',
    providerShortName: 'Riverside',
    visitType: 'Urgent care visit',
    serviceDate: '2026-10-28',
    uploadedOn: today,
    isItemized: true,
    totalCharges: 45_300,
    insurancePaid: 21_000,
    amountDue: 24_300,
    lineItems: [
      {
        id: `${id}-1`,
        code: '99214',
        codeType: 'CPT',
        plainName: 'Office visit — moderate complexity',
        explanation: 'Level 4 of 5 for an established patient. Common for a sick visit with a test or prescription.',
        serviceDate: '2026-10-28',
        units: 1,
        charge: 28_500,
      },
      {
        id: `${id}-2`,
        code: '87880',
        codeType: 'CPT',
        plainName: 'Rapid strep test',
        explanation: 'A quick throat swab test for strep throat.',
        serviceDate: '2026-10-28',
        units: 1,
        charge: 6_800,
      },
      {
        id: `${id}-3`,
        code: '87880',
        codeType: 'CPT',
        plainName: 'Rapid strep test',
        explanation: 'A quick throat swab test for strep throat.',
        serviceDate: '2026-10-28',
        units: 1,
        charge: 6_800,
      },
      {
        id: `${id}-4`,
        code: '81002',
        codeType: 'CPT',
        plainName: 'Urine test',
        explanation: 'A basic dipstick urine test done in the office.',
        serviceDate: '2026-10-28',
        units: 1,
        charge: 3_200,
      },
    ],
    eob: {
      billedAmount: 45_300,
      allowedAmount: 31_000,
      planPaid: 21_000,
      patientResponsibility: 10_000,
      inNetwork: true,
    },
  };
}

const stMarysSteps = buildActionPlan(stMarysBill, analyzeBill(stMarysBill)).map((step) =>
  step.kind === 'dispute_letter' ? { ...step, status: 'done' as const, detail: 'Sent by email Oct 18.' } : step,
);

const stMarysCase: CaseFile = {
  id: 'case-st-marys',
  billId: stMarysBill.id,
  status: 'letter_sent',
  openedOn: '2026-10-02',
  steps: stMarysSteps,
  timeline: [
    { id: 'sm-t1', date: '2026-10-02', title: 'Bill and EOB uploaded', detail: '3 issues found' },
    { id: 'sm-t2', date: '2026-10-02', title: 'Itemized bill requested', detail: 'Received Oct 16' },
    { id: 'sm-t3', date: '2026-10-18', title: 'Dispute letter sent', detail: 'By email' },
  ],
  calls: [
    {
      id: 'sm-c1',
      date: '2026-10-24',
      who: 'Dana, billing office',
      notes: 'Dispute received; review takes about 30 days. Account on hold.',
    },
  ],
  documents: ['Original bill', 'Insurance EOB', 'Itemized bill', 'Dispute letter'],
  nextDeadline: {
    title: "Follow up with St. Mary's billing",
    date: '2026-11-20',
    detail: "We'll remind you and draft the follow-up",
  },
};

const lakesideCase: CaseFile = {
  id: 'case-lakeside',
  billId: lakesideBill.id,
  status: 'needs_you',
  openedOn: '2026-10-05',
  steps: buildActionPlan(lakesideBill, analyzeBill(lakesideBill)),
  timeline: [{ id: 'lk-t1', date: '2026-10-05', title: 'Bill and EOB uploaded', detail: 'Claim denied by insurer' }],
  calls: [],
  documents: ['Original bill', 'Insurance EOB'],
  nextDeadline: {
    title: 'Insurance appeal window closes',
    date: '2027-03-02',
    detail: 'Lakeside Imaging denial',
  },
};

export const sampleBills: Bill[] = [stMarysBill, lakesideBill];
export const sampleCases: CaseFile[] = [stMarysCase, lakesideCase];

/** Three past wins that make up the "Saved so far" total. */
export const sampleResolved: ResolvedRecord[] = [
  { providerName: 'Northside Pediatrics', savedAmount: 18_600, resolvedOn: '2026-05-12' },
  { providerName: 'Valley Lab Services', savedAmount: 41_500, resolvedOn: '2026-07-01' },
  { providerName: 'Metro Physical Therapy', savedAmount: 68_300, resolvedOn: '2026-08-22' },
];
