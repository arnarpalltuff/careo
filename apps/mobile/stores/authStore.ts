import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: 'FREE' | 'FAMILY';
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading: (isLoading) => set({ isLoading }),

  hydrate: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      return refreshToken;
    } catch {
      return null;
    }
  },
}));
