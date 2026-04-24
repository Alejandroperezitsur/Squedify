import { useState } from 'react';
import { Building2, Clock, Check } from 'lucide-react';
import { useBusinessStore } from '@/store/businessStore';
import { useUIStore } from '@/store/uiStore';
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

export default function OnboardingPage() {
  const saveProfile = useBusinessStore((s) => s.saveProfile);
  const setPage = useUIStore((s) => s.setPage);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [daysOpen, setDaysOpen] = useState<number[]>([1, 2, 3, 4, 5]);
  const [logo, setLogo] = useState<string>('');

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

  const finish = async () => {
    const profile: BusinessProfile = {
      id: 'default',
      name: name || 'Mi Negocio',
      logo,
      workingHours: { start: startTime, end: endTime },
      slotDuration,
      daysOpen,
    };
    await saveProfile(profile);
    setPage('dashboard');
  };

  const steps = [
    {
      title: 'Bienvenido a Squedify',
      subtitle: 'Configura tu negocio en 3 pasos',
      content: (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center">
            <Building2 className="w-10 h-10 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tu negocio, organizado</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Gestiona citas, optimiza tu agenda y nunca más pierdas un turno. Todo funciona sin internet.
            </p>
          </div>
          <Button onClick={() => setStep(1)} className="w-full bg-teal-600 hover:bg-teal-700">
            Comenzar
          </Button>
        </div>
      ),
    },
    {
      title: 'Datos de tu negocio',
      subtitle: 'Paso 1 de 3',
      content: (
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Nombre del negocio</Label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Peluquería Estilo"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo (opcional)</Label>
            <div className="flex items-center gap-3">
              {logo && (
                <img src={logo} alt="Logo" className="w-12 h-12 rounded-lg object-cover border" />
              )}
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-12 flex items-center justify-center text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors">
                  {logo ? 'Cambiar logo' : 'Subir logo'}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 mt-2"
          >
            Continuar
          </Button>
        </div>
      ),
    },
    {
      title: 'Horarios laborales',
      subtitle: 'Paso 2 de 3',
      content: (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Hora apertura</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Hora cierre</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot">Duración base de turnos (min)</Label>
            <div className="flex items-center gap-2">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setSlotDuration(m)}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
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

          <Button onClick={() => setStep(3)} className="w-full bg-teal-600 hover:bg-teal-700 mt-2">
            Continuar
          </Button>
        </div>
      ),
    },
    {
      title: 'Días laborales',
      subtitle: 'Paso 3 de 3',
      content: (
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label>¿Qué días abres?</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`h-14 rounded-xl text-xs font-semibold transition-all ${
                    daysOpen.includes(day.value)
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={finish}
            disabled={daysOpen.length === 0}
            className="w-full bg-teal-600 hover:bg-teal-700 mt-2 h-12"
          >
            <Check className="w-4 h-4 mr-2" />
            ¡Listo! Crear mi agenda
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white px-5 py-8 flex flex-col">
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-teal-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{steps[step].title}</h1>
          <p className="text-sm text-gray-500 mt-1">{steps[step].subtitle}</p>
        </div>

        {steps[step].content}
      </div>
    </div>
  );
}
