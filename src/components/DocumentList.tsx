import React, { useState } from 'react';
import { 
  FileText, FileCheck, Search, Filter, Plus, Eye, Share2, 
  ArrowRight, Lock, CheckCircle, Car, Sparkles, Send, MessageSquare, Mail,
  LayoutGrid, List, Clock, FolderOpen
} from 'lucide-react';
import { DocumentType, GestarianDocument } from '../types';
import { StandardCard } from './StandardCard';
import { SheetPlusPIcon } from './BudgetIcons';

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
}) => {
  const [filterType, setFilterType] = useState<'all' | 'presupuesto' | 'factura'>('all');
  const [search, setSearch] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

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
                let statusColor = 'border-[3px] border-orange-500';
                let statusTextColor = 'text-orange-500';

                if (isAccepted) {
                  cardStatus = 'ACEPTADO';
                  statusColor = 'border-[3px] border-emerald-500';
                  statusTextColor = 'text-emerald-600';
                } else if (isRejected) {
                  cardStatus = 'RECHAZADO';
                  statusColor = 'border-[3px] border-red-500';
                  statusTextColor = 'text-red-500';
                } else if (isPaid) {
                  cardStatus = 'PAGADO';
                  statusColor = 'border-[3px] border-blue-600';
                  statusTextColor = 'text-blue-600';
                } else if (doc.status === 'enviado' || doc.status === 'enviada') {
                  cardStatus = 'ENVIADO';
                  statusColor = 'border-[3px] border-amber-500';
                  statusTextColor = 'text-amber-600';
                }

                const targetExp = doc.expediente || (doc.number ? `E${doc.number.replace(/\D/g, '')}` : undefined);
                
                return (
                  <StandardCard
                    key={doc.id}
                    status={cardStatus}
                    statusColor={statusColor}
                    statusTextColor={statusTextColor}
                    vehiclePlate={doc.vehiclePlate || 'SIN-MAT'}
                    subtitle={subtitle}
                    title={doc.clientName}
                    refCode={doc.number}
                    expediente={targetExp}
                    isExpandable={true}
                    onViewDoc={() => onViewDoc(doc)}
                    onViewExpediente={targetExp && onNavigateToExpediente ? () => onNavigateToExpediente(targetExp) : undefined}
                    viewDocLabel={isBudget ? 'Ver presupuesto' : 'Ver factura'}
                    viewExpedienteLabel="Ver expediente (Roadmap)"
                    actions={
                      <div className="flex items-center justify-around gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onViewDoc(doc)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2942] hover:text-[#38BDF8] transition-colors p-2 cursor-pointer"
                          title={isBudget ? 'Ver presupuesto' : 'Ver documento'}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </button>

                        {(doc.expediente || doc.number) && onNavigateToExpediente && (
                          <button
                            type="button"
                            onClick={() => onNavigateToExpediente(doc.expediente || `E${doc.number.replace(/\D/g, '')}`)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] hover:text-[#0F2942] transition-colors p-2 cursor-pointer"
                            title="Ver Roadmap del expediente vinculado"
                          >
                            <FolderOpen className="w-4 h-4" />
                            <span>Expediente</span>
                          </button>
                        )}

                        {onDispatchDoc && (
                          <button
                            type="button"
                            onClick={() => onDispatchDoc(doc)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors p-2 cursor-pointer"
                            title="Enviar por WhatsApp / Email"
                          >
                            <Send className="w-4 h-4" />
                            <span>Enviar</span>
                          </button>
                        )}

                        {isBudget && (
                          <>
                            {doc.needsBossPricing && onEditBudgetPricing && (
                              <button
                                type="button"
                                onClick={() => onEditBudgetPricing(doc)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-500 transition-colors p-2 cursor-pointer"
                                title="Fijar precios"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>Precios</span>
                              </button>
                            )}

                            {!isAccepted && !doc.needsBossPricing && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded"
                                title="El presupuesto debe ser aceptado por el cliente en su área de cliente"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pendiente cliente</span>
                              </span>
                            )}

                            {isAccepted && (
                              <button
                                type="button"
                                onClick={() => onConvertToInvoice(doc)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-600 transition-colors p-2 cursor-pointer"
                                title="Convertir a factura"
                              >
                                <ArrowRight className="w-4 h-4" />
                                <span>Facturar</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onShareDoc(doc)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors p-2 cursor-pointer"
                          title="Compartir"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Compartir</span>
                        </button>
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
                        {(doc.expediente || doc.number) && onNavigateToExpediente && (
                          <button
                            type="button"
                            onClick={() => onNavigateToExpediente(doc.expediente || ('E' + doc.number.replace(/\D/g, '')))}
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
