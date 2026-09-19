const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetOld = `        {/* 8. Facturación */}
        <PlaceholderView 
          id="page-facturacion" 
          title="Facturación" 
          logoUrl={user.logoUrl} 
          userFullName={user.fullName} 
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
        >
          <div className="space-y-6">
            {/* Panel de control de cobro */}
            <div className="bg-white p-6 rounded-xl border border-[#CBD5E1] shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Panel de Control de Cobros</h3>
                <p className="text-xs text-[#64748B]">Resumen del estado y liquidación de facturas emitidas</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {documents
                    .filter((d) => d.type === 'factura' && d.status === 'confirmada')
                    .reduce((acc, curr) => acc + curr.total, 0)
                    .toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Total Confirmado</div>
              </div>
            </div>

            {/* Pestañas: Emitidas / Recibidas */}
            <div className="flex border-b border-[#E2E0D8]">
              <button className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#0F2942] border-b-2 border-[#0F2942] bg-white rounded-t-lg">
                Facturas Emitidas
              </button>
              <button className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#0F172A]">
                Facturas Recibidas
              </button>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E0D8] overflow-hidden">
              <DocumentList
                documents={documents.filter((d) => d.type === 'factura')}
                onViewDoc={(doc) => {
                  setSelectedDoc(doc);
                  setIsViewDocOpen(true);
                }}
                onShareDoc={handleShareDoc}
                onNewBudget={handleOpenNewBudget}
                onNewInvoice={handleOpenNewInvoice}
                onAcceptBudget={handleAcceptBudget}
                onConvertToInvoice={handleConvertToInvoice}
                onDispatchDoc={handleOpenDocumentDispatch}
              />
            </div>
          </div>
        </PlaceholderView>`;

const targetNew = `        {/* 8. Facturación */}
        <FacturacionView
          id="page-facturacion"
          user={user}
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          documents={documents}
          onViewDoc={(doc) => {
            setSelectedDoc(doc);
            setIsViewDocOpen(true);
          }}
          onNavigateToDocument={(id) => {}}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          onAddReceivedInvoice={(doc) => {
            setDocuments(prev => [...prev, doc]);
          }}
          onNavigateToExpediente={(expId) => {
            setTargetExpedienteId(expId);
            navigateToSection('page-expedientes');
          }}
          onNavigateToClient={(clientId) => {
            setTargetClientId(clientId);
            navigateToSection('page-clientes');
          }}
          onAddPayment={(docId, payment) => {
            setDocuments(prev => prev.map(d => {
              if (d.id === docId) {
                const updatedPayments = [...(d.payments || []), payment];
                return { ...d, payments: updatedPayments };
              }
              return d;
            }));
          }}
        />`;

content = content.replace(targetOld, targetNew);

if (!content.includes('FacturacionView')) {
  console.log("Failed to replace");
}

fs.writeFileSync('src/App.tsx', content);
