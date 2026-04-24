/**
 * Type definitions for Squedify
 * Strong typing for all domain models
 */

export interface WorkingHours {
  start: string; // "09:00"
  end: string; // "18:00"
}

export interface BusinessProfile {
  id: string;
  name: string;
  logo?: string; // base64
  workingHours: WorkingHours;
  slotDuration: number; // minutes, default 30
  daysOpen: number[]; // 0=Sunday, 1=Monday, etc.
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price?: number;
  color: string; // hex color
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
}

export interface TimeSlot {
  time: string; // HH:mm
  available: boolean;
  recommended?: boolean;
  score?: number;
}

export interface DeadTimeBlock {
  start: string;
  end: string;
  duration: number;
}

export interface DayMetrics {
  totalSlots: number;
  occupiedSlots: number;
  deadTimeMinutes: number;
  occupancyRate: number;
  totalAppointments: number;
}

export type AppPage =
  | 'onboarding'
  | 'dashboard'
  | 'agenda'
  | 'new-appointment'
  | 'services'
  | 'clients'
  | 'settings';
