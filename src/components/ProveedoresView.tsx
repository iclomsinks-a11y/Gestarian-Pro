import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { Search, Plus, Truck, Phone, Mail, FileText, MessageSquare, Package } from 'lucide-react';

interface ProveedoresViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenFacturaRecibidaModal?: () => void;
}

interface ProveedorItem {
  id: string;
  code: string;
  name: string;
  cif: string;
  sector: string;
  phone: string;
  email: string;
  pendingOrderRef: string;
  expedienteVinculado: string;
  lastDelivery: string;
}

const INITIAL_PROVEEDORES: ProveedorItem[] = [
  {
    id: 'prov-1',
    code: 'PROV-01',
    name: 'Cecauto Recambios Central S.A.',
    cif: 'A08234112',
    sector: 'CHAPA, PARAGOLPES Y ELEMENTOS AMOVIBLES',
    phone: '912345678',
    email: 'pedidos@cecauto.es',
    pendingOrderRef: 'PED-2026-081',
    expedienteVinculado: 'E260004',
    lastDelivery: 'Aleta der. Golf VII',
  },
  {
    id: 'prov-2',
    code: 'PROV-02',
    name: 'Axalta Coating Systems España S.L.',
    cif: 'B28114092',
    sector: 'PINTURAS, BARNICES HS Y FONDOS DE COLOR',
    phone: '934567890',
    email: 'contacto@axalta.es',
    pendingOrderRef: 'PED-2026-082',
    expedienteVinculado: 'E260005',
    lastDelivery: 'Gama Cromax Pro',
  },
  {
    id: 'prov-3',
    code: 'PROV-03',
    name: 'Zaphiro Carrocería & Anexos',
    cif: 'B91238472',
    sector: 'ABRASIVOS, MASILLAS Y CINTAS DE ENMASCARAR',
    phone: '945678901',
    email: 'comercial@zaphiro.com',
    pendingOrderRef: 'PED-2026-083',
    expedienteVinculado: 'E260006',
    lastDelivery: 'Discos abrasivos y burletes',
  },
  {
    id: 'prov-4',
    code: 'PROV-04',
    name: 'Cristalbox Lunas del Automóvil S.L.',
    cif: 'B78129841',
    sector: 'PARABRISAS, LUNAS TÉRMICAS Y CRISTALERÍA',
    phone: '916789012',
    email: 'cristal@cristalbox.es',
    pendingOrderRef: 'PED-2026-084',
    expedienteVinculado: 'E260007',
    lastDelivery: 'Parabrisas acústico sensor',
  },
];

export const ProveedoresView: React.FC<ProveedoresViewProps> = ({
  id,
  logoUrl,
  userFullName,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenFacturaRecibidaModal,
}) => {
  const [search, setSearch] = useState('');
  const [proveedores] = useState<ProveedorItem[]>(INITIAL_PROVEEDORES);

  const filtered = proveedores.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.cif.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q)
    );
  });

  return (
    <div id={id} className="min-h-screen bg-[#FDFBF7] flex flex-col snap-start shrink-0 w-full overflow-y-auto">
      <PageHeader
        title="Proveedores"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Barra superior con buscador y acceso a factura recibida */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proveedor por nombre, CIF, referencia o sector..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          {onOpenFacturaRecibidaModal && (
            <button
              type="button"
              onClick={onOpenFacturaRecibidaModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Factura Recibida</span>
            </button>
          )}
        </div>

        {/* Tarjetas con el mismo formato que Facturas Emitidas */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
            No se encontraron proveedores con el criterio de búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((prov) => (
              <StandardCard
                key={prov.id}
                status="PENDIENTE"
                statusColor="border-orange-500"
                statusTextColor="text-orange-500"
                vehiclePlate={prov.code}
                subtitle={prov.sector}
                title={prov.name}
                refCode={`CIF: ${prov.cif}`}
                expediente={prov.pendingOrderRef}
                isExpandable={true}
                actions={
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-[#64748B] bg-white p-2 rounded border border-gray-200 flex flex-col gap-1">
                      <div><strong>Último material pedido:</strong> {prov.lastDelivery}</div>
                      <div><strong>Expediente taller:</strong> {prov.expedienteVinculado}</div>
                    </div>

                    <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                      <a
                        href={`mailto:${prov.email}?subject=Consulta de Pedido ${prov.pendingOrderRef}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2942] hover:text-[#1E3A8A] transition-colors p-2 cursor-pointer"
                        title="Enviar Correo"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </a>

                      <a
                        href={`https://wa.me/34${prov.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors p-2 cursor-pointer"
                        title="Contactar vía WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>

                      {onOpenFacturaRecibidaModal && (
                        <button
                          type="button"
                          onClick={onOpenFacturaRecibidaModal}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#38BDF8] hover:text-[#0284C7] transition-colors p-2 cursor-pointer"
                          title="Registrar Factura de este proveedor"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Factura</span>
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
