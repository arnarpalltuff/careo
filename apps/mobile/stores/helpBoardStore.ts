import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HelpCategory = 'errands' | 'meals' | 'transport' | 'medical' | 'household' | 'company';
export type HelpUrgency = 'today' | 'this_week' | 'whenever';
export type HelpStatus = 'open' | 'claimed';

export interface HelpRequest {
  id: string;
  category: HelpCategory;
  title: string;
  description: string;
  urgency: HelpUrgency;
  createdBy: string;
  createdAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
  status: HelpStatus;
}

interface HelpBoardState {
  requests: HelpRequest[];
  addRequest: (req: Omit<HelpRequest, 'id' | 'createdAt' | 'claimedBy' | 'claimedAt' | 'status'>) => void;
  claimRequest: (id: string, claimedBy: string) => void;
  unclaimRequest: (id: string) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'helpBoardRequests';

const persist = async (requests: HelpRequest[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const useHelpBoardStore = create<HelpBoardState>((set, get) => ({
  requests: [],

  addRequest: async (req) => {
    const newRequest: HelpRequest = {
      ...req,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      claimedBy: null,
      claimedAt: null,
      status: 'open',
    };
    const updated = [newRequest, ...get().requests];
    set({ requests: updated });
    await persist(updated);
  },

  claimRequest: async (id, claimedBy) => {
    const updated = get().requests.map((r) =>
      r.id === id
        ? { ...r, claimedBy, claimedAt: new Date().toISOString(), status: 'claimed' as HelpStatus }
        : r,
    );
    set({ requests: updated });
    await persist(updated);
  },

  unclaimRequest: async (id) => {
    const updated = get().requests.map((r) =>
      r.id === id
        ? { ...r, claimedBy: null, claimedAt: null, status: 'open' as HelpStatus }
        : r,
    );
    set({ requests: updated });
    await persist(updated);
  },

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const requests: HelpRequest[] = JSON.parse(raw);
        set({ requests });
      } catch {
        // corrupted data — start fresh
      }
    }
  },
}));
