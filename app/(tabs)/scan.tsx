import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../src/components/Screen';
import { Button, Card } from '../../src/components/ui';
import { PrivacyLine } from '../../src/components/billParts';
import { useStore } from '../../src/state/AppStore';
import { sampleScannedBill } from '../../src/data/sampleData';
import { newId } from '../../src/state/reducer';
import { todayISO } from '../../src/lib/format';
import { colors, radius, space, type } from '../../src/theme';

/** How long the fake "reading your bill" step takes in the demo. */
const DEMO_READ_MS = 1500;

const STEPS = ['Bill', 'Insurance EOB', 'Review'];

export default function ScanScreen() {
  const { dispatch } = useStore();
  const [reading, setReading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // MVP: every input method loads the same sample bill. Camera, file picker
  // and email forwarding replace this once the bill-reading backend exists.
  const startDemoScan = () => {
    setReading(true);
    timer.current = setTimeout(() => {
      const today = todayISO();
      const bill = sampleScannedBill(newId('scan'), today);
      dispatch({ type: 'ADD_BILL', bill, today });
      setReading(false);
      router.push({ pathname: '/bill/[id]', params: { id: bill.id } });
    }, DEMO_READ_MS);
  };

  return (
    <Screen title="Add a bill" tabScreen>
      <View style={styles.steps} accessibilityLabel="Step 1 of 3, Bill">
        {STEPS.map((label, i) => (
          <View key={label} style={{ flex: 1, gap: 6 }}>
            <View style={[styles.stepBar, { backgroundColor: i === 0 ? colors.teal : colors.borderStrong }]} />
            <Text style={[type.tiny, { color: i === 0 ? colors.teal : colors.muted, fontWeight: i === 0 ? '700' : '500' }]}>
              {i + 1} · {label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.viewfinder} accessibilityLabel="Camera view">
        <View style={[styles.corner, { top: 24, left: 24, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }]} />
        <View style={[styles.corner, { top: 24, right: 24, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }]} />
        <View style={[styles.corner, { bottom: 24, left: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }]} />
        <View style={[styles.corner, { bottom: 24, right: 24, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 }]} />
        <Ionicons name={reading ? 'sync-outline' : 'document-text-outline'} size={40} color="#C9D2DA" />
        <Text style={styles.viewfinderText}>
          {reading ? 'Reading your bill…' : 'Line up the whole bill inside the frame. Include every page.'}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Button label="Take photo" icon="camera-outline" onPress={startDemoScan} loading={reading} disabled={reading} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Upload PDF" variant="secondary" style={{ flex: 1 }} onPress={startDemoScan} disabled={reading} />
          <Button label="Forward email" variant="secondary" style={{ flex: 1 }} onPress={startDemoScan} disabled={reading} />
        </View>
        <Text style={[type.tiny, { color: colors.muted, textAlign: 'center' }]}>
          Demo version: each option loads a sample bill.
        </Text>
      </View>

      <Card variant="tealTint" style={{ flexDirection: 'row', gap: space.md }}>
        <Ionicons name="information-circle-outline" size={20} color={colors.teal} />
        <Text style={[type.small, { color: '#0A4A46', flex: 1 }]}>
          Next, add the Explanation of Benefits from your insurer. Matching the two is where most billing errors show up.
        </Text>
      </Card>

      <PrivacyLine />
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: space.sm },
  stepBar: { height: 4, borderRadius: 2 },
  viewfinder: {
    height: 280,
    borderRadius: radius.xl,
    backgroundColor: '#1E2A35',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: colors.white },
  viewfinderText: { fontSize: 14, color: '#C9D2DA', textAlign: 'center', maxWidth: 220, lineHeight: 20 },
});
