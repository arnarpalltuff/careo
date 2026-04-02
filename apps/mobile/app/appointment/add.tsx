import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { createAppointmentSchema, CreateAppointmentForm } from '../../utils/validation';
import { useAppointments } from '../../hooks/useAppointments';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const reminders = [
  { label: '15 min', value: 15, emoji: '⏱' },
  { label: '30 min', value: 30, emoji: '⏱' },
  { label: '1 hour', value: 60, emoji: '🕐' },
  { label: '1 day', value: 1440, emoji: '📅' },
];

export default function AddAppointmentScreen() {
  const { createAppointment } = useAppointments();
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [selectedReminder, setSelectedReminder] = useState(60);
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: { title: '', date: '', time: '', reminder: 60 },
  });

  const onSubmit = async (data: CreateAppointmentForm) => {
    let hasError = false;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
      setDateError('Enter a valid date (YYYY-MM-DD)');
      hasError = true;
    } else {
      setDateError('');
    }
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
      setTimeError('Enter a valid time (HH:MM)');
      hasError = true;
    } else {
      setTimeError('');
    }
    if (hasError) return;

    setSubmitError('');
    try {
      await createAppointment({
        ...data,
        date: dateStr,
        time: timeStr,
        reminder: selectedReminder,
      });
      router.back();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to create appointment');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Appointment' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.heroRow}>
          <Text style={styles.heroEmoji}>🩺</Text>
          <View>
            <Text style={styles.heroTitle}>New Appointment</Text>
            <Text style={styles.heroSub}>Schedule a visit or procedure</Text>
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <Controller control={control} name="title"
          render={({ field: { onChange, value } }) => (
            <Input label="What's the appointment for?" placeholder="Dr. Smith — Cardiology" value={value} onChangeText={onChange} error={errors.title?.message} />
          )}
        />
        <View style={styles.gap} />

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeCol}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={[styles.dateInput, dateError ? { borderColor: colors.danger } : {}]}
              value={dateStr}
              onChangeText={(v) => { setDateStr(v); setDateError(''); }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textHint}
            />
            {dateError ? <Text style={styles.fieldError}>{dateError}</Text> : null}
          </View>
          <View style={styles.dateTimeCol}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              style={[styles.dateInput, timeError ? { borderColor: colors.danger } : {}]}
              value={timeStr}
              onChangeText={(v) => { setTimeStr(v); setTimeError(''); }}
              placeholder="HH:MM"
              placeholderTextColor={colors.textHint}
            />
            {timeError ? <Text style={styles.fieldError}>{timeError}</Text> : null}
          </View>
        </View>
        <View style={styles.gap} />

        <Controller control={control} name="doctor"
          render={({ field: { onChange, value } }) => (
            <Input label="Doctor (optional)" placeholder="Dr. Smith" value={value || ''} onChangeText={onChange} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="location"
          render={({ field: { onChange, value } }) => (
            <Input label="Location (optional)" placeholder="123 Main St or Telehealth" value={value || ''} onChangeText={onChange} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="notes"
          render={({ field: { onChange, value } }) => (
            <Input label="Notes (optional)" placeholder="Bring insurance card, fasting required..." value={value || ''} onChangeText={onChange} multiline />
          )}
        />
        <View style={styles.gap16} />

        <Text style={styles.label}>Remind me</Text>
        <View style={styles.reminderRow}>
          {reminders.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.pill, selectedReminder === r.value && styles.pillActive]}
              onPress={() => setSelectedReminder(r.value)}
              accessibilityRole="button"
              accessibilityLabel={`Remind ${r.label} before`}
            >
              <Text style={styles.pillEmoji}>{r.emoji}</Text>
              <Text style={[styles.pillText, selectedReminder === r.value && styles.pillTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.gap32} />
        <Button title="Create Appointment" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
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
    backgroundColor: colors.tintAppt,
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
  label: { ...typography.labelMedium, color: colors.textSecondary, marginBottom: 8 },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateTimeCol: { flex: 1 },
  dateInput: {
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: 14, backgroundColor: '#fff',
    ...typography.bodyMedium, color: colors.textPrimary,
  },
  fieldError: { ...typography.labelSmall, color: colors.danger, marginTop: 4 },
  reminderRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', gap: 4,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillEmoji: { fontSize: 14 },
  pillText: { ...typography.labelSmall, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
});
