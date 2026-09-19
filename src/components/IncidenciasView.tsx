import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { Search, AlertTriangle, FolderKanban, MessageSquare, CheckCircle } from 'lucide-react';

interface IncidenciasViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
}

interface IncidenciaItem {
  id: string;
  number: string;
  expediente: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  category: string;
  description: string;
  date: string;
}

const INITIAL_INCIDENCIAS: IncidenciaItem[] = [
  {
    id: 'inc-1',
    number: 'INC-2026-001',
    expediente: 'E260004',
    clientName: 'Alejandro Morales Garrido',
    clientPhone: '611223344',
    vehiclePlate: '9821-KLS',
    vehicleBrand: 'VOLKSWAGEN',
    vehicleModel: 'GOLF VII 2.0 TDI',
    category: 'RETRASO EN SUMINISTRO DE RECAMBIO',
    description: 'El proveedor Cecauto notifica retraso de 48h en la aleta delantera original.',
    date: '18/09/2026',
  },
  {
    id: 'inc-2',
    number: 'INC-2026-002',
    expediente: 'E260005',
    clientName: 'Transportes Vía Rápida S.L.',
    clientPhone: '644998877',
    vehiclePlate: '4421-HJK',
    vehicleBrand: 'MERCEDES-BENZ',
    vehicleModel: 'SPRINTER 316 CDI',
    category: 'AMPLIACIÓN DE PERITACIÓN REQUERIDA',
    description: 'Oculto tras desmontar paragolpes: traviesa interna deformada requiere aprobación del perito.',
    date: '17/09/2026',
  },
  {
    id: 'inc-3',
    number: 'INC-2026-003',
    expediente: 'E260006',
    clientName: 'Beatriz Navarro Cano',
    clientPhone: '655443322',
    vehiclePlate: '7190-LPZ',
    vehicleBrand: 'RENAULT',
    vehicleModel: 'CLIO V 1.0 TCE',
    category: 'AJUSTE DE MATIZ DE COLOR METALIZADO',
    description: 'Prueba de probeta de color requiere segundo difuminado por desgaste solar de carrocería previa.',
    date: '16/09/2026',
  },
];

export const IncidenciasView: React.FC<IncidenciasViewProps> = ({
  id,
  logoUrl,
  userFullName,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onNavigateToExpediente,
}) => {
  const [search, setSearch] = useState('');
  const [incidencias] = useState<IncidenciaItem[]>(INITIAL_INCIDENCIAS);

  const filtered = incidencias.filter((inc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inc.clientName.toLowerCase().includes(q) ||
      inc.vehiclePlate.toLowerCase().includes(q) ||
      inc.category.toLowerCase().includes(q) ||
      inc.number.toLowerCase().includes(q)
    );
  });

  return (
    <div id={id} className="min-h-screen bg-[#FDFBF7] flex flex-col snap-start shrink-0 w-full overflow-y-auto">
      <PageHeader
        title="Incidencias"
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
              placeholder="Buscar incidencia por matrícula, cliente o motivo..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          <div className="text-xs font-bold text-[#64748B]">
            {filtered.length} {filtered.length === 1 ? 'incidencia activa' : 'incidencias activas'}
          </div>
        </div>

        {/* Tarjetas con el mismo formato que Facturas Emitidas */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
            No se han registrado incidencias abiertas en el taller.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((inc) => (
              <StandardCard
                key={inc.id}
                status="PENDIENTE"
                statusColor="border-orange-500"
                statusTextColor="text-orange-500"
                vehiclePlate={inc.vehiclePlate}
                subtitle={inc.category}
                title={inc.clientName}
                refCode={inc.number}
                expediente={inc.expediente}
                isExpandable={true}
                actions={
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-[#475569] bg-white p-2 rounded border border-gray-200">
                      <strong>Detalle técnico:</strong> {inc.description}
                    </p>

                    <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                      <a
                        href={`https://wa.me/34${inc.clientPhone}?text=${encodeURIComponent(
                          `Estimado/a ${inc.clientName}, le contactamos de su taller respecto a su vehículo matrícula ${inc.vehiclePlate}: ${inc.description}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors p-2 cursor-pointer"
                        title="Avisar a cliente por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Avisar Cliente</span>
                      </a>

                      {onNavigateToExpediente && (
                        <button
                          type="button"
                          onClick={() => onNavigateToExpediente(inc.expediente)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:text-[#0284C7] transition-colors p-2 cursor-pointer"
                          title="Ver Expediente"
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
