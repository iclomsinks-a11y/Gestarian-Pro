import React, { useState, useMemo } from 'react';
import { PageHeader } from './PageHeader';
import { Download, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { GestarianDocument } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  logoUrl,
  userFullName,
  documents,
  onBack,
  onNavigateHome,
  onOpenMenu,
}) => {

  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedQuarter, setSelectedQuarter] = useState('T3');

  const annualData = [
    { name: '2024', ingresos: 42000, gastos: 31000 },
    { name: '2025', ingresos: 58000, gastos: 41000 },
    { name: '2026', ingresos: 62000, gastos: 39000 },
  ];
  
  // Dummy report status 
  const isPastQuarter = selectedQuarter !== 'T3'; 
  const isSent = isPastQuarter;
  const sentDate = isSent ? (selectedQuarter === 'T1' ? '15/04/2026' : '15/07/2026') : null;

  // Generate some realistic dummy data for the charts since documents might be sparse
  const monthlyData = [
    { name: 'Ene', ingresos: 4000, gastos: 2400 },
    { name: 'Feb', ingresos: 3000, gastos: 1398 },
    { name: 'Mar', ingresos: 2000, gastos: 9800 },
    { name: 'Abr', ingresos: 2780, gastos: 3908 },
    { name: 'May', ingresos: 1890, gastos: 4800 },
    { name: 'Jun', ingresos: 2390, gastos: 3800 },
    { name: 'Jul', ingresos: 3490, gastos: 4300 },
    { name: 'Ago', ingresos: 4000, gastos: 2400 },
    { name: 'Sep', ingresos: 3000, gastos: 1398 },
    { name: 'Oct', ingresos: 2000, gastos: 9800 },
    { name: 'Nov', ingresos: 2780, gastos: 3908 },
    { name: 'Dic', ingresos: 1890, gastos: 4800 },
  ];

  const quarterlyData = [
    { name: 'T1', ingresos: 9000, gastos: 13598 },
    { name: 'T2', ingresos: 7060, gastos: 12508 },
    { name: 'T3', ingresos: 10490, gastos: 8098 },
    { name: 'T4', ingresos: 6670, gastos: 18508 },
  ];

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col p-4 sm:p-8 bg-[#F8F7F3] overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full gap-8">
        <PageHeader
          pageId={id}
          title="Balances"
          onOpenMenu={onOpenMenu}
          onBack={onBack}
          onNavigateHome={onNavigateHome}
        />

                <div className="w-[95%] mx-auto flex flex-col gap-10 pb-12">
          
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 bg-transparent border-b-2 border-[#0F2942] text-[#0F2942] font-bold outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            
            <select 
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="px-4 py-2 bg-transparent border-b-2 border-[#0F2942] text-[#0F2942] font-bold outline-none"
            >
              <option value="T1">1º Trimestre</option>
              <option value="T2">2º Trimestre</option>
              <option value="T3">3º Trimestre (Actual)</option>
              <option value="T4">4º Trimestre</option>
            </select>
          </div>

          {/* Gráfico Mensual */}
          <div>
            <h3 className="text-lg font-bold text-[#0F2942] mb-6 uppercase tracking-wider">Evolución Mensual</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} €`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Line type="monotone" name="Ingresos" dataKey="ingresos" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Gastos" dataKey="gastos" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico Trimestral */}
          <div>
            <h3 className="text-lg font-bold text-[#0F2942] mb-6 uppercase tracking-wider">Evolución Trimestral</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quarterlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} €`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Line type="monotone" name="Ingresos" dataKey="ingresos" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Gastos" dataKey="gastos" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico Anual */}
          <div>
            <h3 className="text-lg font-bold text-[#0F2942] mb-6 uppercase tracking-wider">Balance Anual</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={annualData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} €`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Line type="monotone" name="Ingresos" dataKey="ingresos" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Gastos" dataKey="gastos" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Botón de Informe y Estado */}
          <div className="flex flex-col gap-4 bg-white/50 p-6 rounded-xl border border-[#0F2942]/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#0F2942] text-lg">Informe Trimestral ({selectedQuarter} {selectedYear})</h4>
                {isSent ? (
                  <div className="flex items-center text-emerald-600 mt-1 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Enviado a gestoría el {sentDate}
                  </div>
                ) : (
                  <div className="flex items-center text-orange-500 mt-1 text-sm font-medium">
                    <Clock className="w-4 h-4 mr-1" />
                    Pendiente de cierre (en curso)
                  </div>
                )}
              </div>
              <button className="flex items-center gap-2 bg-[#0F2942] text-white px-6 py-3 rounded-full font-bold hover:bg-[#1E3A8A] transition-colors shadow-md">
                <Download className="w-5 h-5" />
                <span>Ver Informe</span>
              </button>
            </div>
            
            <div className="text-sm text-[#64748B] mt-4 flex flex-col gap-3">
              <div>
                <span className="font-bold block mb-1 text-[#0F2942]">Archivos enviados a la gestoría:</span> 
                <div className="flex flex-col gap-1 text-xs sm:text-sm pl-2 border-l-2 border-[#38BDF8]">
                  <span>📄 Resumen_Trimestral_{selectedQuarter}_{selectedYear}.xls</span>
                  <span>📄 Exportacion_SAGE_{selectedQuarter}_{selectedYear}.SAGE</span>
                  <span>📄 Exportacion_A3_{selectedQuarter}_{selectedYear}.A3</span>
                </div>
              </div>
              <p className="text-xs italic text-[#64748B] bg-white/40 p-2 rounded">
                * Todos los archivos incluyen el desglose detallado de facturas emitidas y recibidas, total de IVA repercutido y soportado, e ingresos y gastos totales.
              </p>
              <div>
                <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 text-[#38BDF8] hover:text-[#0F2942] font-semibold transition-colors mt-1">
                  <ExternalLink className="w-4 h-4" />
                  <span>Enlace a base de datos de facturas del trimestre ({selectedQuarter} {selectedYear})</span>
                </a>
              </div>
            </div>
          </div>

          {/* Resumen Fiscal Trimestral */}
          <div>
            <h3 className="text-lg font-bold text-[#0F2942] mb-6 uppercase tracking-wider">Resumen Fiscal {selectedQuarter}</h3>
            
            <div className="flex flex-col gap-4 font-mono text-sm sm:text-base">
              
              <div className="flex items-end w-full text-blue-600 font-bold">
                <span className="shrink-0 uppercase tracking-wider">Total Facturado (Base)</span>
                <div className="flex-1 border-b-2 border-dotted border-blue-600/30 mx-2 mb-1"></div>
                <span className="shrink-0">34.500,00 €</span>
              </div>
              
              <div className="flex items-end w-full text-indigo-500 font-bold">
                <span className="shrink-0 uppercase tracking-wider">Total IVA Repercutido</span>
                <div className="flex-1 border-b-2 border-dotted border-indigo-500/30 mx-2 mb-1"></div>
                <span className="shrink-0">7.245,00 €</span>
              </div>
              
              <div className="flex items-end w-full text-rose-500 font-bold">
                <span className="shrink-0 uppercase tracking-wider">Total Gastos (Base)</span>
                <div className="flex-1 border-b-2 border-dotted border-rose-500/30 mx-2 mb-1"></div>
                <span className="shrink-0">12.800,00 €</span>
              </div>
              
              <div className="flex items-end w-full text-orange-500 font-bold">
                <span className="shrink-0 uppercase tracking-wider">Total IVA Soportado</span>
                <div className="flex-1 border-b-2 border-dotted border-orange-500/30 mx-2 mb-1"></div>
                <span className="shrink-0">2.688,00 €</span>
              </div>
              
              <div className="flex items-end w-full text-emerald-600 font-black mt-4 text-lg">
                <span className="shrink-0 uppercase tracking-wider">Balance IVA a Liquidar</span>
                <div className="flex-1 border-b-2 border-dotted border-emerald-600/30 mx-2 mb-1"></div>
                <span className="shrink-0">4.557,00 €</span>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
