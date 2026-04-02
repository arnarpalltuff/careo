import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { careNoteService } from '../../services/careNotes';

const noteTypes = [
  { value: 'SHIFT_HANDOFF', emoji: '🔄', label: 'Shift Handoff', hint: 'What the next caregiver needs to know' },
  { value: 'DOCTOR_VISIT', emoji: '🩺', label: 'Doctor Visit', hint: 'Record what the doctor said' },
  { value: 'DAILY_UPDATE', emoji: '📝', label: 'Daily Update', hint: 'How was the day overall?' },
  { value: 'INCIDENT', emoji: '⚠️', label: 'Incident', hint: 'Document what happened' },
  { value: 'OBSERVATION', emoji: '👁️', label: 'Observation', hint: 'Something you noticed' },
];

const templateContent: Record<string, string> = {
  SHIFT_HANDOFF: `Mood/State: \nMeals: \nMedications given: \nActivities: \nConcerns: \nNext steps: `,
  DOCTOR_VISIT: `Doctor: \nReason for visit: \nDiagnosis/Findings: \nNew medications: \nFollow-up: \nQuestions to ask next time: `,
  DAILY_UPDATE: `Overall mood: \nAppetite: \nSleep last night: \nActivities today: \nAnything concerning: `,
  INCIDENT: `What happened: \nWhen: \nWhere: \nAction taken: \nOutcome: \nFollow-up needed: `,
  OBSERVATION: `What I noticed: \nWhen: \nHow often: \nShould we mention to doctor? `,
};

export default function AddCareNoteScreen() {
  const { activeCircleId } = useCircleStore();
  const [type, setType] = useState('DAILY_UPDATE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!content || content === templateContent[type]) {
      setContent(templateContent[newType] || '');
    }
  };

  const handleSave = async () => {
    if (!title || !content || !activeCircleId) {
      Alert.alert('Required', 'Please enter a title and content.');
      return;
    }
    setSaving(true);
    try {
      await careNoteService.create(activeCircleId, { type, title, content, tags: tags || undefined });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Care Note</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Type Selector */}
        <Text style={styles.fieldLabel}>TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {noteTypes.map((nt) => (
            <TouchableOpacity
              key={nt.value}
              style={[styles.typeBtn, type === nt.value && styles.typeBtnActive]}
              onPress={() => handleTypeChange(nt.value)}
            >
              <Text style={{ fontSize: 24 }}>{nt.emoji}</Text>
              <Text style={[styles.typeLabel, type === nt.value && styles.typeLabelActive]}>{nt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={noteTypes.find(n => n.value === type)?.hint || 'Title'}
            placeholderTextColor={colors.textHint}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>NOTES</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Write your care note..."
            placeholderTextColor={colors.textHint}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TAGS (optional, comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g., pain, appetite, mood"
            placeholderTextColor={colors.textHint}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: Platform.OS === 'web' ? 24 : 56, paddingBottom: 12,
  },
  cancelBtn: { padding: 8 },
  cancelText: { ...typography.bodyMedium, color: colors.textSecondary },
  headerTitle: { ...typography.headingMedium, color: colors.textPrimary },
  saveBtn: { padding: 8 },
  saveText: { ...typography.headingMedium, color: colors.primary },
  scroll: { flex: 1, paddingHorizontal: 18 },
  typeScroll: { marginBottom: 20, maxHeight: 80 },
  typeBtn: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginRight: 10,
    borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.divider, gap: 4,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeLabel: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 10 },
  typeLabelActive: { color: colors.primary, fontWeight: '600' },
  field: { marginBottom: 18 },
  fieldLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1, marginBottom: 8, fontWeight: '700', fontSize: 11 },
  input: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    ...typography.bodyLarge, color: colors.textPrimary, borderWidth: 1, borderColor: colors.divider,
  },
  textArea: { minHeight: 200, paddingTop: 14 },
});
