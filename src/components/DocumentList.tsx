import React, { useState } from 'react';
import { 
  FileText, FileCheck, Search, Filter, Plus, Eye, Share2, 
  ArrowRight, Lock, CheckCircle, Car, Sparkles, Send, MessageSquare, Mail,
  LayoutGrid, List, Clock, FolderOpen, FolderKanban, MessageCircle, Phone, Euro
} from 'lucide-react';
import { DocumentType, GestarianDocument } from '../types';
import { StandardCard } from './StandardCard';
import { SheetPlusPIcon, SheetPIcon, SheetFIcon } from './BudgetIcons';
import { getDocStatusColors } from '../utils/clientStatusHelper';

interface DocumentListProps {
  documents: GestarianDocument[];
  onViewDoc: (doc: GestarianDocument) => void;
  onShareDoc: (doc: GestarianDocument) => void;
  onNewBudget: () => void;
  onNewInvoice?: () => void;
  onAcceptBudget: (doc: GestarianDocument) => void;
  onConvertToInvoice: (budget: GestarianDocument) => void;
  onEditBudgetPricing?: (budget: GestarianDocument) => void;
  onDispatchDoc?: (doc: GestarianDocument) => void;
  onNavigateToExpediente?: (expId: string) => void;
  initialSearch?: string;
  onlyCards?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onViewDoc,
  onShareDoc,
  onNewBudget,
  onNewInvoice,
  onAcceptBudget,
  onConvertToInvoice,
  onEditBudgetPricing,
  onDispatchDoc,
  onNavigateToExpediente,
  initialSearch = '',
  onlyCards = false,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'presupuesto' | 'factura'>('all');
  const [search, setSearch] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  React.useEffect(() => {
    const handleBudgetSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail && typeof customEvent.detail.query === 'string') {
        setSearch(customEvent.detail.query);
      }
    };
    window.addEventListener('gestarian_budget_search', handleBudgetSearch);
    return () => window.removeEventListener('gestarian_budget_search', handleBudgetSearch);
  }, []);

  const hasInvoices = documents.some((d) => d.type === 'factura');

  const filtered = documents.filter((d) => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.number.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.clientCif.toLowerCase().includes(q) ||
        (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (onlyCards) {
    return (
      <div className="w-full">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium bg-white rounded-2xl border border-slate-200">
            No se han encontrado presupuestos con el criterio de búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((doc) => {
              const isBudget = doc.type === 'presupuesto';
              const subtitle = [doc.vehicleBrand, doc.vehicleModel || doc.vehicleType].filter(Boolean).join(' ') || 'Vehículo Genérico';

              const isRejected = doc.status === 'rechazado';
              const isPaid = doc.status === 'pagado' || doc.status === 'PAGADO' || doc.status === 'confirmada';
              const isClientProposedPending = doc.deliveryDateProposedBy === 'client' && doc.deliveryDateStatus === 'pending_acceptance';
              const isAccepted = (doc.acceptedByClient || doc.status === 'aceptado') && !isClientProposedPending;

              let cardStatus = 'PENDIENTE';
              let statusColor = 'border border-orange-500';
              let statusTextColor = 'text-orange-500';

              if (isRejected) {
                cardStatus = 'RECHAZADO';
                statusColor = 'border border-rose-500';
                statusTextColor = 'text-rose-600 font-black';
              } else if (isClientProposedPending) {
                cardStatus = 'FECHA PROPUESTA';
                statusColor = 'border border-orange-500 shadow-md ring-2 ring-orange-400/40';
                statusTextColor = 'text-orange-600 font-black animate-pulse';
              } else if (isAccepted) {
                cardStatus = 'ACEPTADO';
                statusColor = 'border border-emerald-500 shadow-md ring-1 ring-emerald-400/30';
                statusTextColor = 'text-emerald-600 font-black';
              } else if (isPaid) {
                cardStatus = 'PAGADO';
                statusColor = 'border border-blue-600';
                statusTextColor = 'text-blue-600 font-black';
              } else if (doc.status === 'enviado' || doc.status === 'enviada' || Boolean(doc.sentAt)) {
                cardStatus = 'ATENDIDO';
                statusColor = 'border border-blue-500 shadow-md ring-1 ring-blue-400/30';
                statusTextColor = 'text-blue-600 font-black';
              }

              const isFacturaRecibida = doc.type === 'factura_recibida';
              const targetExp = !isFacturaRecibida 
                ? (doc.expediente || (isBudget && doc.number ? `E${doc.number.replace(/\D/g, '')}` : undefined)) 
                : undefined;
              
              const singleDocColors = getDocStatusColors(doc, documents);

              return (
                <StandardCard
                  key={doc.id}
                  status={cardStatus}
                  statusColor={statusColor}
                  statusTextColor={statusTextColor}
                  vehiclePlate={doc.vehiclePlate || 'SIN-MAT'}
                  subtitle={subtitle}
                  title={doc.clientName}
                  refCode={singleDocColors.budgetNum || doc.number}
                  refCodeColor={singleDocColors.budgetColor}
                  expediente={singleDocColors.expNum || targetExp}
                  expedienteColor={singleDocColors.expedienteColor}
                  facturaNum={singleDocColors.invoiceNum}
                  facturaColor={singleDocColors.invoiceColor}
                  cleanNumbersLayout={true}
                  isExpandable={true}
                  onViewDoc={() => onViewDoc(doc)}
                  onViewExpediente={targetExp && onNavigateToExpediente ? () => onNavigateToExpediente(targetExp) : undefined}
                  viewDocLabel={isBudget ? 'Ver presupuesto' : 'Ver factura'}
                  viewExpedienteLabel="Ver expediente (Roadmap)"
                  actions={
                    <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
                      {/* 1. Ver Documento (Hoja P o F o Eye) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDoc(doc);
                        }}
                        className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                        title={isBudget ? 'Ver presupuesto' : 'Ver documento'}
                        aria-label="Ver documento"
                      >
                        {isBudget ? (
                          <SheetPIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                        ) : (
                          <SheetFIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                        )}
                      </button>

                      {/* 2. Expediente Vinculado */}
                      {!isFacturaRecibida && targetExp && onNavigateToExpediente ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToExpediente(targetExp);
                          }}
                          className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title="Ver Roadmap del expediente vinculado"
                          aria-label="Ver expediente"
                        >
                          <FolderKanban className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14" />
                      )}

                      {/* 3. Compartir / Enviar */}
                      {onDispatchDoc ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDispatchDoc(doc);
                          }}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title="Enviar por WhatsApp"
                          aria-label="Enviar WhatsApp"
                        >
                          <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareDoc(doc);
                          }}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title="Compartir documento"
                          aria-label="Compartir"
                        >
                          <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>
                      )}

                      {/* 4. Contacto Telefónico */}
                      {doc.clientPhone ? (
                        <a
                          href={`tel:${doc.clientPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title={`Llamar a ${doc.clientPhone}`}
                          aria-label="Llamar"
                        >
                          <Phone className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </a>
                      ) : doc.clientEmail ? (
                        <a
                          href={`mailto:${doc.clientEmail}?subject=Documento ${doc.number}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title={`Email a ${doc.clientEmail}`}
                          aria-label="Email"
                        >
                          <Mail className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </a>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14" />
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="w-full bg-white border border-[#E2E0D8] rounded-xl shadow-xs overflow-hidden">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 sm:p-5 border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-4 bg-[#FAF9F5]">
        <div className="flex items-center gap-2">
          {hasInvoices ? (
            <>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-white text-[#475569] border border-[#D5D2C9] hover:bg-[#EFECE6]'
                }`}
              >
                Todos ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('presupuesto')}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                  filterType === 'presupuesto'
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-white text-[#475569] border border-[#D5D2C9] hover:bg-[#EFECE6]'
                }`}
              >
                Presupuestos ({documents.filter((d) => d.type === 'presupuesto').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('factura')}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                  filterType === 'factura'
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-white text-[#475569] border border-[#D5D2C9] hover:bg-[#EFECE6]'
                }`}
              >
                Facturas ({documents.filter((d) => d.type === 'factura').length})
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569] bg-white px-3 py-1 rounded-lg border border-[#D5D2C9]">
                Presupuestos ({documents.length})
              </span>
            </div>
          )}
        </div>

        {/* Buscador, selector de vista y botones de creación */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar matrícula, cliente o nº..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          {/* Selector de Vista: Tarjetas / Tabla */}
          <div className="flex items-center bg-white border border-[#CBD5E1] rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#0F2942] text-white'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Vista Tarjetas (Mismo formato que Facturas)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#0F2942] text-white'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Vista Tabla"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón Nuevo Presupuesto: Hoja con el signo '+' y la 'P' mayúscula dentro */}
          <button
            type="button"
            onClick={onNewBudget}
            className="flex items-center justify-center p-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer group"
            title="Nuevo Presupuesto"
            aria-label="Nuevo Presupuesto"
          >
            <SheetPlusPIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </button>

          {hasInvoices && onNewInvoice && (
            <button
              type="button"
              onClick={onNewInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Factura</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido: Tarjetas o Tabla */}
      {viewMode === 'cards' ? (
        <div className="p-4 sm:p-6 bg-[#F8F7F3]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-xs">
              No se han encontrado presupuestos ni facturas con el criterio seleccionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((doc) => {
                const isBudget = doc.type === 'presupuesto';
                const isInvoice = doc.type === 'factura';
                const subtitle = [doc.vehicleBrand, doc.vehicleModel || doc.vehicleType].filter(Boolean).join(' ') || 'Vehículo Genérico';

                const isAccepted = doc.acceptedByClient || doc.status === 'aceptado';
                const isRejected = doc.status === 'rechazado';
                const isPaid = doc.status === 'pagado' || doc.status === 'PAGADO' || doc.status === 'confirmada';

                let cardStatus = 'PENDIENTE';
                let statusColor = 'border border-orange-500';
                let statusTextColor = 'text-orange-500';

                if (isAccepted) {
                  cardStatus = 'ACEPTADO';
                  statusColor = 'border border-emerald-500';
                  statusTextColor = 'text-emerald-600';
                } else if (isRejected) {
                  cardStatus = 'RECHAZADO';
                  statusColor = 'border border-red-500';
                  statusTextColor = 'text-red-500';
                } else if (isPaid) {
                  cardStatus = 'PAGADO';
                  statusColor = 'border border-blue-600';
                  statusTextColor = 'text-blue-600';
                } else if (doc.status === 'enviado' || doc.status === 'enviada') {
                  cardStatus = 'ENVIADO';
                  statusColor = 'border border-amber-500';
                  statusTextColor = 'text-amber-600';
                }

                const isFacturaRecibida = doc.type === 'factura_recibida';
                const targetExp = !isFacturaRecibida 
                  ? (doc.expediente || (isBudget && doc.number ? `E${doc.number.replace(/\D/g, '')}` : undefined)) 
                  : undefined;
                
                const singleDocColors = getDocStatusColors(doc, documents);

                return (
                  <StandardCard
                    key={doc.id}
                    status={cardStatus}
                    statusColor={statusColor}
                    statusTextColor={statusTextColor}
                    vehiclePlate={doc.vehiclePlate || 'SIN-MAT'}
                    subtitle={subtitle}
                    title={doc.clientName}
                    refCode={singleDocColors.budgetNum || doc.number}
                    refCodeColor={singleDocColors.budgetColor}
                    expediente={singleDocColors.expNum || targetExp}
                    expedienteColor={singleDocColors.expedienteColor}
                    facturaNum={singleDocColors.invoiceNum}
                    facturaColor={singleDocColors.invoiceColor}
                    isExpandable={true}
                    onViewDoc={() => onViewDoc(doc)}
                    onViewExpediente={targetExp && onNavigateToExpediente ? () => onNavigateToExpediente(targetExp) : undefined}
                    viewDocLabel={isBudget ? 'Ver presupuesto' : 'Ver factura'}
                    viewExpedienteLabel="Ver expediente (Roadmap)"
                    actions={
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
                          {/* 1. Ver Documento (Hoja P o F o Eye) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDoc(doc);
                            }}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title={isBudget ? 'Ver presupuesto' : 'Ver documento'}
                            aria-label="Ver documento"
                          >
                            {isBudget ? (
                              <SheetPIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                            ) : (
                              <SheetFIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                            )}
                          </button>

                          {/* 2. Expediente Vinculado */}
                          {!isFacturaRecibida && targetExp && onNavigateToExpediente ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToExpediente(targetExp);
                              }}
                              className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                              title="Ver Roadmap del expediente vinculado"
                              aria-label="Ver expediente"
                            >
                              <FolderKanban className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14" />
                          )}

                          {/* 3. Compartir / Enviar por WhatsApp */}
                          {onDispatchDoc ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDispatchDoc(doc);
                              }}
                              className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                              title="Enviar por WhatsApp"
                              aria-label="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onShareDoc(doc);
                              }}
                              className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                              title="Compartir documento"
                              aria-label="Compartir"
                            >
                              <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          )}

                          {/* 4. Teléfono o Email */}
                          {doc.clientPhone ? (
                            <a
                              href={`tel:${doc.clientPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                              title={`Llamar a ${doc.clientPhone}`}
                              aria-label="Llamar"
                            >
                              <Phone className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </a>
                          ) : doc.clientEmail ? (
                            <a
                              href={`mailto:${doc.clientEmail}?subject=Documento ${doc.number}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                              title={`Email a ${doc.clientEmail}`}
                              aria-label="Email"
                            >
                              <Mail className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </a>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14" />
                          )}
                        </div>

                        {/* Fila secundaria si hay fijar precios o facturar */}
                        {(doc.needsBossPricing || isAccepted) && (
                          <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-200/60">
                            {doc.needsBossPricing && onEditBudgetPricing && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditBudgetPricing(doc);
                                }}
                                className="p-2 text-orange-600 hover:text-orange-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                                title="Fijar Precios"
                              >
                                <Euro className="w-10 h-10" strokeWidth={1.8} />
                              </button>
                            )}
                            {isAccepted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onConvertToInvoice(doc);
                                }}
                                className="p-2 text-blue-700 hover:text-blue-800 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                                title="Convertir a Factura"
                              >
                                <ArrowRight className="w-10 h-10" strokeWidth={1.8} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Tabla de Documentos */
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E2E0D8] bg-[#F8F7F3] text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              <th className="py-2.5 px-4">Documento / Expediente</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Cliente Receptor</th>
              <th className="py-2.5 px-3">NIF/CIF</th>
              <th className="py-2.5 px-3 text-right">Base Imponible</th>
              <th className="py-2.5 px-3 text-right">IVA (21%)</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-center">Estado Legal</th>
              <th className="py-2.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F0EB]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#64748B] text-xs">
                  No se han encontrado presupuestos ni facturas con el criterio seleccionado.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const isInvoice = doc.type === 'factura';
                const isBudget = doc.type === 'presupuesto';

                return (
                  <tr key={doc.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* Número y tipo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isInvoice ? (
                          <FileCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-[#0F2942] shrink-0" />
                        )}
                        <div>
                          <span className="font-mono font-bold text-[#0F172A] block">
                            {doc.number}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase text-[#64748B]">
                              {doc.type} • Serie {doc.series || 'A'}
                            </span>
                            {doc.expediente && (
                              <span className="inline-flex items-center text-[9px] font-mono font-bold bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] px-1 py-0.2 rounded-xs">
                                {doc.expediente}
                              </span>
                            )}
                            {doc.vehiclePlate && (
                              <span className="inline-flex items-center text-[9px] font-mono font-bold bg-[#EFECE6] text-[#0F172A] border border-[#CBD5E1] px-1 py-0.2 rounded-xs">
                                <span className="text-[#003399] mr-0.5">E</span>
                                {doc.vehiclePlate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3 px-3 text-[#475569] font-medium whitespace-nowrap">
                      {doc.date}
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#0F172A] block truncate max-w-xs">
                        {doc.clientName}
                      </span>
                    </td>

                    {/* CIF */}
                    <td className="py-3 px-3 font-mono text-[#64748B] whitespace-nowrap">
                      {doc.clientCif}
                    </td>

                    {/* Base */}
                    <td className="py-3 px-3 text-right font-mono text-[#475569]">
                      {doc.needsBossPricing ? 'Pendiente' : `${doc.subtotal.toFixed(2)} €`}
                    </td>

                    {/* IVA */}
                    <td className="py-3 px-3 text-right font-mono text-[#1E3A8A]">
                      {doc.needsBossPricing ? 'Pendiente' : (doc.applyIva ? `${doc.ivaAmount.toFixed(2)} €` : '0.00 €')}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#0F2942] whitespace-nowrap">
                      {doc.needsBossPricing ? 'Por valorar' : `${doc.total.toFixed(2)} €`}
                    </td>

                    {/* Estado Legal */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {doc.needsBossPricing ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
                          <Lock className="w-2.5 h-2.5 text-amber-700" />
                          Pendiente Precios Jefe
                        </span>
                      ) : doc.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm">
                          <Lock className="w-2.5 h-2.5 text-emerald-700" />
                          Enviada (Inmutable)
                        </span>
                      ) : doc.status === 'confirmada' ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-sm">
                          Confirmada
                        </span>
                      ) : doc.status === 'aceptado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-700" />
                          Aceptado
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-sm">
                          Borrador
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDoc(doc)}
                          className="p-1.5 text-[#0F2942] hover:bg-[#FAF9F5] rounded transition-colors"
                          title="Ver documento"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.type !== 'factura_recibida' && (doc.expediente || doc.type === 'presupuesto') && onNavigateToExpediente && (
                          <button
                            type="button"
                            onClick={() => onNavigateToExpediente(doc.expediente || ('E' + (doc.number || '').replace(/\D/g, '')))}
                            className="p-1.5 text-[#1E3A8A] hover:bg-blue-50 rounded transition-colors"
                            title="Ver expediente en Roadmap"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onShareDoc(doc)}
                          className="p-1.5 text-[#64748B] hover:bg-[#FAF9F5] rounded transition-colors"
                          title="Compartir"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
};
