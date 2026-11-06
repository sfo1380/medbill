import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Card, SectionLabel } from '../../src/components/ui';
import { CaseCard } from '../../src/components/billParts';
import { useStore } from '../../src/state/AppStore';
import { money, shortDate } from '../../src/lib/format';
import type { Bill, CaseFile } from '../../src/types';
import { colors, space, type } from '../../src/theme';

export default function CasesScreen() {
  const { state } = useStore();
  const withBills = state.cases
    .map((c) => ({ caseFile: c, bill: state.bills.find((b) => b.id === c.billId) }))
    .filter((x): x is { caseFile: CaseFile; bill: Bill } => !!x.bill);

  const active = withBills.filter((x) => x.caseFile.status !== 'resolved');
  const resolvedHere = withBills.filter((x) => x.caseFile.status === 'resolved');
  // Past wins that aren't full cases in this demo (sample history).
  const pastOnly = state.resolved.filter(
    (r) => !resolvedHere.some((x) => x.bill.providerName === r.providerName && x.caseFile.resolvedOn === r.resolvedOn),
  );

  return (
    <Screen title="Cases" subtitle="Every bill you're disputing" tabScreen>
      <View style={{ gap: 10 }}>
        <SectionLabel>Active</SectionLabel>
        {active.length === 0 ? (
          <Text style={[type.small, { color: colors.muted }]}>Nothing open right now.</Text>
        ) : (
          active.map(({ caseFile, bill }) => <CaseCard key={caseFile.id} caseFile={caseFile} bill={bill} />)
        )}
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>Resolved</SectionLabel>
        {resolvedHere.map(({ caseFile, bill }) => (
          <CaseCard key={caseFile.id} caseFile={caseFile} bill={bill} />
        ))}
        {pastOnly.map((r) => (
          <Card key={`${r.providerName}-${r.resolvedOn}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyStrong, { color: colors.ink }]}>{r.providerName}</Text>
              <Text style={[type.tiny, { color: colors.muted }]}>Resolved {shortDate(r.resolvedOn)}</Text>
            </View>
            <Text style={[type.bodyStrong, { color: colors.teal }]}>Saved {money(r.savedAmount)}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
