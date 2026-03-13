import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { colors } from '../../utils/colors';
import { createTaskSchema, CreateTaskForm } from '../../utils/validation';
import { useTasks } from '../../hooks/useTasks';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const priorityColors: Record<string, string> = { LOW: colors.success, MEDIUM: colors.warning, HIGH: '#FF8C00', URGENT: colors.danger };

export default function AddTaskScreen() {
  const { createTask } = useTasks();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM' },
  });

  const selectedPriority = watch('priority');

  const onSubmit = async (data: CreateTaskForm) => {
    await createTask({
      ...data,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Task' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input label="Title" value={value} onChangeText={onChange} error={errors.title?.message} />
          )}
        />
        <View style={styles.gap} />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input label="Description" value={value || ''} onChangeText={onChange} multiline placeholder="Add details..." />
          )}
        />
        <View style={styles.gap16} />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityPill, selectedPriority === p && { backgroundColor: priorityColors[p], borderColor: priorityColors[p] }]}
              onPress={() => setValue('priority', p)}
            >
              <Text style={[styles.priorityText, selectedPriority === p && { color: '#fff' }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.gap16} />

        <Text style={styles.label}>Due Date</Text>
        <TouchableOpacity style={styles.dateField} onPress={() => setShowDatePicker(true)}>
          <Text style={dueDate ? styles.dateText : styles.datePlaceholder}>
            {dueDate ? format(dueDate, 'EEE, MMM d, yyyy') : 'Select date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setDueDate(date);
            }}
          />
        )}

        <View style={styles.gap32} />
        <Button title="Create Task" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
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
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  priorityText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  dateField: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  dateText: { fontSize: 16, color: colors.textPrimary },
  datePlaceholder: { fontSize: 16, color: colors.textHint },
});
