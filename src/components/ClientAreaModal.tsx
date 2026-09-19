import React, { useState } from 'react';
import { X, UserPlus, Building, Phone, Mail, MapPin, FileText, Calendar, Plus, Search } from 'lucide-react';
import { Client, GestarianDocument } from '../types';

interface ClientAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  documents: GestarianDocument[];
  onAddClient: (client: Client) => void;
  onSelectClientForDoc: (client: Client, type: 'presupuesto' | 'factura') => void;
  onSelectClientForAgenda: (client: Client) => void;
  onViewDoc: (doc: GestarianDocument) => void;
}

export const ClientAreaModal: React.FC<ClientAreaModalProps> = ({
  isOpen,
  onClose,
  clients,
  documents,
  onAddClient,
  onSelectClientForDoc,
  onSelectClientForAgenda,
  onViewDoc,
}) => {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulario nuevo cliente
  const [name, setName] = useState('');
  const [cif, setCif] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [plate, setPlate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesId = c.clientNumber !== undefined && (
      String(c.clientNumber) === q ||
      `#${c.clientNumber}` === q
    );
    const matchesPlate = c.plates && c.plates.some((p) => p.toLowerCase().includes(q));
    const matchesDocPlate = documents.some(
      (d) => d.clientId === c.id && d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(q)
    );
    return (
      matchesId ||
      c.name.toLowerCase().includes(q) ||
      c.cif.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      matchesPlate ||
      matchesDocPlate
    );
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !cif.trim() || !address.trim() || !email.trim()) {
      setError('Razón social, CIF, dirección y email son obligatorios.');
      return;
    }

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: name.trim().toUpperCase(),
      cif: cif.trim().toUpperCase(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      plates: plate.trim() ? [plate.trim().toUpperCase()] : undefined,
      notes: notes.trim(),
    };

    onAddClient(newClient);
    setName('');
    setCif('');
    setAddress('');
    setPhone('');
    setEmail('');
    setPlate('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F172A]/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl my-6 bg-[#F8F7F3] border border-[#D5D2C9] rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
              Gestión Interna del Taller
            </span>
            <h2 className="text-base font-bold uppercase tracking-wider text-[#0F172A]">
              Cartera de Clientes y Vehículos
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-alta-cliente-form"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase rounded-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Ver listado' : 'Nuevo Cliente'}</span>
            </button>

            <button 
              onClick={onClose} 
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-sm transition-colors cursor-pointer"
              title="Cerrar área de clientes"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Formulario nuevo cliente */}
        {showAddForm ? (
          <div className="p-6 bg-white border-b border-[#E2E0D8] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Ficha de Nuevo Cliente
            </h3>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Razón Social / Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: DISTRIBUCIONES IBERIA S.L."
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  CIF / NIF *
                </label>
                <input
                  type="text"
                  required
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  placeholder="B-99887766"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Dirección Fiscal Completa *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, código postal, localidad"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Email de Facturación *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="facturacion@cliente.es"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 900 000 000"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Matrícula / Flota (ALPR Opcional)
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Ej: 8492-LMX"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs font-mono uppercase font-bold tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Notas Internas
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de pago, persona de contacto..."
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                />
              </div>

              <div className="sm:col-span-2 pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F2942] text-white text-xs font-semibold uppercase rounded-xs"
                >
                  Guardar Cliente en Base de Datos
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Buscador */}
        <div className="p-4 bg-[#F1F0EB] border-b border-[#E2E0D8] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por razón social, CIF o email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D5D2C9] rounded-xs outline-none"
            />
          </div>
          <span className="text-xs text-[#64748B] whitespace-nowrap">
            {filteredClients.length} clientes registrados
          </span>
        </div>

        {/* Listado de Clientes */}
        <div className="p-6 overflow-y-auto space-y-4">
          {filteredClients.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#64748B]">
              No se han encontrado clientes registrados.
            </div>
          ) : (
            filteredClients.map((client) => {
              const clientDocs = documents.filter((d) => d.clientId === client.id);
              const invoices = clientDocs.filter((d) => d.type === 'factura');
              const budgets = clientDocs.filter((d) => d.type === 'presupuesto');
              const totalBilled = invoices.reduce((acc, i) => acc + i.total, 0);

              return (
                <div
                  key={client.id}
                  className="p-4 bg-white border border-[#E2E0D8] rounded-sm shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#0F2942]" />
                        <span className="text-xs font-mono font-black px-2 py-0.5 bg-[#0F2942] text-white rounded">
                          ID #{client.clientNumber ?? 1}
                        </span>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">
                          {client.name}
                        </h4>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-[#F1F5F9] text-[#1E3A8A] rounded-xs">
                          {client.cif}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#94A3B8]" />
                          {client.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#94A3B8]" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#94A3B8]" />
                            {client.phone}
                          </span>
                        )}
                      </div>

                      {/* Matrículas asociadas */}
                      {((client.plates && client.plates.length > 0) || clientDocs.some((d) => d.vehiclePlate)) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] uppercase font-bold text-[#64748B]">
                            Matrículas ALPR:
                          </span>
                          {Array.from(
                            new Set([
                              ...(client.plates || []),
                              ...clientDocs.filter((d) => d.vehiclePlate).map((d) => d.vehiclePlate!),
                            ])
                          ).map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center text-[10px] font-mono font-bold bg-[#FAF9F5] border border-[#CBD5E1] px-1.5 py-0.5 rounded-xs text-[#0F172A]"
                            >
                              <span className="bg-[#003399] text-white text-[8px] font-bold px-1 py-0.2 mr-1 rounded-2xs">
                                E
                              </span>
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones rápidas para el cliente */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectClientForDoc(client, 'presupuesto')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase bg-[#F8F7F3] hover:bg-[#EFECE6] border border-[#CBD5E1] text-[#0F2942] rounded-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Presupuesto</span>
                      </button>

                      <button
                        onClick={() => onSelectClientForDoc(client, 'factura')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Factura</span>
                      </button>

                      <button
                        onClick={() => onSelectClientForAgenda(client)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase bg-white hover:bg-[#F8F7F3] border border-[#0F2942] text-[#0F2942] rounded-xs"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Dar Cita</span>
                      </button>
                    </div>
                  </div>

                  {/* Balance y Documentos Recientes */}
                  <div className="pt-2 border-t border-[#F1F0EB] flex flex-wrap items-center justify-between text-xs text-[#475569] gap-3">
                    <div className="flex items-center gap-4">
                      <span>
                        Facturado: <strong className="font-mono text-[#0F172A]">{totalBilled.toFixed(2)} €</strong> ({invoices.length} facturas)
                      </span>
                      <span>
                        Presupuestos: <strong className="font-mono text-[#0F172A]">{budgets.length}</strong>
                      </span>
                    </div>

                    {clientDocs.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        <span className="text-[10px] uppercase text-[#94A3B8]">Historial:</span>
                        {clientDocs.slice(0, 3).map((d) => (
                          <button
                            key={d.id}
                            onClick={() => onViewDoc(d)}
                            className="font-mono text-[10px] px-2 py-0.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-xs text-[#0F172A]"
                          >
                            {d.number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con botón de salida */}
        <div className="px-6 py-3.5 bg-[#F1F0EB] border-t border-[#E2E0D8] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#64748B]">
            {clients.length} cliente{clients.length === 1 ? '' : 's'} registrado{clients.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Clientes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
