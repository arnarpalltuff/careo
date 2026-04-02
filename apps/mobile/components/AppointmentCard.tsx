import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { formatTime } from '../utils/formatDate';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  UPCOMING: { color: '#7C6EDB', bg: colors.tintAppt, label: 'Upcoming' },
  COMPLETED: { color: colors.success, bg: '#E7F9EE', label: 'Completed' },
  CANCELLED: { color: colors.textHint, bg: colors.divider, label: 'Cancelled' },
};

interface AppointmentCardProps {
  appointment: any;
  onPress: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.UPCOMING;
  const isCancelled = appointment.status === 'CANCELLED';

  return (
    <TouchableOpacity
      style={[styles.container, isCancelled && styles.containerCancelled]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${appointment.title}, ${status.label}`}
    >
      <View style={[styles.timePill, { backgroundColor: status.bg }]}>
        <Text style={[styles.time, { color: status.color }]}>{formatTime(appointment.time)}</Text>
        {appointment.duration && (
          <Text style={[styles.duration, { color: status.color }]}>{appointment.duration}m</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, isCancelled && styles.titleCancelled]}>{appointment.title}</Text>
        {appointment.doctor && (
          <Text style={styles.doctor}>{appointment.doctor}</Text>
        )}
        {appointment.location && <Text style={styles.sub}>{appointment.location}</Text>}
      </View>
      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  containerCancelled: {
    opacity: 0.6,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 70,
    alignItems: 'center',
  },
  time: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  duration: {
    ...typography.labelSmall,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  content: { flex: 1 },
  title: { ...typography.headingSmall, color: colors.textPrimary },
  titleCancelled: { textDecorationLine: 'line-through', color: colors.textHint },
  doctor: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  sub: { ...typography.bodySmall, color: colors.textHint, marginTop: 1 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
