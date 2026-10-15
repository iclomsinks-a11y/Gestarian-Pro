import React from 'react';
import { 
  PlusCircle, FileCheck, Calendar, BarChart3, UserPlus, Users, 
  ShieldCheck, Network, Camera, Mail, Check, Sparkles, Building2,
  FileSpreadsheet, ArrowRight
} from 'lucide-react';
import { GestarianPlan } from '../types';

interface TierCardsProps {
  currentTier: GestarianPlan;
  onSelectTier: (tier: GestarianPlan) => void;
  onNewBudget: () => void;
  onNewInvoice: () => void;
  onOpenReports?: () => void;
  onOpenAgenda?: () => void;
  onOpenWorkOrders?: () => void;
  onOpenNewClient?: () => void;
  onOpenClientArea?: () => void;
  onOpenEnterpriseAeat?: () => void;
  onOpenQuickExtras?: () => void;
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
  onOpenEnterpriseAeat,
  onOpenQuickExtras,
}) => {
  return (
    <section className="w-full mb-10 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* ================= CARD 1: LITE ================= */}
        <div
          id="card-tier-lite"
          className={`flex flex-col justify-between p-5 bg-white border ${
            currentTier === 'lite'
              ? 'border-slate-900 ring-2 ring-slate-900 shadow-md'
              : 'border-slate-200 hover:border-slate-400'
          } rounded-lg shadow-xs transition-all`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Inicio Directo
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-slate-100 text-slate-800 rounded">
                Gratis para siempre
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xl">🪐</span>
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                LITE
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Emisión directa de presupuestos y facturas en dispositivo local sin persistencia externa ni base de datos.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3 mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Acceso exclusivo: Presupuestos y Facturas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Guardado instantáneo en dispositivo local</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Impresión PDF estándar y envío por Email</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-3.5 h-3.5 text-center text-slate-300">✕</span>
                <span>Sin base de datos ni taller ni AEAT</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-lite-crear-presupuesto"
                type="button"
                onClick={onNewBudget}
                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Presupuesto</span>
              </button>

              <button
                id="btn-lite-crear-factura"
                type="button"
                onClick={onNewInvoice}
                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
              >
                <FileCheck className="w-3 h-3" />
                <span>Factura</span>
              </button>
            </div>

            <button
              id="btn-select-tier-lite"
              type="button"
              onClick={() => onSelectTier('lite')}
              className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                currentTier === 'lite'
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {currentTier === 'lite' ? '✓ Plan Activo' : 'Activar Lite'}
            </button>
          </div>
        </div>

        {/* ================= CARD 2: QUICK ================= */}
        <div
          id="card-tier-quick"
          className={`flex flex-col justify-between p-5 bg-white border ${
            currentTier === 'quick'
              ? 'border-blue-600 ring-2 ring-blue-600 shadow-md'
              : 'border-slate-200 hover:border-slate-400'
          } rounded-lg shadow-xs transition-all`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                Base de Datos
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-blue-50 text-blue-800 rounded">
                Gratis + Extras
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xl">⚡</span>
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                QUICK
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Todo lo de Lite con base de datos de Clientes y Proveedores, custodia de 1 año y envío por WhatsApp.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3 mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Base de datos Clientes & Proveedores</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Custodia BD gratis 1er año | 1-4a (+10€/año) | 4-8a (+15€/año)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Rastreo email + Captura cámara OCR (+19€/año)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-3.5 h-3.5 text-center text-slate-300">✕</span>
                <span>Sin Inteligencia Artificial ni conversación de voz</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {onOpenQuickExtras && (
              <button
                type="button"
                onClick={onOpenQuickExtras}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded border border-blue-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver Extras Activables</span>
              </button>
            )}

            <button
              id="btn-select-tier-quick"
              type="button"
              onClick={() => onSelectTier('quick')}
              className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                currentTier === 'quick'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {currentTier === 'quick' ? '✓ Plan Activo' : 'Activar Quick'}
            </button>
          </div>
        </div>

        {/* ================= CARD 3: PRO ================= */}
        <div
          id="card-tier-pro"
          className={`flex flex-col justify-between p-5 bg-white border ${
            currentTier === 'pro'
              ? 'border-teal-600 ring-2 ring-teal-600 shadow-md'
              : 'border-slate-200 hover:border-slate-400'
          } rounded-lg shadow-xs transition-all relative`}
        >
          <div className="absolute -top-2.5 right-4 bg-teal-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
            Recomendado
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
                Gestión Integral
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-teal-50 text-teal-800 rounded">
                Todo Incluido
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xl">💎</span>
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                PRO
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Expedientes, órdenes de taller, peritaje, nuevo módulo Mi Equipo, informes oficiales AEAT y enlace contable.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3 mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Roadmap de expedientes y evolución visual</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Módulo "Mi Equipo" y nóminas completas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Modelos AEAT (303, 111, 115, 390)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Enlace contable: A3, Sage, XLS y CSV</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Portal de Clientes por invitación en tiempo real</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {onOpenReports && (
              <button
                type="button"
                onClick={onOpenReports}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                <span>Informes Gestoría & Modelos</span>
              </button>
            )}

            <button
              id="btn-select-tier-pro"
              type="button"
              onClick={() => onSelectTier('pro')}
              className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                currentTier === 'pro'
                  ? 'bg-teal-700 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {currentTier === 'pro' ? '✓ Plan Activo' : 'Activar Pro'}
            </button>
          </div>
        </div>

        {/* ================= CARD 4: ENTERPRISE ================= */}
        <div
          id="card-tier-enterprise"
          className={`flex flex-col justify-between p-5 bg-white border ${
            currentTier === 'enterprise'
              ? 'border-amber-500 ring-2 ring-amber-500 shadow-md'
              : 'border-slate-200 hover:border-slate-400'
          } rounded-lg shadow-xs transition-all`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Corporativo B2B
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-50 text-amber-800 rounded">
                Sin Límites
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xl">🏢</span>
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                ENTERPRISE
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Todo lo de Pro sin límites de volumen ni empleados, con Sede Electrónica AEAT telemática y Red B2B.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3 mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Sin límites de empleados ni expedientes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Sede Electrónica AEAT por Certificado Digital</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Red Interempresas B2B de reparto</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Comisión automática del 5% por derivación</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {onOpenEnterpriseAeat && (
              <button
                type="button"
                onClick={onOpenEnterpriseAeat}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded border border-amber-300 transition-colors"
              >
                <Network className="w-3.5 h-3.5 text-amber-700" />
                <span>Sede AEAT & Red B2B</span>
              </button>
            )}

            <button
              id="btn-select-tier-enterprise"
              type="button"
              onClick={() => onSelectTier('enterprise')}
              className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                currentTier === 'enterprise'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {currentTier === 'enterprise' ? '✓ Plan Activo' : 'Activar Enterprise'}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
