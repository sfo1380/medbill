import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../src/components/Screen';
import { Button, Card, Pill, SectionLabel } from '../../src/components/ui';
import { NotFound } from '../../src/components/NotFound';
import { useBill, useStore } from '../../src/state/AppStore';
import { caseStatus } from '../../src/lib/labels';
import { money, parseDollars, shortDate, timeLeft, todayISO } from '../../src/lib/format';
import { colors, radius, space, type } from '../../src/theme';

/** Screen 6 — the case tracker: deadline, timeline, calls, documents. */
export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const caseFile = state.cases.find((c) => c.id === id);
  const bundle = useBill(caseFile?.billId);

  const [logging, setLogging] = useState(false);
  const [who, setWho] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [resolving, setResolving] = useState(false);
  const [savedText, setSavedText] = useState('');

  const timeline = useMemo(
    () => (caseFile ? [...caseFile.timeline].sort((a, b) => a.date.localeCompare(b.date)) : []),
    [caseFile],
  );

  if (!caseFile || !bundle) return <NotFound what="Case" />;
  const { bill, analysis } = bundle;
  const today = todayISO();
  const status = caseStatus[caseFile.status];
  const resolved = caseFile.status === 'resolved';

  const saveCall = () => {
    if (!who.trim() && !notes.trim()) return;
    dispatch({
      type: 'LOG_CALL',
      caseId: caseFile.id,
      entry: { date: today, who: who.trim() || 'Phone call', reference: reference.trim() || undefined, notes: notes.trim() },
    });
    setWho('');
    setReference('');
    setNotes('');
    setLogging(false);
  };

  const startResolve = () => {
    setSavedText(String(analysis.amountAtStake / 100));
    setResolving(true);
  };

  const parsedSaved = parseDollars(savedText);
  const confirmResolve = () => {
    if (parsedSaved === null) return;
    dispatch({ type: 'RESOLVE', caseId: caseFile.id, savedAmount: parsedSaved, today });
    setResolving(false);
  };

  return (
    <Screen
      title={`${bill.providerShortName} ${bill.visitType}`}
      subtitle={
        resolved
          ? `Resolved ${shortDate(caseFile.resolvedOn ?? today)}`
          : `${money(analysis.amountAtStake)} in dispute · opened ${shortDate(caseFile.openedOn)}`
      }
      back
      right={<Pill label={status.label} tone={status.tone} />}
    >
      {resolved ? (
        <Card variant="tealTint">
          <Text style={[type.heading, { color: colors.tealDark }]}>Saved {money(caseFile.savedAmount ?? 0)}</Text>
          <Text style={[type.small, { color: colors.tealDark }]}>Added to your savings total.</Text>
        </Card>
      ) : caseFile.nextDeadline ? (
        <Card variant="orangeTint" style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Ionicons name="time-outline" size={22} color={colors.orange} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyStrong, { color: colors.ink }]}>Next: {caseFile.nextDeadline.title}</Text>
              <Text style={[type.small, { color: colors.orangeText }]}>
                {shortDate(caseFile.nextDeadline.date)} · {timeLeft(caseFile.nextDeadline.date, today)}
                {caseFile.nextDeadline.detail ? `\n${caseFile.nextDeadline.detail}` : ''}
              </Text>
            </View>
          </View>
          <Button
            label="Open action plan"
            variant="secondary"
            onPress={() => router.push({ pathname: '/bill/[id]/plan', params: { id: bill.id } })}
          />
        </Card>
      ) : (
        <Button
          label="Open action plan"
          onPress={() => router.push({ pathname: '/bill/[id]/plan', params: { id: bill.id } })}
        />
      )}

      <View style={{ gap: 10 }}>
        <SectionLabel>Timeline</SectionLabel>
        <Card style={{ gap: 14 }}>
          {timeline.map((event) => (
            <View key={event.id} style={styles.event}>
              <View style={[styles.dot, { backgroundColor: colors.teal }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.bodyStrong, { fontSize: 14, color: colors.ink }]}>{event.title}</Text>
                <Text style={[type.tiny, { color: colors.muted }]}>
                  {shortDate(event.date)}
                  {event.detail ? ` · ${event.detail}` : ''}
                </Text>
              </View>
            </View>
          ))}
          {!resolved && caseFile.nextDeadline ? (
            <View style={styles.event}>
              <View style={[styles.dot, styles.dotUpcoming]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.bodyStrong, { fontSize: 14, color: colors.ink }]}>{caseFile.nextDeadline.title}</Text>
                <Text style={[type.tiny, { color: colors.orangeText }]}>{shortDate(caseFile.nextDeadline.date)}</Text>
              </View>
            </View>
          ) : null}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel
          right={
            !logging ? <Button label="+ Log a call" variant="ghost" onPress={() => setLogging(true)} /> : undefined
          }
        >
          Call log
        </SectionLabel>

        {logging && (
          <Card style={{ gap: 10 }}>
            <Text style={styles.inputLabel}>Who did you speak with?</Text>
            <TextInput value={who} onChangeText={setWho} placeholder="e.g. Dana, billing office" style={styles.input} accessibilityLabel="Who did you speak with?" />
            <Text style={styles.inputLabel}>Reference number (optional)</Text>
            <TextInput value={reference} onChangeText={setReference} style={styles.input} accessibilityLabel="Reference number" />
            <Text style={styles.inputLabel}>What did they say?</Text>
            <TextInput value={notes} onChangeText={setNotes} multiline style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} accessibilityLabel="What did they say?" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setLogging(false)} />
              <Button label="Save call" style={{ flex: 1 }} onPress={saveCall} disabled={!who.trim() && !notes.trim()} />
            </View>
          </Card>
        )}

        {caseFile.calls.length === 0 && !logging ? (
          <Text style={[type.small, { color: colors.muted }]}>
            No calls yet. Log every call: who, when, the reference number and what they promised.
          </Text>
        ) : (
          caseFile.calls.map((call) => (
            <Card key={call.id} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                <Text style={[type.tiny, { color: colors.muted, flexShrink: 1 }]}>
                  {shortDate(call.date)} · {call.who}
                </Text>
                {call.reference ? <Text style={[type.tiny, { color: colors.muted }]}>Ref # {call.reference}</Text> : null}
              </View>
              {call.notes ? <Text style={[type.body, { fontSize: 14, color: colors.ink }]}>{call.notes}</Text> : null}
            </Card>
          ))
        )}
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>Documents</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {caseFile.documents.map((doc) => (
            <View key={doc} style={styles.doc}>
              <Ionicons name="document-outline" size={14} color={colors.muted} />
              <Text style={[type.tiny, { color: colors.ink }]}>{doc}</Text>
            </View>
          ))}
        </View>
        <Button
          label="View bill analysis"
          variant="ghost"
          onPress={() => router.push({ pathname: '/bill/[id]', params: { id: bill.id } })}
        />
      </View>

      {!resolved &&
        (resolving ? (
          <Card style={{ gap: 10 }}>
            <Text style={[type.bodyStrong, { color: colors.ink }]}>How much did you save?</Text>
            <TextInput
              value={savedText}
              onChangeText={setSavedText}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Amount saved in dollars"
            />
            {parsedSaved === null ? (
              <Text style={[type.tiny, { color: colors.orangeText }]}>Enter a dollar amount, like 1126 or 85.50.</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setResolving(false)} />
              <Button label="Mark resolved" style={{ flex: 1 }} onPress={confirmResolve} disabled={parsedSaved === null} />
            </View>
          </Card>
        ) : (
          <Button label="Mark resolved and log savings" variant="secondary" onPress={startResolve} />
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  event: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  dotUpcoming: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.orange },
  inputLabel: { ...type.small, fontWeight: '600', color: colors.ink },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  doc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
});
