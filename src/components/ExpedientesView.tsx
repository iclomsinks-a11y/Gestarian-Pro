import React, { useState } from 'react';
import { User, Wrench, FolderOpen, ClipboardList, ArrowLeft } from 'lucide-react';
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
  onRoadmapOpenChange?: (isOpen: boolean) => void;
  onSelectExpediente?: (expId: string | null) => void;
  onPlateChange?: (plate: string | null) => void;
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
  onRoadmapOpenChange,
  onSelectExpediente,
  onPlateChange,
}) => {
  const [selectedExpediente, setSelectedExpediente] = useState<string | null>(initialExpedienteId);
  const [clientFilter, setClientFilter] = useState<string | null>(initialClientId);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'en_curso' | 'cerrados'>('todos');
  const [showDatosModal, setShowDatosModal] = useState<boolean>(false);

  React.useEffect(() => {
    const handleFilter = (e: any) => {
      const filter = e.detail?.filter;
      if (filter === 'todos' || filter === 'en_curso' || filter === 'cerrados') {
        setStatusFilter(filter);
      }
    };
    window.addEventListener('gestarian_filter_expedientes', handleFilter);
    return () => window.removeEventListener('gestarian_filter_expedientes', handleFilter);
  }, []);

  React.useEffect(() => {
    setSelectedExpediente(initialExpedienteId || null);
    const isOpen = Boolean(initialExpedienteId);
    if (onRoadmapOpenChange) {
      onRoadmapOpenChange(isOpen);
    }
    if (isOpen && initialExpedienteId) {
      const expDoc = documents.find(
        (d) => d.expediente === initialExpedienteId || d.number === initialExpedienteId || d.id === initialExpedienteId
      );
      if (onPlateChange) {
        onPlateChange(expDoc?.vehiclePlate || null);
      }
    } else {
      if (onPlateChange) {
        onPlateChange(null);
      }
    }
  }, [initialExpedienteId, onRoadmapOpenChange, onPlateChange, documents]);

  React.useEffect(() => {
    if (initialClientId !== undefined) setClientFilter(initialClientId);
  }, [initialClientId]);

  React.useEffect(() => {
    const handleOpenDatos = () => setShowDatosModal(true);
    window.addEventListener('gestarian_open_expediente_datos', handleOpenDatos);
    return () => window.removeEventListener('gestarian_open_expediente_datos', handleOpenDatos);
  }, []);

  // Escuchar evento para cerrar el roadmap y volver al listado de tarjetas de expedientes
  React.useEffect(() => {
    const handleClose = () => {
      setSelectedExpediente(null);
      if (onRoadmapOpenChange) onRoadmapOpenChange(false);
      if (onSelectExpediente) onSelectExpediente(null);
      if (onPlateChange) onPlateChange(null);
    };
    window.addEventListener('gestarian_close_roadmap', handleClose);
    return () => window.removeEventListener('gestarian_close_roadmap', handleClose);
  }, [onRoadmapOpenChange, onSelectExpediente, onPlateChange]);

  const handleSelectExpediente = (expId: string | null) => {
    setSelectedExpediente(expId);
    if (onRoadmapOpenChange) {
      onRoadmapOpenChange(Boolean(expId));
    }
    if (onSelectExpediente) {
      onSelectExpediente(expId);
    }
    if (expId) {
      const expDoc = documents.find(
        (d) => d.expediente === expId || d.number === expId || d.id === expId
      );
      if (onPlateChange) {
        onPlateChange(expDoc?.vehiclePlate || null);
      }
    } else {
      if (onPlateChange) {
        onPlateChange(null);
      }
    }
  };

  const handleCloseRoadmap = () => {
    handleSelectExpediente(null);
  };
  
  // Extract unique expedientes: ÚNICAMENTE se generan a partir de presupuestos
  const expedientesMap = new Map<string, { doc: GestarianDocument, client?: Client }>();
  documents.forEach(doc => {
    // REGLA FUNDAMENTAL: Las facturas recibidas NUNCA generan expediente ni aparecen en expedientes ni en roadmap
    if (doc.type === 'factura_recibida') return;

    // Los expedientes ÚNICAMENTE se generan a partir de los presupuestos (o facturas derivadas de un presupuesto)
    if (doc.expediente) {
      if (doc.type === 'presupuesto' || (doc.type as string) === 'budget') {
        if (!expedientesMap.has(doc.expediente)) {
          const client = clients.find(c => c.id === doc.clientId);
          expedientesMap.set(doc.expediente, { doc, client });
        }
      } else if (doc.type === 'factura') {
        // Si ya existe el presupuesto registrado para este expediente, preferimos la factura para el último estado
        const existing = expedientesMap.get(doc.expediente);
        if (existing) {
          expedientesMap.set(doc.expediente, { doc, client: existing.client });
        } else if (doc.linkedBudgetId) {
          // Factura emitida con presupuesto vinculado
          const client = clients.find(c => c.id === doc.clientId);
          expedientesMap.set(doc.expediente, { doc, client });
        }
      }
    }
  });

  const expedientes = Array.from(expedientesMap.values());

  // Calcular estado de cada expediente
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
          d.type !== 'factura_recibida' &&
          (d.type === 'presupuesto' || (d.type as string) === 'budget' || d.type === 'factura') &&
          (d.expediente === selectedExpediente ||
          d.number === selectedExpediente ||
          d.id === selectedExpediente)
      );
      if (fallbackDoc && fallbackDoc.expediente) {
        const client = clients.find((c) => c.id === fallbackDoc.clientId);
        data = { doc: fallbackDoc, client };
      }
    }
    if (data) {
      const { doc, client } = data;
      return (
        <div className="w-full min-h-screen flex flex-col bg-white animate-in fade-in duration-300">
          <div className="w-full px-3 sm:px-6 lg:px-8 pb-8 flex-1 flex flex-col">
            {/* Roadmap Interactivo con 6 paradas (sin header superior) */}
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

            {/* Modal Datos del Expediente */}
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
  }

  // Dashboard de Tarjetas de Expedientes
  return (
    <div id="page-expedientes" className="w-screen h-screen shrink-0 snap-start flex flex-col bg-white overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex-1 flex flex-col">

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

        const displayedExpedientes = filteredByClient.filter((item) => {
          if (statusFilter === 'en_curso') {
            return !item.isCerrado;
          }
          if (statusFilter === 'cerrados') {
            return item.isCerrado;
          }
          return true;
        });

        if (displayedExpedientes.length === 0) {
          return (
            <div id="empty-expedientes-state" className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-xl border border-gray-200 p-8">
              <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-700">
                No hay expedientes registrados
              </h2>
              <p className="text-sm text-gray-500 max-w-md mt-2">
                {clientFilter
                  ? 'Este cliente no tiene expedientes registrados.'
                  : 'Genera un nuevo presupuesto para que se asigne y se cree automáticamente su número de expediente.'}
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
                  onClick={() => doc.expediente && handleSelectExpediente(doc.expediente)}
                  isExpandable={false}
                  cleanNumbersLayout={true}
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
