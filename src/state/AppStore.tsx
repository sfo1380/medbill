import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { Analysis, Bill, CaseFile } from '../types';
import { analyzeBill } from '../analysis/analyzeBill';
import { sampleBills, sampleCases, sampleResolved } from '../data/sampleData';
import { type Action, type AppState, reducer } from './reducer';

/**
 * App-wide state, seeded with sample data. Nothing is saved to disk or sent
 * anywhere yet — closing the app resets the demo. Secure storage comes later.
 */

interface Store {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<Store | null>(null);

const initialState: AppState = {
  bills: sampleBills,
  cases: sampleCases,
  resolved: sampleResolved,
};

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside AppStoreProvider');
  return store;
}

export interface BillBundle {
  bill: Bill;
  analysis: Analysis;
  caseFile: CaseFile | undefined;
}

/** A bill with its analysis and case, or undefined if the id is unknown. */
export function useBill(billId: string | undefined): BillBundle | undefined {
  const { state } = useStore();
  return useMemo(() => {
    const bill = state.bills.find((b) => b.id === billId);
    if (!bill) return undefined;
    return {
      bill,
      analysis: analyzeBill(bill),
      caseFile: state.cases.find((c) => c.billId === bill.id),
    };
  }, [state, billId]);
}
