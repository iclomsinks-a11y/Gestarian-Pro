import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, Loader2, PlusCircle, MinusCircle, User, Car, Phone, Mail, 
  Calendar, Wrench, Camera, MessageCircle, Printer, Download, Share2, 
  FileText, Clock, Users, Image as ImageIcon, Send, FileCheck2, CheckCircle2, XCircle, 
  ClipboardList, Eye, FolderArchive, DollarSign, CreditCard, Trash2, X, Plus, Minus, History, AlertCircle, AlertTriangle, Receipt, Lock, Edit3
} from 'lucide-react';
import { GestarianDocument, AppUser, Client, CitaProposal, InternalNotification } from '../types';
import { generateDocumentPdfUrl, buildDocumentDispatchPayload, sendDocumentViaApi, getShortDocumentUrl } from '../services/documentDispatchService';
import { getNextDocumentNumber, getExpedienteFromDocNumber, getStoredDocuments, saveStoredDocuments, getStoredSolicitudes, saveStoredSolicitudes, getStoredNotifications, saveStoredNotifications } from '../services/storage';
import { DocumentViewerModal } from './DocumentViewerModal';
import { ExpedienteImagesModal } from './ExpedienteImagesModal';
import { AssignEmployeeModal } from './AssignEmployeeModal';
import { VerifactuSection } from './VerifactuSection';
import { formatDeliveryDateDisplay } from './CreateDocumentModal';
import { DeliveryDatePickerModal } from './DeliveryDatePickerModal';

interface RoadmapTrackerProps {
  document: GestarianDocument;
  client?: Client;
  allDocuments?: GestarianDocument[];
  currentUser: AppUser;
  onUpdateDocument: (updatedDoc: GestarianDocument) => void;
  onGenerateInvoiceFromBudget: (budget: GestarianDocument) => void;
  onShowToast?: (msg: string, duration?: number) => void;
  onOpenWorkOrdersModal?: () => void;
}

export const RoadmapTracker: React.FC<RoadmapTrackerProps> = ({
  document: doc,
  client,
  allDocuments = [],
  currentUser,
  onUpdateDocument,
  onGenerateInvoiceFromBudget,
  onShowToast,
}) => {
  if (doc.type === 'factura_recibida') {
    return null;
  }

  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<GestarianDocument | null>(null);
  const [showImagesModal, setShowImagesModal] = useState<boolean>(false);
  const [showPaymentsControlModal, setShowPaymentsControlModal] = useState<boolean>(false);

  // Form para negociación de fecha de entrega
  const [showDenyCalendarModal, setShowDenyCalendarModal] = useState<boolean>(false);
  const [isDeliveryDatePickerOpen, setIsDeliveryDatePickerOpen] = useState<boolean>(false);
  const [counterProposalDate, setCounterProposalDate] = useState<string>(
    doc.proposedDeliveryDate || doc.vehicleDeliveryDate || new Date().toISOString().split('T')[0]
  );

  // Form para nuevo pago
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('Efectivo');
  const [lastAbonoFeedback, setLastAbonoFeedback] = useState<{
    amount: number;
    date: string;
    method: string;
    isTotal: boolean;
    receiptNum: string;
  } | null>(null);

  const [showAssignEmployeeModal, setShowAssignEmployeeModal] = useState(false);
  const [isSendingBudgetEmail, setIsSendingBudgetEmail] = useState(false);

  // Solicitud vinculada del cliente e imágenes del expediente
  const allSolicitudes = getStoredSolicitudes();
  const matchingSolicitud = allSolicitudes.find(
    (s) =>
      (s.expediente && s.expediente === doc.expediente) ||
      (s.id && (s.id === doc.solicitudId || s.id === (doc as any).relatedSolicitudId)) ||
      (s.number && s.number === doc.solicitudNumber) ||
      (s.vehiclePlate && doc.vehiclePlate && s.vehiclePlate.trim().toUpperCase() === doc.vehiclePlate.trim().toUpperCase())
  );

  const solicitudImages = matchingSolicitud?.images || [];
  const docImages = doc.vehicleImages || [];
  const combinedVehicleImages = Array.from(new Set([...docImages, ...solicitudImages]));

  const [receptionNotes, setReceptionNotes] = useState<string>(
    doc.notes || matchingSolicitud?.description || ''
  );

  const handleUpdateImages = (updatedImages: string[]) => {
    const updatedDoc: GestarianDocument = {
      ...doc,
      vehicleImages: updatedImages,
    };
    if (onUpdateDocument) onUpdateDocument(updatedDoc);
  };

  const handleSaveReceptionNotes = () => {
    if (receptionNotes !== doc.notes) {
      const updatedDoc: GestarianDocument = {
        ...doc,
        notes: receptionNotes,
      };
      if (onUpdateDocument) onUpdateDocument(updatedDoc);
      if (onShowToast) onShowToast('Descripción de la reparación actualizada.');
    }
  };

  const handleCopyFromSolicitud = () => {
    if (matchingSolicitud?.description) {
      setReceptionNotes(matchingSolicitud.description);
      const updatedDoc: GestarianDocument = {
        ...doc,
        notes: matchingSolicitud.description,
      };
      if (onUpdateDocument) onUpdateDocument(updatedDoc);
      if (onShowToast) onShowToast('Descripción copiada de la solicitud del cliente.');
    }
  };

  const [confirmToast, setConfirmToast] = useState<{
    stepName?: string;
    message?: string;
    customContent?: React.ReactNode;
    isLocked?: boolean;
    onConfirm?: () => void;
  } | null>(null);

  // Status computation
  const foundInvoiceDoc = doc.type === 'factura' 
    ? doc 
    : allDocuments.find((d) => d.type === 'factura' && (d.expediente === doc.expediente || d.id === doc.convertedToInvoiceId || d.number === doc.convertedToInvoiceId));

  const foundBudgetDoc = doc.type === 'presupuesto'
    ? doc
    : allDocuments.find(
        (d) =>
          (d.type === 'presupuesto' || (d.type as string) === 'budget') &&
          (d.expediente === doc.expediente || d.id === doc.linkedBudgetId || d.id === (doc as any).relatedBudgetId)
      );

  const isBudgetSent = doc.status === 'enviado' || foundBudgetDoc?.status === 'enviado';
  const isBudgetAccepted =
    doc.status === 'aceptado' ||
    Boolean(doc.acceptedByClient) ||
    foundBudgetDoc?.status === 'aceptado' ||
    Boolean(foundBudgetDoc?.acceptedByClient) ||
    doc.type === 'factura' ||
    Boolean(doc.convertedToInvoiceId) ||
    Boolean(foundInvoiceDoc);
  const isBudgetRejected = doc.status === 'rechazado' || foundBudgetDoc?.status === 'rechazado';

  const isClientProposedPending = doc.deliveryDateProposedBy === 'client' && doc.deliveryDateStatus === 'pending_acceptance';
  const isWorkshopProposedPending = doc.deliveryDateProposedBy === 'workshop' && doc.deliveryDateStatus === 'pending_acceptance';
  const isDateProposed = Boolean(doc.proposedDeliveryDate || doc.vehicleDeliveryDate);

  const isRecepcionGreen = true; // Recepción siempre verde al existir el expediente
  const isPresupuestoGreen = isBudgetAccepted;

  const isCitaAccepted = isPresupuestoGreen && (doc.citaStatus === 'cita_aceptada' || doc.deliveryDateStatus === 'accepted' || doc.deliveryDateStatus !== 'pending_acceptance');
  const isCitaConfirmed = isPresupuestoGreen && doc.citaStatus === 'cita_confirmada';
  const isCitaGreen = isCitaConfirmed;

  const isTallerEnviar = isCitaGreen;
  const isTallerEnReparacion = isCitaGreen && (doc.tallerStatus === 'en_reparacion' || doc.workOrderStatus === 'en_ejecucion');
  const isTallerFinalizado = isCitaGreen && (doc.tallerStatus === 'reparacion_finalizada' || doc.workOrderStatus === 'finalizada');
  const isTallerGreen = isTallerFinalizado;

  const isFacturaGenerada = isTallerGreen && (doc.type === 'factura' || Boolean(doc.convertedToInvoiceId) || doc.facturacionStatus === 'facturado' || doc.facturacionStatus === 'factura_enviada');
  
  // Factura enviada al cliente (requerido para color verde en Facturación y activar la parada Cobro)
  const invoiceSentAt = 
    doc.facturaSentAt || 
    (doc.type === 'factura' ? doc.sentAt : undefined) ||
    foundInvoiceDoc?.facturaSentAt || 
    foundInvoiceDoc?.sentAt;

  const isFacturaEnviada = isTallerGreen && Boolean(
    (doc.type === 'factura' && (doc.status === 'enviada' || doc.status === 'enviado' || doc.facturacionStatus === 'factura_enviada' || Boolean(doc.sentAt || doc.facturaSentAt))) ||
    (foundInvoiceDoc && (foundInvoiceDoc.status === 'enviada' || foundInvoiceDoc.status === 'enviado' || foundInvoiceDoc.facturacionStatus === 'factura_enviada' || Boolean(foundInvoiceDoc.sentAt || foundInvoiceDoc.facturaSentAt))) ||
    (doc.facturacionStatus === 'factura_enviada') ||
    Boolean(doc.facturaSentAt)
  );

  const isFacturacionGreen = isFacturaEnviada;

  const formatInvoiceSentDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        if (dateStr.includes('-') && dateStr.length === 10) {
          const [y, m, day] = dateStr.split('-');
          return `${day}/${m}/${y}`;
        }
        return dateStr;
      }
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const invoiceSentDateDisplay = formatInvoiceSentDate(
    invoiceSentAt || (doc.type === 'factura' ? doc.date : foundInvoiceDoc?.date) || doc.date || new Date().toISOString()
  );

  const rawDeliveryDate = doc.proposedDeliveryDate || doc.vehicleDeliveryDate || foundBudgetDoc?.proposedDeliveryDate || foundBudgetDoc?.vehicleDeliveryDate;
  const deliveryDateDisplay = rawDeliveryDate ? formatDeliveryDateDisplay(rawDeliveryDate) : '';

  const canFinalizeRepair = isTallerEnReparacion && !isTallerFinalizado;
  const canInvoice = isTallerGreen && !isFacturaGenerada;

  const totalPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const isPaid = isFacturacionGreen && totalPaid >= (doc.total || 0) && (doc.total || 0) > 0;
  const isPartiallyPaid = isFacturacionGreen && totalPaid > 0 && !isPaid;
  const isCobroGreen = isPaid;

  const phoneClean = (client?.phone || doc.clientPhone || '').replace(/\D/g, '');

  // Fechas y cálculos de mora / impago para la parada de Cobro
  const now = new Date();
  const getDaysDiff = (dateStr?: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    const diffTime = now.getTime() - d.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const invoiceDateStr = doc.date || doc.createdAt;
  const daysSinceInvoice = getDaysDiff(invoiceDateStr);

  const sortedPayments = doc.payments && doc.payments.length > 0
    ? [...doc.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const lastPaymentDateStr = sortedPayments[0]?.date;
  const daysSinceLastPayment = getDaysDiff(lastPaymentDateStr);

  const getStepBgClass = (stepId: string) => {
    switch (stepId) {
      case 'recepcion':
        // Siempre verde
        return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';

      case 'presupuesto':
        if (isBudgetAccepted) {
          return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
        }
        if (isBudgetSent) {
          return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700';
        }
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';

      case 'cita':
        if (!isPresupuestoGreen) {
          return 'bg-slate-400 text-slate-100 border-slate-500';
        }
        if (isCitaConfirmed) {
          return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
        }
        if (isCitaAccepted) {
          return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700';
        }
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';

      case 'taller':
        if (!isCitaGreen) {
          return 'bg-slate-400 text-slate-100 border-slate-500';
        }
        if (isTallerFinalizado) {
          return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
        }
        if (isTallerEnReparacion) {
          return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700';
        }
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';

      case 'facturacion':
        if (isFacturaEnviada) {
          return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
        }
        if (!isTallerGreen) {
          return 'bg-slate-400 text-slate-100 border-slate-500';
        }
        if (isFacturaGenerada) {
          return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700';
        }
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';

      case 'cobro':
        if (!isFacturacionGreen) {
          return 'bg-slate-400 text-slate-100 border-slate-500';
        }
        if (isPaid) {
          return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700';
        }
        if (isPartiallyPaid) {
          if (daysSinceLastPayment > 30) {
            return 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700';
          }
          return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700';
        }
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';

      default:
        return 'bg-slate-300 text-slate-600 border-slate-400';
    }
  };

  // Assigned Employee and Creator
  const assignedEmployee = currentUser.employees?.find((e) => e.id === doc.assignedEmployeeId);
  const creatorEmployee = currentUser.employees?.find((e) => e.id === doc.createdByEmployeeId);

  // Budget document resolution
  // Handlers para negociación de fecha de entrega
  const handleAcceptProposedDate = () => {
    const now = new Date().toISOString();
    const agreedDate = doc.proposedDeliveryDate || doc.vehicleDeliveryDate || now.split('T')[0];
    const acceptedByName = currentUser.name || 'Taller Gestarian';

    const history = doc.citaHistory ? [...doc.citaHistory] : [];
    if (history.length > 0 && history[history.length - 1].status === 'pending') {
      history[history.length - 1] = {
        ...history[history.length - 1],
        status: 'accepted',
        acceptedBy: 'workshop',
        acceptedByName,
        acceptedAt: now,
      };
    } else {
      history.push({
        id: `prop_${Date.now()}`,
        date: agreedDate,
        proposedBy: doc.deliveryDateProposedBy || 'client',
        proposedByName: doc.deliveryDateProposedBy === 'client' ? (client?.name || doc.clientName) : 'Taller Gestarian',
        timestamp: now,
        status: 'accepted',
        acceptedBy: 'workshop',
        acceptedByName,
        acceptedAt: now,
      });
    }

    const updated: GestarianDocument = {
      ...doc,
      vehicleDeliveryDate: agreedDate,
      proposedDeliveryDate: undefined,
      deliveryDateStatus: 'accepted',
      citaStatus: 'cita_aceptada',
      citaAcceptedBy: 'workshop',
      citaAcceptedByName: acceptedByName,
      citaAcceptedAt: now,
      citaHistory: history,
      status: 'aceptado',
    };
    onUpdateDocument(updated);
    if (onShowToast) {
      onShowToast(`Fecha de entrega (${agreedDate}) ACEPTADA. Parada Cita activada en Azul.`);
    }
  };

  const handleSendCounterProposalDate = (newDate: string) => {
    if (!newDate) return;
    const now = new Date().toISOString();
    const proposedByName = currentUser.name || 'Taller Gestarian';

    const history = doc.citaHistory ? [...doc.citaHistory] : [];
    history.forEach((h, idx) => {
      if (h.status === 'pending') history[idx] = { ...h, status: 'rejected' };
    });

    history.push({
      id: `prop_${Date.now()}`,
      date: newDate,
      proposedBy: 'workshop',
      proposedByName,
      timestamp: now,
      status: 'pending',
    });

    const updated: GestarianDocument = {
      ...doc,
      proposedDeliveryDate: newDate,
      deliveryDateProposedBy: 'workshop',
      deliveryDateStatus: 'pending_acceptance',
      citaStatus: 'pendiente',
      citaHistory: history,
    };
    onUpdateDocument(updated);
    setShowDenyCalendarModal(false);
    if (onShowToast) {
      onShowToast(`Nueva propuesta de fecha de entrega (${newDate}) enviada al cliente.`);
    }
  };

  const budgetNumberOnly = (() => {
    if (doc.type === 'budget') return doc.number;
    if (doc.linkedBudgetNumber) return doc.linkedBudgetNumber;
    const numDigits = doc.number.replace(/\D/g, '');
    return numDigits ? `P${numDigits}` : 'P-26001';
  })();

  const budgetDoc: GestarianDocument = (() => {
    if (doc.type === 'presupuesto' || doc.type === 'budget') return doc;
    const found = allDocuments.find(
      (d) => (d.type === 'presupuesto' || d.type === 'budget') && (d.expediente === doc.expediente || d.id === doc.linkedBudgetId || d.number === doc.linkedBudgetNumber)
    );
    if (found) return found;
    return {
      ...doc,
      type: 'presupuesto' as const,
      number: budgetNumberOnly,
    };
  })();

  // Invoice document resolution
  const invoiceNumberOnly = (() => {
    if (doc.type === 'factura') return doc.number;
    if (doc.convertedToInvoiceId) return doc.convertedToInvoiceId;
    const numDigits = doc.number.replace(/\D/g, '');
    return numDigits ? `F${numDigits}` : 'F-26001';
  })();

  const invoiceDoc: GestarianDocument = (() => {
    if (doc.type === 'factura') return doc;
    const found = allDocuments.find(
      (d) => d.type === 'factura' && (d.expediente === doc.expediente || d.id === doc.convertedToInvoiceId || d.number === doc.convertedToInvoiceId)
    );
    if (found) return found;
    return {
      ...doc,
      type: 'factura' as const,
      number: invoiceNumberOnly,
      date: doc.date || doc.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    };
  })();

  const handleConfirmCita = () => {
    if (!isPresupuestoGreen) {
      if (onShowToast) onShowToast('La parada Cita está bloqueada: el presupuesto anterior debe estar aceptado en verde.', 4000);
      setConfirmToast({ stepName: 'Cita', message: 'Parada Cita bloqueada: el presupuesto anterior debe estar aceptado en verde.', isLocked: true });
      return;
    }

    const updated: GestarianDocument = {
      ...doc,
      citaStatus: 'cita_confirmada',
      tallerStatus: 'enviar_a_taller',
    };
    onUpdateDocument(updated);

    // Sincronizar en localStorage para que la tarjeta de Solicitudes vinculada pase a verde (CONFIRMADA)
    try {
      const storedSols = getStoredSolicitudes();
      const hasMatch = storedSols.some((s) => s.expediente === doc.expediente || (doc.solicitudId && s.id === doc.solicitudId));
      if (hasMatch) {
        const updatedSols = storedSols.map((s) => {
          if (s.expediente === doc.expediente || (doc.solicitudId && s.id === doc.solicitudId)) {
            return {
              ...s,
              status: 'CONFIRMADA',
              reviewedAt: new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          }
          return s;
        });
        saveStoredSolicitudes(updatedSols);
        window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: { expediente: doc.expediente, status: 'CONFIRMADA' } }));
      }
    } catch (e) {
      console.error('Error sincronizando solicitudes desde Roadmap:', e);
    }

    if (onShowToast) {
      onShowToast('Cita confirmada. Recepción de vehículo validada y listo para enviar a taller.');
    }
  };

  const handleEnviarATaller = () => {
    // BLOQUEO SECUENCIAL: requiere confirmación de recepción en parada cita
    if (!isCitaGreen) {
      if (onShowToast) onShowToast('No se puede enviar a taller si no se ha confirmado la recepción del vehículo en la parada Cita.', 4000);
      setConfirmToast({ stepName: 'Taller', message: 'Parada Taller bloqueada: no se puede enviar a taller si no se ha confirmado la recepción del vehículo en la parada Cita.', isLocked: true });
      return;
    }
    setShowAssignEmployeeModal(true);
  };

  const handleConfirmEmployeeAssignment = (docId: string, employeeId: string, employeeName: string) => {
    if (!isCitaGreen) {
      if (onShowToast) onShowToast('No se puede enviar a taller si no se ha confirmado la recepción del vehículo en la parada Cita.', 4000);
      return;
    }
    const updated: GestarianDocument = {
      ...doc,
      tallerStatus: 'en_reparacion',
      workOrderStatus: 'en_ejecucion',
      facturacionStatus: 'finalizar_reparacion',
      assignedEmployeeId: employeeId,
      createdByName: employeeName,
    };
    onUpdateDocument(updated);
    if (onShowToast) {
      onShowToast(`REPARACIÓN EN PROCESO. Empleado asignado: ${employeeName}`, 6000);
    }
  };

  const handleFinalizarReparacion = () => {
    if (!isCitaGreen) {
      if (onShowToast) onShowToast('No se puede operar en el taller si la recepción del vehículo no se ha confirmado en la parada Cita.', 4000);
      setConfirmToast({ stepName: 'Taller', message: 'Parada Taller bloqueada: debe confirmar la recepción del vehículo en la parada Cita primero.', isLocked: true });
      return;
    }

    const canManage = currentUser.role === 'boss' || currentUser.permissions?.manageWorkOrders !== false;
    if (!canManage) {
      if (onShowToast) onShowToast('No tiene permisos para finalizar órdenes de trabajo.');
      return;
    }

    const updated: GestarianDocument = {
      ...doc,
      tallerStatus: 'reparacion_finalizada',
      workOrderStatus: 'finalizada',
      facturacionStatus: 'facturar',
    };
    onUpdateDocument(updated);
    if (onShowToast) {
      onShowToast('Reparación finalizada por el operario/superior. Listo para facturar.');
    }
  };

  const handleFacturar = () => {
    // BLOQUEO SECUENCIAL: requiere taller finalizado
    if (!isTallerGreen) {
      if (onShowToast) onShowToast('La reparacion debe estar finalizada antes de generar la factura.', 4000);
      setConfirmToast({ stepName: 'Facturacion', message: 'Parada bloqueada: la reparacion no esta finalizada todavia. Finaliza los trabajos en el taller primero.', isLocked: true });
      return;
    }
    onGenerateInvoiceFromBudget(doc);
    if (onShowToast) {
      onShowToast('Factura generada y guardada con exito. Recuerde enviarla al cliente por WhatsApp o Email para activar el Cobro.', 6000);
    }
  };

  const handleSendBudgetViaEmail = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetEmail = client?.email || doc.clientEmail;
    if (!targetEmail) {
      if (onShowToast) onShowToast('No se encontró el email del cliente para este presupuesto.', 4000);
      return;
    }

    setIsSendingBudgetEmail(true);
    try {
      const effectiveBudget = budgetDoc || doc;
      const dispatchPayload = buildDocumentDispatchPayload(
        effectiveBudget,
        client || {
          id: doc.clientId || 'cli_1',
          name: doc.clientName,
          cif: doc.clientCif,
          email: targetEmail,
          phone: doc.clientPhone,
          address: doc.clientAddress,
        },
        currentUser,
        'email'
      );

      const result = await sendDocumentViaApi(dispatchPayload, effectiveBudget, currentUser);

      const nowIso = new Date().toISOString();
      const updatedBudget: GestarianDocument = {
        ...effectiveBudget,
        status: 'enviado',
        sentAt: nowIso,
      };
      onUpdateDocument(updatedBudget);

      // Persistir inmediatamente
      const currentStored = getStoredDocuments();
      const nextDocs = currentStored.map((d) => (d.id === updatedBudget.id ? updatedBudget : d));
      saveStoredDocuments(nextDocs);
      window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));

      // Registrar notificación en notificaciones.gestarian con documento en vista de impresión descargable
      const newNotif: InternalNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: `Presupuesto ${budgetNumberOnly} Enviado al Cliente`,
        message: `Presupuesto enviado a ${client?.name || doc.clientName} (${doc.vehiclePlate || 'Vehículo'}). Documento oficial adjunto en vista de impresión descargable desde notificaciones.gestarian.`,
        timestamp: nowIso,
        read: false,
        type: 'budget_sent_client',
        budgetId: updatedBudget.id,
        documentNumber: budgetNumberOnly,
        totalAmount: updatedBudget.total || effectiveBudget.total || doc.total || 0,
        attachmentType: 'presupuesto',
      };
      const storedNotifs = getStoredNotifications();
      saveStoredNotifications([newNotif, ...storedNotifs]);
      window.dispatchEvent(new CustomEvent('gestarian_notifications_updated'));

      const confirmMsg = `Presupuesto ${budgetNumberOnly} enviado por email a ${targetEmail} con el documento adjunto correctamente.`;
      if (onShowToast) {
        onShowToast(confirmMsg, 5000);
      }
      setConfirmToast({
        stepName: 'Presupuesto',
        message: confirmMsg,
        isLocked: false,
      });
    } catch (err: any) {
      console.error('Error enviando presupuesto por email:', err);
      if (onShowToast) onShowToast('Error al enviar el email del presupuesto.', 4000);
    } finally {
      setIsSendingBudgetEmail(false);
    }
  };

  const handleSendInvoiceViaWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetPhone = phoneClean || prompt('Introduzca el teléfono/móvil para enviar la factura por WhatsApp:', client?.phone || doc.clientPhone || '');
    if (!targetPhone) return;
    const clean = targetPhone.replace(/\D/g, '');
    const url = `https://wa.me/${clean.startsWith('34') ? clean : '34' + clean}?text=${encodeURIComponent(
      `Hola ${client?.name || doc.clientName}, le adjuntamos su factura oficial ${invoiceNumberOnly}. Puede consultarla y descargarla en el siguiente enlace: ${generateDocumentPdfUrl(invoiceDoc || doc)}`
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    const nowIso = new Date().toISOString();
    const updatedDoc: GestarianDocument = {
      ...doc,
      status: doc.type === 'factura' ? 'enviada' : doc.status,
      facturacionStatus: 'factura_enviada',
      isLocked: true,
      sentAt: nowIso,
      facturaSentAt: nowIso,
    };
    onUpdateDocument(updatedDoc);
    const dateFormatted = formatInvoiceSentDate(nowIso);
    if (onShowToast) {
      onShowToast(`Factura enviada por WhatsApp el ${dateFormatted}. Parada Facturación finalizada en verde y parada Cobro activada.`);
    }
  };

  const handleSendInvoiceViaEmail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetEmail = client?.email || doc.clientEmail || prompt('Introduzca el email del cliente para enviar la factura:');
    if (!targetEmail) return;
    const mailtoUrl = `mailto:${targetEmail}?subject=Factura%20${invoiceNumberOnly}&body=Estimado%20cliente,%20le%20adjuntamos%20su%20factura%20${invoiceNumberOnly}%20por%20importe%20de%20${(doc.total || 0).toFixed(2)}€.%20Puede%20consultarla%20aquí:%20${encodeURIComponent(generateDocumentPdfUrl(invoiceDoc || doc))}`;
    window.location.href = mailtoUrl;

    const nowIso = new Date().toISOString();
    const updatedDoc: GestarianDocument = {
      ...doc,
      status: doc.type === 'factura' ? 'enviada' : doc.status,
      facturacionStatus: 'factura_enviada',
      isLocked: true,
      sentAt: nowIso,
      facturaSentAt: nowIso,
    };
    onUpdateDocument(updatedDoc);
    const dateFormatted = formatInvoiceSentDate(nowIso);
    if (onShowToast) {
      onShowToast(`Factura enviada por Email el ${dateFormatted}. Parada Facturación finalizada en verde y parada Cobro activada.`);
    }
  };

  const createReceiptDocument = (
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    receiptNum: string
  ): GestarianDocument => {
    const totalDoc = doc.total || 0;
    const currentTotalPaid = (doc.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const remainingPending = Math.max(0, totalDoc - currentTotalPaid);

    return {
      id: `rec_${doc.id}_${Date.now()}`,
      number: receiptNum,
      series: '2026',
      type: 'recibo_abono' as any,
      date: paymentDate || new Date().toISOString().split('T')[0],
      dueDate: paymentDate || new Date().toISOString().split('T')[0],
      issuerId: currentUser.id,
      issuerName: currentUser.fullName || 'DM CAR',
      issuerCif: currentUser.cif,
      issuerAddress: currentUser.fiscalAddress,
      issuerPhone: currentUser.phone,
      issuerEmail: currentUser.email,
      clientId: client?.id || doc.clientId || 'cli_1',
      clientName: client?.name || doc.clientName || 'Cliente',
      clientCif: client?.cif || doc.clientCif || '',
      clientAddress: client?.fiscalAddress || client?.address || doc.clientAddress || '',
      clientPhone: client?.phone || doc.clientPhone || '',
      clientEmail: client?.email || doc.clientEmail || '',
      vehiclePlate: doc.vehiclePlate || '',
      vehicleBrand: doc.vehicleBrand || '',
      vehicleModel: doc.vehicleModel || '',
      expediente: doc.expediente,
      items: [
        {
          id: '1',
          description: `Recibo de abono parcial / entrega a cuenta para el expediente ${doc.expediente || doc.number} (${doc.vehiclePlate || 'Vehículo'}). Método: ${paymentMethod}.`,
          quantity: 1,
          unitPrice: paymentAmount,
          amount: paymentAmount,
        },
      ],
      subtotal: paymentAmount,
      applyIva: false,
      ivaRate: 0,
      ivaAmount: 0,
      applyIrpf: false,
      irpfRate: 0,
      irpfAmount: 0,
      total: paymentAmount,
      status: 'enviado',
      isLocked: true,
      notes: `Abono a cuenta registrado el ${paymentDate} mediante ${paymentMethod}.\nTotal presupuestado/facturado: ${totalDoc.toFixed(2)} €.\nTotal acumulado abonado: ${currentTotalPaid.toFixed(2)} €.\nSaldo pendiente restante: ${remainingPending.toFixed(2)} €.`,
    };
  };

  const persistReceiptDocument = (receiptDoc: GestarianDocument) => {
    try {
      const stored = getStoredDocuments();
      if (!stored.some((d) => d.number === receiptDoc.number)) {
        saveStoredDocuments([receiptDoc, ...stored]);
      }
    } catch (e) {
      console.error('Error saving receipt document:', e);
    }
  };

  const handleSendPartialReceiptViaWhatsApp = (
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    customReceiptNum?: string
  ) => {
    const cleanExpDigits = (doc.expediente || doc.number || 'E260001').replace(/\D/g, '').slice(-4).padStart(4, '0');
    const existingReceiptsCount = (allDocuments || []).filter(d => d.type === 'recibo_abono' && d.expediente === doc.expediente).length;
    const defaultNum = existingReceiptsCount > 0 ? `${existingReceiptsCount + 1}R26${cleanExpDigits}` : `R26${cleanExpDigits}`;
    const receiptNum = customReceiptNum || defaultNum;

    const receiptDoc = createReceiptDocument(paymentAmount, paymentDate, paymentMethod, receiptNum);
    persistReceiptDocument(receiptDoc);

    const totalDoc = doc.total || 0;
    const currentTotalPaid = (doc.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const remainingPending = Math.max(0, totalDoc - currentTotalPaid);

    const targetPhone = phoneClean || prompt('Introduzca el teléfono/móvil para enviar el recibo por WhatsApp:', client?.phone || doc.clientPhone || '');
    if (!targetPhone) return;
    const clean = targetPhone.replace(/\D/g, '');
    const receiptUrl = generateDocumentPdfUrl(receiptDoc);
    const plateText = doc.vehiclePlate ? ` [${doc.vehiclePlate}]` : '';
    const expText = doc.expediente ? ` (Expediente: ${doc.expediente})` : '';

    const text = `Hola ${client?.name || doc.clientName},\nLe confirmamos la recepción de su abono a cuenta por importe de *${paymentAmount.toFixed(2)} €*${expText}${plateText}.\n\n` +
      `• Número de Recibo: *${receiptNum}*\n` +
      `• Fecha: ${paymentDate}\n` +
      `• Método: ${paymentMethod}\n` +
      `• Total del presupuesto: ${totalDoc.toFixed(2)} €\n` +
      `• Total abonado hasta la fecha: ${currentTotalPaid.toFixed(2)} €\n` +
      `• Saldo pendiente restante: *${remainingPending.toFixed(2)} €*\n\n` +
      `Puede consultar y descargar su Recibo de Abono oficial en el siguiente enlace:\n${receiptUrl}`;

    const waUrl = `https://wa.me/${clean.startsWith('34') ? clean : '34' + clean}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (onShowToast) {
      onShowToast(`Recibo de abono parcial ${receiptNum} enviado por WhatsApp.`);
    }
  };

  const handleSendPartialReceiptViaEmail = (
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    customReceiptNum?: string
  ) => {
    const cleanExpDigits = (doc.expediente || doc.number || 'E260001').replace(/\D/g, '').slice(-4).padStart(4, '0');
    const existingReceiptsCount = (allDocuments || []).filter(d => d.type === 'recibo_abono' && d.expediente === doc.expediente).length;
    const defaultNum = existingReceiptsCount > 0 ? `${existingReceiptsCount + 1}R26${cleanExpDigits}` : `R26${cleanExpDigits}`;
    const receiptNum = customReceiptNum || defaultNum;

    const receiptDoc = createReceiptDocument(paymentAmount, paymentDate, paymentMethod, receiptNum);
    persistReceiptDocument(receiptDoc);

    const totalDoc = doc.total || 0;
    const currentTotalPaid = (doc.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const remainingPending = Math.max(0, totalDoc - currentTotalPaid);

    const targetEmail = client?.email || doc.clientEmail || prompt('Introduzca el email del cliente para enviar el recibo:');
    if (!targetEmail) return;

    const receiptUrl = generateDocumentPdfUrl(receiptDoc);
    const plateText = doc.vehiclePlate ? ` [${doc.vehiclePlate}]` : '';
    const subject = `Recibo de Abono Parcial ${receiptNum} - Expediente ${doc.expediente || ''}${plateText}`;
    const body = `Estimado/a ${client?.name || doc.clientName},\n\nLe confirmamos la recepción de su abono a cuenta por importe de ${paymentAmount.toFixed(2)} €.\n\n` +
      `Detalles del cobro registrado:\n` +
      `- Recibo Oficial: ${receiptNum}\n` +
      `- Expediente: ${doc.expediente || '-'}\n` +
      `- Vehículo: ${doc.vehiclePlate || '-'}\n` +
      `- Fecha de cobro: ${paymentDate}\n` +
      `- Método de pago: ${paymentMethod}\n` +
      `- Importe abonado: ${paymentAmount.toFixed(2)} €\n` +
      `- Total presupuestado/facturado: ${totalDoc.toFixed(2)} €\n` +
      `- Total cobrado acumulado: ${currentTotalPaid.toFixed(2)} €\n` +
      `- Saldo pendiente restante: ${remainingPending.toFixed(2)} €\n\n` +
      `Puede acceder y descargar su recibo oficial en el siguiente enlace:\n${receiptUrl}\n\n` +
      `Atentamente,\n${currentUser.fullName || 'DM CAR'}`;

    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (onShowToast) {
      onShowToast(`Recibo de abono parcial ${receiptNum} preparado para envío por Email.`);
    }
  };

  const handleViewReceipt = (
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    customReceiptNum?: string
  ) => {
    const cleanExpDigits = (doc.expediente || doc.number || 'E260001').replace(/\D/g, '').slice(-4).padStart(4, '0');
    const existingReceiptsCount = (allDocuments || []).filter(d => d.type === 'recibo_abono' && d.expediente === doc.expediente).length;
    const defaultNum = existingReceiptsCount > 0 ? `${existingReceiptsCount + 1}R26${cleanExpDigits}` : `R26${cleanExpDigits}`;
    const receiptNum = customReceiptNum || defaultNum;

    const receiptDoc = createReceiptDocument(paymentAmount, paymentDate, paymentMethod, receiptNum);
    persistReceiptDocument(receiptDoc);
    setViewerDoc(receiptDoc);
  };

  const handleSendInvoiceTotalViaWhatsApp = () => {
    try {
      const stored = getStoredDocuments();
      if (!stored.some((d) => d.number === invoiceDoc.number)) {
        saveStoredDocuments([invoiceDoc, ...stored]);
      }
    } catch (e) {
      console.error(e);
    }

    const targetPhone = phoneClean || prompt('Introduzca el teléfono/móvil para enviar la factura por WhatsApp:', client?.phone || doc.clientPhone || '');
    if (!targetPhone) return;
    const clean = targetPhone.replace(/\D/g, '');
    const invoiceUrl = generateDocumentPdfUrl(invoiceDoc || doc);
    const plateText = doc.vehiclePlate ? ` [${doc.vehiclePlate}]` : '';
    const expText = doc.expediente ? ` (Expediente: ${doc.expediente})` : '';

    const text = `Hola ${client?.name || doc.clientName},\nLe confirmamos que su expediente ${expText}${plateText} ha quedado *TOTALMENTE ABONADO Y LIQUIDADO* (Total: ${(doc.total || 0).toFixed(2)} €, Saldo pendiente: 0,00 €).\n\n` +
      `Le adjuntamos su *Factura Oficial ${invoiceNumberOnly}* con justificante de cobro total. Puede consultarla y descargarla en el siguiente enlace:\n${invoiceUrl}\n\n` +
      `Gracias por su confianza en nuestro taller.`;

    const waUrl = `https://wa.me/${clean.startsWith('34') ? clean : '34' + clean}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    const nowIso = new Date().toISOString();
    const updatedDoc: GestarianDocument = {
      ...doc,
      status: doc.type === 'factura' ? 'enviada' : doc.status,
      facturacionStatus: 'factura_enviada',
      cobroStatus: 'cobrado',
      isLocked: true,
      sentAt: nowIso,
      facturaSentAt: nowIso,
    };
    onUpdateDocument(updatedDoc);

    if (onShowToast) {
      onShowToast(`Factura ${invoiceNumberOnly} enviada por WhatsApp (Abono Total).`);
    }
  };

  const handleSendInvoiceTotalViaEmail = () => {
    try {
      const stored = getStoredDocuments();
      if (!stored.some((d) => d.number === invoiceDoc.number)) {
        saveStoredDocuments([invoiceDoc, ...stored]);
      }
    } catch (e) {
      console.error(e);
    }

    const targetEmail = client?.email || doc.clientEmail || prompt('Introduzca el email del cliente para enviar la factura:');
    if (!targetEmail) return;

    const invoiceUrl = generateDocumentPdfUrl(invoiceDoc || doc);
    const plateText = doc.vehiclePlate ? ` [${doc.vehiclePlate}]` : '';
    const subject = `Factura Oficial ${invoiceNumberOnly} (Totalmente Abonada) - Expediente ${doc.expediente || ''}${plateText}`;
    const body = `Estimado/a ${client?.name || doc.clientName},\n\nLe confirmamos que su expediente ${doc.expediente || ''}${plateText} ha quedado TOTALMENTE ABONADO Y LIQUIDADO por un importe total de ${(doc.total || 0).toFixed(2)} € (Saldo pendiente: 0,00 €).\n\n` +
      `Le adjuntamos el acceso a su Factura Oficial ${invoiceNumberOnly} con el justificante de liquidación:\n${invoiceUrl}\n\n` +
      `Agradecemos su confianza en nuestro taller.\n\nAtentamente,\n${currentUser.fullName || 'DM CAR'}`;

    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const nowIso = new Date().toISOString();
    const updatedDoc: GestarianDocument = {
      ...doc,
      status: doc.type === 'factura' ? 'enviada' : doc.status,
      facturacionStatus: 'factura_enviada',
      cobroStatus: 'cobrado',
      isLocked: true,
      sentAt: nowIso,
      facturaSentAt: nowIso,
    };
    onUpdateDocument(updatedDoc);

    if (onShowToast) {
      onShowToast(`Factura ${invoiceNumberOnly} preparada para envío por Email (Abono Total).`);
    }
  };

  const handleAddPayment = (amount: number, date: string, method: string) => {
    const newPayment = {
      id: `pay-${Date.now()}`,
      amount,
      date,
    };
    const updatedPayments = [...(doc.payments || []), newPayment];
    const total = doc.total || 0;
    const currentPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
    const isNowPaid = currentPaid >= (total - 0.001) && total > 0;

    const cleanExpDigits = (doc.expediente || doc.number || 'E260001').replace(/\D/g, '').slice(-4).padStart(4, '0');
    const existingReceiptsCount = (allDocuments || []).filter(d => d.type === 'recibo_abono' && d.expediente === doc.expediente).length;
    const receiptNum = existingReceiptsCount > 0 ? `${existingReceiptsCount + 1}R26${cleanExpDigits}` : `R26${cleanExpDigits}`;

    const updatedDoc: GestarianDocument = {
      ...doc,
      payments: updatedPayments,
      cobroStatus: isNowPaid ? 'cobrado' : 'parcial',
    };
    onUpdateDocument(updatedDoc);
    setNewPaymentAmount('');

    setLastAbonoFeedback({
      amount,
      date,
      method,
      isTotal: isNowPaid,
      receiptNum,
    });

    if (isNowPaid) {
      if (onShowToast) {
        onShowToast(`¡Abono total completado! Saldo de ${total.toFixed(2)} € 100% cobrado. Ya puede enviar la factura.`);
      }
    } else {
      if (onShowToast) {
        onShowToast(`Abono parcial de ${amount.toFixed(2)} € registrado. Ya puede enviar el recibo de abono parcial.`);
      }
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    const updatedPayments = (doc.payments || []).filter((p) => p.id !== paymentId);
    const updatedDoc: GestarianDocument = {
      ...doc,
      payments: updatedPayments,
    };
    onUpdateDocument(updatedDoc);
    if (onShowToast) {
      onShowToast('Registro de cobro eliminado.');
    }
  };

  const getBudgetSentDateTimeFormatted = () => {
    const raw = doc.sentAt || foundBudgetDoc?.sentAt || doc.date || doc.createdAt;
    if (!raw) {
      const now = new Date();
      return `${now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs`;
    }
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) {
        return raw;
      }
      const datePart = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${datePart} a las ${timePart} hs`;
    } catch {
      return raw;
    }
  };

  const handleStepCardClick = (stepId: string) => {
    switch (stepId) {
      case 'recepcion':
        setConfirmToast({
          stepName: 'Recepción',
          message: 'La recepción del vehículo y expediente ya está registrada y completada en verde.',
          isLocked: true,
        });
        break;

      case 'presupuesto':
        if (isBudgetAccepted) {
          setConfirmToast({
            stepName: 'Presupuesto',
            message: 'El presupuesto ya está en el estado final "Aceptado".',
            isLocked: true,
          });
        } else if (isBudgetSent || doc.status === 'enviado') {
          const sentDateStr = getBudgetSentDateTimeFormatted();
          setConfirmToast({
            isLocked: true,
            customContent: (
              <div className="flex flex-col items-center justify-center text-center py-3 px-2 space-y-1.5 w-full">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-blue-900 uppercase tracking-wide">
                  Presupuesto enviado
                </span>
                <span className="text-base sm:text-lg md:text-xl font-bold text-slate-700 font-mono">
                  el {sentDateStr}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-amber-700 uppercase tracking-wide">
                  Esperando respuesta
                </span>
              </div>
            ),
          });
        } else {
          setConfirmToast({
            stepName: 'Presupuesto',
            message: '¿Desea avanzar la parada "Presupuesto" al estado "Enviado al cliente"?',
            onConfirm: () => {
              const updated: GestarianDocument = {
                ...doc,
                status: 'enviado',
              };
              onUpdateDocument(updated);
              if (onShowToast) onShowToast('Presupuesto marcado como Enviado.');
            },
          });
        }
        break;

      case 'cita':
        if (!isPresupuestoGreen) {
          setConfirmToast({
            stepName: 'Cita',
            message: 'La parada "Cita" está en espera (gris). Para salir de espera, la parada anterior ("Presupuesto") debe estar finalizada en verde (Presupuesto Aceptado).',
            isLocked: true,
          });
        } else if (isCitaConfirmed) {
          setConfirmToast({
            stepName: 'Cita',
            message: 'La cita ya está en el estado final "Confirmada".',
            isLocked: true,
          });
        } else {
          setConfirmToast({
            stepName: 'Confirmar Llegada de Vehículo',
            message: '¿Desea confirmar la llegada del vehículo al taller para validar la recepción e iniciar la asignación de operario?',
            onConfirm: () => {
              handleConfirmCita();
            },
          });
        }
        break;

      case 'taller':
        if (!isCitaGreen) {
          setConfirmToast({
            stepName: 'Taller',
            message: 'La parada "Taller" está en espera (gris). Para salir de espera, la parada anterior ("Cita") debe estar finalizada en verde (Cita Confirmada).',
            isLocked: true,
          });
        } else if (isTallerFinalizado) {
          setConfirmToast({
            stepName: 'Taller',
            message: 'La reparación ya está en el estado final "Reparación Finalizada".',
            isLocked: true,
          });
        } else if (isTallerEnReparacion) {
          setConfirmToast({
            stepName: 'Taller',
            message: '¿Desea avanzar la parada "Taller" al estado "Reparación Finalizada"?',
            onConfirm: () => {
              handleFinalizarReparacion();
            },
          });
        } else {
          setConfirmToast({
            stepName: 'Taller',
            message: '¿Desea avanzar la parada "Taller" al estado "Enviar a Taller / En Reparación"?',
            onConfirm: () => {
              handleEnviarATaller();
            },
          });
        }
        break;

      case 'facturacion':
        if (!isTallerGreen) {
          setConfirmToast({
            stepName: 'Facturación',
            message: 'La parada "Facturación" está en espera (gris). Para salir de espera, la parada anterior ("Taller") debe estar finalizada en verde (Reparación Finalizada).',
            isLocked: true,
          });
        } else if (isFacturaGenerada) {
          setConfirmToast({
            stepName: 'Facturación',
            message: 'La factura oficial ya ha sido generada y confirmada.',
            isLocked: true,
          });
        } else {
          setConfirmToast({
            stepName: 'Facturación',
            message: '¿Desea avanzar la parada "Facturación" para "Confirmar y Emitir Factura Oficial"?',
            onConfirm: () => {
              handleFacturar();
            },
          });
        }
        break;

      case 'cobro':
        if (!isFacturacionGreen) {
          setConfirmToast({
            stepName: 'Cobro',
            message: 'La parada "Cobro" está desactivada. Se activará automáticamente cuando la parada "Facturación" muestre "FACTURA ENVIADA" con la fecha de envío debajo tras enviarse por WhatsApp o Email.',
            isLocked: true,
          });
        } else if (isPaid) {
          setConfirmToast({
            stepName: 'Cobro',
            message: 'El cobro ya se encuentra en el estado final "Cobrado Totalmente". Puede abrir el control de cobros para ver el historial.',
            onConfirm: () => setShowPaymentsControlModal(true),
          });
        } else {
          setShowPaymentsControlModal(true);
        }
        break;

      default:
        break;
    }
  };

  const steps = [
    {
      id: 'recepcion',
      name: 'Recepción',
      statusLabel: 'RECEPCIÓN REGISTRADA',
      badgeClass: 'bg-emerald-500 text-white font-bold',
      isClickable: false,
      hasExpandButton: true,
    },
    {
      id: 'presupuesto',
      name: 'Presupuesto',
      statusLabel: isBudgetAccepted 
        ? 'PRESUPUESTO ACEPTADO' 
        : isBudgetSent 
        ? 'PRESUPUESTO ENVIADO' 
        : isBudgetRejected 
        ? 'PRESUPUESTO RECHAZADO' 
        : 'PRESUPUESTO BORRADOR',
      badgeClass: isBudgetAccepted 
        ? 'bg-emerald-500 text-white font-black uppercase tracking-wider ring-2 ring-emerald-300' 
        : isBudgetSent 
        ? 'bg-blue-600 text-white font-bold' 
        : isBudgetRejected 
        ? 'bg-rose-600 text-white' 
        : 'bg-slate-400 text-white',
      isClickable: false,
      hasExpandButton: true,
    },
    {
      id: 'cita',
      name: 'Cita',
      statusLabel: !isPresupuestoGreen
        ? 'BLOQUEADA (PRESUPUESTO PENDIENTE)'
        : isCitaConfirmed
        ? 'CITA CONFIRMADA'
        : isCitaAccepted
        ? 'CITA ACEPTADA'
        : isBudgetSent
        ? 'CITA PROPUESTA'
        : 'PENDIENTE DE CITA',
      badgeClass: !isPresupuestoGreen
        ? 'bg-slate-400 text-slate-100 font-medium'
        : isCitaConfirmed 
        ? 'bg-emerald-500 text-white font-bold' 
        : isCitaAccepted 
        ? 'bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-md transform hover:scale-105' 
        : 'bg-slate-200 text-slate-500 font-medium',
      isClickable: isPresupuestoGreen && !isCitaConfirmed && isCitaAccepted,
      onClick: handleConfirmCita,
      tooltip: 'Pulsar cuando el cliente entregue el vehículo el día acordado',
      hasExpandButton: true,
    },
    {
      id: 'taller',
      name: 'Taller',
      statusLabel: !isCitaGreen
        ? 'BLOQUEADO (CONFIRMAR RECEPCIÓN EN CITA)'
        : isTallerFinalizado 
        ? 'REPARACIÓN FINALIZADA' 
        : isTallerEnReparacion 
        ? 'REPARACIÓN EN PROCESO' 
        : 'ENVIAR A TALLER',
      badgeClass: !isCitaGreen
        ? 'bg-slate-400 text-slate-100 font-medium'
        : isTallerFinalizado 
        ? 'bg-emerald-500 text-white font-bold' 
        : isTallerEnReparacion 
        ? 'bg-blue-600 text-white font-black uppercase' 
        : 'bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer shadow-md transform hover:scale-105',
      isClickable: isCitaGreen && !isTallerEnReparacion && !isTallerFinalizado,
      onClick: handleEnviarATaller,
      tooltip: 'Pulsar para enviar el vehículo al taller e iniciar reparación',
      hasExpandButton: true,
    },
    {
      id: 'facturacion',
      name: 'Facturación',
      statusLabel: !isTallerGreen
        ? 'BLOQUEADA (FINALIZAR TALLER)'
        : isFacturaEnviada 
        ? 'FACTURA ENVIADA' 
        : isFacturaGenerada 
        ? 'FACTURA GENERADA' 
        : canInvoice 
        ? 'FACTURAR' 
        : 'FACTURACIÓN PENDIENTE',
      badgeClass: !isTallerGreen
        ? 'bg-slate-400 text-slate-100 font-medium'
        : isFacturaEnviada 
        ? 'bg-emerald-500 text-white font-bold' 
        : isFacturaGenerada 
        ? 'bg-blue-600 text-white font-bold' 
        : canInvoice 
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase cursor-pointer shadow-lg transform hover:scale-105 ring-2 ring-emerald-300' 
        : 'bg-slate-200 text-slate-500 font-medium',
      isClickable: isTallerGreen && canInvoice,
      onClick: handleFacturar,
      tooltip: 'Pulsar para generar la factura',
      hasExpandButton: true,
    },
    {
      id: 'cobro',
      name: 'Cobro',
      statusLabel: !isFacturacionGreen 
        ? 'BLOQUEADO (ENVIAR FACTURA)' 
        : isPaid 
        ? 'COBRADO TOTALMENTE' 
        : isPartiallyPaid 
        ? 'COBRO PARCIAL' 
        : 'PENDIENTE DE COBRO',
      badgeClass: !isFacturacionGreen 
        ? 'bg-slate-400 text-slate-100 font-medium' 
        : isPaid 
        ? 'bg-emerald-500 text-white font-bold cursor-pointer hover:bg-emerald-600 shadow-sm' 
        : isPartiallyPaid 
        ? 'bg-sky-500 text-white font-bold cursor-pointer hover:bg-sky-600 shadow-sm' 
        : 'bg-[#0F2942] hover:bg-[#1E3A8A] text-white font-bold cursor-pointer shadow-md transform hover:scale-105',
      isClickable: isFacturacionGreen,
      onClick: () => {
        if (!isFacturacionGreen) {
          setConfirmToast({
            stepName: 'Cobro',
            message: 'La parada "Cobro" está desactivada. Se activará automáticamente cuando la parada "Facturación" muestre "FACTURA ENVIADA" tras enviarse por WhatsApp o Email.',
            isLocked: true,
          });
        } else {
          setShowPaymentsControlModal(true);
        }
      },
      hasExpandButton: false,
    },
  ];

  let currentStepIdx = 0;
  if (isBudgetSent || isBudgetAccepted) currentStepIdx = 1;
  if (isCitaAccepted || isCitaConfirmed) currentStepIdx = 2;
  if (isTallerEnReparacion || isTallerEnviar) currentStepIdx = 3;
  if (isTallerFinalizado || canInvoice || isFacturaGenerada) currentStepIdx = 4;
  if (isPaid) currentStepIdx = 5;

  const formatTimestamp = (isoStr?: string) => {
    if (!isoStr) return 'No registrada';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const datePart = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${datePart} a las ${timePart} hs`;
    } catch {
      return isoStr;
    }
  };

  const renderExpandedContent = (stepId: string) => {
    switch (stepId) {
      case 'recepcion': {
        const hasClientSolicitud = Boolean(matchingSolicitud && matchingSolicitud.description && matchingSolicitud.description.trim().length > 0);
        const displayedDescription = (hasClientSolicitud && !doc.notes) ? matchingSolicitud!.description : (receptionNotes || doc.notes || (hasClientSolicitud ? matchingSolicitud!.description : ''));

        return (
          <div className="w-full space-y-6 text-base">
            {/* Datos Vehículo y Cliente sin recuadros a todo el ancho */}
            <div className="flex flex-wrap items-start justify-between gap-6 py-3 border-b-2 border-slate-200 w-full">
              {/* Vehículo: Marca y Modelo (Tamaño x2, sin matrícula) */}
              <div className="space-y-1">
                <span className="text-slate-500 font-bold block uppercase text-base sm:text-xl tracking-wider">
                  Vehículo:
                </span>
                <div className="font-black text-slate-900 text-3xl sm:text-5xl uppercase tracking-tight">
                  {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehicleType || 'Vehículo Registrado'}
                </div>
              </div>

              {/* Cliente: Label x2, Nombre x1.5 */}
              <div className="space-y-1 sm:text-right">
                <span className="text-slate-500 font-bold block uppercase text-base sm:text-xl tracking-wider">
                  Cliente:
                </span>
                <div className="font-black text-slate-900 text-2xl sm:text-3xl">
                  {client?.name || doc.clientName || 'Cliente sin especificar'}
                </div>
              </div>
            </div>

            {/* Descripción / Descripción del Cliente con textos aumentados por 1,5 */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-700 font-bold uppercase text-base sm:text-xl tracking-wider">
                  {hasClientSolicitud ? 'Descripción del Cliente:' : 'Descripción:'}
                </span>
                {hasClientSolicitud && (
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Volcado automático desde Área de Clientes
                  </span>
                )}
              </div>

              {hasClientSolicitud ? (
                /* Volcado de datos de la descripción del cliente */
                <textarea
                  value={displayedDescription}
                  onChange={(e) => setReceptionNotes(e.target.value)}
                  onBlur={handleSaveReceptionNotes}
                  rows={3}
                  placeholder="Descripción añadida por el cliente desde su solicitud..."
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-300 rounded-xl text-lg sm:text-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed font-medium"
                />
              ) : (
                /* Input para que nosotros rellenemos los datos cuando no hay solicitud previa */
                <textarea
                  value={receptionNotes}
                  onChange={(e) => setReceptionNotes(e.target.value)}
                  onBlur={handleSaveReceptionNotes}
                  rows={3}
                  placeholder="Escriba la descripción de la avería o trabajo a realizar..."
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-300 rounded-xl text-lg sm:text-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed font-medium"
                />
              )}
            </div>

            {/* Botón de imágenes flotante, sin relleno, sin envoltorio, del mismo tamaño que los iconos que hay en presupuestos */}
            <div className="flex items-center justify-center pt-4 border-t border-slate-200 w-full">
              <button
                type="button"
                onClick={() => setShowImagesModal(true)}
                className="relative p-1 bg-transparent hover:opacity-80 text-amber-600 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                title={`Ver imágenes del expediente (${combinedVehicleImages.length}) / Subir más imágenes`}
              >
                <ImageIcon className="w-10 h-10 stroke-[2.2]" />
                {combinedVehicleImages.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full shadow-xs">
                    {combinedVehicleImages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        );
      }

      case 'presupuesto': {
        const budgetTotal = doc.total || budgetDoc?.total || 0;
        const budgetSubtotal = doc.subtotal || budgetDoc?.subtotal || (budgetTotal > 0 ? (budgetTotal / 1.21) : 0);
        const budgetTax = Math.max(0, budgetTotal - budgetSubtotal);

        const expNumberDisplay = doc.expediente || budgetDoc?.expediente || getExpedienteFromDocNumber(budgetNumberOnly);

        const singleLineDeliveryDateStr = (() => {
          const dateVal = doc.proposedDeliveryDate || doc.vehicleDeliveryDate || budgetDoc?.proposedDeliveryDate || budgetDoc?.vehicleDeliveryDate;
          const timeVal = doc.proposedDeliveryTime || doc.vehicleDeliveryTime || budgetDoc?.proposedDeliveryTime || budgetDoc?.vehicleDeliveryTime;
          if (!dateVal) return '';

          let cleanDate = dateVal.trim();
          let extractedTime = '';

          // Extraer cualquier hora HH:MM embebida en la fecha (ej: "2026-10-11 10:30" o "11/10/26 a las 10:30")
          const timeInDateMatch = cleanDate.match(/(\d{2}:\d{2})/);
          if (timeInDateMatch) {
            extractedTime = timeInDateMatch[1];
          }
          cleanDate = cleanDate.replace(/\s*(a\s+las|A\s+LAS)?\s*\d{2}:\d{2}(:\d{2})?/gi, '').trim();

          const finalTime = timeVal?.trim() || extractedTime || '10:00';

          let dd = '', mm = '', yy = '';

          // Formato ISO: YYYY-MM-DD
          const isoMatch = cleanDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (isoMatch) {
            yy = isoMatch[1].slice(-2);
            mm = isoMatch[2].padStart(2, '0');
            dd = isoMatch[3].padStart(2, '0');
          } else {
            // Formato Español: DD/MM/YYYY o DD-MM-YYYY
            const esMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (esMatch) {
              dd = esMatch[1].padStart(2, '0');
              mm = esMatch[2].padStart(2, '0');
              yy = esMatch[3].slice(-2);
            } else {
              try {
                const d = new Date(cleanDate);
                if (!isNaN(d.getTime())) {
                  dd = String(d.getDate()).padStart(2, '0');
                  mm = String(d.getMonth() + 1).padStart(2, '0');
                  yy = String(d.getFullYear()).slice(-2);
                }
              } catch {
                // Fallback
              }
            }
          }

          if (!dd || !mm || !yy) {
            return cleanDate + (finalTime ? ` a las ${finalTime}` : '');
          }

          return `${dd}/${mm}/${yy} a las ${finalTime}`;
        })();

        const getFormattedSentNoticeStr = () => {
          const sentIso = doc.sentAt || budgetDoc?.sentAt || (doc.type === 'presupuesto' && doc.status === 'enviado' ? doc.updatedAt || doc.date : undefined);
          if (!sentIso) {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yy = String(now.getFullYear()).slice(-2);
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            return `${dd}/${mm}/${yy} A LAS ${hh}:${min}`;
          }
          try {
            const d = new Date(sentIso);
            if (isNaN(d.getTime())) return sentIso;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${dd}/${mm}/${yy} A LAS ${hh}:${min}`;
          } catch {
            return sentIso;
          }
        };

        return (
          <div className="space-y-5 w-full">
            {/* Banner de fecha propuesta por el cliente */}
            {isClientProposedPending && (
              <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 shadow-lg my-3 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-amber-900 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
                  <Calendar className="w-5 h-5 text-amber-600 animate-bounce" />
                  <span>NUEVA FECHA DE ENTREGA PROPUESTA POR EL CLIENTE DESDE EL ÁREA DE CLIENTE</span>
                </div>
                <div className="text-3xl sm:text-5xl font-black text-amber-700 font-mono tracking-tight my-3 flex items-center justify-center gap-3 flex-wrap">
                    <span>{doc.proposedDeliveryDate || doc.vehicleDeliveryDate}</span>
                    {(doc.proposedDeliveryTime || doc.vehicleDeliveryTime) && (
                      <span className="text-2xl sm:text-4xl text-amber-800 font-bold inline-flex items-center gap-1.5 bg-amber-100/80 px-3 py-1 rounded-xl border border-amber-300">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
                        {doc.proposedDeliveryTime || doc.vehicleDeliveryTime}
                      </span>
                    )}
                  </div>
                <p className="text-xs text-amber-900 mb-4 font-medium max-w-xl mx-auto">
                  El cliente ha solicitado esta fecha de entrega. Si pulsa Aceptar, la cita quedará confirmada y la parada Cita del roadmap pasará a Azul. Si pulsa Denegar, se abrirá el calendario para proponer una nueva fecha de entrega al cliente.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleAcceptProposedDate}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Aceptar Fecha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCounterProposalDate(doc.proposedDeliveryDate || doc.vehicleDeliveryDate || new Date().toISOString().split('T')[0]);
                      setShowDenyCalendarModal(true);
                    }}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Denegar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contenido del presupuesto directamente a todo el ancho de la tarjeta principal */}
            <div className="w-full space-y-4 text-base">
              {/* LÍNEA 1 ARRIBA: Número de Presupuesto y Número de Expediente en una sola línea sin solapamiento */}
              <div className="flex items-center justify-between w-full border-b-2 border-slate-200 pb-2.5 gap-3">
                <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 truncate">
                  {budgetNumberOnly}
                </span>
                <span className="text-lg sm:text-2xl font-black font-mono text-blue-900 text-right truncate">
                  {expNumberDisplay}
                </span>
              </div>

              {/* LÍNEA 2 DEBAJO: ENTREGA en una sola línea con envoltorio al ancho completo e incluyendo ENTREGA: y fecha y hora */}
              <div className="w-full border-b-2 border-slate-200 pb-3">
                {!rawDeliveryDate ? (
                  <button
                    type="button"
                    onClick={() => setIsDeliveryDatePickerOpen(true)}
                    className="w-full px-4 py-2.5 bg-white hover:bg-orange-50 active:bg-orange-100 text-orange-600 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-2 border-orange-500 cursor-pointer flex items-center justify-between transition-colors shadow-xs"
                    title="PROPONER FECHA DE ENTREGA"
                  >
                    <span>PROPONER FECHA DE ENTREGA</span>
                    <Calendar className="w-4 h-4 text-orange-500 shrink-0 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDeliveryDatePickerOpen(true)}
                    className="w-full px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-2 border-orange-400 cursor-pointer flex items-center justify-between shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                    title="Pulsar para modificar la fecha de entrega propuesta"
                  >
                    <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs sm:text-sm min-w-0">
                      <span className="text-orange-950 font-black shrink-0">ENTREGA:</span>
                      <span className="font-mono font-black text-slate-900 truncate">
                        {singleLineDeliveryDateStr || deliveryDateDisplay}
                      </span>
                    </div>
                    <Edit3 className="w-4 h-4 text-orange-600 shrink-0 ml-1" />
                  </button>
                )}
              </div>

              {/* Datos Cliente y Vehículo sin recuadros ni envoltorios a todo el ancho (tamaño x0.8) */}
              <div className="flex flex-wrap items-start justify-between gap-4 py-2.5 border-b-2 border-slate-200 w-full">
                {/* Cliente: Label y únicamente Nombre */}
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-bold block uppercase text-xs sm:text-sm tracking-wider">
                    Cliente:
                  </span>
                  <div className="font-black text-slate-900 text-xl sm:text-2xl">
                    {client?.name || doc.clientName || 'Cliente sin especificar'}
                  </div>
                </div>

                {/* Vehículo: Label y únicamente Marca y Modelo (sin matrícula) */}
                <div className="space-y-0.5 sm:text-right">
                  <span className="text-slate-500 font-bold block uppercase text-xs sm:text-sm tracking-wider">
                    Vehículo:
                  </span>
                  <div className="font-black text-slate-900 text-xl sm:text-2xl uppercase tracking-tight">
                    {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehicleType || '-'}
                  </div>
                </div>
              </div>

              {/* Partidas / Conceptos */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 border-b-2 border-slate-200 pb-2 flex justify-between uppercase tracking-wider text-base sm:text-lg">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                {doc.items && doc.items.length > 0 ? (
                  doc.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-slate-800 py-2.5 border-b border-slate-100 last:border-0 text-base sm:text-lg">
                      <span className="truncate pr-4 font-medium">{it.description}</span>
                      <span className="font-bold font-mono whitespace-nowrap text-slate-900">{(Number(it.amount) || 0).toFixed(2)} €</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic py-3 text-base">Sin partidas especificadas.</div>
                )}
              </div>

              {/* Totales Financieros: Base Imponible, IVA y Total */}
              <div className="pt-4 border-t-2 border-slate-200 flex flex-col items-end gap-2 text-base">
                <div className="flex justify-between w-full sm:max-w-md text-slate-700 py-1">
                  <span className="font-bold uppercase text-sm sm:text-base">Base Imponible:</span>
                  <span className="font-mono font-bold text-slate-900 text-lg sm:text-xl">{budgetSubtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between w-full sm:max-w-md text-slate-700 py-1">
                  <span className="font-bold uppercase text-sm sm:text-base">IVA (21%):</span>
                  <span className="font-mono font-bold text-slate-900 text-lg sm:text-xl">{budgetTax.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between w-full sm:max-w-md pt-2.5 border-t-2 border-slate-400">
                  <span className="font-black text-slate-900 uppercase text-lg sm:text-xl">Total:</span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-amber-700">{budgetTotal.toFixed(2)} €</span>
                </div>
              </div>

              {/* Recuadro Verde de Presupuesto Enviado (después del Total y antes de los iconos) */}
              {isBudgetSent && (
                <div className="w-full bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-3.5 rounded-2xl text-center my-2 shadow-xs">
                  <div className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      ENVIADO EL {getFormattedSentNoticeStr()} POR EMAIL/WHATSAPP
                    </span>
                  </div>
                </div>
              )}

              {/* Iconos de acción en una misma línea, sin envoltorio, sin relleno y a tamaño x2 */}
              <div className="flex flex-row items-center justify-center gap-8 sm:gap-12 pt-4 border-t border-slate-200 w-full">
                {/* Icono Ojo flotante (Ver Hoja A4 Completa) */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(budgetDoc)}
                  className="p-1 bg-transparent hover:opacity-80 text-amber-600 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                  title="Ver Hoja A4 Completa"
                >
                  <Eye className="w-10 h-10 stroke-[2.2]" />
                </button>

                {/* Icono WhatsApp flotante */}
                {phoneClean ? (
                  <a
                    href={`https://wa.me/${phoneClean.startsWith('34') ? phoneClean : '34' + phoneClean}?text=${encodeURIComponent(
                      `*${currentUser.fullName || 'Taller'}*\n\n` +
                      `Estimado/a ${client?.name || doc.clientName},\n` +
                      `Le remitimos su Presupuesto *${budgetNumberOnly}* por importe de *${budgetTotal.toFixed(2)} €*.\n\n` +
                      `📄 *Documento oficial adjunto en vista de impresión descargable:*\n` +
                      `https://notificaciones.gestarian/d/${encodeURIComponent(budgetNumberOnly)}\n\n` +
                      `Gracias por su confianza.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const nowIso = new Date().toISOString();
                      const updatedBudget: GestarianDocument = {
                        ...(budgetDoc || doc),
                        status: 'enviado',
                        sentAt: nowIso,
                      };
                      onUpdateDocument(updatedBudget);
                      const currentStored = getStoredDocuments();
                      const nextDocs = currentStored.map((d) => (d.id === updatedBudget.id ? updatedBudget : d));
                      saveStoredDocuments(nextDocs);
                      window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));

                      // Registrar notificación en notificaciones.gestarian con documento en vista de impresión descargable
                      const newNotif: InternalNotification = {
                        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        title: `Presupuesto ${budgetNumberOnly} Enviado al Cliente`,
                        message: `Presupuesto enviado a ${client?.name || doc.clientName} (${doc.vehiclePlate || 'Vehículo'}). Documento oficial adjunto en vista de impresión descargable desde notificaciones.gestarian.`,
                        timestamp: nowIso,
                        read: false,
                        type: 'budget_sent_client',
                        budgetId: updatedBudget.id,
                        documentNumber: budgetNumberOnly,
                        totalAmount: budgetTotal,
                        attachmentType: 'presupuesto',
                      };
                      const storedNotifs = getStoredNotifications();
                      saveStoredNotifications([newNotif, ...storedNotifs]);
                      window.dispatchEvent(new CustomEvent('gestarian_notifications_updated'));

                      if (onShowToast) onShowToast(`Presupuesto ${budgetNumberOnly} preparado para WhatsApp con documento adjunto en vista de impresión.`, 4000);
                    }}
                    className="p-1 bg-transparent hover:opacity-80 text-emerald-600 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="w-10 h-10 stroke-[2.2]" />
                  </a>
                ) : null}

                {/* Icono Email flotante */}
                {(client?.email || doc.clientEmail) ? (
                  <button
                    type="button"
                    disabled={isSendingBudgetEmail}
                    onClick={handleSendBudgetViaEmail}
                    className="p-1 bg-transparent hover:opacity-80 text-blue-600 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
                    title="Enviar por Email Directo"
                  >
                    {isSendingBudgetEmail ? (
                      <Loader2 className="w-10 h-10 animate-spin stroke-[2.2]" />
                    ) : (
                      <Mail className="w-10 h-10 stroke-[2.2]" />
                    )}
                  </button>
                ) : null}

                {/* Icono Imprimir flotante */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(budgetDoc)}
                  className="p-1 bg-transparent hover:opacity-80 text-slate-700 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                  title="Imprimir / Guardar"
                >
                  <Printer className="w-10 h-10 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>
        );
      }

      case 'cita': {
        const vehicleText = [doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehicleType || '-';
        const clientNameText = client?.name || doc.clientName || 'Cliente sin especificar';
        const appointmentDate = doc.proposedDeliveryDate || doc.vehicleDeliveryDate || doc.date || 'Fecha no fijada';
        const appointmentTime = doc.proposedDeliveryTime || doc.vehicleDeliveryTime;
        const appointmentDateTimeStr = appointmentTime ? `${appointmentDate} (${appointmentTime} hs)` : appointmentDate;
        
        const proposedByText = doc.deliveryDateProposedBy === 'client' 
          ? `Cliente (${client?.name || doc.clientName || 'Cliente'})` 
          : (doc.issuerName || 'Taller Gestarian (Usuario)');
        
        const hasClientProposedDifferentDate = Boolean(
          (doc.deliveryDateProposedBy === 'client') || 
          (doc.proposedDeliveryDate && doc.vehicleDeliveryDate && doc.proposedDeliveryDate !== doc.vehicleDeliveryDate) ||
          isClientProposedPending
        );

        return (
          <div className="w-full space-y-6 text-base">
            {!isPresupuestoGreen && (
              <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-4 text-center text-amber-900 font-bold flex items-center justify-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Parada Cita en espera: Se activará cuando la parada anterior (Presupuesto) esté aceptada en verde.</span>
              </div>
            )}

            {/* Banner de aviso si el cliente ha propuesto una cita diferente a la del usuario */}
            {isClientProposedPending && (
              <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 shadow-md text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-amber-900 text-sm sm:text-base font-black uppercase tracking-wider mb-1">
                  <Calendar className="w-6 h-6 text-amber-600 animate-bounce" />
                  <span>EL CLIENTE HA PROPUESTO UNA CITA DIFERENTE</span>
                </div>
                <div className="text-3xl sm:text-5xl font-black text-amber-700 font-mono tracking-tight my-3 flex items-center justify-center gap-3 flex-wrap">
                  <span>{doc.proposedDeliveryDate || doc.vehicleDeliveryDate}</span>
                  {(doc.proposedDeliveryTime || doc.vehicleDeliveryTime) && (
                    <span className="text-2xl sm:text-4xl text-amber-800 font-bold inline-flex items-center gap-2 bg-amber-100/80 px-3 py-1 rounded-xl border border-amber-300">
                      <Clock className="w-7 h-7 text-amber-600" />
                      {doc.proposedDeliveryTime || doc.vehicleDeliveryTime}
                    </span>
                  )}
                </div>
                <p className="text-sm text-amber-900 mb-4 font-medium max-w-xl mx-auto">
                  El cliente ha solicitado una cita diferente a la propuesta por el usuario. Puede <strong>Aceptar Fecha</strong> para confirmarla o <strong>Denegar</strong> para enviar otra alternativa.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleAcceptProposedDate}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Aceptar Fecha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCounterProposalDate(doc.proposedDeliveryDate || doc.vehicleDeliveryDate || new Date().toISOString().split('T')[0]);
                      setShowDenyCalendarModal(true);
                    }}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Denegar / Proponer Otra</span>
                  </button>
                </div>
              </div>
            )}

            {/* Fila 1: Vehículo y Titular sin recuadros a todo el ancho */}
            <div className="flex flex-wrap items-start justify-between gap-6 py-3 border-b-2 border-slate-200 w-full">
              {/* Vehículo: Label x2, Marca y Modelo */}
              <div className="space-y-1">
                <span className="text-slate-500 font-bold block uppercase text-base sm:text-xl tracking-wider">
                  Vehículo:
                </span>
                <div className="font-black text-slate-900 text-2xl sm:text-3xl uppercase tracking-tight">
                  {vehicleText}
                </div>
              </div>

              {/* Titular: Label x2, Nombre del Titular */}
              <div className="space-y-1 sm:text-right">
                <span className="text-slate-500 font-bold block uppercase text-base sm:text-xl tracking-wider">
                  Titular:
                </span>
                <div className="font-black text-slate-900 text-2xl sm:text-3xl">
                  {clientNameText}
                </div>
              </div>
            </div>

            {/* Fila 2: Fecha de la Cita y Quién la ha propuesto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-3 border-b-2 border-slate-200 w-full">
              {/* Fecha de la Cita: Label x2, Fecha en tamaño actual */}
              <div className="space-y-1">
                <span className="text-slate-500 font-bold block uppercase text-base sm:text-xl tracking-wider">
                  Fecha de la Cita:
                </span>
                <div className="text-base sm:text-lg font-bold font-mono text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>{appointmentDateTimeStr}</span>
                </div>
              </div>

              {/* Cita Propuesta Por: Label x2, Línea de quién ha propuesto con tamaño actual */}
              <div className="space-y-1 sm:text-right">
                <span className="text-slate-500 font-bold block uppercase text-base sm:text-xl tracking-wider">
                  Cita Propuesta Por:
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 flex items-center sm:justify-end gap-2">
                  <User className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>{proposedByText}</span>
                </div>
                {hasClientProposedDifferentDate && (
                  <div className="text-xs sm:text-sm font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg inline-block mt-1">
                    ⚠️ El cliente ha propuesto una cita diferente
                  </div>
                )}
              </div>
            </div>

            {/* Estado de la Cita: Centrado sin la palabra Estado antes */}
            <div className="flex flex-col items-center justify-center text-center py-2 border-b-2 border-slate-200 w-full">
              <span className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-black text-base sm:text-xl uppercase tracking-wide shadow-2xs ${
                isCitaConfirmed 
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400' 
                  : isCitaAccepted 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400' 
                  : 'bg-amber-100 text-amber-800 border-2 border-amber-400'
              }`}>
                {isCitaConfirmed ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>Cita Confirmada</span>
                  </>
                ) : isCitaAccepted ? (
                  <>
                    <Check className="w-6 h-6 text-blue-600" />
                    <span>Cita Aceptada</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-amber-600" />
                    <span>Pendiente de Aceptación</span>
                  </>
                )}
              </span>
            </div>

            {/* Acciones al pie: Botón Modificar a tamaño por dos (solo si NO está confirmada) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 pt-2">
              {!isCitaConfirmed && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeliveryDatePickerOpen(true);
                  }}
                  className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg sm:text-xl rounded-xl transition-all cursor-pointer flex items-center gap-2.5 shadow-xs hover:scale-105 active:scale-95"
                >
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  <span>Modificar Fecha de Entrega</span>
                </button>
              )}

              {!isCitaConfirmed && isCitaAccepted && (
                <button
                  type="button"
                  onClick={handleConfirmCita}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                >
                  <Check className="w-5 h-5" />
                  <span>Confirmar Recepción de Vehículo</span>
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'taller':
        return (
          <div className="space-y-4 text-sm text-slate-700">
            {!isCitaGreen && (
              <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-4 text-center text-amber-900 font-bold flex items-center justify-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Parada Taller bloqueada: No se puede enviar a taller si no se ha confirmado la recepción del vehículo en la parada Cita.</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-[#0F2942] font-black text-base uppercase tracking-wide">
                <Wrench className="w-5 h-5 text-orange-600" />
                <span>Datos de Reparación y Taller</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                  Entrada: {doc.date || doc.createdAt?.split('T')[0] || 'No registrada'}
                </span>
              </div>
            </div>

            {/* Operarios */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Operario Activo en la Reparación
                </span>
                {assignedEmployee ? (
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{assignedEmployee.name}</span>
                    {assignedEmployee.profession && <span className="text-xs text-slate-500">({assignedEmployee.profession})</span>}
                  </div>
                ) : doc.createdByName ? (
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{doc.createdByName}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">Sin operario asignado actualmente</span>
                )}
              </div>

              <div className="flex justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignEmployeeModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{assignedEmployee || doc.createdByName ? 'Cambiar Operario' : 'Asignar Empleado'}</span>
                </button>
              </div>

              {creatorEmployee && creatorEmployee.id !== doc.assignedEmployeeId && (
                <div className="md:col-span-2 border-t border-slate-200 pt-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Operario Anterior / Creador OT
                  </span>
                  <div className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{creatorEmployee.name}</span>
                    {creatorEmployee.profession && <span className="text-xs text-slate-500">({creatorEmployee.profession})</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Descripción de Trabajos */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Descripción de los Trabajos a Realizar
              </span>
              {doc.items && doc.items.length > 0 ? (
                <div className="space-y-1.5">
                  {doc.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{it.description}</span>
                      {it.quantity > 0 && <span className="text-slate-500">Cant: {it.quantity}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Sin tareas descritas en la orden de trabajo.</div>
              )}
            </div>

            {/* Observaciones y Comentarios rellenados por el usuario */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block uppercase tracking-wider">Observaciones y Comentarios de la Orden de Trabajo:</span>
              <p className="whitespace-pre-line text-slate-800 font-medium">{doc.notes || 'Sin observaciones o comentarios adicionales.'}</p>
            </div>

            {/* Acciones e Icono de Imágenes */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowImagesModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Imágenes del Expediente ({doc.vehicleImages?.length || 0})</span>
              </button>

              {!isTallerEnReparacion && !isTallerFinalizado && isTallerEnviar && (
                <button
                  type="button"
                  onClick={handleEnviarATaller}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Iniciar Reparación en Taller</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );

      case 'facturacion': {
        const invoiceSubtotal = doc.subtotal || (doc.items && doc.items.length > 0 ? doc.items.reduce((sum, it) => sum + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)), 0) : (doc.total ? doc.total / 1.21 : 0));
        const invoiceTotal = doc.total || (invoiceSubtotal * 1.21);
        const invoiceTax = Math.max(0, invoiceTotal - invoiceSubtotal);

        return (
          <div className="space-y-5 w-full">
            {!isTallerGreen && (
              <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-4 text-center text-amber-900 font-bold flex items-center justify-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Parada Facturación bloqueada: Se activará cuando la parada anterior (Taller) esté finalizada en verde.</span>
              </div>
            )}
            {/* Contenido de la factura directamente a todo el ancho de la tarjeta principal con textos ampliados x1.5 */}
            <div className="w-full space-y-6 text-base">
              {/* Línea Superior: Empresa emisora (Izquierda) y Número de Factura (Derecha, sin palabra factura) */}
              <div className="flex justify-between items-center border-b-2 border-slate-200 pb-4">
                <div>
                  <div className="font-black text-2xl sm:text-3xl text-slate-900">{doc.issuerName || 'TALLER GESTARIAN'}</div>
                  <div className="text-base sm:text-lg text-slate-500 font-mono mt-0.5">CIF: {doc.issuerCif || 'B-12345678'}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900">{invoiceNumberOnly}</div>
                </div>
              </div>

              {/* Datos Cliente y Vehículo sin recuadros ni envoltorios a todo el ancho */}
              <div className="flex flex-wrap items-start justify-between gap-6 py-3 border-b-2 border-slate-200 w-full">
                {/* Cliente */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block uppercase text-xs sm:text-sm tracking-wider">Cliente:</span>
                  <div className="font-bold text-slate-900 text-xl sm:text-2xl">{client?.name || doc.clientName || 'Cliente'}</div>
                  {(client?.cif || doc.clientCif) && (
                    <div className="text-base sm:text-lg text-blue-900 font-mono font-medium">CIF: {client?.cif || doc.clientCif}</div>
                  )}
                  {(client?.phone || doc.clientPhone) && (
                    <div className="text-slate-600 text-base">{client?.phone || doc.clientPhone}</div>
                  )}
                  {(client?.email || doc.clientEmail) && (
                    <div className="text-slate-500 text-sm">{client?.email || doc.clientEmail}</div>
                  )}
                </div>

                {/* Vehículo */}
                <div className="space-y-1 sm:text-right">
                  <span className="text-slate-500 font-bold block uppercase text-xs sm:text-sm tracking-wider">Vehículo:</span>
                  {doc.vehiclePlate && (
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-slate-900 block">
                      {doc.vehiclePlate}
                    </span>
                  )}
                  <div className="font-bold text-slate-800 text-lg sm:text-xl uppercase">
                    {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || 'Vehículo Registrado'}
                  </div>
                </div>
              </div>

              {/* Partidas / Conceptos */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 border-b-2 border-slate-200 pb-2 flex justify-between uppercase tracking-wider text-base sm:text-lg">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                {doc.items && doc.items.length > 0 ? (
                  doc.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-slate-800 py-2.5 border-b border-slate-100 last:border-0 text-base sm:text-lg">
                      <span className="truncate pr-4 font-medium">{it.description}</span>
                      <span className="font-bold font-mono whitespace-nowrap text-slate-900">{(Number(it.amount) || 0).toFixed(2)} €</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic py-2">Sin partidas especificadas.</div>
                )}
              </div>

              {/* Observaciones */}
              {doc.notes && (
                <div className="text-sm text-slate-600 border-t border-slate-200 pt-3">
                  <span className="font-bold uppercase text-xs block text-slate-500 mb-1">Observaciones:</span>
                  <p className="italic">{doc.notes}</p>
                </div>
              )}

              {/* QR y Texto Verifactu para Facturas Emitidas */}
              <div className="pt-2">
                <VerifactuSection document={doc} size="md" />
              </div>

              {/* Desglose Fiscal y Total */}
              <div className="flex justify-end pt-3 border-t-2 border-slate-200">
                <div className="w-full sm:w-80 space-y-2">
                  <div className="flex justify-between text-slate-600 text-base sm:text-lg">
                    <span>Base Imponible:</span>
                    <span className="font-mono font-bold text-slate-800">{invoiceSubtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-base sm:text-lg">
                    <span>IVA (21%):</span>
                    <span className="font-mono font-bold text-slate-800">{invoiceTax.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black border-t-2 border-slate-900 pt-2 text-2xl sm:text-3xl">
                    <span>TOTAL:</span>
                    <span className="font-mono">{invoiceTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Estado de envío de factura y aviso de activación de Cobro */}
              {isFacturaEnviada ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Factura enviada al cliente el <strong className="font-mono text-emerald-800">{invoiceSentDateDisplay}</strong>.
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                    Parada Cobro Activada
                  </span>
                </div>
              ) : isFacturaGenerada ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      Factura generada pero <strong>pendiente de enviar</strong> al cliente. Envíela por WhatsApp o Email para activar la parada Cobro.
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Iconos flotantes al pie (mismo diseño que en presupuesto) */}
              <div className="flex items-center justify-center gap-6 sm:gap-10 pt-4 border-t-2 border-slate-200">
                {/* Icono de Expediente / Descargar PDF */}
                <button
                  type="button"
                  onClick={() => {
                    setViewerDoc(invoiceDoc);
                  }}
                  className="p-1 bg-transparent hover:opacity-80 text-[#0F2942] transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                  title="Ver Factura / Descargar PDF"
                >
                  <Download className="w-10 h-10 stroke-[2.2]" />
                </button>

                {/* Icono WhatsApp flotante */}
                {(client?.phone || doc.clientPhone) && (
                  <a
                    href={`https://wa.me/${((client?.phone || doc.clientPhone || '').replace(/\D/g, '').startsWith('34')) ? (client?.phone || doc.clientPhone || '').replace(/\D/g, '') : '34' + (client?.phone || doc.clientPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `*${doc.issuerName || 'Taller Gestarian'}*\n\n` +
                      `Estimado/a ${client?.name || doc.clientName},\n` +
                      `Le remitimos su Factura Oficial *${invoiceNumberOnly}* por importe de *${invoiceTotal.toFixed(2)} €*.\n\n` +
                      `📄 *Documento oficial adjunto en vista de impresión descargable:*\n` +
                      `https://notificaciones.gestarian/d/${encodeURIComponent(invoiceNumberOnly)}\n\n` +
                      `Gracias por su confianza.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const nowIso = new Date().toISOString();
                      const updatedDoc: GestarianDocument = {
                        ...doc,
                        sentAt: nowIso,
                        status: 'enviada',
                      };
                      if (onUpdateDocument) onUpdateDocument(updatedDoc);

                      const newNotif: InternalNotification = {
                        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        title: `Factura ${invoiceNumberOnly} Enviada al Cliente`,
                        message: `Factura enviada a ${client?.name || doc.clientName} (${doc.vehiclePlate || 'Vehículo'}). Documento oficial adjunto en vista de impresión descargable desde notificaciones.gestarian.`,
                        timestamp: nowIso,
                        read: false,
                        type: 'budget_sent_client',
                        budgetId: doc.id,
                        documentNumber: invoiceNumberOnly,
                        totalAmount: invoiceTotal,
                        attachmentType: 'factura',
                      };
                      const storedNotifs = getStoredNotifications();
                      saveStoredNotifications([newNotif, ...storedNotifs]);
                      window.dispatchEvent(new CustomEvent('gestarian_notifications_updated'));

                      if (onShowToast) onShowToast(`Factura ${invoiceNumberOnly} preparada para WhatsApp con documento adjunto en vista de impresión.`, 4000);
                    }}
                    className="p-1 bg-transparent hover:opacity-80 text-emerald-600 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="w-10 h-10 stroke-[2.2]" />
                  </a>
                )}

                {/* Icono Email flotante */}
                {(client?.email || doc.clientEmail) && (
                  <button
                    type="button"
                    onClick={handleSendInvoiceViaEmail}
                    className="p-1 bg-transparent hover:opacity-80 text-blue-600 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                    title="Enviar por Email Directo"
                  >
                    <Mail className="w-10 h-10 stroke-[2.2]" />
                  </button>
                )}

                {/* Icono Imprimir flotante */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(invoiceDoc)}
                  className="p-1 bg-transparent hover:opacity-80 text-slate-700 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                  title="Imprimir / Ver Factura"
                >
                  <Printer className="w-10 h-10 stroke-[2.2]" />
                </button>
              </div>

              {!isFacturaGenerada && canInvoice && (
                <div className="mt-4 pt-3 border-t border-slate-200 w-full flex justify-center">
                  <button
                    type="button"
                    onClick={handleFacturar}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Confirmar y Emitir Factura Oficial</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'cobro':
        return null;

      default:
        return null;
    }
  };

  return (
    <>
      {/* Toast de confirmación estático sin animación (Aceptar-Cancelar) - Fondo gris claro con borde azul 2pt */}
      {confirmToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-xl bg-slate-100 text-slate-900 p-5 rounded-2xl shadow-2xl border-2 border-blue-600 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2 w-full">
            {confirmToast.customContent ? (
              <div className="w-full flex-1">
                {confirmToast.customContent}
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-900">
                  {confirmToast.stepName ? confirmToast.stepName : confirmToast.isLocked ? 'Parada en Espera' : 'Confirmar Avance de Estado'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans font-medium">
                  {confirmToast.message}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setConfirmToast(null)}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-lg cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-300">
            <button
              type="button"
              onClick={() => setConfirmToast(null)}
              className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 text-xs font-bold uppercase rounded-xl cursor-pointer transition-colors"
            >
              {confirmToast.isLocked ? 'Aceptar' : 'Cancelar'}
            </button>
            {!confirmToast.isLocked && confirmToast.onConfirm && (
              <button
                type="button"
                onClick={() => {
                  confirmToast.onConfirm?.();
                  setConfirmToast(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer shadow-md transition-colors"
              >
                Aceptar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full my-2 pb-[200px]">
        <div className="flex flex-col space-y-[10px] lg:space-y-[30px]">
          {steps.map((st) => {
            const isExpanded = expandedStepId === st.id;
            const bgClass = getStepBgClass(st.id);

            const handleButtonClick = () => {
              if (st.id === 'cobro') {
                if (!isFacturacionGreen) {
                  setConfirmToast({
                    stepName: 'Cobro',
                    message: 'La parada "Cobro" está desactivada. Se activará automáticamente cuando la parada "Facturación" muestre "FACTURA ENVIADA" con la fecha de envío debajo tras enviarse por WhatsApp o Email.',
                    isLocked: true,
                  });
                } else {
                  setShowPaymentsControlModal(true);
                }
              } else {
                setExpandedStepId(isExpanded ? null : st.id);
              }
            };

            const isPresupuestoExpanded = isExpanded && st.id === 'presupuesto';

            return (
              <div
                key={st.id}
                className={`w-[calc(100vw-40px)] md:w-[calc(100vw-80px)] ${
                  isPresupuestoExpanded ? 'lg:w-[calc(100vw-80px)] xl:w-[calc(100vw-120px)] max-w-full' : 'lg:w-[calc(100vw-600px)]'
                } mx-auto flex flex-col transition-all duration-300`}
              >
                <div
                  onClick={() => handleStepCardClick(st.id)}
                  className={`w-full p-3.5 sm:p-5 rounded-2xl border-2 shadow-md flex items-center justify-between transition-all duration-200 cursor-pointer ${bgClass} ${
                    (st.id === 'presupuesto' || st.id === 'cita') && isClientProposedPending
                      ? 'ring-4 ring-amber-400/70 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.9)] animate-pulse'
                      : ''
                  }`}
                >
                  {/* Botón + / - solo a la izquierda (tamaño x2, un solo círculo sin sombrear) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleButtonClick();
                    }}
                    id={`btn-step-${st.id}`}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/80 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                    title={
                      st.id === 'cobro'
                        ? isFacturacionGreen
                          ? 'Abrir Control de Cobros'
                          : 'Parada Cobro desactivada (requiere envío de factura)'
                        : isExpanded
                        ? 'Ocultar detalles'
                        : 'Ver detalles (+)'
                    }
                  >
                    {isExpanded ? (
                      <Minus className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[3]" />
                    ) : (
                      <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[3]" />
                    )}
                  </button>

                  {/* Título y Estado en el centro (máximo 2 líneas de texto) */}
                  <div className="flex-1 text-center flex flex-col items-center justify-center px-2 py-0.5 min-h-[56px] max-h-[64px] overflow-hidden leading-tight shrink">
                    {st.id === 'facturacion' && isFacturaEnviada ? (
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span className="font-black text-base sm:text-xl text-white tracking-wide uppercase truncate w-full">
                          FACTURA ENVIADA
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-white/95 font-mono tracking-wider mt-0.5">
                          {invoiceSentDateDisplay}
                        </span>
                      </div>
                    ) : st.id === 'cita' && isCitaAccepted && !isCitaConfirmed ? (
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span className="font-black text-base sm:text-xl text-white tracking-wide uppercase truncate w-full">
                          CITA ACEPTADA
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmToast({
                              stepName: 'Confirmar Llegada de Vehículo',
                              message: '¿Desea confirmar la llegada del vehículo al taller para validar la recepción e iniciar la asignación de operario?',
                              onConfirm: () => {
                                handleConfirmCita();
                              },
                            });
                          }}
                          className="inline-flex items-center justify-center px-3 py-1 mt-0.5 text-xs sm:text-sm font-black text-white uppercase tracking-wider rounded-lg border-2 border-amber-300 ring-2 ring-amber-400/80 animate-pulse bg-amber-400/30 hover:bg-amber-400/50 shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          CONFIRMAR LLEGADA
                        </button>
                      </div>
                    ) : st.id === 'cita' && isBudgetSent && !isCitaConfirmed && !isCitaAccepted ? (
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span className="font-black text-base sm:text-xl text-white tracking-wide uppercase truncate w-full">
                          CITA PROPUESTA
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-white/95 font-mono tracking-wider mt-0.5 truncate w-full">
                          {deliveryDateDisplay || 'FECHA NO FIJADA'}
                        </span>
                      </div>
                    ) : st.id === 'taller' && isCitaGreen ? (
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span className="font-black text-base sm:text-xl text-white tracking-wide uppercase truncate w-full">
                          {isTallerFinalizado ? 'REPARACIÓN FINALIZADA' : isTallerEnReparacion ? 'REPARACIÓN EN PROCESO' : 'ENVIAR A TALLER'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('gestarian_filter_workshop_operators'));
                            handleEnviarATaller();
                          }}
                          className="inline-flex items-center justify-center px-3 py-0.5 mt-0.5 text-xs sm:text-sm font-black text-white uppercase tracking-wider rounded-lg border-2 border-indigo-200 ring-2 ring-indigo-300/80 animate-pulse bg-indigo-500/50 hover:bg-indigo-500/80 shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          <Users className="w-3.5 h-3.5 mr-1 inline" />
                          {assignedEmployee ? `OPERARIO: ${assignedEmployee.name}` : 'ASIGNAR OPERARIO'}
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-black text-base sm:text-xl text-white tracking-wide uppercase truncate w-full">
                          {st.name}
                        </span>
                        <span className="text-[11px] sm:text-xs font-extrabold text-white/95 uppercase tracking-wider line-clamp-2 w-full mt-0.5 leading-tight">
                          {st.statusLabel}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Espaciador a la derecha para mantener el título en el centro exacto */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 pointer-events-none" />
                </div>

                {/* Desplazamiento fluido hacia abajo para mostrar detalles */}
                <AnimatePresence initial={false}>
                  {st.id !== 'cobro' && isExpanded && (
                    <motion.div
                      key={`expanded-${st.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="w-full bg-white border border-[#CBD5E1] rounded-2xl p-4 sm:p-6 mt-2 mb-2 shadow-md">
                        {renderExpandedContent(st.id)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visor de Documentos A4 (Presupuestos / Facturas) */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        document={viewerDoc}
        userLogoUrl={currentUser.logoUrl}
        onClose={() => setViewerDoc(null)}
        onConfirmInvoice={() => {}}
        onSendInvoice={(docId) => {
          const nowIso = new Date().toISOString();
          const updatedDoc: GestarianDocument = {
            ...doc,
            status: doc.type === 'factura' ? 'enviada' : doc.status,
            facturacionStatus: 'factura_enviada',
            isLocked: true,
            sentAt: nowIso,
            facturaSentAt: nowIso,
          };
          onUpdateDocument(updatedDoc);
          setViewerDoc(null);
          const dateFormatted = formatInvoiceSentDate(nowIso);
          if (onShowToast) {
            onShowToast(`Factura enviada el ${dateFormatted}. Parada Facturación en verde y parada Cobro activada.`);
          }
        }}
        onAcceptBudget={() => {}}
        onConvertToInvoice={() => {}}
        onEditDocument={() => {}}
        onOpenAgendaForBudget={() => {}}
        onShowToast={onShowToast}
      />

      {/* Visor de Imágenes cuando se pulsa en Taller */}
      <ExpedienteImagesModal
        isOpen={showImagesModal}
        onClose={() => setShowImagesModal(false)}
        document={doc}
        client={client}
        onUpdateImages={(updatedImages) => {
          const updatedDoc = {
            ...doc,
            vehicleImages: updatedImages,
          };
          onUpdateDocument(updatedDoc);
        }}
      />

      {/* Modal Panel de Control de Cobros */}
      {showPaymentsControlModal && (() => {
        const docStatusStr = (doc.status as string) || '';
        const isImpagada = docStatusStr === 'impagada' || (doc as any).isImpagada;
        const isAbonada = (doc.total > 0 && totalPaid >= (doc.total - 0.01)) || docStatusStr === 'pagada' || docStatusStr === 'abonada' || docStatusStr === 'PAGADO' || docStatusStr === 'pagado';
        const isPagoParcial = !isAbonada && totalPaid > 0;
        const isPendiente = !isAbonada && !isPagoParcial && !isImpagada;

        const statusLabel = isAbonada ? 'ABONADA' : isPagoParcial ? 'PAGO PARCIAL' : isImpagada ? 'IMPAGADA' : 'PENDIENTE';
        const statusTheme = isAbonada
          ? {
              bannerBg: 'bg-emerald-50 border-emerald-500',
              iconBg: 'bg-emerald-600 text-white',
              titleColor: 'text-emerald-950',
              badgeBg: 'bg-emerald-600 text-white',
              textColor: 'text-emerald-700',
            }
          : isPagoParcial
            ? {
                bannerBg: 'bg-blue-50 border-blue-500',
                iconBg: 'bg-blue-600 text-white',
                titleColor: 'text-blue-950',
                badgeBg: 'bg-blue-600 text-white',
                textColor: 'text-blue-700',
              }
            : isImpagada
              ? {
                  bannerBg: 'bg-rose-50 border-rose-500',
                  iconBg: 'bg-rose-600 text-white',
                  titleColor: 'text-rose-950',
                  badgeBg: 'bg-rose-600 text-white',
                  textColor: 'text-rose-700',
                }
              : {
                  bannerBg: 'bg-amber-50 border-amber-500',
                  iconBg: 'bg-amber-500 text-white',
                  titleColor: 'text-amber-950',
                  badgeBg: 'bg-amber-500 text-white',
                  textColor: 'text-amber-700',
                };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
              {/* Header del Panel de Cobros */}
              <div className="bg-[#0F2942] text-white p-5 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl sm:text-3xl text-white">Panel de Control de Cobros</h3>
                    <p className="text-sm sm:text-base text-slate-300 mt-0.5">
                      Expediente: <span className="font-mono text-emerald-400 font-bold">{doc.expediente || 'EXP-001'}</span> • {client?.name || doc.clientName || 'Cliente'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentsControlModal(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-5 sm:p-7 space-y-6">
                {/* 1. ESTADO AL PRINCIPIO DEL TODO (Eliminado el texto largo) */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${statusTheme.bannerBg}`}>
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className={`p-3 rounded-xl ${statusTheme.iconBg}`}>
                      {isAbonada ? (
                        <CheckCircle2 className="w-8 h-8" />
                      ) : isPagoParcial ? (
                        <Receipt className="w-8 h-8" />
                      ) : isImpagada ? (
                        <AlertTriangle className="w-8 h-8" />
                      ) : (
                        <Clock className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider block opacity-75">
                        Estado del Cobro:
                      </span>
                      <span className={`text-2xl sm:text-3xl font-black uppercase tracking-wide ${statusTheme.textColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Acciones directas de envío según estado */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    {isAbonada ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSendInvoiceTotalViaWhatsApp}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-105"
                          title="Enviar Factura por WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendInvoiceTotalViaEmail}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-105"
                          title="Enviar Factura por Email"
                        >
                          <Mail className="w-5 h-5" />
                          <span>Email</span>
                        </button>
                      </>
                    ) : isPagoParcial ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const lastPay = (doc.payments && doc.payments.length > 0) ? doc.payments[doc.payments.length - 1] : null;
                            handleSendPartialReceiptViaWhatsApp(lastPay?.amount || totalPaid, lastPay?.date || new Date().toISOString().split('T')[0], 'Abono Parcial');
                          }}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-105"
                          title="Enviar Recibo por WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Recibo WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const lastPay = (doc.payments && doc.payments.length > 0) ? doc.payments[doc.payments.length - 1] : null;
                            handleSendPartialReceiptViaEmail(lastPay?.amount || totalPaid, lastPay?.date || new Date().toISOString().split('T')[0], 'Abono Parcial');
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-105"
                          title="Enviar Recibo por Email"
                        >
                          <Mail className="w-5 h-5" />
                          <span>Email</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendInvoiceTotalViaWhatsApp}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-105"
                        title="Enviar Recordatorio de Cobro"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Recordatorio</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Resumen Metricas con textos e importes al doble de tamaño */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Total Factura
                    </span>
                    <span className="text-2xl sm:text-4xl font-black font-mono text-slate-900 block">
                      {(doc.total || 0).toFixed(2)} €
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300">
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                      Total Cobrado
                    </span>
                    <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-900 block">
                      {totalPaid.toFixed(2)} €
                    </span>
                  </div>
                  <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border-2 border-amber-300">
                    <span className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      Pendiente
                    </span>
                    <span className="text-2xl sm:text-4xl font-black font-mono text-amber-900 block">
                      {Math.max(0, (doc.total || 0) - totalPaid).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Banner de Feedback Inmediato al Registrar Abono */}
                {lastAbonoFeedback && (
                  <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                    lastAbonoFeedback.isTotal
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                      : 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className={`w-6 h-6 shrink-0 ${lastAbonoFeedback.isTotal ? 'text-emerald-600' : 'text-blue-600'}`} />
                        <div>
                          <h4 className="text-sm sm:text-base font-black uppercase tracking-wider">
                            {lastAbonoFeedback.isTotal ? '¡Abono Total Completado (Factura Abonada)!' : 'Abono Parcial Registrado'}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-700 leading-snug mt-0.5">
                            Importe abonado: <strong className="font-mono">{lastAbonoFeedback.amount.toFixed(2)} €</strong> ({lastAbonoFeedback.method} - {lastAbonoFeedback.date}).
                            {lastAbonoFeedback.isTotal
                              ? ' El saldo de la factura ha quedado totalmente cubierto.'
                              : ` Recibo generado: ${lastAbonoFeedback.receiptNum}.`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLastAbonoFeedback(null)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title="Cerrar aviso"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Acciones de envío directo según sea Abono Total o Abono Parcial */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                      {lastAbonoFeedback.isTotal ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSendInvoiceTotalViaWhatsApp}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Enviar Factura por WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSendInvoiceTotalViaEmail}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Enviar Factura por Email</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewerDoc(invoiceDoc || doc)}
                            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Factura Oficial</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSendPartialReceiptViaWhatsApp(lastAbonoFeedback.amount, lastAbonoFeedback.date, lastAbonoFeedback.method, lastAbonoFeedback.receiptNum)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Enviar Recibo (WhatsApp)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPartialReceiptViaEmail(lastAbonoFeedback.amount, lastAbonoFeedback.date, lastAbonoFeedback.method, lastAbonoFeedback.receiptNum)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Enviar Recibo (Email)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(lastAbonoFeedback.amount, lastAbonoFeedback.date, lastAbonoFeedback.method, lastAbonoFeedback.receiptNum)}
                            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Recibo Oficial (A4)</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Registro Formulario Nuevo Cobro (Oculto cuando el abono es total) */}
                {!isAbonada && (
                  <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border-2 border-slate-200 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                      <span className="text-lg sm:text-xl font-black text-[#0F2942] uppercase tracking-wider">
                        Añadir Nuevo Pago / Cobro
                      </span>
                      {Math.max(0, (doc.total || 0) - totalPaid) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAddPayment(Math.max(0, (doc.total || 0) - totalPaid), new Date().toISOString().split('T')[0], newPaymentMethod || 'Efectivo')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                          title="Abonar de inmediato la totalidad del saldo pendiente de la factura"
                        >
                          <Check className="w-5 h-5" />
                          <span>ABONAR TODO ({Math.max(0, (doc.total || 0) - totalPaid).toFixed(2)} €)</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                      <div>
                        <label className="text-sm sm:text-base font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                          Importe a Abonar (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newPaymentAmount}
                          onChange={(e) => setNewPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full text-xl sm:text-2xl font-black p-3.5 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-sm sm:text-base font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                          Método de Pago
                        </label>
                        <select
                          value={newPaymentMethod}
                          onChange={(e) => setNewPaymentMethod(e.target.value)}
                          className="w-full text-lg sm:text-xl font-bold p-3.5 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta Bancaria</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Bizum">Bizum</option>
                          <option value="Financiacion">Financiación</option>
                          <option value="Cheque">Cheque / Pagaré</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm sm:text-base font-black text-slate-700 block mb-1.5 uppercase tracking-wider">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={newPaymentDate}
                          onChange={(e) => setNewPaymentDate(e.target.value)}
                          className="w-full text-lg sm:text-xl font-bold p-3.5 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const amount = parseFloat(newPaymentAmount);
                          if (isNaN(amount) || amount <= 0) {
                            if (onShowToast) onShowToast('Por favor introduzca un importe válido.');
                            return;
                          }
                          handleAddPayment(amount, newPaymentDate, newPaymentMethod);
                        }}
                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                      >
                        <Plus className="w-6 h-6" />
                        <span>Registrar Pago Parcial</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Pagos Existentes */}
                <div className="space-y-3 pt-2">
                  <span className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-wider block">
                    ABONOS PARCIALES REGISTRADOS ({doc.payments?.length || 0})
                  </span>

                  {(!doc.payments || doc.payments.length === 0) ? (
                    <div className="text-base sm:text-lg text-slate-400 font-medium italic bg-slate-50 p-5 rounded-2xl text-center border-2 border-slate-200">
                      No se ha registrado ningún abono parcial aún.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {doc.payments.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="flex justify-between items-center bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 text-base sm:text-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-black text-slate-900 text-lg sm:text-xl font-mono">+{p.amount.toFixed(2)} €</span>
                              <span className="text-slate-600 font-bold text-sm sm:text-base ml-2.5">({p.method || 'Abono'} - {p.date})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendPartialReceiptViaWhatsApp(p.amount, p.date, p.method || 'Abono')}
                              className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-colors cursor-pointer"
                              title="Enviar recibo de este cobro por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendPartialReceiptViaEmail(p.amount, p.date, p.method || 'Abono')}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl transition-colors cursor-pointer"
                              title="Enviar recibo de este cobro por Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(p.amount, p.date, p.method || 'Abono')}
                              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
                              title="Ver recibo oficial (A4)"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Eliminar registro de pago"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPaymentsControlModal(false)}
                  className="px-6 py-3 bg-[#0F2942] hover:bg-[#1E3A8A] text-white font-black text-sm sm:text-base rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Cerrar Panel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Calendario para Denegar y Proponer Nueva Fecha por el Taller */}
      {showDenyCalendarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base uppercase">
                <Calendar className="w-5 h-5 text-rose-600" />
                <span>Proponer Nueva Fecha de Entrega</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDenyCalendarModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Seleccione en el calendario la nueva fecha de entrega propuesta para enviar al cliente. El cliente podrá aceptarla o solicitar otra fecha.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                Nueva Fecha de Entrega Propuesta:
              </label>
              <input
                type="date"
                value={counterProposalDate}
                onChange={(e) => setCounterProposalDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowDenyCalendarModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSendCounterProposalDate(counterProposalDate)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Enviar Propuesta al Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Toast ASIGNAR EMPLEADO */}
      <AssignEmployeeModal
        isOpen={showAssignEmployeeModal}
        onClose={() => setShowAssignEmployeeModal(false)}
        document={doc}
        currentUser={currentUser}
        onConfirmAssignment={handleConfirmEmployeeAssignment}
      />

      {/* Modal Visor de Imágenes del Expediente */}
      <ExpedienteImagesModal
        isOpen={showImagesModal}
        onClose={() => setShowImagesModal(false)}
        document={{
          ...doc,
          vehicleImages: combinedVehicleImages,
        }}
        client={client}
        onUpdateImages={handleUpdateImages}
        onShowToast={onShowToast}
      />
      {/* Modal para Proponer / Modificar Fecha de Entrega */}
      <DeliveryDatePickerModal
        isOpen={isDeliveryDatePickerOpen}
        onClose={() => setIsDeliveryDatePickerOpen(false)}
        initialDate={doc.proposedDeliveryDate || doc.vehicleDeliveryDate}
        onSelectDeliveryDate={(formattedDate) => {
          handleSendCounterProposalDate(formattedDate);
          if (onShowToast) {
            onShowToast(`Fecha propuesta de entrega fijada: ${formattedDate}`);
          }
        }}
      />
    </>
  );
};

