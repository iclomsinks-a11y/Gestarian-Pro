import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, Loader2, PlusCircle, MinusCircle, User, Car, Phone, Mail, 
  Calendar, Wrench, Camera, MessageCircle, Printer, Download, Share2, 
  FileText, Clock, Users, Image as ImageIcon, Send, FileCheck2, CheckCircle2, XCircle, 
  ClipboardList, Eye, FolderArchive, DollarSign, CreditCard, Trash2, X, Plus, Minus, History, AlertCircle, Receipt
} from 'lucide-react';
import { GestarianDocument, AppUser, Client, CitaProposal } from '../types';
import { generateDocumentPdfUrl, buildDocumentDispatchPayload, sendDocumentViaApi, getShortDocumentUrl } from '../services/documentDispatchService';
import { getNextDocumentNumber, getStoredDocuments, saveStoredDocuments } from '../services/storage';
import { DocumentViewerModal } from './DocumentViewerModal';
import { ExpedienteImagesModal } from './ExpedienteImagesModal';
import { AssignEmployeeModal } from './AssignEmployeeModal';

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
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<GestarianDocument | null>(null);
  const [showImagesModal, setShowImagesModal] = useState<boolean>(false);
  const [showPaymentsControlModal, setShowPaymentsControlModal] = useState<boolean>(false);

  // Form para negociaciÃ³n de fecha de entrega
  const [showDenyCalendarModal, setShowDenyCalendarModal] = useState<boolean>(false);
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

  const [confirmToast, setConfirmToast] = useState<{
    stepName: string;
    message: string;
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

  const isCitaAccepted = doc.citaStatus === 'cita_aceptada' || doc.deliveryDateStatus === 'accepted' || (isBudgetAccepted && doc.deliveryDateStatus !== 'pending_acceptance');
  const isCitaConfirmed = doc.citaStatus === 'cita_confirmada';

  const isTallerEnviar = doc.tallerStatus === 'enviar_a_taller' || isCitaConfirmed;
  const isTallerEnReparacion = doc.tallerStatus === 'en_reparacion' || doc.workOrderStatus === 'en_ejecucion';
  const isTallerFinalizado = doc.tallerStatus === 'reparacion_finalizada' || doc.workOrderStatus === 'finalizada';

  const isFacturaGenerada = doc.type === 'factura' || Boolean(doc.convertedToInvoiceId) || doc.facturacionStatus === 'facturado' || doc.facturacionStatus === 'factura_enviada';
  
  // Factura enviada al cliente (requerido para color verde en FacturaciÃ³n y activar la parada Cobro)
  const invoiceSentAt = 
    doc.facturaSentAt || 
    (doc.type === 'factura' ? doc.sentAt : undefined) ||
    foundInvoiceDoc?.facturaSentAt || 
    foundInvoiceDoc?.sentAt;

  const isFacturaEnviada = Boolean(
    (doc.type === 'factura' && (doc.status === 'enviada' || doc.status === 'enviado' || doc.facturacionStatus === 'factura_enviada' || Boolean(doc.sentAt || doc.facturaSentAt))) ||
    (foundInvoiceDoc && (foundInvoiceDoc.status === 'enviada' || foundInvoiceDoc.status === 'enviado' || foundInvoiceDoc.facturacionStatus === 'factura_enviada' || Boolean(foundInvoiceDoc.sentAt || foundInvoiceDoc.facturaSentAt))) ||
    (doc.facturacionStatus === 'factura_enviada') ||
    Boolean(doc.facturaSentAt)
  );

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

  const canFinalizeRepair = isTallerEnReparacion && !isTallerFinalizado;
  const canInvoice = (isTallerFinalizado || doc.facturacionStatus === 'facturar') && !isFacturaGenerada;

  const totalPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const isPaid = totalPaid >= (doc.total || 0) && (doc.total || 0) > 0;
  const isPartiallyPaid = totalPaid > 0 && !isPaid;

  // Estados verdes (finalizados) para la dependencia secuencial
  const isRecepcionGreen = true; // RecepciÃ³n siempre verde al existir el expediente
  const isPresupuestoGreen = isBudgetAccepted;
  const isCitaGreen = isCitaConfirmed;
  const isTallerGreen = isTallerFinalizado;
  const isFacturacionGreen = isFacturaEnviada; // FacturaciÃ³n verde = FACTURA ENVIADA
  const isCobroGreen = isPaid;

  const phoneClean = (client?.phone || doc.clientPhone || '').replace(/\D/g, '');

  // Fechas y cÃ¡lculos de mora / impago para la parada de Cobro
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
  // Handlers para negociaciÃ³n de fecha de entrega
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
    // BLOQUEO SECUENCIAL: requiere presupuesto aceptado
    if (!isPresupuestoGreen) {
      if (onShowToast) onShowToast('El presupuesto debe estar aceptado antes de confirmar la cita.', 4000);
      setConfirmToast({ stepName: 'Cita', message: 'Parada bloqueada: el presupuesto no ha sido aceptado todavia. Pide aceptacion al cliente antes de continuar.', isLocked: true });
      return;
    }
    const updated: GestarianDocument = {
      ...doc,
      citaStatus: 'cita_confirmada',
      tallerStatus: 'enviar_a_taller',
    };
    onUpdateDocument(updated);
    if (onShowToast) {
      onShowToast('Cita confirmada. Vehiculo entregado en taller y listo para reparar.');
    }
  };

  const handleEnviarATaller = () => {
    // BLOQUEO SECUENCIAL: requiere cita confirmada
    if (!isCitaGreen) {
      if (onShowToast) onShowToast('Debes confirmar la cita antes de enviar al taller.', 4000);
      setConfirmToast({ stepName: 'Taller', message: 'Parada bloqueada: la cita no ha sido confirmada todavia. Confirma la cita primero.', isLocked: true });
      return;
    }
    setShowAssignEmployeeModal(true);
  };

  const handleConfirmEmployeeAssignment = (docId: string, employeeId: string, employeeName: string) => {
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
      onShowToast(`REPARACIÃ“N EN PROCESO. Empleado asignado: ${employeeName}`, 6000);
    }
  };

  const handleFinalizarReparacion = () => {
    const canManage = currentUser.role === 'boss' || currentUser.permissions?.manageWorkOrders !== false;
    if (!canManage) {
      if (onShowToast) onShowToast('No tiene permisos para finalizar Ã³rdenes de trabajo.');
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
      onShowToast('ReparaciÃ³n finalizada por el operario/superior. Listo para facturar.');
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
    const targetPhone = phoneClean || prompt('Introduzca el telÃ©fono/mÃ³vil para enviar la factura por WhatsApp:', client?.phone || doc.clientPhone || '');
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
      onShowToast(`Factura enviada por WhatsApp el ${dateFormatted}. Parada FacturaciÃ³n finalizada en verde y parada Cobro activada.`);
    }
  };

  const handleSendInvoiceViaEmail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetEmail = client?.email || doc.clientEmail || prompt('Introduzca el email del cliente para enviar la factura:');
    if (!targetEmail) return;
    const mailtoUrl = `mailto:${targetEmail}?subject=Factura%20${invoiceNumberOnly}&body=Estimado%20cliente,%20le%20adjuntamos%20su%20factura%20${invoiceNumberOnly}%20por%20importe%20de%20${(doc.total || 0).toFixed(2)}â‚¬.%20Puede%20consultarla%20aquÃ­:%20${encodeURIComponent(generateDocumentPdfUrl(invoiceDoc || doc))}`;
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
      onShowToast(`Factura enviada por Email el ${dateFormatted}. Parada FacturaciÃ³n finalizada en verde y parada Cobro activada.`);
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
          description: `Recibo de abono parcial / entrega a cuenta para el expediente ${doc.expediente || doc.number} (${doc.vehiclePlate || 'VehÃ­culo'}). MÃ©todo: ${paymentMethod}.`,
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
      notes: `Abono a cuenta registrado el ${paymentDate} mediante ${paymentMethod}.\nTotal presupuestado/facturado: ${totalDoc.toFixed(2)} â‚¬.\nTotal acumulado abonado: ${currentTotalPaid.toFixed(2)} â‚¬.\nSaldo pendiente restante: ${remainingPending.toFixed(2)} â‚¬.`,
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

    const targetPhone = phoneClean || prompt('Introduzca el telÃ©fono/mÃ³vil para enviar el recibo por WhatsApp:', client?.phone || doc.clientPhone || '');
    if (!targetPhone) return;
    const clean = targetPhone.replace(/\D/g, '');
    const receiptUrl = generateDocumentPdfUrl(receiptDoc);
    const plateText = doc.vehiclePlate ? ` [${doc.vehiclePlate}]` : '';
    const expText = doc.expediente ? ` (Expediente: ${doc.expediente})` : '';

    const text = `Hola ${client?.name || doc.clientName},\nLe confirmamos la recepciÃ³n de su abono a cuenta por importe de *${paymentAmount.toFixed(2)} â‚¬*${expText}${plateText}.\n\n` +
      `â€¢ NÃºmero de Recibo: *${receiptNum}*\n` +
      `â€¢ Fecha: ${paymentDate}\n` +
      `â€¢ MÃ©todo: ${paymentMethod}\n` +
      `â€¢ Total del presupuesto: ${totalDoc.toFixed(2)} â‚¬\n` +
      `â€¢ Total abonado hasta la fecha: ${currentTotalPaid.toFixed(2)} â‚¬\n` +
      `â€¢ Saldo pendiente restante: *${remainingPending.toFixed(2)} â‚¬*\n\n` +
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
    const body = `Estimado/a ${client?.name || doc.clientName},\n\nLe confirmamos la recepciÃ³n de su abono a cuenta por importe de ${paymentAmount.toFixed(2)} â‚¬.\n\n` +
      `Detalles del cobro registrado:\n` +
      `- Recibo Oficial: ${receiptNum}\n` +
      `- Expediente: ${doc.expediente || '-'}\n` +
      `- VehÃ­culo: ${doc.vehiclePlate || '-'}\n` +
      `- Fecha de cobro: ${paymentDate}\n` +
      `- MÃ©todo de pago: ${paymentMethod}\n` +
      `- Importe abonado: ${paymentAmount.toFixed(2)} â‚¬\n` +
      `- Total presupuestado/facturado: ${totalDoc.toFixed(2)} â‚¬\n` +
      `- Total cobrado acumulado: ${currentTotalPaid.toFixed(2)} â‚¬\n` +
      `- Saldo pendiente restante: ${remainingPending.toFixed(2)} â‚¬\n\n` +
      `Puede acceder y descargar su recibo oficial en el siguiente enlace:\n${receiptUrl}\n\n` +
      `Atentamente,\n${currentUser.fullName || 'DM CAR'}`;

    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (onShowToast) {
      onShowToast(`Recibo de abono parcial ${receiptNum} preparado para envÃ­o por Email.`);
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

    const targetPhone = phoneClean || prompt('Introduzca el telÃ©fono/mÃ³vil para enviar la factura por WhatsApp:', client?.phone || doc.clientPhone || '');
    if (!targetPhone) return;
    const clean = targetPhone.replace(/\D/g, '');
    const invoiceUrl = generateDocumentPdfUrl(invoiceDoc || doc);
    const plateText = doc.vehiclePlate ? ` [${doc.vehiclePlate}]` : '';
    const expText = doc.expediente ? ` (Expediente: ${doc.expediente})` : '';

    const text = `Hola ${client?.name || doc.clientName},\nLe confirmamos que su expediente ${expText}${plateText} ha quedado *TOTALMENTE ABONADO Y LIQUIDADO* (Total: ${(doc.total || 0).toFixed(2)} â‚¬, Saldo pendiente: 0,00 â‚¬).\n\n` +
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
    const body = `Estimado/a ${client?.name || doc.clientName},\n\nLe confirmamos que su expediente ${doc.expediente || ''}${plateText} ha quedado TOTALMENTE ABONADO Y LIQUIDADO por un importe total de ${(doc.total || 0).toFixed(2)} â‚¬ (Saldo pendiente: 0,00 â‚¬).\n\n` +
      `Le adjuntamos el acceso a su Factura Oficial ${invoiceNumberOnly} con el justificante de liquidaciÃ³n:\n${invoiceUrl}\n\n` +
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
      onShowToast(`Factura ${invoiceNumberOnly} preparada para envÃ­o por Email (Abono Total).`);
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
        onShowToast(`Â¡Abono total completado! Saldo de ${total.toFixed(2)} â‚¬ 100% cobrado. Ya puede enviar la factura.`);
      }
    } else {
      if (onShowToast) {
        onShowToast(`Abono parcial de ${amount.toFixed(2)} â‚¬ registrado. Ya puede enviar el recibo de abono parcial.`);
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

  const handleStepCardClick = (stepId: string) => {
    switch (stepId) {
      case 'recepcion':
        setConfirmToast({
          stepName: 'RecepciÃ³n',
          message: 'La recepciÃ³n del vehÃ­culo y expediente ya estÃ¡ registrada y completada en verde.',
          isLocked: true,
        });
        break;

      case 'presupuesto':
        if (doc.status === 'aceptado') {
          setConfirmToast({
            stepName: 'Presupuesto',
            message: 'El presupuesto ya estÃ¡ en el estado final "Aceptado".',
            isLocked: true,
          });
        } else if (doc.status === 'enviado') {
          setConfirmToast({
            stepName: 'Presupuesto',
            message: 'El presupuesto ha sido enviado al cliente. El presupuesto no puede ser aceptado por el taller; debe ser aceptado formalmente por el cliente desde su Ã¡rea de cliente.',
            isLocked: true,
          });
        } else {
          setConfirmToast({
            stepName: 'Presupuesto',
            message: 'Â¿Desea avanzar la parada "Presupuesto" al estado "Enviado al cliente"?',
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
            message: 'La parada "Cita" estÃ¡ en espera (gris). Para salir de espera, la parada anterior ("Presupuesto") debe estar finalizada en verde (Presupuesto Aceptado).',
            isLocked: true,
          });
        } else if (isCitaConfirmed) {
          setConfirmToast({
            stepName: 'Cita',
            message: 'La cita ya estÃ¡ en el estado final "Confirmada".',
            isLocked: true,
          });
        } else if (isCitaAccepted) {
          setConfirmToast({
            stepName: 'Cita',
            message: 'Â¿Desea avanzar la parada "Cita" al estado "Cita Confirmada (VehÃ­culo entregado en Taller)"?',
            onConfirm: () => {
              handleConfirmCita();
            },
          });
        } else {
          setConfirmToast({
            stepName: 'Cita',
            message: 'Â¿Desea avanzar la parada "Cita" al estado "Cita Aceptada por el cliente"?',
            onConfirm: () => {
              const updated: GestarianDocument = {
                ...doc,
                citaStatus: 'cita_aceptada',
              };
              onUpdateDocument(updated);
              if (onShowToast) onShowToast('Cita marcada como Aceptada.');
            },
          });
        }
        break;

      case 'taller':
        if (!isCitaGreen) {
          setConfirmToast({
            stepName: 'Taller',
            message: 'La parada "Taller" estÃ¡ en espera (gris). Para salir de espera, la parada anterior ("Cita") debe estar finalizada en verde (Cita Confirmada).',
            isLocked: true,
          });
        } else if (isTallerFinalizado) {
          setConfirmToast({
            stepName: 'Taller',
            message: 'La reparaciÃ³n ya estÃ¡ en el estado final "ReparaciÃ³n Finalizada".',
            isLocked: true,
          });
        } else if (isTallerEnReparacion) {
          setConfirmToast({
            stepName: 'Taller',
            message: 'Â¿Desea avanzar la parada "Taller" al estado "ReparaciÃ³n Finalizada"?',
            onConfirm: () => {
              handleFinalizarReparacion();
            },
          });
        } else {
          setConfirmToast({
            stepName: 'Taller',
            message: 'Â¿Desea avanzar la parada "Taller" al estado "Enviar a Taller / En ReparaciÃ³n"?',
            onConfirm: () => {
              handleEnviarATaller();
            },
          });
        }
        break;

      case 'facturacion':
        if (!isTallerGreen) {
          setConfirmToast({
            stepName: 'FacturaciÃ³n',
            message: 'La parada "FacturaciÃ³n" estÃ¡ en espera (gris). Para salir de espera, la parada anterior ("Taller") debe estar finalizada en verde (ReparaciÃ³n Finalizada).',
            isLocked: true,
          });
        } else if (isFacturaGenerada) {
          setConfirmToast({
            stepName: 'FacturaciÃ³n',
            message: 'La factura oficial ya ha sido generada y confirmada.',
            isLocked: true,
          });
        } else {
          setConfirmToast({
            stepName: 'FacturaciÃ³n',
            message: 'Â¿Desea avanzar la parada "FacturaciÃ³n" para "Confirmar y Emitir Factura Oficial"?',
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
            message: 'La parada "Cobro" estÃ¡ desactivada. Se activarÃ¡ automÃ¡ticamente cuando la parada "FacturaciÃ³n" muestre "FACTURA ENVIADA" con la fecha de envÃ­o debajo tras enviarse por WhatsApp o Email.',
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
      name: 'RecepciÃ³n',
      statusLabel: 'RECEPCIÃ“N REGISTRADA',
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
      statusLabel: isCitaConfirmed ? 'CITA CONFIRMADA' : isCitaAccepted ? 'CITA ACEPTADA' : 'PENDIENTE DE CITA',
      badgeClass: isCitaConfirmed 
        ? 'bg-emerald-500 text-white font-bold' 
        : isCitaAccepted 
        ? 'bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-md transform hover:scale-105' 
        : 'bg-slate-200 text-slate-500 font-medium',
      isClickable: !isCitaConfirmed && isCitaAccepted,
      onClick: handleConfirmCita,
      tooltip: 'Pulsar cuando el cliente entregue el vehÃ­culo el dÃ­a acordado',
      hasExpandButton: true,
    },
    {
      id: 'taller',
      name: 'Taller',
      statusLabel: isTallerFinalizado 
        ? 'REPARACIÃ“N FINALIZADA' 
        : isTallerEnReparacion 
        ? 'REPARACIÃ“N EN PROCESO' 
        : isTallerEnviar 
        ? 'ENVIAR A TALLER' 
        : 'PENDIENTE TALLER',
      badgeClass: isTallerFinalizado 
        ? 'bg-emerald-500 text-white font-bold' 
        : isTallerEnReparacion 
        ? 'bg-blue-600 text-white font-black uppercase' 
        : isTallerEnviar 
        ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer shadow-md transform hover:scale-105' 
        : 'bg-slate-200 text-slate-500 font-medium',
      isClickable: !isTallerEnReparacion && !isTallerFinalizado && isTallerEnviar,
      onClick: handleEnviarATaller,
      tooltip: 'Pulsar para enviar el vehÃ­culo al taller e iniciar reparaciÃ³n',
      hasExpandButton: true,
    },
    {
      id: 'facturacion',
      name: 'FacturaciÃ³n',
      statusLabel: isFacturaEnviada 
        ? 'FACTURA ENVIADA' 
        : isFacturaGenerada 
        ? 'FACTURA GENERADA' 
        : canInvoice 
        ? 'FACTURAR' 
        : canFinalizeRepair 
        ? 'FINALIZAR REPARACIÃ“N' 
        : 'FACTURACIÃ“N BLOQUEADA',
      badgeClass: isFacturaEnviada 
        ? 'bg-emerald-500 text-white font-bold' 
        : isFacturaGenerada 
        ? 'bg-blue-600 text-white font-bold' 
        : canInvoice 
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase cursor-pointer shadow-lg transform hover:scale-105 ring-2 ring-emerald-300' 
        : canFinalizeRepair 
        ? 'bg-rose-600 hover:bg-rose-700 text-white font-black uppercase cursor-pointer shadow-lg transform hover:scale-105 ring-2 ring-rose-300' 
        : 'bg-slate-200 text-slate-500 font-medium',
      isClickable: canInvoice || canFinalizeRepair,
      onClick: canInvoice ? handleFacturar : handleFinalizarReparacion,
      tooltip: canInvoice ? 'Pulsar para generar la factura' : 'Pulsar para dar por finalizada la reparaciÃ³n',
      hasExpandButton: true,
    },
    {
      id: 'cobro',
      name: 'Cobro',
      statusLabel: !isFacturaEnviada 
        ? 'FACTURA PENDIENTE DE ENVÃO' 
        : isPaid 
        ? 'COBRADO TOTALMENTE' 
        : isPartiallyPaid 
        ? 'COBRO PARCIAL' 
        : 'PENDIENTE DE COBRO',
      badgeClass: !isFacturaEnviada 
        ? 'bg-slate-400 text-slate-100 font-medium' 
        : isPaid 
        ? 'bg-emerald-500 text-white font-bold cursor-pointer hover:bg-emerald-600 shadow-sm' 
        : isPartiallyPaid 
        ? 'bg-sky-500 text-white font-bold cursor-pointer hover:bg-sky-600 shadow-sm' 
        : 'bg-[#0F2942] hover:bg-[#1E3A8A] text-white font-bold cursor-pointer shadow-md transform hover:scale-105',
      isClickable: isFacturaEnviada,
      onClick: () => {
        if (!isFacturaEnviada) {
          setConfirmToast({
            stepName: 'Cobro',
            message: 'La parada "Cobro" estÃ¡ desactivada. Se activarÃ¡ automÃ¡ticamente cuando la parada "FacturaciÃ³n" muestre "FACTURA ENVIADA" con la fecha de envÃ­o debajo tras enviarse por WhatsApp o Email.',
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
      case 'recepcion':
        return (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base uppercase tracking-wide">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <span>RecepciÃ³n de VehÃ­culo</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-bold">Fecha RecepciÃ³n:</span>
                <span>{doc.date || doc.createdAt?.split('T')[0] || 'No registrada'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Datos del Cliente</span>
                </div>
                <div className="font-bold text-[#0F172A] text-base">{client?.name || doc.clientName || 'Cliente sin especificar'}</div>
                <div className="text-xs text-slate-600 mt-1 flex flex-col gap-1">
                  {client?.phone || doc.clientPhone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client?.phone || doc.clientPhone}</span>
                    </div>
                  ) : null}
                  {client?.email || doc.clientEmail ? (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client?.email || doc.clientEmail}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* VehÃ­culo */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Car className="w-4 h-4 text-indigo-600" />
                  <span>Datos del VehÃ­culo</span>
                </div>
                <div className="font-bold text-[#0F172A] text-base">
                  {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehicleType || 'VehÃ­culo Registrado'}
                </div>
                <div className="mt-2 inline-flex items-center bg-white border border-gray-400 rounded overflow-hidden h-7 shadow-2xs">
                  <div className="bg-blue-700 h-full w-5 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[5px] text-yellow-300 font-bold leading-none">â­</span>
                    <span className="text-[8px] text-white font-bold leading-none">E</span>
                  </div>
                  <div className="px-2 font-mono font-black text-xs tracking-widest text-[#0F172A]">
                    {doc.vehiclePlate || 'SIN-MAT'}
                  </div>
                </div>
              </div>
            </div>

            {/* Trabajo a realizar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-orange-600" />
                  <span>Trabajo Solicitado / Operaciones</span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {doc.items?.length || 0} {doc.items?.length === 1 ? 'partida' : 'partidas'}
                </span>
              </div>
              {(!doc.items || doc.items.length === 0) ? (
                <div className="text-xs text-slate-400 italic py-2">Sin operaciones registradas en la recepciÃ³n.</div>
              ) : (
                <div className="space-y-1.5">
                  {doc.items.map((it, idx) => (
                    <div key={it.id || idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{it.description}</span>
                      {it.amount > 0 && <span className="font-bold text-slate-900">{it.amount.toFixed(2)} â‚¬</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'presupuesto':
        return (
          <div className="space-y-4">
            {/* Header con Fecha de envÃ­o arriba */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div className="flex items-center gap-2 text-[#0F2942] font-black text-base uppercase tracking-wide">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>Presupuesto (Hoja A4)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Fecha de envÃ­o: {doc.sentAt || doc.date || 'Sin fecha de envÃ­o'}</span>
              </div>
            </div>

            {/* Banner de fecha propuesta por el cliente */}
            {isClientProposedPending && (
              <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 shadow-lg my-3 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-amber-900 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
                  <Calendar className="w-5 h-5 text-amber-600 animate-bounce" />
                  <span>NUEVA FECHA DE ENTREGA PROPUESTA POR EL CLIENTE DESDE EL ÃREA DE CLIENTE</span>
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
                  El cliente ha solicitado esta fecha de entrega. Si pulsa Aceptar, la cita quedarÃ¡ confirmada y la parada Cita del roadmap pasarÃ¡ a Azul. Si pulsa Denegar, se abrirÃ¡ el calendario para proponer una nueva fecha de entrega al cliente.
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

            {/* Vista previa miniatura de Hoja A4 */}
            <div className="bg-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center">
              <div className="bg-white w-full max-w-xl p-5 sm:p-6 rounded-xl border border-slate-300 shadow-md space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="font-black text-lg text-slate-900">{doc.issuerName || 'TALLER GESTARIAN'}</div>
                    <div className="text-xs text-slate-500 font-mono">CIF: {doc.issuerCif || 'B-12345678'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-amber-700 font-bold uppercase tracking-wider">Presupuesto</div>
                    <div className="text-base font-black font-mono text-slate-900">{budgetNumberOnly}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Cliente:</span>
                    <span className="font-bold text-slate-800">{client?.name || doc.clientName || 'Cliente'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">VehÃ­culo:</span>
                    <span className="font-bold text-slate-800">
                      {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehiclePlate || 'VehÃ­culo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-700 border-b pb-1 flex justify-between">
                    <span>Concepto</span>
                    <span>Importe</span>
                  </div>
                  {doc.items && doc.items.length > 0 ? (
                    doc.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-slate-600 py-0.5">
                        <span className="truncate pr-2">{it.description}</span>
                        <span className="font-semibold whitespace-nowrap">{it.amount.toFixed(2)} â‚¬</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic py-1">Sin partidas especificadas.</div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold block">Total Presupuestado:</span>
                    <span className="text-lg font-black text-amber-700">{(doc.total || 0).toFixed(2)} â‚¬</span>
                  </div>
                </div>
              </div>

              {/* Todos los iconos de acciÃ³n debajo */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 w-full">
                {/* BotÃ³n Ver Presupuesto en Hoja A4 completa */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(budgetDoc)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Hoja A4 Completa</span>
                </button>

                {/* WhatsApp con enlace ultra corto notificaciones.gestrian */}
                {phoneClean ? (
                  <a
                    href={`https://wa.me/${phoneClean.startsWith('34') ? phoneClean : '34' + phoneClean}?text=${encodeURIComponent(
                      `*${currentUser.fullName || 'Taller'}*\n\n` +
                      `Estimado/a ${client?.name || doc.clientName},\n` +
                      `Le remitimos su Presupuesto *${budgetNumberOnly}* por importe de *${(budgetDoc?.total || doc.total || 0).toFixed(2)} €*.\n\n` +
                      `📄 *Visualizar, descargar o compartir:*\n` +
                      `https://notificaciones.gestrian.com/d/${encodeURIComponent(budgetNumberOnly)}\n\n` +
                      `Gracias por su confianza.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if ((budgetDoc?.status || doc.status) === 'borrador') {
                        const updatedBudget: GestarianDocument = {
                          ...(budgetDoc || doc),
                          status: 'enviado',
                          sentAt: new Date().toISOString(),
                        };
                        onUpdateDocument(updatedBudget);
                        const currentStored = getStoredDocuments();
                        const nextDocs = currentStored.map((d) => (d.id === updatedBudget.id ? updatedBudget : d));
                        saveStoredDocuments(nextDocs);
                        window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
                      }
                      if (onShowToast) onShowToast(`Presupuesto ${budgetNumberOnly} preparado para WhatsApp con enlace ultra corto.`, 4000);
                    }}
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                    title="Enviar por WhatsApp (Enlace Ultra Corto)"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                ) : null}

                {/* Email Directo con Documento Adjunto (Sin abrir Gmail) */}
                {(client?.email || doc.clientEmail) ? (
                  <button
                    type="button"
                    disabled={isSendingBudgetEmail}
                    onClick={handleSendBudgetViaEmail}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer disabled:opacity-50"
                    title="Enviar por Email Directo con Documento Adjunto (sin abrir Gmail)"
                  >
                    {isSendingBudgetEmail ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                  </button>
                ) : null}

                {/* Imprimir */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(budgetDoc)}
                  className="p-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                  title="Imprimir / Guardar"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'cita': {
        const effectiveHistory: CitaProposal[] = (() => {
          if (doc.citaHistory && doc.citaHistory.length > 0) {
            return doc.citaHistory;
          }
          const items: CitaProposal[] = [];
          if (doc.vehicleDeliveryDate || doc.proposedDeliveryDate) {
            const isAccepted = isCitaAccepted || doc.deliveryDateStatus === 'accepted';
            items.push({
              id: `prop_def_${doc.id}`,
              date: doc.vehicleDeliveryDate || doc.proposedDeliveryDate || doc.date,
              proposedBy: doc.deliveryDateProposedBy || 'workshop',
              proposedByName: doc.deliveryDateProposedBy === 'client' ? (client?.name || doc.clientName) : 'Taller Gestarian',
              timestamp: doc.sentAt || doc.createdAt || new Date().toISOString(),
              status: isAccepted ? 'accepted' : 'pending',
              acceptedBy: doc.citaAcceptedBy || (isAccepted ? (doc.deliveryDateProposedBy === 'client' ? 'workshop' : 'client') : undefined),
              acceptedByName: doc.citaAcceptedByName || (isAccepted ? (doc.deliveryDateProposedBy === 'client' ? 'Taller Gestarian' : `Cliente (${client?.name || doc.clientName})`) : undefined),
              acceptedAt: doc.citaAcceptedAt || doc.confirmedAt || doc.updatedAt,
            });
          }
          return items;
        })();

        return (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-[#0F2942] font-black text-base uppercase tracking-wide">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Datos de la Cita de Taller</span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                isCitaConfirmed ? 'bg-emerald-100 text-emerald-800' : isCitaAccepted ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isCitaConfirmed ? 'Cita Confirmada' : isCitaAccepted ? 'Cita Aceptada (Azul)' : 'Pendiente Cita (Naranja)'}
              </span>
            </div>

            {/* Banner de fecha de entrega propuesta por el cliente */}
            {isClientProposedPending && (
              <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 shadow-lg my-3 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-amber-900 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
                  <Calendar className="w-5 h-5 text-amber-600 animate-bounce" />
                  <span>NUEVA FECHA DE ENTREGA PROPUESTA POR EL CLIENTE</span>
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
                  El cliente propone esta fecha. Pulse Aceptar para activar la cita en el Roadmap (pasa a Azul) o Denegar para proponer otra fecha.
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
                    <span>Denegar / Proponer Otra</span>
                  </button>
                </div>
              </div>
            )}

            {/* Banner de propuesta enviada por el taller */}
            {isWorkshopProposedPending && (
              <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-4 shadow-sm my-3 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-900 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1">
                  <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>Propuesta de fecha enviada al cliente (Esperando aprobaciÃ³n):</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-blue-700 font-mono tracking-tight my-2">
                  {doc.proposedDeliveryDate || doc.vehicleDeliveryDate}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCounterProposalDate(doc.proposedDeliveryDate || doc.vehicleDeliveryDate || new Date().toISOString().split('T')[0]);
                    setShowDenyCalendarModal(true);
                  }}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Modificar / Proponer Otra Fecha
                </button>
              </div>
            )}

            {/* Bloque de Cita Acordada y AceptaciÃ³n con Aceptada por y Fecha/Hora */}
            {(isCitaAccepted || isCitaConfirmed) && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-sm my-3 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 text-xs sm:text-sm font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>FECHA DE CITA ACORDADA Y ACEPTADA</span>
                </div>
                <div className="text-2xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight text-center my-1">
                  {doc.vehicleDeliveryDate || doc.proposedDeliveryDate}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Aceptada por:</span>
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      {doc.citaAcceptedByName || (doc.citaAcceptedBy === 'client' ? `Cliente (${client?.name || doc.clientName})` : 'Taller Gestarian')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Fecha y Hora de AceptaciÃ³n:</span>
                    <span className="font-extrabold text-slate-900 text-sm font-mono flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      {formatTimestamp(doc.citaAcceptedAt || doc.confirmedAt || doc.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha propuesta por el usuario al enviar el presupuesto */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Fecha propuesta por taller
                </span>
                <div className="font-bold text-slate-900 text-base flex items-center gap-2 mt-1 font-mono">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{doc.vehicleDeliveryDate || doc.proposedDeliveryDate || doc.dueDate || 'Fecha no fijada'}</span>
                </div>
              </div>

              {/* Estado de negociaciÃ³n de cita */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Estado de la Cita / Acuerdo
                </span>
                <div className="font-bold text-slate-900 text-base flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isCitaConfirmed
                      ? `VehÃ­culo recibido (${doc.confirmedAt?.split('T')[0] || 'Confirmado'})`
                      : isCitaAccepted
                      ? `Fecha Acordada: ${doc.vehicleDeliveryDate}`
                      : 'NegociaciÃ³n de fecha en curso (Naranja)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Historial de Propuestas de Cita */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Historial de Propuestas de Cita</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                  {effectiveHistory.length} {effectiveHistory.length === 1 ? 'propuesta' : 'propuestas'}
                </span>
              </div>

              {effectiveHistory.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2 text-center">No hay registro de propuestas anteriores.</div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {effectiveHistory.map((item, idx) => (
                    <div key={item.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 font-mono text-sm">{item.date}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.proposedBy === 'client' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          }`}>
                            Propuesta por {item.proposedBy === 'client' ? `Cliente (${client?.name || doc.clientName})` : 'Taller Gestarian'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          item.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          item.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {item.status === 'accepted' ? 'ðŸŸ¢ ACEPTADA' : item.status === 'rejected' ? 'ðŸ”´ DENEGADA / REEMPLAZADA' : 'ðŸŸ  PENDIENTE'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 gap-1">
                        <span>
                          Propuesta enviada el: <strong className="text-slate-700 font-mono">{formatTimestamp(item.timestamp)}</strong>
                        </span>
                        {item.status === 'accepted' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                            Aceptada por <strong>{item.acceptedByName || (item.acceptedBy === 'client' ? 'Cliente' : 'Taller')}</strong> el <span className="font-mono">{formatTimestamp(item.acceptedAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isCitaConfirmed && isCitaAccepted && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmCita}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar RecepciÃ³n de VehÃ­culo</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'taller':
        return (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-[#0F2942] font-black text-base uppercase tracking-wide">
                <Wrench className="w-5 h-5 text-orange-600" />
                <span>Datos de ReparaciÃ³n y Taller</span>
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
                  Operario Activo en la ReparaciÃ³n
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

            {/* DescripciÃ³n de Trabajos */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                DescripciÃ³n de los Trabajos a Realizar
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

            {/* Acciones e Icono de ImÃ¡genes */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowImagesModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>ImÃ¡genes del Expediente ({doc.vehicleImages?.length || 0})</span>
              </button>

              {!isTallerEnReparacion && !isTallerFinalizado && isTallerEnviar && (
                <button
                  type="button"
                  onClick={handleEnviarATaller}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Iniciar ReparaciÃ³n en Taller</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );

      case 'facturacion':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-[#0F2942] font-black text-base uppercase tracking-wide">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Factura Generada y Datos de FacturaciÃ³n</span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                isFacturaGenerada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isFacturaGenerada ? 'Factura Emitida' : canInvoice ? 'Lista para Facturar' : 'Borrador / Pendiente'}
              </span>
            </div>

            {/* Hoja A4 / PrevisualizaciÃ³n de Factura */}
            <div className="bg-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center">
              <div className="bg-white w-full max-w-xl p-5 sm:p-6 rounded-xl border border-slate-300 shadow-md space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="font-black text-lg text-slate-900">{doc.issuerName || 'TALLER GESTARIAN'}</div>
                    <div className="text-xs text-slate-500 font-mono">CIF: {doc.issuerCif || 'B-12345678'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Factura de ReparaciÃ³n</div>
                    <div className="text-base font-black font-mono text-slate-900">{invoiceNumberOnly}</div>
                    <div className="text-[11px] text-slate-500">{invoiceDoc.date || doc.date}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Cliente:</span>
                    <span className="font-bold text-slate-800">{client?.name || doc.clientName || 'Cliente'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">VehÃ­culo:</span>
                    <span className="font-bold text-slate-800">
                      {[doc.vehicleBrand, doc.vehicleModel].filter(Boolean).join(' ') || doc.vehiclePlate || 'VehÃ­culo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-700 border-b pb-1 flex justify-between">
                    <span>Concepto</span>
                    <span>Importe</span>
                  </div>
                  {doc.items && doc.items.length > 0 ? (
                    doc.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-slate-600 py-0.5">
                        <span className="truncate pr-2">{it.description}</span>
                        <span className="font-semibold whitespace-nowrap">{it.amount.toFixed(2)} â‚¬</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic py-1">Sin partidas especificadas.</div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    <div>IVA (21%): {((doc.total || 0) * 0.21 / 1.21).toFixed(2)} â‚¬</div>
                    <div>Base Imponible: {((doc.total || 0) / 1.21).toFixed(2)} â‚¬</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold block">Total Factura:</span>
                    <span className="text-lg font-black text-emerald-700">{(doc.total || 0).toFixed(2)} â‚¬</span>
                  </div>
                </div>
              </div>

              {/* Estado de envÃ­o de factura y aviso de activaciÃ³n de Cobro */}
              {isFacturaEnviada ? (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Factura enviada al cliente el <strong className="font-mono text-emerald-800">{invoiceSentDateDisplay}</strong>.
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                    Parada Cobro Activada
                  </span>
                </div>
              ) : isFacturaGenerada ? (
                <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      Factura generada pero <strong>pendiente de enviar</strong> al cliente. EnvÃ­ela por WhatsApp o Email para activar la parada Cobro.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSendInvoiceViaWhatsApp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendInvoiceViaEmail}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Enviar Email</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* BotÃ³n ver factura generada en Hoja A4 completa e iconos de acciones */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 w-full">
                {/* BotÃ³n Ver Factura Generada */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(invoiceDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Factura Generada (Hoja A4)</span>
                </button>

                {/* Enviar WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendInvoiceViaWhatsApp}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                  title="Enviar Factura por WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>

                {/* Enviar Email */}
                <button
                  type="button"
                  onClick={handleSendInvoiceViaEmail}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                  title="Enviar Factura por Email"
                >
                  <Mail className="w-5 h-5" />
                </button>

                {/* Icono de Expedientes */}
                <button
                  type="button"
                  onClick={() => {
                    if (onShowToast) onShowToast(`Accediendo al expediente ${doc.expediente || doc.number}`);
                  }}
                  className="p-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                  title="Icono de Expedientes / Acceso a Datos del Expediente"
                >
                  <FolderArchive className="w-5 h-5" />
                </button>

                {/* Icono de Guardar */}
                <button
                  type="button"
                  onClick={() => {
                    if (onShowToast) onShowToast(`Factura ${invoiceNumberOnly} guardada con Ã©xito. Recuerde enviarla al cliente.`, 6000);
                  }}
                  className="p-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                  title="Guardar Factura / Descargar PDF"
                >
                  <Download className="w-5 h-5" />
                </button>

                {/* Icono de Imprimir */}
                <button
                  type="button"
                  onClick={() => setViewerDoc(invoiceDoc)}
                  className="p-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                  title="Imprimir Factura"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>

              {!isFacturaGenerada && canInvoice && (
                <div className="mt-4 pt-3 border-t border-slate-200 w-full flex justify-center">
                  <button
                    type="button"
                    onClick={handleFacturar}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Confirmar y Emitir Factura Oficial</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'cobro':
        return null;

      default:
        return null;
    }
  };

  return (
    <>
      {/* Toast de confirmaciÃ³n estÃ¡tico sin animaciÃ³n (Aceptar-Cancelar) */}
      {confirmToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border-2 border-amber-500 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                {confirmToast.isLocked ? 'Parada en Espera' : 'Confirmar Avance de Estado'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                {confirmToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setConfirmToast(null)}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
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
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-xl cursor-pointer shadow-md"
              >
                Aceptar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full my-2">
        <div className="flex flex-col space-y-[10px] lg:space-y-[30px]">
          {steps.map((st) => {
            const isExpanded = expandedStepId === st.id;
            const bgClass = getStepBgClass(st.id);

            const handleButtonClick = () => {
              if (st.id === 'cobro') {
                if (!isFacturacionGreen) {
                  setConfirmToast({
                    stepName: 'Cobro',
                    message: 'La parada "Cobro" estÃ¡ desactivada. Se activarÃ¡ automÃ¡ticamente cuando la parada "FacturaciÃ³n" muestre "FACTURA ENVIADA" con la fecha de envÃ­o debajo tras enviarse por WhatsApp o Email.',
                    isLocked: true,
                  });
                } else {
                  setShowPaymentsControlModal(true);
                }
              } else {
                setExpandedStepId(isExpanded ? null : st.id);
              }
            };

            return (
              <div
                key={st.id}
                className="w-[calc(100vw-40px)] md:w-[calc(100vw-80px)] lg:w-[calc(100vw-600px)] mx-auto flex flex-col transition-all duration-300"
              >
                <div
                  onClick={() => handleStepCardClick(st.id)}
                  className={`w-full p-3.5 sm:p-5 rounded-2xl border-2 shadow-md flex items-center justify-between transition-all duration-200 cursor-pointer ${bgClass} ${
                    (st.id === 'presupuesto' || st.id === 'cita') && isClientProposedPending
                      ? 'ring-4 ring-amber-400/70 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.9)] animate-pulse'
                      : ''
                  }`}
                >
                  {/* BotÃ³n + / - solo a la izquierda (tamaÃ±o x2, un solo cÃ­rculo sin sombrear) */}
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
                          : 'Parada Cobro desactivada (requiere envÃ­o de factura)'
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

                  {/* TÃ­tulo y Estado en el centro (mÃ¡ximo 2 lÃ­neas de texto) */}
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

                  {/* Espaciador a la derecha para mantener el tÃ­tulo en el centro exacto */}
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
            onShowToast(`Factura enviada el ${dateFormatted}. Parada FacturaciÃ³n en verde y parada Cobro activada.`);
          }
        }}
        onAcceptBudget={() => {}}
        onConvertToInvoice={() => {}}
        onEditDocument={() => {}}
        onOpenAgendaForBudget={() => {}}
        onShowToast={onShowToast}
      />

      {/* Visor de ImÃ¡genes cuando se pulsa en Taller */}
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
      {showPaymentsControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header del Panel de Cobros */}
            <div className="bg-[#0F2942] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Panel de Control de Cobros</h3>
                  <p className="text-xs text-slate-300">
                    Expediente: <span className="font-mono text-emerald-400 font-bold">{doc.expediente || 'EXP-001'}</span> â€¢ {client?.name || doc.clientName || 'Cliente'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentsControlModal(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Resumen Metricas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Factura</span>
                  <span className="text-base font-black text-slate-900">{(doc.total || 0).toFixed(2)} â‚¬</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Cobrado</span>
                  <span className="text-base font-black text-emerald-900">{totalPaid.toFixed(2)} â‚¬</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pendiente</span>
                  <span className="text-base font-black text-amber-900">
                    {Math.max(0, (doc.total || 0) - totalPaid).toFixed(2)} â‚¬
                  </span>
                </div>
              </div>

              {/* Banner de Feedback Inmediato al Registrar Abono */}
              {lastAbonoFeedback && (
                <div className={`p-4 rounded-xl border transition-all ${
                  lastAbonoFeedback.isTotal
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${lastAbonoFeedback.isTotal ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          {lastAbonoFeedback.isTotal ? 'Â¡Abono Total Completado (100% Cobrado)!' : 'Abono Parcial Registrado'}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Importe abonado: <strong className="font-mono">{lastAbonoFeedback.amount.toFixed(2)} â‚¬</strong> ({lastAbonoFeedback.method} - {lastAbonoFeedback.date}).
                          {lastAbonoFeedback.isTotal
                            ? ' El saldo del expediente ha quedado totalmente liquidado.'
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acciones de envÃ­o directo segÃºn sea Abono Total o Abono Parcial */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    {lastAbonoFeedback.isTotal ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSendInvoiceTotalViaWhatsApp}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar Factura por WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendInvoiceTotalViaEmail}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Enviar Factura por Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewerDoc(invoiceDoc || doc)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura Oficial</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSendPartialReceiptViaWhatsApp(lastAbonoFeedback.amount, lastAbonoFeedback.date, lastAbonoFeedback.method, lastAbonoFeedback.receiptNum)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar Recibo de Abono Parcial (WhatsApp)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendPartialReceiptViaEmail(lastAbonoFeedback.amount, lastAbonoFeedback.date, lastAbonoFeedback.method, lastAbonoFeedback.receiptNum)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Enviar Recibo de Abono Parcial (Email)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(lastAbonoFeedback.amount, lastAbonoFeedback.date, lastAbonoFeedback.method, lastAbonoFeedback.receiptNum)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Recibo Oficial (A4)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Panel Permanente de Acciones de EnvÃ­o segÃºn Estado del Abono */}
              {isPaid ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 p-4 sm:p-5 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-black uppercase tracking-wider text-emerald-950">
                          Abono Total de la Factura
                        </h4>
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full">
                          100% Cobrado / Liquidado
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        La factura estÃ¡ totalmente abonada. El importe pendiente es de <strong>0,00 â‚¬</strong>. Puede enviar la factura oficial con justificante de cobro o consultar el historial de abonos a continuaciÃ³n.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono">
                        <span className="text-slate-600">Total Factura: <strong>{doc.total.toFixed(2)} â‚¬</strong></span>
                        <span className="text-emerald-700">Total Abonado: <strong>{totalPaid.toFixed(2)} â‚¬</strong></span>
                        <span className="text-emerald-800 font-bold">Saldo Pendiente: 0,00 â‚¬</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={handleSendInvoiceTotalViaWhatsApp}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Factura por WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendInvoiceTotalViaEmail}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Enviar Factura por Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewerDoc(invoiceDoc || doc)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Factura Oficial</span>
                    </button>
                  </div>
                </div>
              ) : isPartiallyPaid ? (
                <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Abono Parcial Registrado â€” Enviar Recibo al Cliente
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Total abonado: <strong>{totalPaid.toFixed(2)} â‚¬</strong> â€¢ Pendiente: <strong>{Math.max(0, (doc.total || 0) - totalPaid).toFixed(2)} â‚¬</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(() => {
                      const lastPay = (doc.payments && doc.payments.length > 0) ? doc.payments[doc.payments.length - 1] : null;
                      const amount = lastPay?.amount || totalPaid;
                      const date = lastPay?.date || new Date().toISOString().split('T')[0];
                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSendPartialReceiptViaWhatsApp(amount, date, 'Abono Parcial')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Enviar Recibo de Abono Parcial (WhatsApp)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPartialReceiptViaEmail(amount, date, 'Abono Parcial')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Enviar Recibo de Abono Parcial (Email)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(amount, date, 'Abono Parcial')}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Recibo Oficial (A4)</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : null}

              {/* Registro Formulario Nuevo Cobro (Oculto cuando el abono es total) */}
              {!isPaid && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-[#0F2942] uppercase tracking-wider flex items-center justify-between">
                    <span>AÃ±adir Nuevo Pago / Cobro</span>
                    {Math.max(0, (doc.total || 0) - totalPaid) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAddPayment(Math.max(0, (doc.total || 0) - totalPaid), new Date().toISOString().split('T')[0], 'Efectivo')}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-extrabold underline cursor-pointer"
                      >
                        Saldar Total Pendiente
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Importe (â‚¬)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">MÃ©todo de Pago</label>
                      <select
                        value={newPaymentMethod}
                        onChange={(e) => setNewPaymentMethod(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta Bancaria</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Bizum">Bizum</option>
                        <option value="Financiacion">FinanciaciÃ³n</option>
                        <option value="Cheque">Cheque / PagarÃ©</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Fecha</label>
                      <input
                        type="date"
                        value={newPaymentDate}
                        onChange={(e) => setNewPaymentDate(e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const amount = parseFloat(newPaymentAmount);
                        if (isNaN(amount) || amount <= 0) {
                          if (onShowToast) onShowToast('Por favor introduzca un importe vÃ¡lido.');
                          return;
                        }
                        handleAddPayment(amount, newPaymentDate, newPaymentMethod);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registrar Pago</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Pagos Existentes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Historial de Abonos Registrados ({doc.payments?.length || 0})
                </span>

                {(!doc.payments || doc.payments.length === 0) ? (
                  <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
                    No se ha registrado ningÃºn cobro aÃºn.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {doc.payments.map((p, pIdx) => (
                      <div key={p.id || pIdx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-slate-800">{p.amount.toFixed(2)} â‚¬</span>
                            <span className="text-slate-400 text-[11px] ml-2">({p.date})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendPartialReceiptViaWhatsApp(p.amount, p.date, 'Abono')}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                            title="Enviar recibo de este cobro por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPartialReceiptViaEmail(p.amount, p.date, 'Abono')}
                            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors cursor-pointer"
                            title="Enviar recibo de este cobro por Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(p.amount, p.date, 'Abono')}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Ver recibo oficial (A4)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar registro de pago"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPaymentsControlModal(false)}
                className="px-5 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

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
              Seleccione en el calendario la nueva fecha de entrega propuesta para enviar al cliente. El cliente podrÃ¡ aceptarla o solicitar otra fecha.
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
    </>
  );
};

