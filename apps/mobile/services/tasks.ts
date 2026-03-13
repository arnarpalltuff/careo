import api from './api';

export const taskService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/tasks`, data).then((r) => r.data),

  list: (circleId: string, params?: { status?: string; assignedTo?: string; page?: number; limit?: number; sort?: string }) =>
    api.get(`/circles/${circleId}/tasks`, { params }).then((r) => r.data),

  get: (circleId: string, taskId: string) =>
    api.get(`/circles/${circleId}/tasks/${taskId}`).then((r) => r.data),

  update: (circleId: string, taskId: string, data: any) =>
    api.patch(`/circles/${circleId}/tasks/${taskId}`, data).then((r) => r.data),

  delete: (circleId: string, taskId: string) =>
    api.delete(`/circles/${circleId}/tasks/${taskId}`).then((r) => r.data),
};
