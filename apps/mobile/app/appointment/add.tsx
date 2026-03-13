import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { colors } from '../../utils/colors';
import { createAppointmentSchema, CreateAppointmentForm } from '../../utils/validation';
import { useAppointments } from '../../hooks/useAppointments';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const reminders = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1 day', value: 1440 },
];

export default function AddAppointmentScreen() {
  const { createAppointment } = useAppointments();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [selectedReminder, setSelectedReminder] = useState(60);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: { title: '', date: '', time: '', reminder: 60 },
  });

  const onSubmit = async (data: CreateAppointmentForm) => {
    await createAppointment({
      ...data,
      date: date.toISOString(),
      time: format(time, 'HH:mm'),
      reminder: selectedReminder,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Appointment' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="title"
          render={({ field: { onChange, value } }) => (
            <Input label="Title" placeholder="Dr. Smith — Cardiology" value={value} onChangeText={onChange} error={errors.title?.message} />
          )}
        />
        <View style={styles.gap} />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateField} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{format(date, 'EEE, MMM d, yyyy')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" onChange={(_, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setDate(d); }} />
        )}
        <View style={styles.gap} />

        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.dateField} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dateText}>{format(time, 'h:mm a')}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker value={time} mode="time" onChange={(_, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setTime(t); }} />
        )}
        <View style={styles.gap} />

        <Controller control={control} name="location"
          render={({ field: { onChange, value } }) => (
            <Input label="Location (optional)" placeholder="123 Main St or Telehealth" value={value || ''} onChangeText={onChange} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="doctor"
          render={({ field: { onChange, value } }) => (
            <Input label="Doctor (optional)" value={value || ''} onChangeText={onChange} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="notes"
          render={({ field: { onChange, value } }) => (
            <Input label="Notes (optional)" placeholder="Bring insurance card..." value={value || ''} onChangeText={onChange} multiline />
          )}
        />
        <View style={styles.gap16} />

        <Text style={styles.label}>Reminder</Text>
        <View style={styles.reminderRow}>
          {reminders.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.pill, selectedReminder === r.value && styles.pillActive]}
              onPress={() => setSelectedReminder(r.value)}
            >
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
  gap: { height: 12 },
  gap16: { height: 16 },
  gap32: { height: 32 },
  label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  dateField: { paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface },
  dateText: { fontSize: 16, color: colors.textPrimary },
  reminderRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, color: colors.textSecondary },
  pillTextActive: { color: '#fff', fontWeight: '600' },
});
