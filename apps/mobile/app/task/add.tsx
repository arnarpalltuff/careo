import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { createTaskSchema, CreateTaskForm } from '../../utils/validation';
import { useTasks } from '../../hooks/useTasks';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const priorityConfig: Record<string, { color: string; emoji: string; label: string }> = {
  LOW: { color: '#5CB85C', emoji: '🟢', label: 'Low' },
  MEDIUM: { color: '#F0AD4E', emoji: '🟡', label: 'Medium' },
  HIGH: { color: '#FF8C00', emoji: '🟠', label: 'High' },
  URGENT: { color: '#D9534F', emoji: '🔴', label: 'Urgent' },
};

export default function AddTaskScreen() {
  const { createTask } = useTasks();
  const [dueDateStr, setDueDateStr] = useState('');

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM' },
  });

  const selectedPriority = watch('priority');

  const [dateError, setDateError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (data: CreateTaskForm) => {
    if (dueDateStr) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dueDateStr) || isNaN(new Date(dueDateStr).getTime())) {
        setDateError('Enter a valid date (YYYY-MM-DD)');
        return;
      }
      const parsed = new Date(dueDateStr + 'T12:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed < today) {
        setDateError('Due date cannot be in the past');
        return;
      }
      setDateError('');
    }
    setSubmitError('');
    try {
      await createTask({
        ...data,
        dueDate: dueDateStr || undefined,
      });
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create task';
      if (err.response?.data?.code === 'upgrade_required') {
        Alert.alert('Upgrade Required', msg, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/subscription') },
        ]);
      } else {
        setSubmitError(msg);
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Task' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.heroRow}>
          <Text style={styles.heroEmoji}>✓</Text>
          <View>
            <Text style={styles.heroTitle}>New Task</Text>
            <Text style={styles.heroSub}>Assign something for your care team</Text>
          </View>
        </View>

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input label="What needs to be done?" value={value} onChangeText={onChange} error={errors.title?.message} placeholder="e.g. Pick up prescriptions" />
          )}
        />
        <View style={styles.gap} />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input label="Details (optional)" value={value || ''} onChangeText={onChange} multiline placeholder="Add any helpful context..." />
          )}
        />
        <View style={styles.gap16} />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {priorities.map((p) => {
            const cfg = priorityConfig[p];
            const isSelected = selectedPriority === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.priorityPill, isSelected && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                onPress={() => setValue('priority', p)}
                accessibilityRole="button"
                accessibilityLabel={`Priority: ${cfg.label}`}
              >
                <Text style={styles.priorityEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.priorityText, isSelected && { color: '#fff' }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.gap16} />

        <Text style={styles.label}>Due Date (optional)</Text>
        <TextInput
          style={[styles.dateInput, dateError ? { borderColor: colors.danger } : {}]}
          value={dueDateStr}
          onChangeText={(v) => { setDueDateStr(v); setDateError(''); }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textHint}
        />
        {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}
        {!dateError && dueDateStr.length === 0 && (
          <Text style={styles.dateHint}>Leave blank for no due date</Text>
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    backgroundColor: colors.tintTask,
    padding: 18,
    borderRadius: 18,
  },
  heroEmoji: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  heroTitle: { ...typography.headingLarge, color: colors.textPrimary },
  heroSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 14, marginBottom: 16 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },
  gap: { height: 12 },
  gap16: { height: 16 },
  gap32: { height: 32 },
  label: { ...typography.labelMedium, color: colors.textSecondary, marginBottom: 8 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityPill: {
    flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', gap: 4,
  },
  priorityEmoji: { fontSize: 14 },
  priorityText: { ...typography.labelSmall, color: colors.textSecondary, fontWeight: '600' },
  dateInput: {
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: 14, backgroundColor: '#fff',
    ...typography.bodyMedium, color: colors.textPrimary,
  },
  dateError: { ...typography.labelSmall, color: colors.danger, marginTop: 4 },
  dateHint: { ...typography.labelSmall, color: colors.textHint, marginTop: 4 },
});
