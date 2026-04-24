import { create } from 'zustand';
import type { BusinessProfile } from '@/types';
import { db } from '@/db';

interface BusinessState {
  profile: BusinessProfile | null;
  loaded: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: BusinessProfile) => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set) => ({
  profile: null,
  loaded: false,
  loadProfile: async () => {
    const profiles = await db.business.toArray();
    if (profiles.length > 0) {
      set({ profile: profiles[0], loaded: true });
    } else {
      set({ loaded: true });
    }
  },
  saveProfile: async (profile) => {
    await db.business.put(profile);
    set({ profile });
  },
}));
