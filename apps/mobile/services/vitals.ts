import api from './api';

export const vitalsService = {
  recordVital: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/vitals`, data).then((r) => r.data),

  getVitals: (circleId: string, params?: { type?: string; days?: number; limit?: number }) =>
    api.get(`/circles/${circleId}/vitals`, { params }).then((r) => r.data),

  getVitalTrends: (circleId: string, type: string, days?: number) =>
    api.get(`/circles/${circleId}/vitals/trends`, { params: { type, days } }).then((r) => r.data),

  deleteVital: (circleId: string, vitalId: string) =>
    api.delete(`/circles/${circleId}/vitals/${vitalId}`).then((r) => r.data),
};
