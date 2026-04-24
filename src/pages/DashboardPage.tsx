import { useMemo } from 'react';
import { CalendarDays, Clock, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBusinessStore } from '@/store/businessStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useServiceStore } from '@/store/serviceStore';
import { useClientStore } from '@/store/clientStore';
import { useUIStore } from '@/store/uiStore';
import { calculateDayMetrics, detectDeadTime } from '@/lib/scheduling';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const profile = useBusinessStore((s) => s.profile);
  const appointments = useAppointmentStore((s) => s.appointments);
  const services = useServiceStore((s) => s.services);
  const clients = useClientStore((s) => s.clients);
  const selectedDate = useUIStore((s) => s.selectedDate);
  const setPage = useUIStore((s) => s.setPage);

  const todayStr = selectedDate;

  const metrics = useMemo(() => {
    if (!profile) return null;
    return calculateDayMetrics(todayStr, profile.workingHours, appointments);
  }, [todayStr, profile, appointments]);

  const deadBlocks = useMemo(() => {
    if (!profile) return [];
    return detectDeadTime(todayStr, profile.workingHours, appointments, 15);
  }, [todayStr, profile, appointments]);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === todayStr && a.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, todayStr]);

  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Servicio';
  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name || 'Cliente';
  const getServiceColor = (id: string) => services.find((s) => s.id === id)?.color || '#0f766e';

  const dateLabel = format(parseISO(todayStr), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{profile?.name || 'Mi Negocio'}</h1>
          <p className="text-sm text-gray-500 capitalize">{dateLabel}</p>
        </div>
        <button
          onClick={() => setPage('settings')}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {profile?.logo ? (
            <img src={profile.logo} alt="" className="w-6 h-6 rounded object-cover" />
          ) : (
            <div className="w-6 h-6 bg-teal-600 rounded-md" />
          )}
        </button>
      </div>

      {/* Metrics cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Ocupación</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.occupancyRate}%</p>
            <p className="text-xs text-gray-400 mt-0.5">{metrics.occupiedSlots} de {metrics.totalSlots} franjas</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Tiempo muerto</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.deadTimeMinutes}m</p>
            <p className="text-xs text-gray-400 mt-0.5">{deadBlocks.length} huecos detectados</p>
          </div>
        </div>
      )}

      {/* Dead time alert */}
      {deadBlocks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Huecos en tu agenda</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {deadBlocks.map((b) => `${b.start}-${b.end} (${b.duration}m)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Today's appointments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Citas de hoy</h2>
          <button
            onClick={() => setPage('agenda')}
            className="text-xs text-teal-600 font-medium flex items-center gap-0.5 hover:underline"
          >
            Ver agenda <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Sin citas hoy</p>
            <p className="text-xs text-gray-400 mt-1">Tu agenda está libre. ¿Añadimos una?</p>
            <Button
              onClick={() => setPage('new-appointment')}
              variant="outline"
              size="sm"
              className="mt-4 border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              Nueva cita
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3"
              >
                <div
                  className="w-1.5 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: getServiceColor(apt.serviceId) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {getClientName(apt.clientId)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getServiceName(apt.serviceId)} · {apt.startTime} - {apt.endTime}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    apt.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : apt.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {apt.status === 'completed' ? 'Hecha' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{clients.length}</p>
          <p className="text-[10px] text-gray-400">Clientes</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <CalendarDays className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{appointments.filter(a => a.status !== 'cancelled').length}</p>
          <p className="text-[10px] text-gray-400">Citas</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <TrendingUp className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{services.length}</p>
          <p className="text-[10px] text-gray-400">Servicios</p>
        </div>
      </div>
    </div>
  );
}
