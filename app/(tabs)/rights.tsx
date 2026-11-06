import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '../../src/components/Screen';
import { RIGHTS_DISCLAIMER, rightsArticles } from '../../src/data/rights';
import { colors, radius, space, type } from '../../src/theme';

export default function RightsScreen() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Screen title="Your rights" subtitle="Plain-English guides to medical bills" tabScreen>
      <View style={{ gap: space.sm }}>
        {rightsArticles.map((article) => {
          const isOpen = open === article.id;
          return (
            <Pressable
              key={article.id}
              onPress={() => setOpen(isOpen ? null : article.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={styles.article}
            >
              <View style={styles.head}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: colors.ink }]}>{article.title}</Text>
                  <Text style={[type.small, { color: colors.muted }]}>{article.summary}</Text>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
              {isOpen && (
                <View style={{ gap: space.sm, paddingTop: space.xs }}>
                  {article.body.map((p, i) => (
                    <Text key={i} style={[type.body, { color: colors.inkSoft }]}>
                      {p}
                    </Text>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={[type.tiny, { color: colors.muted, textAlign: 'center' }]}>{RIGHTS_DISCLAIMER}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  article: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
