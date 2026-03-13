import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { formatTime } from '../utils/formatDate';

const statusIcons: Record<string, { icon: string; color: string }> = {
  PENDING: { icon: '🕐', color: colors.textHint },
  TAKEN: { icon: '✅', color: colors.success },
  MISSED: { icon: '❌', color: colors.danger },
  SKIPPED: { icon: '↷', color: colors.warning },
};

interface DoseRowProps {
  schedule: { time: string; label: string };
  medication: { name: string; dosage: string; id: string };
  log?: { status: string };
  onPress: () => void;
}

export function DoseRow({ schedule, medication, log, onPress }: DoseRowProps) {
  const status = log?.status || 'PENDING';
  const { icon, color } = statusIcons[status];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={status === 'PENDING' ? onPress : undefined}
      activeOpacity={status === 'PENDING' ? 0.7 : 1}
    >
      <Text style={styles.time}>{formatTime(schedule.time)}</Text>
      <View style={styles.details}>
        <Text style={styles.medName}>{medication.name} {medication.dosage}</Text>
        <Text style={styles.label}>{schedule.label}</Text>
      </View>
      <Text style={[styles.statusIcon, { color }]}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    width: 80,
  },
  details: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    color: colors.textHint,
    marginTop: 2,
  },
  statusIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
});
