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
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Types ─────────────────────────────────────────────────────────
interface Shift {
  id: string;
  caregiver: string;
  avatar: string;
  day: number; // 0-6
  startHour: number;
  endHour: number;
  type: 'primary' | 'backup' | 'overnight';
  notes?: string;
}

interface HandoffNote {
  id: string;
  from: string;
  to: string;
  timestamp: string;
  content: string;
  urgent?: boolean;
}

// ─── Demo Data ─────────────────────────────────────────────────────
const caregivers = [
  { name: 'Sarah', emoji: '👩', color: '#E8725A' },
  { name: 'Mike', emoji: '👨', color: '#0984E3' },
  { name: 'Emily', emoji: '👩‍🦰', color: '#00B894' },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const demoShifts: Shift[] = [
  // Sarah - Mon-Wed mornings, Fri evening
  { id: 's1', caregiver: 'Sarah', avatar: '👩', day: 0, startHour: 7, endHour: 15, type: 'primary' },
  { id: 's2', caregiver: 'Sarah', avatar: '👩', day: 1, startHour: 7, endHour: 15, type: 'primary' },
  { id: 's3', caregiver: 'Sarah', avatar: '👩', day: 2, startHour: 7, endHour: 15, type: 'primary' },
  { id: 's4', caregiver: 'Sarah', avatar: '👩', day: 4, startHour: 17, endHour: 22, type: 'primary' },
  // Mike - Thu-Fri day
  { id: 'm1', caregiver: 'Mike', avatar: '👨', day: 3, startHour: 8, endHour: 16, type: 'primary' },
  { id: 'm2', caregiver: 'Mike', avatar: '👨', day: 4, startHour: 8, endHour: 16, type: 'primary' },
  // Emily - Weekends
  { id: 'e1', caregiver: 'Emily', avatar: '👩‍🦰', day: 5, startHour: 9, endHour: 18, type: 'primary' },
  { id: 'e2', caregiver: 'Emily', avatar: '👩‍🦰', day: 6, startHour: 9, endHour: 18, type: 'primary' },
  // Backup shifts
  { id: 'b1', caregiver: 'Mike', avatar: '👨', day: 0, startHour: 15, endHour: 20, type: 'backup', notes: 'If Sarah needs to leave early' },
  { id: 'b2', caregiver: 'Sarah', avatar: '👩', day: 5, startHour: 18, endHour: 22, type: 'backup', notes: 'Evening backup' },
  // Overnight
  { id: 'o1', caregiver: 'Sarah', avatar: '👩', day: 2, startHour: 22, endHour: 7, type: 'overnight' },
  { id: 'o2', caregiver: 'Mike', avatar: '👨', day: 5, startHour: 22, endHour: 7, type: 'overnight' },
];

const now = new Date();
const demoHandoffs: HandoffNote[] = [
  {
    id: 'h1',
    from: 'Sarah',
    to: 'Mike',
    timestamp: new Date(now.getTime() - 86400000).toISOString(),
    content: 'Mom had a good morning. Ate full breakfast. Took all meds on time. She mentioned knee pain so I gave her a heat pad. PT exercises done.',
  },
  {
    id: 'h2',
    from: 'Mike',
    to: 'Emily',
    timestamp: new Date(now.getTime() - 172800000).toISOString(),
    content: 'Quiet afternoon. She napped for 2 hours. Dinner: soup and crackers. Remind her to do ankle exercises before bed.',
    urgent: false,
  },
  {
    id: 'h3',
    from: 'Emily',
    to: 'Sarah',
    timestamp: new Date(now.getTime() - 259200000).toISOString(),
    content: 'Great weekend! We went for a short walk outside. She was in good spirits. Note: almost out of Lisinopril — need refill by Tuesday.',
    urgent: true,
  },
];

const typeColors = {
  primary: colors.primary,
  backup: colors.gold,
  overnight: '#6C5CE7',
};

const typeBgs = {
  primary: colors.tintTask,
  backup: colors.tintJournal,
  overnight: colors.tintAppt,
};

// ─── Component ─────────────────────────────────────────────────────
export default function ShiftsScreen() {
  const [view, setView] = useState<'schedule' | 'handoffs'>('schedule');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Mon=0

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const dayShifts = demoShifts.filter((s) => s.day === selectedDay);

  // Weekly coverage summary
  const coverageHours = days.map((_, i) => {
    const dayS = demoShifts.filter((s) => s.day === i && s.type === 'primary');
    return dayS.reduce((acc, s) => acc + (s.endHour > s.startHour ? s.endHour - s.startHour : 24 - s.startHour + s.endHour), 0);
  });

  const totalWeeklyHours = coverageHours.reduce((a, b) => a + b, 0);

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
        <Text style={styles.heroEmoji}>📅</Text>
        <Text style={styles.heroTitle}>Care Shifts</Text>
        <Text style={styles.heroSub}>Family caregiver schedule</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'schedule' && styles.toggleActive]}
          onPress={() => setView('schedule')}
        >
          <Text style={[styles.toggleText, view === 'schedule' && styles.toggleTextActive]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'handoffs' && styles.toggleActive]}
          onPress={() => setView('handoffs')}
        >
          <Text style={[styles.toggleText, view === 'handoffs' && styles.toggleTextActive]}>Handoff Notes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {view === 'schedule' ? (
          <>
            {/* Coverage Summary */}
            <View style={styles.coverageCard}>
              <View style={styles.coverageHeader}>
                <Text style={styles.coverageTitle}>Weekly Coverage</Text>
                <Text style={styles.coverageTotal}>{totalWeeklyHours}h total</Text>
              </View>
              <View style={styles.coverageBars}>
                {days.map((day, i) => (
                  <View key={day} style={styles.coverageCol}>
                    <Text style={styles.coverageHours}>{coverageHours[i]}h</Text>
                    <View style={styles.coverageBarBg}>
                      <View
                        style={[
                          styles.coverageBarFill,
                          {
                            height: `${Math.min((coverageHours[i] / 18) * 100, 100)}%`,
                            backgroundColor: coverageHours[i] >= 8 ? colors.success : coverageHours[i] >= 5 ? colors.warning : colors.danger,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.coverageDay, i === todayIdx && styles.coverageDayToday]}>{day}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Day Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayContainer}>
              {days.map((day, i) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPill,
                    selectedDay === i && styles.dayPillActive,
                    i === todayIdx && selectedDay !== i && styles.dayPillToday,
                  ]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayPillText, selectedDay === i && styles.dayPillTextActive]}>
                    {day}
                  </Text>
                  {i === todayIdx && <View style={styles.todayDot} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.selectedDayLabel}>{fullDays[selectedDay]}</Text>

            {/* Day Shifts */}
            {dayShifts.length === 0 ? (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyEmoji}>😴</Text>
                <Text style={styles.emptyText}>No shifts scheduled</Text>
                <Text style={styles.emptyHint}>Tap + to add one</Text>
              </View>
            ) : (
              dayShifts.map((shift) => {
                const cg = caregivers.find((c) => c.name === shift.caregiver);
                return (
                  <View
                    key={shift.id}
                    style={[styles.shiftCard, { backgroundColor: typeBgs[shift.type], borderLeftColor: typeColors[shift.type], borderLeftWidth: 4 }]}
                  >
                    <View style={styles.shiftHeader}>
                      <View style={styles.shiftPerson}>
                        <Text style={styles.shiftAvatar}>{shift.avatar}</Text>
                        <View>
                          <Text style={styles.shiftName}>{shift.caregiver}</Text>
                          <View style={[styles.typeBadge, { backgroundColor: typeColors[shift.type] + '20' }]}>
                            <Text style={[styles.typeBadgeText, { color: typeColors[shift.type] }]}>
                              {shift.type.charAt(0).toUpperCase() + shift.type.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.shiftTimeBlock}>
                        <Text style={[styles.shiftTime, { color: typeColors[shift.type] }]}>
                          {shift.startHour > 12 ? shift.startHour - 12 : shift.startHour}
                          {shift.startHour >= 12 ? 'PM' : 'AM'}
                          {' — '}
                          {shift.endHour > 12 ? shift.endHour - 12 : shift.endHour}
                          {shift.endHour >= 12 ? 'PM' : 'AM'}
                        </Text>
                        <Text style={styles.shiftDuration}>
                          {shift.endHour > shift.startHour
                            ? shift.endHour - shift.startHour
                            : 24 - shift.startHour + shift.endHour}h
                        </Text>
                      </View>
                    </View>
                    {shift.notes && (
                      <Text style={styles.shiftNotes}>{shift.notes}</Text>
                    )}
                  </View>
                );
              })
            )}

            {/* Team Legend */}
            <View style={styles.legendCard}>
              <Text style={styles.legendTitle}>Care Team</Text>
              {caregivers.map((cg) => {
                const cgShifts = demoShifts.filter((s) => s.caregiver === cg.name && s.type === 'primary');
                const totalHrs = cgShifts.reduce((acc, s) => acc + (s.endHour > s.startHour ? s.endHour - s.startHour : 24 - s.startHour + s.endHour), 0);
                return (
                  <View key={cg.name} style={styles.legendRow}>
                    <Text style={styles.legendAvatar}>{cg.emoji}</Text>
                    <Text style={styles.legendName}>{cg.name}</Text>
                    <View style={[styles.legendBarBg, { flex: 1 }]}>
                      <View style={[styles.legendBarFill, { width: `${(totalHrs / totalWeeklyHours) * 100}%`, backgroundColor: cg.color }]} />
                    </View>
                    <Text style={[styles.legendHours, { color: cg.color }]}>{totalHrs}h/wk</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {/* Handoff Notes */}
            <View style={styles.handoffHeader}>
              <Text style={styles.handoffTitle}>Shift Handoff Notes</Text>
              <Text style={styles.handoffSub}>Keep the next caregiver informed</Text>
            </View>

            <TouchableOpacity style={styles.newHandoffBtn}>
              <Text style={styles.newHandoffText}>+ Write Handoff Note</Text>
            </TouchableOpacity>

            {demoHandoffs.map((note) => (
              <View key={note.id} style={[styles.handoffCard, note.urgent && styles.handoffUrgent]}>
                <View style={styles.handoffMeta}>
                  <View style={styles.handoffArrow}>
                    <Text style={styles.handoffFrom}>{caregivers.find((c) => c.name === note.from)?.emoji} {note.from}</Text>
                    <Text style={styles.handoffArrowIcon}>{'\u2192'}</Text>
                    <Text style={styles.handoffTo}>{caregivers.find((c) => c.name === note.to)?.emoji} {note.to}</Text>
                  </View>
                  {note.urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>Action needed</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.handoffContent}>{note.content}</Text>
                <Text style={styles.handoffTime}>
                  {new Date(note.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </>
        )}

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

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { ...typography.labelMedium, color: colors.textHint },
  toggleTextActive: { color: '#fff', fontWeight: '700' },

  scroll: { flex: 1, paddingTop: 16 },

  // Coverage
  coverageCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  coverageTitle: { ...typography.headingSmall, color: colors.textPrimary },
  coverageTotal: { ...typography.labelMedium, color: colors.primary },
  coverageBars: { flexDirection: 'row', gap: 6, height: 80 },
  coverageCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  coverageHours: { ...typography.labelSmall, fontSize: 9, color: colors.textHint, marginBottom: 4 },
  coverageBarBg: { width: '100%', height: 50, backgroundColor: colors.divider, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  coverageBarFill: { width: '100%', borderRadius: 6 },
  coverageDay: { ...typography.labelSmall, fontSize: 10, color: colors.textHint, marginTop: 4 },
  coverageDayToday: { color: colors.primary, fontWeight: '700' },

  // Day Selector
  dayScroll: { maxHeight: 50, marginBottom: 8 },
  dayContainer: { paddingHorizontal: 18, gap: 8 },
  dayPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillToday: { borderColor: colors.primary },
  dayPillText: { ...typography.labelMedium, color: colors.textHint },
  dayPillTextActive: { color: '#fff' },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  selectedDayLabel: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },

  // Shifts
  shiftCard: {
    marginHorizontal: 18,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftPerson: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shiftAvatar: { fontSize: 32 },
  shiftName: { ...typography.headingSmall, color: colors.textPrimary },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  typeBadgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
  shiftTimeBlock: { alignItems: 'flex-end' },
  shiftTime: { ...typography.labelMedium, fontWeight: '700' },
  shiftDuration: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  shiftNotes: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 10, fontStyle: 'italic' },

  emptyDay: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8, opacity: 0.5 },
  emptyText: { ...typography.headingSmall, color: colors.textSecondary },
  emptyHint: { ...typography.bodySmall, color: colors.textHint, marginTop: 4 },

  // Legend
  legendCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  legendTitle: { ...typography.headingSmall, color: colors.textPrimary, marginBottom: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  legendAvatar: { fontSize: 22 },
  legendName: { ...typography.labelMedium, color: colors.textPrimary, width: 54 },
  legendBarBg: { height: 8, backgroundColor: colors.divider, borderRadius: 4, overflow: 'hidden' },
  legendBarFill: { height: '100%', borderRadius: 4 },
  legendHours: { ...typography.labelMedium, fontWeight: '700', width: 48, textAlign: 'right' },

  // Handoffs
  handoffHeader: { paddingHorizontal: 18, marginBottom: 16 },
  handoffTitle: { ...typography.headingMedium, color: colors.textPrimary },
  handoffSub: { ...typography.bodySmall, color: colors.textHint, marginTop: 4 },
  newHandoffBtn: {
    marginHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginBottom: 16,
  },
  newHandoffText: { ...typography.labelLarge, color: '#fff', fontWeight: '700' },
  handoffCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  handoffUrgent: { borderWidth: 1.5, borderColor: colors.warning },
  handoffMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  handoffArrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handoffFrom: { ...typography.labelMedium, color: colors.textPrimary },
  handoffArrowIcon: { fontSize: 16, color: colors.textHint },
  handoffTo: { ...typography.labelMedium, color: colors.textPrimary },
  urgentBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { ...typography.labelSmall, color: colors.warning, fontWeight: '700', fontSize: 10 },
  handoffContent: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 22 },
  handoffTime: { ...typography.bodySmall, color: colors.textHint, marginTop: 10 },
});
