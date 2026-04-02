import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { useJournal } from '../../hooks/useJournal';
import { Button } from '../../components/ui/Button';

const moods = [
  { value: 'GREAT', emoji: '😄', label: 'Great', bg: '#E7F9EE' },
  { value: 'GOOD', emoji: '🙂', label: 'Good', bg: '#EEF8F6' },
  { value: 'OKAY', emoji: '😐', label: 'Okay', bg: '#FFF8EB' },
  { value: 'LOW', emoji: '😟', label: 'Low', bg: '#FFF1EE' },
  { value: 'BAD', emoji: '😢', label: 'Bad', bg: '#FEE2E2' },
];

const sleepOptions = [
  { value: 'Good', emoji: '😴', label: 'Good' },
  { value: 'Fair', emoji: '😑', label: 'Fair' },
  { value: 'Poor', emoji: '😵', label: 'Poor' },
];

const appetiteOptions = [
  { value: 'Normal', emoji: '🍽', label: 'Normal' },
  { value: 'Reduced', emoji: '🥄', label: 'Reduced' },
  { value: 'None', emoji: '🚫', label: 'None' },
];

export default function AddJournalScreen() {
  const { createEntry } = useJournal();
  const { getActiveCircle } = useCircleStore();
  const activeCircle = getActiveCircle();

  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState(3);
  const [pain, setPain] = useState(0);
  const [sleep, setSleep] = useState<string | null>(null);
  const [appetite, setAppetite] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipientName = activeCircle?.careRecipient || 'your loved one';

  const handleSubmit = async () => {
    if (notes.length < 10) {
      setError('Notes must be at least 10 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createEntry({
        mood: mood || undefined,
        energy,
        pain,
        sleep: sleep || undefined,
        appetite: appetite || undefined,
        notes,
      });
      router.back();
    } catch {
      setError('Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const painColor = pain <= 3 ? colors.success : pain <= 6 ? '#F0AD4E' : colors.danger;

  return (
    <>
      <Stack.Screen options={{ title: 'Health Update' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.heroRow}>
          <Text style={styles.heroEmoji}>📋</Text>
          <View>
            <Text style={styles.heroTitle}>Health Update</Text>
            <Text style={styles.heroSub}>Record how {recipientName} is doing</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>How is {recipientName} feeling?</Text>
          <View style={styles.moodRow}>
            {moods.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.moodBtn, { backgroundColor: m.bg }, mood === m.value && styles.moodBtnActive]}
                onPress={() => setMood(m.value)}
                accessibilityRole="button"
                accessibilityLabel={`Mood: ${m.label}`}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Energy Level</Text>
          <View style={styles.pillRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.pill, energy === v && styles.pillActive]}
                onPress={() => setEnergy(v)}
                accessibilityRole="button"
                accessibilityLabel={`Energy ${v} of 5`}
              >
                <Text style={[styles.pillText, energy === v && styles.pillTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.scaleHints}>
            <Text style={styles.scaleHint}>Low</Text>
            <Text style={styles.scaleHint}>High</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Pain Level: <Text style={{ color: painColor, fontWeight: '700' }}>{pain}/10</Text></Text>
          <View style={styles.painRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
              const c = v <= 3 ? colors.success : v <= 6 ? '#F0AD4E' : colors.danger;
              return (
                <TouchableOpacity
                  key={v}
                  style={[styles.painPill, pain === v && { backgroundColor: c, borderColor: c }]}
                  onPress={() => setPain(v)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pain ${v} of 10`}
                >
                  <Text style={[styles.painPillText, pain === v && styles.painPillTextActive]}>{v}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.scaleHints}>
            <Text style={styles.scaleHint}>None</Text>
            <Text style={styles.scaleHint}>Severe</Text>
          </View>
        </View>

        <View style={styles.sideBySide}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>Sleep</Text>
            {sleepOptions.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.optionRow, sleep === s.value && styles.optionRowActive]}
                onPress={() => setSleep(s.value)}
              >
                <Text style={styles.optionEmoji}>{s.emoji}</Text>
                <Text style={[styles.optionText, sleep === s.value && styles.optionTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>Appetite</Text>
            {appetiteOptions.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.optionRow, appetite === a.value && styles.optionRowActive]}
                onPress={() => setAppetite(a.value)}
              >
                <Text style={styles.optionEmoji}>{a.emoji}</Text>
                <Text style={[styles.optionText, appetite === a.value && styles.optionTextActive]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes *</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            value={notes}
            onChangeText={(t) => { setNotes(t); setError(null); }}
            placeholder={`Describe how ${recipientName} is doing today...`}
            placeholderTextColor={colors.textHint}
          />
          <Text style={styles.charCount}>{notes.length} / 10 min</Text>
        </View>

        <View style={styles.gap24} />
        <Button title="Save Entry" onPress={handleSubmit} loading={loading} />
        <View style={styles.gap32} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    backgroundColor: colors.tintJournal,
    padding: 18,
    borderRadius: 18,
  },
  heroEmoji: { fontSize: 28 },
  heroTitle: { ...typography.headingLarge, color: colors.textPrimary },
  heroSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 14, marginBottom: 16 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },
  card: {
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
  cardLabel: { ...typography.labelMedium, color: colors.textSecondary, marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodBtnActive: { borderColor: colors.primary },
  moodEmoji: { fontSize: 26, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: colors.textHint },
  moodLabelActive: { color: colors.primary, fontWeight: '600' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.labelMedium, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  scaleHints: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleHint: { ...typography.bodySmall, color: colors.textHint, fontSize: 11 },
  painRow: { flexDirection: 'row', gap: 4 },
  painPill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  painPillText: { ...typography.labelSmall, color: colors.textSecondary },
  painPillTextActive: { color: '#fff', fontWeight: '700' },
  sideBySide: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: colors.surface,
  },
  optionRowActive: { backgroundColor: colors.primaryLight },
  optionEmoji: { fontSize: 16 },
  optionText: { ...typography.labelSmall, color: colors.textSecondary, fontWeight: '600' },
  optionTextActive: { color: colors.primary },
  notesInput: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  charCount: { ...typography.labelSmall, color: colors.textHint, marginTop: 6, textAlign: 'right' },
  gap24: { height: 24 },
  gap32: { height: 32 },
});
