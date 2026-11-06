import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Bill, CaseFile, DisputeScore, Issue } from '../types';
import { colors, radius, space, type } from '../theme';
import { caseStatus, score as scoreLabels, severity } from '../lib/labels';
import { money } from '../lib/format';
import { analyzeBill } from '../analysis/analyzeBill';
import { Card, Pill } from './ui';

/** Three rising bars, filled to the score level. */
export function ScoreMeter({ score }: { score: DisputeScore }) {
  const { label, bars } = scoreLabels[score];
  const color = score === 'low' ? colors.teal : colors.orange;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Dispute score ${label}, ${bars} of 3`}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}
    >
      {[14, 22, 30].map((h, i) => (
        <View
          key={h}
          style={{ width: 10, height: h, borderRadius: 3, backgroundColor: i < bars ? color : colors.borderStrong }}
        />
      ))}
    </View>
  );
}

export function IssueCard({ issue }: { issue: Issue }) {
  const sev = severity[issue.severity];
  return (
    <Card>
      <View style={styles.between}>
        <Pill label={sev.label} tone={sev.tone} square />
        <Text style={issue.amount === null ? [type.small, { color: colors.muted }] : [type.bodyStrong, { fontWeight: '700' }]}>
          {issue.amount === null ? 'Amount unknown' : money(issue.amount)}
        </Text>
      </View>
      <Text style={[type.bodyStrong, { color: colors.ink }]}>{issue.title}</Text>
      <Text style={[type.small, { color: colors.muted }]}>{issue.detail}</Text>
    </Card>
  );
}

/** Summary card for a case, linking to its tracker. */
export function CaseCard({ caseFile, bill }: { caseFile: CaseFile; bill: Bill }) {
  const status = caseStatus[caseFile.status];
  const analysis = analyzeBill(bill);
  const resolved = caseFile.status === 'resolved';
  return (
    <Link href={{ pathname: '/case/[id]', params: { id: caseFile.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${bill.providerName} ${bill.visitType}, ${status.label}`}
        style={({ pressed }) => [styles.caseCard, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.between}>
          <Text style={[type.bodyStrong, { color: colors.ink, flexShrink: 1 }]}>
            {bill.providerName} · {bill.visitType}
          </Text>
          <Pill label={status.label} tone={status.tone} />
        </View>
        <View style={styles.between}>
          <Text style={[type.small, { color: colors.muted }]}>
            {analysis.issues.some((i) => i.kind === 'claim_denied')
              ? 'Claim denied by insurer'
              : `Billed ${money(bill.amountDue)}`}
          </Text>
          <Text style={[type.small, { color: colors.ink, fontWeight: '600' }]}>
            {resolved
              ? `Saved ${money(caseFile.savedAmount ?? 0)}`
              : analysis.amountAtStake > 0
                ? `${money(analysis.amountAtStake)} in dispute`
                : 'No issues found'}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

/** Small "Encrypted / never sold" line used where people decide to trust us. */
export function PrivacyLine() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
      <Text style={[type.tiny, { color: colors.muted }]}>Encrypted. Never sold or shared with advertisers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  caseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 10,
  },
});
