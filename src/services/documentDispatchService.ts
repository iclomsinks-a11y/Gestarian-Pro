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
  actionUrl: string;
  userLogoUrl?: string;
}

export const GESTARIAN_OFFICIAL_DOMAIN = 'https://www.gestarian.com';

/**
 * Obtiene la URL base de la aplicación (entorno activo o dominio oficial)
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return GESTARIAN_OFFICIAL_DOMAIN;
}

/**
 * Codifica de forma segura los datos esenciales del documento para enviarlos en el enlace
 */
export function encodeDocData(doc: GestarianDocument): string {
  try {
    const payload = {
      n: doc.number || doc.id,
      t: doc.type,
      e: doc.expediente,
      cn: doc.clientName,
      cc: doc.clientCif,
      cp: doc.clientPhone,
      ce: doc.clientEmail,
      ca: doc.clientAddress,
      tot: doc.total,
      sub: doc.subtotal,
      iva: doc.ivaAmount,
      vp: doc.vehiclePlate,
      vb: doc.vehicleBrand,
      vm: doc.vehicleModel,
      vd: doc.vehicleDeliveryDate,
      dt: doc.date,
      notes: doc.notes,
      items: (doc.items || []).map((i) => ({
        d: i.description,
        q: i.quantity,
        u: i.unitPrice,
        a: i.amount,
      })),
    };
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
  } catch (e) {
    console.error('Error encoding doc data payload:', e);
    return '';
  }
}

/**
 * Genera la URL oficial corta al documento PDF
 */
export function generateDocumentPdfUrl(doc: GestarianDocument | string): string {
  const baseUrl = getAppBaseUrl();
  const docNum = typeof doc === 'object' ? (doc.number || doc.id) : doc;
  const cleanNum = docNum.trim().toUpperCase();
  return `${baseUrl}/doc/${encodeURIComponent(cleanNum)}`;
}

/**
 * Genera la URL oficial de seguimiento del expediente en tiempo real (Área de Cliente)
 */
export function generateExpedienteTrackingUrl(expedienteNum: string, doc?: GestarianDocument): string {
  const baseUrl = getAppBaseUrl();
  const cleanExp = (expedienteNum || (doc?.expediente) || '').trim().toUpperCase();
  return `${baseUrl}/exp/${encodeURIComponent(cleanExp)}`;
}

/**
 * Genera la URL oficial del Portal de Clientes
 */
export function generateClientPortalAppUrl(): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/?view=app`;
}

export const CLIENT_PORTAL_DOWNLOAD_URL = getAppBaseUrl();

/**
 * Determina si el cliente es una empresa (SL, SA, CIF societario) o particular (DNI/NIE)
 */
export function isCompanyClient(client?: Client | null): boolean {
  if (!client) return false;
  const cif = (client.cif || '').toUpperCase().trim();
  const name = (client.name || '').toUpperCase().trim();
  const companyPrefixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'N', 'P', 'Q', 'R', 'S', 'U', 'V', 'W'];
  
  if (companyPrefixes.some((p) => cif.startsWith(p))) return true;
  if (name.includes('S.L.') || name.includes('SL') || name.includes('S.A.') || name.includes('SA') || name.includes('S.C.P.') || name.includes('COOP')) {
    return true;
  }
  return false;
}

/**
 * Construye el mensaje oficial formateado según la especificación del sistema:
 * - Enlaces cortos y limpios (sin parámetros masivos en URL).
 * - Mensaje corporativo ágil y directo.
 * - Soporta envío mediante WhatsApp y Resend API.
 */
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
    default: docTitle = 'Documento'; break;
  }

  const isCompany = isCompanyClient(client);
  const activeChannel = targetChannel || (isCompany ? 'email' : 'whatsapp');

  // Numeración y expediente
  const docNum = doc.number || 'P260001';
  const expedienteNum = doc.expediente || getExpedienteFromDocNumber(docNum);
  const cleanPlate = sanitizePlate(doc.vehiclePlate || (client.vehicles && client.vehicles[0]?.plate) || (client.plates && client.plates[0]) || '');

  // URLs cortas
  const docPdfUrl = generateDocumentPdfUrl(doc);
  const trackingUrl = generateExpedienteTrackingUrl(expedienteNum, doc);

  // Registrar enlaces cortos en Supabase de forma asíncrona
  syncShortLinkToSupabase(`doc_${docNum}`, docPdfUrl, docNum, expedienteNum, doc).catch(() => {});
  syncShortLinkToSupabase(`exp_${expedienteNum}`, trackingUrl, docNum, expedienteNum, doc).catch(() => {});

  const effectiveLogoUrl = (user.logoUrl && (user.logoUrl.startsWith('http://') || user.logoUrl.startsWith('https://')))
    ? user.logoUrl
    : '';

  const header = `🏢 *${user.fullName}*`;

  // Encabezados adaptados
  const vehiclePart = cleanPlate ? ` (Vehículo: ${cleanPlate})` : '';
  
  // WhatsApp: Mensaje corporativo corto con enlaces limpios
  const bodyTextWhatsApp = `Estimado/a ${client.name},\nLe adjuntamos su ${docTitle} *${docNum}*${vehiclePart} por un importe de *${doc.total.toFixed(2)} €*.`;

  // Email (para empresas): Incluye desglose
  const bodyTextEmail = `Estimado/a ${client.name},\nLe enviamos el ${docTitle} *${docNum}* [Expediente: *${expedienteNum}*]${vehiclePart} por importe total de *${doc.total.toFixed(2)} €*.`;

  // Observaciones si existen
  const observationsText = doc.notes
    ? `\n\n*Nota:* ${doc.notes.trim()}`
    : '';

  // Enlaces directos cortos:
  const link1Section = `📄 *Ver Documento PDF:*\n${docPdfUrl}`;
  const link2Section = `🔍 *Ver Estado en Área de Cliente:*\n${trackingUrl}`;

  // Cierre de agradecimiento
  const closingText = `Gracias por su confianza.`;

  if (activeChannel === 'whatsapp') {
    // WHATSAPP
    const whatsappText = `${header}\n\n${bodyTextWhatsApp}${observationsText}\n\n${link1Section}\n\n${link2Section}\n\n${closingText}`;

    // Limpiar teléfono para API de WhatsApp
    let cleanPhone = (client.phone || '').replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.replace('+', '');
    } else if (cleanPhone.length === 9) {
      cleanPhone = `34${cleanPhone}`;
    }

    const whatsappActionUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappText)}`;

    return {
      channel: 'whatsapp',
      recipient: client.phone || 'Teléfono no asignado',
      message: whatsappText,
      shortUrl: docPdfUrl,
      expedienteNumber: expedienteNum,
      trackingUrl,
      clientPortalDownloadUrl: trackingUrl,
      actionUrl: whatsappActionUrl,
      userLogoUrl: effectiveLogoUrl,
    };
  } else {
    // EMAIL / RESEND
    const emailSubject = `${docTitle} ${docNum} [Expediente ${expedienteNum}] - ${user.fullName}`;
    const emailBody = `${header}\n\n${bodyTextEmail}${observationsText}\n\n${link1Section}\n\n${link2Section}\n\n${closingText}\n\nAtentamente,\n${user.fullName}\n${user.phone || ''}\n${user.email || ''}`;

    const mailtoActionUrl = `mailto:${client.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    return {
      channel: 'email',
      recipient: client.email || 'correo@empresa.com',
      subject: emailSubject,
      message: emailBody,
      shortUrl: docPdfUrl,
      expedienteNumber: expedienteNum,
      trackingUrl,
      clientPortalDownloadUrl: trackingUrl,
      actionUrl: mailtoActionUrl,
      userLogoUrl: effectiveLogoUrl,
    };
  }
}

