import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Types ─────────────────────────────────────────────────────────
interface Symptom {
  id: string;
  name: string;
  severity: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
  notes?: string;
  triggers?: string[];
}

// ─── Symptom Categories ────────────────────────────────────────────
const symptomCategories = [
  {
    category: 'Pain',
    emoji: '🤕',
    symptoms: ['Headache', 'Back pain', 'Joint pain', 'Chest pain', 'Stomach pain', 'Knee pain'],
  },
  {
    category: 'Digestive',
    emoji: '🤢',
    symptoms: ['Nausea', 'Loss of appetite', 'Bloating', 'Constipation', 'Diarrhea'],
  },
  {
    category: 'Neurological',
    emoji: '🧠',
    symptoms: ['Dizziness', 'Confusion', 'Memory issues', 'Numbness', 'Tremors', 'Difficulty speaking'],
  },
  {
    category: 'Respiratory',
    emoji: '🫁',
    symptoms: ['Shortness of breath', 'Coughing', 'Wheezing', 'Chest tightness'],
  },
  {
    category: 'Emotional',
    emoji: '😔',
    symptoms: ['Anxiety', 'Depression', 'Irritability', 'Insomnia', 'Fatigue'],
  },
  {
    category: 'Other',
    emoji: '📋',
    symptoms: ['Swelling', 'Rash', 'Fever', 'Vision changes', 'Hearing changes', 'Falls'],
  },
];

const severityLabels = ['', 'Mild', 'Moderate', 'Noticeable', 'Severe', 'Critical'];
const severityColors = ['', '#22C55E', '#F59E0B', '#F97316', '#EF4444', '#DC2626'];
const severityEmojis = ['', '🟢', '🟡', '🟠', '🔴', '⚫'];

// ─── Demo Data ─────────────────────────────────────────────────────
const now = new Date();
const demoSymptoms: Symptom[] = [
  { id: '1', name: 'Knee pain', severity: 3, timestamp: new Date(now.getTime() - 3600000).toISOString(), notes: 'After walking to mailbox', triggers: ['Walking', 'Stairs'] },
  { id: '2', name: 'Dizziness', severity: 2, timestamp: new Date(now.getTime() - 7200000).toISOString(), notes: 'Brief episode after standing up quickly' },
  { id: '3', name: 'Fatigue', severity: 3, timestamp: new Date(now.getTime() - 86400000).toISOString(), notes: 'More tired than usual all day' },
  { id: '4', name: 'Joint pain', severity: 4, timestamp: new Date(now.getTime() - 86400000 * 2).toISOString(), notes: 'Right hip pain', triggers: ['Morning', 'Cold weather'] },
  { id: '5', name: 'Headache', severity: 2, timestamp: new Date(now.getTime() - 86400000 * 2).toISOString() },
  { id: '6', name: 'Insomnia', severity: 3, timestamp: new Date(now.getTime() - 86400000 * 3).toISOString(), notes: 'Woke up at 3am, couldn\'t go back to sleep' },
  { id: '7', name: 'Loss of appetite', severity: 2, timestamp: new Date(now.getTime() - 86400000 * 3).toISOString() },
  { id: '8', name: 'Knee pain', severity: 2, timestamp: new Date(now.getTime() - 86400000 * 4).toISOString(), triggers: ['Stairs'] },
  { id: '9', name: 'Confusion', severity: 2, timestamp: new Date(now.getTime() - 86400000 * 5).toISOString(), notes: 'Forgot where she put her glasses' },
  { id: '10', name: 'Knee pain', severity: 4, timestamp: new Date(now.getTime() - 86400000 * 6).toISOString(), notes: 'Severe after fall', triggers: ['Fall'] },
  { id: '11', name: 'Anxiety', severity: 3, timestamp: new Date(now.getTime() - 86400000 * 7).toISOString(), notes: 'Worried about upcoming doctor visit' },
  { id: '12', name: 'Shortness of breath', severity: 2, timestamp: new Date(now.getTime() - 86400000 * 7).toISOString() },
];

// ─── Component ─────────────────────────────────────────────────────
export default function SymptomsScreen() {
  const [view, setView] = useState<'log' | 'history' | 'patterns'>('history');
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<number>(0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Pattern analysis
  const symptomFrequency: Record<string, { count: number; avgSeverity: number; trend: 'up' | 'down' | 'stable' }> = {};
  for (const s of demoSymptoms) {
    if (!symptomFrequency[s.name]) {
      symptomFrequency[s.name] = { count: 0, avgSeverity: 0, trend: 'stable' };
    }
    symptomFrequency[s.name].count++;
    symptomFrequency[s.name].avgSeverity += s.severity;
  }
  for (const key of Object.keys(symptomFrequency)) {
    symptomFrequency[key].avgSeverity = Math.round((symptomFrequency[key].avgSeverity / symptomFrequency[key].count) * 10) / 10;
    // Simple trend: compare first and last occurrence severity
    const occurrences = demoSymptoms.filter((s) => s.name === key).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (occurrences.length > 1) {
      const first = occurrences[0].severity;
      const last = occurrences[occurrences.length - 1].severity;
      symptomFrequency[key].trend = last > first ? 'up' : last < first ? 'down' : 'stable';
    }
  }

  const topSymptoms = Object.entries(symptomFrequency)
    .sort(([, a], [, b]) => b.count - a.count);

  // Common triggers
  const triggerMap: Record<string, number> = {};
  for (const s of demoSymptoms) {
    for (const t of s.triggers || []) {
      triggerMap[t] = (triggerMap[t] || 0) + 1;
    }
  }
  const topTriggers = Object.entries(triggerMap).sort(([, a], [, b]) => b - a);

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
        <Text style={styles.heroEmoji}>🩺</Text>
        <Text style={styles.heroTitle}>Symptom Tracker</Text>
        <Text style={styles.heroSub}>Track, analyze, and share with doctors</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        {(['log', 'history', 'patterns'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, view === v && styles.toggleActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
              {v === 'log' ? 'Log New' : v === 'history' ? 'History' : 'Patterns'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {view === 'log' && (
          <>
            {/* Quick Log */}
            {!selectedSymptom ? (
              <>
                <Text style={styles.logPrompt}>What symptom are you logging?</Text>
                {symptomCategories.map((cat) => (
                  <View key={cat.category}>
                    <Text style={styles.catHeader}>{cat.emoji} {cat.category}</Text>
                    <View style={styles.symptomGrid}>
                      {cat.symptoms.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={styles.symptomChip}
                          onPress={() => setSelectedSymptom(s)}
                        >
                          <Text style={styles.symptomChipText}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => { setSelectedSymptom(null); setSelectedSeverity(0); }} style={styles.changeSymptom}>
                  <Text style={styles.changeText}>{'\u2190'} Change symptom</Text>
                </TouchableOpacity>
                <Text style={styles.selectedSymptomLabel}>{selectedSymptom}</Text>

                <Text style={styles.severityLabel}>How severe?</Text>
                <View style={styles.severityRow}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.severityBtn,
                        selectedSeverity === level && { backgroundColor: severityColors[level], borderColor: severityColors[level] },
                      ]}
                      onPress={() => setSelectedSeverity(level)}
                    >
                      <Text style={[styles.severityEmoji, selectedSeverity === level && { opacity: 1 }]}>{severityEmojis[level]}</Text>
                      <Text style={[styles.severityText, selectedSeverity === level && { color: '#fff' }]}>{severityLabels[level]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.notesLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="When did it start? What makes it better/worse?"
                  placeholderTextColor={colors.textHint}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.notesLabel}>Possible triggers</Text>
                <View style={styles.triggerGrid}>
                  {['Walking', 'Stairs', 'Eating', 'Morning', 'Evening', 'Stress', 'Weather', 'Medication', 'Exercise', 'Sitting'].map((t) => (
                    <TouchableOpacity key={t} style={styles.triggerChip}>
                      <Text style={styles.triggerChipText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} disabled={selectedSeverity === 0}>
                  <Text style={styles.saveBtnText}>Save Symptom Log</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {view === 'history' && (
          <>
            <View style={styles.histSummary}>
              <View style={styles.histStat}>
                <Text style={styles.histStatNum}>{demoSymptoms.length}</Text>
                <Text style={styles.histStatLabel}>Logged</Text>
              </View>
              <View style={styles.histStatDiv} />
              <View style={styles.histStat}>
                <Text style={[styles.histStatNum, { color: colors.danger }]}>
                  {demoSymptoms.filter((s) => s.severity >= 4).length}
                </Text>
                <Text style={styles.histStatLabel}>Severe</Text>
              </View>
              <View style={styles.histStatDiv} />
              <View style={styles.histStat}>
                <Text style={[styles.histStatNum, { color: colors.primary }]}>
                  {new Set(demoSymptoms.map((s) => s.name)).size}
                </Text>
                <Text style={styles.histStatLabel}>Types</Text>
              </View>
            </View>

            {demoSymptoms.map((s, i) => (
              <View key={s.id} style={[styles.histCard, i < demoSymptoms.length - 1 && { marginBottom: 8 }]}>
                <View style={styles.histHeader}>
                  <View style={[styles.histSevDot, { backgroundColor: severityColors[s.severity] }]} />
                  <View style={styles.histInfo}>
                    <Text style={styles.histName}>{s.name}</Text>
                    {s.notes && <Text style={styles.histNotes}>{s.notes}</Text>}
                    {s.triggers && s.triggers.length > 0 && (
                      <View style={styles.histTriggers}>
                        {s.triggers.map((t) => (
                          <View key={t} style={styles.histTriggerPill}>
                            <Text style={styles.histTriggerText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.histRight}>
                    <View style={[styles.sevBadge, { backgroundColor: severityColors[s.severity] + '20' }]}>
                      <Text style={[styles.sevBadgeText, { color: severityColors[s.severity] }]}>{severityLabels[s.severity]}</Text>
                    </View>
                    <Text style={styles.histDate}>{formatDate(s.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.shareBtn}>
              <Text style={styles.shareBtnEmoji}>📄</Text>
              <Text style={styles.shareBtnText}>Export Report for Doctor</Text>
            </TouchableOpacity>
          </>
        )}

        {view === 'patterns' && (
          <>
            {/* AI Insights */}
            <View style={styles.insightCard}>
              <Text style={styles.insightEmoji}>🤖</Text>
              <Text style={styles.insightTitle}>AI Pattern Analysis</Text>
              <View style={styles.insightBullet}>
                <Text style={styles.insightDot}>{'•'}</Text>
                <Text style={styles.insightText}>
                  <Text style={{ fontWeight: '700' }}>Knee pain</Text> is the most frequent symptom ({symptomFrequency['Knee pain']?.count || 0} occurrences). Severity has been <Text style={{ color: colors.success, fontWeight: '600' }}>decreasing</Text> over time — physical therapy may be helping.
                </Text>
              </View>
              <View style={styles.insightBullet}>
                <Text style={styles.insightDot}>{'•'}</Text>
                <Text style={styles.insightText}>
                  <Text style={{ fontWeight: '700' }}>Dizziness</Text> episodes correlate with mornings — could be related to blood pressure medication timing. Discuss with Dr. Patel.
                </Text>
              </View>
              <View style={styles.insightBullet}>
                <Text style={styles.insightDot}>{'•'}</Text>
                <Text style={styles.insightText}>
                  <Text style={{ fontWeight: '700' }}>Fatigue + insomnia</Text> appeared in the same 48-hour window. Sleep quality may need attention.
                </Text>
              </View>
            </View>

            {/* Frequency Chart */}
            <Text style={styles.patternLabel}>MOST FREQUENT</Text>
            {topSymptoms.map(([name, data]) => (
              <View key={name} style={styles.freqRow}>
                <Text style={styles.freqName}>{name}</Text>
                <View style={styles.freqBarBg}>
                  <View style={[styles.freqBarFill, { width: `${(data.count / topSymptoms[0][1].count) * 100}%`, backgroundColor: severityColors[Math.round(data.avgSeverity)] }]} />
                </View>
                <Text style={styles.freqCount}>{data.count}x</Text>
                <Text style={styles.freqTrend}>
                  {data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'}
                </Text>
              </View>
            ))}

            {/* Triggers */}
            {topTriggers.length > 0 && (
              <>
                <Text style={[styles.patternLabel, { marginTop: 24 }]}>COMMON TRIGGERS</Text>
                <View style={styles.triggerAnalysis}>
                  {topTriggers.map(([trigger, count]) => (
                    <View key={trigger} style={styles.triggerItem}>
                      <Text style={styles.triggerItemText}>{trigger}</Text>
                      <Text style={styles.triggerItemCount}>{count}x</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Severity Over Time */}
            <Text style={[styles.patternLabel, { marginTop: 24 }]}>SEVERITY OVER 7 DAYS</Text>
            <View style={styles.severityTimeline}>
              {Array.from({ length: 7 }).map((_, i) => {
                const dayDate = new Date(now);
                dayDate.setDate(dayDate.getDate() - (6 - i));
                const daySymptoms = demoSymptoms.filter((s) => new Date(s.timestamp).toDateString() === dayDate.toDateString());
                const maxSev = daySymptoms.length > 0 ? Math.max(...daySymptoms.map((s) => s.severity)) : 0;
                return (
                  <View key={i} style={styles.sevTimeCol}>
                    <View style={styles.sevTimeDots}>
                      {[5, 4, 3, 2, 1].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.sevTimeDot,
                            maxSev >= level && { backgroundColor: severityColors[level], opacity: 1 },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.sevTimeDay}>
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                    </Text>
                    <Text style={styles.sevTimeCount}>{daySymptoms.length}</Text>
                  </View>
                );
              })}
            </View>
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
  toggleRow: { flexDirection: 'row', marginHorizontal: 18, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.divider },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { ...typography.labelMedium, color: colors.textHint },
  toggleTextActive: { color: '#fff', fontWeight: '700' },

  scroll: { flex: 1, paddingTop: 16 },

  // Log
  logPrompt: { ...typography.headingMedium, color: colors.textPrimary, paddingHorizontal: 18, marginBottom: 16 },
  catHeader: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1, fontWeight: '700', paddingHorizontal: 18, marginTop: 16, marginBottom: 10 },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 8 },
  symptomChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.divider },
  symptomChipText: { ...typography.labelMedium, color: colors.textPrimary },

  changeSymptom: { paddingHorizontal: 18, marginBottom: 8 },
  changeText: { ...typography.labelMedium, color: colors.primary },
  selectedSymptomLabel: { ...typography.displaySmall, color: colors.textPrimary, paddingHorizontal: 18, marginBottom: 24 },

  severityLabel: { ...typography.headingSmall, color: colors.textPrimary, paddingHorizontal: 18, marginBottom: 12 },
  severityRow: { flexDirection: 'row', paddingHorizontal: 18, gap: 8, marginBottom: 24 },
  severityBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.divider },
  severityEmoji: { fontSize: 20, opacity: 0.4, marginBottom: 4 },
  severityText: { ...typography.labelSmall, color: colors.textHint, fontSize: 10 },

  notesLabel: { ...typography.headingSmall, color: colors.textPrimary, paddingHorizontal: 18, marginBottom: 10 },
  notesInput: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, ...typography.bodyMedium, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },

  triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 8, marginBottom: 24 },
  triggerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.tintAppt, borderWidth: 1, borderColor: colors.divider },
  triggerChipText: { ...typography.labelSmall, color: colors.textSecondary },

  saveBtn: { marginHorizontal: 18, paddingVertical: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { ...typography.labelLarge, color: '#fff', fontWeight: '700' },

  // History
  histSummary: { flexDirection: 'row', marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  histStat: { flex: 1, alignItems: 'center' },
  histStatNum: { ...typography.headingMedium, color: colors.primary },
  histStatLabel: { ...typography.labelSmall, color: colors.textHint, marginTop: 4 },
  histStatDiv: { width: 1, backgroundColor: colors.divider },

  histCard: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  histHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  histSevDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  histInfo: { flex: 1 },
  histName: { ...typography.headingSmall, color: colors.textPrimary },
  histNotes: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  histTriggers: { flexDirection: 'row', gap: 6, marginTop: 6 },
  histTriggerPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.tintAppt },
  histTriggerText: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 10 },
  histRight: { alignItems: 'flex-end' },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sevBadgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
  histDate: { ...typography.bodySmall, color: colors.textHint, marginTop: 4, fontSize: 11 },

  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 18, marginTop: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary, gap: 8 },
  shareBtnEmoji: { fontSize: 18 },
  shareBtnText: { ...typography.labelLarge, color: '#fff', fontWeight: '700' },

  // Patterns
  insightCard: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.primaryLight },
  insightEmoji: { fontSize: 28, marginBottom: 8 },
  insightTitle: { ...typography.headingMedium, color: colors.primary, marginBottom: 14 },
  insightBullet: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  insightDot: { fontSize: 16, color: colors.primary, marginTop: 1 },
  insightText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, lineHeight: 22 },

  patternLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, fontWeight: '700', fontSize: 11, paddingHorizontal: 18, marginBottom: 12 },
  freqRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, gap: 10 },
  freqName: { ...typography.labelMedium, color: colors.textPrimary, width: 100 },
  freqBarBg: { flex: 1, height: 10, backgroundColor: colors.divider, borderRadius: 5, overflow: 'hidden' },
  freqBarFill: { height: '100%', borderRadius: 5 },
  freqCount: { ...typography.labelSmall, color: colors.textHint, width: 24, textAlign: 'right' },
  freqTrend: { fontSize: 16, width: 20, textAlign: 'center' },

  triggerAnalysis: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 8 },
  triggerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#fff', gap: 8, borderWidth: 1, borderColor: colors.divider },
  triggerItemText: { ...typography.labelMedium, color: colors.textPrimary },
  triggerItemCount: { ...typography.labelSmall, color: colors.primary, fontWeight: '700' },

  severityTimeline: { flexDirection: 'row', marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 6 },
  sevTimeCol: { flex: 1, alignItems: 'center' },
  sevTimeDots: { gap: 4, marginBottom: 8 },
  sevTimeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.divider, opacity: 0.3 },
  sevTimeDay: { ...typography.labelSmall, color: colors.textHint, fontSize: 10 },
  sevTimeCount: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 10, marginTop: 2 },
});
