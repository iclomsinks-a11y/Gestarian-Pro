/**
 * Servicio de mensajería electrónica preparado para Resend API
 * https://resend.com
 */

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulatedCode?: string;
  error?: string;
  isSimulated?: boolean;
}

export async function sendRegistrationVerificationCode(
  email: string,
  userName: string
): Promise<SendEmailResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `${code} es tu código de verificación de GESTARIAN`,
        fromName: 'GESTARIAN Core',
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f2942; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">GESTARIAN</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Plataforma Oficial de Gestión de Talleres</p>
            </div>
            <p style="color: #334155; font-size: 14px;">Hola <strong>${userName}</strong>,</p>
            <p style="color: #334155; font-size: 14px;">Introduce el siguiente código de 6 dígitos para verificar tu cuenta e iniciar sesión:</p>
            <div style="background: #f1f5f9; padding: 18px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f2942; border-radius: 8px; border: 1px solid #cbd5e1; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Este código es válido durante 15 minutos.</p>
          </div>
        `,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        messageId: data.messageId,
        simulatedCode: code,
        isSimulated: data.isSimulated,
      };
    }
  } catch (err) {
    console.warn('Fallo al invocar /api/send-email para código de verificación:', err);
  }

  return {
    success: true,
    messageId: `msg_${Date.now()}`,
    simulatedCode: code,
    isSimulated: true,
  };
}

export async function sendDocumentEmail(
  toEmail: string,
  clientName: string,
  docType: 'presupuesto' | 'factura' | string,
  docNumber: string,
  totalAmount: number,
  options?: {
    shortUrl?: string;
    trackingUrl?: string;
    clientPortalUrl?: string;
    userLogoUrl?: string;
    userName?: string;
    observations?: string;
    itemsSummary?: { description: string; quantity: number; unitPrice: number; amount: number }[];
  }
): Promise<SendEmailResult> {
  const docTitle = docType === 'presupuesto' ? 'Presupuesto' : docType === 'factura' ? 'Factura' : 'Documento Oficial';
  const senderName = options?.userName || 'GESTARIAN';
  const logoHeader = options?.userLogoUrl
    ? `<img src="${options.userLogoUrl}" alt="${senderName}" style="max-height:70px; max-width:220px; display:block; margin:0 auto 16px auto; border-radius:6px;" />`
    : `<h2 style="color: #0f2942; margin: 0; font-size: 22px; font-weight: 800; text-align:center;">${senderName}</h2>`;

  const shortDocUrl = options?.shortUrl || `https://www.gestarian.com/doc/${docNumber}`;
  const trackingUrl = options?.trackingUrl || `https://www.gestarian.com/exp/${docNumber}`;
  const appPortalUrl = options?.clientPortalUrl || `https://www.gestarian.com/app`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      ${logoHeader}
      
      <div style="border-top: 2px solid #0f2942; padding-top: 20px; margin-top: 12px;">
        <h3 style="color: #0f2942; margin-top: 0; font-size: 18px;">${docTitle} Oficial ${docNumber}</h3>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Estimado/a <strong>${clientName}</strong>,<br/>
          Le adjuntamos su <strong>${docTitle} ${docNumber}</strong> por un importe total de <strong style="color:#0f2942; font-size:16px;">${totalAmount.toFixed(2)} €</strong>.
        </p>

        ${options?.observations ? `<div style="background-color: #f8fafc; border-left: 4px solid #0f2942; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #475569;">${options.observations.replace(/\n/g, '<br/>')}</div>` : ''}

        <div style="margin: 24px 0; padding: 20px; background-color: #f1f5f9; border-radius: 10px; border: 1px solid #cbd5e1;">
          <h4 style="margin: 0 0 12px 0; color: #0f2942; font-size: 14px; uppercase; letter-spacing: 0.5px;">Acceso Directo y Seguimiento</h4>
          
          <div style="margin-bottom: 12px;">
            <a href="${shortDocUrl}" target="_blank" style="display: inline-block; background-color: #0f2942; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px;">
              📄 Ver y Descargar Documento (PDF)
            </a>
            <div style="margin-top: 4px; font-size: 11px; color: #64748b;">${shortDocUrl}</div>
          </div>

          <div>
            <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px;">
              🔍 Área de Cliente (Seguimiento de Expediente)
            </a>
            <div style="margin-top: 4px; font-size: 11px; color: #64748b;">${trackingUrl}</div>
          </div>
        </div>

        <p style="color: #64748b; font-size: 13px; margin-top: 24px; text-align: center;">
          Gracias por su confianza.<br/>
          <strong>${senderName}</strong>
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        subject: `${docTitle} ${docNumber} - ${senderName}`,
        fromName: senderName,
        html: htmlContent,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        messageId: data.messageId,
        isSimulated: data.isSimulated,
      };
    }
  } catch (err) {
    console.warn('Fallo al enviar correo con Resend API:', err);
  }

  return {
    success: true,
    messageId: `doc_${Date.now()}`,
    isSimulated: true,
  };
}

