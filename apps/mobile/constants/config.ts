const DEV_API_URL = 'http://localhost:3000/api';
const PROD_API_URL = 'https://api.careo.app/api';

export const config = {
  API_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY ?? (() => {
    if (!__DEV__) throw new Error('EXPO_PUBLIC_STRIPE_KEY must be set in production');
    console.warn('⚠ EXPO_PUBLIC_STRIPE_KEY not set — Stripe will not work');
    return '';
  })(),
};
