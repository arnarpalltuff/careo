import api from './api';

export const kudosService = {
  send: (circleId: string, data: { toUserId: string; message: string; emoji?: string }) =>
    api.post(`/circles/${circleId}/kudos`, data).then((r) => r.data),

  list: (circleId: string, params?: { userId?: string; page?: number }) =>
    api.get(`/circles/${circleId}/kudos`, { params }).then((r) => r.data),

  leaderboard: (circleId: string) =>
    api.get(`/circles/${circleId}/kudos/leaderboard`).then((r) => r.data),
};
