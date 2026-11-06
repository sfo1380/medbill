# Medbill

A mobile app that helps people find and fix errors on medical bills: upload a bill,
see what's wrong in plain English, and get a ready-to-send dispute letter and a
case tracker with deadlines.

**Status: MVP demo.** All six core screens work end to end with **sample data**.
Nothing is saved or sent anywhere, and the demo resets when the app restarts.
Every provider, amount and date in the app is made up.

## Try it on your phone

You need [Node.js](https://nodejs.org) 20.19.4 or newer on your computer and the
free **Expo Go** app on your phone (App Store or Google Play).

```bash
git clone https://github.com/sfo1380/medbill.git
cd medbill
npm install
npm run setup     # installs the Expo packages at versions that match each other
npm start
```

A QR code appears in the terminal. Scan it with your phone's camera (iPhone) or
from inside Expo Go (Android). Your phone and computer must be on the same Wi-Fi.

If Expo Go says the project's SDK version isn't supported, upgrade the project
with `npx expo install expo@latest --fix`, then run `npm start` again.

### Demo walkthrough

1. **Home** shows savings so far, upcoming deadlines and active cases.
2. Tap **Scan a new bill**, then any option. The demo "reads" a sample urgent-care bill.
3. **What we found** shows the dispute score and each issue.
4. **See every line item** explains each charge; flagged ones are highlighted.
5. **Fix this** opens the action plan with the dispute letter already written.
   Edit it, send it by email, or share it.
6. The **case tracker** shows the follow-up deadline, timeline, call log and
   documents. Mark it resolved to add the savings to the Home total.

The two sample cases already in the app show other states: a dispute letter
already sent (St. Mary's) and a denied insurance claim with an appeal ready
(Lakeside Imaging).

## How bill checking works

`src/analysis/analyzeBill.ts` runs simple, testable rules on a structured bill:

| Rule | Flag | What it catches |
| --- | --- | --- |
| Bill vs. EOB | Likely error | Provider asks for more than the insurer's EOB says you owe |
| Duplicates | Likely error | Same code, same day, same price listed more than once |
| No insurance yet | Worth asking | No EOB and no insurance payment on the bill |
| Highest-level ER visit | Worth asking | CPT 99285 — often right, but worth confirming |
| Denied claim | Worth asking | Insurer denied the claim — appeal instead of dispute |

Later, the photo/PDF reader will produce the same `Bill` structure, so these rules
keep working unchanged. `src/analysis/buildActionPlan.ts` turns the findings into
steps, and `src/letters/letters.ts` writes the dispute and appeal letters from
them.

## Tests

```bash
npm test
```

Covers the rules, action plans, letters, app state changes and formatting
(14 tests). `npm run typecheck` checks the whole app after `npm run setup`.

## Project layout

```
app/                  Screens (Expo Router: file name = route)
  (tabs)/             Home, Scan, Cases, Your rights
  bill/[id]/          What we found, Line items, Action plan
  case/[id].tsx       Case tracker
src/
  analysis/           Error-detection rules and action plans
  letters/            Dispute and appeal letter templates
  data/               Sample bills and the "Your rights" content
  state/              App state (reducer + React context)
  components/         Shared UI pieces
  theme.ts            Colors, spacing, type
tests/                Logic tests (Node's built-in test runner)
```

## Before real users

This demo deliberately stops short of handling real health data. Next steps:

- **Real input:** camera and PDF upload (`expo-image-picker`, `expo-document-picker`),
  then an OCR + AI service that turns a bill and EOB into the `Bill` structure.
- **Privacy and security:** encrypted storage, accounts with multi-factor sign-in,
  HIPAA-eligible hosting under a business associate agreement, AI and OCR vendors
  that sign a BAA and don't train on data, no ad or analytics trackers on health
  screens, and a breach response plan. Review the FTC Health Breach Notification
  Rule and state health-privacy laws.
- **Insurer connections:** patient-authorized claims data through payer APIs.
- **Reminders:** push notifications for deadlines.
- **Legal review:** the "Your rights" content and letter templates are general
  information drafted for the demo and must be reviewed against current federal
  and state law before launch.

---

Medbill provides templates and general information, not legal or medical advice.
