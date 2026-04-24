import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Clock,
  Download,
  Upload,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useBusinessStore } from '@/store/businessStore';
import { useUIStore } from '@/store/uiStore';
import { db } from '@/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BusinessProfile } from '@/types';

const DAYS = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

export default function SettingsPage() {
  const profile = useBusinessStore((s) => s.profile);
  const saveProfile = useBusinessStore((s) => s.saveProfile);
  const setPage = useUIStore((s) => s.setPage);
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState(profile?.name || '');
  const [startTime, setStartTime] = useState(profile?.workingHours.start || '09:00');
  const [endTime, setEndTime] = useState(profile?.workingHours.end || '18:00');
  const [slotDuration, setSlotDuration] = useState(profile?.slotDuration || 30);
  const [daysOpen, setDaysOpen] = useState<number[]>(profile?.daysOpen || [1, 2, 3, 4, 5]);
  const [logo, setLogo] = useState(profile?.logo || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!profile) return null;

  const toggleDay = (day: number) => {
    setDaysOpen((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const updated: BusinessProfile = {
      ...profile,
      name: name || profile.name,
      logo,
      workingHours: { start: startTime, end: endTime },
      slotDuration,
      daysOpen,
    };
    await saveProfile(updated);
    showToast('Configuración guardada', 'success');
  };

  const handleExport = async () => {
    const data = {
      business: await db.business.toArray(),
      services: await db.services.toArray(),
      clients: await db.clients.toArray(),
      appointments: await db.appointments.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squedify-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados', 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.business) await db.business.bulkPut(data.business);
      if (data.services) await db.services.bulkPut(data.services);
      if (data.clients) await db.clients.bulkPut(data.clients);
      if (data.appointments) await db.appointments.bulkPut(data.appointments);
      window.location.reload();
    } catch {
      showToast('Error al importar datos', 'error');
    }
  };

  const handleReset = async () => {
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage('dashboard')}
          className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Configuración</h1>
      </div>

      {/* Business info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Negocio</h2>
        </div>

        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt="Logo" className="w-12 h-12 rounded-lg object-cover border" />
            )}
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-10 flex items-center justify-center text-xs text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors">
                {logo ? 'Cambiar logo' : 'Subir logo'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>
      </div>

      {/* Working hours */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Horarios</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Apertura</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cierre</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Duración base de turnos</Label>
          <div className="flex items-center gap-2">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => setSlotDuration(m)}
                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                  slotDuration === m
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Días laborales</Label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`h-10 rounded-lg text-xs font-semibold transition-all ${
                  daysOpen.includes(day.value)
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data management */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Datos</h2>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <label className="flex-1">
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" /> Importar
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Borrar todos los datos
        </button>
      </div>

      {/* Save */}
      <Button onClick={handleSave} className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-base">
        Guardar cambios
      </Button>

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">¿Borrar todo?</h3>
            </div>
            <p className="text-sm text-gray-600">
              Esta acción eliminará permanentemente todos tus datos: negocio, servicios, clientes y citas. No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Sí, borrar todo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
