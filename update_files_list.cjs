const fs = require('fs');

let content = fs.readFileSync('src/components/BalancesView.tsx', 'utf8');

// Add Link icon import
if (!content.includes('ExternalLink')) {
  content = content.replace("import { Download, CheckCircle, Clock }", "import { Download, CheckCircle, Clock, ExternalLink }");
}

const oldText = `<div className="text-sm text-[#64748B] mt-2">
              <span className="font-bold">Archivos generados:</span> Resumen_IVA_{selectedQuarter}_{selectedYear}.pdf, Facturas_Emitidas.zip, Facturas_Recibidas.zip
            </div>`;

const newText = `<div className="text-sm text-[#64748B] mt-4 flex flex-col gap-3">
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
            </div>`;

content = content.replace(oldText, newText);

fs.writeFileSync('src/components/BalancesView.tsx', content);
