import React, { useState, useEffect, useMemo } from 'react';
import { GestarianDocument } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

interface BalancesViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  documents: GestarianDocument[];
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  id,
}) => {
  const [timeframe, setTimeframe] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [viewMode, setViewMode] = useState<'grafico' | 'lineas'>('grafico');

  useEffect(() => {
    const handleTimeframe = (e: Event) => {
      const customEvent = e as CustomEvent<{ timeframe: 'mensual' | 'trimestral' | 'anual' }>;
      if (customEvent.detail && customEvent.detail.timeframe) {
        setTimeframe(customEvent.detail.timeframe);
      }
    };

    const handleViewMode = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: 'grafico' | 'lineas' }>;
      if (customEvent.detail && customEvent.detail.mode) {
        setViewMode(customEvent.detail.mode);
      }
    };

    window.addEventListener('gestarian_balance_timeframe', handleTimeframe);
    window.addEventListener('gestarian_balance_view_mode', handleViewMode);
    return () => {
      window.removeEventListener('gestarian_balance_timeframe', handleTimeframe);
      window.removeEventListener('gestarian_balance_view_mode', handleViewMode);
    };
  }, []);

  // Datos financieros por período
  const monthlyData = useMemo(() => [
    { name: 'Ene', label: 'Enero', ingresos: 4200, gastos: 2400, ivaRepercutido: 882, ivaSoportado: 504 },
    { name: 'Feb', label: 'Febrero', ingresos: 3800, gastos: 1900, ivaRepercutido: 798, ivaSoportado: 399 },
    { name: 'Mar', label: 'Marzo', ingresos: 5100, gastos: 2800, ivaRepercutido: 1071, ivaSoportado: 588 },
    { name: 'Abr', label: 'Abril', ingresos: 4900, gastos: 2600, ivaRepercutido: 1029, ivaSoportado: 546 },
    { name: 'May', label: 'Mayo', ingresos: 6200, gastos: 3100, ivaRepercutido: 1302, ivaSoportado: 651 },
    { name: 'Jun', label: 'Junio', ingresos: 5800, gastos: 2950, ivaRepercutido: 1218, ivaSoportado: 619.5 },
    { name: 'Jul', label: 'Julio', ingresos: 7100, gastos: 3400, ivaRepercutido: 1491, ivaSoportado: 714 },
    { name: 'Ago', label: 'Agosto', ingresos: 4500, gastos: 2200, ivaRepercutido: 945, ivaSoportado: 462 },
    { name: 'Sep', label: 'Septiembre', ingresos: 6800, gastos: 3200, ivaRepercutido: 1428, ivaSoportado: 672 },
    { name: 'Oct', label: 'Octubre', ingresos: 5900, gastos: 2900, ivaRepercutido: 1239, ivaSoportado: 609 },
    { name: 'Nov', label: 'Noviembre', ingresos: 6400, gastos: 3150, ivaRepercutido: 1344, ivaSoportado: 661.5 },
    { name: 'Dic', label: 'Diciembre', ingresos: 7300, gastos: 3600, ivaRepercutido: 1533, ivaSoportado: 756 },
  ], []);

  const quarterlyData = useMemo(() => [
    { name: '1T', label: '1º Trimestre', ingresos: 13100, gastos: 7100, ivaRepercutido: 2751, ivaSoportado: 1491 },
    { name: '2T', label: '2º Trimestre', ingresos: 16900, gastos: 8650, ivaRepercutido: 3549, ivaSoportado: 1816.5 },
    { name: '3T', label: '3º Trimestre (Actual)', ingresos: 18400, gastos: 8800, ivaRepercutido: 3864, ivaSoportado: 1848 },
    { name: '4T', label: '4º Trimestre', ingresos: 19600, gastos: 9650, ivaRepercutido: 4116, ivaSoportado: 2026.5 },
  ], []);

  const annualData = useMemo(() => [
    { name: '2024', label: 'Ejercicio 2024', ingresos: 52000, gastos: 29000, ivaRepercutido: 10920, ivaSoportado: 6090 },
    { name: '2025', label: 'Ejercicio 2025', ingresos: 61500, gastos: 32800, ivaRepercutido: 12915, ivaSoportado: 6888 },
    { name: '2026', label: 'Ejercicio 2026 (Proyección)', ingresos: 68000, gastos: 34200, ivaRepercutido: 14280, ivaSoportado: 7182 },
  ], []);

  // Totales dinámicos según la horquilla
  const currentDataset = timeframe === 'mensual' ? monthlyData : timeframe === 'trimestral' ? quarterlyData : annualData;

  const totalIngresos = currentDataset.reduce((sum, item) => sum + item.ingresos, 0);
  const totalGastos = currentDataset.reduce((sum, item) => sum + item.gastos, 0);
  const totalIvaRepercutido = currentDataset.reduce((sum, item) => sum + item.ivaRepercutido, 0);
  const totalIvaSoportado = currentDataset.reduce((sum, item) => sum + item.ivaSoportado, 0);
  const balanceNeto = totalIngresos - totalGastos;
  const liquidacionIva = totalIvaRepercutido - totalIvaSoportado;

  const timeframeLabel = timeframe === 'mensual' ? 'Mensual' : timeframe === 'trimestral' ? 'Trimestral' : 'Anual';

  return (
    <div id={id} className="w-full flex flex-col gap-6 select-none max-w-6xl mx-auto">
      
      {/* 1. MODO GRÁFICO: UN SOLO GRÁFICO LIMPIO ARRIBA */}
      {viewMode === 'grafico' && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                {timeframe === 'mensual' && 'Evolución Mensual (Ingresos vs Gastos)'}
                {timeframe === 'trimestral' && 'Evolución Trimestral (Ingresos vs Gastos)'}
                {timeframe === 'anual' && 'Balance Anual (Ingresos vs Gastos)'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {timeframe === 'mensual' && 'Desglose mensual del ejercicio actual'}
                {timeframe === 'trimestral' && 'Comparativa de los 4 trimestres del ejercicio'}
                {timeframe === 'anual' && 'Histórico y proyección anual'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Ingresos: {totalIngresos.toLocaleString('es-ES')} €
              </span>
              <span className="text-rose-500 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Gastos: {totalGastos.toLocaleString('es-ES')} €
              </span>
            </div>
          </div>

          <div className="w-full h-[320px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              {timeframe === 'anual' ? (
                <BarChart data={currentDataset} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('es-ES')} €`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} />
                  <Bar dataKey="ingresos" name="Ingresos (Facturación)" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos Operativos" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={currentDataset} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('es-ES')} €`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} />
                  <Line type="monotone" name="Ingresos (Facturación)" dataKey="ingresos" stroke="#10B981" strokeWidth={3.5} dot={{ r: 4.5, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" name="Gastos Operativos" dataKey="gastos" stroke="#EF4444" strokeWidth={3.5} dot={{ r: 4.5, fill: '#EF4444', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* LÍNEAS DE IMPORTES TOTALES COMO HABÍA ANTES (CON LÍNEAS DE PUNTOS DE EXTREMO A EXTREMO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs">
        <h3 className="text-base sm:text-lg font-black text-[#0F2942] mb-6 uppercase tracking-wider">
          Resumen Fiscal y Totales ({timeframeLabel})
        </h3>
        
        <div className="flex flex-col gap-4 font-mono text-sm sm:text-base">
          
          {/* 1. Total Facturado (Base) */}
          <div className="flex items-end w-full text-blue-600 font-bold">
            <span className="shrink-0 uppercase tracking-wider">Total Facturado (Base)</span>
            <div className="flex-1 border-b-2 border-dotted border-blue-600/30 mx-2 mb-1"></div>
            <span className="shrink-0 font-black">{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          
          {/* 2. Total IVA Repercutido */}
          <div className="flex items-end w-full text-indigo-500 font-bold">
            <span className="shrink-0 uppercase tracking-wider">Total IVA Repercutido (21%)</span>
            <div className="flex-1 border-b-2 border-dotted border-indigo-500/30 mx-2 mb-1"></div>
            <span className="shrink-0 font-black">{totalIvaRepercutido.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          
          {/* 3. Total Gastos (Base) */}
          <div className="flex items-end w-full text-rose-500 font-bold">
            <span className="shrink-0 uppercase tracking-wider">Total Gastos (Base)</span>
            <div className="flex-1 border-b-2 border-dotted border-rose-500/30 mx-2 mb-1"></div>
            <span className="shrink-0 font-black">{totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          
          {/* 4. Total IVA Soportado */}
          <div className="flex items-end w-full text-orange-500 font-bold">
            <span className="shrink-0 uppercase tracking-wider">Total IVA Soportado (21%)</span>
            <div className="flex-1 border-b-2 border-dotted border-orange-500/30 mx-2 mb-1"></div>
            <span className="shrink-0 font-black">{totalIvaSoportado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          
          {/* 5. Balance IVA a Liquidar */}
          <div className="flex items-end w-full text-emerald-600 font-black mt-2 text-base sm:text-lg">
            <span className="shrink-0 uppercase tracking-wider">Balance IVA a Liquidar</span>
            <div className="flex-1 border-b-2 border-dotted border-emerald-600/30 mx-2 mb-1"></div>
            <span className="shrink-0 font-black">{liquidacionIva.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>

          {/* 6. Margen Neto / Beneficio */}
          <div className="flex items-end w-full text-emerald-700 font-black mt-1 text-lg sm:text-xl">
            <span className="shrink-0 uppercase tracking-wider">Margen Neto / Beneficio</span>
            <div className="flex-1 border-b-2 border-dotted border-emerald-700/40 mx-2 mb-1"></div>
            <span className="shrink-0 font-black">{balanceNeto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
          </div>
          
        </div>
      </div>

      {/* 2. MODO LÍNEAS DE IMPORTE: DESGLOSE DETALLADO POR PERÍODO */}
      {viewMode === 'lineas' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
            Desglose Detallado — {timeframe === 'mensual' ? 'Mes a Mes' : timeframe === 'trimestral' ? 'Trimestre a Trimestre' : 'Por Ejercicio Anual'}
          </h4>

          <div className="flex flex-col gap-3 font-mono text-xs sm:text-sm">
            {currentDataset.map((row, idx) => {
              const margen = row.ingresos - row.gastos;
              return (
                <div key={idx} className="flex items-end w-full py-1 border-b border-slate-100 hover:bg-slate-50 transition-colors px-1">
                  <span className="shrink-0 font-sans font-bold text-slate-800 min-w-[100px] sm:min-w-[140px]">
                    {(row as any).label || row.name}
                  </span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-2 mb-1"></div>
                  <div className="shrink-0 flex items-center gap-3 sm:gap-6 text-right">
                    <span className="text-emerald-600 font-bold" title="Ingresos">
                      +{row.ingresos.toLocaleString('es-ES')} €
                    </span>
                    <span className="text-rose-500 font-bold" title="Gastos">
                      -{row.gastos.toLocaleString('es-ES')} €
                    </span>
                    <span className={`font-black ${margen >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} title="Margen">
                      = {margen.toLocaleString('es-ES')} €
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
