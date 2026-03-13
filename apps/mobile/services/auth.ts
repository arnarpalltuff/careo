import api from './api';

export const authService = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data).then((r) => r.data),

  getMe: () => api.get('/auth/me').then((r) => r.data),

  updateMe: (data: { firstName?: string; lastName?: string; phone?: string; timezone?: string; avatarUrl?: string }) =>
    api.patch('/auth/me', data).then((r) => r.data),

  savePushToken: (pushToken: string) =>
    api.put('/auth/push-token', { pushToken }).then((r) => r.data),
};
