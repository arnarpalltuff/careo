import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { appointmentService } from '../../services/appointments';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeCircleId } = useCircleStore();
  const [appt, setAppt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCircleId) return;
    appointmentService.get(activeCircleId, id).then((data) => {
      setAppt(data.appointment);
      setLoading(false);
    });
  }, []);

  const handleDelete = () => {
    Alert.alert('Delete Appointment', 'Are you sure?', [
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

  if (loading) return <Spinner />;
  if (!appt) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Appointment' }} />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{appt.title}</Text>
        <Text style={styles.dateTime}>{formatDate(appt.date)} at {formatTime(appt.time)}</Text>
        {appt.duration && <Text style={styles.detail}>{appt.duration} minutes</Text>}
        {appt.location && <Field label="Location" value={appt.location} />}
        {appt.doctor && <Field label="Doctor" value={appt.doctor} />}
        {appt.phone && <Field label="Phone" value={appt.phone} />}
        {appt.notes && <Field label="Notes" value={appt.notes} />}
        <View style={{ height: 32 }} />
        <Button title="Delete Appointment" variant="danger" onPress={handleDelete} />
        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  title: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  dateTime: { fontSize: 16, color: colors.primary, fontWeight: '500', marginTop: 4 },
  detail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  field: { marginTop: 16 },
  fieldLabel: { fontSize: 14, color: colors.textHint },
  fieldValue: { fontSize: 16, color: colors.textPrimary, marginTop: 2 },
});
