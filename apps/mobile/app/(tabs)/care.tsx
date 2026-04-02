import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { impactMedium } from '../../utils/haptics';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useTasks } from '../../hooks/useTasks';
import { useMedications } from '../../hooks/useMedications';
import { useJournal } from '../../hooks/useJournal';
import { TaskCard } from '../../components/TaskCard';
import { MedicationCard } from '../../components/MedicationCard';
import { JournalCard } from '../../components/JournalCard';
import { DoseRow } from '../../components/DoseRow';
import { EmptyState } from '../../components/ui/EmptyState';

type Section = 'tasks' | 'meds' | 'journal';

const sections: { key: Section; label: string; emoji: string; bg: string; activeBg: string }[] = [
  { key: 'tasks', label: 'Tasks', emoji: '✓', bg: colors.tintTask, activeBg: colors.primary },
  { key: 'meds', label: 'Meds', emoji: '💊', bg: colors.tintMed, activeBg: colors.accent },
  { key: 'journal', label: 'Journal', emoji: '📋', bg: colors.tintJournal, activeBg: colors.gold },
];

export default function CareScreen() {
  const [active, setActive] = useState<Section>('tasks');
  const [taskFilter, setTaskFilter] = useState<string>('PENDING');
  const { caringFor } = useOnboardingStore();
  const { getActiveCircle } = useCircleStore();

  const { tasks, loading: tasksLoading, fetchTasks, completeTask } = useTasks();
  const { medications, loading: medsLoading, fetchMedications, logDose } = useMedications();
  const { entries, loading: journalLoading, fetchEntries } = useJournal();

  useEffect(() => { fetchTasks({ status: taskFilter }); }, [taskFilter]);
  useEffect(() => { fetchMedications(); fetchEntries(); }, []);

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
    impactMedium();
    logDose(medId, { scheduledFor: today.toISOString(), status: action });
  };

  const handleDosePress = (medId: string, scheduledTime: string) => {
    Alert.alert('Log Dose', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', onPress: () => handleDoseAction(medId, scheduledTime, 'SKIPPED') },
      { text: 'Taken', onPress: () => handleDoseAction(medId, scheduledTime, 'TAKEN') },
    ]);
  };

  const activeSection = sections.find((s) => s.key === active) ?? sections[0];
  const addRoute = active === 'tasks' ? '/task/add' : active === 'meds' ? '/medication/add' : '/journal/add';

  return (
    <View style={styles.root}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>{caringFor ? `${caringFor}'s` : ''}</Text>
          <Text style={styles.headerTitle}>Care</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: activeSection.activeBg }]} onPress={() => router.push(addRoute)} accessibilityRole="button" accessibilityLabel={`Add ${active === 'tasks' ? 'task' : active === 'meds' ? 'medication' : 'journal entry'}`}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Quick Stats ─── */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{tasks.length}</Text>
          <Text style={styles.quickStatLabel}>{taskFilter === 'COMPLETED' ? 'Done' : 'Tasks'}</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{todaySchedule.filter((d: any) => d.log?.status === 'TAKEN').length}/{todaySchedule.length}</Text>
          <Text style={styles.quickStatLabel}>Doses</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{entries.length}</Text>
          <Text style={styles.quickStatLabel}>Entries</Text>
        </View>
      </View>

      {/* ─── Section Tabs ─── */}
      <View style={styles.tabRow}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.tab, active === s.key && { backgroundColor: s.activeBg }]}
            onPress={() => setActive(s.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={s.label}
          >
            <Text style={[styles.tabEmoji, active === s.key && { opacity: 1 }]}>{s.emoji}</Text>
            <Text style={[styles.tabText, active === s.key && styles.tabTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Tasks ─── */}
      {active === 'tasks' && (
        <View style={styles.flex}>
          <View style={styles.filterRow}>
            {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, taskFilter === f && styles.filterActive]}
                onPress={() => setTaskFilter(f)}
                accessibilityRole="button"
                accessibilityLabel={f === 'PENDING' ? 'To Do' : f === 'IN_PROGRESS' ? 'Doing' : 'Done'}
              >
                <Text style={[styles.filterText, taskFilter === f && styles.filterTextActive]}>
                  {f === 'PENDING' ? 'To Do' : f === 'IN_PROGRESS' ? 'Doing' : 'Done'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tasks.length === 0 ? (
            <EmptyState
              title="All clear!"
              message={`No tasks here. Add one for ${caringFor || 'your loved one'}.`}
              buttonTitle="Add Task"
              onPress={() => router.push('/task/add')}
            />
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} onComplete={async () => { impactMedium(); await completeTask(item.id); }} />
              )}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={tasksLoading} onRefresh={() => fetchTasks({ status: taskFilter })} />}
            />
          )}
        </View>
      )}

      {/* ─── Meds ─── */}
      {active === 'meds' && (
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollPad} refreshControl={<RefreshControl refreshing={medsLoading} onRefresh={fetchMedications} />}>
          {todaySchedule.length > 0 && (
            <>
              <Text style={styles.subLabel}>TODAY'S SCHEDULE</Text>
              <View style={styles.scheduleCard}>
                {todaySchedule.map((item: any, i: number) => (
                  <DoseRow key={`${item.medication.id}-${item.schedule.time}-${i}`} schedule={item.schedule} medication={item.medication} log={item.log} onPress={() => handleDosePress(item.medication.id, item.schedule.time)} />
                ))}
              </View>
            </>
          )}
          <Text style={styles.subLabel}>ALL MEDICATIONS</Text>
          {medications.length === 0 ? (
            <EmptyState title="No medications" message="Track doses and schedules." />
          ) : (
            medications.map((med: any) => (
              <MedicationCard key={med.id} medication={med} onPress={() => router.push(`/medication/${med.id}`)} />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ─── Journal ─── */}
      {active === 'journal' && (
        <View style={styles.flex}>
          {entries.length === 0 ? (
            <EmptyState title="No entries yet" message={`Record how ${caringFor || 'your loved one'} is doing.`} buttonTitle="New Entry" onPress={() => router.push('/journal/add')} />
          ) : (
            <FlatList data={entries} keyExtractor={(item) => item.id} renderItem={({ item }) => <JournalCard entry={item} onPress={() => router.push(`/journal/${item.id}`)} />} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={journalLoading} onRefresh={() => fetchEntries()} />} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  headerLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: { ...typography.labelMedium, color: '#fff', fontWeight: '700' },

  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatNumber: { ...typography.headingMedium, color: colors.primary },
  quickStatLabel: { ...typography.labelSmall, color: colors.textHint, marginTop: 2 },
  quickStatDivider: { width: 1, backgroundColor: colors.divider, marginVertical: 2 },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tabEmoji: { fontSize: 16, opacity: 0.5 },
  tabText: { ...typography.labelMedium, color: colors.textHint },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  filterActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  filterText: { ...typography.labelSmall, color: colors.textHint },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingTop: 4 },
  scrollPad: { paddingHorizontal: 20, paddingTop: 4 },

  subLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 12,
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
});
