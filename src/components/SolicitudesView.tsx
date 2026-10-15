import React, { useState, useEffect } from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { Search, Plus, FolderKanban, CheckCircle2, XCircle, Clock, Check, Image as ImageIcon, X, ZoomIn, FileText, Wrench, MessageCircle, Phone, Mail } from 'lucide-react';
import { SheetPIcon, SheetPlusPIcon } from './BudgetIcons';
import { SolicitudItem, GestarianDocument } from '../types';
import { getStoredSolicitudes, saveStoredSolicitudes, getStoredDocuments, saveStoredDocuments } from '../services/storage';

interface SolicitudesViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onNewBudgetWithData?: (data: {
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    vehiclePlate: string;
    vehicleBrand: string;
    vehicleModel: string;
    description?: string;
    images?: string[];
    expediente?: string;
    solicitudId?: string;
    solicitudNumber?: string;
  }) => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
  onViewDoc?: (doc: GestarianDocument) => void;
}

export const SolicitudesView: React.FC<SolicitudesViewProps> = ({
  id,
  logoUrl,
  userFullName,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onNewBudgetWithData,
  onNavigateToExpediente,
  onViewDoc,
}) => {
  const [search, setSearch] = useState('');
  const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>(() => getStoredSolicitudes());
  const [documents, setDocuments] = useState<GestarianDocument[]>(() => getStoredDocuments());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendiente' | 'atendida' | 'cerrada' | 'aceptada' | 'confirmada'>('todas');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const handleFilter = (e: Event) => {
      const customEvent = e as CustomEvent<{ filter: 'todas' | 'pendiente' | 'atendida' | 'cerrada' | 'aceptada' | 'confirmada' }>;
      if (customEvent.detail?.filter) {
        setStatusFilter(customEvent.detail.filter);
      }
    };
    window.addEventListener('gestarian_filter_solicitudes', handleFilter);
    return () => window.removeEventListener('gestarian_filter_solicitudes', handleFilter);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setSolicitudes(getStoredSolicitudes());
      setDocuments(getStoredDocuments());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('gestarian_solicitudes_updated', handleUpdate);
    window.addEventListener('gestarian_documents_updated', handleUpdate);

    handleUpdate();

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('gestarian_solicitudes_updated', handleUpdate);
      window.removeEventListener('gestarian_documents_updated', handleUpdate);
    };
  }, []);

  const showToastFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  /**
   * Determina el estado y color de la tarjeta de solicitud:
   * - PENDIENTE (Naranja)
   * - ATENDIDA (Azul)
   * - CERRADA:
   *     - ROJO: Presupuesto rechazado
   *     - VERDE: Presupuesto aceptado
   *     - NARANJA INTERMITENTE: Presupuesto aceptado pero cliente propone otra fecha de entrega
   */
  const getSolicitudVisualState = (sol: SolicitudItem) => {
    const linkedDoc = documents.find(
      (d) => (d.expediente && d.expediente === sol.expediente) || (d.solicitudId && d.solicitudId === sol.id)
    );

    // 1. RECHAZADA -> CERRADA (ROJO)
    const isRejected = sol.status === 'RECHAZADA' || linkedDoc?.status === 'rechazado';
    if (isRejected) {
      return {
        type: 'CERRADA_RECHAZADA' as const,
        statusCategory: 'cerrada' as const,
        statusLabel: 'CERRADA',
        statusColor: 'border border-rose-500 shadow-md ring-1 ring-rose-400/30',
        statusTextColor: 'text-rose-600 font-black',
        isBlinking: false,
        isConfirmed: false,
        desc: 'Presupuesto rechazado.',
      };
    }

    // 2. ACEPTADA
    const isConfirmed =
      sol.status === 'CONFIRMADA' ||
      linkedDoc?.citaStatus === 'cita_confirmada' ||
      linkedDoc?.tallerStatus === 'enviar_a_taller' ||
      linkedDoc?.tallerStatus === 'en_reparacion' ||
      linkedDoc?.tallerStatus === 'reparacion_finalizada';

    const isBudgetAccepted = Boolean(
      sol.status === 'PRESUPUESTO_ACEPTADO' ||
      sol.status === 'PRESUPUESTO_Y_FECHA_ACEPTADOS' ||
      isConfirmed ||
      (linkedDoc && (
        linkedDoc.status === 'aceptado' ||
        linkedDoc.acceptedByClient ||
        linkedDoc.type === 'factura' ||
        Boolean(linkedDoc.convertedToInvoiceId)
      ))
    );

    if (isBudgetAccepted) {
      // ¿Propuso otra fecha de entrega / fecha no aceptada? -> CERRADA (NARANJA INTERMITENTE)
      const hasProposedAlternativeDate = Boolean(
        linkedDoc && (
          Boolean(linkedDoc.proposedDeliveryDate) ||
          linkedDoc.deliveryDateStatus === 'pending_acceptance' ||
          linkedDoc.deliveryDateProposedBy === 'client' ||
          (linkedDoc.citaStatus === 'pendiente' && Boolean(linkedDoc.proposedDeliveryDate))
        ) && linkedDoc.deliveryDateStatus !== 'accepted' && !isConfirmed
      );

      if (hasProposedAlternativeDate) {
        return {
          type: 'CERRADA_FECHA_PROPUESTA' as const,
          statusCategory: 'cerrada' as const,
          statusLabel: 'FECHA PROPUESTA',
          statusColor: 'border border-orange-500 shadow-md ring-2 ring-orange-400/40',
          statusTextColor: 'text-orange-600 font-black animate-pulse',
          isBlinking: true,
          isConfirmed: false,
          desc: 'Presupuesto aceptado con fecha de entrega alternativa propuesta por el cliente.',
        };
      }

      // Presupuesto aceptado con fecha aceptada o confirmada -> CERRADA (VERDE)
      return {
        type: 'CERRADA_ACEPTADA' as const,
        statusCategory: 'cerrada' as const,
        statusLabel: 'ACEPTADA',
        statusColor: 'border border-emerald-500 shadow-md ring-1 ring-emerald-400/30',
        statusTextColor: 'text-emerald-600 font-black',
        isBlinking: false,
        isConfirmed,
        desc: isConfirmed ? 'Vehículo recibido en el taller.' : 'Presupuesto aceptado.',
      };
    }

    // 3. ATENDIDA (Solo cuando el presupuesto ha sido enviado al cliente y con fecha de entrega cumplimentada)
    const hasDeliveryDate = Boolean(
      (linkedDoc?.vehicleDeliveryDate && linkedDoc.vehicleDeliveryDate.trim()) ||
      (linkedDoc?.proposedDeliveryDate && linkedDoc.proposedDeliveryDate.trim())
    );

    const isAtendida = Boolean(
      (sol.status === 'ATENDIDA' || (linkedDoc && (linkedDoc.status === 'enviado' || Boolean(linkedDoc.sentAt)))) &&
      hasDeliveryDate
    );

    if (isAtendida) {
      return {
        type: 'ATENDIDA' as const,
        statusCategory: 'atendida' as const,
        statusLabel: 'ATENDIDA',
        statusColor: 'border border-blue-500 shadow-md ring-1 ring-blue-400/30',
        statusTextColor: 'text-blue-600 font-black',
        isBlinking: false,
        isConfirmed: false,
        desc: 'Presupuesto enviado al cliente.',
      };
    }

    // 4. PENDIENTE (Permanece naranja en estado pendiente hasta que se envía el presupuesto al cliente)
    return {
      type: 'PENDIENTE' as const,
      statusCategory: 'pendiente' as const,
      statusLabel: 'PENDIENTE',
      statusColor: 'border border-orange-500 shadow-md ring-1 ring-orange-400/30',
      statusTextColor: 'text-orange-500 font-black',
      isBlinking: false,
      isConfirmed: false,
      desc: 'Solicitud pendiente de valoración.',
    };
  };

  /**
   * Marcar como confirmada mediante el botón de confirmar dentro de la tarjeta
   * (indica que el cliente ha traído el vehículo al taller).
   */
  const handleConfirmSolicitud = (sol: SolicitudItem) => {
    const nowStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Actualizar solicitud en la lista y almacenamiento
    const updated = solicitudes.map((s) =>
      s.id === sol.id
        ? {
            ...s,
            status: 'CONFIRMADA',
            reviewedAt: nowStr,
          }
        : s
    );
    setSolicitudes(updated);
    saveStoredSolicitudes(updated);
    window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: { solId: sol.id, newStatus: 'CONFIRMADA' } }));

    // 2. Sincronizar parada del Roadmap correspondiente a este expediente
    try {
      const currentDocs = getStoredDocuments();
      let matched = false;
      const updatedDocs = currentDocs.map((d) => {
        if ((d.expediente && d.expediente === sol.expediente) || (d.solicitudId && d.solicitudId === sol.id)) {
          matched = true;
          return {
            ...d,
            citaStatus: 'cita_confirmada' as const,
            tallerStatus: 'enviar_a_taller' as const,
          };
        }
        return d;
      });

      if (matched) {
        saveStoredDocuments(updatedDocs);
        setDocuments(updatedDocs);
        window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
      }
    } catch (e) {
      console.error('Error sincronizando documento desde Solicitud:', e);
    }

    showToastFeedback(`¡Solicitud ${sol.number} confirmada! El vehículo ha sido recibido en el taller.`);
  };

  /**
   * Aceptar la fecha de entrega propuesta por el cliente
   */
  const handleAcceptClientProposedDate = (sol: SolicitudItem, linkedDoc?: GestarianDocument) => {
    const nowStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (linkedDoc) {
      const currentDocs = getStoredDocuments();
      const updatedDocs: GestarianDocument[] = currentDocs.map((d) => {
        if (d.id === linkedDoc.id || d.number === linkedDoc.number || (d.expediente && d.expediente === sol.expediente)) {
          return {
            ...d,
            status: 'aceptado' as const,
            acceptedByClient: true,
            deliveryDateStatus: 'accepted' as const,
            deliveryDateProposedBy: 'workshop' as const,
            citaAcceptedBy: 'workshop' as const,
            citaAcceptedAt: new Date().toISOString(),
            citaStatus: 'cita_confirmada' as const,
          };
        }
        return d;
      });
      saveStoredDocuments(updatedDocs);
      setDocuments(updatedDocs);
      window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
    }

    const updated = solicitudes.map((s) =>
      s.id === sol.id
        ? {
            ...s,
            status: 'PRESUPUESTO_Y_FECHA_ACEPTADOS',
            reviewedAt: nowStr,
          }
        : s
    );
    setSolicitudes(updated);
    saveStoredSolicitudes(updated);
    window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: { solId: sol.id, newStatus: 'PRESUPUESTO_Y_FECHA_ACEPTADOS' } }));
    showToastFeedback(`¡Fecha propuesta aceptada! La solicitud ${sol.number} y el presupuesto pasan a estado ACEPTADA (Verde).`);
  };

  /**
   * Desmarcar confirmación si se pulsó por error
   */
  const handleUndoConfirmSolicitud = (sol: SolicitudItem) => {
    const updated = solicitudes.map((s) =>
      s.id === sol.id
        ? {
            ...s,
            status: 'PENDIENTE',
          }
        : s
    );
    setSolicitudes(updated);
    saveStoredSolicitudes(updated);
    window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: { solId: sol.id, newStatus: 'PENDIENTE' } }));

    try {
      const currentDocs = getStoredDocuments();
      let matched = false;
      const updatedDocs = currentDocs.map((d) => {
        if ((d.expediente && d.expediente === sol.expediente) || (d.solicitudId && d.solicitudId === sol.id)) {
          matched = true;
          return {
            ...d,
            citaStatus: 'pendiente' as const,
          };
        }
        return d;
      });

      if (matched) {
        saveStoredDocuments(updatedDocs);
        setDocuments(updatedDocs);
        window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
      }
    } catch (e) {
      console.error('Error desmarcando confirmación:', e);
    }

    showToastFeedback(`Solicitud ${sol.number} restablecida.`);
  };

  const handleUpdateStatus = (solId: string, newStatus: string) => {
    const nowStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const updated = solicitudes.map((s) =>
      s.id === solId
        ? {
            ...s,
            status: newStatus,
            reviewedAt: nowStr,
          }
        : s
    );
    setSolicitudes(updated);
    saveStoredSolicitudes(updated);
    window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: { solId, newStatus } }));
  };

  const filtered = solicitudes.filter((sol) => {
    const visualState = getSolicitudVisualState(sol);
    if (statusFilter === 'pendiente') {
      if (visualState.statusCategory !== 'pendiente') return false;
    } else if (statusFilter === 'atendida') {
      if (visualState.statusCategory !== 'atendida') return false;
    } else if (statusFilter === 'cerrada') {
      if (visualState.statusCategory !== 'cerrada') return false;
    } else if (statusFilter === 'aceptada') {
      if (visualState.type !== 'CERRADA_ACEPTADA' && visualState.type !== 'CERRADA_FECHA_PROPUESTA') return false;
    } else if (statusFilter === 'confirmada') {
      if (visualState.type !== 'CERRADA_ACEPTADA') return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      sol.clientName.toLowerCase().includes(q) ||
      sol.vehiclePlate.toLowerCase().includes(q) ||
      sol.number.toLowerCase().includes(q) ||
      sol.vehicleBrand.toLowerCase().includes(q)
    );
  });

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col bg-white overflow-y-auto">
      <PageHeader
        pageId={id || 'page-solicitudes'}
        title="Solicitudes"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      {/* Notificación flotante de confirmación */}
      {actionFeedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F2942] text-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-bold border border-sky-400 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col gap-6">
        {/* Tarjetas de Solicitudes con línea de borde exterior según estado */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
            {statusFilter !== 'todas'
              ? `No se encontraron solicitudes con estado "${statusFilter}".`
              : 'No se encontraron solicitudes registradas.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((sol) => {
              const visualState = getSolicitudVisualState(sol);
              const linkedDoc = documents.find(
                (d) => (d.expediente && d.expediente === sol.expediente) || (d.solicitudId && d.solicitudId === sol.id)
              );

              return (
                <StandardCard
                  key={sol.id}
                  status={visualState.statusLabel}
                  statusColor={visualState.statusColor}
                  statusTextColor={visualState.statusTextColor}
                  vehiclePlate={sol.vehiclePlate || 'SIN MATRÍCULA'}
                  subtitle={
                    `${sol.vehicleBrand || ''} ${sol.vehicleModel || ''}`.trim() ||
                    sol.type ||
                    'Solicitud de Presupuesto'
                  }
                  title={sol.clientName}
                  refCode={sol.number}
                  budgetNum={
                    visualState.type === 'ATENDIDA' || linkedDoc?.status === 'enviado' || Boolean(linkedDoc?.sentAt)
                      ? linkedDoc?.number
                      : undefined
                  }
                  budgetNumColor="text-blue-900"
                  expediente={sol.expediente}
                  cleanNumbersLayout={true}
                  isExpandable={true}
                  actions={
                    <div className="flex flex-col gap-3">
                      {/* Título y Texto de Descripción del trabajo (multiplicados por 1.2) */}
                      <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E2E0D8] space-y-2 shadow-2xs">
                        <div className="flex items-center gap-2 text-[14.5px] font-black uppercase tracking-wider text-[#0F2942]">
                          <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                          <span>Descripción del trabajo</span>
                        </div>
                        <p className="text-[17px] font-medium text-[#334155] whitespace-pre-wrap leading-relaxed">
                          {sol.description || 'Sin descripción especificada por el cliente.'}
                        </p>
                      </div>

                      {/* Imágenes subidas por el cliente en su solicitud */}
                      {sol.images && sol.images.length > 0 && (
                        <div className="bg-white p-3 rounded-xl border border-[#CBD5E1] space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0F2942]">
                              <ImageIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>Fotos de la avería ({sol.images.length})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Toca para ampliar</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                            {sol.images.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(img);
                                }}
                                className="group relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-sky-500 transition-all cursor-pointer shadow-xs"
                                title={`Ver foto ${idx + 1} ampliada`}
                              >
                                <img
                                  src={img}
                                  alt={`Avería foto ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notificación si el cliente ha propuesto una nueva fecha de entrega */}
                      {visualState.type === 'CERRADA_FECHA_PROPUESTA' && linkedDoc && (
                        <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-3.5 shadow-sm space-y-2.5 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2 text-orange-950 font-black text-xs uppercase tracking-wide">
                            <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                            <span>Nueva fecha de entrega propuesta por el cliente</span>
                          </div>
                          <p className="text-xs text-orange-900 font-medium leading-relaxed">
                            El cliente ha aceptado el presupuesto y propone entregar el vehículo en una nueva fecha/hora:
                          </p>
                          <div className="bg-white p-3 rounded-lg border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Fecha y hora propuesta:</span>
                              <span className="text-sm sm:text-base font-black font-mono text-orange-600">
                                {linkedDoc.proposedDeliveryDate || linkedDoc.vehicleDeliveryDate} {linkedDoc.proposedDeliveryTime || linkedDoc.vehicleDeliveryTime ? `a las ${linkedDoc.proposedDeliveryTime || linkedDoc.vehicleDeliveryTime}` : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAcceptClientProposedDate(sol, linkedDoc)}
                              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                              title="Aceptar la fecha de entrega propuesta por el cliente"
                            >
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                              <span>Aceptar fecha propuesta</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botones de acción desplegados con el mismo diseño exacto de la tarjeta extendida */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-gray-200">
                        {visualState.type === 'ATENDIDA' && (
                          <div className="w-full flex flex-col items-center justify-center text-center py-1 space-y-1">
                            <span className="text-xl sm:text-2xl md:text-[27px] font-black uppercase tracking-tight text-blue-700 leading-tight">
                              PRESUPUESTO ENVIADO
                            </span>
                            <span className="text-xl sm:text-2xl md:text-[27px] font-black tracking-tight text-slate-700 leading-tight">
                              Esperando respuesta
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-3 items-center justify-items-center pt-1">
                          {/* 1. Presupuesto: Generar si pendiente o Ver si ya existe */}
                          {linkedDoc ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewDoc) onViewDoc(linkedDoc);
                              }}
                              className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                              title={`Ver Presupuesto ${linkedDoc.number}`}
                              aria-label="Ver Presupuesto"
                            >
                              <SheetPIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNewBudgetWithData) {
                                  onNewBudgetWithData({
                                    clientName: sol.clientName,
                                    clientPhone: sol.clientPhone,
                                    clientEmail: sol.clientEmail,
                                    vehiclePlate: sol.vehiclePlate,
                                    vehicleBrand: sol.vehicleBrand,
                                    vehicleModel: sol.vehicleModel,
                                    description: sol.description,
                                    images: sol.images,
                                    expediente: sol.expediente,
                                    solicitudId: sol.id,
                                    solicitudNumber: sol.number,
                                  });
                                }
                              }}
                              className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                              title="Generar presupuesto a partir de la solicitud"
                              aria-label="Generar presupuesto"
                            >
                              <SheetPlusPIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                            </button>
                          )}

                          {/* 2. Expediente (Roadmap) */}
                          {onNavigateToExpediente ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToExpediente(sol.expediente);
                              }}
                              className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                              title={`Ver Expediente ${sol.expediente}`}
                              aria-label="Ver Expediente"
                            >
                              <FolderKanban className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14" />
                          )}

                          {/* 3. WhatsApp al cliente */}
                          {sol.clientPhone ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanPhone = sol.clientPhone!.replace(/\D/g, '');
                                window.open(`https://wa.me/34${cleanPhone}?text=${encodeURIComponent(`Hola ${sol.clientName}, nos ponemos en contacto de taller respecto a su solicitud de presupuesto ${sol.number}.`)}`, '_blank');
                              }}
                              className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                              title={`WhatsApp a ${sol.clientName} (${sol.clientPhone})`}
                              aria-label="WhatsApp"
                            >
                              <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14" />
                          )}

                          {/* 4. Teléfono o Rechazar (si pendiente) */}
                          {visualState.type === 'PENDIENTE' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(sol.id, 'RECHAZADA');
                                setActionFeedback(`Solicitud ${sol.number} rechazada`);
                                setTimeout(() => setActionFeedback(null), 3500);
                              }}
                              className="p-2 text-rose-600 hover:text-rose-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                              title="Rechazar solicitud de presupuesto"
                              aria-label="Rechazar"
                            >
                              <XCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          ) : sol.clientPhone ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${sol.clientPhone}`;
                              }}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                              title={`Llamar a ${sol.clientName} (${sol.clientPhone})`}
                              aria-label="Llamar"
                            >
                              <Phone className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14" />
                          )}
                        </div>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Imagen Ampliada en Alta Resolución */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer shadow-lg"
              title="Cerrar imagen"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Foto de la avería ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
