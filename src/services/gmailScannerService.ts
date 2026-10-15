import { GestarianDocument } from '../types';

// Helper para fetch con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export interface ScanGmailOptions {
  sinceTimestamp?: number;
}

export async function scanGmailForInvoices(
  accessToken: string,
  options?: ScanGmailOptions
): Promise<GestarianDocument[]> {
  const currentScanTimestamp = Date.now();

  try {
    // 1. Acotación de la horquilla horaria de búsqueda:
    // Se inicia desde la marca de tiempo del último rastreo registrado.
    let effectiveSinceTimestamp = options?.sinceTimestamp;
    if (!effectiveSinceTimestamp && typeof window !== 'undefined') {
      const storedLastScan = localStorage.getItem('gestarian_last_gmail_scan_timestamp');
      if (storedLastScan) {
        effectiveSinceTimestamp = parseInt(storedLastScan, 10);
      }
    }

    // Si es la primera vez, acotar a las últimas 24 horas por defecto
    if (!effectiveSinceTimestamp || isNaN(effectiveSinceTimestamp)) {
      effectiveSinceTimestamp = Date.now() - 24 * 60 * 60 * 1000;
    }

    const afterSeconds = Math.floor(effectiveSinceTimestamp / 1000);

    // 2. Búsqueda estricta en Gmail: exige concepto factura/invoice en asunto o contenido y adjuntos PDF/imagen
    const searchQuery = `has:attachment (subject:factura OR subject:facturas OR subject:invoice OR subject:fra OR "factura" OR "invoice" OR "fra.") (filename:pdf OR filename:jpg OR filename:jpeg OR filename:png) after:${afterSeconds}`;
    
    const listResponse = await fetchWithTimeout(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=15`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      10000
    );
    
    if (!listResponse.ok) {
      console.warn(`Gmail API status: ${listResponse.statusText}`);
      // Actualizar marca de tiempo para no repetir
      if (typeof window !== 'undefined') {
        localStorage.setItem('gestarian_last_gmail_scan_timestamp', String(currentScanTimestamp));
      }
      return [];
    }
    
    const listData = await listResponse.json();

    if (!listData.messages || listData.messages.length === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('gestarian_last_gmail_scan_timestamp', String(currentScanTimestamp));
      }
      return [];
    }

    const newFacturas: GestarianDocument[] = [];
    const MAX_ATTACHMENT_SIZE_BYTES = 2.5 * 1024 * 1024; // Máximo 2.5MB (~1 a 2 páginas PDF)

    for (const msg of listData.messages) {
      try {
        // 3. Obtener detalles del mensaje
        const msgResponse = await fetchWithTimeout(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
          8000
        );
        if (!msgResponse.ok) continue;
        const msgData = await msgResponse.json();

        // Validar horquilla horaria del mensaje específico (después de la última búsqueda)
        if (msgData.internalDate && Number(msgData.internalDate) < effectiveSinceTimestamp) {
          continue;
        }

        // Extraer remitente y asunto para metadatos
        const headers = msgData.payload?.headers || [];
        const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
        const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
        const senderName = fromHeader.split('<')[0].replace(/"/g, '').trim() || 'Proveedor Factura';

        // 4. Validación obligatoria del concepto "factura" en el asunto o cuerpo del correo
        const textToValidate = `${subjectHeader} ${msgData.snippet || ''}`;
        const hasFacturaConceptInText = /(?:factura|facturas|facturacion|facturación|invoice|invoices|fra\.?|abono)/i.test(textToValidate);
        
        if (!hasFacturaConceptInText) {
          // Si el texto del email o el asunto no menciona explícitamente factura, se descarta
          continue;
        }

        // 5. Encontrar adjuntos que cumplan el criterio de 1-2 páginas / tamaño reducido
        const findInvoicePdfParts = (parts: any[]): { attachmentId: string; filename: string; mimeType: string; size: number }[] => {
          const found: { attachmentId: string; filename: string; mimeType: string; size: number }[] = [];
          for (const part of parts) {
            const fn = part.filename?.toLowerCase() || '';
            const mime = part.mimeType?.toLowerCase() || '';
            const size = part.body?.size || 0;

            const isPdfOrImage = fn.endsWith('.pdf') || mime === 'application/pdf' || 
                                 fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.png') ||
                                 mime.startsWith('image/');
            
            // Comprobar que sea documento de 1-2 páginas (tamaño <= 2.5MB)
            if (isPdfOrImage && part.body?.attachmentId && size <= MAX_ATTACHMENT_SIZE_BYTES) {
              found.push({ 
                attachmentId: part.body.attachmentId, 
                filename: part.filename || 'factura.pdf',
                mimeType: mime || (fn.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                size
              });
            }
            if (part.parts && Array.isArray(part.parts)) {
              found.push(...findInvoicePdfParts(part.parts));
            }
          }
          return found;
        };

        const pdfParts = msgData.payload?.parts ? findInvoicePdfParts(msgData.payload.parts) : [];

        for (const pdfItem of pdfParts) {
          try {
            // 6. Descargar el adjunto con timeout
            const attachResponse = await fetchWithTimeout(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${pdfItem.attachmentId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } },
              10000
            );
            if (!attachResponse.ok) continue;
            const attachData = await attachResponse.json();
            if (!attachData.data) continue;

            const base64Data = attachData.data.replace(/-/g, '+').replace(/_/g, '/');
            
            // 7. Enviar a OCR endpoint para validar autenticidad de factura y extraer número de factura
            let extracted: any = null;
            try {
              const isBrowser = typeof window !== 'undefined';
              const apiUrl = isBrowser ? '/api/scan-receipt' : 'http://localhost:3000/api/scan-receipt';
              
              const ocrResponse = await fetchWithTimeout(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  image: base64Data,
                  mimeType: pdfItem.mimeType,
                  filename: pdfItem.filename
                })
              }, 12000);
              
              if (ocrResponse.ok) {
                const ocrResult = await ocrResponse.json();
                if (ocrResult.success && ocrResult.data) {
                  extracted = ocrResult.data;
                }
              }
            } catch (ocrErr) {
              console.warn(`OCR falló para ${pdfItem.filename}:`, ocrErr);
            }

            // 8. Validación estricta: Cada documento debe ser factura auténtica y contener número de factura
            let invoiceNum = extracted?.invoiceNumber ? String(extracted.invoiceNumber).trim() : '';

            // Si la IA no extrajo número pero el nombre del archivo contiene número explícito de factura
            if (!invoiceNum) {
              const matchInFilename = pdfItem.filename.match(/(?:factura|fra|inv|fac)[\s_\-#:]*([A-Za-z0-9\-\/]{3,15})/i);
              if (matchInFilename) {
                invoiceNum = matchInFilename[1].toUpperCase();
              }
            }

            // Si tras análisis no es una factura real o no tiene número de factura, descartarlo
            if (extracted && extracted.isInvoice === false && !invoiceNum) {
              console.log(`[SCANNER] Descartando archivo no facturable: ${pdfItem.filename}`);
              continue;
            }

            if (!invoiceNum) {
              console.log(`[SCANNER] Descartando PDF sin número de factura obligatorio: ${pdfItem.filename}`);
              continue;
            }

            // Extraer y formatear conceptos de la factura
            const parsedItems = (extracted?.items && Array.isArray(extracted.items) && extracted.items.length > 0)
              ? extracted.items.map((it: any, idx: number) => ({
                  id: `item-${Date.now()}-${idx}`,
                  description: it.description || `Concepto ${idx + 1}`,
                  quantity: Number(it.quantity) || 1,
                  unitPrice: Number(it.unitPrice) || Number(it.amount) || 0,
                  amount: Number(it.amount) || (Number(it.unitPrice) * (Number(it.quantity) || 1)) || 0
                }))
              : [
                  {
                    id: `item-${Date.now()}`,
                    description: `Factura ${invoiceNum} adjunta: ${pdfItem.filename}`,
                    quantity: 1,
                    unitPrice: extracted?.baseAmount || extracted?.totalAmount || 0,
                    amount: extracted?.baseAmount || extracted?.totalAmount || 0
                  }
                ];

            // 9. Construir GestarianDocument con el número de factura extraído
            const newDoc: GestarianDocument = {
              id: `fact-rec-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              type: 'factura_recibida',
              number: invoiceNum,
              date: new Date().toISOString().split('T')[0],
              issuerId: `prov-${Date.now()}`,
              issuerName: extracted?.issuerName || senderName || 'Proveedor Factura',
              issuerCif: extracted?.issuerCif || '',
              issuerAddress: extracted?.issuerAddress || '',
              issuerPhone: '',
              issuerEmail: fromHeader.includes('<') ? fromHeader.split('<')[1].replace('>', '') : fromHeader,
              clientId: 'usr_dmcar_01',
              clientName: 'DM CAR',
              clientCif: 'B-89324511',
              clientAddress: '',
              clientEmail: '',
              clientPhone: '',
              items: parsedItems,
              subtotal: extracted?.baseAmount || extracted?.totalAmount || 0,
              applyIva: true,
              ivaRate: 21,
              ivaAmount: extracted?.ivaAmount || 0,
              applyIrpf: false,
              irpfRate: 0,
              irpfAmount: 0,
              total: extracted?.totalAmount || extracted?.baseAmount || 0,
              status: 'borrador',
              isLocked: false,
              createdAt: new Date().toISOString(),
              attachmentBase64: base64Data,
              attachmentFilename: pdfItem.filename,
              attachmentMimeType: pdfItem.mimeType || 'application/pdf'
            } as any;
            newFacturas.push(newDoc);
          } catch (partErr) {
            console.warn(`Error procesando adjunto ${pdfItem.filename}:`, partErr);
          }
        }
      } catch (msgErr) {
        console.warn(`Error procesando mensaje ${msg.id}:`, msgErr);
      }
    }

    // Actualizar la horquilla temporal para la siguiente búsqueda
    if (typeof window !== 'undefined') {
      localStorage.setItem('gestarian_last_gmail_scan_timestamp', String(currentScanTimestamp));
    }

    // Persistir localmente en bandeja de facturas detectadas pendientes de revisión
    if (newFacturas.length > 0 && typeof window !== 'undefined') {
      try {
        const existingRaw = localStorage.getItem('gestarian_detected_invoices_v1');
        const existingDocs: GestarianDocument[] = existingRaw ? JSON.parse(existingRaw) : [];
        const existingNumbers = new Set(existingDocs.map(d => d.number));
        const uniqueNew = newFacturas.filter(d => !existingNumbers.has(d.number));
        const merged = [...uniqueNew, ...existingDocs];
        localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(merged));
      } catch (e) {
        console.error("Error guardando facturas detectadas", e);
      }
    }

    return newFacturas;
  } catch (error) {
    console.error("Error en scanGmailForInvoices", error);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gestarian_last_gmail_scan_timestamp', String(currentScanTimestamp));
    }
    return [];
  }
}

