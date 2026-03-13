import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { taskService } from '../../services/tasks';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';

const priorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#E8F5E9', text: colors.success },
  MEDIUM: { bg: '#FFF3E0', text: colors.warning },
  HIGH: { bg: '#FFE0B2', text: '#FF8C00' },
  URGENT: { bg: '#FFEBEE', text: colors.danger },
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
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeCircleId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await taskService.update(activeCircleId, id, { status: 'COMPLETED' });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!activeCircleId) return;
          await taskService.delete(activeCircleId, id);
          router.back();
        },
      },
    ]);
  };

  if (loading) return <Spinner />;
  if (!task) return null;

  const pc = priorityColors[task.priority];

  return (
    <>
      <Stack.Screen options={{ title: 'Task Details' }} />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={styles.row}>
          <Badge label={task.priority} color={pc.bg} textColor={pc.text} />
          <Badge label={task.status} color={colors.primaryLight} textColor={colors.primary} />
        </View>

        {task.description && <Text style={styles.description}>{task.description}</Text>}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Due</Text>
          <Text style={styles.fieldValue}>
            {task.dueDate ? `${formatDate(task.dueDate)}${task.dueTime ? ` at ${formatTime(task.dueTime)}` : ''}` : 'No due date'}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Assigned to</Text>
          {task.assignedTo ? (
            <View style={styles.assigneeRow}>
              <Avatar name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`} uri={task.assignedTo.avatarUrl} size={24} />
              <Text style={styles.fieldValue}>{task.assignedTo.firstName} {task.assignedTo.lastName}</Text>
            </View>
          ) : (
            <Text style={styles.unassigned}>Unassigned</Text>
          )}
        </View>

        <View style={styles.actions}>
          {task.status !== 'COMPLETED' && (
            <Button title="Mark Complete" onPress={handleComplete} />
          )}
          <View style={{ height: 12 }} />
          <Button title="Delete Task" variant="danger" onPress={handleDelete} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  title: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: colors.textHint, marginBottom: 4 },
  fieldValue: { fontSize: 16, color: colors.textPrimary },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unassigned: { fontSize: 16, color: colors.textHint },
  actions: { marginTop: 32 },
});
