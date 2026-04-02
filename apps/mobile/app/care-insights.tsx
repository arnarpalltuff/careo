import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { insightsService, InsightsData } from '../services/insights';
import { Spinner } from '../components/ui/Spinner';

const MOOD_EMOJI: Record<string, string> = { GREAT: '😊', GOOD: '🙂', OKAY: '😐', LOW: '😔', BAD: '😢' };
const PERIODS = [7, 14, 30] as const;

export default function CareInsightsScreen() {
  const { activeCircleId, getActiveCircle } = useCircleStore();
  const activeCircle = getActiveCircle();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    if (!activeCircleId) {
      setLoading(false);
      setError('No care circle selected');
      return;
    }
    setLoading(true);
    insightsService.get(activeCircleId, days)
      .then(setData)
      .catch(() => setError('Could not load insights'))
      .finally(() => setLoading(false));
  }, [activeCircleId, days]);

  if (loading) return <Spinner />;

  return (
    <>
      <Stack.Screen options={{ title: 'Care Insights', headerShown: true }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {activeCircle ? `${activeCircle.careRecipient}'s Care` : 'Care Insights'}
          </Text>
          <View style={styles.periodToggle}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, days === p && styles.periodBtnActive]}
                onPress={() => setDays(p)}
              >
                <Text style={[styles.periodText, days === p && styles.periodTextActive]}>{p}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : data ? (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <StatCard
                emoji="💊"
                label="Med Adherence"
                value={data.medications.adherenceRate !== null ? `${data.medications.adherenceRate}%` : '—'}
                color={getAdherenceColor(data.medications.adherenceRate)}
              />
              <StatCard
                emoji="✅"
                label="Tasks Done"
                value={data.tasks.completionRate !== null ? `${data.tasks.completionRate}%` : '—'}
                color={getAdherenceColor(data.tasks.completionRate)}
              />
            </View>
            <View style={styles.summaryRow}>
              <StatCard
                emoji={getMoodEmoji(data.mood.averageScore)}
                label="Avg Mood"
                value={data.mood.averageScore !== null ? `${data.mood.averageScore}/5` : '—'}
                color={colors.primary}
              />
              <StatCard
                emoji="📅"
                label="Appointments"
                value={`${data.appointments.completed}/${data.appointments.total}`}
                color={colors.accent}
              />
            </View>

            {/* Medication breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medication Details</Text>
              <View style={styles.card}>
                <View style={styles.medRow}>
                  <View style={[styles.medDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.medLabel}>Taken</Text>
                  <Text style={styles.medValue}>{data.medications.takenDoses}</Text>
                </View>
                <View style={styles.medRow}>
                  <View style={[styles.medDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.medLabel}>Missed</Text>
                  <Text style={styles.medValue}>{data.medications.missedDoses}</Text>
                </View>
                <View style={styles.medRow}>
                  <View style={[styles.medDot, { backgroundColor: colors.warning }]} />
                  <Text style={styles.medLabel}>Skipped</Text>
                  <Text style={styles.medValue}>{data.medications.skippedDoses}</Text>
                </View>
                {/* Simple bar chart */}
                {data.medications.totalDoses > 0 && (
                  <View style={styles.barChart}>
                    <View style={[styles.bar, styles.barTaken, { flex: data.medications.takenDoses || 0.01 }]} />
                    <View style={[styles.bar, styles.barMissed, { flex: data.medications.missedDoses || 0.01 }]} />
                    <View style={[styles.bar, styles.barSkipped, { flex: data.medications.skippedDoses || 0.01 }]} />
                  </View>
                )}
              </View>
            </View>

            {/* Weekly adherence */}
            {data.medications.weeklyAdherence.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weekly Adherence</Text>
                <View style={styles.card}>
                  {data.medications.weeklyAdherence.map((w, i) => (
                    <View key={i} style={styles.weekRow}>
                      <Text style={styles.weekLabel}>
                        {new Date(w.week + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                      <View style={styles.weekBarBg}>
                        <View style={[styles.weekBarFill, { width: `${w.rate}%`, backgroundColor: getAdherenceColor(w.rate) }]} />
                      </View>
                      <Text style={styles.weekRate}>{w.rate}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Mood timeline */}
            {data.mood.trend.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mood Timeline</Text>
                <View style={styles.card}>
                  {data.mood.trend.slice(-10).map((m, i) => (
                    <View key={i} style={styles.moodRow}>
                      <Text style={styles.moodDate}>
                        {new Date(m.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.moodEmoji}>{MOOD_EMOJI[m.mood] || '😐'}</Text>
                      <Text style={styles.moodLabel}>{m.mood}</Text>
                      {m.energy !== null && (
                        <Text style={styles.moodExtra}>Energy: {m.energy}/10</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Circle info */}
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.circleInfo}>
                  <Text style={styles.circleEmoji}>👥</Text>
                  <Text style={styles.circleText}>
                    {data.circle.memberCount} team member{data.circle.memberCount !== 1 ? 's' : ''} in this circle
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getAdherenceColor(rate: number | null): string {
  if (rate === null) return colors.textHint;
  if (rate >= 80) return colors.success;
  if (rate >= 60) return colors.warning;
  return colors.danger;
}

function getMoodEmoji(score: number | null): string {
  if (score === null) return '😐';
  if (score >= 4.5) return '😊';
  if (score >= 3.5) return '🙂';
  if (score >= 2.5) return '😐';
  if (score >= 1.5) return '😔';
  return '😢';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.headingLarge, color: colors.textPrimary },
  periodToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.divider },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { ...typography.labelSmall, color: colors.textHint },
  periodTextActive: { color: '#fff', fontWeight: '700' },

  errorBox: { margin: 20, padding: 16, backgroundColor: '#FEE2E2', borderRadius: 14 },
  errorText: { ...typography.bodyMedium, color: colors.danger, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: colors.divider,
  },
  statEmoji: { fontSize: 28, marginBottom: 6 },
  statValue: { ...typography.displaySmall, marginBottom: 2 },
  statLabel: { ...typography.labelSmall, color: colors.textHint },

  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { ...typography.labelMedium, color: colors.textHint, letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.divider },

  medRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  medDot: { width: 10, height: 10, borderRadius: 5 },
  medLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  medValue: { ...typography.headingSmall, color: colors.textPrimary },

  barChart: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 6 },
  bar: { height: '100%' },
  barTaken: { backgroundColor: colors.success },
  barMissed: { backgroundColor: colors.danger },
  barSkipped: { backgroundColor: colors.warning },

  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  weekLabel: { ...typography.bodySmall, color: colors.textSecondary, width: 50 },
  weekBarBg: { flex: 1, height: 8, backgroundColor: colors.divider, borderRadius: 4, overflow: 'hidden' },
  weekBarFill: { height: '100%', borderRadius: 4 },
  weekRate: { ...typography.labelSmall, color: colors.textHint, width: 36, textAlign: 'right' },

  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  moodDate: { ...typography.bodySmall, color: colors.textSecondary, width: 50 },
  moodEmoji: { fontSize: 20 },
  moodLabel: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  moodExtra: { ...typography.labelSmall, color: colors.textHint },

  circleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circleEmoji: { fontSize: 22 },
  circleText: { ...typography.bodyMedium, color: colors.textSecondary },
});
