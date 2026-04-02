import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WellnessEntry {
  date: string;
  answers: number[]; // 5 answers, each 1-5
  score: number;     // sum of answers (5-25)
}

interface WellnessState {
  history: WellnessEntry[];
  addEntry: (answers: number[]) => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'wellness_history';

export const useWellnessStore = create<WellnessState>((set, get) => ({
  history: [],

  addEntry: async (answers: number[]) => {
    const entry: WellnessEntry = {
      date: new Date().toISOString(),
      answers,
      score: answers.reduce((a, b) => a + b, 0),
    };
    const updated = [entry, ...get().history];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ history: updated });
  },

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      set({ history: JSON.parse(raw) });
    }
  },
}));
