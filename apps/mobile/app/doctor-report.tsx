import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Types ──────────────────────────────────────────────────────────

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  adherence: number; // percentage
}

interface VitalReading {
  type: string;
  value: string;
  date: string;
  status: 'normal' | 'elevated' | 'low';
}

interface SymptomEntry {
  name: string;
  severity: number;
  frequency: string;
  lastOccurred: string;
}

interface MoodEntry {
  date: string;
  mood: 'GREAT' | 'GOOD' | 'OKAY' | 'LOW' | 'BAD';
  energy: number;
}

interface CareNote {
  date: string;
  author: string;
  note: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────

const now = new Date();
const fmt = (daysAgo: number) => {
  const d = new Date(now.getTime() - daysAgo * 86400000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const mockMedications: Medication[] = [
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', adherence: 94 },
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', adherence: 88 },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', adherence: 97 },
  { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', adherence: 72 },
  { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', adherence: 91 },
];

const mockVitals: VitalReading[] = [
  { type: 'Blood Pressure', value: '138/82 mmHg', date: fmt(1), status: 'elevated' },
  { type: 'Blood Pressure', value: '128/78 mmHg', date: fmt(3), status: 'normal' },
  { type: 'Heart Rate', value: '72 bpm', date: fmt(1), status: 'normal' },
  { type: 'Blood Glucose', value: '142 mg/dL', date: fmt(2), status: 'elevated' },
  { type: 'Blood Glucose', value: '118 mg/dL', date: fmt(5), status: 'normal' },
  { type: 'Weight', value: '168 lbs', date: fmt(0), status: 'normal' },
  { type: 'Temperature', value: '98.4°F', date: fmt(1), status: 'normal' },
  { type: 'Oxygen Saturation', value: '96%', date: fmt(1), status: 'normal' },
];

const mockSymptoms: SymptomEntry[] = [
  { name: 'Knee pain', severity: 3, frequency: '4x this period', lastOccurred: fmt(1) },
  { name: 'Dizziness', severity: 2, frequency: '2x this period', lastOccurred: fmt(3) },
  { name: 'Fatigue', severity: 3, frequency: '3x this period', lastOccurred: fmt(2) },
  { name: 'Insomnia', severity: 2, frequency: '2x this period', lastOccurred: fmt(5) },
  { name: 'Joint pain (hip)', severity: 4, frequency: '1x this period', lastOccurred: fmt(8) },
  { name: 'Confusion', severity: 2, frequency: '1x this period', lastOccurred: fmt(12) },
];

const mockMoodEntries: MoodEntry[] = [
  { date: fmt(0), mood: 'GOOD', energy: 7 },
  { date: fmt(1), mood: 'OKAY', energy: 5 },
  { date: fmt(2), mood: 'GOOD', energy: 6 },
  { date: fmt(3), mood: 'LOW', energy: 3 },
  { date: fmt(4), mood: 'OKAY', energy: 5 },
  { date: fmt(5), mood: 'GOOD', energy: 7 },
  { date: fmt(6), mood: 'GREAT', energy: 8 },
  { date: fmt(7), mood: 'GOOD', energy: 6 },
  { date: fmt(10), mood: 'OKAY', energy: 5 },
  { date: fmt(14), mood: 'GOOD', energy: 7 },
];

const mockCareNotes: CareNote[] = [
  { date: fmt(1), author: 'Sarah M.', note: 'Mom seemed more tired today. Took a longer nap in the afternoon. Ate well at dinner.' },
  { date: fmt(2), author: 'David M.', note: 'Good day overall. Went for a short walk around the block. Mentioned her knee was bothering her.' },
  { date: fmt(4), author: 'Sarah M.', note: 'Had a dizzy spell after standing up too quickly from the couch. Sat back down and it passed after a minute.' },
  { date: fmt(5), author: 'Maria (Aide)', note: 'Blood glucose was a bit high this morning. Made sure she ate a balanced breakfast. Reminded about medication.' },
  { date: fmt(7), author: 'David M.', note: 'Great spirits today! Played cards and laughed a lot. Slept well last night per her report.' },
];

const doctorInfo = {
  name: 'Dr. Patricia Chen',
  specialty: 'Internal Medicine / Geriatrics',
  phone: '(555) 234-5678',
  nextAppointment: 'April 15, 2026 at 10:30 AM',
};

// ─── Helpers ────────────────────────────────────────────────────────

const MOOD_EMOJI: Record<string, string> = {
  GREAT: '😊',
  GOOD: '🙂',
  OKAY: '😐',
  LOW: '😔',
  BAD: '😢',
};

const PERIODS = [7, 14, 30, 90] as const;

function getOverallAdherence(meds: Medication[]): number {
  if (meds.length === 0) return 0;
  return Math.round(meds.reduce((sum, m) => sum + m.adherence, 0) / meds.length);
}

function getMoodTrend(entries: MoodEntry[]): 'up' | 'down' | 'stable' {
  if (entries.length < 2) return 'stable';
  const moodScore: Record<string, number> = { GREAT: 5, GOOD: 4, OKAY: 3, LOW: 2, BAD: 1 };
  const firstHalf = entries.slice(Math.floor(entries.length / 2));
  const secondHalf = entries.slice(0, Math.floor(entries.length / 2));
  const avgFirst = firstHalf.reduce((s, e) => s + moodScore[e.mood], 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, e) => s + moodScore[e.mood], 0) / secondHalf.length;
  if (avgSecond - avgFirst > 0.3) return 'up';
  if (avgFirst - avgSecond > 0.3) return 'down';
  return 'stable';
}

function getStatusColor(status: string): string {
  if (status === 'elevated') return colors.warning;
  if (status === 'low') return colors.danger;
  return colors.success;
}

function getAdherenceColor(rate: number): string {
  if (rate >= 90) return colors.success;
  if (rate >= 75) return colors.warning;
  return colors.danger;
}

const severityLabels = ['', 'Mild', 'Moderate', 'Noticeable', 'Severe', 'Critical'];
const severityColors = ['', '#22C55E', '#F59E0B', '#F97316', '#EF4444', '#DC2626'];

// ─── Component ──────────────────────────────────────────────────────

export default function DoctorReportScreen() {
  const [days, setDays] = useState<number>(30);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    medications: true,
    vitals: true,
    symptoms: true,
    mood: false,
    notes: false,
    doctor: true,
  });
  const [talkingPoints, setTalkingPoints] = useState('');

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const overallAdherence = getOverallAdherence(mockMedications);
  const symptomCount = mockSymptoms.length;
  const moodTrend = getMoodTrend(mockMoodEntries);
  const trendArrow = moodTrend === 'up' ? '↑' : moodTrend === 'down' ? '↓' : '→';
  const trendColor = moodTrend === 'up' ? colors.success : moodTrend === 'down' ? colors.danger : colors.warning;

  const handleShare = async () => {
    const reportText = [
      `DOCTOR VISIT REPORT`,
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      `Period: Last ${days} days`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `DOCTOR: ${doctorInfo.name}`,
      `Specialty: ${doctorInfo.specialty}`,
      `Next Appointment: ${doctorInfo.nextAppointment}`,
      ``,
      `── SUMMARY ──`,
      `Medication Adherence: ${overallAdherence}%`,
      `Active Symptoms: ${symptomCount}`,
      `Mood Trend: ${moodTrend === 'up' ? 'Improving' : moodTrend === 'down' ? 'Declining' : 'Stable'}`,
      ``,
      `── CURRENT MEDICATIONS ──`,
      ...mockMedications.map((m) => `  ${m.name} ${m.dosage} (${m.frequency}) — ${m.adherence}% adherence`),
      ``,
      `── RECENT VITALS ──`,
      ...mockVitals.slice(0, 5).map((v) => `  ${v.type}: ${v.value} (${v.date}) ${v.status !== 'normal' ? `[${v.status.toUpperCase()}]` : ''}`),
      ``,
      `── SYMPTOMS LOG ──`,
      ...mockSymptoms.map((s) => `  ${s.name} — Severity: ${severityLabels[s.severity]}, ${s.frequency}, Last: ${s.lastOccurred}`),
      ``,
      `── MOOD TRENDS ──`,
      ...mockMoodEntries.slice(0, 7).map((m) => `  ${m.date}: ${m.mood} (Energy: ${m.energy}/10)`),
      ``,
      `── RECENT CARE NOTES ──`,
      ...mockCareNotes.slice(0, 3).map((n) => `  ${n.date} (${n.author}): ${n.note}`),
      talkingPoints ? `\n── TALKING POINTS ──\n${talkingPoints}` : '',
      ``,
      `Generated by Careo`,
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message: reportText, title: 'Doctor Visit Report' });
    } catch {
      // Share cancelled or failed
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print Report',
      'The report will be formatted as a PDF and sent to your printer.',
      [{ text: 'OK' }]
    );
  };

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
        <Text style={styles.heroEmoji}>📋</Text>
        <Text style={styles.heroTitle}>Doctor Visit Report</Text>
        <Text style={styles.heroSub}>One-tap care summary for your doctor</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Date Range Selector */}
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>REPORT PERIOD</Text>
          <View style={styles.periodToggle}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, days === p && styles.periodBtnActive]}
                onPress={() => setDays(p)}
              >
                <Text style={[styles.periodText, days === p && styles.periodTextActive]}>
                  {p}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>💊</Text>
            <Text style={[styles.badgeValue, { color: getAdherenceColor(overallAdherence) }]}>
              {overallAdherence}%
            </Text>
            <Text style={styles.badgeLabel}>Med Adherence</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>🩺</Text>
            <Text style={[styles.badgeValue, { color: colors.accent }]}>
              {symptomCount}
            </Text>
            <Text style={styles.badgeLabel}>Symptoms</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>😊</Text>
            <Text style={[styles.badgeValue, { color: trendColor }]}>
              {trendArrow}
            </Text>
            <Text style={styles.badgeLabel}>Mood Trend</Text>
          </View>
        </View>

        {/* Doctor Info Section */}
        <CollapsibleCard
          title="DOCTOR INFO"
          emoji="👨‍⚕️"
          expanded={expandedSections.doctor}
          onToggle={() => toggleSection('doctor')}
        >
          <View style={styles.doctorRow}>
            <Text style={styles.doctorName}>{doctorInfo.name}</Text>
            <Text style={styles.doctorSpecialty}>{doctorInfo.specialty}</Text>
            <Text style={styles.doctorPhone}>{doctorInfo.phone}</Text>
          </View>
          <View style={styles.appointmentBox}>
            <Text style={styles.appointmentLabel}>Next Appointment</Text>
            <Text style={styles.appointmentDate}>{doctorInfo.nextAppointment}</Text>
          </View>
        </CollapsibleCard>

        {/* Current Medications */}
        <CollapsibleCard
          title="CURRENT MEDICATIONS"
          emoji="💊"
          expanded={expandedSections.medications}
          onToggle={() => toggleSection('medications')}
        >
          {mockMedications.map((med, i) => (
            <View key={i} style={[styles.medItem, i < mockMedications.length - 1 && styles.medItemBorder]}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDetail}>{med.dosage} — {med.frequency}</Text>
              </View>
              <View style={styles.medAdherence}>
                <Text style={[styles.medAdherenceValue, { color: getAdherenceColor(med.adherence) }]}>
                  {med.adherence}%
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.medSummary}>
            <Text style={styles.medSummaryLabel}>Overall Adherence</Text>
            <View style={styles.adherenceBar}>
              <View style={[styles.adherenceFill, { width: `${overallAdherence}%`, backgroundColor: getAdherenceColor(overallAdherence) }]} />
            </View>
            <Text style={[styles.medSummaryValue, { color: getAdherenceColor(overallAdherence) }]}>
              {overallAdherence}%
            </Text>
          </View>
        </CollapsibleCard>

        {/* Recent Vitals */}
        <CollapsibleCard
          title="RECENT VITALS"
          emoji="📊"
          expanded={expandedSections.vitals}
          onToggle={() => toggleSection('vitals')}
        >
          {mockVitals.map((vital, i) => (
            <View key={i} style={[styles.vitalItem, i < mockVitals.length - 1 && styles.vitalItemBorder]}>
              <View style={styles.vitalInfo}>
                <Text style={styles.vitalType}>{vital.type}</Text>
                <Text style={styles.vitalDate}>{vital.date}</Text>
              </View>
              <View style={styles.vitalValueWrap}>
                <Text style={styles.vitalValue}>{vital.value}</Text>
                {vital.status !== 'normal' && (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vital.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(vital.status) }]}>
                      {vital.status.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </CollapsibleCard>

        {/* Symptoms Log */}
        <CollapsibleCard
          title="SYMPTOMS LOG"
          emoji="🩹"
          expanded={expandedSections.symptoms}
          onToggle={() => toggleSection('symptoms')}
        >
          {mockSymptoms.map((symptom, i) => (
            <View key={i} style={[styles.symptomItem, i < mockSymptoms.length - 1 && styles.symptomItemBorder]}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomName}>{symptom.name}</Text>
                <View style={[styles.severityBadge, { backgroundColor: severityColors[symptom.severity] + '20' }]}>
                  <Text style={[styles.severityText, { color: severityColors[symptom.severity] }]}>
                    {severityLabels[symptom.severity]}
                  </Text>
                </View>
              </View>
              <View style={styles.symptomMeta}>
                <Text style={styles.symptomFreq}>{symptom.frequency}</Text>
                <Text style={styles.symptomDot}>·</Text>
                <Text style={styles.symptomLast}>Last: {symptom.lastOccurred}</Text>
              </View>
            </View>
          ))}
        </CollapsibleCard>

        {/* Mood Trends */}
        <CollapsibleCard
          title="MOOD TRENDS"
          emoji="😊"
          expanded={expandedSections.mood}
          onToggle={() => toggleSection('mood')}
        >
          <View style={styles.moodSummaryRow}>
            <Text style={styles.moodTrendLabel}>
              Trend: {moodTrend === 'up' ? 'Improving' : moodTrend === 'down' ? 'Declining' : 'Stable'}
            </Text>
            <Text style={[styles.moodTrendArrow, { color: trendColor }]}>{trendArrow}</Text>
          </View>
          {mockMoodEntries.slice(0, 7).map((entry, i) => (
            <View key={i} style={styles.moodItem}>
              <Text style={styles.moodDate}>{entry.date}</Text>
              <Text style={styles.moodEmoji}>{MOOD_EMOJI[entry.mood]}</Text>
              <Text style={styles.moodLabel}>{entry.mood}</Text>
              <View style={styles.energyBar}>
                <View style={[styles.energyFill, { width: `${entry.energy * 10}%` }]} />
              </View>
              <Text style={styles.energyText}>{entry.energy}/10</Text>
            </View>
          ))}
        </CollapsibleCard>

        {/* Recent Care Notes */}
        <CollapsibleCard
          title="RECENT CARE NOTES"
          emoji="📝"
          expanded={expandedSections.notes}
          onToggle={() => toggleSection('notes')}
        >
          {mockCareNotes.map((note, i) => (
            <View key={i} style={[styles.noteItem, i < mockCareNotes.length - 1 && styles.noteItemBorder]}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteAuthor}>{note.author}</Text>
                <Text style={styles.noteDate}>{note.date}</Text>
              </View>
              <Text style={styles.noteText}>{note.note}</Text>
            </View>
          ))}
        </CollapsibleCard>

        {/* Talking Points */}
        <View style={styles.talkingSection}>
          <Text style={styles.sectionLabel}>📌 TALKING POINTS</Text>
          <View style={styles.card}>
            <Text style={styles.talkingHint}>
              Add notes or questions you want to discuss with the doctor
            </Text>
            <TextInput
              style={styles.talkingInput}
              value={talkingPoints}
              onChangeText={setTalkingPoints}
              placeholder="e.g. Ask about knee pain getting worse, discuss blood pressure medication adjustment..."
              placeholderTextColor={colors.textHint}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share report"
          >
            <Text style={styles.shareBtnEmoji}>📤</Text>
            <Text style={styles.shareBtnText}>Share Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            accessibilityRole="button"
            accessibilityLabel="Print report"
          >
            <Text style={styles.printBtnEmoji}>🖨️</Text>
            <Text style={styles.printBtnText}>Print Report</Text>
          </TouchableOpacity>
        </View>

        {/* Report Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>👁️ REPORT PREVIEW</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Careo Care Report</Text>
              <Text style={styles.previewDate}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <Text style={styles.previewPeriod}>Period: Last {days} days</Text>
            </View>
            <View style={styles.previewDivider} />
            <Text style={styles.previewSectionTitle}>Patient Summary</Text>
            <Text style={styles.previewBody}>
              Medication adherence at {overallAdherence}% across {mockMedications.length} medications.{' '}
              {symptomCount} active symptoms tracked, with knee pain and fatigue being most frequent.{' '}
              Mood trend is {moodTrend === 'up' ? 'improving' : moodTrend === 'down' ? 'declining' : 'stable'} over this period.
            </Text>
            <View style={styles.previewDivider} />
            <Text style={styles.previewSectionTitle}>Key Observations</Text>
            <Text style={styles.previewBody}>
              {'\u2022'} Blood pressure slightly elevated on {fmt(1)} (138/82 mmHg){'\n'}
              {'\u2022'} Blood glucose reading of 142 mg/dL on {fmt(2)}{'\n'}
              {'\u2022'} Recurring knee pain — 4 occurrences this period{'\n'}
              {'\u2022'} Dizzy spell reported after standing quickly{'\n'}
              {'\u2022'} Sleep disturbance noted (insomnia 2x)
            </Text>
            <View style={styles.previewDivider} />
            <Text style={styles.previewFooter}>
              Generated by Careo — Comprehensive Elder Care Management
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Collapsible Card Component ─────────────────────────────────────

function CollapsibleCard({
  title,
  emoji,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  emoji: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.cardSection}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.cardHeaderEmoji}>{emoji}</Text>
        <Text style={styles.sectionLabel}>{title}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.card}>{children}</View>}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero
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

  scroll: { flex: 1 },

  // Period Selector
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  periodLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { ...typography.labelSmall, color: colors.textHint },
  periodTextActive: { color: '#fff', fontWeight: '700' },

  // Summary Badges
  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  badge: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeEmoji: { fontSize: 22, marginBottom: 4 },
  badgeValue: { ...typography.displaySmall, marginBottom: 2 },
  badgeLabel: { ...typography.labelSmall, color: colors.textHint },

  // Cards
  cardSection: { paddingHorizontal: 20, marginTop: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderEmoji: { fontSize: 16, marginRight: 8 },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    fontWeight: '700',
    flex: 1,
  },
  chevron: { ...typography.labelSmall, color: colors.textHint, fontSize: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Doctor Info
  doctorRow: { marginBottom: 14 },
  doctorName: { ...typography.headingLarge, color: colors.textPrimary, marginBottom: 2 },
  doctorSpecialty: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: 2 },
  doctorPhone: { ...typography.bodySmall, color: colors.primary },
  appointmentBox: {
    backgroundColor: colors.tintAppt,
    borderRadius: 12,
    padding: 14,
  },
  appointmentLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1, marginBottom: 4 },
  appointmentDate: { ...typography.headingSmall, color: colors.textPrimary },

  // Medications
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  medItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  medInfo: { flex: 1 },
  medName: { ...typography.headingSmall, color: colors.textPrimary },
  medDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  medAdherence: { alignItems: 'flex-end' },
  medAdherenceValue: { ...typography.headingMedium, fontWeight: '700' },
  medSummary: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.divider },
  medSummaryLabel: { ...typography.labelSmall, color: colors.textHint, marginBottom: 8 },
  medSummaryValue: { ...typography.labelMedium, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  adherenceBar: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  adherenceFill: { height: '100%', borderRadius: 4 },

  // Vitals
  vitalItem: { paddingVertical: 10 },
  vitalItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  vitalInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  vitalType: { ...typography.headingSmall, color: colors.textPrimary },
  vitalDate: { ...typography.bodySmall, color: colors.textHint },
  vitalValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vitalValue: { ...typography.bodyMedium, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },

  // Symptoms
  symptomItem: { paddingVertical: 10 },
  symptomItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  symptomName: { ...typography.headingSmall, color: colors.textPrimary },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  severityText: { ...typography.labelSmall, fontWeight: '700' },
  symptomMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  symptomFreq: { ...typography.bodySmall, color: colors.textSecondary },
  symptomDot: { ...typography.bodySmall, color: colors.textHint },
  symptomLast: { ...typography.bodySmall, color: colors.textHint },

  // Mood
  moodSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  moodTrendLabel: { ...typography.headingSmall, color: colors.textPrimary },
  moodTrendArrow: { fontSize: 24, fontWeight: '700' },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  moodDate: { ...typography.bodySmall, color: colors.textSecondary, width: 50 },
  moodEmoji: { fontSize: 18 },
  moodLabel: { ...typography.bodySmall, color: colors.textPrimary, width: 44 },
  energyBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  energyText: { ...typography.labelSmall, color: colors.textHint, width: 30, textAlign: 'right' },

  // Care Notes
  noteItem: { paddingVertical: 10 },
  noteItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteAuthor: { ...typography.headingSmall, color: colors.textPrimary },
  noteDate: { ...typography.bodySmall, color: colors.textHint },
  noteText: { ...typography.bodyMedium, color: colors.textSecondary, lineHeight: 22 },

  // Talking Points
  talkingSection: { paddingHorizontal: 20, marginTop: 16 },
  talkingHint: { ...typography.bodySmall, color: colors.textHint, marginBottom: 10 },
  talkingInput: {
    ...typography.bodyMedium,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    color: colors.textPrimary,
  },

  // Actions
  actions: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnEmoji: { fontSize: 18 },
  shareBtnText: { ...typography.button, color: '#fff', fontSize: 17 },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  printBtnEmoji: { fontSize: 18 },
  printBtnText: { ...typography.button, color: colors.textSecondary },

  // Report Preview
  previewSection: { paddingHorizontal: 20, marginTop: 24 },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  previewHeader: { alignItems: 'center', marginBottom: 8 },
  previewTitle: { ...typography.headingLarge, color: colors.primary, marginBottom: 4 },
  previewDate: { ...typography.bodySmall, color: colors.textSecondary },
  previewPeriod: { ...typography.labelSmall, color: colors.textHint, marginTop: 2 },
  previewDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },
  previewSectionTitle: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
  },
  previewBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  previewFooter: {
    ...typography.labelSmall,
    color: colors.textHint,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
