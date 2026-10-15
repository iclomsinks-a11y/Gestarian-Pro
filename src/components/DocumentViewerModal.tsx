import React, { useState } from 'react';
import {
  X,
  Share2,
  Lock,
  CheckCircle,
  CheckCircle2,
  Euro,
  Send,
  Printer,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Edit3,
  FileCheck2,
  AlertTriangle,
  Download,
  FileText,
  ShieldCheck,
  Eye,
  Clock,
  Loader2,
  ExternalLink,
  Building2,
  Save,
  Check,
  MessageCircle,
  Mail,
  Car,
  Home
} from 'lucide-react';
import { GestarianDocument, DocumentPayment, InternalNotification, getDefaultIvaRate } from '../types';
import { generateDocumentPdf } from '../services/pdfGenerator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReceivedInvoiceViewer } from './ReceivedInvoiceViewer';
import { VerifactuSection } from './VerifactuSection';
import { getStoredDocuments, saveStoredDocuments, getStoredNotifications, saveStoredNotifications } from '../services/storage';

// Helper para generar el PDF de factura de proveedor en Base64 de forma inmediata y silenciosa
const generateSupplierInvoicePdfBase64 = (doc: GestarianDocument): string => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Header bar del proveedor
    pdf.setFillColor(15, 41, 66);
    pdf.rect(margin, currentY, contentWidth, 18, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text((doc.issuerName || 'PROVEEDOR').toUpperCase(), margin + 6, currentY + 11);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`FACTURA Nº ${doc.number}`, pageWidth - margin - 6, currentY + 11, { align: 'right' });

    currentY += 24;

    // Bloque Datos Proveedor y Cliente
    const colWidth = (contentWidth - 6) / 2;
    const col1X = margin;
    const col2X = margin + colWidth + 6;
    const boxHeight = 36;

    // Caja Proveedor
    pdf.setFillColor(248, 247, 243);
    pdf.setDrawColor(226, 224, 216);
    pdf.roundedRect(col1X, currentY, colWidth, boxHeight, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('PROVEEDOR / EMISOR', col1X + 5, currentY + 7);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.issuerName || 'Proveedor', col1X + 5, currentY + 14);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`CIF / NIF: ${doc.issuerCif || '---'}`, col1X + 5, currentY + 20);
    pdf.text(`Dirección: ${doc.issuerAddress || '---'}`, col1X + 5, currentY + 25);

    // Caja Cliente
    pdf.setFillColor(248, 247, 243);
    pdf.setDrawColor(226, 224, 216);
    pdf.roundedRect(col2X, currentY, colWidth, boxHeight, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('RECEPTOR / CLIENTE', col2X + 5, currentY + 7);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.clientName || 'Nuestra Empresa', col2X + 5, currentY + 14);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`CIF: ${doc.clientCif || '---'}`, col2X + 5, currentY + 20);
    pdf.text(`Fecha Emisión: ${doc.date}`, col2X + 5, currentY + 25);

    currentY += boxHeight + 8;

    // Tabla de Conceptos
    const tableBody = (doc.items && doc.items.length > 0)
      ? doc.items.map(it => [
          it.description || 'Concepto',
          String(it.quantity || 1),
          `${(it.unitPrice || 0).toFixed(2)} €`,
          `${(it.amount || 0).toFixed(2)} €`
        ])
      : [[
          'Gastos / Compra según factura recibida',
          '1',
          `${(doc.subtotal || doc.total).toFixed(2)} €`,
          `${(doc.subtotal || doc.total).toFixed(2)} €`
        ]];

    autoTable(pdf, {
      startY: currentY,
      head: [['Descripción / Concepto', 'Cant.', 'Precio Unit.', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 41, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 26, halign: 'right' },
        3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 40;

    // Totales
    const totalsWidth = 70;
    const totalsX = pageWidth - margin - totalsWidth;
    const totY = finalY + 8;

    pdf.setFillColor(248, 247, 243);
    pdf.setDrawColor(226, 224, 216);
    pdf.roundedRect(totalsX, totY, totalsWidth, 28, 2, 2, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Base Imponible:', totalsX + 4, totY + 6);
    pdf.text(`${(doc.subtotal || 0).toFixed(2)} €`, totalsX + totalsWidth - 4, totY + 6, { align: 'right' });

    pdf.text(`IVA (${doc.ivaRate || 21}%):`, totalsX + 4, totY + 12);
    pdf.text(`${(doc.ivaAmount || 0).toFixed(2)} €`, totalsX + totalsWidth - 4, totY + 12, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 41, 66);
    pdf.text('TOTAL FACTURA:', totalsX + 4, totY + 22);
    pdf.text(`${(doc.total || 0).toFixed(2)} €`, totalsX + totalsWidth - 4, totY + 22, { align: 'right' });

    const pdfDataUri = pdf.output('datauristring');
    return pdfDataUri.split(',')[1] || '';
  } catch (e) {
    console.error('Error generating fallback supplier invoice PDF:', e);
    return '';
  }
};

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
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const [confirmSendDialog, setConfirmSendDialog] = useState<boolean>(false);
  const [clientPreviewActive, setClientPreviewActive] = useState<boolean>(false);
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

  const handleUpdateItem = (idx: number, field: string, value: any) => {
    if (!editableDoc) return;
    const newItems = [...editableDoc.items];
    const val = (field === 'quantity' || field === 'unitPrice') ? (Number(value) || 0) : value;
    newItems[idx] = { ...newItems[idx], [field]: val };
    const q = Number(newItems[idx].quantity) || 0;
    const p = Number(newItems[idx].unitPrice) || 0;
    newItems[idx].amount = q * p;
    const isInvoice = (editableDoc.type || doc.type) === 'factura';
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
      onShowToast(`Presupuesto ${editableDoc.number} guardado correctamente.`);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      setClientPreviewActive(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmSendDialog) {
          setConfirmSendDialog(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmSendDialog]);

  if (!isOpen || !doc) return null;

  // VISOR EXCLUSIVO PARA FACTURAS RECIBIDAS (70% DE ALTURA, A TODO LO ANCHO DE LA PANTALLA, PANTALLA LIMPIA, SIN PEDIR PERMISOS, CON BOTÓN VOLVER CENTRADO EN EL ESPACIO VERTICAL RESTANTE DE 30VH)
  if (doc.type === 'factura_recibida') {
    return (
      <div 
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Visor que ocupa el 70% de la altura de la pantalla a todo lo ancho de la pantalla */}
        <div className="relative w-full h-[70vh] max-h-[70vh] bg-slate-950 shadow-2xl overflow-hidden flex flex-col items-center justify-center border-b border-white/10 shrink-0">
          <ReceivedInvoiceViewer document={doc} />
        </div>

        {/* Espacio vertical disponible entre el fondo de la pantalla y el borde inferior del visor (30vh), con el botón Volver centrado verticalmente */}
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

  const isInvoice = doc.type === 'factura';
  const isBudget = doc.type === 'presupuesto';
  const isBudgetOrInvoice = isBudget || isInvoice;
  const isReceipt = doc.type === 'recibo_abono' || (doc.type as string) === 'recibo';
  const docTitle = isInvoice ? 'Factura' : isReceipt ? 'Recibo de Abono' : 'Presupuesto';
  const isEffectiveClientView = isClientView || clientPreviewActive;
  const effectiveLogoUrl = userLogoUrl || (doc as any).issuerLogoUrl || (doc as any).issuerLogo;
  const headerCenteredTitle = isBudget ? 'PRESUPUESTO' : isInvoice ? 'FACTURA' : 'RECIBO';

  // Cálculos de abonos para Facturas y Recibos
  const docPayments: DocumentPayment[] = (doc as any).payments || [];
  const totalPaid = docPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isTotalPaid = (doc.total > 0 && totalPaid >= doc.total - 0.01) || doc.status === 'pagada' || (doc.status as string) === 'liquidada';
  const pendingAmount = Math.max(0, doc.total - totalPaid);

  // Botón Compartir que abre el modo compartir nativo del dispositivo (navigator.share)
  const handleNativeShare = async () => {
    setShareFeedback('');
    const shareTitle = `${docTitle} ${doc.number} - ${doc.issuerName}`;
    const vehiclePart = doc.vehiclePlate ? ` [Vehículo: ${doc.vehiclePlate}]` : '';
    const shareText = `${docTitle} ${doc.number}${vehiclePart} emitida a ${doc.clientName} por importe total de ${doc.total.toFixed(2)} €.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareFeedback('Compartido exitosamente');
      } catch (err: unknown) {
        // El usuario canceló o error del dispositivo
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard(shareUrl || shareText);
        }
      }
    } else {
      // Fallback si el navegador de escritorio no soporta navigator.share
      copyToClipboard(shareUrl || shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback('Enlace copiado al portapapeles para compartir');
    } catch {
      setShareFeedback('Datos listos para compartir');
    }
    setTimeout(() => setShareFeedback(''), 4000);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print() not available:', e);
    }
    if (!isEffectiveClientView && isInvoice && onShowToast) {
      onShowToast('Factura guardada con éxito. Recuerde enviarla al cliente.', 6000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!doc || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      if (onShowToast) {
        onShowToast(`Generando PDF oficial en formato A4 para ${doc.number}...`, 2500);
      }
      await generateDocumentPdf(doc, { userLogoUrl: effectiveLogoUrl });
      if (onShowToast) {
        onShowToast(`PDF oficial de ${docTitle} ${doc.number} descargado correctamente.`, 4000);
      }
    } catch (err) {
      console.error('Error al generar PDF con jsPDF:', err);
      if (onShowToast) {
        onShowToast('Hubo un problema al generar el PDF. Abriendo ventana de impresión...', 4000);
      }
      try {
        window.print();
      } catch (printErr) {
        console.warn('Error in fallback print:', printErr);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible ${
        isEffectiveClientView ? 'bg-[#0F172A]/90 backdrop-blur-sm' : 'bg-[#0F172A]/50 backdrop-blur-xs'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[95vw] md:w-[90vw] lg:w-[80vw] max-w-[1100px] my-4 sm:my-6 bg-[#F8F7F3] border border-[#D5D2C9] rounded-sm shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none print:my-0 print:w-full print:bg-white">
        
        {/* Barra superior de estado y acciones (Oculta en Impresión y Oculta en Presupuesto y Factura) */}
        {!isBudgetOrInvoice && (
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden no-print">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono px-2.5 py-1 bg-[#0F2942] text-white rounded-xs uppercase tracking-wide">
                {doc.type} {doc.number}
              </span>

              {/* Si es vista de cliente: Etiqueta formal para el cliente */}
              {isEffectiveClientView ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-xs">
                  <FileText className="w-3.5 h-3.5 text-blue-700" />
                  <span>Documento Oficial del Cliente</span>
                </span>
              ) : (
                /* Insignias de Estado internas de taller */
                <>
                  {doc.status === 'borrador' && (
                    <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-xs uppercase">
                      Borrador (Modificable)
                    </span>
                  )}
                  {doc.status === 'confirmada' && (
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-xs uppercase">
                      Confirmada para Envío
                    </span>
                  )}
                  {doc.status === 'enviada' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs uppercase">
                      <Lock className="w-3 h-3 text-emerald-700" />
                      Enviada (Inmutable)
                    </span>
                  )}
                  {doc.status === 'aceptado' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs uppercase">
                      <CheckCircle className="w-3 h-3 text-emerald-700" />
                      Presupuesto Aceptado
                    </span>
                  )}
                </>
              )}

              {doc.expediente && (
                <span className="hidden sm:inline-block text-[11px] font-mono text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-200">
                  Expediente: <strong>{doc.expediente}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Si es taller, botón para previsualizar vista cliente */}
              {!isClientView && (
                <button
                  type="button"
                  onClick={() => setClientPreviewActive(!clientPreviewActive)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xs border transition-colors cursor-pointer ${
                    clientPreviewActive
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white text-[#475569] border-[#D5D2C9] hover:bg-[#F8F7F3]'
                  }`}
                  title="Alternar entre vista de gestión y versión del cliente"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{clientPreviewActive ? 'Ver modo Taller' : 'Vista Cliente'}</span>
                </button>
              )}

              {/* Botón Descargar PDF en A4 (con estado de carga) */}
              <button
                id="btn-doc-descargar-pdf"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="Descargar documento oficial en PDF estándar A4"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] disabled:opacity-60 text-white text-xs font-bold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </button>

              {/* Botón Imprimir */}
              <button
                id="btn-doc-imprimir"
                onClick={handlePrint}
                title="Imprimir documento"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8F7F3] text-[#475569] border border-[#D5D2C9] text-xs font-medium uppercase rounded-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              {/* Botón Compartir Nativo del Dispositivo */}
              <button
                id="btn-doc-compartir"
                onClick={handleNativeShare}
                title="Compartir enlace o resumen desde su dispositivo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8F7F3] text-[#0F2942] border border-[#0F2942] text-xs font-semibold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </button>

              <button 
                onClick={onClose} 
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-sm transition-colors cursor-pointer"
                title="Cerrar visor"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback compartir */}
        {shareFeedback && (
          <div className="bg-[#0F2942] text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 print:hidden no-print">
            <span>{shareFeedback}</span>
            <button onClick={() => setShareFeedback('')} className="text-white/80 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Alerta de bloqueo si ya está enviada (Solo en modo taller interno) */}
        {!isEffectiveClientView && doc.isLocked && !isBudgetOrInvoice && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-6 py-2 text-xs flex items-center gap-2 shrink-0 print:hidden no-print">
            <Lock className="w-4 h-4 shrink-0 text-[#B45309]" />
            <span>
              <strong>Documento fiscal bloqueado:</strong> Esta factura ya ha sido enviada al cliente. Por imperativo legal y normativa de facturación, no puede ser modificada.
            </span>
          </div>
        )}

        {/* Área del Documento Imprimible / Factura o Presupuesto oficial (Hoja A4 limpia) */}
        {/* Área del Documento Imprimible / Factura o Presupuesto oficial (Hoja A4 limpia) */}
        <div id="printable-document-sheet" className="p-6 sm:p-8 md:p-10 overflow-y-auto bg-white flex-1 space-y-6 print:p-0 print:overflow-visible print:m-0 print:w-full">
          {/* PRIMERA LÍNEA: PRESUPUESTO tamaño x2 color gris a la izquierda, NÚMERO, EXPEDIENTE, FECHA EMISIÓN Y VALIDEZ a la derecha */}
          {isBudgetOrInvoice ? (
            <div>
              <div className="flex flex-wrap items-end justify-between pb-4 mb-5 border-b-2 border-slate-300 gap-3">
                <div className="flex items-center text-left">
                  <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-wider text-slate-400">
                    {isBudget ? 'PRESUPUESTO' : 'FACTURA'}
                  </h1>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
                    Nº {editableDoc?.number || doc.number} {doc.expediente ? `• EXP: ${editableDoc?.expediente || doc.expediente}` : ''}
                  </div>
                  {/* FECHA DE EMISIÓN Y VALIDEZ DEBAJO DE NÚMERO DE PRESUPUESTO Y EXPEDIENTE */}
                  <div className="text-xs sm:text-sm font-semibold font-mono text-slate-600 flex items-center justify-end gap-2.5">
                    <span>FECHA EMISIÓN: <strong>{editableDoc?.date || doc.date || new Date().toISOString().split('T')[0]}</strong></span>
                    <span>•</span>
                    <span>VALIDEZ: <strong>30 DÍAS</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Título Principal Centrado Oficial (RECIBO) */
            <div className="text-center pb-4 mb-4 border-b-2 border-[#0F2942]">
              <h1 className="doc-main-header-title text-2xl sm:text-3xl font-black uppercase tracking-widest text-[#0F2942]">
                {headerCenteredTitle}
              </h1>
              <p className="doc-main-header-sub text-xs text-[#64748B] font-mono mt-1 font-bold">
                JUSTIFICANTE OFICIAL DE PAGO Nº {doc.number} {doc.expediente ? `• EXPEDIENTE ${doc.expediente}` : ''}
              </p>
            </div>
          )}

          {/* Cabecera Datos Empresa y Cliente (Relleno Gris 10%, Datos x1.5, Nombres igual) */}
          {isBudgetOrInvoice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* 1. Tarjeta Empresa/Taller Emisor: Relleno gris 10% */}
              <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 shadow-2xs" style={{ backgroundColor: 'rgba(0, 0, 0, 0.10)' }}>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm sm:text-base uppercase text-slate-500 tracking-wider block mb-1.5">
                    EMISOR / TALLER:
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight truncate">
                    {editableDoc?.issuerName || doc.issuerName}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-700 mt-1.5 leading-relaxed font-medium">
                    {editableDoc?.issuerAddress || doc.issuerAddress || 'Polígono Industrial Las Eras, Nave 14, Madrid'}
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 mt-1">
                    CIF: <span className="font-bold font-mono text-slate-900">{editableDoc?.issuerCif || doc.issuerCif}</span>
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Tel: <span className="font-bold text-slate-900">{editableDoc?.issuerPhone || doc.issuerPhone}</span> {(editableDoc?.issuerEmail || doc.issuerEmail) ? `• ${editableDoc?.issuerEmail || doc.issuerEmail}` : ''}
                  </p>
                </div>

                {effectiveLogoUrl ? (
                  <div className="shrink-0 flex items-center justify-center p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <img
                      src={effectiveLogoUrl}
                      alt={editableDoc?.issuerName || doc.issuerName}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>
                ) : null}
              </div>

              {/* 2. Tarjeta Cliente: Relleno gris 10% */}
              <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-start shadow-2xs" style={{ backgroundColor: 'rgba(0, 0, 0, 0.10)' }}>
                <span className="font-bold text-sm sm:text-base uppercase text-slate-500 tracking-wider mb-1.5">
                  CLIENTE / DESTINATARIO
                </span>

                <div className="space-y-1 text-slate-700">
                  <p className="font-black text-base sm:text-xl uppercase text-slate-900">
                    {editableDoc?.clientName || doc.clientName || 'Cliente'}
                  </p>
                  <p className="text-sm sm:text-base">
                    NIF/CIF: <span className="font-bold font-mono text-slate-900">{editableDoc?.clientCif || doc.clientCif || '---'}</span>
                  </p>
                  <p className="text-sm sm:text-base">
                    Dirección: <span className="font-medium text-slate-800 line-clamp-1">{editableDoc?.clientAddress || doc.clientAddress || '---'}</span>
                  </p>
                  <p className="text-sm sm:text-base text-slate-600">
                    Tel: <span className="font-bold text-slate-900">{editableDoc?.clientPhone || doc.clientPhone || '---'}</span> {(editableDoc?.clientEmail || doc.clientEmail) ? `• ${editableDoc?.clientEmail || doc.clientEmail}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b-2 border-[#0F2942] pb-6">
              {/* Emisor / Taller con logo */}
              <div className="flex flex-row items-start gap-4">
                {effectiveLogoUrl && (
                  <div
                    className="issuer-logo-box shrink-0 flex items-center justify-center bg-white border border-[#E2E0D8] rounded-md p-1.5 shadow-2xs"
                    style={{ width: '100px', height: '100px', minWidth: '100px', maxWidth: '100px', minHeight: '100px', maxHeight: '100px' }}
                  >
                    <img
                      src={effectiveLogoUrl}
                      alt={doc.issuerName}
                      className="issuer-logo-img object-contain w-full h-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    EMISOR / TALLER PROFESIONAL
                  </span>
                  <h3 className="text-base font-bold text-[#0F172A] uppercase mt-0.5">
                    {doc.issuerName}
                  </h3>
                  <p className="text-xs font-mono font-medium text-[#1E3A8A]">CIF: {doc.issuerCif}</p>
                  <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">{doc.issuerAddress}</p>
                  <p className="text-xs text-[#64748B] mt-1">{doc.issuerPhone} • {doc.issuerEmail}</p>
                </div>
              </div>

              {/* Receptor / Cliente */}
              <div className="md:text-right flex flex-col justify-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                  CLIENTE / DESTINATARIO
                </span>
                <h3 className="text-base font-bold text-[#0F172A] uppercase mt-0.5">
                  {doc.clientName}
                </h3>
                {doc.clientCif && (
                  <p className="text-xs font-mono font-medium text-[#1E3A8A]">NIF/CIF: {doc.clientCif}</p>
                )}
                {doc.clientAddress && (
                  <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">{doc.clientAddress}</p>
                )}
                {doc.clientPhone && <p className="text-xs text-[#64748B] mt-0.5">Tel: {doc.clientPhone}</p>}
                {doc.clientEmail && <p className="text-xs text-[#64748B] mt-0.5">Email: {doc.clientEmail}</p>}
              </div>
            </div>
          )}

          {/* Metadatos Documento (Solo en Recibos) */}
          {!isBudgetOrInvoice && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F8F7F3] border border-[#E2E0D8] rounded-xs text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase text-[#64748B]">Documento</span>
                <span className="font-mono font-bold text-[#0F172A]">{doc.number}</span>
              </div>
              {doc.expediente && (
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#64748B]">Expediente</span>
                  <span className="font-mono font-bold text-[#0F172A]">{doc.expediente}</span>
                </div>
              )}
              <div>
                <span className="block text-[10px] font-bold uppercase text-[#64748B]">Fecha Emisión</span>
                <span className="font-medium text-[#0F172A]">{doc.date}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-[#64748B]">
                  Vencimiento
                </span>
                <span className="font-medium text-[#0F172A]">
                  {doc.dueDate || '-'}
                </span>
              </div>
            </div>
          )}

          {/* RECONFIGURACIÓN EN UNA SOLA LÍNEA: MATRÍCULA x2, MARCA Y MODELO ÚNICAMENTE SIN TÍTULO, Y FECHA DE ENTREGA EN TAMAÑO X0.75 */}
          {isBudgetOrInvoice ? (
            (editableDoc?.showVehicleData !== false && doc.showVehicleData !== false) ? (
            <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs w-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.10)' }}>
              {/* Izquierda: Matrícula seguido únicamente de Marca y Modelo en tamaño x0.75 */}
              <div className="flex items-center gap-3 flex-wrap">
                {doc.vehiclePlate && (
                  <span className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-wider">
                    {editableDoc?.vehiclePlate || doc.vehiclePlate}
                  </span>
                )}
                <span className="text-xs sm:text-sm font-bold uppercase text-slate-800 tracking-tight">
                  {`${editableDoc?.vehicleBrand || doc.vehicleBrand || ''} ${editableDoc?.vehicleModel || doc.vehicleModel || ''}`.trim() || doc.vehicleType || ''}
                </span>
              </div>

              {/* Derecha: Fecha de Entrega en tamaño x0.75 */}
              <div className="text-xs sm:text-sm font-bold text-slate-500 font-mono tracking-tight sm:text-right">
                {(() => {
                  const dateVal = editableDoc?.vehicleDeliveryDate || editableDoc?.proposedDeliveryDate || doc.vehicleDeliveryDate || doc.proposedDeliveryDate;
                  const timeVal = editableDoc?.vehicleDeliveryTime || editableDoc?.proposedDeliveryTime || doc.vehicleDeliveryTime || doc.proposedDeliveryTime;
                  if (!dateVal) return '---';

                  let cleanDate = dateVal.trim();
                  let extractedTime = '';

                  const timeInDateMatch = cleanDate.match(/(\d{2}:\d{2})/);
                  if (timeInDateMatch) {
                    extractedTime = timeInDateMatch[1];
                  }
                  cleanDate = cleanDate.replace(/\s*(a\s+las|A\s+LAS)?\s*\d{2}:\d{2}(:\d{2})?/gi, '').trim();

                  const finalTime = timeVal?.trim() || extractedTime;

                  let dd = '', mm = '', yy = '';

                  const isoMatch = cleanDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
                  if (isoMatch) {
                    yy = isoMatch[1].slice(-2);
                    mm = isoMatch[2].padStart(2, '0');
                    dd = isoMatch[3].padStart(2, '0');
                  } else {
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

                  return `${dd}/${mm}/${yy}${finalTime ? ` a las ${finalTime}` : ''}`;
                })()}
              </div>
            </div>
            ) : null
          ) : (
            (doc.showVehicleData !== false && (doc.vehiclePlate || doc.vehicleDeliveryDate || doc.proposedDeliveryDate)) && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#FAF9F5] border border-[#E2E0D8] rounded-xs text-xs mb-3">
                <div className="flex items-center gap-3">
                  {doc.vehiclePlate && (
                    <div className="inline-flex items-center border border-[#1E293B] rounded-xs overflow-hidden bg-white shadow-2xs">
                      <span className="bg-[#003399] text-white px-1.5 py-0.5 text-[9px] font-bold">🇪🇸</span>
                      <span className="px-2.5 py-0.5 font-mono font-bold text-xs tracking-wider text-[#0F172A]">
                        {doc.vehiclePlate}
                      </span>
                    </div>
                  )}
                  <div className="text-[11px] text-[#475569]">
                    <strong className="text-[#0F172A]">Vehículo:</strong> {doc.vehicleBrand || ''} {doc.vehicleModel || ''}
                  </div>
                </div>
              </div>
            )
          )}

          {/* LOCALIZACIÓN / LUGAR DE LA TAREA */}
          {((editableDoc?.showLocationData !== false && doc.showLocationData !== false) && (editableDoc?.taskLocation || doc.taskLocation)) && (
            <div className="border border-emerald-300 rounded-2xl p-3 sm:p-3.5 mb-5 flex items-center justify-between gap-3 shadow-2xs w-full bg-emerald-50/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                    Lugar donde se realiza la tarea:
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase">
                    {editableDoc?.taskLocation || doc.taskLocation}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Líneas / Partidas (DESCRIPCIÓN, CANTIDAD, PRECIO, TOTAL - ENCABEZADO Y CONTENEDOR CON RELLENO GRIS 10%) */}
          {isBudgetOrInvoice ? (
            <div className="mb-6 border border-slate-300 rounded-2xl overflow-hidden shadow-2xs" style={{ backgroundColor: 'rgba(0, 0, 0, 0.10)' }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-xs sm:text-sm uppercase font-black text-slate-700 tracking-wider" style={{ backgroundColor: 'rgba(0, 0, 0, 0.12)' }}>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">DESCRIPCIÓN DE TRABAJOS Y RECAMBIOS</th>
                    <th className="py-3 px-3 text-center w-20">CANT.</th>
                    <th className="py-3 px-3 text-right w-28">PRECIO UNIT.</th>
                    <th className="py-3 px-3 text-right w-32">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/80">
                  {(editableDoc?.items || doc.items).map((item, idx) => {
                    const uPrice = Number(item.unitPrice) || 0;
                    const qty = Number(item.quantity) || 0;
                    const amt = Number(item.amount) || (qty * uPrice);

                    return (
                      <tr key={item.id || idx} className="hover:bg-black/5 transition-colors">
                        <td className="py-3 px-3 text-slate-500 font-mono text-sm font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 text-slate-900 font-bold text-sm sm:text-base">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-xl text-base font-bold bg-white"
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-800 font-mono font-bold text-sm sm:text-base">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                              className="w-16 p-2 border border-slate-300 rounded-xl text-base text-center font-mono font-bold bg-white"
                            />
                          ) : (
                            qty
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-800 font-mono font-bold text-sm sm:text-base">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                              className="w-24 p-2 border border-slate-300 rounded-xl text-base text-right font-mono font-bold bg-white"
                            />
                          ) : (
                            `${uPrice.toFixed(2)} €`
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-sm sm:text-base text-slate-900">
                          {amt.toFixed(2)} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#0F2942] text-[10px] uppercase font-bold text-[#0F2942] tracking-wider">
                    <th className="py-2.5">Descripción de Trabajos / Repuestos</th>
                    <th className="py-2.5 text-center w-16">Ud.</th>
                    <th className="py-2.5 text-right w-24">Precio Unit.</th>
                    <th className="py-2.5 text-right w-28">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F0EB]">
                  {doc.items.map((item, idx) => {
                    const uPrice = Number(item.unitPrice) || 0;
                    const qty = Number(item.quantity) || 0;
                    const amt = Number(item.amount) || (qty * uPrice);

                    return (
                      <tr key={item.id || idx}>
                        <td className="py-3 text-[#1E293B] pr-4">{item.description}</td>
                        <td className="py-3 text-center text-[#475569] font-mono">{qty}</td>
                        <td className="py-3 text-right text-[#475569] font-mono">
                          {uPrice.toFixed(2)} €
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-[#0F172A]">
                          {amt.toFixed(2)} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Desglose Fiscal y Totales (BASE IMPONIBLE, IVA Y TOTAL EN RECUADRO CON RELLENO GRIS 10%) */}
          {isBudgetOrInvoice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 mb-6">
              {/* Observaciones */}
              <div>
                <span className="font-bold text-xs uppercase text-slate-500 block mb-1.5">
                  CONDICIONES Y OBSERVACIONES:
                </span>
                {isEditing ? (
                  <textarea
                    value={editableDoc?.notes || ''}
                    onChange={(e) => setEditableDoc((prev) => prev ? { ...prev, notes: e.target.value } : null)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm outline-none resize-none leading-relaxed font-sans font-medium bg-white"
                    rows={4}
                  />
                ) : (
                  <p className="p-3.5 border border-slate-300 rounded-2xl text-slate-700 text-xs sm:text-sm font-medium leading-relaxed" style={{ backgroundColor: 'rgba(0, 0, 0, 0.10)' }}>
                    {editableDoc?.notes || doc.notes || (isBudget ? 'Validez del presupuesto: 30 días. Este presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración. Se ruega puntualidad para entregar el vehículo en la fecha y hora establecida.' : 'Factura oficial emitida según normativa tributaria vigente.')}
                  </p>
                )}
              </div>

              {/* QR y Texto Oficial Verifactu (en Facturas Emitidas) */}
              {isInvoice && (
                <div className="pt-2">
                  <VerifactuSection document={editableDoc || doc} size="md" />
                </div>
              )}

              {/* Totales: Base Imponible, IVA y Total en recuadro con relleno gris 10% */}
              <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-end space-y-2.5 shadow-2xs" style={{ backgroundColor: 'rgba(0, 0, 0, 0.10)' }}>
                <div className="flex justify-between items-center text-slate-600 text-xs sm:text-sm">
                  <span className="font-semibold uppercase">Base Imponible:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                    {(editableDoc?.subtotal ?? doc.subtotal ?? 0).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 text-xs sm:text-sm">
                  <span className="font-semibold uppercase">
                    IVA ({(editableDoc?.applyIva ?? doc.applyIva) ? `${editableDoc?.ivaRate ?? doc.ivaRate ?? 21}%` : '0%'}):
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                    {(editableDoc?.ivaAmount ?? doc.ivaAmount ?? 0).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-slate-300 pt-2 text-slate-900 font-black">
                  <span className="text-sm sm:text-base uppercase">TOTAL:</span>
                  <span className="font-mono text-xl sm:text-2xl text-slate-900">
                    {(editableDoc?.total ?? doc.total ?? 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-[#E2E0D8]">
              <div className="text-xs text-[#64748B] max-w-sm">
                <span className="block font-semibold text-[#334155] mb-1">
                  Notas y Condiciones:
                </span>
                <div className="bg-[#F8F7F3] p-3 rounded-xs border border-[#E2E0D8] text-[11px] text-[#334155] space-y-1.5">
                  <p className="italic whitespace-pre-line leading-relaxed">
                    {doc.notes || 'Documento oficial emitido según normativa tributaria vigente.'}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs bg-[#F8F7F3] p-4 border border-[#E2E0D8] rounded-xs">
                <div className="flex justify-between text-[#475569]">
                  <span>Base Imponible:</span>
                  <span className="font-mono font-medium text-[#0F172A]">{doc.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>IVA ({doc.applyIva ? `${doc.ivaRate}%` : '0% Exento'}):</span>
                  <span className="font-mono font-medium text-[#0F172A]">{doc.ivaAmount.toFixed(2)} €</span>
                </div>
                <div className="border-t-2 border-[#0F2942] pt-2.5 mt-2 flex justify-between items-baseline">
                  <span className="font-bold uppercase tracking-wider text-[#0F172A]">TOTAL:</span>
                  <span className="text-xl font-bold font-mono text-[#0F2942]">
                    {doc.total.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN ABONO TOTAL E HISTORIAL DE ABONOS (Facturas y Recibos) */}
          {(isInvoice || isReceipt) && (isTotalPaid || docPayments.length > 0) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              {isTotalPaid ? (
                <div className="bg-emerald-50/90 border-2 border-emerald-500 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-200 mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-black uppercase text-emerald-900 tracking-wide">
                          Abono Total de la Factura (Abonada)
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          Factura abonada al 100%. Saldo pendiente: <span className="font-mono font-bold">0,00 €</span>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-sm font-mono">
                        Total Abonado: {(totalPaid > 0 ? totalPaid : doc.total).toFixed(2)} €
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-black rounded-sm uppercase tracking-wider">
                        Abonada
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold uppercase text-emerald-800 mb-2">
                      Historial de Abonos Realizados:
                    </h5>
                    <div className="bg-white border border-emerald-200 rounded-sm overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-emerald-100/60 text-emerald-900 border-b border-emerald-200 text-[10px] uppercase font-bold">
                            <th className="py-2 px-3">Fecha</th>
                            <th className="py-2 px-3">Concepto / Método</th>
                            <th className="py-2 px-3 text-right">Importe Abonado</th>
                            <th className="py-2 px-3 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50 font-mono text-[11px]">
                          {docPayments.length > 0 ? (
                            docPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-emerald-50/50">
                                <td className="py-2 px-3 text-slate-700">{p.date || doc.date}</td>
                                <td className="py-2 px-3 font-sans text-slate-700">{p.method || 'Abono'}</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                  +{(p.amount || 0).toFixed(2)} €
                                </td>
                                <td className="py-2 px-3 text-right font-sans font-bold text-emerald-700">
                                  Abonado
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="py-2 px-3 text-slate-700">{doc.date}</td>
                              <td className="py-2 px-3 font-sans text-slate-700">Cobro de factura (Liquidación total)</td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                +{doc.total.toFixed(2)} €
                              </td>
                              <td className="py-2 px-3 text-right font-sans font-bold text-emerald-700">
                                Abonado
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : docPayments.length > 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[11px] font-bold uppercase text-slate-700">
                      Historial de Abonos Parciales:
                    </h5>
                    <div className="text-[11px] font-mono flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm font-bold">
                        Abonado: {totalPaid.toFixed(2)} €
                      </span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-sm font-bold">
                        Pendiente: {pendingAmount.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                          <th className="py-1.5 px-3">Fecha</th>
                          <th className="py-1.5 px-3">Método</th>
                          <th className="py-1.5 px-3 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {docPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-1.5 px-3 text-slate-600">{p.date}</td>
                            <td className="py-1.5 px-3 font-sans text-slate-600">{p.method || 'Abono'}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                              +{(p.amount || 0).toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ESTADO Y BOTONES DE ACCIÓN FLOTANTES (DENTRO DEL VISOR PARA PRESUPUESTOS Y FACTURAS) */}
          {isBudgetOrInvoice && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Recuadro de estado a todo lo ancho de la pantalla si ha sido enviado */}
              {(editableDoc?.status === 'enviado' || editableDoc?.status === 'enviada' || Boolean(editableDoc?.sentAt) || doc.status === 'enviado' || doc.status === 'enviada' || Boolean(doc.sentAt)) && (
                <div className="w-full bg-blue-50 border-2 border-blue-500 rounded-xl p-4 text-center my-4">
                  <div className="text-base font-black text-blue-900 uppercase tracking-wide">
                    {isBudget ? 'PRESUPUESTO ENVIADO AL CLIENTE' : 'FACTURA ENVIADA AL CLIENTE'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider mt-1">
                    {isBudget ? 'PENDIENTE DE ACEPTACIÓN' : isTotalPaid ? 'FACTURA ABONADA' : 'PENDIENTE DE COBRO'}
                  </div>
                </div>
              )}

              {/* Iconos flotantes limpios sin descripción, en una sola fila para el móvil */}
              <div className="flex flex-row items-center justify-between sm:justify-center gap-1.5 sm:gap-8 py-2 w-full px-1 no-print">
                {/* Icono Descargar PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-sky-600"
                  title="Descargar PDF"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                  ) : (
                    <Download className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                  )}
                </button>

                {/* Si no estamos editando: Icono Modificar */}
                {!isEditing && (!doc.isLocked || isBudget) && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-blue-800"
                    title={isBudget ? 'Modificar Presupuesto' : 'Modificar Factura'}
                  >
                    <Edit3 className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                  </button>
                )}

                {/* Al pulsar modificar: Aparece nuevo icono Guardar */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-emerald-600"
                    title={isBudget ? 'Guardar Presupuesto' : 'Guardar Factura'}
                  >
                    <Save className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                  </button>
                )}

                {/* Al pulsar Guardar o en vista normal: Iconos WhatsApp e Imprimir */}
                {(hasSavedAfterEdit || !isEditing) && (
                  <>
                    <a
                      href={`https://wa.me/${((editableDoc?.clientPhone || doc.clientPhone || '').replace(/\D/g, '').startsWith('34')) ? (editableDoc?.clientPhone || doc.clientPhone || '').replace(/\D/g, '') : '34' + (editableDoc?.clientPhone || doc.clientPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `*${doc.issuerName}*\n\n` +
                        `Estimado/a ${editableDoc?.clientName || doc.clientName},\n` +
                        `Le remitimos su ${isBudget ? 'Presupuesto' : 'Factura Oficial'} *${editableDoc?.number || doc.number}* por importe de *${(editableDoc?.total || doc.total || 0).toFixed(2)} €*.\n\n` +
                        `📄 *Documento oficial adjunto en vista de impresión descargable:*\n` +
                        `https://notificaciones.gestarian/d/${encodeURIComponent(editableDoc?.number || doc.number)}\n\n` +
                        `Gracias por su confianza.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        const nowIso = new Date().toISOString();
                        const updated: GestarianDocument = {
                          ...(editableDoc || doc),
                          status: isBudget ? 'enviado' : 'enviada',
                          sentAt: nowIso,
                        };
                        try {
                          const stored = getStoredDocuments();
                          const updatedList = stored.map((d) => (d.id === updated.id ? updated : d));
                          saveStoredDocuments(updatedList);
                          window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
                        } catch (e) {
                          console.error(e);
                        }

                        // Registrar notificación en notificaciones.gestarian con documento en vista de impresión descargable
                        const newNotif: InternalNotification = {
                          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                          title: `${isBudget ? 'Presupuesto' : 'Factura'} ${editableDoc?.number || doc.number} Enviado al Cliente`,
                          message: `${isBudget ? 'Presupuesto' : 'Factura'} enviado a ${editableDoc?.clientName || doc.clientName} (${editableDoc?.vehiclePlate || doc.vehiclePlate || 'Vehículo'}). Documento oficial adjunto en vista de impresión descargable desde notificaciones.gestarian.`,
                          timestamp: nowIso,
                          read: false,
                          type: 'budget_sent_client',
                          budgetId: (editableDoc || doc).id,
                          documentNumber: editableDoc?.number || doc.number,
                          totalAmount: editableDoc?.total || doc.total,
                          attachmentType: isBudget ? 'presupuesto' : 'factura',
                        };
                        const storedNotifs = getStoredNotifications();
                        saveStoredNotifications([newNotif, ...storedNotifs]);
                        window.dispatchEvent(new CustomEvent('gestarian_notifications_updated'));
                      }}
                      className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-emerald-600"
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                    </a>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-blue-800"
                      title="Imprimir"
                    >
                      <Printer className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                    </button>
                  </>
                )}

                {/* Icono Cerrar Visor */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-slate-700"
                  title="Cerrar Visor"
                >
                  <X className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          )}

          {/* Pie de página oficial del documento */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500">
            <p>
              Documento oficial generado por <strong>{doc.issuerName}</strong> (CIF: {doc.issuerCif}).
              {doc.issuerPhone && ` Teléfono de atención: ${doc.issuerPhone}.`}
            </p>
          </div>
        </div>

        {/* Diálogo de Confirmación de Envío e Inmutabilidad (Solo taller) */}
        {confirmSendDialog && onSendInvoice && (
          <div className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden no-print">
            <div className="bg-white border border-[#D5D2C9] rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-[#B45309]">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">
                  Confirmar Envío Inmutable
                </h3>
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                Antes de enviar la factura al cliente debe estar completamente confirmada.
                <strong className="block mt-2 text-[#0F172A]">
                  Una vez enviada al cliente, NO se podrá modificar ni la factura ni el presupuesto asociado
                </strong>
                , garantizando la trazabilidad fiscal.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmSendDialog(false)}
                  className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onSendInvoice(doc.id);
                    setConfirmSendDialog(false);
                  }}
                  className="px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase rounded-xs cursor-pointer"
                >
                  Confirmar y Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
