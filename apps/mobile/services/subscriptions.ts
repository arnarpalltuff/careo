import api from './api';

export const subscriptionService = {
  checkout: () => api.post('/subscriptions/checkout').then((r) => r.data),

  status: () => api.get('/subscriptions/status').then((r) => r.data),

  cancel: () => api.post('/subscriptions/cancel').then((r) => r.data),

  portal: () => api.post('/subscriptions/portal').then((r) => r.data),
};
