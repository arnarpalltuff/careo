import api from './api';

export const cognitiveService = {
  getExercises: (params?: { category?: string; difficulty?: string }) =>
    api.get(`/circles/_/cognitive/exercises`, { params }).then((r) => r.data),

  recordSession: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/cognitive/sessions`, data).then((r) => r.data),

  getSessions: (circleId: string, params?: { userId?: string; days?: number }) =>
    api.get(`/circles/${circleId}/cognitive/sessions`, { params }).then((r) => r.data),

  getReport: (circleId: string, params?: { userId?: string; days?: number }) =>
    api.get(`/circles/${circleId}/cognitive/report`, { params }).then((r) => r.data),
};
