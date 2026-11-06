import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, space, TOUCH, type } from '../theme';

/**
 * Standard screen frame: safe area, optional back button and title,
 * scrolling content, and an optional footer pinned to the bottom.
 */
export function Screen({
  title,
  subtitle,
  back,
  right,
  footer,
  children,
  tabScreen,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Tab screens leave the bottom inset to the tab bar. */
  tabScreen?: boolean;
}) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={styles.safe} edges={tabScreen ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      {(title || back) && (
        <View style={styles.header}>
          {back ? (
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            {title ? (
              <Text style={[type.title, { color: colors.ink }]} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {subtitle ? <Text style={[type.small, { color: colors.muted }]}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  back: { width: TOUCH, height: TOUCH, marginLeft: -12, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: 18 },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.ground,
  },
});
