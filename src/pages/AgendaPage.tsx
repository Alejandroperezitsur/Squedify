import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Clock } from 'lucide-react';
import { format, addDays, subDays, parseISO, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBusinessStore } from '@/store/businessStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useServiceStore } from '@/store/serviceStore';
import { useClientStore } from '@/store/clientStore';
import { useUIStore } from '@/store/uiStore';
import { detectDeadTime } from '@/lib/scheduling';

export default function AgendaPage() {
  const profile = useBusinessStore((s) => s.profile);
  const appointments = useAppointmentStore((s) => s.appointments);
  const services = useServiceStore((s) => s.services);
  const clients = useClientStore((s) => s.clients);
  const selectedDate = useUIStore((s) => s.selectedDate);
  const setSelectedDate = useUIStore((s) => s.setSelectedDate);
  const setPage = useUIStore((s) => s.setPage);


  const currentDate = parseISO(selectedDate);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate && a.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate]);

  const deadBlocks = useMemo(() => {
    if (!profile) return [];
    return detectDeadTime(selectedDate, profile.workingHours, appointments, 15);
  }, [selectedDate, profile, appointments]);

  const getService = (id: string) => services.find((s) => s.id === id);
  const getClient = (id: string) => clients.find((c) => c.id === id);

  // Generate timeline
  const timelineItems = useMemo(() => {
    if (!profile) return [];
    const items: {
      type: 'appointment' | 'deadtime';
      startTime: string;
      endTime: string;
      data?: (typeof dayAppointments)[0];
      duration: number;
    }[] = [];

    dayAppointments.forEach((apt) => {
      items.push({
        type: 'appointment',
        startTime: apt.startTime,
        endTime: apt.endTime,
        data: apt,
        duration: 0,
      });
    });

    deadBlocks.forEach((block) => {
      items.push({
        type: 'deadtime',
        startTime: block.start,
        endTime: block.end,
        duration: block.duration,
      });
    });

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [dayAppointments, deadBlocks, profile]);

  const goPrev = () => {
    const newDate = subDays(currentDate, 1);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const goNext = () => {
    const newDate = addDays(currentDate, 1);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const dateLabel = format(currentDate, "EEEE, d MMM", { locale: es });

  return (
    <div className="px-4 pt-6 pb-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 capitalize">{dateLabel}</p>
          <p className="text-[10px] text-gray-400">
            {dayAppointments.length} citas · {deadBlocks.length} huecos
          </p>
        </div>
        <button
          onClick={goNext}
          className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week strip */}
      <div className="flex gap-1">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, currentDate);
          const dayStr = format(day, 'yyyy-MM-dd');
          const count = appointments.filter(
            (a) => a.date === dayStr && a.status !== 'cancelled'
          ).length;
          return (
            <button
              key={dayStr}
              onClick={() => setSelectedDate(dayStr)}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-colors ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <span className="text-[10px] font-medium uppercase">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="text-sm font-bold">{format(day, 'd')}</span>
              {count > 0 && (
                <span
                  className={`text-[9px] font-bold px-1 rounded-full ${
                    isSelected ? 'bg-white/30' : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {timelineItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Sin citas este día</p>
            <p className="text-xs text-gray-400 mt-1">
              La agenda está libre. Aprovecha para organizar nuevos turnos.
            </p>
            <button
              onClick={() => setPage('new-appointment')}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              <Plus className="w-4 h-4" /> Nueva cita
            </button>
          </div>
        ) : (
          timelineItems.map((item, idx) => {
            if (item.type === 'appointment' && item.data) {
              const service = getService(item.data.serviceId);
              const client = getClient(item.data.clientId);
              return (
                <div
                  key={item.data.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start gap-3"
                >
                  <div
                    className="w-1.5 h-full min-h-[40px] rounded-full shrink-0 self-stretch"
                    style={{ backgroundColor: service?.color || '#0f766e' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {client?.name || 'Cliente'}
                      </p>
                      <span className="text-xs text-gray-400 font-mono">
                        {item.data.startTime}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {service?.name || 'Servicio'} · {item.data.startTime} - {item.data.endTime}
                    </p>
                    {item.data.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">{item.data.notes}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      item.data.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.data.status === 'completed' ? 'Hecha' : 'Pend'}
                  </span>
                </div>
              );
            } else {
              return (
                <div
                  key={`dead-${idx}`}
                  className="flex items-center gap-3 py-1 px-2"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="flex-1 h-px bg-amber-200" />
                  <span className="text-[10px] text-amber-500 font-medium whitespace-nowrap">
                    Hueco {item.startTime}-{item.endTime} ({item.duration}m)
                  </span>
                  <div className="flex-1 h-px bg-amber-200" />
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
