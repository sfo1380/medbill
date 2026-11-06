import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, space, TOUCH, type } from '../theme';
import type { Tone } from '../lib/labels';

/* ---------- Card ---------- */

type CardVariant = 'plain' | 'teal' | 'tealTint' | 'orangeTint' | 'focus' | 'warn';

export function Card({
  variant = 'plain',
  style,
  children,
}: {
  variant?: CardVariant;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  return <View style={[styles.card, cardVariants[variant], style]}>{children}</View>;
}

const cardVariants: Record<CardVariant, ViewStyle> = {
  plain: {},
  teal: { backgroundColor: colors.teal, borderColor: colors.teal },
  tealTint: { backgroundColor: colors.tealTint, borderColor: colors.tealTint },
  orangeTint: { backgroundColor: colors.orangeTint, borderColor: colors.orangeTint },
  focus: { borderColor: colors.teal, borderWidth: 2 },
  warn: { borderColor: colors.orange, borderWidth: 2 },
};

/* ---------- Pill ---------- */

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  teal: { bg: colors.tealTint, fg: colors.teal },
  orange: { bg: colors.orangeTint, fg: colors.orangeText },
  blue: { bg: colors.blueTint, fg: colors.blueText },
  gray: { bg: '#EEF0F2', fg: colors.muted },
};

export function Pill({ label, tone, square }: { label: string; tone: Tone; square?: boolean }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, square && { borderRadius: 6 }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost';

export function Button({
  label,
  variant = 'primary',
  icon,
  loading,
  style,
  ...rest
}: {
  label: string;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  style?: ViewStyle;
} & Omit<PressableProps, 'style' | 'children'>) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!rest.disabled, busy: !!loading }}
      style={({ pressed }) => [styles.button, v.box, pressed && { opacity: 0.85 }, rest.disabled && { opacity: 0.5 }, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={v.text.color as string} /> : null}
          <Text style={[styles.buttonText, v.text]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { box: ViewStyle; text: TextStyle }> = {
  primary: { box: { backgroundColor: colors.teal }, text: { color: colors.white } },
  dark: { box: { backgroundColor: colors.ink }, text: { color: colors.white } },
  secondary: {
    box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
    text: { color: colors.ink },
  },
  ghost: { box: { backgroundColor: 'transparent', minHeight: TOUCH }, text: { color: colors.teal } },
};

/* ---------- Text helpers ---------- */

export function SectionLabel({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'teal' | 'orange';
}) {
  const color = tone === 'teal' ? colors.teal : tone === 'orange' ? colors.orangeText : colors.ink;
  return (
    <View style={styles.row}>
      <Text style={[strong ? type.heading : type.body, { color: tone ? color : strong ? colors.ink : colors.muted, flexShrink: 1 }]}>
        {label}
      </Text>
      <Text style={[strong ? type.heading : type.bodyStrong, { color, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

/* ---------- Step badge (numbered / done circle) ---------- */

export function StepBadge({ n, done, active }: { n: number; done?: boolean; active?: boolean }) {
  if (done) {
    return (
      <View style={[styles.stepBadge, { backgroundColor: colors.teal, borderColor: colors.teal }]}>
        <Ionicons name="checkmark" size={16} color={colors.white} />
      </View>
    );
  }
  return (
    <View style={[styles.stepBadge, { borderColor: active ? colors.teal : colors.borderStrong }]}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? colors.teal : colors.muted }}>{n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { ...type.label, color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
