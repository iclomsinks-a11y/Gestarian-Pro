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
  Edit3,
  FileCheck2,
  AlertTriangle,
  Download,
  FileText,
  ShieldCheck,
  Eye,
  Clock,
} from 'lucide-react';
import { GestarianDocument, DocumentPayment } from '../types';

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
}) => {
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const [confirmSendDialog, setConfirmSendDialog] = useState<boolean>(false);
  const [clientPreviewActive, setClientPreviewActive] = useState<boolean>(false);

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

  const isInvoice = doc.type === 'factura';
  const isBudget = doc.type === 'presupuesto';
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

  const handleDownloadPdf = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print() error:', e);
    }

    try {
      const paymentsHtml = (isInvoice || isReceipt) ? (
        isTotalPaid ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #a7f3d0; padding-bottom: 10px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #065f46; letter-spacing: 1px;">
                ✓ ABONO TOTAL DE LA FACTURA (100% LIQUIDADA)
              </div>
              <div style="font-size: 11px; color: #047857; margin-top: 3px;">
                Factura abonada y liquidada al 100%. Saldo pendiente: <strong style="font-family: monospace;">0,00 €</strong>.
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 4px 10px; background: #d1fae5; color: #065f46; font-weight: bold; border-radius: 4px; font-family: monospace; font-size: 12px; margin-right: 6px;">
                Total Abonado: ${(totalPaid > 0 ? totalPaid : doc.total).toFixed(2)} €
              </span>
              <span style="display: inline-block; padding: 4px 10px; background: #059669; color: #ffffff; font-weight: 900; border-radius: 4px; text-transform: uppercase; font-size: 11px;">
                Liquidada
              </span>
            </div>
          </div>
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #065f46; margin-bottom: 6px;">
            Historial de Abonos:
          </div>
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #a7f3d0; border-radius: 4px; font-size: 11px;">
            <thead>
              <tr style="background: #d1fae5; color: #065f46; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #a7f3d0;">
                <th style="padding: 6px 10px; text-align: left;">Fecha</th>
                <th style="padding: 6px 10px; text-align: left;">Método de Pago</th>
                <th style="padding: 6px 10px; text-align: right;">Importe Abonado</th>
                <th style="padding: 6px 10px; text-align: right;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${docPayments.length > 0 ? docPayments.map((p) => `
                <tr style="border-bottom: 1px solid #f0fdf4;">
                  <td style="padding: 6px 10px; font-family: monospace;">${p.date || doc.date}</td>
                  <td style="padding: 6px 10px;">${p.method || 'Abono'}</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">+${(p.amount || 0).toFixed(2)} €</td>
                  <td style="padding: 6px 10px; text-align: right; color: #065f46; font-weight: bold;">Abonado</td>
                </tr>
              `).join('') : `
                <tr>
                  <td style="padding: 6px 10px; font-family: monospace;">${doc.date}</td>
                  <td style="padding: 6px 10px;">Cobro de factura (Liquidación total)</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">+${doc.total.toFixed(2)} €</td>
                  <td style="padding: 6px 10px; text-align: right; color: #065f46; font-weight: bold;">Abonado</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        ` : (docPayments.length > 0 ? `
        <div style="margin-top: 24px; padding: 14px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #334155;">
              Historial de Abonos Parciales
            </div>
            <div style="font-size: 11px; font-family: monospace;">
              <span style="padding: 3px 8px; background: #d1fae5; color: #065f46; font-weight: bold; border-radius: 4px; margin-right: 4px;">
                Abonado: ${totalPaid.toFixed(2)} €
              </span>
              <span style="padding: 3px 8px; background: #ffe4e6; color: #9f1239; font-weight: bold; border-radius: 4px;">
                Pendiente: ${pendingAmount.toFixed(2)} €
              </span>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 5px 8px; text-align: left;">Fecha</th>
                <th style="padding: 5px 8px; text-align: left;">Método</th>
                <th style="padding: 5px 8px; text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${docPayments.map((p) => `
                <tr style="border-bottom: 1px solid #f8fafc;">
                  <td style="padding: 5px 8px; font-family: monospace;">${p.date}</td>
                  <td style="padding: 5px 8px;">${p.method || 'Abono'}</td>
                  <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">+${(p.amount || 0).toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : '')
      ) : '';

      const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${headerCenteredTitle} ${doc.number} - ${doc.issuerName}</title>
  <style>
    @page { size: A4; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
    }
    .header-center-box {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 3px solid #0f2942;
    }
    .header-center-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      color: #0f2942;
      line-height: 1.2;
    }
    .header-center-sub {
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-bottom: 2px solid #0f2942;
      padding-bottom: 16px;
    }
    .issuer-logo-box {
      width: 250px !important;
      height: 250px !important;
      min-width: 250px !important;
      max-width: 250px !important;
      min-height: 250px !important;
      max-height: 250px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 6px !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
    }
    .issuer-logo-img {
      width: 250px !important;
      height: 250px !important;
      max-width: 250px !important;
      max-height: 250px !important;
      object-fit: contain !important;
      display: block !important;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.data-table th {
      background: #f8fafc;
      padding: 8px 10px;
      border-bottom: 2px solid #0f2942;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      color: #0f2942;
      font-weight: 800;
    }
    table.data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .meta-box {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .vehicle-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: bold; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <!-- TÍTULO PRINCIPAL CENTRADO: PRESUPUESTO / FACTURA / RECIBO -->
  <div class="header-center-box">
    <h1 class="header-center-title">${headerCenteredTitle}</h1>
    <div class="header-center-sub">
      ${isBudget ? 'PRESUPUESTO OFICIAL' : isInvoice ? 'FACTURA OFICIAL' : 'JUSTIFICANTE OFICIAL DE PAGO'} Nº ${doc.number} ${doc.expediente ? `• EXPEDIENTE ${doc.expediente}` : ''}
    </div>
  </div>

  <!-- CABECERA: A LA IZQUIERDA EL LOGO 250x250px Y A LA DERECHA DEL LOGO LOS DATOS DEL EMISOR. Y EN LA OTRA COLUMNA EL CLIENTE -->
  <table class="parties-table">
    <tr>
      <!-- Columna Emisor -->
      <td style="width: 58%; vertical-align: top; padding-right: 14px;">
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            ${effectiveLogoUrl ? `
            <td style="vertical-align: top; width: 250px; padding-right: 14px;">
              <div class="issuer-logo-box">
                <img src="${effectiveLogoUrl}" alt="${doc.issuerName}" class="issuer-logo-img" />
              </div>
            </td>
            ` : ''}
            <td style="vertical-align: top;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 2px;">
                EMISOR / TALLER PROFESIONAL
              </div>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">
                ${doc.issuerName}
              </div>
              <div style="font-size: 11px; font-weight: 700; font-family: monospace; color: #1e3a8a; margin-bottom: 3px;">
                CIF: ${doc.issuerCif}
              </div>
              <div style="font-size: 11px; color: #475569; line-height: 1.35; margin-bottom: 3px;">
                ${doc.issuerAddress}
              </div>
              <div style="font-size: 10px; color: #64748b;">
                ${doc.issuerPhone ? `Tel: ${doc.issuerPhone}` : ''} ${doc.issuerPhone && doc.issuerEmail ? '•' : ''} ${doc.issuerEmail || ''}
              </div>
            </td>
          </tr>
        </table>
      </td>

      <!-- Columna Receptor / Cliente -->
      <td style="width: 42%; vertical-align: top; text-align: right; padding-left: 14px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 2px;">
          CLIENTE / DESTINATARIO
        </div>
        <div style="font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">
          ${doc.clientName}
        </div>
        ${doc.clientCif ? `
        <div style="font-size: 11px; font-weight: 700; font-family: monospace; color: #1e3a8a; margin-bottom: 3px;">
          NIF/CIF: ${doc.clientCif}
        </div>` : ''}
        ${doc.clientAddress ? `
        <div style="font-size: 11px; color: #475569; line-height: 1.35; margin-bottom: 3px;">
          ${doc.clientAddress}
        </div>` : ''}
        <div style="font-size: 10px; color: #64748b;">
          ${doc.clientPhone ? `Tel: ${doc.clientPhone}` : ''} ${doc.clientPhone && doc.clientEmail ? '•' : ''} ${doc.clientEmail || ''}
        </div>
      </td>
    </tr>
  </table>

  <!-- METADATOS -->
  <div class="meta-box">
    <div><strong>DOCUMENTO:</strong> <span class="font-mono">${doc.number}</span></div>
    ${doc.expediente ? `<div><strong>EXPEDIENTE:</strong> <span class="font-mono">${doc.expediente}</span></div>` : ''}
    <div><strong>FECHA EMISIÓN:</strong> ${doc.date}</div>
    <div><strong>${isBudget ? 'VALIDEZ' : 'VENCIMIENTO'}:</strong> ${isBudget ? '30 días' : (doc.dueDate || '-')}</div>
    ${isBudget && (doc.vehicleDeliveryDate || doc.proposedDeliveryDate) ? `<div><strong>FECHA PROPUESTA ENTREGA:</strong> <span class="font-mono font-bold" style="color: #0f2942;">${doc.vehicleDeliveryDate || doc.proposedDeliveryDate}</span></div>` : ''}
  </div>

  ${doc.vehiclePlate ? `
  <div class="vehicle-badge" style="display: flex; justify-content: space-between; align-items: center;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="background: #003399; color: white; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 2px;">🇪🇸</span>
      <span style="font-family: monospace; font-weight: 900; font-size: 13px; letter-spacing: 1.5px; color: #0f172a; padding: 2px 8px; border: 1px solid #0f172a; border-radius: 2px; background: white;">${doc.vehiclePlate}</span>
      <span style="font-size: 11px; color: #475569;"><strong>Vehículo:</strong> ${doc.vehicleBrand || ''} ${doc.vehicleModel || ''}</span>
    </div>
    ${(doc.vehicleDeliveryDate || doc.proposedDeliveryDate) ? `
      <div style="font-size: 11px; color: #0f2942; font-weight: bold; background: #ffffff; padding: 3px 8px; border: 1px solid #cbd5e1; border-radius: 3px;">
        📅 Fecha propuesta entrega: <span style="font-family: monospace;">${doc.vehicleDeliveryDate || doc.proposedDeliveryDate}</span>
      </div>
    ` : ''}
  </div>` : ''}

  <!-- TABLA DE PARTIDAS -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 55%;">Descripción de Trabajos / Repuestos</th>
        <th style="width: 15%; text-align: center;">Cantidad</th>
        <th style="width: 15%; text-align: right;">Precio Ud.</th>
        <th style="width: 15%; text-align: right;">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${(doc.items || []).map((it) => `
        <tr>
          <td>${it.description}</td>
          <td style="text-align: center; font-family: monospace;">${it.quantity}</td>
          <td style="text-align: right; font-family: monospace;">${it.unitPrice.toFixed(2)} €</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">${it.amount.toFixed(2)} €</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- TOTALES Y NOTAS -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <tr>
      <td style="width: 60%; vertical-align: top; padding-right: 20px;">
        <div style="font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 4px;">
          ${isBudget ? 'Observaciones y Validez:' : 'Notas y Condiciones:'}
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; font-size: 11px; color: #475569; line-height: 1.4;">
          ${isBudget ? `<p style="margin: 0 0 4px 0; font-weight: 600; color: #0f2942;">Validez del presupuesto: ${doc.dueDate ? `hasta ${doc.dueDate}` : '30 días a partir de la fecha de emisión'}.</p>` : ''}
          <p style="margin: 0; font-style: italic;">${doc.notes || 'Este presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.'}</p>
        </div>
      </td>
      <td style="width: 40%; vertical-align: top;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; font-size: 11px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 0; color: #475569;">Base Imponible:</td>
              <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: bold;">${doc.subtotal.toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #475569;">IVA (${doc.applyIva ? `${doc.ivaRate}%` : '0%'}):</td>
              <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: bold;">${doc.ivaAmount.toFixed(2)} €</td>
            </tr>
            ${doc.applyIrpf ? `
            <tr>
              <td style="padding: 3px 0; color: #b91c1c;">Retención IRPF (-${doc.irpfRate}%):</td>
              <td style="padding: 3px 0; text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">-${doc.irpfAmount.toFixed(2)} €</td>
            </tr>` : ''}
            <tr style="border-top: 2px solid #0f2942;">
              <td style="padding: 8px 0 0 0; font-size: 13px; font-weight: 900; color: #0f2942; text-transform: uppercase;">TOTAL:</td>
              <td style="padding: 8px 0 0 0; text-align: right; font-size: 18px; font-weight: 900; font-family: monospace; color: #0f2942;">${doc.total.toFixed(2)} €</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- SECCIÓN ABONO TOTAL E HISTORIAL DE ABONOS (PARA FACTURAS Y RECIBOS) -->
  ${paymentsHtml}

  <div style="margin-top: 30px; padding-top: 14px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 10px; color: #64748b;">
    Documento oficial emitido por <strong>${doc.issuerName}</strong> (CIF: ${doc.issuerCif})
    ${doc.issuerPhone ? `• Teléfono: ${doc.issuerPhone}` : ''} ${doc.issuerEmail ? `• Email: ${doc.issuerEmail}` : ''}
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle}_${doc.number}_Oficial.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Error al descargar documento:', err);
    }

    if (onShowToast) {
      onShowToast(`Documento ${doc.number} listo para guardar como PDF o imprimir.`);
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
        
        {/* Barra superior de estado y acciones (Oculta en Impresión) */}
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

            {/* Botón Descargar PDF / Imprimir (Principal para cliente) */}
            <button
              id="btn-doc-descargar-pdf"
              onClick={handleDownloadPdf}
              title="Descargar o guardar documento en PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
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
        {!isEffectiveClientView && doc.isLocked && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] px-6 py-2 text-xs flex items-center gap-2 shrink-0 print:hidden no-print">
            <Lock className="w-4 h-4 shrink-0 text-[#B45309]" />
            <span>
              <strong>Documento fiscal bloqueado:</strong> Esta factura ya ha sido enviada al cliente. Por imperativo legal y normativa de facturación, no puede ser modificada.
            </span>
          </div>
        )}

        {/* Área del Documento Imprimible / Factura oficial (Hoja A4 limpia) */}
        <div id="printable-document-sheet" className="p-6 sm:p-8 md:p-10 overflow-y-auto bg-white flex-1 space-y-6 print:p-0 print:overflow-visible print:m-0 print:w-full">
          {/* Título Principal Centrado Oficial (PRESUPUESTO / FACTURA / RECIBO) */}
          <div className="text-center pb-4 mb-4 border-b-2 border-[#0F2942]">
            <h1 className="doc-main-header-title text-2xl sm:text-3xl font-black uppercase tracking-widest text-[#0F2942]">
              {headerCenteredTitle}
            </h1>
            <p className="doc-main-header-sub text-xs text-[#64748B] font-mono mt-1 font-bold">
              {isBudget ? 'PRESUPUESTO OFICIAL' : isInvoice ? 'FACTURA OFICIAL' : 'JUSTIFICANTE OFICIAL DE PAGO'} Nº {doc.number} {doc.expediente ? `• EXPEDIENTE ${doc.expediente}` : ''}
            </p>
          </div>

          {/* Cabecera Emisor y Receptor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b-2 border-[#0F2942] pb-6">
            {/* Emisor / Taller con logo de 250x250px a la izquierda de los datos del emisor */}
            <div className="flex flex-row items-start gap-4">
              {effectiveLogoUrl && (
                <div
                  className="issuer-logo-box shrink-0 flex items-center justify-center bg-white border border-[#E2E0D8] rounded-md p-1.5 shadow-2xs"
                  style={{ width: '250px', height: '250px', minWidth: '250px', maxWidth: '250px', minHeight: '250px', maxHeight: '250px' }}
                >
                  <img
                    src={effectiveLogoUrl}
                    alt={doc.issuerName}
                    width={250}
                    height={250}
                    className="issuer-logo-img object-contain"
                    style={{ width: '250px', height: '250px', maxWidth: '250px', maxHeight: '250px', objectFit: 'contain' }}
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

          {/* Metadatos Documento */}
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
                {isBudget ? 'Validez' : 'Vencimiento'}
              </span>
              <span className="font-medium text-[#0F172A]">
                {isBudget ? '30 días' : (doc.dueDate || '-')}
              </span>
            </div>
          </div>

          {/* Vehículo Asociado / Matrícula y Fecha Propuesta de Entrega */}
          {(doc.vehiclePlate || doc.vehicleDeliveryDate || doc.proposedDeliveryDate) && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#FAF9F5] border border-[#E2E0D8] rounded-xs text-xs">
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
              {(doc.vehicleDeliveryDate || doc.proposedDeliveryDate) && (
                <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded border border-[#CBD5E1] shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span className="font-bold text-[#0F2942] uppercase text-[10px]">F. Propuesta Entrega:</span>
                  <span className="font-mono font-bold text-[#0F2942]">
                    {doc.vehicleDeliveryDate || doc.proposedDeliveryDate}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tabla de Líneas / Partidas */}
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
                {doc.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 text-[#1E293B] pr-4">{item.description}</td>
                    <td className="py-3 text-center text-[#475569] font-mono">{item.quantity}</td>
                    <td className="py-3 text-right text-[#475569] font-mono">
                      {item.unitPrice.toFixed(2)} €
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-[#0F172A]">
                      {item.amount.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desglose Fiscal y Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-[#E2E0D8]">
            <div className="text-xs text-[#64748B] max-w-sm">
              <span className="block font-semibold text-[#334155] mb-1">
                {isBudget ? 'Observaciones y Validez:' : 'Notas y Condiciones:'}
              </span>
              <div className="bg-[#F8F7F3] p-3 rounded-xs border border-[#E2E0D8] text-[11px] text-[#334155] space-y-1.5">
                {isBudget && (
                  <p className="font-semibold text-[#0F2942]">
                    Validez del presupuesto: {doc.dueDate ? `hasta ${doc.dueDate}` : '30 días a partir de la fecha de emisión'}.
                  </p>
                )}
                <p className="italic whitespace-pre-line leading-relaxed">
                  {doc.notes || 'Este presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.'}
                </p>
                {isBudget && doc.notes && !doc.notes.includes('Este presupuesto puede verse alterado') && (
                  <p className="text-[10px] text-gray-500 border-t border-gray-200 pt-1">
                    Este presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.
                  </p>
                )}
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
              {doc.applyIrpf && (
                <div className="flex justify-between text-[#B91C1C]">
                  <span>Retención IRPF (-{doc.irpfRate}%):</span>
                  <span className="font-mono font-medium">-{doc.irpfAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="border-t-2 border-[#0F2942] pt-2.5 mt-2 flex justify-between items-baseline">
                <span className="font-bold uppercase tracking-wider text-[#0F172A]">TOTAL:</span>
                <span className="text-xl font-bold font-mono text-[#0F2942]">
                  {doc.total.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN ABONO TOTAL E HISTORIAL DE ABONOS (Facturas y Recibos) */}
          {(isInvoice || isReceipt) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              {isTotalPaid ? (
                <div className="bg-emerald-50/90 border-2 border-emerald-500 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-200 mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-black uppercase text-emerald-900 tracking-wide">
                          Abono Total de la Factura (100% Liquidada)
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          Factura abonada y liquidada al 100%. Saldo pendiente: <span className="font-mono font-bold">0,00 €</span>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-sm font-mono">
                        Total Abonado: {(totalPaid > 0 ? totalPaid : doc.total).toFixed(2)} €
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-black rounded-sm uppercase tracking-wider">
                        Liquidada
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

          {/* Pie de página oficial del documento */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500">
            <p>
              Documento oficial generado por <strong>{doc.issuerName}</strong> (CIF: {doc.issuerCif}).
              {doc.issuerPhone && ` Teléfono de atención: ${doc.issuerPhone}.`}
            </p>
          </div>
        </div>

        {/* Barra de Acciones Inferior */}
        {isEffectiveClientView ? (
          /* ========================================================================= */
          /* MODO CLIENTE: ÚNICAMENTE LIMITADO A VER, DESCARGAR, IMPRIMIR O COMPARTIR  */
          /* SIN BOTONES EDITABLES NI ACCIONES INTERNAS DE GESTIÓN DE TALLER           */
          /* ========================================================================= */
          <div className="px-4 sm:px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden no-print">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Versión oficial del documento para el cliente. Listo para descargar en PDF, imprimir o compartir.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8F7F3] text-[#0F2942] border border-[#0F2942] text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-[#475569] border border-[#CBD5E1] text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO TALLER INTERNO: ACCIONES DE ADMINISTRACIÓN Y CICLO DE VIDA FISCAL    */
          /* ========================================================================= */
          <div className="px-6 py-4 bg-[#F1F0EB] border-t border-[#E2E0D8] flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden no-print">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Si NO está bloqueado, se puede modificar */}
              {!doc.isLocked && onEditDocument && (
                <button
                  id="btn-modificar-doc"
                  onClick={() => onEditDocument(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F8F7F3] text-[#334155] border border-[#CBD5E1] text-xs font-semibold uppercase rounded-xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar</span>
                </button>
              )}

              {/* Presupuesto: Botón Aceptar para el cliente o estado pendiente para el taller */}
              {isBudget && doc.status !== 'aceptado' && (
                isClientView && onAcceptBudget ? (
                  <button
                    id="btn-aceptar-presupuesto"
                    onClick={() => onAcceptBudget(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aceptar Presupuesto y Fecha</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold rounded-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pendiente de aceptación por el cliente</span>
                  </div>
                )
              )}

              {/* Presupuesto aceptado: Dar cita en agenda */}
              {isBudget && doc.status === 'aceptado' && onOpenAgendaForBudget && (
                <button
                  id="btn-planificar-agenda"
                  onClick={() => onOpenAgendaForBudget(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] hover:bg-[#0F2942] text-white text-xs font-semibold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dar Cita en Agenda</span>
                </button>
              )}

              {/* Convertir Presupuesto en Factura */}
              {isBudget && onConvertToInvoice && (
                <button
                  id="btn-convertir-a-factura"
                  onClick={() => onConvertToInvoice(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-semibold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convertir a Factura</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Facturas: Paso 1 Confirmar */}
              {isInvoice && doc.status === 'borrador' && onConfirmInvoice && (
                <button
                  id="btn-confirmar-factura"
                  onClick={() => {
                    onConfirmInvoice(doc.id);
                    if (onShowToast) {
                      onShowToast('Factura guardada y confirmada con éxito. Recuerde enviarla al cliente.', 6000);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Confirmar Factura</span>
                </button>
              )}

              {/* Facturas: Paso 2 Enviar al cliente (bloqueo inmutable) */}
              {isInvoice && !doc.isLocked && onSendInvoice && (
                <button
                  id="btn-enviar-cliente"
                  onClick={() => setConfirmSendDialog(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase rounded-xs transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar al Cliente</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
                <span>Cerrar Visor</span>
              </button>
            </div>
          </div>
        )}

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
