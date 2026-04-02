import api from './api';

export const meetingService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/meetings`, data).then((r) => r.data),

  list: (circleId: string, status?: string) =>
    api.get(`/circles/${circleId}/meetings`, { params: { status } }).then((r) => r.data),

  get: (circleId: string, meetingId: string) =>
    api.get(`/circles/${circleId}/meetings/${meetingId}`).then((r) => r.data),

  update: (circleId: string, meetingId: string, data: any) =>
    api.patch(`/circles/${circleId}/meetings/${meetingId}`, data).then((r) => r.data),

  delete: (circleId: string, meetingId: string) =>
    api.delete(`/circles/${circleId}/meetings/${meetingId}`).then((r) => r.data),
};
