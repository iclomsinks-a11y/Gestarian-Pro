const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const oldFacturacion = `        {/* 8. Facturación */}
        <PlaceholderView id="page-facturacion" title="Facturación">
          <DocumentList
            documents={documents.filter(d => d.type === 'factura')}
            onViewDoc={(doc) => {
              setSelectedDoc(doc);
              setIsViewDocOpen(true);
            }}
            onShareDoc={handleShareDoc}
            onNewBudget={handleOpenNewBudget}
            onNewInvoice={handleOpenNewInvoice}
            onAcceptBudget={handleAcceptBudget}
            onConvertToInvoice={handleConvertToInvoice}
          />
        </PlaceholderView>`;

const newFacturacion = `        {/* 8. Facturación */}
        <div id="page-facturacion" className="w-screen h-screen shrink-0 snap-start flex flex-col p-4 sm:p-8 bg-[#F8F7F3] overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto flex flex-col h-full">
            <h2 className="text-3xl font-bold text-[#0F2942] mb-6 pb-4 border-b-2 border-[#E2E0D8]">Facturación</h2>
            
            {/* Panel de control de cobro */}
            <div className="bg-white p-6 rounded-xl border border-[#CBD5E1] shadow-sm mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Panel de Control de Cobros</h3>
                <p className="text-xs text-[#64748B]">Resumen del estado de facturas</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-600">
                  {documents.filter(d => d.type === 'factura' && d.status === 'confirmada').reduce((acc, curr) => acc + curr.total, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Total Confirmado</div>
              </div>
            </div>

            {/* Pestañas: Emitidas / Recibidas */}
            <div className="flex border-b border-[#E2E0D8] mb-6">
              <button className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#0F2942] border-b-2 border-[#0F2942]">
                Facturas Emitidas
              </button>
              <button className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#64748B] hover:text-[#0F172A]">
                Facturas Recibidas
              </button>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-[#E2E0D8] overflow-hidden">
              <DocumentList
                documents={documents.filter(d => d.type === 'factura')}
                onViewDoc={(doc) => {
                  setSelectedDoc(doc);
                  setIsViewDocOpen(true);
                }}
                onShareDoc={handleShareDoc}
                onNewBudget={handleOpenNewBudget}
                onNewInvoice={handleOpenNewInvoice}
                onAcceptBudget={handleAcceptBudget}
                onConvertToInvoice={handleConvertToInvoice}
              />
            </div>
          </div>
        </div>`;

file = file.replace(oldFacturacion, newFacturacion);
fs.writeFileSync('src/App.tsx', file);
