import React, { useState } from 'react';
import { X, Calendar, Clock, Plus, CheckCircle, AlertCircle, FileText, User } from 'lucide-react';
import { Appointment, Client, GestarianDocument } from '../types';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  clients: Client[];
  onAddAppointment: (app: Appointment) => void;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  initialBudgetForAppointment?: GestarianDocument | null;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({
  isOpen,
  onClose,
  appointments,
  clients,
  onAddAppointment,
  onUpdateStatus,
  initialBudgetForAppointment,
}) => {
  const [showAddForm, setShowAddForm] = useState(Boolean(initialBudgetForAppointment));
  const [selectedClientId, setSelectedClientId] = useState(
    initialBudgetForAppointment ? initialBudgetForAppointment.clientId : clients[0]?.id || ''
  );
  const [date, setDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [time, setTime] = useState('10:00');
  const [title, setTitle] = useState(
    initialBudgetForAppointment
      ? `Reunión de inicio de trabajo - ${initialBudgetForAppointment.number}`
      : 'Cita con cliente'
  );
  const [notes, setNotes] = useState(
    initialBudgetForAppointment
      ? `Presupuesto ${initialBudgetForAppointment.number} aceptado por importe de ${initialBudgetForAppointment.total.toFixed(2)} €.`
      : ''
  );
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

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const client = clients.find((c) => c.id === selectedClientId) || clients[0];
    if (!client) {
      setError('Debes seleccionar un cliente.');
      return;
    }

    if (!title.trim() || !date || !time) {
      setError('Título, fecha y hora son obligatorios.');
      return;
    }

    const newApp: Appointment = {
      id: `app_${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      budgetId: initialBudgetForAppointment?.id,
      date,
      time,
      title: title.trim(),
      status: 'confirmada',
      notes: notes.trim(),
    };

    onAddAppointment(newApp);
    setShowAddForm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F172A]/40 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl my-6 bg-[#F8F7F3] border border-[#D5D2C9] rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                Módulo PRO
              </span>
              {initialBudgetForAppointment && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-xs">
                  Flujo de cita activado tras aceptar {initialBudgetForAppointment.number}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold uppercase tracking-wider text-[#0F172A] mt-0.5">
              Agenda de Citas con Clientes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-nueva-cita-toggle"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase rounded-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Ver citas' : 'Nueva Cita'}</span>
            </button>

            <button 
              onClick={onClose} 
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-sm transition-colors cursor-pointer"
              title="Cerrar agenda"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Formulario Nueva Cita */}
        {showAddForm ? (
          <div className="p-6 bg-white border-b border-[#E2E0D8] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Concertar Cita
            </h3>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Cliente *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs text-[#0F172A] font-medium"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cif})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Motivo / Título de la Cita *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Revisión técnica de proyecto"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Fecha de la Cita *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                  Notas / Acuerdos Previos
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre lugar, formato videollamada o documentación a aportar"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2942] text-white text-xs font-semibold uppercase rounded-xs"
                >
                  Guardar Cita en Agenda
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Listado de Citas */}
        <div className="p-6 overflow-y-auto space-y-3">
          {appointments.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#64748B]">
              No hay citas programadas en la agenda.
            </div>
          ) : (
            appointments.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-white border border-[#E2E0D8] rounded-sm shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#0F2942] text-white rounded-xs">
                      {app.date} • {app.time}
                    </span>
                    <h4 className="text-xs font-bold uppercase text-[#0F172A]">{app.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#475569]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-[#94A3B8]" />
                      {app.clientName}
                    </span>
                    {app.budgetId && (
                      <span className="flex items-center gap-1 text-[#1E3A8A] font-mono text-[11px]">
                        <FileText className="w-3 h-3" />
                        Presupuesto vinculado
                      </span>
                    )}
                  </div>
                  {app.notes && (
                    <p className="text-[11px] text-[#64748B] italic pt-1">{app.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={app.status}
                    onChange={(e) => onUpdateStatus(app.id, e.target.value as Appointment['status'])}
                    className="text-xs font-semibold px-2.5 py-1 bg-[#F8F7F3] border border-[#CBD5E1] rounded-xs uppercase"
                  >
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con botón de salida */}
        <div className="px-6 py-3.5 bg-[#F1F0EB] border-t border-[#E2E0D8] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#64748B]">
            {appointments.length} cita{appointments.length === 1 ? '' : 's'} en la agenda
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cerrar Agenda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
