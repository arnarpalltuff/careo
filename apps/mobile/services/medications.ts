import api from './api';

export const medicationService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/medications`, data).then((r) => r.data),

  list: (circleId: string, active?: boolean) =>
    api.get(`/circles/${circleId}/medications`, { params: { active } }).then((r) => r.data),

  get: (circleId: string, medId: string) =>
    api.get(`/circles/${circleId}/medications/${medId}`).then((r) => r.data),

  update: (circleId: string, medId: string, data: any) =>
    api.patch(`/circles/${circleId}/medications/${medId}`, data).then((r) => r.data),

  delete: (circleId: string, medId: string) =>
    api.delete(`/circles/${circleId}/medications/${medId}`).then((r) => r.data),

  logDose: (circleId: string, medId: string, data: { scheduledFor: string; status: 'TAKEN' | 'SKIPPED'; skippedReason?: string }) =>
    api.post(`/circles/${circleId}/medications/${medId}/log`, data).then((r) => r.data),

  getLogs: (circleId: string, medId: string, params?: { from?: string; to?: string }) =>
    api.get(`/circles/${circleId}/medications/${medId}/logs`, { params }).then((r) => r.data),
};
