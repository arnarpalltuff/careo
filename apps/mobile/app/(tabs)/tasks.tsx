import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../../utils/colors';
import { useTasks } from '../../hooks/useTasks';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

const filters = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
const filterLabels: Record<string, string> = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };

export default function TasksScreen() {
  const [activeFilter, setActiveFilter] = useState<string>('PENDING');
  const { tasks, loading, fetchTasks, completeTask } = useTasks();

  useEffect(() => {
    fetchTasks({ status: activeFilter });
  }, [activeFilter]);

  const handleComplete = async (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeTask(taskId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && tasks.length === 0 ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={`No ${filterLabels[activeFilter].toLowerCase()} tasks`}
          message="Tap + to create one."
          buttonTitle="Add Task"
          onPress={() => router.push('/task/add')}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => router.push(`/task/${item.id}`)}
              onComplete={() => handleComplete(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => fetchTasks({ status: activeFilter })} />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/task/add')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filterRow: { flexDirection: 'row', padding: 16, gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 14, color: colors.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
