import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../../src/components/Screen';
import { Card, Divider, Pill, Row } from '../../../src/components/ui';
import { NotFound } from '../../../src/components/NotFound';
import { useBill } from '../../../src/state/AppStore';
import { flaggedLineItems } from '../../../src/analysis/analyzeBill';
import { money } from '../../../src/lib/format';
import { severity } from '../../../src/lib/labels';
import type { Issue } from '../../../src/types';
import { colors, radius, space, type } from '../../../src/theme';

/** Screen 4 — every charge in plain English, with flagged ones highlighted. */
export default function LineItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bundle = useBill(id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const flagged = useMemo(() => (bundle ? flaggedLineItems(bundle.analysis) : new Map<string, Issue>()), [bundle]);

  if (!bundle) return <NotFound what="Bill" />;
  const { bill, analysis } = bundle;
  const eob = bill.eob;
  const notApplied = eob && !eob.denied ? bill.amountDue - eob.patientResponsibility : 0;

  return (
    <Screen
      title="Your bill, in plain English"
      subtitle={`${bill.lineItems.length} charges${eob ? " · matched to your insurer's EOB" : ''}`}
      back
    >
      <Card style={{ borderRadius: radius.lg, gap: 10 }}>
        <Row label="Provider charged" value={money(bill.totalCharges)} />
        <Row label="Insurance paid" value={`− ${money(bill.insurancePaid)}`} />
        {notApplied > 100 && (
          <Row label="Insurance discount not applied" value={`− ${money(notApplied)}`} tone="orange" />
        )}
        <Divider />
        {eob?.denied ? (
          <Row label="Claim denied — an appeal could cover this" value={money(bill.amountDue)} strong tone="orange" />
        ) : analysis.expectedPatientOwes !== null ? (
          <Row label="What you should owe" value={money(analysis.expectedPatientOwes)} strong tone="teal" />
        ) : (
          <Row label="Bill says you owe" value={money(bill.amountDue)} strong />
        )}
      </Card>

      <View style={{ gap: space.sm }}>
        {bill.lineItems.map((item) => {
          const issue = flagged.get(item.id);
          const isOpen = expanded === item.id || (expanded === null && issue?.kind === 'high_level_er');
          const isDuplicate = issue?.kind === 'duplicate_charge';
          return (
            <Pressable
              key={item.id}
              onPress={() => setExpanded(isOpen ? '' : item.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityHint="Shows a plain-English explanation"
              style={[styles.item, isDuplicate && styles.itemWarn]}
            >
              <View style={styles.itemTop}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: colors.ink }]}>{item.plainName}</Text>
                  <Text style={[type.tiny, { color: colors.muted }]}>
                    {item.codeType === 'REV' ? 'Revenue code' : item.codeType} {item.code}
                  </Text>
                </View>
                <Text style={[type.bodyStrong, { color: colors.ink }]}>{money(item.charge)}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
              {isOpen && item.explanation ? (
                <Text style={styles.explain}>{item.explanation}</Text>
              ) : null}
              {issue ? (
                <Pill
                  label={isDuplicate ? 'Duplicate — same code, same day' : severity[issue.severity].label}
                  tone={severity[issue.severity].tone}
                  square
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.tiny, { color: colors.muted, textAlign: 'center' }]}>
        Tap any charge for a plain-English explanation.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    gap: space.sm,
  },
  itemWarn: { borderWidth: 2, borderColor: colors.orange, padding: 13 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  explain: {
    ...type.small,
    color: colors.inkSoft,
    backgroundColor: colors.ground,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
});
