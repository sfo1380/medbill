import type {
  Bill,
  CallLogEntry,
  CaseFile,
  Cents,
  ISODate,
  ResolvedRecord,
  StepStatus,
} from '../types';
import { analyzeBill } from '../analysis/analyzeBill';
import { buildActionPlan } from '../analysis/buildActionPlan';
import { addDays, money, shortDate } from '../lib/format';

/** Days after sending a letter before we prompt a follow-up. */
export const FOLLOW_UP_DAYS = 30;

export interface AppState {
  bills: Bill[];
  cases: CaseFile[];
  resolved: ResolvedRecord[];
}

export type Action =
  | { type: 'ADD_BILL'; bill: Bill; today: ISODate }
  | { type: 'SEND_LETTER'; caseId: string; stepId: string; today: ISODate }
  | { type: 'SET_STEP_STATUS'; caseId: string; stepId: string; status: StepStatus; today: ISODate }
  | { type: 'SAVE_LETTER_TEXT'; caseId: string; text: string }
  | { type: 'LOG_CALL'; caseId: string; entry: Omit<CallLogEntry, 'id'> }
  | { type: 'RESOLVE'; caseId: string; savedAmount: Cents; today: ISODate };

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function caseForBill(bill: Bill, today: ISODate): CaseFile {
  const analysis = analyzeBill(bill);
  const found = analysis.issues.length;
  return {
    id: `case-${bill.id}`,
    billId: bill.id,
    status: 'not_started',
    openedOn: today,
    steps: buildActionPlan(bill, analysis),
    timeline: [
      {
        id: newId('t'),
        date: today,
        title: bill.eob ? 'Bill and EOB uploaded' : 'Bill uploaded',
        detail: found === 0 ? 'No issues found' : `${found} issue${found === 1 ? '' : 's'} found`,
      },
    ],
    calls: [],
    documents: bill.eob ? ['Original bill', 'Insurance EOB'] : ['Original bill'],
  };
}

function updateCase(state: AppState, caseId: string, fn: (c: CaseFile) => CaseFile): AppState {
  return { ...state, cases: state.cases.map((c) => (c.id === caseId ? fn(c) : c)) };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_BILL':
      return {
        ...state,
        bills: [...state.bills, action.bill],
        cases: [...state.cases, caseForBill(action.bill, action.today)],
      };

    case 'SEND_LETTER':
      return updateCase(state, action.caseId, (c) => {
        const step = c.steps.find((s) => s.id === action.stepId);
        if (!step) return c;
        const isAppeal = step.kind === 'insurance_appeal';
        const docName = isAppeal ? 'Appeal letter' : 'Dispute letter';
        return {
          ...c,
          status: 'letter_sent',
          steps: c.steps.map((s) =>
            s.id === step.id ? { ...s, status: 'done', detail: `Sent ${shortDate(action.today)}.` } : s,
          ),
          timeline: [
            ...c.timeline,
            { id: newId('t'), date: action.today, title: isAppeal ? 'Appeal sent' : 'Dispute letter sent' },
          ],
          documents: c.documents.includes(docName) ? c.documents : [...c.documents, docName],
          nextDeadline: {
            title: 'Follow up if no reply',
            date: addDays(action.today, FOLLOW_UP_DAYS),
            detail: "We'll remind you and draft the follow-up",
          },
        };
      });

    case 'SET_STEP_STATUS':
      return updateCase(state, action.caseId, (c) => {
        const step = c.steps.find((s) => s.id === action.stepId);
        if (!step || step.status === action.status) return c;
        const timeline =
          action.status === 'done'
            ? [...c.timeline, { id: newId('t'), date: action.today, title: `${step.title} — done` }]
            : c.timeline;
        return {
          ...c,
          status: c.status === 'not_started' ? 'in_progress' : c.status,
          steps: c.steps.map((s) => (s.id === step.id ? { ...s, status: action.status } : s)),
          timeline,
        };
      });

    case 'SAVE_LETTER_TEXT':
      return updateCase(state, action.caseId, (c) => ({ ...c, letterText: action.text }));

    case 'LOG_CALL':
      return updateCase(state, action.caseId, (c) => ({
        ...c,
        calls: [...c.calls, { id: newId('call'), ...action.entry }],
      }));

    case 'RESOLVE': {
      const caseFile = state.cases.find((c) => c.id === action.caseId);
      if (!caseFile || caseFile.status === 'resolved') return state;
      const bill = state.bills.find((b) => b.id === caseFile.billId);
      const next = updateCase(state, action.caseId, (c) => ({
        ...c,
        status: 'resolved',
        savedAmount: action.savedAmount,
        resolvedOn: action.today,
        nextDeadline: undefined,
        timeline: [
          ...c.timeline,
          { id: newId('t'), date: action.today, title: 'Resolved', detail: `Saved ${money(action.savedAmount)}` },
        ],
      }));
      return {
        ...next,
        resolved: [
          ...next.resolved,
          {
            providerName: bill?.providerName ?? 'Bill',
            savedAmount: action.savedAmount,
            resolvedOn: action.today,
          },
        ],
      };
    }

    default:
      return state;
  }
}
