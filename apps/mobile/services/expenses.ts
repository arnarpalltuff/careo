import api from './api';

export const expenseService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/expenses`, data).then((r) => r.data),

  list: (circleId: string, params?: { category?: string; startDate?: string; endDate?: string; page?: number }) =>
    api.get(`/circles/${circleId}/expenses`, { params }).then((r) => r.data),

  getSummary: (circleId: string, months?: number) =>
    api.get(`/circles/${circleId}/expenses/summary`, { params: { months } }).then((r) => r.data),

  settlesSplit: (circleId: string, splitId: string) =>
    api.patch(`/circles/${circleId}/expenses/splits/${splitId}/settle`).then((r) => r.data),

  delete: (circleId: string, expenseId: string) =>
    api.delete(`/circles/${circleId}/expenses/${expenseId}`).then((r) => r.data),
};
