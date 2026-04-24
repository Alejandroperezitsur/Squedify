import Dexie, { type Table } from 'dexie';
import type { Appointment, BusinessProfile, Client, Service } from '@/types';

export class SquedifyDB extends Dexie {
  business!: Table<BusinessProfile, string>;
  services!: Table<Service, string>;
  clients!: Table<Client, string>;
  appointments!: Table<Appointment, string>;

  constructor() {
    super('SquedifyDB');
    this.version(1).stores({
      business: 'id',
      services: 'id',
      clients: 'id',
      appointments: 'id, date, status',
    });
  }
}

export const db = new SquedifyDB();
