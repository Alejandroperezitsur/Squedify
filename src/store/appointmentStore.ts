import { create } from 'zustand';
import type { Appointment } from '@/types';
import { db } from '@/db';

interface AppointmentState {
  appointments: Appointment[];
  loaded: boolean;
  loadAppointments: () => Promise<void>;
  addAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByClient: (clientId: string) => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  loaded: false,
  loadAppointments: async () => {
    const items = await db.appointments.toArray();
    set({ appointments: items, loaded: true });
  },
  addAppointment: async (appointment) => {
    await db.appointments.add(appointment);
    set({ appointments: [...get().appointments, appointment] });
  },
  updateAppointment: async (appointment) => {
    await db.appointments.put(appointment);
    set({
      appointments: get().appointments.map((a) =>
        a.id === appointment.id ? appointment : a
      ),
    });
  },
  deleteAppointment: async (id) => {
    await db.appointments.delete(id);
    set({
      appointments: get().appointments.filter((a) => a.id !== id),
    });
  },
  getAppointmentsByDate: (date) =>
    get().appointments
      .filter((a) => a.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  getAppointmentsByClient: (clientId) =>
    get().appointments
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
}));
