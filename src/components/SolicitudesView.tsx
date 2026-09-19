import React, { useState, useEffect } from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { Search, Plus, Send, Eye, FolderKanban, MessageSquare, Image as ImageIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { SolicitudItem } from '../types';
import { getStoredSolicitudes, saveStoredSolicitudes } from '../services/storage';

interface SolicitudesViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onNewBudgetWithData?: (data: {
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    vehiclePlate: string;
    vehicleBrand: string;
    vehicleModel: string;
    description?: string;
    images?: string[];
    expediente?: string;
    solicitudId?: string;
    solicitudNumber?: string;
  }) => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({
  id,
  logoUrl,
  userFullName,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onNewBudgetWithData,
  onNavigateToExpediente,
}) => {
  const [search, setSearch] = useState('');
  const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>(() => getStoredSolicitudes());

  useEffect(() => {
    const handleUpdate = () => {
      setSolicitudes(getStoredSolicitudes());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('gestarian_solicitudes_updated', handleUpdate);

    handleUpdate();

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('gestarian_solicitudes_updated', handleUpdate);
    };
  }, []);

  const handleUpdateStatus = (solId: string, newStatus: string) => {
    const nowStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const updated = solicitudes.map((s) =>
      s.id === solId
        ? {
            ...s,
            status: newStatus,
            reviewedAt: nowStr,
          }
        : s
    );
    setSolicitudes(updated);
    saveStoredSolicitudes(updated);
    window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: { solId, newStatus } }));
  };

  const getStatusBadgeProps = (status?: string) => {
    switch (status) {
      case 'APROBADA':
        return {
          statusColor: 'border-emerald-500',
          statusTextColor: 'text-emerald-600',
        };
      case 'RECHAZADA':
        return {
          statusColor: 'border-rose-500',
          statusTextColor: 'text-rose-600',
        };
      case 'PRESUPUESTADA':
        return {
          statusColor: 'border-blue-500',
          statusTextColor: 'text-blue-600',
        };
      case 'PENDIENTE':
      default:
        return {
          statusColor: 'border-orange-500',
          statusTextColor: 'text-orange-500',
        };
    }
  };

  const filtered = solicitudes.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.clientName.toLowerCase().includes(q) ||
      s.vehiclePlate.toLowerCase().includes(q) ||
      s.number.toLowerCase().includes(q) ||
      s.vehicleBrand.toLowerCase().includes(q)
    );
  });

  return (
    <div id={id} className="min-h-screen bg-[#FDFBF7] flex flex-col snap-start shrink-0 w-full overflow-y-auto">
      <PageHeader
        title="Solicitudes"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Barra superior con buscador */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, matrícula o solicitud..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>
          <div className="text-xs font-bold text-[#64748B]">
            {filtered.length} {filtered.length === 1 ? 'solicitud' : 'solicitudes'} entrantes
          </div>
        </div>

        {/* Tarjetas con el mismo formato que Facturas Emitidas */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
            No se encontraron solicitudes con el criterio de búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((sol) => {
              const badgeProps = getStatusBadgeProps(sol.status);
              return (
                <StandardCard
                  key={sol.id}
                  status={sol.status || "PENDIENTE"}
                  statusColor={badgeProps.statusColor}
                  statusTextColor={badgeProps.statusTextColor}
                  vehiclePlate={sol.vehiclePlate || 'SIN MATRÍCULA'}
                  subtitle={
                    `${sol.vehicleBrand || ''} ${sol.vehicleModel || ''}`.trim() ||
                    sol.type ||
                    'Solicitud de Presupuesto'
                  }
                  title={sol.clientName}
                  refCode={sol.number}
                  expediente={sol.expediente}
                  isExpandable={true}
                  actions={
                    <div className="flex flex-col gap-3">
                      <p className="text-xs text-[#475569] italic bg-white p-2 rounded border border-gray-200">
                        "{sol.description}"
                      </p>
                      {sol.images && sol.images.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                            Fotos adjuntas ({sol.images.length})
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {sol.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Foto adjunta ${idx + 1}`}
                                className="w-16 h-12 object-cover rounded border border-gray-200 shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botones de gestión rápida de estado para el taller */}
                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-gray-200 text-[11px]">
                        <span className="text-[#64748B] font-semibold text-[10px] uppercase">
                          Resolución taller:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(sol.id, 'APROBADA')}
                            className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              sol.status === 'APROBADA'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title="Aprobar solicitud de presupuesto"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(sol.id, 'RECHAZADA')}
                            className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              sol.status === 'RECHAZADA'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                            title="Rechazar solicitud"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>

                          {sol.status !== 'PENDIENTE' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(sol.id, 'PENDIENTE')}
                              className="px-1.5 py-1 text-[#64748B] hover:text-[#0F172A] text-[10px] underline cursor-pointer"
                              title="Restablecer a Pendiente"
                            >
                              Pendiente
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-around gap-2 pt-1 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateStatus(sol.id, 'PRESUPUESTADA');
                            if (onNewBudgetWithData) {
                              onNewBudgetWithData({
                                clientName: sol.clientName,
                                clientPhone: sol.clientPhone,
                                clientEmail: sol.clientEmail,
                                vehiclePlate: sol.vehiclePlate,
                                vehicleBrand: sol.vehicleBrand,
                                vehicleModel: sol.vehicleModel,
                                description: sol.description,
                                images: sol.images,
                                expediente: sol.expediente,
                                solicitudId: sol.id,
                                solicitudNumber: sol.number,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2942] hover:text-[#1E3A8A] transition-colors p-2 cursor-pointer"
                          title="Elaborar Presupuesto con Número Reservado"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Presupuestar</span>
                        </button>

                        {sol.clientPhone && (
                          <a
                            href={`https://wa.me/${sol.clientPhone.replace(/\D/g, '').startsWith('34') ? sol.clientPhone.replace(/\D/g, '') : '34' + sol.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hola ${sol.clientName}, nos ponemos en contacto desde el taller respecto a tu solicitud para el vehículo con matrícula ${sol.vehiclePlate}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors p-2 cursor-pointer"
                            title="Contactar vía WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {onNavigateToExpediente && (
                          <button
                            type="button"
                            onClick={() => onNavigateToExpediente(sol.expediente)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:text-[#0284C7] transition-colors p-2 cursor-pointer"
                            title="Ver Expediente y Roadmap"
                          >
                            <FolderKanban className="w-4 h-4" />
                            <span>Expediente</span>
                          </button>
                        )}
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
