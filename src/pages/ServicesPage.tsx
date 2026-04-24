import { useState } from 'react';
import { Plus, Trash2, Edit2, Palette } from 'lucide-react';
import { useServiceStore } from '@/store/serviceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Service } from '@/types';

const PRESET_COLORS = [
  '#0f766e', '#0369a1', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#4f46e5',
];

export default function ServicesPage() {
  const services = useServiceStore((s) => s.services);
  const addService = useServiceStore((s) => s.addService);
  const updateService = useServiceStore((s) => s.updateService);
  const deleteService = useServiceStore((s) => s.deleteService);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const resetForm = () => {
    setName('');
    setDuration(30);
    setPrice('');
    setColor(PRESET_COLORS[0]);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const service: Service = {
      id: editing?.id || crypto.randomUUID(),
      name: name.trim(),
      duration,
      price: price ? parseFloat(price) : undefined,
      color,
    };
    if (editing) {
      await updateService(service);
    } else {
      await addService(service);
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (s: Service) => {
    setEditing(s);
    setName(s.name);
    setDuration(s.duration);
    setPrice(s.price?.toString() || '');
    setColor(s.color);
    setShowForm(true);
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Servicios</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Palette className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Sin servicios</p>
          <p className="text-xs text-gray-400 mt-1">Crea servicios para empezar a agendar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-4 h-10 rounded-full shrink-0"
                style={{ backgroundColor: service.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                <p className="text-xs text-gray-500">
                  {service.duration} min{service.price ? ` · $${service.price}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(service)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar este servicio?')) {
                      await deleteService(service.id);
                    }
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editing ? 'Editar servicio' : 'Nuevo servicio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Corte de pelo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDuration(m)}
                      className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                        duration === m
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Precio (opcional)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {editing ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
