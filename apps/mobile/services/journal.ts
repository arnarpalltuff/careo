import api from './api';

export const journalService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/journal`, data).then((r) => r.data),

  list: (circleId: string, params?: { from?: string; to?: string; page?: number; limit?: number }) =>
    api.get(`/circles/${circleId}/journal`, { params }).then((r) => r.data),

  get: (circleId: string, entryId: string) =>
    api.get(`/circles/${circleId}/journal/${entryId}`).then((r) => r.data),

  update: (circleId: string, entryId: string, data: any) =>
    api.patch(`/circles/${circleId}/journal/${entryId}`, data).then((r) => r.data),

  delete: (circleId: string, entryId: string) =>
    api.delete(`/circles/${circleId}/journal/${entryId}`).then((r) => r.data),
};
