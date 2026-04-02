import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { formatTime } from '../utils/formatDate';

const statusConfig: Record<string, { icon: string; bg: string; label: string; textColor: string }> = {
  PENDING: { icon: '🕐', bg: colors.divider, label: 'Tap to log', textColor: colors.textHint },
  TAKEN: { icon: '✅', bg: '#E7F9EE', label: 'Taken', textColor: colors.success },
  MISSED: { icon: '❌', bg: '#FFECEC', label: 'Missed', textColor: colors.danger },
  SKIPPED: { icon: '⏭', bg: '#FFF8F0', label: 'Skipped', textColor: '#B8860B' },
};

interface DoseRowProps {
  schedule: { time: string; label: string };
  medication: { name: string; dosage: string; id: string };
  log?: { status: string };
  onPress: () => void;
}

export function DoseRow({ schedule, medication, log, onPress }: DoseRowProps) {
  const status = log?.status || 'PENDING';
  const cfg = statusConfig[status] || statusConfig.PENDING;
  const isPending = status === 'PENDING';

  // Check if this dose time has passed
  const now = new Date();
  const [h, m] = schedule.time.split(':').map(Number);
  const isOverdue = isPending && (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m));

  return (
    <TouchableOpacity
      style={[styles.container, isOverdue && styles.containerOverdue]}
      onPress={isPending ? onPress : undefined}
      activeOpacity={isPending ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name} ${medication.dosage} at ${formatTime(schedule.time)}, ${cfg.label}`}
    >
      <View style={styles.timeCol}>
        <Text style={[styles.time, !isPending && { color: colors.textHint }]}>{formatTime(schedule.time)}</Text>
        {schedule.label ? <Text style={styles.label}>{schedule.label}</Text> : null}
      </View>
      <View style={styles.details}>
        <Text style={styles.medName}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage}</Text>
        {isOverdue && (
          <Text style={styles.overdueText}>Overdue</Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  containerOverdue: {
    backgroundColor: '#FFF8F5',
  },
  timeCol: {
    minWidth: 64,
  },
  time: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  label: {
    ...typography.labelSmall,
    color: colors.textHint,
    marginTop: 1,
    fontSize: 10,
  },
  details: { flex: 1 },
  medName: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  dosage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  overdueText: {
    ...typography.labelSmall,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
