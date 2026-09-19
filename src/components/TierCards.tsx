import React from 'react';
import { PlusCircle, FileCheck, Calendar, BarChart3, UserPlus, Users } from 'lucide-react';

interface TierCardsProps {
  currentTier: 'lite' | 'pro' | 'enterprise';
  onSelectTier: (tier: 'lite' | 'pro' | 'enterprise') => void;
  onNewBudget: () => void;
  onNewInvoice: () => void;
  onOpenReports: () => void;
  onOpenAgenda: () => void;
  onOpenWorkOrders: () => void;
  onOpenNewClient: () => void;
  onOpenClientArea: () => void;
}

export const TierCards: React.FC<TierCardsProps> = ({
  currentTier,
  onSelectTier,
  onNewBudget,
  onNewInvoice,
  onOpenReports,
  onOpenAgenda,
  onOpenWorkOrders,
  onOpenNewClient,
  onOpenClientArea,
}) => {
  return (
    <section className="w-full mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ================= CARD 1: LITE ================= */}
        <div
          id="card-tier-lite"
          className={`flex flex-col justify-between p-6 bg-white border ${
            currentTier === 'lite'
              ? 'border-[#0F2942] ring-1 ring-[#0F2942]'
              : 'border-[#E2E0D8] hover:border-[#CBD5E1]'
          } rounded-sm shadow-xs transition-all`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
                Nivel Inicial
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] rounded-sm">
                Autónomos
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase tracking-wider text-[#0F172A] mb-2">
              LITE
            </h3>

            <p className="text-sm text-[#475569] mb-5 leading-relaxed">
              Emisión ágil de presupuestos y facturas con cálculo directo de IVA 21%, conversión inmediata y compartición nativa en dispositivo.
            </p>

            <ul className="space-y-2.5 text-xs text-[#334155] border-t border-[#F1F0EB] pt-4 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Presupuestos con o sin IVA (casilla 21%)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Conversión directa de presupuesto a factura</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Generación directa de factura</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Guardado persistente y botón compartir nativo</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F0EB]">
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-lite-crear-presupuesto"
                onClick={onNewBudget}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Presupuesto</span>
              </button>

              <button
                id="btn-lite-crear-factura"
                onClick={onNewInvoice}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Factura</span>
              </button>
            </div>

            <button
              id="btn-select-tier-lite"
              onClick={() => onSelectTier('lite')}
              className={`w-full text-center text-[11px] font-semibold uppercase py-1.5 transition-colors ${
                currentTier === 'lite'
                  ? 'text-[#0F2942] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {currentTier === 'lite' ? '● Modo Lite Activo' : 'Activar Modo Lite'}
            </button>
          </div>
        </div>

        {/* ================= CARD 2: PRO ================= */}
        <div
          id="card-tier-pro"
          className={`flex flex-col justify-between p-6 bg-white border ${
            currentTier === 'pro'
              ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
              : 'border-[#E2E0D8] hover:border-[#CBD5E1]'
          } rounded-sm shadow-xs relative transition-all`}
        >
          <div className="absolute -top-3 right-4">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#1E3A8A] text-white rounded-sm shadow-xs">
              Profesional & Gestoría
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1E3A8A]">
                Gestión Completa
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase tracking-wider text-[#0F172A] mb-2">
              PRO
            </h3>

            <p className="text-sm text-[#475569] mb-5 leading-relaxed">
              Base de datos integral de clientes y facturas, informes trimestrales para gestoría (A3, SAGE, XLS) y agenda automática de citas.
            </p>

            <ul className="space-y-2.5 text-xs text-[#334155] border-t border-[#F1F0EB] pt-4 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]"></span>
                <span>Cartera de clientes y archivo centralizado</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]"></span>
                <span>Informes trimestrales gestoría (A3, SAGE, Excel XML/XLS)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]"></span>
                <span>Agenda integrada: cita directa al aceptar presupuesto</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]"></span>
                <span>Confirmación previa e inmutabilidad legal tras envío</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F0EB]">
            {/* Gestión de clientes del usuario en PRO */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-pro-nuevo-cliente"
                onClick={onOpenNewClient}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2942] border border-[#CBD5E1] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-2xs"
                title="Dar de alta un nuevo cliente para este usuario"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>+ Cliente</span>
              </button>

              <button
                id="btn-pro-cartera-clientes"
                onClick={onOpenClientArea}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF9F5] text-[#475569] border border-[#E2E0D8] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-2xs"
                title="Ver cartera de clientes registrados"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cartera</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-pro-informes-fiscales"
                onClick={onOpenReports}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Gestoría</span>
              </button>

              <button
                id="btn-pro-agenda-citas"
                onClick={onOpenAgenda}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#F8F7F3] text-[#0F2942] border border-[#0F2942] text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            <button
              id="btn-select-tier-pro"
              onClick={() => onSelectTier('pro')}
              className={`w-full text-center text-[11px] font-semibold uppercase py-1.5 transition-colors ${
                currentTier === 'pro'
                  ? 'text-[#1E3A8A] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {currentTier === 'pro' ? '● Modo Pro Activo' : 'Activar Modo Pro'}
            </button>
          </div>
        </div>

        {/* ================= CARD 3: ENTERPRISE ================= */}
        <div
          id="card-tier-enterprise"
          className={`flex flex-col justify-between p-6 bg-white border ${
            currentTier === 'enterprise'
              ? 'border-[#0F2942] ring-1 ring-[#0F2942]'
              : 'border-[#E2E0D8] hover:border-[#CBD5E1]'
          } rounded-sm shadow-xs transition-all`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
                Pequeñas Empresas
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] rounded-sm">
                Pymes
              </span>
            </div>

            <h3 className="text-xl font-bold uppercase tracking-wider text-[#0F172A] mb-2">
              ENTERPRISE
            </h3>

            <p className="text-sm text-[#475569] mb-5 leading-relaxed">
              Solución para sociedades y equipos: múltiples series de facturación, retenciones IRPF complejas y trazabilidad para auditoría fiscal.
            </p>

            <ul className="space-y-2.5 text-xs text-[#334155] border-t border-[#F1F0EB] pt-4 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Múltiples series (General, Rectificativas, Proyectos)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Configuración de IRPF (15%, 7% nuevos autónomos)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Cálculo y auditoría de retenciones acumuladas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F2942]"></span>
                <span>Arquitectura Supabase + Resend con multi-usuario</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F1F0EB]">
            {/* Gestión de clientes para empresas en ENTERPRISE */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-enterprise-nuevo-cliente"
                onClick={onOpenNewClient}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2942] border border-[#CBD5E1] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-2xs"
                title="Dar de alta un nuevo cliente para esta empresa"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#0F2942]" />
                <span>+ Cliente</span>
              </button>

              <button
                id="btn-enterprise-cartera-clientes"
                onClick={onOpenClientArea}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF9F5] text-[#475569] border border-[#E2E0D8] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-2xs"
                title="Ver cartera de clientes registrados"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cartera</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-enterprise-nueva-factura-series"
                onClick={onNewInvoice}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Factura Serie</span>
              </button>

              <button
                id="btn-enterprise-informes"
                onClick={onOpenReports}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Cierre Fiscal</span>
              </button>
            </div>
            
            <button
              onClick={onOpenWorkOrders}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#F8F7F3] text-[#0F2942] border border-[#0F2942] text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Gestión de Órdenes (OT)</span>
            </button>

            <button
              id="btn-select-tier-enterprise"
              onClick={() => onSelectTier('enterprise')}
              className={`w-full text-center text-[11px] font-semibold uppercase py-1.5 transition-colors ${
                currentTier === 'enterprise'
                  ? 'text-[#0F2942] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {currentTier === 'enterprise' ? '● Modo Enterprise Activo' : 'Activar Modo Enterprise'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
