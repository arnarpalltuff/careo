import api from './api';

export const appointmentService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/appointments`, data).then((r) => r.data),

  list: (circleId: string, params?: { from?: string; to?: string; status?: string }) =>
    api.get(`/circles/${circleId}/appointments`, { params }).then((r) => r.data),

  get: (circleId: string, apptId: string) =>
    api.get(`/circles/${circleId}/appointments/${apptId}`).then((r) => r.data),

  update: (circleId: string, apptId: string, data: any) =>
    api.patch(`/circles/${circleId}/appointments/${apptId}`, data).then((r) => r.data),

  delete: (circleId: string, apptId: string) =>
    api.delete(`/circles/${circleId}/appointments/${apptId}`).then((r) => r.data),
};
