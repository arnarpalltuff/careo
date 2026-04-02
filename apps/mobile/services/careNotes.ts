import api from './api';

export const careNoteService = {
  create: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/care-notes`, data).then((r) => r.data),

  list: (circleId: string, params?: { type?: string; pinned?: boolean; page?: number }) =>
    api.get(`/circles/${circleId}/care-notes`, { params }).then((r) => r.data),

  get: (circleId: string, noteId: string) =>
    api.get(`/circles/${circleId}/care-notes/${noteId}`).then((r) => r.data),

  update: (circleId: string, noteId: string, data: any) =>
    api.patch(`/circles/${circleId}/care-notes/${noteId}`, data).then((r) => r.data),

  delete: (circleId: string, noteId: string) =>
    api.delete(`/circles/${circleId}/care-notes/${noteId}`).then((r) => r.data),
};
