import api from './api';

export const circleService = {
  create: (data: { name: string; careRecipient: string; recipientDob?: string }) =>
    api.post('/circles', data).then((r) => r.data),

  list: () => api.get('/circles').then((r) => r.data),

  get: (circleId: string) => api.get(`/circles/${circleId}`).then((r) => r.data),

  update: (circleId: string, data: any) =>
    api.patch(`/circles/${circleId}`, data).then((r) => r.data),

  delete: (circleId: string) => api.delete(`/circles/${circleId}`).then((r) => r.data),

  invite: (circleId: string, data: { email: string; role?: string }) =>
    api.post(`/circles/${circleId}/invite`, data).then((r) => r.data),

  join: (token: string) => api.post(`/circles/join/${token}`).then((r) => r.data),

  updateMemberRole: (circleId: string, memberId: string, role: string) =>
    api.patch(`/circles/${circleId}/members/${memberId}/role`, { role }).then((r) => r.data),

  removeMember: (circleId: string, memberId: string) =>
    api.delete(`/circles/${circleId}/members/${memberId}`).then((r) => r.data),
};
