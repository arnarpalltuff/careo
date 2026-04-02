import api from './api';

export const drugInteractionService = {
  checkInteractions: (circleId: string) =>
    api.get(`/circles/${circleId}/drug-interactions/check`).then((r) => r.data),

  checkNewMedication: (circleId: string, medicationName: string) =>
    api.post(`/circles/${circleId}/drug-interactions/check-new`, { medicationName }).then((r) => r.data),
};
