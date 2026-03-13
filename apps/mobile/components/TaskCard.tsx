import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { formatDate, formatTime } from '../utils/formatDate';
import { Avatar } from './ui/Avatar';

const priorityColors: Record<string, string> = {
  LOW: colors.success,
  MEDIUM: colors.warning,
  HIGH: '#FF8C00',
  URGENT: colors.danger,
};

interface TaskCardProps {
  task: any;
  onPress: () => void;
  onComplete: () => void;
}

export function TaskCard({ task, onPress, onComplete }: TaskCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.priorityBar, { backgroundColor: priorityColors[task.priority] }]} />
      <View style={styles.content}>
        <View style={styles.main}>
          <Text style={[styles.title, task.status === 'COMPLETED' && styles.completed]}>
            {task.title}
          </Text>
          {task.dueDate && (
            <Text style={styles.due}>
              Due {formatDate(task.dueDate)}
              {task.dueTime ? ` at ${formatTime(task.dueTime)}` : ''}
            </Text>
          )}
          {!task.dueDate && <Text style={styles.due}>No due date</Text>}
          <View style={styles.assignee}>
            {task.assignedTo ? (
              <>
                <Avatar
                  name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                  uri={task.assignedTo.avatarUrl}
                  size={20}
                />
                <Text style={styles.assigneeName}>{task.assignedTo.firstName}</Text>
              </>
            ) : (
              <Text style={styles.unassigned}>Unassigned</Text>
            )}
          </View>
        </View>
        {task.status !== 'COMPLETED' && (
          <TouchableOpacity style={styles.checkbox} onPress={onComplete}>
            <View style={styles.checkboxInner} />
          </TouchableOpacity>
        )}
        {task.status === 'COMPLETED' && (
          <View style={styles.checkboxDone}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  main: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: colors.textHint,
  },
  due: {
    fontSize: 13,
    color: colors.textHint,
    marginBottom: 6,
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  unassigned: {
    fontSize: 13,
    color: colors.textHint,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxInner: {},
  checkboxDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
