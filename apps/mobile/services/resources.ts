import api from './api';

export const resourceService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/resources`, data).then((r) => r.data),

  list: (circleId: string, params?: { category?: string; search?: string; page?: number }) =>
    api.get(`/circles/${circleId}/resources`, { params }).then((r) => r.data),

  update: (circleId: string, resourceId: string, data: any) =>
    api.patch(`/circles/${circleId}/resources/${resourceId}`, data).then((r) => r.data),

  delete: (circleId: string, resourceId: string) =>
    api.delete(`/circles/${circleId}/resources/${resourceId}`).then((r) => r.data),
};
