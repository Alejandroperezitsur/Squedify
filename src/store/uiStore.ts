import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppPage } from '@/types';

interface UIState {
  currentPage: AppPage;
  selectedDate: string;
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setPage: (page: AppPage) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      selectedDate: new Date().toISOString().split('T')[0],
      isLoading: false,
      toast: null,
      setPage: (page) => set({ currentPage: page }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setLoading: (loading) => set({ isLoading: loading }),
      showToast: (message, type) => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),
    }),
    { name: 'squedify-ui' }
  )
);
