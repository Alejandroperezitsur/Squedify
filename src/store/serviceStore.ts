import { create } from 'zustand';
import type { Service } from '@/types';
import { db } from '@/db';

interface ServiceState {
  services: Service[];
  loaded: boolean;
  loadServices: () => Promise<void>;
  addService: (service: Service) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: [],
  loaded: false,
  loadServices: async () => {
    const items = await db.services.toArray();
    set({ services: items, loaded: true });
  },
  addService: async (service) => {
    await db.services.add(service);
    set({ services: [...get().services, service] });
  },
  updateService: async (service) => {
    await db.services.put(service);
    set({
      services: get().services.map((s) => (s.id === service.id ? service : s)),
    });
  },
  deleteService: async (id) => {
    await db.services.delete(id);
    set({ services: get().services.filter((s) => s.id !== id) });
  },
}));
