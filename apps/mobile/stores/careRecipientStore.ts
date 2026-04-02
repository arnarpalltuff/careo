import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface CareRecipientProfile {
  name: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: { name: string; phone: string; relation: string }[];
  primaryDoctor: string;
  doctorPhone: string;
  pharmacy: string;
  pharmacyPhone: string;
  insuranceProvider: string;
  insuranceId: string;
  notes: string;
}

interface CareRecipientState {
  profile: CareRecipientProfile;
  updateProfile: (updates: Partial<CareRecipientProfile>) => Promise<void>;
  syncToServer: (circleId: string) => Promise<void>;
  fetchFromServer: (circleId: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

const defaultProfile: CareRecipientProfile = {
  name: '',
  dateOfBirth: '',
  bloodType: '',
  allergies: [],
  conditions: [],
  emergencyContacts: [],
  primaryDoctor: '',
  doctorPhone: '',
  pharmacy: '',
  pharmacyPhone: '',
  insuranceProvider: '',
  insuranceId: '',
  notes: '',
};

export const useCareRecipientStore = create<CareRecipientState>((set, get) => ({
  profile: defaultProfile,

  updateProfile: async (updates) => {
    const current = get().profile;
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem('careRecipientProfile', JSON.stringify(updated));
    set({ profile: updated });
  },

  syncToServer: async (circleId: string) => {
    const profile = get().profile;
    try {
      await api.put(`/circles/${circleId}/health-card`, {
        bloodType: profile.bloodType,
        allergies: profile.allergies,
        conditions: profile.conditions,
        emergencyContacts: profile.emergencyContacts,
        primaryDoctor: profile.primaryDoctor,
        doctorPhone: profile.doctorPhone,
        pharmacy: profile.pharmacy,
        pharmacyPhone: profile.pharmacyPhone,
        insuranceProvider: profile.insuranceProvider,
        insuranceId: profile.insuranceId,
        notes: profile.notes,
      });
    } catch {
      // Silently fail — local data is preserved
    }
  },

  fetchFromServer: async (circleId: string) => {
    try {
      const { data } = await api.get(`/circles/${circleId}/health-card`);
      if (data.healthCard && Object.keys(data.healthCard).length > 0) {
        const current = get().profile;
        const merged = { ...current, ...data.healthCard };
        await AsyncStorage.setItem('careRecipientProfile', JSON.stringify(merged));
        set({ profile: merged });
      }
    } catch {
      // Fall back to local data
    }
  },

  hydrate: async () => {
    const stored = await AsyncStorage.getItem('careRecipientProfile');
    if (stored) {
      set({ profile: { ...defaultProfile, ...JSON.parse(stored) } });
    }
  },
}));
