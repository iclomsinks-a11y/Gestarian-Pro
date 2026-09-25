import React, { useState } from 'react';
import { User, Wrench, FolderOpen, ClipboardList } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { GestarianDocument, Client, AppUser } from '../types';
import { StandardCard } from './StandardCard';
import { getExpedienteStatus } from '../utils/clientStatusHelper';
import { RoadmapTracker } from './RoadmapTracker';
import { ExpedienteDatosModal } from './ExpedienteDatosModal';

interface ExpedientesViewProps {
  documents: GestarianDocument[];
  clients: Client[];
  onBack: () => void;
  logoUrl?: string;
  userFullName?: string;
  onNavigateHome: () => void;
  onOpenMenu?: () => void;
  initialExpedienteId?: string | null;
  initialClientId?: string | null;
  currentUser?: AppUser;
  onUpdateDocument?: (doc: GestarianDocument) => void;
  onGenerateInvoiceFromBudget?: (budget: GestarianDocument) => void;
  onShowToast?: (msg: string) => void;
  onOpenWorkOrdersModal?: () => void;
}

export const ExpedientesView: React.FC<ExpedientesViewProps> = ({ 
  documents, 
  clients,
  onBack, 
  logoUrl, 
  userFullName,
  onNavigateHome,
  onOpenMenu,
  initialExpedienteId = null,
  initialClientId = null,
  currentUser = { id: 'boss', fullName: 'Administrador', role: 'boss', cif: '00000000X', fiscalAddress: '', phone: '', email: '', verified: true, createdAt: new Date().toISOString(), currentTier: 'pro' } as AppUser,
  onUpdateDocument,
  onGenerateInvoiceFromBudget,
  onShowToast,
  onOpenWorkOrdersModal,
}) => {
  const [selectedExpediente, setSelectedExpediente] = useState<string | null>(initialExpedienteId);
  const [clientFilter, setClientFilter] = useState<string | null>(initialClientId);
  const [activeTab, setActiveTab] = useState<'abiertos' | 'cerrados'>('abiertos');
  const [showDatosModal, setShowDatosModal] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialExpedienteId) setSelectedExpediente(initialExpedienteId);
  }, [initialExpedienteId]);

  React.useEffect(() => {
    if (initialClientId !== undefined) setClientFilter(initialClientId);
  }, [initialClientId]);
  
  // Extract unique expedientes
  const expedientesMap = new Map<string, { doc: GestarianDocument, client?: Client }>();
  documents.forEach(doc => {
    if (doc.expediente) {
      if (!expedientesMap.has(doc.expediente)) {
        const client = clients.find(c => c.id === doc.clientId);
        expedientesMap.set(doc.expediente, { doc, client });
      } else {
        // If there's an invoice, prefer that document to get the latest status
        const existing = expedientesMap.get(doc.expediente);
        if (doc.type === 'factura' && existing?.doc.type !== 'factura') {
          expedientesMap.set(doc.expediente, { doc, client: existing?.client });
        }
      }
    }
  });

  const expedientes = Array.from(expedientesMap.values());

  // Calcular estado para clasificar entre abiertos y cerrados
  const expedientesWithStatus = expedientes.map((item) => {
    const expStatus = item.doc.expediente
      ? getExpedienteStatus(item.doc.expediente, documents)
      : {
          type: 'naranja' as const,
          color: 'border-orange-500',
          borderClass: 'border-[3px] border-orange-500',
          textColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          badgeBorder: 'border-orange-200',
          label: 'PENDIENTE',
          pendingAmount: 0,
          paidAmount: 0,
          totalAmount: 0,
          invoiceCount: 0,
          hasUnpaidInvoice: false,
        };
    const isCerrado = expStatus.label === 'CERRADO' || expStatus.type === 'verde';
    return {
      ...item,
      expStatus,
      isCerrado,
    };
  });

  const openCount = expedientesWithStatus.filter((e) => !e.isCerrado).length;
  const closedCount = expedientesWithStatus.filter((e) => e.isCerrado).length;

    if (selectedExpediente) {
    let data = expedientesMap.get(selectedExpediente);
    if (!data) {
      const cleanTarget = selectedExpediente.replace(/\D/g, '');
      for (const [expKey, item] of expedientesMap.entries()) {
        const cleanKey = expKey.replace(/\D/g, '');
        if (
          item.doc.id === selectedExpediente ||
          item.doc.number === selectedExpediente ||
          item.doc.expediente === selectedExpediente ||
          (cleanTarget && cleanKey && cleanTarget === cleanKey) ||
          expKey.toLowerCase() === selectedExpediente.toLowerCase()
        ) {
          data = item;
          break;
        }
      }
    }
    if (!data) {
      const fallbackDoc = documents.find(
        (d) =>
          d.expediente === selectedExpediente ||
          d.number === selectedExpediente ||
          d.id === selectedExpediente
      );
      if (fallbackDoc) {
        const client = clients.find((c) => c.id === fallbackDoc.clientId);
        data = { doc: fallbackDoc, client };
      }
    }
    if (!data) return null;
    
    const { doc, client } = data;
    const isCurrentCerrado = (() => {
      if (!doc.expediente) return false;
      const st = getExpedienteStatus(doc.expediente, documents);
      return st.label === 'CERRADO' || st.type === 'verde';
    })();

    return (
      <div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">
        <div className="w-full max-w-7xl mx-auto">
        <PageHeader
          pageId="page-expedientes"
          title="Expedientes"
          onOpenMenu={onOpenMenu}
          onBack={() => setSelectedExpediente(null)}
          onNavigateHome={onNavigateHome}
        />

        {/* Fila 1: Botones abiertos - cerrados en una sola fila */}
        <div id="row-roadmap-header" className="w-[calc(100vw-40px)] md:w-[calc(100vw-80px)] lg:w-[calc(100vw-600px)] mx-auto mb-4 flex items-center gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
          <button
            id="btn-roadmap-expedientes-abiertos"
            type="button"
            onClick={() => {
              setActiveTab('abiertos');
              setSelectedExpediente(null);
            }}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-bold tracking-tight transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
              !isCurrentCerrado
                ? 'bg-[#0F2942] text-white ring-2 ring-[#0F2942] ring-offset-2'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Abiertos</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                !isCurrentCerrado ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {openCount}
            </span>
          </button>

          <button
            id="btn-roadmap-expedientes-cerrados"
            type="button"
            onClick={() => {
              setActiveTab('cerrados');
              setSelectedExpediente(null);
            }}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-bold tracking-tight transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
              isCurrentCerrado
                ? 'bg-[#0F2942] text-white ring-2 ring-[#0F2942] ring-offset-2'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Cerrados</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                isCurrentCerrado ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {closedCount}
            </span>
          </button>
        </div>

        {/* Fila 2: Dibujo de la matrícula y botón datos */}
        <div id="row-matricula-datos" className="w-[calc(100vw-40px)] md:w-[calc(100vw-80px)] lg:w-[calc(100vw-600px)] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Dibujo de la matrícula oficial española */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-9 sm:h-10 min-w-[140px] sm:min-w-[160px] shadow-xs">
              <div className="bg-blue-700 h-full w-6 sm:w-7 flex flex-col items-center justify-center shrink-0">
                <span className="text-[6px] text-yellow-300 font-bold mb-0.5 leading-none">⭐</span>
                <span className="text-[10px] sm:text-xs text-white font-black leading-none">E</span>
              </div>
              <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-base sm:text-lg tracking-widest text-[#0F172A]">
                {doc.vehiclePlate || 'SIN-MAT'}
              </div>
            </div>

            {/* Subtítulo vehículo / cliente */}
            {(doc.vehicleBrand || doc.vehicleModel) && (
              <span className="hidden sm:inline-block text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ')}
              </span>
            )}
          </div>

          {/* Botón Datos */}
          <button
            id="btn-datos-expediente"
            type="button"
            onClick={() => setShowDatosModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Datos</span>
            {doc.items && doc.items.length > 0 && (
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold ml-1">
                {doc.items.length} {doc.items.length === 1 ? 'tarea' : 'tareas'}
              </span>
            )}
          </button>
        </div>

        {/* Roadmap Interactivo con 6 rectángulos */}
        <RoadmapTracker
          document={doc}
          client={client}
          allDocuments={documents}
          currentUser={currentUser}
          onUpdateDocument={(updated) => {
            if (onUpdateDocument) onUpdateDocument(updated);
          }}
          onGenerateInvoiceFromBudget={(budgetDoc) => {
            if (onGenerateInvoiceFromBudget) onGenerateInvoiceFromBudget(budgetDoc);
          }}
          onShowToast={onShowToast}
          onOpenWorkOrdersModal={onOpenWorkOrdersModal}
        />

        {/* Modal Datos del Expediente: orden de trabajo, empleados asignados y trabajo a realizar */}
        <ExpedienteDatosModal
          isOpen={showDatosModal}
          onClose={() => setShowDatosModal(false)}
          document={doc}
          client={client}
          currentUser={currentUser}
          allDocuments={documents}
          onUpdateDocument={onUpdateDocument}
          onShowToast={onShowToast}
        />
        </div>
      </div>
    );
  }

  // Dashboard de Tarjetas de Expedientes
  return (
    <div id="page-expedientes" className="flex flex-col h-full min-h-screen bg-[#F8F7F3] p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 overflow-y-auto w-screen shrink-0 snap-start">
      <div className="w-full max-w-7xl mx-auto">
      <PageHeader
        pageId="page-expedientes"
        title="Expedientes"
        onOpenMenu={onOpenMenu}
        onBack={onBack}
        onNavigateHome={onNavigateHome}
      />

      {/* Botones debajo del header como título / selector: Abiertos y Cerrados en una sola fila */}
      <div id="expedientes-title-tabs" className="flex items-center gap-3 sm:gap-4 mb-6 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
        <button
          id="btn-expedientes-abiertos"
          type="button"
          onClick={() => setActiveTab('abiertos')}
          className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-bold tracking-tight transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
            activeTab === 'abiertos'
              ? 'bg-[#0F2942] text-white ring-2 ring-[#0F2942] ring-offset-2'
              : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>Abiertos</span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'abiertos'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {openCount}
          </span>
        </button>

        <button
          id="btn-expedientes-cerrados"
          type="button"
          onClick={() => setActiveTab('cerrados')}
          className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-bold tracking-tight transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
            activeTab === 'cerrados'
              ? 'bg-[#0F2942] text-white ring-2 ring-[#0F2942] ring-offset-2'
              : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>Cerrados</span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'cerrados'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {closedCount}
          </span>
        </button>
      </div>

      {clientFilter && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
          <span>
            Mostrando expedientes filtrados por cliente seleccionado.
          </span>
          <button
            type="button"
            onClick={() => setClientFilter(null)}
            className="font-bold underline hover:text-blue-700 cursor-pointer"
          >
            Ver todos los expedientes
          </button>
        </div>
      )}

      {(() => {
        const filteredByClient = clientFilter
          ? expedientesWithStatus.filter(
              (e) => e.doc.clientId === clientFilter || e.client?.id === clientFilter
            )
          : expedientesWithStatus;

        const displayedExpedientes = filteredByClient.filter((e) =>
          activeTab === 'abiertos' ? !e.isCerrado : e.isCerrado
        );

        if (displayedExpedientes.length === 0) {
          return (
            <div id="empty-expedientes-state" className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-xl border border-gray-200 p-8">
              <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-700">
                {activeTab === 'abiertos' ? 'No hay expedientes abiertos' : 'No hay expedientes cerrados'}
              </h2>
              <p className="text-sm text-gray-500 max-w-md mt-2">
                {clientFilter
                  ? `Este cliente no tiene expedientes ${activeTab === 'abiertos' ? 'abiertos' : 'cerrados'}.`
                  : activeTab === 'abiertos'
                  ? 'Genera un nuevo presupuesto para que se asigne y se cree automáticamente su número de expediente.'
                  : 'Los expedientes finalizados y con todas sus facturas cobradas aparecerán aquí.'}
              </p>
              {clientFilter && (
                <button
                  id="btn-clear-client-filter"
                  type="button"
                  onClick={() => setClientFilter(null)}
                  className="mt-4 px-4 py-2 bg-[#0F2942] text-white text-xs font-bold rounded-lg hover:bg-[#1E3A8A]"
                >
                  Ver todos los expedientes
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedExpedientes.map((data, index) => {
              const { doc, client, expStatus } = data;

              const subtitle =
                [doc.vehicleBrand, doc.vehicleModel || doc.vehicleType].filter(Boolean).join(' ') ||
                'Vehículo Genérico';
              return (
                <StandardCard
                  id={`card-expediente-${doc.expediente || index}`}
                  key={doc.expediente || index}
                  status={expStatus.label}
                  statusColor={expStatus.borderClass}
                  statusTextColor={expStatus.textColor}
                  vehiclePlate={doc.vehiclePlate || 'SIN-MAT'}
                  subtitle={subtitle}
                  title={client?.name || doc.clientName || 'Cliente'}
                  refCode={doc.number}
                  expediente={doc.expediente}
                  onClick={() => doc.expediente && setSelectedExpediente(doc.expediente)}
                  isExpandable={false}
                />
              );
            })}
          </div>
        );
      })()}
      </div>
    </div>
  );
};
