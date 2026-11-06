import { AppUser, Client, ClientVehicle, GestarianDocument, Appointment } from '../types';
import { sanitizePlate, getNextDocumentNumber, getExpedienteFromDocNumber } from './storage';

/**
 * Palabras clave del sector automoción y servicios relacionados con medios de transporte
 * donde la matrícula del vehículo es fundamental al ser el vehículo el objeto sobre el que recae la facturación.
 */
const AUTOMOTIVE_AND_TRANSPORT_KEYWORDS = [
  'auto',
  'automoción',
  'automocion',
  'automóvil',
  'automovil',
  'automotriz',
  'autoescuela',
  'veh',
  'vehículo',
  'vehiculo',
  'taller',
  'chapa',
  'pintura',
  'mecánic',
  'mecanic',
  'electromecánic',
  'electromecanic',
  'reparac',
  'motor',
  'neumátic',
  'neumatic',
  'rueda',
  'carrocer',
  'dm car',
  'garaje',
  'mantenim',
  'alquiler',
  'rent',
  'renting',
  'coche',
  'concesionari',
  'compraventa',
  'desguace',
  'lavado',
  'itv',
  'luna',
  'parabrisa',
  'tuning',
  'moto',
  'motociclet',
  // Servicios de transporte y medios de transporte
  'transport',
  'transporte',
  'transportista',
  'camion',
  'camión',
  'furgon',
  'furgón',
  'furgoneta',
  'tractocamion',
  'tractocamión',
  'remolque',
  'semirremolque',
  'taxi',
  'vtc',
  'cabify',
  'uber',
  'autobus',
  'autobús',
  'autocar',
  'grúa',
  'grua',
  'auxilio',
  'asistencia en carretera',
  'mudanza',
  'logístic',
  'logistic',
  'flota',
  'ambulanci',
  'ambulancia',
  'paqueterí',
  'paqueteri',
  'mensajerí',
  'mensajeri',
];

/**
 * Determina si las funcionalidades de vehículo deben estar activadas.
 * Válido para TODAS las versiones (Lite, Quick, Pro, Enterprise):
 * Activación de vehículo SOLO para empresas del sector automoción o servicios
 * relacionados con medios de transporte donde la matrícula del vehículo es fundamental.
 */
export function isVehicleFeatureActive(user?: AppUser | null): boolean {
  if (!user) return false;
  if (user.enableVehicle === false) return false;

  const text = `${user.sector || ''} ${user.branch || ''} ${user.specialty || ''} ${user.fullName || ''}`.toLowerCase();

  // Si no tiene sector, rama ni especialidad configurados, verificar nombre por si es DM CAR o similar
  if (!user.sector && !user.branch && !user.specialty) {
    if (text.includes('dm car')) return true;
    return AUTOMOTIVE_AND_TRANSPORT_KEYWORDS.some((kw) => text.includes(kw));
  }

  return AUTOMOTIVE_AND_TRANSPORT_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Determina si el usuario/empresa pertenece al sector de automoción y reparación de vehículos
 * o servicios de transporte.
 */
export function isAutomotiveWorkshop(user?: AppUser | null): boolean {
  return isVehicleFeatureActive(user);
}

/**
 * Determina si la opción "Avisos de Mantenimiento de Vehículos e ITV"
 * debe mostrarse en la página de Configuración.
 * Requisito: solo se muestra si el sector de la empresa es automoción (o transporte/medios de transporte)
 * Y la especialidad o actividad es mecánica, reparación, mantenimiento o sus sinónimos.
 */
export function isVehicleMaintenanceEligible(user?: AppUser | null): boolean {
  if (!user) return false;
  const fullText = `${user.sector || ''} ${user.branch || ''} ${user.specialty || ''} ${user.fullName || ''}`.toLowerCase();

  const isAutomotiveSector = [
    'auto', 'automoción', 'automocion', 'automóvil', 'automovil',
    'automotriz', 'taller', 'vehículo', 'vehiculo', 'transporte', 'transport', 'dm car'
  ].some((kw) => fullText.includes(kw));

  const isMaintenanceSpecialty = [
    'mecánic', 'mecanic', 'reparac', 'mantenim', 'taller',
    'chapa', 'pintura', 'electromecánic', 'electromecanic', 'itv', 'motor', 'diagnosis', 'revisi'
  ].some((kw) => fullText.includes(kw));

  return isAutomotiveSector && isMaintenanceSpecialty;
}

/**
 * Determina si el apartado "Localización" debe mostrarse en la página de Configuración.
 * Requisito: solo se muestra si la empresa configurada es de servicios y obras en inmueble del cliente,
 * o servicio prestado en bien inmueble (reformas, fontanería, electricidad, obras, construcciones, instalaciones, etc.).
 */
export function isLocationFeatureEligible(user?: AppUser | null): boolean {
  if (!user) return false;
  const fullText = `${user.sector || ''} ${user.branch || ''} ${user.specialty || ''} ${user.fullName || ''}`.toLowerCase();

  const LOCATION_KEYWORDS = [
    'inmueble', 'propiedad', 'obra', 'obras', 'reforma', 'reformas',
    'construcc', 'fontaner', 'electric', 'climatiz', 'instalac',
    'jardiner', 'domicilio', 'arquitect', 'aparejad', 'cerrajer',
    'edifici', 'vivienda', 'hogar', 'mantenimiento de inmuebles', 'limpieza',
    'pintor', 'decorac', 'clima', 'aire acondicion'
  ];

  return LOCATION_KEYWORDS.some((kw) => fullText.includes(kw));
}


/**
 * Parsea una fecha de ITV en formato YYYY-MM-DD o DD/MM/YYYY a objeto Date
 */
export function parseItvDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  
  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const parts = clean.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
    const parts = clean.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha a YYYY-MM-DD
 */
export function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formatea una fecha a DD/MM/YYYY
 */
export function formatDateDmy(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = parseItvDate(dateStr);
  if (!d) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface VehicleItvAlert {
  client: Client;
  vehicle: ClientVehicle;
  plate: string;
  vehicleLabel: string;
  itvDate: string;
  daysRemaining: number;
  urgency: 'overdue' | 'imminent' | 'upcoming' | 'ok';
  urgencyLabel: string;
  urgencyColor: string;
  existingBudget?: GestarianDocument;
  isBudgetAccepted: boolean;
  proposedAppointmentDate?: string;
  proposedAppointmentTime?: string;
}

/**
 * Obtiene las alertas de ITV y mantenimientos preventivos para los vehículos registrados
 */
export function getVehicleItvAlerts(
  clients: Client[],
  documents: GestarianDocument[],
  daysHorizon: number = 60
): VehicleItvAlert[] {
  const alerts: VehicleItvAlert[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  clients.forEach((client) => {
    const vehicles = client.vehicles || [];
    vehicles.forEach((veh) => {
      const cleanPlate = sanitizePlate(veh.plate);
      if (!cleanPlate) return;

      const itvDateStr = veh.itvDate || (veh.ocrData?.itvExpiryDate ? veh.ocrData.itvExpiryDate.split('/').reverse().join('-') : undefined);
      if (!itvDateStr) return;

      const itvParsed = parseItvDate(itvDateStr);
      if (!itvParsed) return;
      itvParsed.setHours(0, 0, 0, 0);

      const diffTime = itvParsed.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Solo vehículos con ITV vencida o que venzan dentro del horizonte de días
      if (diffDays > daysHorizon) return;

      let urgency: 'overdue' | 'imminent' | 'upcoming' | 'ok' = 'ok';
      let urgencyLabel = 'En vigor';
      let urgencyColor = 'bg-slate-100 text-slate-700 border-slate-300';

      if (diffDays < 0) {
        urgency = 'overdue';
        urgencyLabel = `ITV Caducada (hace ${Math.abs(diffDays)}d)`;
        urgencyColor = 'bg-red-100 text-red-900 border-red-300 font-bold';
      } else if (diffDays <= 15) {
        urgency = 'imminent';
        urgencyLabel = `ITV Vence en ${diffDays} días`;
        urgencyColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      } else if (diffDays <= 45) {
        urgency = 'upcoming';
        urgencyLabel = `ITV Próxima (${diffDays} días)`;
        urgencyColor = 'bg-blue-50 text-blue-800 border-blue-200';
      }

      // Buscar si ya existe un presupuesto Pre-ITV para este vehículo
      const existingPreItvBudget = documents.find((doc) => {
        if (!doc.isPreItv) return false;
        const docPlate = sanitizePlate(doc.vehiclePlate);
        return docPlate === cleanPlate && doc.status !== 'rechazado';
      });

      const isBudgetAccepted = Boolean(
        existingPreItvBudget &&
        (existingPreItvBudget.status === 'aceptado' ||
          existingPreItvBudget.deliveryDateStatus === 'accepted' ||
          existingPreItvBudget.acceptedByClient)
      );

      const vehicleLabel = [veh.brand, veh.model].filter(Boolean).join(' ') || 'Vehículo';

      alerts.push({
        client,
        vehicle: veh,
        plate: cleanPlate,
        vehicleLabel,
        itvDate: itvDateStr,
        daysRemaining: diffDays,
        urgency,
        urgencyLabel,
        urgencyColor,
        existingBudget: existingPreItvBudget,
        isBudgetAccepted,
        proposedAppointmentDate: existingPreItvBudget?.proposedDeliveryDate || existingPreItvBudget?.vehicleDeliveryDate,
        proposedAppointmentTime: existingPreItvBudget?.proposedDeliveryTime || existingPreItvBudget?.vehicleDeliveryTime || '09:00',
      });
    });
  });

  // Ordenar por urgencia (las más próximas o vencidas primero)
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Genera de forma automatizada el presupuesto oficial Pre-ITV y la cita previa en taller
 */
export function generatePreItvBudgetAndAppointment(
  client: Client,
  vehicle: ClientVehicle,
  user: AppUser,
  existingDocs: GestarianDocument[],
  targetItvDateStr?: string
): { budget: GestarianDocument; appointment: Appointment } {
  const cleanPlate = sanitizePlate(vehicle.plate);
  const now = new Date();
  const todayStr = formatDateYmd(now);

  // Calcular fecha óptima de la cita: 7-10 días antes de la fecha de ITV
  let proposedDate: string;
  const itvParsed = parseItvDate(targetItvDateStr || vehicle.itvDate);

  if (itvParsed) {
    const appointmentTarget = new Date(itvParsed);
    appointmentTarget.setDate(appointmentTarget.getDate() - 8);

    // Si la fecha resultante es anterior a mañana, fijarla a pasado mañana a las 09:00
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);

    if (appointmentTarget <= now) {
      proposedDate = formatDateYmd(minDate);
    } else {
      proposedDate = formatDateYmd(appointmentTarget);
    }
  } else {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 5);
    proposedDate = formatDateYmd(defaultDate);
  }

  const proposedTime = '09:00';

  // Numeración oficial correlativa de Presupuesto y Expediente
  const budgetNumber = getNextDocumentNumber('presupuesto', existingDocs);
  const expedienteNumber = getExpedienteFromDocNumber(budgetNumber);

  // Líneas de revisión pre-ITV y diagnosis oficial
  const items = [
    {
      id: `itv_item_${Date.now()}_1`,
      description: 'Revisión y diagnosis pre-ITV integral en elevador (frenos, amortiguadores, dirección, alumbrado y neumáticos)',
      quantity: 1,
      unitPrice: 45.0,
      amount: 45.0,
    },
    {
      id: `itv_item_${Date.now()}_2`,
      description: 'Control y calibración de emisiones de gases contaminantes y opacidad CO2 en máquina homologada',
      quantity: 1,
      unitPrice: 25.0,
      amount: 25.0,
    },
    {
      id: `itv_item_${Date.now()}_3`,
      description: 'Inspección de seguridad activa, holguras de rótulas y puesta a punto de niveles (frenos, refrigerante y lavaparabrisas)',
      quantity: 1,
      unitPrice: 20.0,
      amount: 20.0,
    },
  ];

  const subtotal = 90.0;
  const ivaRate = user.defaultIvaRate || 21;
  const ivaAmount = Math.round(subtotal * (ivaRate / 100) * 100) / 100;
  const total = Math.round((subtotal + ivaAmount) * 100) / 100;

  const budget: GestarianDocument = {
    id: `pre_itv_${Date.now()}_${cleanPlate}`,
    type: 'presupuesto',
    number: budgetNumber,
    series: 'A',
    date: todayStr,
    dueDate: proposedDate,
    expediente: expedienteNumber,

    issuerId: user.id,
    issuerName: user.fullName || 'DM CAR',
    issuerCif: user.cif || 'B-89324511',
    issuerAddress: user.fiscalAddress || 'Polígono Industrial Las Eras, Nave 14, 28052 Madrid',
    issuerPhone: user.phone || '+34 912 345 678',
    issuerEmail: user.email || 'contacto@dmcar.es',
    issuerLogoUrl: user.logoUrl,

    clientId: client.id,
    clientName: client.name,
    clientCif: client.cif || '',
    clientAddress: client.address || client.fiscalAddress || '',
    clientPhone: client.phone || '',
    clientEmail: client.email || '',

    showVehicleData: true,
    vehiclePlate: cleanPlate,
    vehicleBrand: vehicle.brand || '',
    vehicleModel: vehicle.model || '',
    vehicleType: vehicle.type || 'Turismo',
    vehicleDeliveryDate: proposedDate,
    vehicleDeliveryTime: proposedTime,
    proposedDeliveryDate: proposedDate,
    proposedDeliveryTime: proposedTime,
    deliveryDateProposedBy: 'workshop',
    deliveryDateStatus: 'pending_acceptance',

    items,
    subtotal,
    applyIva: true,
    ivaRate,
    ivaAmount,
    applyIrpf: false,
    irpfRate: 0,
    irpfAmount: 0,
    total,

    status: 'enviado',
    isLocked: false,
    sentAt: now.toISOString(),
    isPreItv: true,
    isPreventiveMaintenance: true,
    notes: `Campaña oficial de revisión pre-ITV y puesta a punto programada para el vehículo con matrícula ${cleanPlate}. Vencimiento previsto de ITV: ${formatDateDmy(targetItvDateStr || vehicle.itvDate)}.`,
  };

  const appointment: Appointment = {
    id: `app_itv_${Date.now()}`,
    clientId: client.id,
    clientName: client.name,
    budgetId: budget.id,
    date: proposedDate,
    time: proposedTime,
    title: `Revisión Pre-ITV y Puesta a Punto (${cleanPlate})`,
    status: 'pendiente',
    notes: `Cita previa propuesta para inspección técnica pre-ITV y ajuste preventivo del vehículo ${vehicle.brand || ''} ${vehicle.model || ''} (${cleanPlate}).`,
  };

  return { budget, appointment };
}
