import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { GestarianDocument, DocumentPayment } from '../types';

interface GeneratePdfOptions {
  userLogoUrl?: string;
}

export async function generateDocumentPdf(doc: GestarianDocument, options: GeneratePdfOptions = {}): Promise<void> {
  const isInvoice = doc.type === 'factura' || doc.type === 'factura_proforma' || doc.type === 'factura_rectificativa';
  const isBudget = doc.type === 'presupuesto' || doc.type === 'budget';
  const isReceipt = doc.type === 'recibo_abono' || (doc.type as string) === 'recibo';
  
  const docTitle = isInvoice ? 'FACTURA' : isReceipt ? 'RECIBO DE ABONO' : 'PRESUPUESTO';
  const docSubTitle = isInvoice 
    ? 'FACTURA OFICIAL' 
    : isReceipt 
      ? 'JUSTIFICANTE OFICIAL DE PAGO' 
      : 'PRESUPUESTO OFICIAL';

  // Inicializar documento jsPDF en formato A4 vertical (210 x 297 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Intentar cargar el logo si está disponible
  const logoUrl = options.userLogoUrl || doc.issuerLogoUrl;
  let logoLoaded = false;
  let logoImg: HTMLImageElement | null = null;

  if (logoUrl) {
    try {
      logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = logoUrl;
      });
      logoLoaded = true;
    } catch {
      logoLoaded = false;
    }
  }

  // 1. CABECERA SUPERIOR: BANNER PRINCIPAL CON TÍTULO Y NÚMERO
  if (isBudget || isInvoice) {
    // Para presupuesto y factura: Relleno gris claro con texto oscuro
    pdf.setFillColor(241, 245, 249); // #F1F5F9
    pdf.rect(margin, currentY, contentWidth, 18, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42); // #0F172A
    pdf.text(docTitle, margin + 6, currentY + 11);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const docNumberText = `Nº ${doc.number} ${doc.expediente ? `• EXP: ${doc.expediente}` : ''}`;
    pdf.text(docNumberText, pageWidth - margin - 6, currentY + 11, { align: 'right' });
  } else {
    // Para recibos u otros: Relleno azul oscuro oficial
    pdf.setFillColor(15, 41, 66); // #0F2942
    pdf.rect(margin, currentY, contentWidth, 18, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text(docTitle, margin + 6, currentY + 11);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const docNumberText = `Nº ${doc.number} ${doc.expediente ? `• EXP: ${doc.expediente}` : ''}`;
    pdf.text(docNumberText, pageWidth - margin - 6, currentY + 11, { align: 'right' });
  }

  currentY += 24;

  // 2. BLOQUE EMISOR Y RECEPTOR (2 COLUMNAS) CON RELLENO GRIS 10%
  const colWidth = (contentWidth - 6) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 6;
  const boxHeight = 44;

  // Caja Emisor (Relleno gris 10%)
  pdf.setFillColor(235, 235, 235); // Relleno gris 10%
  pdf.setDrawColor(203, 213, 225); // #CBD5E1
  pdf.roundedRect(col1X, currentY, colWidth, boxHeight, 2, 2, 'FD');

  let emisorTextX = col1X + 5;
  if (logoLoaded && logoImg) {
    try {
      pdf.addImage(logoImg, 'JPEG', col1X + 4, currentY + 5, 24, 24);
      emisorTextX = col1X + 31;
    } catch {
      emisorTextX = col1X + 5;
    }
  }

  // Label Emisor (x1.5 = 10pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // #64748B
  pdf.text('EMISOR / TALLER', emisorTextX, currentY + 7);

  // Nombre Taller Emisor (Dejar igual = 10pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42); // #0F172A
  const truncatedIssuerName = doc.issuerName.length > 28 ? doc.issuerName.substring(0, 26) + '...' : doc.issuerName;
  pdf.text(truncatedIssuerName, emisorTextX, currentY + 13);

  // Datos Taller Emisor (x1.5 = 11.5pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  pdf.setTextColor(30, 58, 138); // #1E3A8A
  pdf.text(`CIF: ${doc.issuerCif || '-'}`, emisorTextX, currentY + 19);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(71, 85, 105); // #475569
  const issuerAddressLines = pdf.splitTextToSize(doc.issuerAddress || '', colWidth - (emisorTextX - col1X) - 4);
  pdf.text(issuerAddressLines.slice(0, 2), emisorTextX, currentY + 25);

  const contactText = `${doc.issuerPhone ? `Tel: ${doc.issuerPhone}` : ''} ${doc.issuerEmail ? `• ${doc.issuerEmail}` : ''}`;
  pdf.setFontSize(10.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(contactText.trim(), emisorTextX, currentY + 36);

  // Caja Cliente (Relleno gris 10%)
  pdf.setFillColor(235, 235, 235);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(col2X, currentY, colWidth, boxHeight, 2, 2, 'FD');

  // Label Cliente (x1.5 = 10pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text('CLIENTE / DESTINATARIO', col2X + 5, currentY + 7);

  // Nombre Cliente (Dejar igual = 10pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  const truncatedClientName = doc.clientName.length > 32 ? doc.clientName.substring(0, 30) + '...' : doc.clientName;
  pdf.text(truncatedClientName, col2X + 5, currentY + 13);

  // Datos Cliente (x1.5 = 11.5pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  pdf.setTextColor(30, 58, 138);
  pdf.text(`NIF/CIF: ${doc.clientCif || '-'}`, col2X + 5, currentY + 19);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(71, 85, 105);
  const clientAddressLines = pdf.splitTextToSize(doc.clientAddress || 'Sin dirección registrada', colWidth - 10);
  pdf.text(clientAddressLines.slice(0, 2), col2X + 5, currentY + 25);

  const clientContact = `${doc.clientPhone ? `Tel: ${doc.clientPhone}` : ''} ${doc.clientEmail ? `• ${doc.clientEmail}` : ''}`;
  pdf.setFontSize(10.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(clientContact.trim(), col2X + 5, currentY + 36);

  currentY += boxHeight + 5;

  // 3. BARRA DE DETALLES: VEHÍCULO (MATRÍCULA + MARCA/MODELO ÚNICAMENTE) Y FECHA DE ENTREGA (TAMAÑO X0.75, RELLENO GRIS 10%)
  const metaHeight = 16;
  pdf.setFillColor(235, 235, 235); // Relleno gris 10%
  pdf.setDrawColor(203, 213, 225); // #CBD5E1
  pdf.roundedRect(margin, currentY, contentWidth, metaHeight, 1.5, 1.5, 'FD');

  let vehicleX = margin + 4;
  if (doc.vehiclePlate) {
    // Matrícula a tamaño x2 (14pt)
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.vehiclePlate.toUpperCase(), vehicleX, currentY + 11);
    vehicleX += 34;
  }

  // Marca y Modelo únicamente sin título "VEHÍCULO:" en tamaño x0.75 (6pt)
  const vehicleText = `${doc.vehicleBrand || ''} ${doc.vehicleModel || ''}`.trim();
  if (vehicleText) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(30, 41, 59);
    pdf.text(vehicleText.toUpperCase(), vehicleX, currentY + 10);
  }

  // Lugar donde se realiza la tarea (si está presente y activado)
  if (doc.taskLocation && doc.showLocationData !== false) {
    if (!doc.vehiclePlate && !vehicleText) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`LUGAR DE TAREA: ${doc.taskLocation.toUpperCase()}`, vehicleX, currentY + 10);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Lugar: ${doc.taskLocation.toUpperCase()}`, vehicleX, currentY + 14);
    }
  }

  // Fecha propuesta de entrega en tamaño x0.75 (7.5pt) con formato limpio
  const deliveryDateVal = (doc as any).vehicleDeliveryDate || (doc as any).proposedDeliveryDate;
  const deliveryTimeVal = (doc as any).vehicleDeliveryTime || (doc as any).proposedDeliveryTime;
  if (deliveryDateVal) {
    let cleanDate = deliveryDateVal.trim();
    let extractedTime = '';
    const timeInDateMatch = cleanDate.match(/(\d{2}:\d{2})/);
    if (timeInDateMatch) {
      extractedTime = timeInDateMatch[1];
    }
    cleanDate = cleanDate.replace(/\s*(a\s+las|A\s+LAS)?\s*\d{2}:\d{2}(:\d{2})?/gi, '').trim();
    const finalTime = deliveryTimeVal?.trim() || extractedTime;

    let formattedStr = cleanDate;
    const isoMatch = cleanDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      formattedStr = `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1].slice(-2)}`;
    } else {
      const esMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (esMatch) {
        formattedStr = `${esMatch[1].padStart(2, '0')}/${esMatch[2].padStart(2, '0')}/${esMatch[3].slice(-2)}`;
      }
    }
    if (finalTime) {
      formattedStr += ` a las ${finalTime}`;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(formattedStr, pageWidth - margin - 4, currentY + 10, { align: 'right' });
  }

  currentY += metaHeight + 6;

  // 4. TABLA DE CONCEPTOS / LÍNEAS DE DETALLE (jspdf-autotable)
  const tableBody = doc.items.map((item, index) => [
    (index + 1).toString(),
    item.description || 'Concepto sin descripción',
    item.quantity.toString(),
    `${(item.unitPrice || 0).toFixed(2)} €`,
    `${(item.amount || (item.quantity * item.unitPrice) || 0).toFixed(2)} €`,
  ]);

  autoTable(pdf, {
    startY: currentY,
    head: [['#', 'DESCRIPCIÓN DE TRABAJOS Y RECAMBIOS', 'CANT.', 'PRECIO UNIT.', 'TOTAL']],
    body: tableBody,
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [230, 230, 230], // Gris 10% para encabezado
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59], // #1E293B
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Obtener la posición Y final después de la tabla
  currentY = (pdf as any).lastAutoTable.finalY + 6;

  // 5. BLOQUE DE TOTALES Y RESUMEN ECONÓMICO (Relleno Gris 10%)
  const totalsWidth = 72;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsStartY = currentY;

  // Cuadro de desglose a la derecha (Relleno gris 10%)
  pdf.setFillColor(235, 235, 235);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(totalsX, totalsStartY, totalsWidth, doc.applyIrpf ? 36 : 28, 2, 2, 'FD');

  let totRowY = totalsStartY + 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Base Imponible:', totalsX + 4, totRowY);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${(doc.subtotal || 0).toFixed(2)} €`, pageWidth - margin - 4, totRowY, { align: 'right' });

  if (doc.applyIva) {
    totRowY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`IVA (${doc.ivaRate || 21}%):`, totalsX + 4, totRowY);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(doc.ivaAmount || 0).toFixed(2)} €`, pageWidth - margin - 4, totRowY, { align: 'right' });
  }

  if (doc.applyIrpf) {
    totRowY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(190, 24, 93);
    pdf.text(`Retención IRPF (${doc.irpfRate}%):`, totalsX + 4, totRowY);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`-${(doc.irpfAmount || 0).toFixed(2)} €`, pageWidth - margin - 4, totRowY, { align: 'right' });
  }

  // Fila Total Destacada
  totRowY += 7;
  pdf.setFillColor(220, 220, 220); // Relleno gris para total
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(totalsX, totRowY - 4, totalsWidth, 9, 1, 1, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42); // Texto oscuro
  pdf.text('TOTAL:', totalsX + 4, totRowY + 2);
  pdf.setFontSize(11);
  pdf.text(`${doc.total.toFixed(2)} €`, pageWidth - margin - 4, totRowY + 2, { align: 'right' });

  // Notas u observaciones al lado izquierdo de los totales (Relleno gris 10%)
  const notesWidth = contentWidth - totalsWidth - 8;
  pdf.setFillColor(235, 235, 235);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, totalsStartY, notesWidth, doc.applyIrpf ? 36 : 28, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(isBudget ? 'CONDICIONES Y OBSERVACIONES:' : 'OBSERVACIONES Y FORMA DE PAGO:', margin + 4, totalsStartY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  const notesText = doc.notes || (isBudget 
    ? 'Validez del presupuesto: 30 días.\nLos precios indicados pueden variar si se detectan averías ocultas no visibles en la inspección inicial.\nSe ruega confirmación previa para reserva de recambios.' 
    : 'Forma de pago según lo acordado. Gracias por confiar en nuestros servicios profesionales.');
  const notesLines = pdf.splitTextToSize(notesText, notesWidth - 8);
  pdf.text(notesLines.slice(0, 4), margin + 4, totalsStartY + 12);

  currentY = Math.max(totRowY + 12, totalsStartY + (doc.applyIrpf ? 36 : 28) + 6);

  // 5.1 BLOQUE OFICIAL VERI*FACTU (SOLO EN FACTURAS EMITIDAS)
  if (isInvoice) {
    const verifactuBoxHeight = 30;
    if (currentY + verifactuBoxHeight > pageHeight - 30) {
      pdf.addPage();
      currentY = margin;
    }

    try {
      const issuerCif = doc.issuerCif || 'B12345678';
      const numSerie = doc.number || 'FAC-001';
      const fecha = doc.date || new Date().toISOString().split('T')[0];
      const total = (doc.total || 0).toFixed(2);
      const verifactuPayload = `https://sede.agenciatributaria.gob.es/verifactu/consulta?nif=${encodeURIComponent(issuerCif)}&numserie=${encodeURIComponent(numSerie)}&fecha=${encodeURIComponent(fecha)}&importe=${encodeURIComponent(total)}`;
      
      const qrDataUrl = await QRCode.toDataURL(verifactuPayload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0F2942',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });

      // Caja contenedora Verifactu
      pdf.setFillColor(248, 250, 252); // #F8FAFC
      pdf.setDrawColor(203, 213, 225); // #CBD5E1
      pdf.roundedRect(margin, currentY, contentWidth, verifactuBoxHeight, 2, 2, 'FD');

      // Dibujar imagen QR
      pdf.addImage(qrDataUrl, 'PNG', margin + 3, currentY + 3, 24, 24);

      // Textos Verifactu (Multiplicados por 1.5)
      const textX = margin + 30;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 41, 66); // #0F2942
      pdf.text('VERI*FACTU', textX, currentY + 7);

      // Badge 'Factura Verificable'
      pdf.setFillColor(209, 250, 229); // emerald-100
      pdf.roundedRect(textX + 28, currentY + 2.5, 38, 6, 1, 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(6, 95, 70); // emerald-800
      pdf.text('Factura Verificable', textX + 47, currentY + 6.8, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42); // #0F172A
      pdf.text('Factura verificable en la sede electrónica de la AEAT', textX, currentY + 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // #64748B
      const legalText = 'Documento expedido conforme a los requisitos del Reglamento Veri*factu (RD 1007/2023). Escanee el código QR para verificar la autenticidad e integridad del registro de facturación en la Agencia Tributaria.';
      const legalLines = pdf.splitTextToSize(legalText, contentWidth - 33);
      pdf.text(legalLines, textX, currentY + 19.5);

      currentY += verifactuBoxHeight + 6;
    } catch (err) {
      console.error('Error generando QR Verifactu en PDF:', err);
    }
  }

  // 6. HISTORIAL DE ABONOS (SI ES FACTURA CON ABONOS O ESTÁ TOTALMENTE ABONADA)
  const docPayments: DocumentPayment[] = (doc as any).payments || [];
  const totalPaid = docPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isTotalPaid = (doc.total > 0 && totalPaid >= doc.total - 0.01) || doc.status === 'pagada' || (doc.status as string) === 'abonada' || (doc.status as string) === 'liquidada';

  if ((isInvoice || isReceipt) && (isTotalPaid || docPayments.length > 0)) {
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = margin;
    }

    if (isTotalPaid) {
      // Banner verde de factura abonada
      pdf.setFillColor(236, 253, 245); // #ecfdf5
      pdf.setDrawColor(16, 185, 129); // #10b981
      pdf.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(6, 95, 70); // #065F46
      pdf.text('✓ FACTURA ABONADA', margin + 5, currentY + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text(`Total abonado: ${(totalPaid > 0 ? totalPaid : doc.total).toFixed(2)} € • Saldo pendiente: 0,00 €`, margin + 5, currentY + 11);

      pdf.setFillColor(5, 150, 105);
      pdf.roundedRect(pageWidth - margin - 26, currentY + 3.5, 22, 7, 1, 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('ABONADA', pageWidth - margin - 15, currentY + 8, { align: 'center' });

      currentY += 18;
    }

    if (docPayments.length > 0) {
      const paymentRows = docPayments.map((p) => [
        p.date || doc.date,
        p.method || 'Abono / Transferencia',
        `+${(p.amount || 0).toFixed(2)} €`,
        'Abonado',
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['FECHA PAGO', 'MÉTODO DE ABONO', 'IMPORTE ABONADO', 'ESTADO']],
        body: paymentRows,
        theme: 'plain',
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [209, 250, 229],
          textColor: [6, 95, 70],
          fontSize: 7.5,
          fontStyle: 'bold',
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [6, 95, 70],
          cellPadding: 2.5,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 25, halign: 'center' },
        },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 6;
    }
  }

  // 7. PIE DE PÁGINA PROFESIONAL FIJO EN TODAS LAS PÁGINAS
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Línea superior del footer
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Documento oficial emitido por ${doc.issuerName} (CIF: ${doc.issuerCif || '-'}) • GESTARIAN PRO`,
      margin,
      pageHeight - 7
    );

    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Guardar y disparar la descarga automática del archivo PDF
  const cleanNumber = doc.number.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${docTitle}_${cleanNumber}_Oficial.pdf`;
  pdf.save(fileName);
}
