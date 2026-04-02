import api from './api';

export const predictiveInsightService = {
  generateInsights: (circleId: string) =>
    api.post(`/circles/${circleId}/predictive-insights/generate`).then((r) => r.data),

  getInsights: (circleId: string, acknowledged?: boolean) =>
    api.get(`/circles/${circleId}/predictive-insights`, { params: { acknowledged } }).then((r) => r.data),

  acknowledgeInsight: (circleId: string, insightId: string) =>
    api.patch(`/circles/${circleId}/predictive-insights/${insightId}/acknowledge`).then((r) => r.data),

  deleteInsight: (circleId: string, insightId: string) =>
    api.delete(`/circles/${circleId}/predictive-insights/${insightId}`).then((r) => r.data),
};
