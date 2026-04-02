import { useState, useCallback } from 'react';
import { taskService } from '../services/tasks';
import { useCircleStore } from '../stores/circleStore';
import { isDemoMode, DEMO_TASKS } from '../utils/demoData';

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { activeCircleId } = useCircleStore();

  const fetchTasks = useCallback(
    async (params?: { status?: string; assignedTo?: string; page?: number }) => {
      if (!activeCircleId) return;
      if (isDemoMode()) {
        const filtered = params?.status
          ? DEMO_TASKS.filter((t) => t.status === params.status)
          : DEMO_TASKS;
        setTasks(filtered);
        setTotal(filtered.length);
        return;
      }
      setLoading(true);
      try {
        const data = await taskService.list(activeCircleId, params);
        setTasks(data.tasks);
        setTotal(data.total);
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    },
    [activeCircleId]
  );

  const createTask = async (data: any) => {
    if (!activeCircleId) return;
    const result = await taskService.create(activeCircleId, data);
    await fetchTasks();
    return result.task;
  };

  const completeTask = async (taskId: string) => {
    if (!activeCircleId) return;
    await taskService.update(activeCircleId, taskId, { status: 'COMPLETED' });
    await fetchTasks();
  };

  const updateTask = async (taskId: string, data: any) => {
    if (!activeCircleId) return;
    await taskService.update(activeCircleId, taskId, data);
    await fetchTasks();
  };

  const deleteTask = async (taskId: string) => {
    if (!activeCircleId) return;
    await taskService.delete(activeCircleId, taskId);
    await fetchTasks();
  };

  return { tasks, total, loading, fetchTasks, createTask, completeTask, updateTask, deleteTask };
}
