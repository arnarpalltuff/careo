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
import { CrossHatch, RadialRings, TopoLines, DotGrid } from '../components/Texture';

// ─── Types ─────────────────────────────────────────────────────────
type VitalType = 'bp' | 'weight' | 'glucose' | 'temperature' | 'heartRate' | 'oxygen';

interface VitalReading {
  id: string;
  type: VitalType;
  value: string;
  value2?: string; // for systolic/diastolic
  unit: string;
  timestamp: string;
  note?: string;
}

// ─── Demo Data ─────────────────────────────────────────────────────
const now = new Date();
const demoReadings: VitalReading[] = [];

// Generate 14 days of demo BP data
for (let i = 13; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  d.setHours(8, 0, 0, 0);
  const sys = 120 + Math.floor(Math.random() * 20) - 5;
  const dia = 75 + Math.floor(Math.random() * 15) - 5;
  demoReadings.push({
    id: `bp-${i}`,
    type: 'bp',
    value: String(sys),
    value2: String(dia),
    unit: 'mmHg',
    timestamp: d.toISOString(),
  });
}

// Weight data (weekly)
for (let i = 7; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i * 7);
  demoReadings.push({
    id: `wt-${i}`,
    type: 'weight',
    value: String(148 + Math.floor(Math.random() * 4) - 2),
    unit: 'lbs',
    timestamp: d.toISOString(),
  });
}

// Glucose (daily)
for (let i = 9; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  d.setHours(7, 30, 0, 0);
  demoReadings.push({
    id: `glu-${i}`,
    type: 'glucose',
    value: String(95 + Math.floor(Math.random() * 30)),
    unit: 'mg/dL',
    timestamp: d.toISOString(),
    note: i === 3 ? 'After fasting' : undefined,
  });
}

// Heart rate
for (let i = 6; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  demoReadings.push({
    id: `hr-${i}`,
    type: 'heartRate',
    value: String(68 + Math.floor(Math.random() * 12)),
    unit: 'bpm',
    timestamp: d.toISOString(),
  });
}

// Oxygen
for (let i = 4; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  demoReadings.push({
    id: `ox-${i}`,
    type: 'oxygen',
    value: String(95 + Math.floor(Math.random() * 4)),
    unit: '%',
    timestamp: d.toISOString(),
  });
}

// Temperature
for (let i = 4; i >= 0; i--) {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  demoReadings.push({
    id: `temp-${i}`,
    type: 'temperature',
    value: (97.5 + Math.random() * 1.5).toFixed(1),
    unit: '\u00B0F',
    timestamp: d.toISOString(),
  });
}

// ─── Config ────────────────────────────────────────────────────────
const vitalTypes: { key: VitalType; label: string; emoji: string; color: string; bg: string; normalRange: string }[] = [
  { key: 'bp', label: 'Blood Pressure', emoji: '🫀', color: '#E8725A', bg: colors.tintMed, normalRange: '< 120/80' },
  { key: 'heartRate', label: 'Heart Rate', emoji: '💓', color: '#E84393', bg: '#FFF0F6', normalRange: '60-100 bpm' },
  { key: 'glucose', label: 'Blood Sugar', emoji: '🩸', color: '#6C5CE7', bg: '#F3F0FF', normalRange: '70-100 mg/dL' },
  { key: 'oxygen', label: 'Oxygen', emoji: '🫁', color: '#0984E3', bg: '#E8F4FD', normalRange: '95-100%' },
  { key: 'weight', label: 'Weight', emoji: '⚖️', color: '#00B894', bg: colors.tintTask, normalRange: 'Stable' },
  { key: 'temperature', label: 'Temperature', emoji: '🌡️', color: '#FDCB6E', bg: colors.tintJournal, normalRange: '97.8-99.1\u00B0F' },
];

// ─── Component ─────────────────────────────────────────────────────
export default function VitalsScreen() {
  const [selectedType, setSelectedType] = useState<VitalType | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const getReadings = (type: VitalType) =>
    demoReadings.filter((r) => r.type === type).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getLatest = (type: VitalType) => getReadings(type)[0];

  const getStatus = (type: VitalType, reading: VitalReading): { label: string; color: string } => {
    const val = Number(reading.value);
    switch (type) {
      case 'bp': {
        const sys = val;
        if (sys < 120) return { label: 'Normal', color: colors.success };
        if (sys < 130) return { label: 'Elevated', color: colors.warning };
        if (sys < 140) return { label: 'High', color: '#E8725A' };
        return { label: 'Very High', color: colors.danger };
      }
      case 'glucose': {
        if (val < 70) return { label: 'Low', color: colors.warning };
        if (val <= 100) return { label: 'Normal', color: colors.success };
        if (val <= 125) return { label: 'Pre-diabetic', color: colors.warning };
        return { label: 'High', color: colors.danger };
      }
      case 'heartRate': {
        if (val < 60) return { label: 'Low', color: colors.warning };
        if (val <= 100) return { label: 'Normal', color: colors.success };
        return { label: 'High', color: colors.danger };
      }
      case 'oxygen': {
        if (val >= 95) return { label: 'Normal', color: colors.success };
        if (val >= 90) return { label: 'Low', color: colors.warning };
        return { label: 'Critical', color: colors.danger };
      }
      case 'temperature': {
        if (val < 97.8) return { label: 'Low', color: colors.warning };
        if (val <= 99.1) return { label: 'Normal', color: colors.success };
        if (val <= 100.4) return { label: 'Mild Fever', color: colors.warning };
        return { label: 'Fever', color: colors.danger };
      }
      default:
        return { label: 'Logged', color: colors.success };
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const selectedConfig = selectedType ? vitalTypes.find((v) => v.key === selectedType) : null;
  const selectedReadings = selectedType ? getReadings(selectedType) : [];

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
        <Text style={styles.heroEmoji}>📊</Text>
        <Text style={styles.heroTitle}>Vital Signs</Text>
        <Text style={styles.heroSub}>Track and monitor health trends</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {!selectedType ? (
          <>
            {/* Overview Cards */}
            <View style={styles.grid}>
              {vitalTypes.map((vt) => {
                const latest = getLatest(vt.key);
                const status = latest ? getStatus(vt.key, latest) : null;
                const readings = getReadings(vt.key);
                return (
                  <TouchableOpacity
                    key={vt.key}
                    style={[styles.vitalCard, { backgroundColor: vt.bg }]}
                    onPress={() => setSelectedType(vt.key)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.vitalCardHeader}>
                      <Text style={styles.vitalEmoji}>{vt.emoji}</Text>
                      {status && (
                        <View style={[styles.statusDot, { backgroundColor: status.color }]}>
                          <Text style={styles.statusDotText}>{status.label}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.vitalLabel}>{vt.label}</Text>
                    {latest ? (
                      <Text style={[styles.vitalValue, { color: vt.color }]}>
                        {vt.key === 'bp' ? `${latest.value}/${latest.value2}` : latest.value}
                        <Text style={styles.vitalUnit}> {latest.unit}</Text>
                      </Text>
                    ) : (
                      <Text style={styles.vitalNoData}>No data</Text>
                    )}
                    <Text style={styles.vitalDate}>
                      {latest ? formatDate(latest.timestamp) : ''} {'\u00B7'} {readings.length} readings
                    </Text>

                    {/* Mini sparkline */}
                    {readings.length > 1 && (
                      <View style={styles.sparkline}>
                        {readings.slice(0, 7).reverse().map((r, i, arr) => {
                          const val = Number(r.value);
                          const vals = arr.map((x) => Number(x.value));
                          const min = Math.min(...vals);
                          const max = Math.max(...vals);
                          const range = max - min || 1;
                          const height = 8 + ((val - min) / range) * 20;
                          return (
                            <View
                              key={r.id}
                              style={[styles.sparkBar, { height, backgroundColor: vt.color, opacity: 0.3 + (i / arr.length) * 0.7 }]}
                            />
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Alerts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SMART ALERTS</Text>
              <View style={styles.alertCard}>
                <Text style={styles.alertEmoji}>🔔</Text>
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Blood pressure trending up</Text>
                  <Text style={styles.alertSub}>Average systolic is 5 points higher than last week. Consider mentioning at the next cardiology visit.</Text>
                </View>
              </View>
              <View style={[styles.alertCard, { backgroundColor: colors.tintTask }]}>
                <Text style={styles.alertEmoji}>✅</Text>
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Blood sugar well controlled</Text>
                  <Text style={styles.alertSub}>All fasting readings have been in normal range for the past 10 days.</Text>
                </View>
              </View>
              <View style={[styles.alertCard, { backgroundColor: colors.tintJournal }]}>
                <Text style={styles.alertEmoji}>💡</Text>
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Weight stable</Text>
                  <Text style={styles.alertSub}>Weight has stayed within 2 lbs over the past 8 weeks. Great consistency!</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Detail View */}
            <TouchableOpacity style={styles.backToAll} onPress={() => setSelectedType(null)}>
              <Text style={styles.backToAllText}>{'\u2190'} All Vitals</Text>
            </TouchableOpacity>

            <View style={[styles.detailHeader, { backgroundColor: selectedConfig!.bg }]}>
              <Text style={{ fontSize: 36 }}>{selectedConfig!.emoji}</Text>
              <Text style={[styles.detailTitle, { color: selectedConfig!.color }]}>{selectedConfig!.label}</Text>
              <Text style={styles.detailRange}>Normal range: {selectedConfig!.normalRange}</Text>
            </View>

            {/* Trend Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>14-Day Trend</Text>
              <View style={styles.chart}>
                {selectedReadings.slice(0, 14).reverse().map((r, i, arr) => {
                  const val = Number(r.value);
                  const vals = arr.map((x) => Number(x.value));
                  const min = Math.min(...vals) - 5;
                  const max = Math.max(...vals) + 5;
                  const range = max - min || 1;
                  const height = 20 + ((val - min) / range) * 80;
                  const status = getStatus(selectedType!, r);
                  return (
                    <View key={r.id} style={styles.chartCol}>
                      <Text style={styles.chartValLabel}>
                        {selectedType === 'bp' ? `${r.value}/${r.value2}` : r.value}
                      </Text>
                      <View style={[styles.chartBar, { height, backgroundColor: status.color }]} />
                      <Text style={styles.chartDateLabel}>
                        {new Date(r.timestamp).getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Add Reading */}
            <TouchableOpacity
              style={[styles.addReadingBtn, { backgroundColor: selectedConfig!.color }]}
              onPress={() => setShowAdd(!showAdd)}
            >
              <Text style={styles.addReadingText}>{showAdd ? 'Cancel' : '+ Log New Reading'}</Text>
            </TouchableOpacity>

            {showAdd && (
              <View style={styles.addForm}>
                <Text style={styles.addFormLabel}>
                  Enter {selectedConfig!.label.toLowerCase()} reading:
                </Text>
                <View style={styles.addFormRow}>
                  <TextInput
                    style={styles.addInput}
                    placeholder={selectedType === 'bp' ? 'Systolic' : 'Value'}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textHint}
                  />
                  {selectedType === 'bp' && (
                    <>
                      <Text style={styles.addSlash}>/</Text>
                      <TextInput
                        style={styles.addInput}
                        placeholder="Diastolic"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textHint}
                      />
                    </>
                  )}
                  <Text style={styles.addUnit}>{selectedConfig!.normalRange.includes('\u00B0') ? '\u00B0F' : selectedReadings[0]?.unit}</Text>
                </View>
                <TouchableOpacity style={[styles.addSaveBtn, { backgroundColor: selectedConfig!.color }]}>
                  <Text style={styles.addSaveText}>Save Reading</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reading History */}
            <Text style={[styles.sectionLabel, { marginHorizontal: 18 }]}>HISTORY</Text>
            {selectedReadings.map((r, i) => {
              const status = getStatus(selectedType!, r);
              return (
                <View key={r.id} style={[styles.historyRow, i < selectedReadings.length - 1 && styles.historyBorder]}>
                  <View style={[styles.historyDot, { backgroundColor: status.color }]} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyValue}>
                      {selectedType === 'bp' ? `${r.value}/${r.value2}` : r.value} {r.unit}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(r.timestamp)} {'\u00B7'} {new Date(r.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    {r.note && <Text style={styles.historyNote}>{r.note}</Text>}
                  </View>
                  <View style={[styles.historyBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.historyBadgeText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              );
            })}
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
  scroll: { flex: 1, paddingTop: 20 },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  vitalCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    padding: 16,
    borderRadius: 20,
    minHeight: 160,
  },
  vitalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalEmoji: { fontSize: 28 },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDotText: { ...typography.labelSmall, color: '#fff', fontSize: 9, fontWeight: '700' },
  vitalLabel: { ...typography.labelSmall, color: colors.textSecondary, marginBottom: 4 },
  vitalValue: { ...typography.displaySmall, fontSize: 24 },
  vitalUnit: { fontSize: 13, fontWeight: '400' },
  vitalNoData: { ...typography.bodySmall, color: colors.textHint },
  vitalDate: { ...typography.bodySmall, color: colors.textHint, marginTop: 4, fontSize: 11 },

  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 10,
    height: 28,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 3,
    minWidth: 4,
  },

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

  // Alerts
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: colors.tintMed,
    borderRadius: 16,
    gap: 12,
    marginBottom: 10,
  },
  alertEmoji: { fontSize: 22, marginTop: 2 },
  alertText: { flex: 1 },
  alertTitle: { ...typography.headingSmall, color: colors.textPrimary },
  alertSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },

  // Detail
  backToAll: { paddingHorizontal: 18, paddingBottom: 10 },
  backToAllText: { ...typography.labelMedium, color: colors.primary },
  detailHeader: {
    marginHorizontal: 18,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: { ...typography.displaySmall, marginTop: 10 },
  detailRange: { ...typography.bodySmall, color: colors.textHint, marginTop: 6 },

  // Chart
  chartCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: { ...typography.headingSmall, color: colors.textPrimary, marginBottom: 16 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 4,
  },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '80%', borderRadius: 4, minHeight: 4 },
  chartValLabel: { ...typography.labelSmall, fontSize: 8, color: colors.textHint, marginBottom: 4 },
  chartDateLabel: { ...typography.labelSmall, fontSize: 9, color: colors.textHint, marginTop: 4 },

  // Add reading
  addReadingBtn: {
    marginHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addReadingText: { ...typography.labelLarge, color: '#fff', fontWeight: '700' },
  addForm: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  addFormLabel: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 12 },
  addFormRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  addInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addSlash: { fontSize: 24, color: colors.textHint },
  addUnit: { ...typography.bodyMedium, color: colors.textHint },
  addSaveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addSaveText: { ...typography.labelMedium, color: '#fff', fontWeight: '700' },

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  historyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyInfo: { flex: 1 },
  historyValue: { ...typography.headingSmall, color: colors.textPrimary },
  historyDate: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  historyNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  historyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  historyBadgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
});
