import { useState, useMemo } from 'react';
import { ArrowLeft, Sparkles, UserPlus, Check, AlertCircle } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { useBusinessStore } from '@/store/businessStore';
import { useServiceStore } from '@/store/serviceStore';
import { useClientStore } from '@/store/clientStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useUIStore } from '@/store/uiStore';
import { getAvailableSlots, suggestBestSlots, hasOverlap } from '@/lib/scheduling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Appointment, Client } from '@/types';

export default function NewAppointmentPage() {
  const profile = useBusinessStore((s) => s.profile);
  const services = useServiceStore((s) => s.services);
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const appointments = useAppointmentStore((s) => s.appointments);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const setPage = useUIStore((s) => s.setPage);
  const showToast = useUIStore((s) => s.showToast);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [error, setError] = useState('');

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const slots = useMemo(() => {
    if (!profile || !selectedService) return [];
    const baseSlots = getAvailableSlots(
      date,
      profile.workingHours,
      profile.slotDuration,
      appointments,
      selectedService.duration
    );
    return suggestBestSlots(
      baseSlots,
      appointments,
      date,
      selectedService.duration,
      profile.slotDuration
    );
  }, [date, profile, selectedService, appointments]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clients, clientSearch]);

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: newClientName.trim(),
      phone: newClientPhone || undefined,
    };
    await addClient(newClient);
    setSelectedClientId(newClient.id);
    setShowNewClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setClientSearch(newClient.name);
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedService || !selectedClientId || !selectedTime) {
      setError('Selecciona servicio, cliente y horario');
      return;
    }

    const start = parseISO(`${date}T${selectedTime}`);
    const end = addMinutes(start, selectedService.duration);
    const endTime = format(end, 'HH:mm');

    const newApt: Appointment = {
      id: crypto.randomUUID(),
      clientId: selectedClientId,
      serviceId: selectedService.id,
      date,
      startTime: selectedTime,
      endTime,
      status: 'scheduled',
      notes: notes || undefined,
    };

    if (hasOverlap(newApt, appointments)) {
      setError('Este horario se solapa con otra cita');
      return;
    }

    await addAppointment(newApt);
    showToast('Cita creada con éxito', 'success');
    setPage('agenda');
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage('dashboard')}
          className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Nueva cita</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Service selection */}
      <div className="space-y-2">
        <Label>Servicio</Label>
        {services.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
            <p className="text-sm text-gray-500">No hay servicios creados</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setPage('services')}
            >
              Crear servicio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedServiceId(service.id);
                  setSelectedTime('');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedServiceId === service.id
                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: service.color }}
                  />
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {service.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{service.duration} min</p>
                {service.price && (
                  <p className="text-xs font-medium text-teal-600">${service.price}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Client selection */}
      <div className="space-y-2">
        <Label>Cliente</Label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setSelectedClientId('');
            }}
            placeholder="Buscar cliente..."
            className="pl-9"
          />
        </div>

        {clientSearch && !selectedClientId && filteredClients.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-h-40 overflow-y-auto">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setClientSearch(client.name);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-900">{client.name}</span>
                {client.phone && <span className="text-xs text-gray-400">{client.phone}</span>}
              </button>
            ))}
          </div>
        )}

        {clientSearch && !selectedClientId && filteredClients.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-2">No encontrado</p>
            <Button
              variant="outline"
              size="sm"
              className="text-teal-600 border-teal-200"
              onClick={() => {
                setNewClientName(clientSearch);
                setShowNewClient(true);
              }}
            >
              <UserPlus className="w-3 h-3 mr-1" /> Crear "{clientSearch}"
            </Button>
          </div>
        )}

        {selectedClientId && (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            <Check className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-800">
              {clients.find((c) => c.id === selectedClientId)?.name}
            </span>
            <button
              onClick={() => {
                setSelectedClientId('');
                setClientSearch('');
              }}
              className="ml-auto text-xs text-teal-600 hover:underline"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedTime('');
          }}
          className="h-12"
        />
      </div>

      {/* Time slots */}
      {selectedService && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Horario</Label>
            {slots.some((s) => s.recommended) && (
              <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recomendados
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.time)}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                  !slot.available
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : selectedTime === slot.time
                    ? 'bg-teal-600 text-white shadow-md'
                    : slot.recommended
                    ? 'bg-teal-50 text-teal-700 border-2 border-teal-300 hover:border-teal-400'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {slot.time}
                {slot.recommended && selectedTime !== slot.time && (
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-teal-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notas (opcional)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre la cita..."
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-20"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedServiceId || !selectedClientId || !selectedTime}
        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-base"
      >
        Crear cita
      </Button>

      {/* New client dialog */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono (opcional)</Label>
              <Input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Ej: 555-1234"
              />
            </div>
            <Button
              onClick={handleCreateClient}
              disabled={!newClientName.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Crear cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
