import api from './api';

export const checkInService = {
  createCheckIn: (circleId: string) =>
    api.post(`/circles/${circleId}/check-ins`).then((r) => r.data),

  respondToCheckIn: (circleId: string, checkInId: string, data: { status: 'OK' | 'NEEDS_HELP'; notes?: string }) =>
    api.patch(`/circles/${circleId}/check-ins/${checkInId}/respond`, data).then((r) => r.data),

  getCheckIns: (circleId: string, days?: number) =>
    api.get(`/circles/${circleId}/check-ins`, { params: { days } }).then((r) => r.data),

  getTodayCheckIns: (circleId: string) =>
    api.get(`/circles/${circleId}/check-ins/today`).then((r) => r.data),
};
