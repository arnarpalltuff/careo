import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasSeenPaywall: boolean;
  caringFor: string;
  painPoints: string[];
  todayMood: string | null;
  todayMoodDate: string | null;
  streakDays: number;
  setHasSeenOnboarding: (value: boolean) => void;
  setHasSeenPaywall: (value: boolean) => void;
  setCaringFor: (name: string) => void;
  setPainPoints: (points: string[]) => void;
  setTodayMood: (mood: string) => void;
  hydrate: () => Promise<void>;
}

const today = () => new Date().toISOString().split('T')[0];

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasSeenOnboarding: false,
  hasSeenPaywall: false,
  caringFor: 'your loved one',
  painPoints: [],
  todayMood: null,
  todayMoodDate: null,
  streakDays: 0,

  setHasSeenOnboarding: async (value: boolean) => {
    await AsyncStorage.setItem('hasSeenOnboarding', JSON.stringify(value));
    set({ hasSeenOnboarding: value });
  },
  setHasSeenPaywall: async (value: boolean) => {
    await AsyncStorage.setItem('hasSeenPaywall', JSON.stringify(value));
    set({ hasSeenPaywall: value });
  },
  setCaringFor: async (name: string) => {
    await AsyncStorage.setItem('caringFor', name);
    set({ caringFor: name });
  },
  setPainPoints: async (points: string[]) => {
    await AsyncStorage.setItem('painPoints', JSON.stringify(points));
    set({ painPoints: points });
  },
  setTodayMood: async (mood: string) => {
    const todayStr = today();
    const { todayMoodDate, streakDays } = get();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (todayMoodDate === yesterdayStr) {
      newStreak = streakDays + 1;
    } else if (todayMoodDate === todayStr) {
      newStreak = streakDays; // already checked in today
    }

    await AsyncStorage.setItem('todayMood', mood);
    await AsyncStorage.setItem('todayMoodDate', todayStr);
    await AsyncStorage.setItem('streakDays', String(newStreak));
    set({ todayMood: mood, todayMoodDate: todayStr, streakDays: newStreak });
  },

  hydrate: async () => {
    const [onboarding, paywall, caring, points, mood, moodDate, streak] = await Promise.all([
      AsyncStorage.getItem('hasSeenOnboarding'),
      AsyncStorage.getItem('hasSeenPaywall'),
      AsyncStorage.getItem('caringFor'),
      AsyncStorage.getItem('painPoints'),
      AsyncStorage.getItem('todayMood'),
      AsyncStorage.getItem('todayMoodDate'),
      AsyncStorage.getItem('streakDays'),
    ]);

    const todayStr = today();
    const storedMoodDate = moodDate || null;

    set({
      hasSeenOnboarding: onboarding ? JSON.parse(onboarding) : false,
      hasSeenPaywall: paywall ? JSON.parse(paywall) : false,
      caringFor: caring || 'your loved one',
      painPoints: points ? JSON.parse(points) : [],
      todayMood: storedMoodDate === todayStr ? mood : null,
      todayMoodDate: storedMoodDate,
      streakDays: streak ? parseInt(streak, 10) : 0,
    });
  },
}));
