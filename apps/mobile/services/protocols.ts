import api from './api';

export const protocolService = {
  getTemplates: () =>
    api.get('/circles/_/protocols/templates').then((r) => r.data),

  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/protocols`, data).then((r) => r.data),

  list: (circleId: string, type?: string) =>
    api.get(`/circles/${circleId}/protocols`, { params: { type } }).then((r) => r.data),

  get: (circleId: string, protocolId: string) =>
    api.get(`/circles/${circleId}/protocols/${protocolId}`).then((r) => r.data),

  update: (circleId: string, protocolId: string, data: any) =>
    api.patch(`/circles/${circleId}/protocols/${protocolId}`, data).then((r) => r.data),

  delete: (circleId: string, protocolId: string) =>
    api.delete(`/circles/${circleId}/protocols/${protocolId}`).then((r) => r.data),
};
