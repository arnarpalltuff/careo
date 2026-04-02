import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { formatDate, formatTime } from '../utils/formatDate';
import { Avatar } from './ui/Avatar';

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: colors.success, bg: '#E7F9EE', label: 'Low' },
  MEDIUM: { color: colors.warning, bg: '#FFF8EB', label: 'Med' },
  HIGH: { color: '#FF8C00', bg: '#FFF3E6', label: 'High' },
  URGENT: { color: colors.danger, bg: '#FEE2E2', label: 'Urgent' },
};

interface TaskCardProps {
  task: any;
  onPress: () => void;
  onComplete: () => void;
}

export function TaskCard({ task, onPress, onComplete }: TaskCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const isOverdue = task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={task.title}>
      <View style={styles.top}>
        <View style={[styles.priorityPill, { backgroundColor: priority.bg }]}>
          <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
          <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
        </View>
        {task.status !== 'COMPLETED' ? (
          <TouchableOpacity style={styles.checkbox} onPress={onComplete} accessibilityRole="button" accessibilityLabel={`Complete ${task.title}`}>
            <View style={styles.checkboxRing} />
          </TouchableOpacity>
        ) : (
          <View style={styles.checkboxDone}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, task.status === 'COMPLETED' && styles.completed]}>
        {task.title}
      </Text>
      <View style={styles.meta}>
        <Text style={[styles.due, isOverdue && styles.overdue]}>
          {isOverdue && '⚠ Overdue · '}
          {task.dueDate ? `${formatDate(task.dueDate)}${task.dueTime ? ` · ${formatTime(task.dueTime)}` : ''}` : 'No due date'}
        </Text>
        {task.assignedTo && (
          <View style={styles.assignee}>
            <Avatar name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`} uri={task.assignedTo.avatarUrl} size={18} />
            <Text style={styles.assigneeName}>{task.assignedTo.firstName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  priorityText: {
    ...typography.labelSmall,
    fontWeight: '700',
    fontSize: 11,
  },
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: colors.textHint,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  due: {
    ...typography.bodySmall,
    color: colors.textHint,
  },
  overdue: {
    color: colors.danger,
    fontWeight: '600',
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assigneeName: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.border,
  },
  checkboxDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
