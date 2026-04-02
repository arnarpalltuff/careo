import api from './api';

export const transitionService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/transitions`, data).then((r) => r.data),

  list: (circleId: string, status?: string) =>
    api.get(`/circles/${circleId}/transitions`, { params: { status } }).then((r) => r.data),

  get: (circleId: string, transitionId: string) =>
    api.get(`/circles/${circleId}/transitions/${transitionId}`).then((r) => r.data),

  update: (circleId: string, transitionId: string, data: any) =>
    api.patch(`/circles/${circleId}/transitions/${transitionId}`, data).then((r) => r.data),

  delete: (circleId: string, transitionId: string) =>
    api.delete(`/circles/${circleId}/transitions/${transitionId}`).then((r) => r.data),
};
