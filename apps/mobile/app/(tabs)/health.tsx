import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { useMedications } from '../../hooks/useMedications';
import { useJournal } from '../../hooks/useJournal';
import { DoseRow } from '../../components/DoseRow';
import { MedicationCard } from '../../components/MedicationCard';
import { JournalCard } from '../../components/JournalCard';
import { EmptyState } from '../../components/ui/EmptyState';

type SubTab = 'medications' | 'journal';

export default function HealthScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('medications');
  const { medications, loading: medsLoading, fetchMedications, logDose } = useMedications();
  const { entries, loading: journalLoading, fetchEntries } = useJournal();
  const { getActiveCircle } = useCircleStore();
  const activeCircle = getActiveCircle();

  useEffect(() => {
    fetchMedications();
    fetchEntries();
  }, []);

  const todaySchedule = medications.flatMap((med: any) =>
    (med.schedules || []).map((s: any) => {
      const log = (med.logs || []).find((l: any) => {
        const logTime = new Date(l.scheduledFor);
        const [h, m] = s.time.split(':').map(Number);
        return logTime.getHours() === h && logTime.getMinutes() === m;
      });
      return { schedule: s, medication: med, log };
    })
  ).sort((a: any, b: any) => a.schedule.time.localeCompare(b.schedule.time));

  const handleDoseAction = (medId: string, scheduledTime: string, action: 'TAKEN' | 'SKIPPED') => {
    const today = new Date();
    const [h, m] = scheduledTime.split(':').map(Number);
    today.setHours(h, m, 0, 0);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logDose(medId, { scheduledFor: today.toISOString(), status: action });
  };

  const handleDosePress = (medId: string, scheduledTime: string) => {
    Alert.alert('Log Dose', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', onPress: () => handleDoseAction(medId, scheduledTime, 'SKIPPED') },
      { text: 'Mark as Taken', onPress: () => handleDoseAction(medId, scheduledTime, 'TAKEN') },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'medications' && styles.tabActive]}
          onPress={() => setActiveTab('medications')}
        >
          <Text style={[styles.tabText, activeTab === 'medications' && styles.tabTextActive]}>Medications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>Journal</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'medications' ? (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={medsLoading} onRefresh={fetchMedications} />}
        >
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todaySchedule.length === 0 ? (
            <Text style={styles.emptyText}>No medications scheduled today</Text>
          ) : (
            todaySchedule.map((item: any, i: number) => (
              <DoseRow
                key={`${item.medication.id}-${item.schedule.time}-${i}`}
                schedule={item.schedule}
                medication={item.medication}
                log={item.log}
                onPress={() => handleDosePress(item.medication.id, item.schedule.time)}
              />
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Medications</Text>
            <TouchableOpacity onPress={() => router.push('/medication/add')}>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
          {medications.map((med: any) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onPress={() => router.push(`/medication/${med.id}`)}
            />
          ))}
          {medications.length === 0 && (
            <EmptyState title="No medications" message="Add medications to track doses." />
          )}
          <View style={styles.bottomPad} />
        </ScrollView>
      ) : (
        <View style={styles.flex}>
          <View style={styles.journalHeader}>
            <TouchableOpacity onPress={() => router.push('/journal/add')}>
              <Text style={styles.addText}>New Entry</Text>
            </TouchableOpacity>
          </View>
          {entries.length === 0 ? (
            <EmptyState
              title="No journal entries yet"
              message={`Record how ${activeCircle?.careRecipient || 'your loved one'} is doing today.`}
              buttonTitle="New Entry"
              onPress={() => router.push('/journal/add')}
            />
          ) : (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <JournalCard entry={item} onPress={() => router.push(`/journal/${item.id}`)} />
              )}
              contentContainerStyle={styles.listPad}
              refreshControl={<RefreshControl refreshing={journalLoading} onRefresh={() => fetchEntries()} />}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  tabRow: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  addText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  emptyText: { fontSize: 14, color: colors.textHint, textAlign: 'center', paddingVertical: 24 },
  journalHeader: { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'flex-end' },
  listPad: { paddingHorizontal: 16 },
  bottomPad: { height: 32 },
});
