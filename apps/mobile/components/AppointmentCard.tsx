import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { formatTime } from '../utils/formatDate';

interface AppointmentCardProps {
  appointment: any;
  onPress: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.time}>{formatTime(appointment.time)}</Text>
      <View style={styles.details}>
        <Text style={styles.title}>{appointment.title}</Text>
        {appointment.location && <Text style={styles.location}>{appointment.location}</Text>}
        {appointment.doctor && <Text style={styles.doctor}>{appointment.doctor}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    width: 80,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  location: {
    fontSize: 13,
    color: colors.textHint,
    marginTop: 2,
  },
  doctor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
