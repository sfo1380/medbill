import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Button, Card, StepBadge } from '../../../src/components/ui';
import { NotFound } from '../../../src/components/NotFound';
import { useBill, useStore } from '../../../src/state/AppStore';
import { appealLetter, disputeLetter } from '../../../src/letters/letters';
import { todayISO } from '../../../src/lib/format';
import type { ActionStep } from '../../../src/types';
import { colors, radius, space, type } from '../../../src/theme';

const LETTER_KINDS = new Set<ActionStep['kind']>(['dispute_letter', 'insurance_appeal']);

/** Screen 5 — the checklist, with the letter drafted and ready to send. */
export default function ActionPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bundle = useBill(id);
  const { dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const letterStep = bundle?.caseFile?.steps.find((s) => LETTER_KINDS.has(s.kind));

  const generated = useMemo(() => {
    if (!bundle || !letterStep) return null;
    return letterStep.kind === 'insurance_appeal'
      ? appealLetter(bundle.bill)
      : disputeLetter(bundle.bill, bundle.analysis);
  }, [bundle, letterStep]);

  if (!bundle || !bundle.caseFile) return <NotFound what="Bill" />;
  const { bill, caseFile } = bundle;
  const steps = caseFile.steps;
  const letterBody = caseFile.letterText ?? generated?.body ?? '';
  const hasPlaceholders = /\[[A-Z ]+\]/.test(letterBody);
  const openSteps = steps.filter((s) => s.status !== 'done' && !s.optional).length;

  const goToCase = () => router.push({ pathname: '/case/[id]', params: { id: caseFile.id } });

  const markSent = () => {
    if (!letterStep) return;
    dispatch({ type: 'SEND_LETTER', caseId: caseFile.id, stepId: letterStep.id, today: todayISO() });
    goToCase();
  };

  const sendByEmail = async () => {
    if (!generated) return;
    const url = `mailto:?subject=${encodeURIComponent(generated.subject)}&body=${encodeURIComponent(letterBody)}`;
    try {
      await Linking.openURL(url);
      // Opening the mail app doesn't mean it was sent, so ask when they return.
      Alert.alert('Did you send the letter?', 'We\'ll start the follow-up clock once it\'s sent.', [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Yes, sent', onPress: markSent },
      ]);
    } catch {
      Alert.alert('No email app found', 'Use "Share or save" to copy the letter instead.');
    }
  };

  const shareLetter = () => {
    if (!generated) return;
    Share.share({ title: generated.subject, message: `${generated.subject}\n\n${letterBody}` });
  };

  const startEdit = () => {
    setDraft(letterBody);
    setEditing(true);
  };

  const saveEdit = () => {
    dispatch({ type: 'SAVE_LETTER_TEXT', caseId: caseFile.id, text: draft });
    setEditing(false);
  };

  const toggleStep = (step: ActionStep) => {
    dispatch({
      type: 'SET_STEP_STATUS',
      caseId: caseFile.id,
      stepId: step.id,
      status: step.status === 'done' ? 'todo' : 'done',
      today: todayISO(),
    });
  };

  return (
    <Screen
      title="Your action plan"
      subtitle={openSteps === 0 ? 'All main steps done' : `${steps.length} steps · ${openSteps} left`}
      back
      footer={<Button label="Open case tracker" variant="secondary" onPress={goToCase} />}
    >
      <View style={{ gap: space.sm }} accessibilityRole="list">
        {steps.map((step, index) => {
          const done = step.status === 'done';
          const isLetter = LETTER_KINDS.has(step.kind) && !done;

          if (isLetter && generated) {
            return (
              <Card key={step.id} variant="focus" style={{ gap: space.md }}>
                <View style={styles.stepHead}>
                  <StepBadge n={index + 1} active />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[type.bodyStrong, { color: colors.ink }]}>{step.title}</Text>
                    <Text style={[type.tiny, { color: colors.teal, fontWeight: '700' }]}>Ready to send</Text>
                  </View>
                </View>

                <View style={styles.letter}>
                  <Text style={styles.letterTo}>To: {generated.to}</Text>
                  {editing ? (
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      multiline
                      accessibilityLabel="Letter text"
                      style={[styles.letterText, styles.letterInput]}
                    />
                  ) : (
                    <Text style={styles.letterText}>{letterBody}</Text>
                  )}
                </View>

                {hasPlaceholders && !editing ? (
                  <Text style={[type.tiny, { color: colors.orangeText }]}>
                    Fill in the items in [BRACKETS] before sending.
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {editing ? (
                    <Button label="Save changes" style={{ flex: 1 }} onPress={saveEdit} />
                  ) : (
                    <>
                      <Button label="Edit letter" variant="secondary" style={{ flex: 1 }} onPress={startEdit} />
                      <Button label="Send by email" style={{ flex: 1 }} onPress={sendByEmail} />
                    </>
                  )}
                </View>
                {!editing && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }}>
                    <Button label="Share or save" variant="ghost" onPress={shareLetter} />
                    <Button label="I sent it another way" variant="ghost" onPress={markSent} />
                  </View>
                )}
              </Card>
            );
          }

          return (
            <Pressable
              key={step.id}
              onPress={() => (LETTER_KINDS.has(step.kind) ? goToCase() : toggleStep(step))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={`${step.title}. ${step.detail}`}
              style={({ pressed }) => [styles.step, pressed && { opacity: 0.85 }]}
            >
              <StepBadge n={index + 1} done={done} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[
                    type.bodyStrong,
                    { color: done ? colors.muted : colors.ink },
                    done && { textDecorationLine: 'line-through' },
                  ]}
                >
                  {step.title}
                </Text>
                <Text style={[type.tiny, { color: colors.muted }]}>
                  {step.optional && !done ? 'Optional · ' : ''}
                  {step.detail}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.tiny, { color: colors.muted, textAlign: 'center' }]}>
        Templates and general information, not legal or medical advice.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
  letter: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 14,
    gap: space.sm,
  },
  letterTo: { fontSize: 11, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  letterText: { fontFamily: 'Georgia', fontSize: 14, lineHeight: 21, color: '#26313B' },
  letterInput: { minHeight: 260, textAlignVertical: 'top', padding: 0 },
});
