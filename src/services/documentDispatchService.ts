import { AppUser, Client, GestarianDocument } from '../types';
import { sanitizePlate, getExpedienteFromDocNumber } from './storage';
import { syncShortLinkToSupabase } from './supabaseClient';

export interface DispatchResult {
  channel: 'whatsapp' | 'email';
  recipient: string;
  subject?: string;
  message: string;
  shortUrl: string;
  expedienteNumber: string;
  trackingUrl: string;
  clientPortalDownloadUrl: string;
  appDownloadUrl: string;
  actionUrl: string;
  userLogoUrl?: string;
}

export const GESTARIAN_OFFICIAL_DOMAIN = 'https://www.gestarian.com';
export const NOTIFICACIONES_GESTRIAN_DOMAIN = 'https://notificaciones.gestrian.com';
export const GESTRIAN_NOTIFICACIONES_DOMAIN = NOTIFICACIONES_GESTRIAN_DOMAIN;
export const GESTARIAN_NOTIFICACIONES_DOMAIN = NOTIFICACIONES_GESTRIAN_DOMAIN;

/**
 * Dominio base para la generación de enlaces de notificaciones y documentos
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('gestarian_notificaciones_domain');
    if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.')) {
      return window.location.origin;
    }
  }
  return NOTIFICACIONES_GESTRIAN_DOMAIN;
}

/**
 * Genera el enlace ultra corto directo al documento para WhatsApp y notificaciones oficiales.
 * Formato: https://notificaciones.gestrian.com/d/NUMERO
 * Cumple estrictamente con el requerimiento del usuario: 'usa notificaciones.gestrian para whatsap'
 */
export function getShortDocumentUrl(doc: GestarianDocument | string): string {
  const docNum = typeof doc === 'object' ? (doc.number || doc.id) : doc;
  const cleanDoc = (docNum || '').trim().toUpperCase();
  return `${NOTIFICACIONES_GESTRIAN_DOMAIN}/d/${encodeURIComponent(cleanDoc)}`;
}

/**
 * Genera el enlace corto directo al documento / presupuesto.
 * Retorna la URL ultra corta limpia sin parámetros extensos ni sobrecarga de datos.
 */
export function generateDocumentPdfUrl(doc: GestarianDocument | string): string {
  return getShortDocumentUrl(doc);
}

export function generateExpedienteTrackingUrl(expedienteNum: string, doc?: GestarianDocument): string {
  const cleanExp = (expedienteNum || (doc?.expediente) || '').trim().toUpperCase();
  return `${NOTIFICACIONES_GESTRIAN_DOMAIN}/exp/${encodeURIComponent(cleanExp)}`;
}

export function generateClientPortalAppUrl(): string {
  return `${NOTIFICACIONES_GESTRIAN_DOMAIN}/?view=app`;
}

export const CLIENT_PORTAL_DOWNLOAD_URL = generateClientPortalAppUrl();

export function isCompanyClient(client?: Client | null): boolean {
  if (!client) return false;
  const cif = (client.cif || '').toUpperCase().trim();
  const name = (client.name || '').toUpperCase().trim();
  if (['A','B','C','D','E','F','G','J','N','P','Q','R','S','U','V','W'].some((p) => cif.startsWith(p))) return true;
  if (name.includes('S.L.') || name.includes('SL') || name.includes('S.A.') || name.includes('SA')) return true;
  return false;
}

export function buildDocumentDispatchPayload(
  doc: GestarianDocument,
  client: Client,
  user: AppUser,
  targetChannel?: 'whatsapp' | 'email'
): DispatchResult {
  let docTitle = 'Documento';
  switch (doc.type as string) {
    case 'presupuesto': docTitle = 'Presupuesto'; break;
    case 'factura': docTitle = 'Factura'; break;
    case 'factura_proforma': docTitle = 'Factura Proforma'; break;
    case 'factura_rectificativa': docTitle = 'Factura Rectificativa'; break;
    case 'recibo_abono': docTitle = 'Recibo'; break;
    case 'orden_trabajo': docTitle = 'Orden de Trabajo'; break;
  }
  const isCompany = isCompanyClient(client);
  const activeChannel = targetChannel || (isCompany ? 'email' : 'whatsapp');
  const docNum = doc.number || 'P260001';
  const expedienteNum = doc.expediente || getExpedienteFromDocNumber(docNum);
  const cleanPlate = sanitizePlate(doc.vehiclePlate || (client.vehicles && client.vehicles[0]?.plate) || (client.plates && client.plates[0]) || '');
  
  // Enlace ultra corto usando notificaciones.gestrian
  const shortDocUrl = getShortDocumentUrl(doc);
  const trackingUrl = generateExpedienteTrackingUrl(expedienteNum, doc);
  const appDownloadUrl = generateClientPortalAppUrl();

  // Sincronizar en segundo plano para acceso universal sin payload en URL
  syncShortLinkToSupabase(`doc_${docNum}`, shortDocUrl, docNum, expedienteNum, doc).catch(() => {});
  syncShortLinkToSupabase(`d_${docNum}`, shortDocUrl, docNum, expedienteNum, doc).catch(() => {});
  syncShortLinkToSupabase(`exp_${expedienteNum}`, trackingUrl, docNum, expedienteNum, doc).catch(() => {});

  const effectiveLogoUrl = user.logoUrl && (user.logoUrl.startsWith('http://') || user.logoUrl.startsWith('https://')) ? user.logoUrl : '';
  const vehiclePart = cleanPlate ? ` (Vehículo: ${cleanPlate})` : '';
  const observationsText = doc.notes ? `\n\n*Nota:* ${doc.notes.trim()}` : '';

  if (activeChannel === 'whatsapp') {
    // Mensaje ultra optimizado y conciso para WhatsApp con enlace lo más corto posible
    const whatsappText = `*${user.fullName || 'Taller'}*\n\n` +
      `Estimado/a ${client.name},\n` +
      `Le remitimos su ${docTitle} *${docNum}*${vehiclePart} por importe de *${(doc.total || 0).toFixed(2)} €*.${observationsText}\n\n` +
      `📄 *Visualizar, descargar o compartir:*\n` +
      `${shortDocUrl}\n\n` +
      `Gracias por su confianza.`;

    let cleanPhone = (client.phone || '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.replace('+', '');
    else if (cleanPhone.length === 9) cleanPhone = `34${cleanPhone}`;

    return {
      channel: 'whatsapp',
      recipient: client.phone || 'Teléfono no asignado',
      message: whatsappText,
      shortUrl: shortDocUrl,
      expedienteNumber: expedienteNum,
      trackingUrl,
      clientPortalDownloadUrl: trackingUrl,
      appDownloadUrl,
      actionUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappText)}`,
      userLogoUrl: effectiveLogoUrl
    };
  } else {
    // Envío directo por email (NUNCA se usa mailto para no abrir Gmail)
    const emailSubject = `${docTitle} ${docNum} [Expediente ${expedienteNum}] - ${user.fullName}`;
    const emailBody = `Estimado/a ${client.name},\n\n` +
      `Le remitimos su ${docTitle} ${docNum} [Expediente: ${expedienteNum}]${vehiclePart} por importe total de ${(doc.total || 0).toFixed(2)} €.${observationsText}\n\n` +
      `Le adjuntamos el documento oficial emitido por nuestro taller para su consulta, descarga o aceptación formal.\n\n` +
      `Visualizar, descargar o compartir:\n${shortDocUrl}\n\n` +
      `Seguimiento del expediente en su Área de Cliente:\n${trackingUrl}\n\n` +
      `Gracias por su confianza.\n\n` +
      `Atentamente,\n` +
      `${user.fullName}\n` +
      `${user.phone || ''}\n` +
      `${user.email || ''}`;

    return {
      channel: 'email',
      recipient: client.email || 'correo@empresa.com',
      subject: emailSubject,
      message: emailBody,
      shortUrl: shortDocUrl,
      expedienteNumber: expedienteNum,
      trackingUrl,
      clientPortalDownloadUrl: trackingUrl,
      appDownloadUrl,
      actionUrl: '', // NUNCA mailto: para evitar que se abra Gmail
      userLogoUrl: effectiveLogoUrl
    };
  }
}

export async function sendDocumentViaApi(
  payload: DispatchResult,
  doc: GestarianDocument,
  user: AppUser
): Promise<{ success: boolean; messageId?: string; isSimulated?: boolean; error?: string }> {
  try {
    const docLabel = doc.type === 'presupuesto' ? 'Presupuesto' : doc.type === 'factura' ? 'Factura' : 'Documento';
    const response = await fetch('/api/send-document-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.recipient,
        clientName: doc.clientName,
        docType: doc.type,
        docNumber: doc.number,
        total: doc.total,
        shortUrl: payload.shortUrl,
        trackingUrl: payload.trackingUrl,
        appDownloadUrl: payload.appDownloadUrl,
        userName: user.fullName,
        observations: doc.notes || '',
        userLogoUrl: payload.userLogoUrl || '',
        doc,
        attachedDocumentName: `${docLabel}_${doc.number || 'doc'}.pdf`,
      }),
    });
    return await response.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message };
  }
}
