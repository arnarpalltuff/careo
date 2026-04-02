import api from './api';

export interface SubscriptionStatus {
  tier: 'FREE' | 'PLUS' | 'FAMILY';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  planName?: string;
}

export const subscriptionService = {
  checkout: (tier: 'PLUS' | 'FAMILY') =>
    api.post<{ checkoutUrl: string }>('/subscriptions/checkout', { tier }).then((r) => r.data),

  status: () =>
    api.get<SubscriptionStatus>('/subscriptions/status').then((r) => r.data),

  cancel: () =>
    api.post('/subscriptions/cancel').then((r) => r.data),

  portal: () =>
    api.post<{ portalUrl: string }>('/subscriptions/portal').then((r) => r.data),
};
