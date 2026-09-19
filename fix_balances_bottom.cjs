const fs = require('fs');

let content = fs.readFileSync('src/components/BalancesView.tsx', 'utf8');

// The file currently has:
// 1. Gráfico Mensual
// 2. Gráfico Trimestral
// we should add the lines at the bottom.

const linesSection = `
          {/* Resumen Fiscal Trimestral */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#CBD5E1]">
            <h3 className="text-lg font-bold text-[#0F2942] mb-6 uppercase tracking-wider">Resumen Fiscal del Trimestre</h3>
            
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

content = content.replace(/        <\/div>\n      <\/div>\n    <\/div>\n  \);\n};\n?$/, linesSection);

fs.writeFileSync('src/components/BalancesView.tsx', content);
