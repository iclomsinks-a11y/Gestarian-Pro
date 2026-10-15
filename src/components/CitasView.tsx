import React, { useState, useEffect } from 'react';
import { StandardCard } from './StandardCard';
import { Appointment, GestarianDocument } from '../types';
import { Calendar, FolderKanban, MessageCircle, Phone, Printer } from 'lucide-react';

interface CitasViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  appointments: Appointment[];
  documents?: GestarianDocument[];
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  onOpenAgenda: () => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
}

export const CitasView: React.FC<CitasViewProps> = ({
  id,
  appointments,
  documents = [],
  onOpenAgenda,
  onNavigateToExpediente,
}) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleCitasSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail && typeof customEvent.detail.query === 'string') {
        setSearch(customEvent.detail.query);
      }
    };
    window.addEventListener('gestarian_citas_search', handleCitasSearch);
    return () => window.removeEventListener('gestarian_citas_search', handleCitasSearch);
  }, []);

  const filtered = appointments.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.clientName.toLowerCase().includes(q) ||
      app.title.toLowerCase().includes(q) ||
      app.date.toLowerCase().includes(q) ||
      (app.budgetId && app.budgetId.toLowerCase().includes(q))
    );
  });

  return (
    <div id={id} className="w-full">
      {filtered.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm font-medium">
          {search.trim()
            ? 'No se encontraron citas con el criterio de búsqueda.'
            : 'No hay citas programadas actualmente. Abre la agenda para programar una cita.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((app) => {
            // Buscar documento vinculado por budgetId o expediente
            const linkedDoc = documents.find(
              (d) =>
                (app.budgetId && (d.id === app.budgetId || d.number === app.budgetId || d.expediente === app.budgetId))
            );

            // Determinar estado de la cita: Pendiente (Naranja), Aceptada (Azul), Confirmada (Verde)
            const isConfirmed =
              app.status === 'confirmada' ||
              app.status === 'completada' ||
              linkedDoc?.citaStatus === 'cita_confirmada' ||
              linkedDoc?.tallerStatus === 'enviar_a_taller' ||
              linkedDoc?.tallerStatus === 'en_reparacion' ||
              linkedDoc?.tallerStatus === 'reparacion_finalizada';

            const isAccepted =
              !isConfirmed && (
                app.status === 'aceptada' ||
                linkedDoc?.citaStatus === 'cita_aceptada' ||
                linkedDoc?.deliveryDateStatus === 'accepted' ||
                Boolean(linkedDoc?.acceptedByClient) ||
                linkedDoc?.status === 'aceptado'
              );

            let statusLabel = 'PENDIENTE';
            let statusColor = 'border border-orange-500';
            let statusTextColor = 'text-orange-500';

            if (isConfirmed) {
              statusLabel = 'CONFIRMADA';
              statusColor = 'border border-emerald-500';
              statusTextColor = 'text-emerald-600';
            } else if (isAccepted) {
              statusLabel = 'ACEPTADA';
              statusColor = 'border border-blue-600';
              statusTextColor = 'text-blue-600';
            }

            const plate = linkedDoc?.vehiclePlate || '9821-KLS';
            const vehicle =
              [linkedDoc?.vehicleBrand, linkedDoc?.vehicleModel || linkedDoc?.vehicleType].filter(Boolean).join(' ') ||
              'Vehículo en Taller';
            const targetExp = linkedDoc?.expediente || app.budgetId || 'E260004';

            return (
              <StandardCard
                key={app.id}
                status={statusLabel}
                statusColor={statusColor}
                statusTextColor={statusTextColor}
                vehiclePlate={plate}
                subtitle={`CITA TALLER: ${app.date} • ${app.time}H — ${vehicle}`}
                title={app.clientName}
                refCode={`CITA-${app.id.slice(0, 6).toUpperCase()}`}
                expediente={targetExp}
                cleanNumbersLayout={true}
                isExpandable={true}
                actions={
                  <div className="flex flex-col gap-3">
                    {/* Asunto con tamaño de texto x2 (text-xl sm:text-2xl) */}
                    <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                        Asunto:
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                        {app.title}
                      </div>
                      {app.notes && <p className="mt-2 text-xs sm:text-sm text-[#64748B] font-medium">{app.notes}</p>}
                    </div>

                    {/* Iconos de acción desplegados incluyendo Imprimir con el software de impresora por defecto */}
                    <div className="grid grid-cols-5 gap-2 sm:gap-3 items-center justify-items-center pt-2 border-t border-gray-200">
                      {/* 1. Ver en Agenda */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAgenda();
                        }}
                        className="p-1.5 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title="Ver en Agenda"
                        aria-label="Ver en Agenda"
                      >
                        <Calendar className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.8} />
                      </button>

                      {/* 2. Ver Expediente Vinculado */}
                      {onNavigateToExpediente && targetExp ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToExpediente(targetExp);
                          }}
                          className="p-1.5 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                          title="Ver Expediente Vinculado"
                          aria-label="Expediente"
                        >
                          <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.8} />
                        </button>
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12" />
                      )}

                      {/* 3. Imprimir Tarjeta de Cita mediante el software por defecto del dispositivo */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.print();
                        }}
                        className="p-1.5 text-slate-800 hover:text-sky-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title="Imprimir Tarjeta de Cita"
                        aria-label="Imprimir"
                      >
                        <Printer className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.8} />
                      </button>

                      {/* 4. Recordatorio por WhatsApp */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = linkedDoc?.clientPhone || '600000000';
                          const cleanPhone = phone.replace(/\D/g, '');
                          window.open(
                            `https://wa.me/34${cleanPhone}?text=${encodeURIComponent(
                              `Hola ${app.clientName}, le recordamos su cita en taller el día ${app.date} a las ${app.time}H.`
                            )}`,
                            '_blank'
                          );
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title={`WhatsApp recordatorio a ${app.clientName}`}
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.8} />
                      </button>

                      {/* 5. Llamar por teléfono */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = linkedDoc?.clientPhone || '';
                          if (phone) window.location.href = `tel:${phone}`;
                        }}
                        className={`p-1.5 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative ${
                          !linkedDoc?.clientPhone ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title={linkedDoc?.clientPhone ? `Llamar a ${app.clientName} (${linkedDoc.clientPhone})` : 'Sin teléfono directo'}
                        aria-label="Llamar"
                        disabled={!linkedDoc?.clientPhone}
                      >
                        <Phone className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
