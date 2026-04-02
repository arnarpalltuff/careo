import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useOnboardingStore } from '../stores/onboardingStore';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Types ─────────────────────────────────────────────────────────
type EventType = 'medication' | 'task' | 'appointment' | 'journal' | 'vital' | 'emergency' | 'note' | 'mood';

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle: string;
  timestamp: string;
  actor: string;
  status?: string;
  highlight?: boolean;
}

const eventConfig: Record<EventType, { emoji: string; color: string; bg: string }> = {
  medication: { emoji: '💊', color: '#E8725A', bg: colors.tintMed },
  task: { emoji: '✓', color: colors.primary, bg: colors.tintTask },
  appointment: { emoji: '🩺', color: '#7C6EDB', bg: colors.tintAppt },
  journal: { emoji: '📝', color: colors.gold, bg: colors.tintJournal },
  vital: { emoji: '📊', color: '#0984E3', bg: '#E8F4FD' },
  emergency: { emoji: '🚨', color: colors.danger, bg: colors.tintEmergency },
  note: { emoji: '📋', color: colors.textSecondary, bg: '#F5F5F5' },
  mood: { emoji: '😊', color: '#00B894', bg: colors.tintTask },
};

// ─── Demo Timeline Data ────────────────────────────────────────────
const now = new Date();
const h = (hoursAgo: number) => {
  const d = new Date(now);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};
const d = (daysAgo: number, hour = 12) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const demoEvents: TimelineEvent[] = [
  // Today
  { id: '1', type: 'mood', title: 'Daily mood check-in', subtitle: 'Mom is having a good day', timestamp: h(0.5), actor: 'Sarah' },
  { id: '2', type: 'medication', title: 'Lisinopril 10mg taken', subtitle: 'Morning dose - on time', timestamp: h(1), actor: 'Sarah', status: 'taken' },
  { id: '3', type: 'vital', title: 'Blood pressure logged', subtitle: '128/82 mmHg - Elevated', timestamp: h(1.5), actor: 'Sarah', highlight: true },
  { id: '4', type: 'medication', title: 'Vitamin D 2000 IU taken', subtitle: 'Morning dose', timestamp: h(2), actor: 'Sarah', status: 'taken' },
  { id: '5', type: 'task', title: 'Grocery shopping completed', subtitle: 'Soft foods picked up from Trader Joe\'s', timestamp: h(3), actor: 'Mike' },

  // Yesterday
  { id: '6', type: 'appointment', title: 'Physical therapy session', subtitle: 'RehabWorks Clinic - Knee strengthening', timestamp: d(1, 14), actor: 'Sarah' },
  { id: '7', type: 'medication', title: 'Metformin 500mg taken', subtitle: 'After lunch dose', timestamp: d(1, 12), actor: 'Sarah', status: 'taken' },
  { id: '8', type: 'journal', title: 'Journal entry added', subtitle: '"Good appetite today - ate full breakfast and lunch"', timestamp: d(1, 11), actor: 'Sarah' },
  { id: '9', type: 'vital', title: 'Weight logged', subtitle: '149 lbs - Stable', timestamp: d(1, 9), actor: 'Sarah' },
  { id: '10', type: 'medication', title: 'Lisinopril 10mg taken', subtitle: 'Morning dose', timestamp: d(1, 8), actor: 'Sarah', status: 'taken' },
  { id: '11', type: 'mood', title: 'Daily mood check-in', subtitle: 'Mom is doing great today', timestamp: d(1, 7), actor: 'Sarah' },

  // 2 days ago
  { id: '12', type: 'medication', title: 'Lisinopril 10mg MISSED', subtitle: 'Evening dose - not taken', timestamp: d(2, 20), actor: 'System', status: 'missed', highlight: true },
  { id: '13', type: 'note', title: 'Care note: Shift handoff', subtitle: 'Mom had a good afternoon. Ate soup for dinner. Watched her show.', timestamp: d(2, 18), actor: 'Emily' },
  { id: '14', type: 'task', title: 'Task assigned to Emily', subtitle: '"Prepare meals for the weekend"', timestamp: d(2, 15), actor: 'Sarah' },
  { id: '15', type: 'vital', title: 'Blood sugar logged', subtitle: '105 mg/dL - Normal', timestamp: d(2, 8), actor: 'Sarah' },

  // 3 days ago
  { id: '16', type: 'journal', title: 'Journal entry added', subtitle: '"Walked to the mailbox - first time in two weeks!"', timestamp: d(3, 16), actor: 'Sarah' },
  { id: '17', type: 'appointment', title: 'Lab work completed', subtitle: 'Quest Diagnostics - Blood panel results pending', timestamp: d(3, 9), actor: 'Sarah' },

  // 4 days ago
  { id: '18', type: 'emergency', title: 'Fall detected - alert sent', subtitle: 'Minor fall in bathroom. No injuries. Family notified.', timestamp: d(4, 22), actor: 'System', highlight: true },
  { id: '19', type: 'vital', title: 'Heart rate elevated', subtitle: '98 bpm - High end of normal', timestamp: d(4, 15), actor: 'Sarah', highlight: true },

  // 5 days ago
  { id: '20', type: 'task', title: 'Insurance claim filed', subtitle: 'Submitted physical therapy claim to UHC', timestamp: d(5, 14), actor: 'Mike' },
  { id: '21', type: 'medication', title: 'New medication added', subtitle: 'Vitamin D 2000 IU - Daily morning', timestamp: d(5, 10), actor: 'Sarah' },
];

type FilterType = 'all' | EventType;
const filters: { key: FilterType; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '📌' },
  { key: 'medication', label: 'Meds', emoji: '💊' },
  { key: 'vital', label: 'Vitals', emoji: '📊' },
  { key: 'task', label: 'Tasks', emoji: '✓' },
  { key: 'appointment', label: 'Appts', emoji: '🩺' },
  { key: 'journal', label: 'Journal', emoji: '📝' },
  { key: 'emergency', label: 'Alerts', emoji: '🚨' },
];

// ─── Component ─────────────────────────────────────────────────────
export default function CareTimelineScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { caringFor } = useOnboardingStore();

  const filtered = activeFilter === 'all'
    ? demoEvents
    : demoEvents.filter((e) => e.type === activeFilter);

  // Group by date
  const groups: { date: string; label: string; events: TimelineEvent[] }[] = [];
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  for (const event of filtered) {
    const eventDate = new Date(event.timestamp);
    const dateStr = eventDate.toDateString();
    let label = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (dateStr === todayStr) label = 'Today';
    else if (dateStr === yesterdayStr) label = 'Yesterday';

    const existing = groups.find((g) => g.date === dateStr);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.push({ date: dateStr, label, events: [event] });
    }
  }

  // Stats
  const totalMeds = demoEvents.filter((e) => e.type === 'medication').length;
  const takenMeds = demoEvents.filter((e) => e.type === 'medication' && e.status === 'taken').length;
  const missedMeds = demoEvents.filter((e) => e.type === 'medication' && e.status === 'missed').length;
  const totalVitals = demoEvents.filter((e) => e.type === 'vital').length;
  const alerts = demoEvents.filter((e) => e.highlight).length;

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.02} variant="wide" />
      {/* Hero */}
      <View style={styles.hero}>
        <CrossHatch color="#fff" opacity={0.04} />
        <RadialRings color="#fff" opacity={0.05} cx={320} cy={40} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>🕐</Text>
        <Text style={styles.heroTitle}>{caringFor || 'Care'} Timeline</Text>
        <Text style={styles.heroSub}>Complete care activity history</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.success }]}>{takenMeds}</Text>
          <Text style={styles.statLabel}>Doses{'\n'}taken</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.danger }]}>{missedMeds}</Text>
          <Text style={styles.statLabel}>Doses{'\n'}missed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#0984E3' }]}>{totalVitals}</Text>
          <Text style={styles.statLabel}>Vitals{'\n'}logged</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.warning }]}>{alerts}</Text>
          <Text style={styles.statLabel}>Needs{'\n'}attention</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, activeFilter === f.key && styles.filterActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={styles.filterEmoji}>{f.emoji}</Text>
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timeline */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.date}>
            <Text style={styles.dateHeader}>{group.label}</Text>
            {group.events.map((event, i) => {
              const cfg = eventConfig[event.type];
              return (
                <View key={event.id} style={styles.eventRow}>
                  {/* Timeline line */}
                  <View style={styles.timelineTrack}>
                    <View style={[styles.timelineDot, { backgroundColor: cfg.color }, event.highlight && styles.timelineDotHighlight]} />
                    {i < group.events.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Event content */}
                  <View style={[styles.eventCard, event.highlight && { borderLeftWidth: 3, borderLeftColor: cfg.color }]}>
                    <View style={styles.eventHeader}>
                      <View style={[styles.eventIconWrap, { backgroundColor: cfg.bg }]}>
                        <Text style={{ fontSize: 16 }}>{cfg.emoji}</Text>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={[styles.eventTitle, event.status === 'missed' && { color: colors.danger }]}>
                          {event.title}
                        </Text>
                        <Text style={styles.eventSub}>{event.subtitle}</Text>
                      </View>
                    </View>
                    <View style={styles.eventMeta}>
                      <Text style={styles.eventTime}>
                        {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.eventActor}>by {event.actor}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.heroStart,
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  backBtn: { position: 'absolute', left: 20, top: Platform.OS === 'web' ? 48 : 60 },
  backText: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { ...typography.displayMedium, color: '#fff' },
  heroSub: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...typography.headingMedium, fontSize: 22 },
  statLabel: { ...typography.labelSmall, color: colors.textHint, textAlign: 'center', marginTop: 4, fontSize: 10, lineHeight: 13 },
  statDivider: { width: 1, backgroundColor: colors.divider, marginVertical: 4 },

  // Filters
  filterScroll: { marginTop: 14, maxHeight: 48 },
  filterContainer: { paddingHorizontal: 18, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.divider,
    gap: 6,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterEmoji: { fontSize: 13 },
  filterText: { ...typography.labelSmall, color: colors.textHint },
  filterTextActive: { color: '#fff' },

  // Timeline
  scroll: { flex: 1, paddingTop: 8 },
  dateHeader: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    fontWeight: '700',
    fontSize: 11,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 10,
  },
  eventRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
  },
  timelineTrack: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineDotHighlight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.divider,
    marginTop: -2,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginLeft: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1 },
  eventTitle: { ...typography.headingSmall, color: colors.textPrimary, fontSize: 13 },
  eventSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, fontSize: 12, lineHeight: 16 },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  eventTime: { ...typography.labelSmall, color: colors.textHint, fontSize: 11 },
  eventActor: { ...typography.labelSmall, color: colors.primary, fontSize: 11 },
});
