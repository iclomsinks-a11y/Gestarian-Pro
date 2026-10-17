import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit3,
  Download,
  Loader2,
  Save,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { GestarianDocument, DocumentPayment, InternalNotification, getDefaultIvaRate } from '../types';
import { generateDocumentPdf, printDocumentPdf } from '../services/pdfGenerator';
import { ReceivedInvoiceViewer } from './ReceivedInvoiceViewer';
import { DocumentSheet, isInvoiceType, isBudgetType } from './DocumentSheet';
import {
  getStoredDocuments,
  saveStoredDocuments,
  getStoredNotifications,
  saveStoredNotifications,
} from '../services/storage';
import { getShortDocumentUrl } from '../services/documentDispatchService';

interface DocumentViewerModalProps {
  isOpen: boolean;
  document: GestarianDocument | null;
  onClose: () => void;
  isClientView?: boolean;
  userLogoUrl?: string;
  onConfirmInvoice?: (docId: string) => void;
  onSendInvoice?: (docId: string) => void;
  onAcceptBudget?: (doc: GestarianDocument) => void;
  onConvertToInvoice?: (budget: GestarianDocument) => void;
  onEditDocument?: (doc: GestarianDocument) => void;
  onOpenAgendaForBudget?: (budget: GestarianDocument) => void;
  onNavigateToExpediente?: (expNum: string) => void;
  onShowToast?: (msg: string, duration?: number) => void;
  onDiscardInvoice?: (docId: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  document: doc,
  onClose,
  isClientView = false,
  userLogoUrl,
  onConfirmInvoice,
  onSendInvoice,
  onAcceptBudget,
  onConvertToInvoice,
  onEditDocument,
  onOpenAgendaForBudget,
  onNavigateToExpediente,
  onShowToast,
  onDiscardInvoice,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [editableDoc, setEditableDoc] = useState<GestarianDocument | null>(doc);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasSavedAfterEdit, setHasSavedAfterEdit] = useState<boolean>(false);

  React.useEffect(() => {
    if (doc) {
      setEditableDoc(doc);
      setIsEditing(false);
      setHasSavedAfterEdit(false);
    }
  }, [doc, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('document-viewer-open');
      return () => {
        document.body.classList.remove('document-viewer-open');
        document.body.classList.remove('is-printing-document');
      };
    }
  }, [isOpen]);

  if (!isOpen || !doc) return null;

  // VISOR EXCLUSIVO PARA FACTURAS RECIBIDAS (adjuntos del proveedor / escáner)
  if (doc.type === 'factura_recibida') {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full h-[70vh] max-h-[70vh] bg-slate-950 shadow-2xl overflow-hidden flex flex-col items-center justify-center border-b border-white/10 shrink-0">
          <ReceivedInvoiceViewer document={doc} />
        </div>
        <div className="w-full h-[30vh] max-h-[30vh] flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2.5 px-10 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 text-white font-black text-sm uppercase tracking-wider rounded-full shadow-2xl border-2 border-emerald-400/80 hover:border-emerald-300 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Volver</span>
          </button>
        </div>
      </div>
    );
  }

  const isInvoice = isInvoiceType(doc.type);
  const isBudget = isBudgetType(doc.type);
  const isBudgetOrInvoice = isBudget || isInvoice;
  const docTitle = isInvoice ? 'Factura' : isBudget ? 'Presupuesto' : 'Documento';
  const effectiveLogoUrl = userLogoUrl || (doc as any).issuerLogoUrl || (doc as any).issuerLogo;
  const sheetDoc: GestarianDocument = editableDoc || doc;

  const handleUpdateItem = (idx: number, field: string, value: any) => {
    if (!editableDoc) return;
    const newItems = [...editableDoc.items];
    const val = field === 'quantity' || field === 'unitPrice' ? Number(value) || 0 : value;
    newItems[idx] = { ...newItems[idx], [field]: val };
    const q = Number(newItems[idx].quantity) || 0;
    const p = Number(newItems[idx].unitPrice) || 0;
    newItems[idx].amount = q * p;

    const newSubtotal = newItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const shouldApplyIva = isInvoice ? true : editableDoc.applyIva;
    const rateVal = Number(editableDoc.ivaRate) || getDefaultIvaRate();
    const newIva = shouldApplyIva ? newSubtotal * (rateVal / 100) : 0;
    const newTotal = newSubtotal + newIva;

    setEditableDoc({
      ...editableDoc,
      items: newItems,
      subtotal: newSubtotal,
      ivaAmount: newIva,
      total: newTotal,
    });
  };

  const handleSaveEdit = () => {
    if (!editableDoc) return;
    setIsEditing(false);
    setHasSavedAfterEdit(true);
    try {
      const stored = getStoredDocuments();
      const updatedList = stored.map((d) => (d.id === editableDoc.id ? editableDoc : d));
      saveStoredDocuments(updatedList);
      window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
    } catch (e) {
      console.error(e);
    }
    if (onEditDocument) {
      onEditDocument(editableDoc);
    }
    if (onShowToast) {
      onShowToast(`${docTitle} ${editableDoc.number} guardado correctamente.`);
    }
  };

  // Cálculos de cobro para aviso en pantalla
  const docPayments: DocumentPayment[] = (sheetDoc as any).payments || [];
  const totalPaid = docPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isTotalPaid =
    (sheetDoc.total > 0 && totalPaid >= sheetDoc.total - 0.01) ||
    sheetDoc.status === 'pagada' ||
    (sheetDoc.status as string) === 'liquidada';

  const isSent =
    sheetDoc.status === 'enviado' ||
    sheetDoc.status === 'enviada' ||
    Boolean(sheetDoc.sentAt) ||
    doc.status === 'enviado' ||
    doc.status === 'enviada' ||
    Boolean(doc.sentAt);

  const handlePrint = () => {
    document.body.classList.add('is-printing-document');
    try {
      window.print();
    } catch (e) {
      console.warn('window.print() not available, probando generador PDF:', e);
      printDocumentPdf(sheetDoc, { userLogoUrl: effectiveLogoUrl });
    } finally {
      setTimeout(() => {
        document.body.classList.remove('is-printing-document');
      }, 1000);
    }
    if (!isClientView && isInvoice && onShowToast) {
      onShowToast('Factura oficial enviada a impresión.', 5000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!doc || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      if (onShowToast) {
        onShowToast(`Generando PDF oficial en formato A4 para ${doc.number}...`, 2500);
      }
      await generateDocumentPdf(sheetDoc, { userLogoUrl: effectiveLogoUrl });
      if (onShowToast) {
        onShowToast(`PDF oficial de ${docTitle} ${doc.number} descargado correctamente.`, 4000);
      }
    } catch (err) {
      console.error('Error al generar PDF con jsPDF:', err);
      if (onShowToast) {
        onShowToast('Abriendo ventana de impresión...', 3000);
      }
      try {
        window.print();
      } catch (printErr) {
        console.warn('Fallback print error:', printErr);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const clientPhoneDigits = (sheetDoc.clientPhone || '').replace(/\D/g, '');
  const whatsappNumber = clientPhoneDigits.startsWith('34') ? clientPhoneDigits : `34${clientPhoneDigits}`;

  return (
    <div
      id="document-viewer-modal-container"
      className={`document-viewer-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible ${
        isClientView ? 'bg-[#0F172A]/90 backdrop-blur-sm' : 'bg-[#0F172A]/50 backdrop-blur-xs'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Contenedor de la hoja: en móvil/tablet se ajusta a la pantalla sin recortes */}
      <div className="document-sheet-outer-card w-full sm:w-[95vw] md:w-[90vw] lg:w-[80vw] max-w-[1100px] my-1 sm:my-6 bg-white border border-[#D5D2C9] rounded-2xl shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[92vh] overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none print:my-0 print:w-full">
        {/* Hoja oficial con diseño unificado exacto a la captura */}
        <div
          id="printable-document-sheet"
          className="p-3 sm:p-8 md:p-10 overflow-y-auto bg-white flex-1 print:p-0 print:overflow-visible print:m-0 print:w-full"
        >
          <DocumentSheet
            document={sheetDoc}
            logoUrl={effectiveLogoUrl}
            isEditing={isEditing}
            onUpdateItem={handleUpdateItem}
            onUpdateNotes={(notes) =>
              setEditableDoc((prev) => (prev ? { ...prev, notes } : null))
            }
          />

          {/* Aviso de estado oficial (solo en pantalla, oculto en impresión y budgets si aplica) */}
          {isBudgetOrInvoice && isSent && (
            <div className="w-full bg-blue-50 border-2 border-blue-500 rounded-xl p-3.5 sm:p-4 text-center mt-5 print:hidden no-print">
              <div className="text-sm sm:text-base font-black text-blue-900 uppercase tracking-wide">
                {isBudget ? 'PRESUPUESTO ENVIADO AL CLIENTE' : 'FACTURA ENVIADA AL CLIENTE'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider mt-1">
                {isBudget
                  ? 'PENDIENTE DE ACEPTACIÓN'
                  : isTotalPaid
                  ? 'FACTURA ABONADA'
                  : 'PENDIENTE DE COBRO'}
              </div>
            </div>
          )}

          {/* ICONOS FLOTANTES SIN RELLENO NI ENVOLTORIO COMO EN LA CAPTURA (Ocultos en impresión) */}
          <div className="flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-10 pt-5 pb-1 w-full px-2 print:hidden no-print">
            {/* Descargar PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="p-1.5 bg-transparent hover:opacity-80 text-sky-600 transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
              title="Descargar PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin text-sky-600" />
              ) : (
                <Download className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
              )}
            </button>

            {/* Modificar / Guardar (solo si está habilitada la edición) */}
            {!isClientView && isBudgetOrInvoice && !isEditing && (!doc.isLocked || isBudget) && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 bg-transparent hover:opacity-80 text-blue-800 transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
                title={isBudget ? 'Modificar Presupuesto' : 'Modificar Factura'}
              >
                <Edit3 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={handleSaveEdit}
                className="p-1.5 bg-transparent hover:opacity-80 text-emerald-600 transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
                title={isBudget ? 'Guardar Presupuesto' : 'Guardar Factura'}
              >
                <Save className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
              </button>
            )}

            {/* WhatsApp */}
            {(hasSavedAfterEdit || !isEditing) && clientPhoneDigits && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  `*${doc.issuerName}*\n\n` +
                    `Estimado/a ${sheetDoc.clientName},\n` +
                    `Le remitimos su ${
                      isBudget ? 'Presupuesto' : 'Factura Oficial'
                    } *${sheetDoc.number}* por importe de *${(
                      sheetDoc.total || 0
                    ).toFixed(2)} €*.\n\n` +
                    `📄 *Documento oficial adjunto en vista de impresión descargable:*\n` +
                    `${getShortDocumentUrl(sheetDoc)}\n\n` +
                    `Gracias por su confianza.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const nowIso = new Date().toISOString();
                  const updated: GestarianDocument = {
                    ...sheetDoc,
                    status: isBudget ? 'enviado' : 'enviada',
                    sentAt: nowIso,
                  };
                  try {
                    const stored = getStoredDocuments();
                    const updatedList = stored.map((d) =>
                      d.id === updated.id ? updated : d
                    );
                    saveStoredDocuments(updatedList);
                    window.dispatchEvent(
                      new CustomEvent('gestarian_documents_updated')
                    );
                  } catch (e) {
                    console.error(e);
                  }
                  setEditableDoc(updated);

                  const newNotif: InternalNotification = {
                    id: `notif_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 4)}`,
                    title: `${isBudget ? 'Presupuesto' : 'Factura'} ${
                      sheetDoc.number
                    } Enviado al Cliente`,
                    message: `${isBudget ? 'Presupuesto' : 'Factura'} enviado a ${
                      sheetDoc.clientName
                    } (${
                      sheetDoc.vehiclePlate || 'Vehículo'
                    }). Documento oficial adjunto en vista de impresión descargable desde gestarian.com.`,
                    timestamp: nowIso,
                    read: false,
                    type: 'budget_sent_client',
                    budgetId: sheetDoc.id,
                    documentNumber: sheetDoc.number,
                    totalAmount: sheetDoc.total,
                    attachmentType: isBudget ? 'presupuesto' : 'factura',
                  };
                  const storedNotifs = getStoredNotifications();
                  saveStoredNotifications([newNotif, ...storedNotifs]);
                  window.dispatchEvent(
                    new CustomEvent('gestarian_notifications_updated')
                  );
                }}
                className="p-1.5 bg-transparent hover:opacity-80 text-emerald-600 transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
                title="Enviar por WhatsApp"
              >
                <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
              </a>
            )}

            {/* Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 bg-transparent hover:opacity-80 text-blue-900 transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
              title="Imprimir Factura Oficial (A4)"
              aria-label="Imprimir Factura Oficial"
            >
              <Printer className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
            </button>

            {/* Cerrar Visor */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-transparent hover:opacity-80 text-slate-700 transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
              title="Cerrar"
            >
              <X className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
