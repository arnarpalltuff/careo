import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { appointmentService } from '../../services/appointments';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string; emoji: string }> = {
  UPCOMING: { label: 'Upcoming', color: colors.primaryLight, textColor: colors.primary, emoji: '📅' },
  COMPLETED: { label: 'Completed', color: '#DCFCE7', textColor: '#166534', emoji: '✅' },
  CANCELLED: { label: 'Cancelled', color: '#FEE2E2', textColor: colors.danger, emoji: '❌' },
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeCircleId } = useCircleStore();
  const [appt, setAppt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppt = async () => {
    if (!activeCircleId) return;
    try {
      const data = await appointmentService.get(activeCircleId, id);
      setAppt(data.appointment);
    } catch {
      setError('Could not load appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppt(); }, []);

  const updateStatus = async (status: string) => {
    if (!activeCircleId) return;
    try {
      const data = await appointmentService.update(activeCircleId, id, { status });
      setAppt(data.appointment);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    }
  };

  const handleComplete = () => {
    Alert.alert('Complete Appointment', 'Mark this appointment as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => updateStatus('COMPLETED') },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Appointment', style: 'destructive', onPress: () => updateStatus('CANCELLED') },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Appointment', 'This will permanently remove the appointment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!activeCircleId) return;
          await appointmentService.delete(activeCircleId, id);
          router.back();
        },
      },
    ]);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) return <Spinner />;
  if (error || !appt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Appointment not found'}</Text>
        <Button title="Go Back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.UPCOMING;
  const isUpcoming = appt.status === 'UPCOMING';
  const apptDate = new Date(appt.date);
  const isPast = apptDate < new Date() && isUpcoming;

  return (
    <>
      <Stack.Screen options={{ title: 'Appointment' }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Status + Title */}
        <View style={styles.header}>
          <Badge label={sc.label} color={sc.color} textColor={sc.textColor} />
          <Text style={styles.title}>{appt.title}</Text>
        </View>

        {/* Date/Time card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>📅</Text>
            <View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(appt.date)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🕐</Text>
            <View>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(appt.time)}</Text>
            </View>
          </View>
          {appt.duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoEmoji}>⏱️</Text>
              <View>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{appt.duration} minutes</Text>
              </View>
            </View>
          )}
          {appt.reminder && (
            <View style={styles.infoRow}>
              <Text style={styles.infoEmoji}>🔔</Text>
              <View>
                <Text style={styles.infoLabel}>Reminder</Text>
                <Text style={styles.infoValue}>{appt.reminder} minutes before</Text>
              </View>
            </View>
          )}
        </View>

        {/* Location/Doctor card */}
        {(appt.location || appt.doctor || appt.phone) && (
          <View style={styles.card}>
            {appt.location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>📍</Text>
                <View style={styles.infoFlex}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{appt.location}</Text>
                </View>
              </View>
            )}
            {appt.doctor && (
              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>👨‍⚕️</Text>
                <View>
                  <Text style={styles.infoLabel}>Doctor</Text>
                  <Text style={styles.infoValue}>{appt.doctor}</Text>
                </View>
              </View>
            )}
            {appt.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={() => handleCall(appt.phone)}>
                <Text style={styles.infoEmoji}>📞</Text>
                <View>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={[styles.infoValue, styles.phoneLink]}>{appt.phone}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        {appt.notes && (
          <View style={styles.card}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{appt.notes}</Text>
          </View>
        )}

        {/* Past appointment reminder */}
        {isPast && (
          <View style={styles.pastBanner}>
            <Text style={styles.pastText}>This appointment appears to have passed. Did it happen?</Text>
            <View style={styles.pastActions}>
              <TouchableOpacity style={styles.pastBtn} onPress={handleComplete}>
                <Text style={styles.pastBtnTextGreen}>Yes, completed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pastBtn} onPress={handleCancel}>
                <Text style={styles.pastBtnTextRed}>No, missed it</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isUpcoming && !isPast && (
            <>
              <Button title="Mark as Completed" onPress={handleComplete} />
              <View style={{ height: 10 }} />
              <Button title="Cancel Appointment" variant="outline" onPress={handleCancel} />
              <View style={{ height: 10 }} />
            </>
          )}
          <TouchableOpacity onPress={handleDelete} style={styles.deleteLink}>
            <Text style={styles.deleteText}>Delete appointment</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.bg },
  errorText: { ...typography.bodyLarge, color: colors.danger, marginBottom: 16, textAlign: 'center' },

  header: { padding: 24, gap: 10, alignItems: 'flex-start' },
  title: { ...typography.displaySmall, color: colors.textPrimary },

  card: {
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12,
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.divider,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  infoFlex: { flex: 1 },
  infoEmoji: { fontSize: 20, marginTop: 2 },
  infoLabel: { ...typography.labelSmall, color: colors.textHint, marginBottom: 2 },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary },
  phoneLink: { color: colors.primary, textDecorationLine: 'underline' },

  notesLabel: { ...typography.labelSmall, color: colors.textHint, marginBottom: 6 },
  notesText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 22 },

  pastBanner: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16,
  },
  pastText: { ...typography.bodySmall, color: '#92400E', marginBottom: 10 },
  pastActions: { flexDirection: 'row', gap: 10 },
  pastBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  pastBtnTextGreen: { ...typography.labelMedium, color: colors.success },
  pastBtnTextRed: { ...typography.labelMedium, color: colors.danger },

  actions: { paddingHorizontal: 20, paddingTop: 8 },
  deleteLink: { alignItems: 'center', padding: 12, marginTop: 8 },
  deleteText: { ...typography.labelMedium, color: colors.danger, textDecorationLine: 'underline' },
});
