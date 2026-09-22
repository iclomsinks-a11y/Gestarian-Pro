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
export const GESTARIAN_NOTIFICACIONES_DOMAIN = 'https://notificaciones.gestarian.com';

/**
 * Dominio base oficial para el despacho y generación de enlaces cortos a presupuestos,
 * expedientes y documentos públicos de clientes.
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('gestarian_notificaciones_domain');
    if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');

    // En entorno de desarrollo local (localhost o red local), usar el origen local
    // para permitir que las pruebas en WhatsApp Web abran el documento en la máquina actual
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.')) {
      return window.location.origin;
    }
  }
  return GESTARIAN_NOTIFICACIONES_DOMAIN;
}

export function encodeDocData(doc: GestarianDocument): string {
  try {
    const payload = { n: doc.number || doc.id, t: doc.type, e: doc.expediente, cn: doc.clientName, cc: doc.clientCif, cp: doc.clientPhone, ce: doc.clientEmail, ca: doc.clientAddress, tot: doc.total, sub: doc.subtotal, iva: doc.ivaAmount, vp: doc.vehiclePlate, vb: doc.vehicleBrand, vm: doc.vehicleModel, vd: doc.vehicleDeliveryDate, dt: doc.date, notes: doc.notes, items: (doc.items || []).map((i) => ({ d: i.description, q: i.quantity, u: i.unitPrice, a: i.amount })) };
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
  } catch (e) { console.error('Error encoding doc data payload:', e); return ''; }
}

/**
 * Genera el enlace corto directo al documento / presupuesto alojado en notificaciones.gestarian.com
 * Incluye el payload codificado para garantizar que el documento se pueda visualizar inmediatamente
 * en cualquier dispositivo aunque no esté en el almacenamiento local del cliente.
 */
export function generateDocumentPdfUrl(doc: GestarianDocument | string): string {
  const baseUrl = getAppBaseUrl();
  const docNum = typeof doc === 'object' ? (doc.number || doc.id) : doc;
  const cleanDoc = encodeURIComponent(docNum.trim().toUpperCase());
  if (typeof doc === 'object') {
    const encoded = encodeDocData(doc);
    if (encoded) {
      return `${baseUrl}/doc/${cleanDoc}?data=${encoded}`;
    }
  }
  return `${baseUrl}/doc/${cleanDoc}`;
}

export function generateExpedienteTrackingUrl(expedienteNum: string, doc?: GestarianDocument): string {
  const baseUrl = getAppBaseUrl();
  const cleanExp = (expedienteNum || (doc?.expediente) || '').trim().toUpperCase();
  return `${baseUrl}/exp/${encodeURIComponent(cleanExp)}`;
}

export function generateClientPortalAppUrl(): string {
  return `${getAppBaseUrl()}/?view=app`;
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

export function buildDocumentDispatchPayload(doc: GestarianDocument, client: Client, user: AppUser, targetChannel?: 'whatsapp' | 'email'): DispatchResult {
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
  const docPdfUrl = generateDocumentPdfUrl(doc);
  const trackingUrl = generateExpedienteTrackingUrl(expedienteNum, doc);
  const appDownloadUrl = generateClientPortalAppUrl();
  syncShortLinkToSupabase(`doc_${docNum}`, docPdfUrl, docNum, expedienteNum, doc).catch(() => {});
  syncShortLinkToSupabase(`exp_${expedienteNum}`, trackingUrl, docNum, expedienteNum, doc).catch(() => {});
  const effectiveLogoUrl = user.logoUrl && (user.logoUrl.startsWith('http://') || user.logoUrl.startsWith('https://')) ? user.logoUrl : '';
  const vehiclePart = cleanPlate ? ` (Vehiculo: ${cleanPlate})` : '';
  const observationsText = doc.notes ? `\n\n*Nota:* ${doc.notes.trim()}` : '';
  if (activeChannel === 'whatsapp') {
    const whatsappText = `*${user.fullName}*\n\nEstimado/a ${client.name},\nLe adjuntamos su ${docTitle} *${docNum}*${vehiclePart} por importe de *${doc.total.toFixed(2)} EUR*.${observationsText}\n\n*Ver Documento PDF:*\n${docPdfUrl}\n\n*Estado en su Area de Cliente:*\n${trackingUrl}\n\n*Descargar App GESTARIAN:*\n${appDownloadUrl}\n\nGracias por su confianza.`;
    let cleanPhone = (client.phone || '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.replace('+', '');
    else if (cleanPhone.length === 9) cleanPhone = `34${cleanPhone}`;
    return { channel: 'whatsapp', recipient: client.phone || 'Telefono no asignado', message: whatsappText, shortUrl: docPdfUrl, expedienteNumber: expedienteNum, trackingUrl, clientPortalDownloadUrl: trackingUrl, appDownloadUrl, actionUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappText)}`, userLogoUrl: effectiveLogoUrl };
  } else {
    const emailSubject = `${docTitle} ${docNum} [Expediente ${expedienteNum}] - ${user.fullName}`;
    const emailBody = `*${user.fullName}*\n\nEstimado/a ${client.name},\nLe enviamos el ${docTitle} *${docNum}* [Expediente: *${expedienteNum}*]${vehiclePart} por importe total de *${doc.total.toFixed(2)} EUR*.${observationsText}\n\nVer Documento PDF:\n${docPdfUrl}\n\nEstado en su Area de Cliente:\n${trackingUrl}\n\nDescargar App GESTARIAN:\n${appDownloadUrl}\n\nGracias por su confianza.\nAtentamente,\n${user.fullName}\n${user.phone || ''}\n${user.email || ''}`;
    return { channel: 'email', recipient: client.email || 'correo@empresa.com', subject: emailSubject, message: emailBody, shortUrl: docPdfUrl, expedienteNumber: expedienteNum, trackingUrl, clientPortalDownloadUrl: trackingUrl, appDownloadUrl, actionUrl: `mailto:${client.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, userLogoUrl: effectiveLogoUrl };
  }
}

export async function sendDocumentViaApi(payload: DispatchResult, doc: GestarianDocument, user: AppUser): Promise<{ success: boolean; messageId?: string; isSimulated?: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-document-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: payload.recipient, clientName: doc.clientName, docType: doc.type, docNumber: doc.number, total: doc.total, shortUrl: payload.shortUrl, trackingUrl: payload.trackingUrl, appDownloadUrl: payload.appDownloadUrl, userName: user.fullName, observations: doc.notes || '', userLogoUrl: payload.userLogoUrl || '' }),
    });
    return await response.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error de conexion';
    return { success: false, error: message };
  }
}