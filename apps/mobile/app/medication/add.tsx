import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { createMedicationSchema, CreateMedicationForm } from '../../utils/validation';
import { useMedications } from '../../hooks/useMedications';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function AddMedicationScreen() {
  const { createMedication } = useMedications();
  const [schedules, setSchedules] = useState([{ time: '08:00', label: 'Morning' }]);

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
    await createMedication({ ...data, schedules });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Medication' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="Medication name" placeholder="Lisinopril" value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="dosage"
          render={({ field: { onChange, value } }) => (
            <Input label="Dosage" placeholder="10mg" value={value} onChangeText={onChange} error={errors.dosage?.message} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="frequency"
          render={({ field: { onChange, value } }) => (
            <Input label="Frequency" placeholder="Twice daily" value={value} onChangeText={onChange} error={errors.frequency?.message} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="instructions"
          render={({ field: { onChange, value } }) => (
            <Input label="Instructions (optional)" placeholder="Take with food" value={value || ''} onChangeText={onChange} />
          )}
        />
        <View style={styles.gap} />
        <Controller control={control} name="prescriber"
          render={({ field: { onChange, value } }) => (
            <Input label="Prescriber (optional)" placeholder="Dr. Smith" value={value || ''} onChangeText={onChange} />
          )}
        />

        <View style={styles.gap16} />
        <Text style={styles.label}>Schedule Times</Text>
        {schedules.map((s, i) => (
          <View key={i} style={styles.scheduleRow}>
            <Input
              label="Time"
              value={s.time}
              onChangeText={(t) => {
                const updated = [...schedules];
                updated[i].time = t;
                setSchedules(updated);
              }}
              style={styles.timeInput}
            />
            <Input
              label="Label"
              value={s.label}
              onChangeText={(l) => {
                const updated = [...schedules];
                updated[i].label = l;
                setSchedules(updated);
              }}
              style={styles.labelInput}
            />
            {schedules.length > 1 && (
              <TouchableOpacity onPress={() => removeSchedule(i)} style={styles.removeBtn}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addSchedule}>
          <Text style={styles.addSchedule}>+ Add time</Text>
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
  gap: { height: 12 },
  gap16: { height: 16 },
  gap32: { height: 32 },
  label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  scheduleRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-end' },
  timeInput: { flex: 1 },
  labelInput: { flex: 2 },
  removeBtn: { paddingBottom: 14 },
  removeText: { fontSize: 24, color: colors.danger },
  addSchedule: { fontSize: 15, fontWeight: '600', color: colors.primary, marginTop: 4 },
});
