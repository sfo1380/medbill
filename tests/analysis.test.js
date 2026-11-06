// Tests for the bill analysis, action plan, letters and app state.
// Run with: npm test  (compiles src/ to .test-build/ first)

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { analyzeBill, flaggedLineItems } = require('../.test-build/analysis/analyzeBill');
const { buildActionPlan } = require('../.test-build/analysis/buildActionPlan');
const { disputeLetter, appealLetter } = require('../.test-build/letters/letters');
const { stMarysBill, lakesideBill, sampleScannedBill, sampleBills, sampleCases, sampleResolved } = require('../.test-build/data/sampleData');
const { reducer, FOLLOW_UP_DAYS } = require('../.test-build/state/reducer');
const { money, addDays, daysBetween, timeLeft, parseDollars } = require('../.test-build/lib/format');

test('St. Mary\'s: finds EOB mismatch, duplicate and high-level ER', () => {
  const a = analyzeBill(stMarysBill);
  const kinds = a.issues.map((i) => i.kind).sort();
  assert.deepEqual(kinds, ['duplicate_charge', 'eob_mismatch', 'high_level_er']);
  assert.equal(a.issues.find((i) => i.kind === 'eob_mismatch').amount, 94_000);
  assert.equal(a.issues.find((i) => i.kind === 'duplicate_charge').amount, 18_600);
  assert.equal(a.amountAtStake, 112_600);
  assert.equal(a.score, 'high');
  assert.equal(a.expectedPatientOwes, 64_000);
});

test('line items on the bill add up to the total charges', () => {
  for (const bill of [stMarysBill, lakesideBill, sampleScannedBill('x', '2026-11-06')]) {
    const sum = bill.lineItems.reduce((s, i) => s + i.charge, 0);
    assert.equal(sum, bill.totalCharges, bill.providerName);
    assert.equal(bill.totalCharges - bill.insurancePaid, bill.amountDue, bill.providerName);
  }
});

test('duplicate flag points at the extra copy only', () => {
  const flagged = flaggedLineItems(analyzeBill(stMarysBill));
  assert.ok(flagged.has('sm-3'));
  assert.ok(!flagged.has('sm-2'));
  assert.ok(flagged.has('sm-1')); // high-level ER
});

test('Lakeside: denied claim produces an appeal, not a billing dispute', () => {
  const a = analyzeBill(lakesideBill);
  assert.deepEqual(a.issues.map((i) => i.kind), ['claim_denied']);
  assert.equal(a.score, 'high');
  assert.equal(a.expectedPatientOwes, null);
  const steps = buildActionPlan(lakesideBill, a).map((s) => s.kind);
  assert.deepEqual(steps, ['itemized_bill', 'insurance_appeal']);
});

test('scanned sample: mismatch plus duplicate strep test', () => {
  const a = analyzeBill(sampleScannedBill('scan-1', '2026-11-06'));
  assert.equal(a.amountAtStake, 14_300 + 6_800);
  assert.equal(a.score, 'high');
});

test('clean bill scores low with no issues', () => {
  const clean = {
    ...stMarysBill,
    id: 'clean',
    lineItems: stMarysBill.lineItems.filter((i) => i.id !== 'sm-3' && i.id !== 'sm-1'),
    amountDue: 64_000,
  };
  const a = analyzeBill(clean);
  assert.equal(a.issues.length, 0);
  assert.equal(a.score, 'low');
  assert.equal(a.amountAtStake, 0);
});

test('bill with no EOB and no insurance payment is flagged as premature', () => {
  const bill = { ...stMarysBill, id: 'pre', eob: undefined, insurancePaid: 0, amountDue: stMarysBill.totalCharges, lineItems: [] };
  const a = analyzeBill(bill);
  assert.deepEqual(a.issues.map((i) => i.kind), ['billed_before_insurance']);
  assert.equal(a.score, 'medium');
});

test('amount at stake never exceeds the amount due', () => {
  const bill = { ...stMarysBill, id: 'cap', amountDue: 70_000 };
  assert.ok(analyzeBill(bill).amountAtStake <= 70_000);
});

test('action plan for St. Mary\'s', () => {
  const steps = buildActionPlan(stMarysBill, analyzeBill(stMarysBill));
  assert.deepEqual(steps.map((s) => s.kind), ['itemized_bill', 'dispute_letter', 'financial_assistance', 'request_records']);
  assert.equal(steps[0].status, 'done');
  assert.equal(steps[1].status, 'ready');
  assert.equal(steps[3].optional, true);
});

test('dispute letter cites the EOB amount, the duplicate code and asks for records', () => {
  const letter = disputeLetter(stMarysBill, analyzeBill(stMarysBill));
  assert.match(letter.body, /\$640/);
  assert.match(letter.body, /\$1,580/);
  assert.match(letter.body, /CPT 85025/);
  assert.match(letter.body, /correct my balance to \$640/);
  assert.match(letter.body, /medical records/);
  assert.match(letter.body, /\[YOUR NAME\]/);
});

test('appeal letter names the claim and denial reason', () => {
  const letter = appealLetter(lakesideBill);
  assert.match(letter.body, /SAMPLE-2026-0903/);
  assert.match(letter.body, /Prior authorization not on file/);
  assert.match(letter.body, /external review/);
});

test('reducer: scan, send letter, log call, resolve', () => {
  const today = '2026-11-06';
  let state = { bills: sampleBills, cases: sampleCases, resolved: sampleResolved };
  const bill = sampleScannedBill('scan-2', today);

  state = reducer(state, { type: 'ADD_BILL', bill, today });
  const c = state.cases.find((x) => x.billId === 'scan-2');
  assert.equal(c.status, 'not_started');
  assert.equal(c.timeline[0].detail, '2 issues found');

  const step = c.steps.find((s) => s.kind === 'dispute_letter');
  state = reducer(state, { type: 'SEND_LETTER', caseId: c.id, stepId: step.id, today });
  let c2 = state.cases.find((x) => x.id === c.id);
  assert.equal(c2.status, 'letter_sent');
  assert.equal(c2.steps.find((s) => s.id === step.id).status, 'done');
  assert.equal(c2.nextDeadline.date, addDays(today, FOLLOW_UP_DAYS));
  assert.ok(c2.documents.includes('Dispute letter'));

  state = reducer(state, { type: 'LOG_CALL', caseId: c.id, entry: { date: today, who: 'Billing', notes: 'Received' } });
  assert.equal(state.cases.find((x) => x.id === c.id).calls.length, 1);

  const before = state.resolved.reduce((s, r) => s + r.savedAmount, 0);
  state = reducer(state, { type: 'RESOLVE', caseId: c.id, savedAmount: 21_100, today });
  c2 = state.cases.find((x) => x.id === c.id);
  assert.equal(c2.status, 'resolved');
  assert.equal(c2.nextDeadline, undefined);
  assert.equal(state.resolved.reduce((s, r) => s + r.savedAmount, 0), before + 21_100);

  // Resolving twice must not double-count savings.
  const again = reducer(state, { type: 'RESOLVE', caseId: c.id, savedAmount: 21_100, today });
  assert.equal(again.resolved.length, state.resolved.length);
});

test('sample savings total is $1,284', () => {
  assert.equal(money(sampleResolved.reduce((s, r) => s + r.savedAmount, 0)), '$1,284');
});

test('formatting helpers', () => {
  assert.equal(money(158_000), '$1,580');
  assert.equal(money(12_345), '$123.45');
  assert.equal(money(5), '$0.05');
  assert.equal(addDays('2026-10-18', 30), '2026-11-17');
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(daysBetween('2026-11-06', '2026-11-20'), 14);
  assert.equal(timeLeft('2026-11-07', '2026-11-06'), 'Tomorrow');
  assert.equal(timeLeft('2026-11-04', '2026-11-06'), '2 days overdue');
  assert.equal(parseDollars('$1,126'), 112_600);
  assert.equal(parseDollars('85.5'), 8_550);
  assert.equal(parseDollars('abc'), null);
});
