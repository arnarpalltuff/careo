const DEV_API_URL = 'http://localhost:3000/api';
const PROD_API_URL = 'https://api.elderlink.app/api';

export const config = {
  API_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  STRIPE_PUBLISHABLE_KEY: 'pk_test_xxxx',
};
