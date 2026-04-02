import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Types ─────────────────────────────────────────────────────────
interface NightActivity {
  id: string;
  type: 'bathroom' | 'wandering' | 'noise' | 'movement';
  timestamp: string;
  note: string;
}

interface CaregiverCheckIn {
  id: string;
  caregiver: string;
  timestamp: string;
  note: string;
  allClear: boolean;
}

interface MedicationSleepImpact {
  name: string;
  dosage: string;
  timing: string;
  impact: 'positive' | 'negative' | 'neutral';
  note: string;
}

interface DailySleep {
  day: string;
  hours: number;
  quality: number; // 0-100
  disruptions: number;
}

// ─── Demo Data ─────────────────────────────────────────────────────
const sleepQualityScore = 74;

const lastNight = {
  bedtime: '10:15 PM',
  wakeTime: '6:42 AM',
  totalHours: 7.4,
  deepSleep: 2.1,
  lightSleep: 3.8,
  remSleep: 1.5,
  disruptions: 3,
  timeToFallAsleep: '18 min',
};

const weeklyData: DailySleep[] = [
  { day: 'Mon', hours: 6.2, quality: 58, disruptions: 4 },
  { day: 'Tue', hours: 7.8, quality: 82, disruptions: 1 },
  { day: 'Wed', hours: 5.9, quality: 45, disruptions: 5 },
  { day: 'Thu', hours: 7.1, quality: 70, disruptions: 2 },
  { day: 'Fri', hours: 8.0, quality: 88, disruptions: 1 },
  { day: 'Sat', hours: 6.8, quality: 65, disruptions: 3 },
  { day: 'Sun', hours: 7.4, quality: 74, disruptions: 3 },
];

const lastWeekData: DailySleep[] = [
  { day: 'Mon', hours: 5.8, quality: 50, disruptions: 5 },
  { day: 'Tue', hours: 6.5, quality: 60, disruptions: 3 },
  { day: 'Wed', hours: 7.0, quality: 68, disruptions: 2 },
  { day: 'Thu', hours: 6.2, quality: 55, disruptions: 4 },
  { day: 'Fri', hours: 7.5, quality: 78, disruptions: 1 },
  { day: 'Sat', hours: 6.0, quality: 52, disruptions: 4 },
  { day: 'Sun', hours: 6.8, quality: 62, disruptions: 3 },
];

const nightActivities: NightActivity[] = [
  { id: 'na1', type: 'bathroom', timestamp: '11:48 PM', note: 'Bathroom visit — 4 minutes' },
  { id: 'na2', type: 'noise', timestamp: '1:22 AM', note: 'Noise alert triggered — TV left on in bedroom' },
  { id: 'na3', type: 'bathroom', timestamp: '3:05 AM', note: 'Bathroom visit — 6 minutes' },
  { id: 'na4', type: 'movement', timestamp: '4:30 AM', note: 'Restless movement detected — 12 minutes' },
  { id: 'na5', type: 'wandering', timestamp: '5:15 AM', note: 'Brief hallway wandering — returned to bed' },
];

const caregiverCheckIns: CaregiverCheckIn[] = [
  { id: 'ck1', caregiver: 'Maria S.', timestamp: '11:00 PM', note: 'Settled in bed, lights off', allClear: true },
  { id: 'ck2', caregiver: 'Maria S.', timestamp: '2:00 AM', note: 'Sleeping peacefully, repositioned pillow', allClear: true },
  { id: 'ck3', caregiver: 'James R.', timestamp: '5:00 AM', note: 'Awake briefly, offered water, back to sleep', allClear: true },
  { id: 'ck4', caregiver: 'James R.', timestamp: '6:30 AM', note: 'Waking up naturally, good mood', allClear: true },
];

const medications: MedicationSleepImpact[] = [
  { name: 'Melatonin', dosage: '3mg', timing: '9:00 PM', impact: 'positive', note: 'Aids sleep onset' },
  { name: 'Lisinopril', dosage: '10mg', timing: '8:00 AM', impact: 'neutral', note: 'No significant sleep impact' },
  { name: 'Furosemide', dosage: '40mg', timing: '6:00 PM', impact: 'negative', note: 'May increase nighttime bathroom visits' },
  { name: 'Sertraline', dosage: '50mg', timing: '8:00 AM', impact: 'negative', note: 'Can cause insomnia or vivid dreams' },
  { name: 'Acetaminophen', dosage: '500mg', timing: '9:30 PM', impact: 'positive', note: 'Pain relief aids comfortable sleep' },
];

const sleepTips = [
  { emoji: '🌡️', tip: 'Keep bedroom temperature between 65-68°F for optimal sleep.' },
  { emoji: '📱', tip: 'Limit screen time 1 hour before bed to improve melatonin production.' },
  { emoji: '☕', tip: 'Avoid caffeine after 2 PM — it can linger in the system for 8+ hours.' },
  { emoji: '🛁', tip: 'A warm bath 90 minutes before bed can improve sleep onset.' },
  { emoji: '🕐', tip: 'Maintain consistent bed and wake times, even on weekends.' },
  { emoji: '💡', tip: 'Use dim, warm lighting in the evening to signal the body it\'s time to wind down.' },
];

// ─── Helpers ──────────────────────────────────────────────────────
const activityEmoji: Record<string, string> = {
  bathroom: '🚻',
  wandering: '🚶',
  noise: '🔊',
  movement: '💤',
};

const getQualityColor = (score: number) => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
};

const getQualityLabel = (score: number) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Poor';
};

const impactColor: Record<string, string> = {
  positive: colors.success,
  negative: colors.danger,
  neutral: colors.textHint,
};

const impactEmoji: Record<string, string> = {
  positive: '✅',
  negative: '⚠️',
  neutral: '➖',
};

// ─── Component ─────────────────────────────────────────────────────
export default function SleepMonitorScreen() {
  const [alertsEnabled, setAlertsEnabled] = useState({
    wandering: true,
    prolongedAbsence: true,
    noiseAlert: true,
    noMovement: false,
  });

  const thisWeekAvg = weeklyData.reduce((s, d) => s + d.hours, 0) / weeklyData.length;
  const lastWeekAvg = lastWeekData.reduce((s, d) => s + d.hours, 0) / lastWeekData.length;
  const thisWeekQuality = Math.round(weeklyData.reduce((s, d) => s + d.quality, 0) / weeklyData.length);
  const lastWeekQuality = Math.round(lastWeekData.reduce((s, d) => s + d.quality, 0) / lastWeekData.length);
  const thisWeekDisruptions = weeklyData.reduce((s, d) => s + d.disruptions, 0);
  const lastWeekDisruptions = lastWeekData.reduce((s, d) => s + d.disruptions, 0);
  const consistencyScore = Math.round(
    100 - (weeklyData.reduce((s, d) => s + Math.abs(d.hours - thisWeekAvg), 0) / weeklyData.length) * 15
  );

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 9);

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
        <Text style={styles.heroEmoji}>🌙</Text>
        <Text style={styles.heroTitle}>Sleep Monitor</Text>
        <Text style={styles.heroSub}>Nighttime activity &amp; sleep patterns</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Sleep Quality Score ────────────────────────────────── */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRing}>
            <Text style={[styles.scoreValue, { color: getQualityColor(sleepQualityScore) }]}>
              {sleepQualityScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(sleepQualityScore) + '20' }]}>
              <Text style={[styles.qualityBadgeText, { color: getQualityColor(sleepQualityScore) }]}>
                {getQualityLabel(sleepQualityScore)}
              </Text>
            </View>
            <Text style={styles.scoreLabel}>Last Night's Sleep Quality</Text>
            <Text style={styles.scoreDesc}>Based on duration, disruptions, and consistency</Text>
          </View>
        </View>

        {/* ── Last Night Summary ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAST NIGHT SUMMARY</Text>
          <View style={styles.card}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>🛏️</Text>
                <Text style={styles.summaryVal}>{lastNight.bedtime}</Text>
                <Text style={styles.summarySub}>Bedtime</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>⏰</Text>
                <Text style={styles.summaryVal}>{lastNight.wakeTime}</Text>
                <Text style={styles.summarySub}>Wake Time</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>⏱️</Text>
                <Text style={styles.summaryVal}>{lastNight.totalHours}h</Text>
                <Text style={styles.summarySub}>Total Sleep</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>⚡</Text>
                <Text style={styles.summaryVal}>{lastNight.disruptions}</Text>
                <Text style={styles.summarySub}>Disruptions</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Sleep stage breakdown */}
            <Text style={styles.stageTitle}>Sleep Stages</Text>
            <View style={styles.stageBar}>
              <View style={[styles.stageSegment, { flex: lastNight.deepSleep, backgroundColor: '#3B82F6' }]} />
              <View style={[styles.stageSegment, { flex: lastNight.lightSleep, backgroundColor: '#93C5FD' }]} />
              <View style={[styles.stageSegment, { flex: lastNight.remSleep, backgroundColor: '#A78BFA' }]} />
            </View>
            <View style={styles.stageLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Deep {lastNight.deepSleep}h</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#93C5FD' }]} />
                <Text style={styles.legendText}>Light {lastNight.lightSleep}h</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#A78BFA' }]} />
                <Text style={styles.legendText}>REM {lastNight.remSleep}h</Text>
              </View>
            </View>

            <View style={styles.fallAsleepRow}>
              <Text style={styles.fallAsleepLabel}>Time to fall asleep</Text>
              <Text style={styles.fallAsleepVal}>{lastNight.timeToFallAsleep}</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Log Buttons ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK LOG</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.quickEmoji}>🛏️</Text>
              <Text style={styles.quickText}>Went to bed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.goldLight }]}>
              <Text style={styles.quickEmoji}>☀️</Text>
              <Text style={styles.quickText}>Woke up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.tintEmergency }]}>
              <Text style={styles.quickEmoji}>🚨</Text>
              <Text style={styles.quickText}>Incident</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Weekly Sleep Chart ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WEEKLY SLEEP PATTERN</Text>
          <View style={styles.card}>
            <View style={styles.chartContainer}>
              {/* Y-axis labels */}
              <View style={styles.yAxis}>
                {[9, 7, 5, 3].map((h) => (
                  <Text key={h} style={styles.yLabel}>{h}h</Text>
                ))}
              </View>
              {/* Bars */}
              <View style={styles.chart}>
                {weeklyData.map((d) => {
                  const barHeight = (d.hours / maxHours) * 120;
                  const barColor = getQualityColor(d.quality);
                  return (
                    <View key={d.day} style={styles.chartCol}>
                      <Text style={styles.chartValLabel}>{d.hours}h</Text>
                      <View style={[styles.chartBar, { height: barHeight, backgroundColor: barColor }]}>
                        {d.disruptions > 0 && (
                          <View style={styles.disruptionBadge}>
                            <Text style={styles.disruptionText}>{d.disruptions}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.chartDayLabel}>{d.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.chartLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={styles.legendText}>Good</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.legendText}>Fair</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.legendText}>Poor</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.disruptionBadgeLegend]}>
                  <Text style={styles.disruptionTextLegend}>2</Text>
                </View>
                <Text style={styles.legendText}>Disruptions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Trends ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRENDS</Text>
          <View style={styles.trendGrid}>
            <View style={styles.trendCard}>
              <Text style={styles.trendEmoji}>😴</Text>
              <Text style={styles.trendVal}>{thisWeekAvg.toFixed(1)}h</Text>
              <Text style={styles.trendSub}>Avg Sleep</Text>
            </View>
            <View style={styles.trendCard}>
              <Text style={styles.trendEmoji}>📊</Text>
              <Text style={styles.trendVal}>{consistencyScore}%</Text>
              <Text style={styles.trendSub}>Consistency</Text>
            </View>
            <View style={styles.trendCard}>
              <Text style={styles.trendEmoji}>⚡</Text>
              <Text style={styles.trendVal}>{(thisWeekDisruptions / 7).toFixed(1)}</Text>
              <Text style={styles.trendSub}>Disruptions/Night</Text>
            </View>
          </View>
        </View>

        {/* ── This Week vs Last Week ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THIS WEEK VS LAST WEEK</Text>
          <View style={styles.card}>
            <View style={styles.compRow}>
              <Text style={styles.compLabel}>Avg Duration</Text>
              <View style={styles.compValues}>
                <Text style={styles.compThis}>{thisWeekAvg.toFixed(1)}h</Text>
                <Text style={styles.compVs}>vs</Text>
                <Text style={styles.compLast}>{lastWeekAvg.toFixed(1)}h</Text>
                <View style={[
                  styles.compBadge,
                  { backgroundColor: thisWeekAvg >= lastWeekAvg ? colors.success + '20' : colors.danger + '20' },
                ]}>
                  <Text style={[
                    styles.compBadgeText,
                    { color: thisWeekAvg >= lastWeekAvg ? colors.success : colors.danger },
                  ]}>
                    {thisWeekAvg >= lastWeekAvg ? '▲' : '▼'} {Math.abs(thisWeekAvg - lastWeekAvg).toFixed(1)}h
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.compRow}>
              <Text style={styles.compLabel}>Avg Quality</Text>
              <View style={styles.compValues}>
                <Text style={styles.compThis}>{thisWeekQuality}%</Text>
                <Text style={styles.compVs}>vs</Text>
                <Text style={styles.compLast}>{lastWeekQuality}%</Text>
                <View style={[
                  styles.compBadge,
                  { backgroundColor: thisWeekQuality >= lastWeekQuality ? colors.success + '20' : colors.danger + '20' },
                ]}>
                  <Text style={[
                    styles.compBadgeText,
                    { color: thisWeekQuality >= lastWeekQuality ? colors.success : colors.danger },
                  ]}>
                    {thisWeekQuality >= lastWeekQuality ? '▲' : '▼'} {Math.abs(thisWeekQuality - lastWeekQuality)}%
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.compRow}>
              <Text style={styles.compLabel}>Total Disruptions</Text>
              <View style={styles.compValues}>
                <Text style={styles.compThis}>{thisWeekDisruptions}</Text>
                <Text style={styles.compVs}>vs</Text>
                <Text style={styles.compLast}>{lastWeekDisruptions}</Text>
                <View style={[
                  styles.compBadge,
                  { backgroundColor: thisWeekDisruptions <= lastWeekDisruptions ? colors.success + '20' : colors.danger + '20' },
                ]}>
                  <Text style={[
                    styles.compBadgeText,
                    { color: thisWeekDisruptions <= lastWeekDisruptions ? colors.success : colors.danger },
                  ]}>
                    {thisWeekDisruptions <= lastWeekDisruptions ? '▼' : '▲'} {Math.abs(thisWeekDisruptions - lastWeekDisruptions)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Night Activity Log ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NIGHT ACTIVITY LOG</Text>
          <View style={styles.card}>
            {nightActivities.map((act, i) => (
              <View
                key={act.id}
                style={[styles.actRow, i < nightActivities.length - 1 && styles.actBorder]}
              >
                <Text style={styles.actEmoji}>{activityEmoji[act.type]}</Text>
                <View style={styles.actInfo}>
                  <Text style={styles.actNote}>{act.note}</Text>
                  <Text style={styles.actTime}>{act.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Caregiver Night Check-Ins ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CAREGIVER CHECK-INS</Text>
          <View style={styles.card}>
            {caregiverCheckIns.map((ci, i) => (
              <View
                key={ci.id}
                style={[styles.checkInRow, i < caregiverCheckIns.length - 1 && styles.actBorder]}
              >
                <View style={[styles.checkInDot, { backgroundColor: ci.allClear ? colors.success : colors.warning }]} />
                <View style={styles.checkInInfo}>
                  <View style={styles.checkInHeader}>
                    <Text style={styles.checkInName}>{ci.caregiver}</Text>
                    <Text style={styles.checkInTime}>{ci.timestamp}</Text>
                  </View>
                  <Text style={styles.checkInNote}>{ci.note}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Medication Impact on Sleep ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MEDICATION IMPACT ON SLEEP</Text>
          <View style={styles.card}>
            {medications.map((med, i) => (
              <View
                key={med.name}
                style={[styles.medRow, i < medications.length - 1 && styles.actBorder]}
              >
                <Text style={styles.medImpactEmoji}>{impactEmoji[med.impact]}</Text>
                <View style={styles.medInfo}>
                  <View style={styles.medHeader}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage} · {med.timing}</Text>
                  </View>
                  <Text style={styles.medNote}>{med.note}</Text>
                </View>
                <View style={[styles.medImpactBadge, { backgroundColor: impactColor[med.impact] + '18' }]}>
                  <Text style={[styles.medImpactText, { color: impactColor[med.impact] }]}>
                    {med.impact}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Sleep Hygiene Tips ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SLEEP HYGIENE TIPS</Text>
          {sleepTips.map((t, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipEmoji}>{t.emoji}</Text>
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))}
        </View>

        {/* ── Alert Settings ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NIGHTTIME ALERT SETTINGS</Text>
          <View style={styles.card}>
            <View style={styles.alertSettingRow}>
              <View style={styles.alertSettingInfo}>
                <Text style={styles.alertSettingTitle}>🚶 Wandering Detection</Text>
                <Text style={styles.alertSettingSub}>Alert when movement outside bedroom is detected</Text>
              </View>
              <Switch
                value={alertsEnabled.wandering}
                onValueChange={(v) => setAlertsEnabled((p) => ({ ...p, wandering: v }))}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={alertsEnabled.wandering ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertSettingRow}>
              <View style={styles.alertSettingInfo}>
                <Text style={styles.alertSettingTitle}>🚻 Prolonged Bathroom Absence</Text>
                <Text style={styles.alertSettingSub}>Alert if bathroom visit exceeds 15 minutes</Text>
              </View>
              <Switch
                value={alertsEnabled.prolongedAbsence}
                onValueChange={(v) => setAlertsEnabled((p) => ({ ...p, prolongedAbsence: v }))}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={alertsEnabled.prolongedAbsence ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertSettingRow}>
              <View style={styles.alertSettingInfo}>
                <Text style={styles.alertSettingTitle}>🔊 Noise Alerts</Text>
                <Text style={styles.alertSettingSub}>Alert on unusual sounds (yelling, crashes, alarms)</Text>
              </View>
              <Switch
                value={alertsEnabled.noiseAlert}
                onValueChange={(v) => setAlertsEnabled((p) => ({ ...p, noiseAlert: v }))}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={alertsEnabled.noiseAlert ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertSettingRow}>
              <View style={styles.alertSettingInfo}>
                <Text style={styles.alertSettingTitle}>🛑 No Movement Alert</Text>
                <Text style={styles.alertSettingSub}>Alert if no movement detected for 10+ hours</Text>
              </View>
              <Switch
                value={alertsEnabled.noMovement}
                onValueChange={(v) => setAlertsEnabled((p) => ({ ...p, noMovement: v }))}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={alertsEnabled.noMovement ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero
  hero: {
    backgroundColor: colors.primaryDark,
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
  scroll: { flex: 1, paddingTop: 20 },

  // Score Card
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { ...typography.displayLarge, fontSize: 32 },
  scoreMax: { ...typography.bodySmall, color: colors.textHint, marginTop: -4, fontSize: 12 },
  scoreInfo: { flex: 1 },
  qualityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  qualityBadgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 11 },
  scoreLabel: { ...typography.headingSmall, color: colors.textPrimary },
  scoreDesc: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },

  // Sections
  section: { paddingHorizontal: 18, marginTop: 24 },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    marginBottom: 12,
    fontSize: 11,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  summaryItem: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryEmoji: { fontSize: 24, marginBottom: 6 },
  summaryVal: { ...typography.headingMedium, color: colors.textPrimary },
  summarySub: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 16 },

  // Sleep Stages
  stageTitle: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1, marginBottom: 10, fontSize: 10, fontWeight: '700' },
  stageBar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 },
  stageSegment: { borderRadius: 7 },
  stageLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 11 },
  fallAsleepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  fallAsleepLabel: { ...typography.bodySmall, color: colors.textSecondary },
  fallAsleepVal: { ...typography.headingSmall, color: colors.primary },

  // Quick Log
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  quickEmoji: { fontSize: 24 },
  quickText: { ...typography.labelSmall, color: colors.textPrimary, fontWeight: '600', fontSize: 11 },

  // Chart
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  yAxis: { justifyContent: 'space-between', height: 120, paddingBottom: 4 },
  yLabel: { ...typography.bodySmall, color: colors.textHint, fontSize: 10 },
  chart: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '80%', borderRadius: 6, minHeight: 8, alignItems: 'center', justifyContent: 'flex-start' },
  chartValLabel: { ...typography.labelSmall, fontSize: 9, color: colors.textHint, marginBottom: 4 },
  chartDayLabel: { ...typography.labelSmall, fontSize: 10, color: colors.textSecondary, marginTop: 6 },
  chartLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 14 },
  disruptionBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: colors.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disruptionText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  disruptionBadgeLegend: {
    backgroundColor: colors.danger,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disruptionTextLegend: { color: '#fff', fontSize: 8, fontWeight: '800' },

  // Trends
  trendGrid: { flexDirection: 'row', gap: 10 },
  trendCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  trendEmoji: { fontSize: 22, marginBottom: 6 },
  trendVal: { ...typography.headingMedium, color: colors.textPrimary },
  trendSub: { ...typography.bodySmall, color: colors.textHint, marginTop: 3, fontSize: 10, textAlign: 'center' },

  // Comparison
  compRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  compLabel: { ...typography.bodyMedium, color: colors.textSecondary, flex: 1 },
  compValues: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compThis: { ...typography.headingSmall, color: colors.textPrimary },
  compVs: { ...typography.bodySmall, color: colors.textHint, fontSize: 11 },
  compLast: { ...typography.bodySmall, color: colors.textHint },
  compBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  compBadgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
  compDivider: { height: 1, backgroundColor: colors.divider },

  // Night Activity
  actRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  actBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  actEmoji: { fontSize: 22, marginTop: 2 },
  actInfo: { flex: 1 },
  actNote: { ...typography.bodyMedium, color: colors.textPrimary },
  actTime: { ...typography.bodySmall, color: colors.textHint, marginTop: 3 },

  // Caregiver Check-Ins
  checkInRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  checkInDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  checkInInfo: { flex: 1 },
  checkInHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkInName: { ...typography.headingSmall, color: colors.textPrimary },
  checkInTime: { ...typography.bodySmall, color: colors.textHint, fontSize: 11 },
  checkInNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },

  // Medication Impact
  medRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  medImpactEmoji: { fontSize: 18, marginTop: 2 },
  medInfo: { flex: 1 },
  medHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  medName: { ...typography.headingSmall, color: colors.textPrimary },
  medDosage: { ...typography.bodySmall, color: colors.textHint, fontSize: 11 },
  medNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 3 },
  medImpactBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'center' },
  medImpactText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10, textTransform: 'capitalize' },

  // Tips
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tipEmoji: { fontSize: 20, marginTop: 1 },
  tipText: { ...typography.bodyMedium, color: colors.textSecondary, flex: 1, lineHeight: 20 },

  // Alert Settings
  alertSettingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  alertSettingInfo: { flex: 1 },
  alertSettingTitle: { ...typography.headingSmall, color: colors.textPrimary },
  alertSettingSub: { ...typography.bodySmall, color: colors.textHint, marginTop: 3 },
  alertDivider: { height: 1, backgroundColor: colors.divider },
});
