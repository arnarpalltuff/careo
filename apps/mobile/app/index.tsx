import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const { hasSeenOnboarding, hasSeenPaywall } = useOnboardingStore();

  // 1. First time ever — emotional onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // 2. Seen onboarding but not logged in — register/login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // 3. Logged in but hasn't seen paywall — show subscription
  if (!hasSeenPaywall) {
    return <Redirect href="/paywall" />;
  }

  // 4. Done — go to app
  return <Redirect href="/(tabs)/home" />;
}
