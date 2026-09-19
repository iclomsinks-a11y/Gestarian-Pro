import { AppUser, Client, GestarianDocument, Appointment, QuarterlyReport, InternalNotification, DocumentType, SolicitudItem } from '../types';

const STORAGE_KEYS = {
  USER: 'gestarian_user_v1',
  CLIENTS: 'gestarian_clients_v1',
  DOCUMENTS: 'gestarian_documents_v1',
  APPOINTMENTS: 'gestarian_appointments_v1',
  NOTIFICATIONS: 'gestarian_notifications_v1',
  SOLICITUDES: 'gestarian_solicitudes_v1',
  ACTIVE_TIER: 'gestarian_tier_v1',
};

/**
 * Sanitiza matrículas eliminando cualquier guión o espacio intermedio.
 * Ejemplo: "9147-CCW" o "9147 CCW" -> "9147CCW"
 */
export function sanitizePlate(plate?: string): string {
  if (!plate) return '';
  return plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Extrae limpiamente el correlativo secuencial de 4 dígitos de cualquier documento o expediente,
 * evitando que el año (2026) o distorsiones de datos antiguos afecten la numeración.
 */
export function extractSequentialDigits(str?: string): string {
  if (!str) return '0001';
  const clean = str.trim().toUpperCase();

  // Si tiene guión (ej: PRE-2026-001, SOL-2026-004)
  if (clean.includes('-')) {
    const parts = clean.split('-');
    const lastPart = parts[parts.length - 1].replace(/\D/g, '');
    if (lastPart) {
      return lastPart.padStart(4, '0').slice(-4);
    }
  }

  // Si coincide con patrón P266001, E266001, etc. (donde el 6 de 2026 se coló por error en el pasado)
  const corrupt6Match = clean.match(/^[A-Z]{1,3}266(\d{3,4})$/i);
  if (corrupt6Match) {
    return corrupt6Match[1].padStart(4, '0').slice(-4);
  }

  // Si coincide con patrón oficial P260001, E260001, F260001, FP260001, OT260001...
  const stdMatch = clean.match(/^[A-Z]{1,3}26(\d{4})$/i);
  if (stdMatch) {
    return stdMatch[1];
  }

  // Extracción genérica de dígitos
  const digits = clean.replace(/\D/g, '');
  if (!digits) return '0001';

  // Si empieza por 2026 y tiene al menos 7 dígitos (ej: 2026001)
  if (digits.startsWith('2026') && digits.length >= 7) {
    return digits.slice(4).padStart(4, '0').slice(-4);
  }
  // Si empieza por 266 y tiene al menos 6 dígitos (ej: 266001)
  if (digits.startsWith('266') && digits.length >= 6) {
    return digits.slice(3).padStart(4, '0').slice(-4);
  }
  // Si empieza por 26 y tiene al menos 6 dígitos (ej: 260001)
  if (digits.startsWith('26') && digits.length >= 6) {
    return digits.slice(2).padStart(4, '0').slice(-4);
  }

  return digits.padStart(4, '0').slice(-4);
}

/**
 * Obtiene el prefijo oficial del tipo de documento:
 * - Presupuesto: P26
 * - Expediente: E26
 * - Factura: F26
 * - Factura Proforma: FP26
 * - Factura Rectificativa: FR26
 * - Recibo: R26
 * - Orden de Trabajo: OT26
 */
export function getDocumentPrefix(type: DocumentType | string): string {
  const currentYear = new Date().getFullYear();
  const year2Digits = String(currentYear).slice(-2); // "26"

  const lower = String(type).toLowerCase();
  if (lower.includes('solicitud')) return `S${year2Digits}`;
  if (lower.includes('presupuesto')) return `P${year2Digits}`;
  if (lower.includes('expediente')) return `E${year2Digits}`;
  if (lower.includes('proforma')) return `FP${year2Digits}`;
  if (lower.includes('rectificativa')) return `FR${year2Digits}`;
  if (lower.includes('factura') && !lower.includes('recibida')) return `F${year2Digits}`;
  if (lower.includes('recibo') || lower.includes('abono')) return `R${year2Digits}`;
  if (lower.includes('orden')) return `OT${year2Digits}`;
  return `D${year2Digits}`;
}

/**
 * Genera el siguiente número de documento oficial:
 * - Si proviene de un expediente/presupuesto/solicitud vinculado, mantiene la misma terminación de 4 dígitos reservada.
 * - Para Recibos parciales de un mismo expediente: 1º R26XXXX, 2º 2R26XXXX, 3º 3R26XXXX...
 * - Si es un documento raíz (ej. Presupuesto nuevo independiente):
 *   Tiene en cuenta tanto los presupuestos existentes como las solicitudes registradas (S26XXXX),
 *   respetando que los 4 dígitos de cada solicitud están RESERVADOS exclusivamente para su propio presupuesto.
 */
export function getNextDocumentNumber(
  type: DocumentType | string,
  existingDocs: GestarianDocument[],
  linkedExpedienteOrNumber?: string,
  customSolicitudes?: SolicitudItem[]
): string {
  const currentYear = new Date().getFullYear();
  const year2Digits = String(currentYear).slice(-2); // "26"
  const prefix = getDocumentPrefix(type);
  const isReceipt = String(type).toLowerCase().includes('recibo') || String(type).toLowerCase().includes('abono');

  // Si existe un expediente, solicitud o presupuesto vinculado (ej: E260001, S260004 o P260004), heredamos los 4 últimos dígitos
  if (linkedExpedienteOrNumber) {
    const last4 = extractSequentialDigits(linkedExpedienteOrNumber);

    if (isReceipt) {
      // Contamos cuántos recibos previos existen para este mismo expediente
      const existingReceipts = existingDocs.filter((d) => {
        const isRec = d.type === 'recibo_abono' || (d.type as string) === 'recibo' || String(d.type).includes('recibo');
        if (!isRec) return false;
        const expDigits = extractSequentialDigits(d.expediente || d.number || '');
        return expDigits === last4;
      });

      const receiptIndex = existingReceipts.length + 1;
      if (receiptIndex > 1) {
        return `${receiptIndex}R${year2Digits}${last4}`;
      }
      return `R${year2Digits}${last4}`;
    }

    return `${prefix}${last4}`;
  }

  // Si es un presupuesto o documento raíz nuevo independiente:
  // Buscamos el correlativo máximo considerando presupuestos existentes Y solicitudes registradas con ID reservado (S26XXXX)
  let maxSeq = 0;
  existingDocs.forEach((d) => {
    if (d.number) {
      const seqStr = extractSequentialDigits(d.number);
      const numPart = parseInt(seqStr, 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
    if (d.expediente) {
      const seqStr = extractSequentialDigits(d.expediente);
      const numPart = parseInt(seqStr, 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  const solicitudes = customSolicitudes || getStoredSolicitudes();
  solicitudes.forEach((s) => {
    const seqStr = extractSequentialDigits(s.number || s.id || s.expediente);
    const numPart = parseInt(seqStr, 10);
    if (!isNaN(numPart) && numPart > maxSeq) {
      maxSeq = numPart;
    }
  });

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Genera el ID y número correlativo de una nueva Solicitud de Presupuesto:
 * Formato: S26XXXX (ej: S260004), siendo XXXX el número del último presupuesto registrado + 1.
 * Al generarse, esos 4 dígitos quedan reservados para el presupuesto y expediente que generará dicha solicitud.
 */
export function getNextSolicitudData(
  existingDocs?: GestarianDocument[],
  existingSolicitudes?: SolicitudItem[]
): {
  id: string;
  number: string;
  expediente: string;
  seqDigits: string;
} {
  const currentYear = new Date().getFullYear();
  const year2Digits = String(currentYear).slice(-2); // "26"

  const docs = existingDocs || getStoredDocuments();
  const solicitudes = existingSolicitudes || getStoredSolicitudes();

  let maxSeq = 0;

  docs.forEach((d) => {
    if (d.number) {
      const seqStr = extractSequentialDigits(d.number);
      const numPart = parseInt(seqStr, 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
    if (d.expediente) {
      const seqStr = extractSequentialDigits(d.expediente);
      const numPart = parseInt(seqStr, 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  solicitudes.forEach((s) => {
    const seqStr = extractSequentialDigits(s.number || s.id || s.expediente);
    const numPart = parseInt(seqStr, 10);
    if (!isNaN(numPart) && numPart > maxSeq) {
      maxSeq = numPart;
    }
  });

  const nextSeq = maxSeq + 1;
  const seqDigits = String(nextSeq).padStart(4, '0');

  return {
    id: `S${year2Digits}${seqDigits}`,
    number: `S${year2Digits}${seqDigits}`,
    expediente: `E${year2Digits}${seqDigits}`,
    seqDigits,
  };
}

/**
 * Genera el número de expediente oficial:
 * Formato: E26 para este año seguido de los cuatro dígitos del presupuesto.
 * Ejemplo: Si el presupuesto es P260002 -> Expediente es E260002.
 */
export function getExpedienteFromDocNumber(docNumber?: string): string {
  const currentYear = new Date().getFullYear();
  const year2Digits = String(currentYear).slice(-2); // "26"
  if (!docNumber) return `E${year2Digits}0001`;

  const last4 = extractSequentialDigits(docNumber);
  return `E${year2Digits}${last4}`;
}

export const DEFAULT_USER: AppUser = {
  id: 'usr_dmcar_01',
  fullName: 'DM CAR',
  fiscalAddress: 'Polígono Industrial Las Eras, Nave 14, 28052 Madrid, España',
  cif: 'B-89324511',
  phone: '+34 912 345 678',
  email: 'contacto@dmcar.es',
  verified: true,
  createdAt: '2026-01-10T10:00:00Z',
  currentTier: 'pro',
  businessType: 'empresa',
  sector: 'Automoción',
  branch: 'Reparaciones',
  specialty: 'Chapa y Pintura',
  metisTechnicalAdviceEnabled: true,
  bgPortraitUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
  bgLandscapeUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
  bgBentoMenuUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop',
  employees: [
    {
      id: 'emp_01',
      name: 'MIGUEL ÁNGEL TORRES',
      dni: '48392019K',
      phone: '+34 611 223 344',
      email: 'm.torres@dmcar.es',
      role: 'autorizado',
      profession: 'Chapista de automoción (Carrocería y Bancada)',
      cnoCode: '7313',
      cnoDescription: 'Chapistas y caldereros',
      cotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
      accidentsEpigrafe: '45.20 (Reparación de vehículos)',
      permissions: {
        accessExpedientes: true,
        accessSolicitudes: false,
        accessClientes: true,
        accessPresupuestos: true,
        accessCitas: false,
        accessTaller: true,
        accessFacturacion: false,
        accessBalances: false,
        accessProveedores: false,
        accessIncidencias: true,
        manageWorkOrders: true,
        createBudgets: true,
        canSetPrices: false,
        scanPlates: true,
        viewAgenda: false,
        viewReports: false,
      },
    },
    {
      id: 'emp_02',
      name: 'SERGIO NAVARRO',
      dni: '51928374M',
      phone: '+34 622 334 455',
      email: 's.navarro@dmcar.es',
      role: 'autorizado',
      profession: 'Pintor de vehículos (Preparación y Cabina)',
      cnoCode: '7232',
      cnoDescription: 'Pintores en las industrias manufactureras y de vehículos',
      cotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
      accidentsEpigrafe: '45.20 (Reparación de vehículos)',
      permissions: {
        accessExpedientes: true,
        accessSolicitudes: false,
        accessClientes: true,
        accessPresupuestos: true,
        accessCitas: true,
        accessTaller: true,
        accessFacturacion: false,
        accessBalances: false,
        accessProveedores: false,
        accessIncidencias: true,
        manageWorkOrders: true,
        createBudgets: true,
        canSetPrices: false,
        scanPlates: true,
        viewAgenda: true,
        viewReports: false,
      },
    },
  ],
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_01',
    clientNumber: 1,
    name: 'INNOVA CONSULTING S.L.',
    cif: 'B-83492019',
    address: 'Paseo de la Castellana 110, 28046 Madrid',
    phone: '+34 914 556 789',
    email: 'administracion@innovaconsulting.es',
    clientType: 'empresa',
    hasAppInstalled: true,
    plates: ['4512LKT', '9821HMD'],
    vehicles: [
      {
        plate: '4512LKT',
        brand: 'RENAULT',
        model: 'Megane E-Tech',
        color: 'Azul Rayo',
        vin: 'VF1RJB00568912345',
        images: [
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        ],
        ocrData: {
          plate: '4512LKT',
          brand: 'RENAULT',
          model: 'Megane E-Tech EV60',
          vin: 'VF1RJB00568912345',
          color: 'Azul Rayo',
          registrationDate: '15/03/2023',
          engineDisplacement: '0',
          power: '160 kW (218 CV)',
          fuelType: 'Eléctrico 100%',
          euroNorm: 'Cero Emisiones (0)',
          tareWeight: '1640 kg',
          maxAuthorizedMass: '2158 kg',
          seats: '5',
          vehicleCategory: 'M1 (Turismo)',
          version: 'Techno EV60 Optimum Charge',
          itvExpiryDate: '15/03/2027',
          circulationPermitImages: [
            'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
          ],
          technicalSheetImages: [
            'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
          ],
        },
      },
      {
        plate: '9821HMD',
        brand: 'MERCEDES-BENZ',
        model: 'Clase A 200d',
        color: 'Gris Montaña',
        vin: 'WDD1770081J456789',
        images: [],
      },
    ],
    notes: 'Cliente preferente con app móvil DM CAR instalada. Facturación trimestral de soporte.',
  },
  {
    id: 'cli_02',
    clientNumber: 2,
    name: 'JUAN ANTONIO ABELLO',
    cif: '53291048Z',
    address: 'Carrer de Mallorca 240, 08008 Barcelona',
    phone: '+34 654 321 098',
    email: 'j.abello@gmail.com',
    clientType: 'particular',
    isAutonomo: false,
    hasAppInstalled: false,
    plates: ['9147CCW'],
    vehicles: [
      {
        plate: '9147CCW',
        brand: 'VOLKSWAGEN',
        model: 'Golf VII 1.5 TSI EVO',
        color: 'Blanco Puro',
        vin: 'WVWZZZAUZHP123987',
        images: [
          'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
        ],
      },
    ],
    notes: 'Cliente particular. Contacto habitual y presupuestos por WhatsApp.',
  },
  {
    id: 'cli_03',
    clientNumber: 3,
    name: 'LOGÍSTICA Y DISTRIBUCIÓN IBERO S.A.',
    cif: 'A-28901234',
    address: 'Polígono Industrial Las Mercedes, 28830 Madrid',
    phone: '+34 918 765 432',
    email: 'cuentas@logisticaprom.es',
    clientType: 'empresa',
    hasAppInstalled: false,
    plates: ['7890MRT', '1122BBC', '3344DDD'],
    vehicles: [
      {
        plate: '7890MRT',
        brand: 'IVECO',
        model: 'Daily 35S15',
        color: 'Blanco Polar',
        vin: 'ZCFC35A8105987123',
        images: [],
      },
      {
        plate: '1122BBC',
        brand: 'FORD',
        model: 'Transit Custom',
        color: 'Plata Moondust',
        vin: 'WF0YXXTTGYLA12345',
        images: [],
      },
      {
        plate: '3344DDD',
        brand: 'PEUGEOT',
        model: 'Partner BlueHDi',
        color: 'Gris Artense',
        vin: 'VR3ECYHZJNJ654321',
        images: [],
      },
    ],
    notes: 'Contrato de mantenimiento preventivo de flota. Avisos por email corporativo.',
  },
];

export const INITIAL_DOCUMENTS: GestarianDocument[] = [
  {
    id: 'doc_pre_001',
    type: 'presupuesto',
    number: 'P260001',
    series: 'A',
    date: '2026-02-14',
    dueDate: '2026-03-14',
    expediente: 'E260001',
    vehiclePlate: '4512LKT',
    vehicleBrand: 'RENAULT',
    vehicleModel: 'Megane E-Tech',
    issuerId: 'usr_dmcar_01',
    issuerName: 'DM CAR',
    issuerCif: 'B-89324511',
    issuerAddress: 'Polígono Industrial Las Eras, Nave 14, 28052 Madrid, España',
    issuerPhone: '+34 912 345 678',
    issuerEmail: 'contacto@dmcar.es',
    clientId: 'cli_01',
    clientName: 'INNOVA CONSULTING S.L.',
    clientCif: 'B-83492019',
    clientAddress: 'Paseo de la Castellana 110, 28046 Madrid',
    clientEmail: 'administracion@innovaconsulting.es',
    clientPhone: '+34 914 556 789',
    items: [
      {
        id: 'item_1',
        description: 'Reparación de aleta delantera y paragolpes con pintura bicapa',
        quantity: 1,
        unitPrice: 420,
        amount: 420,
      },
      {
        id: 'item_2',
        description: 'Mano de obra especializada chapa y pintura (3.5 horas)',
        quantity: 3.5,
        unitPrice: 55,
        amount: 192.5,
      },
    ],
    subtotal: 612.5,
    applyIva: true,
    ivaRate: 21,
    ivaAmount: 128.63,
    applyIrpf: false,
    irpfRate: 0,
    irpfAmount: 0,
    total: 741.13,
    status: 'aceptado',
    isLocked: false,
    notes: 'Validez del presupuesto: 30 días.\nEste presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.',
  },
  {
    id: 'doc_pre_002',
    type: 'presupuesto',
    number: 'P260002',
    series: 'A',
    date: '2026-03-01',
    dueDate: '2026-03-31',
    expediente: 'E260002',
    vehiclePlate: '9147CCW',
    vehicleBrand: 'VOLKSWAGEN',
    vehicleModel: 'Golf VII 1.5 TSI EVO',
    issuerId: 'usr_dmcar_01',
    issuerName: 'DM CAR',
    issuerCif: 'B-89324511',
    issuerAddress: 'Polígono Industrial Las Eras, Nave 14, 28052 Madrid, España',
    issuerPhone: '+34 912 345 678',
    issuerEmail: 'contacto@dmcar.es',
    clientId: 'cli_02',
    clientName: 'JUAN ANTONIO ABELLO',
    clientCif: '53291048Z',
    clientAddress: 'Carrer de Mallorca 240, 08008 Barcelona',
    clientEmail: 'j.abello@gmail.com',
    clientPhone: '+34 654 321 098',
    items: [
      {
        id: 'item_3',
        description: 'Sustitución y pintado de aleta trasera izquierda y moldura',
        quantity: 1,
        unitPrice: 380,
        amount: 380,
      },
      {
        id: 'item_4',
        description: 'Mano de obra desmontaje, bancada ligera y ajuste (4 horas)',
        quantity: 4,
        unitPrice: 55,
        amount: 220,
      },
    ],
    subtotal: 600,
    applyIva: true,
    ivaRate: 21,
    ivaAmount: 126,
    applyIrpf: false,
    irpfRate: 0,
    irpfAmount: 0,
    total: 726,
    status: 'borrador',
    isLocked: false,
    notes: 'Validez del presupuesto: 30 días.\nEste presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.',
  },
  {
    id: 'doc_fac_001',
    type: 'factura',
    number: 'F260001',
    series: 'A',
    date: '2026-02-05',
    dueDate: '2026-03-05',
    expediente: 'E260001',
    vehiclePlate: '4512LKT',
    issuerId: 'usr_dmcar_01',
    issuerName: 'DM CAR',
    issuerCif: 'B-89324511',
    issuerAddress: 'Polígono Industrial Las Eras, Nave 14, 28052 Madrid, España',
    issuerPhone: '+34 912 345 678',
    issuerEmail: 'contacto@dmcar.es',
    clientId: 'cli_01',
    clientName: 'INNOVA CONSULTING S.L.',
    clientCif: 'B-83492019',
    clientAddress: 'Paseo de la Castellana 110, 28046 Madrid',
    clientEmail: 'administracion@innovaconsulting.es',
    clientPhone: '+34 914 556 789',
    items: [
      {
        id: 'item_5',
        description: 'Reparación integral de chapa y acabado en cabina de pintura',
        quantity: 1,
        unitPrice: 950,
        amount: 950,
      },
    ],
    subtotal: 950,
    applyIva: true,
    ivaRate: 21,
    ivaAmount: 199.5,
    applyIrpf: false,
    irpfRate: 0,
    irpfAmount: 0,
    total: 1149.5,
    status: 'enviada',
    isLocked: true,
    sentAt: '2026-02-06T11:20:00Z',
    confirmedAt: '2026-02-05T18:00:00Z',
    notes: 'Factura oficial enviada al cliente. Bloqueada conforme a normativa.',
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app_01',
    clientId: 'cli_01',
    clientName: 'INNOVA CONSULTING S.L.',
    budgetId: 'doc_pre_001',
    date: '2026-03-02',
    time: '11:00',
    title: 'Recepción de vehículo Megane E-Tech tras aceptación de P260001',
    status: 'confirmada',
    notes: 'Entrega de vehículo en taller para chapa y pintura.',
  },
];

export function getStoredUser(): AppUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      let fullName = parsed.fullName || DEFAULT_USER.fullName;
      if (fullName.includes('CARLOS MENDOZA') || fullName.includes('TALLER DE CHAPA')) {
        fullName = 'DM CAR';
      }
      return { 
        ...DEFAULT_USER, 
        ...parsed,
        fullName,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_USER;
}

export function saveStoredUser(user: AppUser): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getStoredClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (raw) {
      const parsed: Client[] = JSON.parse(raw);
      let maxNum = 0;
      parsed.forEach((c) => {
        if (c.clientNumber && c.clientNumber > maxNum) maxNum = c.clientNumber;
      });
      return parsed.map((c, index) => {
        const initialMatch = INITIAL_CLIENTS.find((ic) => ic.id === c.id);
        const isCompany = c.clientType === 'empresa' || (c.cif && (c.cif.startsWith('B') || c.cif.startsWith('A'))) || false;
        
        // Sanitizar matrículas para que ninguna tenga guiones
        const sanitizedPlates = (c.plates || []).map(p => sanitizePlate(p));
        const sanitizedVehicles = (c.vehicles && c.vehicles.length > 0)
          ? c.vehicles.map((v) => ({
              ...v,
              plate: sanitizePlate(v.plate),
            }))
          : initialMatch?.vehicles?.map(v => ({ ...v, plate: sanitizePlate(v.plate) })) || sanitizedPlates.map(p => ({ plate: p }));

        return {
          ...c,
          clientType: c.clientType || (isCompany ? 'empresa' : 'particular'),
          hasAppInstalled: c.hasAppInstalled !== undefined ? c.hasAppInstalled : (initialMatch?.hasAppInstalled ?? false),
          plates: sanitizedPlates,
          vehicles: sanitizedVehicles,
          clientNumber: c.clientNumber ?? (maxNum > 0 ? ++maxNum : index + 1),
        };
      });
    }
  } catch {
    // fallback
  }
  return INITIAL_CLIENTS;
}

export function saveStoredClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function getStoredDocuments(): GestarianDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (raw) {
      const docs: GestarianDocument[] = JSON.parse(raw);
      // Migrar y sanitizar números, expedientes y matrículas existentes
      return docs.map((d) => {
        let number = d.number || '';
        const seq = extractSequentialDigits(number);
        const prefix = getDocumentPrefix(d.type || 'presupuesto');
        
        // Si el número era antiguo (PRE-, FAC-) o corrupto con el '6' sobrante de 2026 (ej: P266003)
        if (number.startsWith('PR-') || number.startsWith('PRE-') || number.startsWith('FAC-') || number.includes('266')) {
          number = `${prefix}${seq}`;
        } else if (!number.startsWith(prefix)) {
          number = `${prefix}${seq}`;
        }

        let expediente = d.expediente || '';
        if (!expediente || expediente.startsWith('EXP-') || expediente.includes('266')) {
          expediente = `E26${seq}`;
        }

        let issuerName = d.issuerName;
        if (!issuerName || issuerName.includes('TALLER DE CHAPA') || issuerName.includes('CARLOS MENDOZA')) {
          issuerName = 'DM CAR';
        }

        return {
          ...d,
          number,
          expediente,
          issuerName,
          vehiclePlate: sanitizePlate(d.vehiclePlate),
        };
      });
    }
  } catch {
    // fallback
  }
  return INITIAL_DOCUMENTS;
}

export function saveStoredDocuments(docs: GestarianDocument[]): void {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
}

export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_APPOINTMENTS;
}

export function saveStoredAppointments(apps: Appointment[]): void {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(apps));
}

export const INITIAL_NOTIFICATIONS: InternalNotification[] = [
  {
    id: 'notif_01',
    title: 'Orden de Trabajo en ejecución',
    message: 'Miguel Ángel Torres ha iniciado la orden E260001 para el vehículo 8492LMX.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    type: 'order_status_change',
    orderNumber: 'E260001',
    employeeName: 'Miguel Ángel Torres',
    newStatus: 'en_ejecucion',
  },
];

export function getStoredNotifications(): InternalNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveStoredNotifications(notifs: InternalNotification[]): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

/**
 * Calcula el informe trimestral agrupando facturas
 */
export function computeQuarterlyReport(
  documents: GestarianDocument[],
  quarter: '1T' | '2T' | '3T' | '4T',
  year: number = 2026
): QuarterlyReport {
  const quarterMonths: Record<'1T' | '2T' | '3T' | '4T', number[]> = {
    '1T': [1, 2, 3],
    '2T': [4, 5, 6],
    '3T': [7, 8, 9],
    '4T': [10, 11, 12],
  };

  const months = quarterMonths[quarter];
  const invoices = documents.filter((doc) => {
    if (doc.type !== 'factura') return false;
    const d = new Date(doc.date);
    return d.getFullYear() === year && months.includes(d.getMonth() + 1);
  });

  const totalSubtotal = invoices.reduce((acc, inv) => acc + inv.subtotal, 0);
  const totalIva = invoices.reduce((acc, inv) => acc + inv.ivaAmount, 0);
  const totalIrpf = invoices.reduce((acc, inv) => acc + inv.irpfAmount, 0);
  const totalGross = invoices.reduce((acc, inv) => acc + inv.total, 0);

  const quarterLabels: Record<'1T' | '2T' | '3T' | '4T', string> = {
    '1T': 'Enero - Marzo (Modelo 303 / 130)',
    '2T': 'Abril - Junio (Modelo 303 / 130)',
    '3T': 'Julio - Septiembre (Modelo 303 / 130)',
    '4T': 'Octubre - Diciembre (Modelo 303 / 130 / Resumen 390)',
  };

  return {
    year,
    quarter,
    periodLabel: quarterLabels[quarter],
    totalInvoices: invoices.length,
    totalSubtotal,
    totalIva,
    totalIrpf,
    totalGross,
    invoices,
  };
}

export const INITIAL_SOLICITUDES: SolicitudItem[] = [
  {
    id: 'S260004',
    number: 'S260004',
    expediente: 'E260004',
    clientName: 'Alejandro Morales Garrido',
    clientPhone: '611223344',
    clientEmail: 'alejandro.morales@gmail.com',
    vehiclePlate: '9821-KLS',
    vehicleBrand: 'VOLKSWAGEN',
    vehicleModel: 'GOLF VII 2.0 TDI',
    type: 'Chapa y Pintura - Aleta lateral y paragolpes',
    date: '18/09/2026',
    description: 'Golpe de aparcamiento en aleta delantera derecha y raspadura en paragolpes.',
    status: 'PENDIENTE',
  },
  {
    id: 'S260005',
    number: 'S260005',
    expediente: 'E260005',
    clientName: 'Transportes Vía Rápida S.L.',
    clientPhone: '644998877',
    clientEmail: 'contacto@viarapida.es',
    vehiclePlate: '4421-HJK',
    vehicleBrand: 'MERCEDES-BENZ',
    vehicleModel: 'SPRINTER 316 CDI',
    type: 'Carrocería Flota - Puerta corredera',
    date: '17/09/2026',
    description: 'Descuadre y abolladura en puerta lateral corredera para furgoneta de reparto.',
    status: 'PENDIENTE',
  },
  {
    id: 'S260006',
    number: 'S260006',
    expediente: 'E260006',
    clientName: 'Beatriz Navarro Cano',
    clientPhone: '655443322',
    clientEmail: 'b.navarro@hotmail.com',
    vehiclePlate: '7190-LPZ',
    vehicleBrand: 'RENAULT',
    vehicleModel: 'CLIO V 1.0 TCE',
    type: 'Pintura Completa Techo y Capó',
    date: '16/09/2026',
    description: 'Desgaste por sol y granizo leve en techo y capó delantero.',
    status: 'PENDIENTE',
  },
  {
    id: 'S260007',
    number: 'S260007',
    expediente: 'E260007',
    clientName: 'Logística Ibérica Norte',
    clientPhone: '633112233',
    clientEmail: 'flota@logisticaiberica.com',
    vehiclePlate: '2045-MRB',
    vehicleBrand: 'PEUGEOT',
    vehicleModel: 'BOXER L3H2',
    type: 'Sustitución retrovisor y aleta',
    date: '15/09/2026',
    description: 'Rotura de espejo exterior calefactable y pliegue de chapa en aleta izquierda.',
    status: 'PENDIENTE',
  },
];

export function getStoredSolicitudes(): SolicitudItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOLICITUDES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return INITIAL_SOLICITUDES;
}

export function saveStoredSolicitudes(solicitudes: SolicitudItem[]): void {
  localStorage.setItem(STORAGE_KEYS.SOLICITUDES, JSON.stringify(solicitudes));
}

export function addStoredSolicitud(solicitud: SolicitudItem): SolicitudItem[] {
  const current = getStoredSolicitudes();
  const updated = [solicitud, ...current];
  saveStoredSolicitudes(updated);
  return updated;
}
