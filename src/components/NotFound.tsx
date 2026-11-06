import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from './Screen';
import { Button } from './ui';
import { colors, type } from '../theme';

export function NotFound({ what }: { what: string }) {
  return (
    <Screen title={`${what} not found`} back>
      <Text style={[type.body, { color: colors.muted }]}>
        This {what.toLowerCase()} isn't in the app anymore. The demo resets each time the app restarts.
      </Text>
      <Button label="Go home" onPress={() => router.replace('/')} />
    </Screen>
  );
}
