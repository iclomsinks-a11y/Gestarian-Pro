import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { Appointment } from '../types';
import { Search, Calendar, Clock, Wrench, FolderKanban, Plus } from 'lucide-react';

interface CitasViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  appointments: Appointment[];
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenAgenda: () => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
}

export const CitasView: React.FC<CitasViewProps> = ({
  id,
  logoUrl,
  userFullName,
  appointments,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenAgenda,
  onNavigateToExpediente,
}) => {
  const [search, setSearch] = useState('');

  const filtered = appointments.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.clientName.toLowerCase().includes(q) ||
      app.title.toLowerCase().includes(q) ||
      app.date.toLowerCase().includes(q)
    );
  });

  return (
    <div id={id} className="min-h-screen bg-[#FDFBF7] flex flex-col snap-start shrink-0 w-full overflow-y-auto">
      <PageHeader
        title="Citas"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Barra superior con buscador y acceso directo a agenda */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cita por cliente, fecha o asunto..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          <button
            type="button"
            onClick={onOpenAgenda}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Abrir Agenda Interactiva</span>
          </button>
        </div>

        {/* Tarjetas con el mismo formato que Facturas Emitidas */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
            No hay citas programadas actualmente. Abre la agenda para programar una cita.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((app) => (
              <StandardCard
                key={app.id}
                status="PENDIENTE"
                statusColor="border-orange-500"
                statusTextColor="text-orange-500"
                vehiclePlate="9821-KLS"
                subtitle={`CITA TALLER: ${app.date} • ${app.time}H`}
                title={app.clientName}
                refCode={`CITA-${app.id.slice(0, 6).toUpperCase()}`}
                expediente={app.budgetId || 'E260004'}
                isExpandable={true}
                actions={
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-[#475569] bg-white p-2 rounded border border-gray-200">
                      <strong>Asunto:</strong> {app.title}
                      {app.notes && <p className="mt-1 text-[11px] text-[#64748B]">{app.notes}</p>}
                    </div>

                    <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={onOpenAgenda}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2942] hover:text-[#1E3A8A] transition-colors p-2 cursor-pointer"
                        title="Ver en Agenda"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Ver Agenda</span>
                      </button>

                      {onNavigateToExpediente && (
                        <button
                          type="button"
                          onClick={() => onNavigateToExpediente(app.budgetId || 'E260004')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:text-[#0284C7] transition-colors p-2 cursor-pointer"
                          title="Ver Expediente Vinculado"
                        >
                          <FolderKanban className="w-4 h-4" />
                          <span>Expediente</span>
                        </button>
                      )}
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
