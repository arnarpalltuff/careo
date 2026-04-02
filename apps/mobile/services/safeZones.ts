import api from './api';

export const safeZoneService = {
  createSafeZone: (circleId: string, data: any) =>
    api.post(`/circles/${circleId}/safe-zones`, data).then((r) => r.data),

  getSafeZones: (circleId: string) =>
    api.get(`/circles/${circleId}/safe-zones`).then((r) => r.data),

  updateSafeZone: (circleId: string, zoneId: string, data: any) =>
    api.patch(`/circles/${circleId}/safe-zones/${zoneId}`, data).then((r) => r.data),

  deleteSafeZone: (circleId: string, zoneId: string) =>
    api.delete(`/circles/${circleId}/safe-zones/${zoneId}`).then((r) => r.data),

  updateLocation: (circleId: string, data: { latitude: number; longitude: number; accuracy?: number; battery?: number }) =>
    api.post(`/circles/${circleId}/safe-zones/location`, data).then((r) => r.data),

  getLocationHistory: (circleId: string, params?: { userId?: string; hours?: number }) =>
    api.get(`/circles/${circleId}/safe-zones/location/history`, { params }).then((r) => r.data),

  getLatestLocations: (circleId: string) =>
    api.get(`/circles/${circleId}/safe-zones/location/latest`).then((r) => r.data),
};
