import { useState } from 'react';
import { Search, UserPlus, Phone, Trash2, Edit2 } from 'lucide-react';
import { useClientStore } from '@/store/clientStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Client } from '@/types';

export default function ClientsPage() {
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const deleteClient = useClientStore((s) => s.deleteClient);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone?.includes(search) ?? false)
  );

  const resetForm = () => {
    setName('');
    setPhone('');
    setNotes('');
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const client: Client = {
      id: editing?.id || crypto.randomUUID(),
      name: name.trim(),
      phone: phone || undefined,
      notes: notes || undefined,
    };
    if (editing) {
      await updateClient(client);
    } else {
      await addClient(client);
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (c: Client) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone || '');
    setNotes(c.notes || '');
    setShowForm(true);
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Clientes</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
        >
          <UserPlus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {search ? 'Sin resultados' : 'Sin clientes'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? 'Intenta otra búsqueda' : 'Crea tu primer cliente'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                  {client.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {client.phone}
                    </p>
                  )}
                  {client.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{client.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(client)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('¿Eliminar este cliente?')) {
                        await deleteClient(client.id);
                      }
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editing ? 'Editar cliente' : 'Nuevo cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono (opcional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 555-1234"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas sobre el cliente..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-20"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {editing ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
