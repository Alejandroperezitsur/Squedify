import { create } from 'zustand';
import type { Client } from '@/types';
import { db } from '@/db';

interface ClientState {
  clients: Client[];
  loaded: boolean;
  loadClients: () => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loaded: false,
  loadClients: async () => {
    const items = await db.clients.toArray();
    set({ clients: items, loaded: true });
  },
  addClient: async (client) => {
    await db.clients.add(client);
    set({ clients: [...get().clients, client] });
  },
  updateClient: async (client) => {
    await db.clients.put(client);
    set({
      clients: get().clients.map((c) => (c.id === client.id ? client : c)),
    });
  },
  deleteClient: async (id) => {
    await db.clients.delete(id);
    set({ clients: get().clients.filter((c) => c.id !== id) });
  },
  getClientById: (id) => get().clients.find((c) => c.id === id),
}));
