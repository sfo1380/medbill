import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Button, Card, Divider, SectionLabel } from '../../../src/components/ui';
import { IssueCard, ScoreMeter } from '../../../src/components/billParts';
import { NotFound } from '../../../src/components/NotFound';
import { useBill } from '../../../src/state/AppStore';
import { longDate, money } from '../../../src/lib/format';
import { score as scoreLabels } from '../../../src/lib/labels';
import { colors, radius, space, type } from '../../../src/theme';

/** Screen 3 — what the analysis found on this bill. */
export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bundle = useBill(id);
  if (!bundle) return <NotFound what="Bill" />;
  const { bill, analysis } = bundle;
  const hasIssues = analysis.issues.length > 0;

  return (
    <Screen
      title="What we found"
      subtitle={`${bill.providerName} · ${bill.visitType} · ${longDate(bill.serviceDate)}`}
      back
      footer={
        <>
          {hasIssues ? (
            <Button
              label="Fix this — build my action plan"
              onPress={() => router.push({ pathname: '/bill/[id]/plan', params: { id: bill.id } })}
            />
          ) : (
            <Button label="Back to home" onPress={() => router.replace('/')} />
          )}
          <Button
            label="See every line item"
            variant="secondary"
            onPress={() => router.push({ pathname: '/bill/[id]/items', params: { id: bill.id } })}
          />
        </>
      }
    >
      <Card style={{ padding: space.xl, borderRadius: radius.xl, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: 4 }}>
            <Text style={[type.small, { color: colors.muted, fontWeight: '600' }]}>Dispute score</Text>
            <Text
              style={{
                fontSize: 34,
                fontWeight: '700',
                color: analysis.score === 'low' ? colors.teal : colors.orange,
              }}
            >
              {scoreLabels[analysis.score].label}
            </Text>
          </View>
          <View style={{ paddingBottom: 8 }}>
            <ScoreMeter score={analysis.score} />
          </View>
        </View>
        <Divider />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.tiny, { color: colors.muted }]}>Bill says you owe</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{money(bill.amountDue)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.tiny, { color: colors.muted }]}>Could be wrong</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.teal }}>
              {analysis.amountAtStake > 0 ? `Up to ${money(analysis.amountAtStake)}` : '$0'}
            </Text>
          </View>
        </View>
      </Card>

      {hasIssues ? (
        <View style={{ gap: 10 }}>
          <SectionLabel>{`${analysis.issues.length} issue${analysis.issues.length === 1 ? '' : 's'}`}</SectionLabel>
          {analysis.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </View>
      ) : (
        <Card variant="tealTint">
          <Text style={[type.bodyStrong, { color: colors.tealDark }]}>This bill looks right.</Text>
          <Text style={[type.small, { color: colors.tealDark }]}>
            It matches your insurer's EOB and we found no duplicate charges.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
