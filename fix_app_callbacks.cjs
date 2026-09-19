const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add states for navigation targets
const stateAdditions = `
  const [targetExpedienteId, setTargetExpedienteId] = useState<string | null>(null);
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
`;
content = content.replace("const [user, setUser] = useState<AppUser>(getStoredUser);", "const [user, setUser] = useState<AppUser>(getStoredUser);" + stateAdditions);

// Update FacturacionView usage
const factOld = `<FacturacionView
          id="page-facturacion"
          user={user}
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          documents={documents}
          onViewDoc={(doc) => {
            setSelectedDocument(doc);
            setIsDocumentViewerOpen(true);
          }}
          onNavigateToDocument={(id) => {
            // handle navigation if needed
          }}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          onAddReceivedInvoice={(doc) => {
            setDocuments(prev => [...prev, doc]);
          }}
        />`;

const factNew = `<FacturacionView
          id="page-facturacion"
          user={user}
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          documents={documents}
          onViewDoc={(doc) => {
            setSelectedDocument(doc);
            setIsDocumentViewerOpen(true);
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

content = content.replace(factOld, factNew);

// Update ExpedientesView usage
const expOld = `<ExpedientesView 
          documents={documents}
          clients={clients}
          onBack={handleBackToPreviousScreen}
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
        />`;
const expNew = `<ExpedientesView 
          documents={documents}
          clients={clients}
          onBack={() => {
             setTargetExpedienteId(null);
             handleBackToPreviousScreen();
          }}
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          initialExpedienteId={targetExpedienteId}
        />`;

content = content.replace(expOld, expNew);

fs.writeFileSync('src/App.tsx', content);
