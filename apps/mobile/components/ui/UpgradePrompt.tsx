import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';

interface UpgradePromptProps {
  message: string;
  compact?: boolean;
}

export function UpgradePrompt({ message, compact }: UpgradePromptProps) {
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => router.push('/subscription')}
        activeOpacity={0.7}
      >
        <Text style={styles.compactIcon}>⭐</Text>
        <Text style={styles.compactText}>{message}</Text>
        <Text style={styles.compactArrow}>→</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⭐</Text>
      <Text style={styles.title}>Upgrade your plan</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/subscription')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>View Plans</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.goldLight,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  emoji: { fontSize: 32, marginBottom: 10 },
  title: { ...typography.headingSmall, color: colors.textPrimary, marginBottom: 6 },
  message: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buttonText: { ...typography.button, color: '#fff' },

  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  compactIcon: { fontSize: 16 },
  compactText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  compactArrow: { ...typography.labelMedium, color: colors.gold },
});
