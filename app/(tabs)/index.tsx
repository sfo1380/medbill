import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../src/components/Screen';
import { Card, SectionLabel } from '../../src/components/ui';
import { CaseCard } from '../../src/components/billParts';
import { useStore } from '../../src/state/AppStore';
import { analyzeBill } from '../../src/analysis/analyzeBill';
import { daysBetween, longDate, money, shortDate, timeLeft, todayISO } from '../../src/lib/format';
import { colors, radius, space, type } from '../../src/theme';

/** Deadlines within this many days get the orange "urgent" treatment. */
const URGENT_DAYS = 30;

export default function HomeScreen() {
  const { state } = useStore();
  const today = todayISO();

  const { saved, resolvedCount, inDispute, active, deadlines } = useMemo(() => {
    const active = state.cases
      .filter((c) => c.status !== 'resolved')
      .map((c) => ({ caseFile: c, bill: state.bills.find((b) => b.id === c.billId)! }))
      .filter((x) => x.bill);

    const inDispute = active.reduce((sum, x) => sum + analyzeBill(x.bill).amountAtStake, 0);

    const deadlines = active
      .filter((x) => x.caseFile.nextDeadline)
      .map((x) => ({ ...x, deadline: x.caseFile.nextDeadline! }))
      .sort((a, b) => a.deadline.date.localeCompare(b.deadline.date))
      .slice(0, 3);

    return {
      saved: state.resolved.reduce((sum, r) => sum + r.savedAmount, 0),
      resolvedCount: state.resolved.length,
      inDispute,
      active,
      deadlines,
    };
  }, [state]);

  return (
    <Screen tabScreen>
      <Text style={styles.wordmark} accessibilityRole="header">
        Medbill
      </Text>

      <Card variant="teal" style={{ padding: space.xl, borderRadius: radius.xl, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.tealOnDark }}>Saved so far</Text>
        <Text style={[type.display, { color: colors.white }]}>{money(saved)}</Text>
        <Text style={{ fontSize: 14, color: colors.tealTint }}>
          Across {resolvedCount} resolved bill{resolvedCount === 1 ? '' : 's'}
          {inDispute > 0 ? ` · ${money(inDispute)} more in dispute` : ''}
        </Text>
      </Card>

      <Link href="/scan" asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => [styles.scanRow, pressed && { opacity: 0.85 }]}>
          <View style={styles.scanIcon}>
            <Ionicons name="scan-outline" size={24} color={colors.teal} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.heading, { color: colors.ink }]}>Scan a new bill</Text>
            <Text style={[type.small, { color: colors.muted }]}>Photo, PDF or forwarded email</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </Link>

      {deadlines.length > 0 && (
        <View style={{ gap: 10 }}>
          <SectionLabel>Coming up</SectionLabel>
          {deadlines.map(({ caseFile, deadline }) => {
            const urgent = daysBetween(today, deadline.date) <= URGENT_DAYS;
            return (
              <Link key={caseFile.id} href={{ pathname: '/case/[id]', params: { id: caseFile.id } }} asChild>
                <Pressable
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.deadline,
                    urgent ? styles.deadlineUrgent : styles.deadlinePlain,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name={urgent ? 'time-outline' : 'calendar-outline'}
                    size={20}
                    color={urgent ? colors.orange : colors.muted}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.bodyStrong, { color: colors.ink }]}>{deadline.title}</Text>
                    <Text style={[type.small, { color: urgent ? colors.orangeText : colors.muted }]}>
                      {urgent
                        ? `Due ${shortDate(deadline.date)} · ${timeLeft(deadline.date, today)}`
                        : `${deadline.detail ? `${deadline.detail} · ` : ''}${longDate(deadline.date)}`}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <SectionLabel>Active cases</SectionLabel>
        {active.length === 0 ? (
          <Card>
            <Text style={[type.body, { color: colors.muted }]}>No open cases. Scan a bill to check it for errors.</Text>
          </Card>
        ) : (
          active.map(({ caseFile, bill }) => <CaseCard key={caseFile.id} caseFile={caseFile} bill={bill} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wordmark: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: colors.ink, paddingTop: space.sm },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadline: { flexDirection: 'row', gap: space.md, borderRadius: radius.md, padding: 14, alignItems: 'flex-start' },
  deadlineUrgent: { backgroundColor: colors.orangeTint },
  deadlinePlain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
