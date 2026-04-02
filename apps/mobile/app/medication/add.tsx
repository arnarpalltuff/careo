import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { createMedicationSchema, CreateMedicationForm } from '../../utils/validation';
import { useMedications } from '../../hooks/useMedications';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const quickSchedules = [
  { label: 'Once daily', schedules: [{ time: '08:00', label: 'Morning' }] },
  { label: 'Twice daily', schedules: [{ time: '08:00', label: 'Morning' }, { time: '20:00', label: 'Evening' }] },
  { label: 'Three times', schedules: [{ time: '08:00', label: 'Morning' }, { time: '14:00', label: 'Afternoon' }, { time: '20:00', label: 'Evening' }] },
];

export default function AddMedicationScreen() {
  const { createMedication } = useMedications();
  const [schedules, setSchedules] = useState([{ time: '08:00', label: 'Morning' }]);
  const [submitError, setSubmitError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateMedicationForm>({
    resolver: zodResolver(createMedicationSchema),
    defaultValues: { name: '', dosage: '', frequency: '', schedules: [{ time: '08:00', label: 'Morning' }] },
  });

  const addSchedule = () => {
    setSchedules([...schedules, { time: '12:00', label: 'Afternoon' }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length <= 1) return;
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateMedicationForm) => {
    setSubmitError('');
    try {
      await createMedication({ ...data, schedules });
      router.back();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to add medication');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Medication' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.heroRow}>
          <Text style={styles.heroEmoji}>💊</Text>
          <View>
            <Text style={styles.heroTitle}>Add Medication</Text>
            <Text style={styles.heroSub}>Track doses and set reminders</Text>
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <Controller control={control} name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="Medication name" placeholder="e.g. Lisinopril" value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />
        <View style={styles.gap} />
        <View style={styles.rowFields}>
          <View style={styles.rowFieldHalf}>
            <Controller control={control} name="dosage"
              render={({ field: { onChange, value } }) => (
                <Input label="Dosage" placeholder="10mg" value={value} onChangeText={onChange} error={errors.dosage?.message} />
              )}
            />
          </View>
          <View style={styles.rowFieldHalf}>
            <Controller control={control} name="frequency"
              render={({ field: { onChange, value } }) => (
                <Input label="Frequency" placeholder="Twice daily" value={value} onChangeText={onChange} error={errors.frequency?.message} />
              )}
            />
          </View>
        </View>
        <View style={styles.gap} />
        <Controller control={control} name="instructions"
          render={({ field: { onChange, value } }) => (
            <Input label="Instructions (optional)" placeholder="Take with food, avoid grapefruit..." value={value || ''} onChangeText={onChange} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="prescriber"
          render={({ field: { onChange, value } }) => (
            <Input label="Prescriber (optional)" placeholder="Dr. Smith" value={value || ''} onChangeText={onChange} />
          )}
        />

        <View style={styles.gap16} />
        <Text style={styles.sectionLabel}>SCHEDULE</Text>
        <View style={styles.quickRow}>
          {quickSchedules.map((qs) => (
            <TouchableOpacity
              key={qs.label}
              style={[styles.quickPill, schedules.length === qs.schedules.length && styles.quickPillActive]}
              onPress={() => setSchedules(qs.schedules.map(s => ({ ...s })))}
              accessibilityRole="button"
            >
              <Text style={[styles.quickPillText, schedules.length === qs.schedules.length && styles.quickPillTextActive]}>{qs.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.scheduleCard}>
          {schedules.map((s, i) => (
            <View key={i} style={[styles.scheduleRow, i < schedules.length - 1 && styles.scheduleRowBorder]}>
              <View style={styles.scheduleTimeWrap}>
                <Input
                  label="Time"
                  value={s.time}
                  onChangeText={(t) => {
                    const updated = [...schedules];
                    updated[i].time = t;
                    setSchedules(updated);
                  }}
                />
              </View>
              <View style={styles.scheduleLabelWrap}>
                <Input
                  label="Label"
                  value={s.label}
                  onChangeText={(l) => {
                    const updated = [...schedules];
                    updated[i].label = l;
                    setSchedules(updated);
                  }}
                />
              </View>
              {schedules.length > 1 && (
                <TouchableOpacity onPress={() => removeSchedule(i)} style={styles.removeBtn} accessibilityLabel="Remove time">
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={addSchedule} style={styles.addTimeBtn} accessibilityRole="button">
          <Text style={styles.addTimeBtnText}>+ Add another time</Text>
        </TouchableOpacity>

        <View style={styles.gap32} />
        <Button title="Add Medication" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        <View style={styles.gap32} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    backgroundColor: colors.tintMed,
    padding: 18,
    borderRadius: 18,
  },
  heroEmoji: { fontSize: 28 },
  heroTitle: { ...typography.headingLarge, color: colors.textPrimary },
  heroSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 14, marginBottom: 16 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },
  gap: { height: 12 },
  gap16: { height: 16 },
  gap32: { height: 32 },
  rowFields: { flexDirection: 'row', gap: 12 },
  rowFieldHalf: { flex: 1 },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 10,
    fontSize: 11,
  },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickPill: {
    flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff',
  },
  quickPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  quickPillText: { ...typography.labelSmall, color: colors.textSecondary, fontWeight: '600' },
  quickPillTextActive: { color: '#fff' },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  scheduleRow: { flexDirection: 'row', gap: 8, padding: 14, alignItems: 'flex-end' },
  scheduleRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  scheduleTimeWrap: { flex: 1 },
  scheduleLabelWrap: { flex: 2 },
  removeBtn: { paddingBottom: 14, paddingLeft: 4 },
  removeText: { fontSize: 18, color: colors.danger, fontWeight: '600' },
  addTimeBtn: { marginTop: 10 },
  addTimeBtnText: { ...typography.headingSmall, color: colors.primary },
});
