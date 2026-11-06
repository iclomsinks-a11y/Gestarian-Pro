import React, { useState, useEffect, useMemo } from 'react';
import { GestarianDocument } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { FileText, Download, Printer, ArrowUpRight, ArrowDownRight, Eye, ExternalLink, Filter } from 'lucide-react';

interface BalancesViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  documents: GestarianDocument[];
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  onViewDocument?: (doc: GestarianDocument) => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  id,
  documents = [],
  onViewDocument,
}) => {
  const [timeframe, setTimeframe] = useState<'mensual' | 'trimestral' | 'anual'>('mensual');
  const [viewMode, setViewMode] = useState<'grafico' | 'lineas'>('grafico');
  const [activeDrilldown, setActiveDrilldown] = useState<'ingresos' | 'gastos' | null>(null);

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

  // Datos financieros comparados con el periodo del año anterior (Recharts)
  const monthlyData = useMemo(() => [
    { name: 'Ene', label: 'Enero', ingresos: 4200, ingresosAnterior: 3800, gastos: 2400, gastosAnterior: 2200 },
    { name: 'Feb', label: 'Febrero', ingresos: 3800, ingresosAnterior: 3500, gastos: 1900, gastosAnterior: 1800 },
    { name: 'Mar', label: 'Marzo', ingresos: 5100, ingresosAnterior: 4600, gastos: 2800, gastosAnterior: 2500 },
    { name: 'Abr', label: 'Abril', ingresos: 4900, ingresosAnterior: 4400, gastos: 2600, gastosAnterior: 2400 },
    { name: 'May', label: 'Mayo', ingresos: 6200, ingresosAnterior: 5500, gastos: 3100, gastosAnterior: 2800 },
    { name: 'Jun', label: 'Junio', ingresos: 5800, ingresosAnterior: 5200, gastos: 2950, gastosAnterior: 2700 },
    { name: 'Jul', label: 'Julio', ingresos: 7100, ingresosAnterior: 6400, gastos: 3400, gastosAnterior: 3100 },
    { name: 'Ago', label: 'Agosto', ingresos: 4500, ingresosAnterior: 4100, gastos: 2200, gastosAnterior: 2000 },
    { name: 'Sep', label: 'Septiembre', ingresos: 6800, ingresosAnterior: 6000, gastos: 3200, gastosAnterior: 2900 },
    { name: 'Oct', label: 'Octubre', ingresos: 5900, ingresosAnterior: 5300, gastos: 2900, gastosAnterior: 2650 },
    { name: 'Nov', label: 'Noviembre', ingresos: 6400, ingresosAnterior: 5800, gastos: 3150, gastosAnterior: 2900 },
    { name: 'Dic', label: 'Diciembre', ingresos: 7300, ingresosAnterior: 6600, gastos: 3600, gastosAnterior: 3300 },
  ], []);

  const quarterlyData = useMemo(() => [
    { name: '1T', label: '1º Trimestre', ingresos: 13100, ingresosAnterior: 11900, gastos: 7100, gastosAnterior: 6500 },
    { name: '2T', label: '2º Trimestre', ingresos: 16900, ingresosAnterior: 15100, gastos: 8650, gastosAnterior: 7900 },
    { name: '3T', label: '3º Trimestre', ingresos: 18400, ingresosAnterior: 16500, gastos: 8800, gastosAnterior: 8000 },
    { name: '4T', label: '4º Trimestre', ingresos: 19600, ingresosAnterior: 17700, gastos: 9650, gastosAnterior: 8850 },
  ], []);

  const annualData = useMemo(() => [
    { name: '2024', label: 'Ejercicio 2024', ingresos: 52000, ingresosAnterior: 47000, gastos: 29000, gastosAnterior: 26500 },
    { name: '2025', label: 'Ejercicio 2025', ingresos: 61500, gastos: 32800, gastosAnterior: 29000 },
    { name: '2026', label: 'Ejercicio 2026 (Act.)', ingresos: 68000, gastos: 34200, gastosAnterior: 32800 },
  ], []);

  const currentDataset = timeframe === 'mensual' ? monthlyData : timeframe === 'trimestral' ? quarterlyData : annualData;

  const totalIngresos = currentDataset.reduce((sum, item) => sum + item.ingresos, 0);
  const totalIngresosAnterior = currentDataset.reduce((sum, item) => sum + (item.ingresosAnterior || 0), 0);
  const totalGastos = currentDataset.reduce((sum, item) => sum + item.gastos, 0);
  const balanceNeto = totalIngresos - totalGastos;
  const growthPercent = totalIngresosAnterior > 0 ? ((totalIngresos - totalIngresosAnterior) / totalIngresosAnterior) * 100 : 0;

  // Filtrar documentos reales para drilldown de Ingresos y Gastos
  const emittedInvoices = useMemo(() => {
    return documents.filter(d => d.type === 'factura' || (d.type as any) === 'factura_proforma');
  }, [documents]);

  const receivedInvoices = useMemo(() => {
    return documents.filter(d => (d.type as any) === 'factura_recibida');
  }, [documents]);

  const findDeliveryNote = (inv: GestarianDocument) => {
    if (inv.relatedBudgetId) {
      return documents.find(d => d.id === inv.relatedBudgetId);
    }
    if (inv.linkedBudgetId) {
      return documents.find(d => d.id === inv.linkedBudgetId);
    }
    if (inv.expediente) {
      return documents.find(d => d.expediente === inv.expediente && (d.type === 'presupuesto' || d.type === 'orden_trabajo'));
    }
    return null;
  };

  return (
    <div id={id} className="w-full flex flex-col gap-5 select-none max-w-6xl mx-auto pb-10">
      
      {/* 1. BOTONES DE ACCESO RÁPIDO: INGRESOS Y GASTOS (CON DETALLE / DRILLDOWN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Tarjeta de Ingresos */}
        <div 
          onClick={() => setActiveDrilldown(activeDrilldown === 'ingresos' ? null : 'ingresos')}
          className={`cursor-pointer rounded-2xl p-5 transition-all border ${
            activeDrilldown === 'ingresos' 
              ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          } flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ingresos / Facturación Emitida</h4>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${growthPercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}% vs año ant.
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold pt-2 border-t border-slate-100">
            <span>{emittedInvoices.length} facturas registradas</span>
            <span className="flex items-center gap-1">
              {activeDrilldown === 'ingresos' ? 'Ocultar listado' : 'Ver facturas y albaranes'} <Eye className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Tarjeta de Gastos */}
        <div 
          onClick={() => setActiveDrilldown(activeDrilldown === 'gastos' ? null : 'gastos')}
          className={`cursor-pointer rounded-2xl p-5 transition-all border ${
            activeDrilldown === 'gastos' 
              ? 'bg-rose-50/90 border-rose-500 shadow-md ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xs'
          } flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Gastos / Facturas Recibidas</h4>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Margen: {balanceNeto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-rose-700 font-semibold pt-2 border-t border-slate-100">
            <span>{receivedInvoices.length} gastos / recibidas</span>
            <span className="flex items-center gap-1">
              {activeDrilldown === 'gastos' ? 'Ocultar listado' : 'Ver facturas de proveedores'} <Eye className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* 2. DRILLDOWN EXPANDIBLE DE INGRESOS O GASTOS CON ACCESO A ALBARÁN Y DESCARGA */}
      {activeDrilldown && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              {activeDrilldown === 'ingresos' ? 'Listado de Facturas Emitidas e Ingresos' : 'Listado de Facturas Recibidas y Gastos'}
            </h3>
            <button 
              onClick={() => setActiveDrilldown(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Cerrar detalle ✕
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2.5 pr-1">
            {(activeDrilldown === 'ingresos' ? emittedInvoices : receivedInvoices).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hay documentos registrados en esta sección.</p>
            ) : (
              (activeDrilldown === 'ingresos' ? emittedInvoices : receivedInvoices).map((doc) => {
                const albaran = activeDrilldown === 'ingresos' ? findDeliveryNote(doc) : null;
                return (
                  <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {doc.number?.slice(0, 3) || 'DOC'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{doc.number}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{doc.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{doc.clientName || 'Cliente / Proveedor'}</p>
                        {albaran && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 font-semibold">
                            <span>📎 Albarán / Presupuesto asociado:</span>
                            <span className="underline cursor-pointer" onClick={() => onViewDocument?.(albaran)}>{albaran.number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-mono font-black text-sm text-slate-900">
                        {Number(doc.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </span>
                      <div className="flex items-center gap-1">
                        {onViewDocument && (
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                            title="Visualizar documento"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                          title="Imprimir / Descargar"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. GRÁFICO RECHARTS (COMPARATIVA CON AÑO ANTERIOR) O LÍNEAS DE DATOS SIN SCROLL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              {timeframe === 'mensual' && 'Evolución Mensual: 2026 vs Ejercicio Anterior'}
              {timeframe === 'trimestral' && 'Evolución Trimestral: 2026 vs Ejercicio Anterior'}
              {timeframe === 'anual' && 'Comparativa Anual Histórica de Facturación'}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Volumen de ingresos comparado con el mismo periodo del año anterior</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="text-emerald-600 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Actual: {totalIngresos.toLocaleString('es-ES')} €
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              Anterior: {totalIngresosAnterior.toLocaleString('es-ES')} €
            </span>
          </div>
        </div>

        {viewMode === 'grafico' ? (
          <div className="w-full h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {timeframe === 'anual' ? (
                <BarChart data={currentDataset} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} formatter={(v: any) => [`${Number(v).toLocaleString('es-ES')} €`, '']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="ingresos" name="Ingresos Ejercicio Actual" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ingresosAnterior" name="Mismo Periodo Año Anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={currentDataset} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }} formatter={(v: any) => [`${Number(v).toLocaleString('es-ES')} €`, '']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" name="Ingresos Ejercicio Actual" dataKey="ingresos" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" name="Ingresos Mismo Periodo Año Anterior" dataKey="ingresosAnterior" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col gap-2 font-mono text-xs sm:text-sm">
            {currentDataset.map((row, idx) => {
              const diff = row.ingresos - (row.ingresosAnterior || 0);
              const pct = row.ingresosAnterior ? (diff / row.ingresosAnterior) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 px-2 hover:bg-slate-50 rounded-lg">
                  <span className="font-sans font-bold text-slate-800 w-28">{(row as any).label || row.name}</span>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Anterior</span>
                      <span className="text-slate-600 font-semibold">{row.ingresosAnterior?.toLocaleString('es-ES')} €</span>
                    </div>
                    <div>
                      <span className="text-emerald-600 text-[10px] block">Actual</span>
                      <span className="text-emerald-700 font-bold">{row.ingresos.toLocaleString('es-ES')} €</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${diff >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {diff >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
