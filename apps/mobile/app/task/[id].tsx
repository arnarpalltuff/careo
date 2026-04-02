import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { impactMedium } from '../../utils/haptics';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { taskService } from '../../services/tasks';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';

const priorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#E8F5E9', text: '#5CB85C' },
  MEDIUM: { bg: '#FFF3E0', text: '#F0AD4E' },
  HIGH: { bg: '#FFE0B2', text: '#FF8C00' },
  URGENT: { bg: '#FFEBEE', text: '#D9534F' },
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeCircleId } = useCircleStore();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    if (!activeCircleId) return;
    try {
      const data = await taskService.get(activeCircleId, id);
      setTask(data.task);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeCircleId) return;
    try {
      impactMedium();
      await taskService.update(activeCircleId, id, { status: 'COMPLETED' });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!activeCircleId) return;
          try {
            await taskService.delete(activeCircleId, id);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete task. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) return <Spinner />;
  if (!task) return <View style={styles.container}><Text style={styles.empty}>Task not found</Text></View>;

  const pc = priorityColors[task.priority] || priorityColors.MEDIUM;
  const isOverdue = task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);
  const statusLabel = task.status === 'COMPLETED' ? 'Done' : task.status === 'IN_PROGRESS' ? 'In Progress' : 'To Do';

  return (
    <>
      <Stack.Screen options={{ title: 'Task Details' }} />
      <ScrollView style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.row}>
            <Badge label={task.priority} color={pc.bg} textColor={pc.text} />
            <Badge label={statusLabel} color={task.status === 'COMPLETED' ? '#E7F9EE' : colors.primaryLight} textColor={task.status === 'COMPLETED' ? colors.success : colors.primary} />
            {isOverdue && <Badge label="Overdue" color="#FEE2E2" textColor={colors.danger} />}
          </View>
          <Text style={[styles.title, task.status === 'COMPLETED' && styles.titleDone]}>{task.title}</Text>
          {task.description && <Text style={styles.description}>{task.description}</Text>}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <View>
              <Text style={styles.fieldLabel}>Due Date</Text>
              <Text style={[styles.fieldValue, isOverdue && styles.fieldOverdue]}>
                {task.dueDate ? `${formatDate(task.dueDate)}${task.dueTime ? ` at ${formatTime(task.dueTime)}` : ''}` : 'No due date'}
              </Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <View>
              <Text style={styles.fieldLabel}>Assigned to</Text>
              {task.assignedTo ? (
                <View style={styles.assigneeRow}>
                  <Avatar name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`} uri={task.assignedTo.avatarUrl} size={22} />
                  <Text style={styles.fieldValue}>{task.assignedTo.firstName} {task.assignedTo.lastName}</Text>
                </View>
              ) : (
                <Text style={styles.unassigned}>Unassigned</Text>
              )}
            </View>
          </View>
          {task.createdBy && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>✏️</Text>
                <View>
                  <Text style={styles.fieldLabel}>Created by</Text>
                  <Text style={styles.fieldValue}>{task.createdBy.firstName} {task.createdBy.lastName}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.actions}>
          {task.status !== 'COMPLETED' && <Button title="Mark Complete" onPress={handleComplete} />}
          <View style={{ height: 12 }} />
          <Button title="Delete Task" variant="danger" onPress={handleDelete} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { ...typography.displaySmall, color: colors.textPrimary, marginTop: 12 },
  titleDone: { textDecorationLine: 'line-through', color: colors.textHint },
  row: { flexDirection: 'row', gap: 8 },
  description: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: 10, lineHeight: 22 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  infoIcon: { fontSize: 22 },
  infoDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  fieldLabel: { ...typography.labelSmall, color: colors.textHint, marginBottom: 2 },
  fieldValue: { ...typography.headingSmall, color: colors.textPrimary },
  fieldOverdue: { color: colors.danger },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unassigned: { ...typography.headingSmall, color: colors.textHint },
  actions: { marginTop: 18 },
  empty: { ...typography.labelLarge, color: colors.textHint, textAlign: 'center', marginTop: 48 },
});
