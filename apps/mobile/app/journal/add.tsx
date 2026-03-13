import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { useJournal } from '../../hooks/useJournal';
import { Button } from '../../components/ui/Button';

const moods = [
  { value: 'GREAT', emoji: '😄', label: 'Great' },
  { value: 'GOOD', emoji: '🙂', label: 'Good' },
  { value: 'OKAY', emoji: '😐', label: 'Okay' },
  { value: 'LOW', emoji: '😟', label: 'Low' },
  { value: 'BAD', emoji: '😢', label: 'Bad' },
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

  const handleSubmit = async () => {
    if (notes.length < 10) {
      setError('Notes must be at least 10 characters');
      return;
    }
    setLoading(true);
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

  return (
    <>
      <Stack.Screen options={{ title: 'Health Update' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>How is {activeCircle?.careRecipient || 'your loved one'} feeling?</Text>
        <View style={styles.moodRow}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[styles.moodBtn, mood === m.value && styles.moodBtnActive]}
              onPress={() => setMood(m.value)}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Energy: {energy}/5</Text>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={energy}
          onValueChange={setEnergy}
          minimumTrackTintColor={colors.primary}
          style={styles.slider}
        />

        <Text style={styles.label}>Pain: {pain}/10</Text>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={pain}
          onValueChange={setPain}
          minimumTrackTintColor={colors.danger}
          style={styles.slider}
        />

        <Text style={styles.label}>Sleep</Text>
        <View style={styles.pillRow}>
          {['Good', 'Fair', 'Poor'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.pill, sleep === s && styles.pillActive]}
              onPress={() => setSleep(s)}
            >
              <Text style={[styles.pillText, sleep === s && styles.pillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Appetite</Text>
        <View style={styles.pillRow}>
          {['Normal', 'Reduced', 'None'].map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.pill, appetite === a && styles.pillActive]}
              onPress={() => setAppetite(a)}
            >
              <Text style={[styles.pillText, appetite === a && styles.pillTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notes *</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder={`Describe how ${activeCircle?.careRecipient || 'your loved one'} is doing today...`}
          placeholderTextColor={colors.textHint}
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.gap32} />
        <Button title="Save Entry" onPress={handleSubmit} loading={loading} />
        <View style={styles.gap32} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 60,
  },
  moodBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, color: colors.textHint, marginTop: 4 },
  moodLabelActive: { color: colors.primary, fontWeight: '600' },
  slider: { marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 14, color: colors.textSecondary },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, color: colors.danger, marginTop: 4 },
  gap32: { height: 32 },
});
