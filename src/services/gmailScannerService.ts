import { GestarianDocument } from '../types';

export async function scanGmailForInvoices(accessToken: string): Promise<GestarianDocument[]> {
  try {
    // 1. Fetch messages with attachments (limit to last 5 for speed)
    const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=has:attachment filename:pdf&maxResults=5', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!listResponse.ok) {
      throw new Error(`Gmail API error: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json();

    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    const newFacturas: GestarianDocument[] = [];

    for (const msg of listData.messages) {
      // 2. Fetch full message details
      const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const msgData = await msgResponse.json();

      let pdfAttachmentId = null;
      let pdfFilename = '';

      // Find PDF attachment
      if (msgData.payload?.parts) {
        for (const part of msgData.payload.parts) {
          if (part.filename && part.filename.toLowerCase().endsWith('.pdf')) {
            pdfAttachmentId = part.body?.attachmentId;
            pdfFilename = part.filename;
            break;
          }
        }
      }

      if (pdfAttachmentId) {
        // 3. Download the attachment
        const attachResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${pdfAttachmentId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const attachData = await attachResponse.json();
        const base64Data = attachData.data.replace(/-/g, '+').replace(/_/g, '/');
        
        // Convert to data URI for Gemini OCR
        const base64Uri = `data:application/pdf;base64,${base64Data}`;

        // 4. Send to our OCR endpoint
        try {
          const isBrowser = typeof window !== 'undefined';
          const apiUrl = isBrowser ? '/api/scan-receipt' : 'http://localhost:3000/api/scan-receipt';
          
          const ocrResponse = await fetch(apiUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ image: base64Uri })
          });
          
          if (ocrResponse.ok) {
            const ocrResult = await ocrResponse.json();
            if (ocrResult.success && ocrResult.data) {
               // 5. Build GestarianDocument
               const extracted = ocrResult.data;
               const newDoc: GestarianDocument = {
                 id: `fact-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                 type: 'factura_recibida',
                 number: `FR26${String(Math.floor(Math.random() * 9000) + 1000)}`,
                 date: new Date().toISOString().split('T')[0],
                 issuerId: `prov-${Date.now()}`,
                 issuerName: extracted.issuerName || 'Proveedor Desconocido',
                 issuerCif: extracted.issuerCif || '',
                 issuerAddress: extracted.issuerAddress || '',
                 issuerPhone: '',
                 issuerEmail: '',
                 clientId: 'usr_dmcar_01',
                 clientName: 'DM CAR',
                 clientCif: 'B-89324511',
                 clientAddress: '',
                 clientEmail: '',
                 clientPhone: '',
                 items: [
                   {
                     id: `item-${Date.now()}`,
                     description: `Factura extraída de email (${pdfFilename})`,
                     quantity: 1,
                     unitPrice: extracted.baseAmount || 0,
                     amount: extracted.baseAmount || 0
                   }
                 ],
                 subtotal: extracted.baseAmount || 0,
                 applyIva: true,
                 ivaRate: 21,
                 ivaAmount: extracted.ivaAmount || 0,
                 applyIrpf: false,
                 irpfRate: 0,
                 irpfAmount: 0,
                 total: extracted.totalAmount || 0,
                 status: 'borrador',
                 isLocked: false,
                 createdAt: new Date().toISOString()
               };
               newFacturas.push(newDoc);
            }
          }
        } catch (e) {
          console.error("Error procesando OCR para " + pdfFilename, e);
        }
      }
    }

    // Save to local storage only if running in browser
    if (newFacturas.length > 0) {
      if (typeof window !== 'undefined') {
        try {
          const existingRaw = localStorage.getItem('gestarian_documents_v1');
          const existingDocs: GestarianDocument[] = existingRaw ? JSON.parse(existingRaw) : [];
          const merged = [...newFacturas, ...existingDocs];
          localStorage.setItem('gestarian_documents_v1', JSON.stringify(merged));
        } catch (e) {
          console.error("Error guardando facturas recibidas", e);
        }
      } else {
        // En Node.js (Servidor) aquí enviaríamos a Supabase en el futuro
        console.log(`[BACKEND SCANNER] ${newFacturas.length} nuevas facturas listas para ser persistidas.`);
      }
    }

    return newFacturas;
  } catch (error) {
    console.error("Error en scanGmailForInvoices", error);
    throw error;
  }
}
