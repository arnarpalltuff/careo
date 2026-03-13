import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { router } from 'expo-router';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const register = async (form: { email: string; password: string; firstName: string; lastName: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(form);
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { hydrate } = useAuthStore.getState();
      const refreshToken = await hydrate();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    }
    await clearAuth();
    router.replace('/(auth)/login');
  };

  return { login, register, logout, loading, error, setError };
}
