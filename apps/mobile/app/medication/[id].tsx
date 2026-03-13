import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { medicationService } from '../../services/medications';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

const statusColors: Record<string, { bg: string; text: string }> = {
  TAKEN: { bg: '#E8F5E9', text: colors.success },
  PENDING: { bg: colors.divider, text: colors.textHint },
  MISSED: { bg: '#FFEBEE', text: colors.danger },
  SKIPPED: { bg: '#FFF3E0', text: colors.warning },
};

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeCircleId } = useCircleStore();
  const [med, setMed] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCircleId) return;
    medicationService.get(activeCircleId, id).then((data) => {
      setMed(data.medication);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  if (!med) return null;

  return (
    <>
      <Stack.Screen options={{ title: med.name }} />
      <ScrollView style={styles.container}>
        <Text style={styles.name}>{med.name}</Text>
        <Text style={styles.dosage}>{med.dosage} — {med.frequency}</Text>
        {med.instructions && <Text style={styles.instructions}>{med.instructions}</Text>}
        {med.prescriber && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Prescriber</Text>
            <Text style={styles.fieldValue}>{med.prescriber}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Schedule</Text>
        {(med.schedules || []).map((s: any) => (
          <View key={s.id} style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>{formatTime(s.time)}</Text>
            <Text style={styles.scheduleLabel}>{s.label}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Dose History (Last 30 Days)</Text>
        {(med.logs || []).map((log: any) => {
          const sc = statusColors[log.status];
          return (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logDate}>{formatDate(log.scheduledFor)}</Text>
              <Text style={styles.logTime}>{formatTime(new Date(log.scheduledFor).toTimeString().slice(0, 5))}</Text>
              <Badge label={log.status} color={sc.bg} textColor={sc.text} />
            </View>
          );
        })}
        {(med.logs || []).length === 0 && <Text style={styles.emptyText}>No dose history yet</Text>}
        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  name: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  dosage: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
  instructions: { fontSize: 15, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  field: { marginTop: 16 },
  fieldLabel: { fontSize: 14, color: colors.textHint },
  fieldValue: { fontSize: 16, color: colors.textPrimary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginTop: 24, marginBottom: 12 },
  scheduleItem: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  scheduleTime: { fontSize: 15, fontWeight: '600', color: colors.primary, width: 80 },
  scheduleLabel: { fontSize: 15, color: colors.textPrimary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  logDate: { flex: 1, fontSize: 14, color: colors.textPrimary },
  logTime: { fontSize: 14, color: colors.textSecondary, width: 70 },
  emptyText: { fontSize: 14, color: colors.textHint, textAlign: 'center', paddingVertical: 24 },
});
