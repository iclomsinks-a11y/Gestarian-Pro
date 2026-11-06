import React, { useState } from 'react';
import { X, Wrench, ShieldCheck, Search, Car, AlertTriangle, CheckCircle2, Plus, Calendar, Gauge } from 'lucide-react';
import { OFFICIAL_MAINTENANCE_PLANS, OfficialVehiclePlan } from '../data/officialMaintenancePlans';
import { GestarianDocument } from '../types';

interface VehicleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: GestarianDocument[];
  onShowToast: (msg: string) => void;
  onNewBudgetWithItems?: (plate: string, model: string, items: { description: string; unitPrice: number }[]) => void;
}

export const VehicleMaintenanceModal: React.FC<VehicleMaintenanceModalProps> = ({
  isOpen,
  onClose,
  documents,
  onShowToast,
  onNewBudgetWithItems,
}) => {
  if (!isOpen) return null;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(OFFICIAL_MAINTENANCE_PLANS[0].id);
  const [searchPlate, setSearchPlate] = useState<string>('');
  const [inputKm, setInputKm] = useState<number>(115000); // Kilometraje de prueba para generar avisos
  const [activeTab, setActiveTab] = useState<'plans' | 'alerts'>('plans');

  const selectedPlan = OFFICIAL_MAINTENANCE_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_MAINTENANCE_PLANS[0];

  // Extraer matrículas de los documentos del taller para comprobar mantenimientos reales
  const registeredVehicles = Array.from(
    new Set(
      documents
        .filter(d => d.vehiclePlate)
        .map(d => ({
          plate: d.vehiclePlate!,
          model: d.vehicleModel ? `${d.vehicleBrand || ''} ${d.vehicleModel}` : 'Vehículo Taller',
          client: d.clientName,
        }))
    )
  );

  return (
    <div 
      className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-[#09101d] border border-sky-400/80 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.25)] flex flex-col max-h-[92dvh] overflow-hidden text-slate-100">
        
        {/* Cabecera */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/50 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                  Planes Oficiales de Mantenimiento y Avisos de Taller
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Manuales Oficiales Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Intervalos oficiales de fabricante optimizados para avisos de mecánica y reparaciones
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de navegación interna */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Manuales y Modelos Oficiales
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Simulador de Avisos y Kilometraje
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Base de datos optimizada: <strong className="text-sky-300">Ford Transit, Sprinter, Master, Golf/León</strong>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'plans' ? (
            <div className="space-y-4">
              {/* Selector de Modelo Oficial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {OFFICIAL_MAINTENANCE_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPlanId === plan.id
                        ? 'bg-sky-950/60 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Car className="w-5 h-5 text-sky-400" />
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                        {plan.fuelType}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{plan.brandModel}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{plan.items.length} operaciones oficiales</p>
                  </button>
                ))}
              </div>

              {/* Detalle de Operaciones del Modelo Seleccionado */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedPlan.brandModel}</span>
                      <span className="text-xs font-normal text-sky-400">({selectedPlan.category})</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Intervalos extraídos de manuales oficiales de mantenimiento online (ej: pastillas de freno cada 120.000km, rótulas cada 200.000km).
                    </p>
                  </div>

                  {onNewBudgetWithItems && (
                    <button
                      type="button"
                      onClick={() => {
                        const items = selectedPlan.items.map(item => ({
                          description: `${item.component} (${item.description})`,
                          unitPrice: item.estimatedCost || 100,
                        }));
                        onNewBudgetWithItems('TRANSIT-DEMO', selectedPlan.brandModel, items);
                        onShowToast(`Orden de mantenimiento generada para ${selectedPlan.brandModel}`);
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Generar Presupuesto / OT Taller</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPlan.items.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{item.component}</span>
                        <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/80 border border-sky-800/60 px-2 py-0.5 rounded shrink-0">
                          Cada {item.intervalKm.toLocaleString()} km ({item.intervalMonths} meses)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-light">{item.description}</p>
                      {item.estimatedCost && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                          <span>Coste orientativo material y mano de obra:</span>
                          <strong className="text-emerald-400 font-mono">~{item.estimatedCost} €</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simulador de Avisos por Kilometraje */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">Simulador de Avisos de Mantenimiento</h4>
                    <p className="text-xs text-slate-400">
                      Introduce el kilometraje actual del vehículo para comprobar qué mantenimientos oficiales están próximos o vencidos.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-bold">Kilometraje Actual:</span>
                    <input
                      type="number"
                      value={inputKm}
                      onChange={(e) => setInputKm(Number(e.target.value))}
                      className="w-32 bg-slate-900 border border-sky-400/60 rounded-xl px-3 py-1.5 text-sm font-mono text-white text-right focus:outline-none"
                      step={5000}
                    />
                    <span className="text-xs text-slate-400 font-mono">km</span>
                  </div>
                </div>

                {/* Resultados de Avisos para el Kilometraje Introducido */}
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Avisos Activos para {selectedPlan.brandModel} con {inputKm.toLocaleString()} km:
                  </h5>

                  <div className="space-y-2">
                    {selectedPlan.items.map((item) => {
                      const diff = item.intervalKm - (inputKm % item.intervalKm);
                      const isDueSoon = diff <= 15000;
                      const isOverdue = inputKm >= item.intervalKm && (inputKm % item.intervalKm) <= 15000;

                      return (
                        <div 
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            isOverdue
                              ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                              : isDueSoon
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isOverdue ? (
                              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            ) : isDueSoon ? (
                              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-bold text-white uppercase">{item.component}</p>
                              <p className="text-[11px] text-slate-300">
                                Intervalo oficial: cada {item.intervalKm.toLocaleString()} km. {isOverdue ? '¡MANTENIMIENTO VENCIDO / URGENTE!' : isDueSoon ? `Próximo mantenimiento en ~${diff.toLocaleString()} km` : 'En rango óptimo de uso.'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                              : isDueSoon
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          }`}>
                            {isOverdue ? 'Aviso Urgente' : isDueSoon ? 'Aviso Próximo' : 'Al Día'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-light">
            Sincronizado con manuales de taller y especificaciones de fabricantes (Ford, Mercedes, Renault, VW).
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
