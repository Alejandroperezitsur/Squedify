import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  Settings,
  Plus,
} from 'lucide-react';
import { useBusinessStore } from '@/store/businessStore';
import { useServiceStore } from '@/store/serviceStore';
import { useClientStore } from '@/store/clientStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useUIStore } from '@/store/uiStore';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import AgendaPage from '@/pages/AgendaPage';
import NewAppointmentPage from '@/pages/NewAppointmentPage';
import ServicesPage from '@/pages/ServicesPage';
import ClientsPage from '@/pages/ClientsPage';
import SettingsPage from '@/pages/SettingsPage';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { AppPage } from '@/types';

const navItems: { page: AppPage; icon: typeof LayoutDashboard; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { page: 'agenda', icon: CalendarDays, label: 'Agenda' },
  { page: 'services', icon: Scissors, label: 'Servicios' },
  { page: 'clients', icon: Users, label: 'Clientes' },
  { page: 'settings', icon: Settings, label: 'Ajustes' },
];

export default function App() {
  const { currentPage, setPage, toast: toastMsg, clearToast } = useUIStore();
  const { profile, loaded: businessLoaded, loadProfile } = useBusinessStore();
  const { loaded: servicesLoaded, loadServices } = useServiceStore();
  const { loaded: clientsLoaded, loadClients } = useClientStore();
  const { loaded: appointmentsLoaded, loadAppointments } = useAppointmentStore();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadProfile(),
        loadServices(),
        loadClients(),
        loadAppointments(),
      ]);
      setInitDone(true);
    };
    init();
  }, [loadProfile, loadServices, loadClients, loadAppointments]);

  useEffect(() => {
    if (toastMsg) {
      toast[toastMsg.type](toastMsg.message);
      clearToast();
    }
  }, [toastMsg, clearToast]);

  if (!initDone || !businessLoaded || !servicesLoaded || !clientsLoaded || !appointmentsLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-teal-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-teal-700 font-medium">Cargando Squedify...</p>
        </div>
      </div>
    );
  }

  // If no profile, force onboarding
  if (!profile) {
    return (
      <div className="h-screen w-screen bg-gray-50 overflow-hidden">
        <OnboardingPage />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'agenda':
        return <AgendaPage />;
      case 'new-appointment':
        return <NewAppointmentPage />;
      case 'services':
        return <ServicesPage />;
      case 'clients':
        return <ClientsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <Toaster position="top-center" richColors />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        {renderPage()}
      </main>

      {/* Floating action button for new appointment */}
      {currentPage !== 'new-appointment' && currentPage !== 'onboarding' && (
        <button
          onClick={() => setPage('new-appointment')}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95"
          aria-label="Nueva cita"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                  isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
