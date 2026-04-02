import api from './api';

export const burnoutService = {
  createAssessment: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/burnout/assessment`, data).then((r) => r.data),

  getAssessments: (circleId: string, limit?: number) =>
    api.get(`/circles/${circleId}/burnout/assessments`, { params: { limit } }).then((r) => r.data),

  getOverview: (circleId: string) =>
    api.get(`/circles/${circleId}/burnout/overview`).then((r) => r.data),

  getRespiteReminders: () =>
    api.get('/circles/_/burnout/respite').then((r) => r.data),

  dismissReminder: (reminderId: string) =>
    api.patch(`/circles/_/burnout/respite/${reminderId}/dismiss`).then((r) => r.data),
};
