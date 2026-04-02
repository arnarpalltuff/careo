import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
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

  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeCircleId) return;
    medicationService
      .get(activeCircleId, id)
      .then((data) => {
        setMed(data.medication);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;
  if (error || !med) return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>{error ? 'Failed to load medication.' : 'Medication not found.'}</Text>
    </View>
  );

  const logs = med.logs || [];
  const takenCount = logs.filter((l: any) => l.status === 'TAKEN').length;
  const missedCount = logs.filter((l: any) => l.status === 'MISSED').length;
  const adherenceRate = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : null;

  return (
    <>
      <Stack.Screen options={{ title: med.name }} />
      <ScrollView style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 28 }}>💊</Text>
          </View>
          <Text style={styles.name}>{med.name}</Text>
          <Text style={styles.dosage}>{med.dosage} — {med.frequency}</Text>
          {med.instructions && (
            <View style={styles.instructionBadge}>
              <Text style={styles.instructions}>{med.instructions}</Text>
            </View>
          )}
          {!med.isActive && (
            <View style={styles.inactiveBanner}>
              <Text style={styles.inactiveText}>This medication is inactive</Text>
            </View>
          )}
        </View>

        {adherenceRate !== null && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: adherenceRate >= 80 ? colors.success : adherenceRate >= 50 ? '#F0AD4E' : colors.danger }]}>{adherenceRate}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.success }]}>{takenCount}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: missedCount > 0 ? colors.danger : colors.textHint }]}>{missedCount}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
          </View>
        )}

        {med.prescriber && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🩺</Text>
            <View>
              <Text style={styles.fieldLabel}>Prescriber</Text>
              <Text style={styles.fieldValue}>{med.prescriber}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.scheduleCard}>
          {(med.schedules || []).map((s: any, i: number) => (
            <View key={s.id} style={[styles.scheduleItem, i < (med.schedules || []).length - 1 && styles.scheduleBorder]}>
              <Text style={styles.scheduleTime}>{formatTime(s.time)}</Text>
              <Text style={styles.scheduleLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Dose History</Text>
        {logs.length > 0 ? (
          <View style={styles.historyCard}>
            {logs.slice(0, 20).map((log: any, i: number) => {
              const sc = statusColors[log.status];
              return (
                <View key={log.id} style={[styles.logRow, i < Math.min(logs.length, 20) - 1 && styles.logBorder]}>
                  <Text style={styles.logDate}>{formatDate(log.scheduledFor)}</Text>
                  <Badge label={log.status} color={sc.bg} textColor={sc.text} />
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No dose history yet</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.tintMed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: { ...typography.displaySmall, color: colors.textPrimary, textAlign: 'center' },
  dosage: { ...typography.labelLarge, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  instructionBadge: {
    marginTop: 12,
    backgroundColor: colors.tintMed,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  instructions: { ...typography.bodySmall, color: colors.accent, textAlign: 'center' },
  inactiveBanner: {
    marginTop: 12,
    backgroundColor: colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  inactiveText: { ...typography.labelSmall, color: colors.textHint },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: { ...typography.headingLarge, fontSize: 22 },
  statLabel: { ...typography.labelSmall, color: colors.textHint, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  infoIcon: { fontSize: 22 },
  fieldLabel: { ...typography.labelSmall, color: colors.textHint },
  fieldValue: { ...typography.headingSmall, color: colors.textPrimary, marginTop: 2 },
  sectionTitle: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, fontWeight: '700', fontSize: 11, marginBottom: 10, marginTop: 10 },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  scheduleBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  scheduleTime: { ...typography.headingSmall, color: colors.primary, fontWeight: '700', minWidth: 70 },
  scheduleLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  logBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  logDate: { ...typography.bodyMedium, color: colors.textPrimary },
  emptyText: { ...typography.labelMedium, color: colors.textHint, textAlign: 'center', paddingVertical: 24 },
});
