import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';

interface MedicationCardProps {
  medication: any;
  onPress: () => void;
}

export function MedicationCard({ medication, onPress }: MedicationCardProps) {
  const scheduleCount = medication.schedules?.length || 0;
  const scheduleLabel = scheduleCount === 1 ? '1 time/day' : scheduleCount > 1 ? `${scheduleCount} times/day` : '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={medication.name}>
      <View style={styles.iconWrap}>
        <Text style={{ fontSize: 22 }}>💊</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage} — {medication.frequency}</Text>
        <View style={styles.metaRow}>
          {medication.prescriber && (
            <Text style={styles.prescriber}>Dr. {medication.prescriber}</Text>
          )}
          {scheduleLabel && medication.prescriber && (
            <Text style={styles.dot}> · </Text>
          )}
          {scheduleLabel && (
            <Text style={styles.scheduleInfo}>{scheduleLabel}</Text>
          )}
        </View>
        {medication.instructions && (
          <View style={styles.instructionPill}>
            <Text style={styles.instructionText}>{medication.instructions}</Text>
          </View>
        )}
      </View>
      {!medication.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Inactive</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.tintMed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  name: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  dosage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  prescriber: {
    ...typography.bodySmall,
    color: colors.textHint,
  },
  dot: {
    ...typography.bodySmall,
    color: colors.textHint,
  },
  scheduleInfo: {
    ...typography.bodySmall,
    color: colors.textHint,
  },
  instructionPill: {
    marginTop: 6,
    backgroundColor: colors.tintMed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  instructionText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontSize: 10,
  },
  inactiveBadge: {
    backgroundColor: colors.divider,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveText: {
    ...typography.labelSmall,
    color: colors.textHint,
    fontSize: 10,
  },
});
