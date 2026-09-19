const fs = require('fs');

let content = fs.readFileSync('src/components/BalancesView.tsx', 'utf8');

// Need to import useState from react
content = content.replace("import React, { useMemo } from 'react';", "import React, { useState, useMemo } from 'react';");
content = content.replace("import { PageHeader } from './PageHeader';", "import { PageHeader } from './PageHeader';\nimport { Download, CheckCircle, Clock } from 'lucide-react';");

const newComponentLogic = `
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
`;

content = content.replace("  // Generate some realistic dummy data", newComponentLogic + "\n  // Generate some realistic dummy data");

const uiReplacement = `        <div className="w-[95%] mx-auto flex flex-col gap-10 pb-12">
          
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
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => \`\${value}€\`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [\`\${value} €\`, '']}
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
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => \`\${value}€\`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [\`\${value} €\`, '']}
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
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => \`\${value}€\`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [\`\${value} €\`, '']}
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
            
            <div className="text-sm text-[#64748B] mt-2">
              <span className="font-bold">Archivos generados:</span> Resumen_IVA_{selectedQuarter}_{selectedYear}.pdf, Facturas_Emitidas.zip, Facturas_Recibidas.zip
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
`;

const regex = /<div className="flex-1 flex flex-col gap-8 pb-12">[\s\S]*<\/div>\n      <\/div>\n    <\/div>\n  \);\n};\n?$/;
content = content.replace(regex, uiReplacement);

fs.writeFileSync('src/components/BalancesView.tsx', content);
