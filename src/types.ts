export type DocumentType = 'presupuesto' | 'factura' | 'orden_trabajo' | 'factura_recibida' | 'factura_proforma' | 'recibo_abono';

export type BudgetStatus = 'borrador' | 'enviado' | 'aceptado' | 'rechazado';
export type InvoiceStatus = 'borrador' | 'confirmada' | 'enviada';
export type WorkOrderStatus = 'pendiente' | 'en_ejecucion' | 'finalizada';

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}


export interface DocumentPayment {
  id: string;
  amount: number;
  date: string;
  method?: string;
}

export interface CitaProposal {
  id: string;
  date: string;
  proposedBy: 'client' | 'workshop';
  proposedByName: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
  acceptedBy?: 'client' | 'workshop';
  acceptedByName?: string;
  acceptedAt?: string;
}

export interface GestarianDocument {
  id: string;
  type: DocumentType;
  number: string; // e.g. P260001 or F260001
  series?: string; // e.g. "A", "B"
  date: string;
  dueDate?: string;
  issuerId: string;
  issuerName: string;
  issuerCif: string;
  issuerAddress: string;
  issuerPhone: string;
  issuerEmail: string;
  issuerLogoUrl?: string;
  
  clientId: string;
  clientName: string;
  clientCif: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;

  items: DocumentItem[];
  subtotal: number;
  applyIva: boolean;
  ivaRate: number; // usually 21
  ivaAmount: number;
  applyIrpf: boolean;
  irpfRate: number; // e.g. 15 or 7
  irpfAmount: number;
  total: number;

  status: BudgetStatus | InvoiceStatus | WorkOrderStatus;
  isLocked: boolean; // True once sent to client - cannot be modified
  sentAt?: string;
  facturaSentAt?: string;
  confirmedAt?: string;
  convertedToInvoiceId?: string;
  relatedBudgetId?: string;
  expediente?: string; // Número de expediente
  vehiclePlate?: string; // Matrícula reconocida o introducida
  vehicleType?: string; // Tipo de vehículo reconocido (Sedan, SUV, Camión, etc.)
  vehicleBrand?: string; // Marca del vehículo (ej: SEAT, Renault, Mercedes)
  vehicleModel?: string; // Modelo del vehículo (ej: León, Megane, Clase A)
  vehicleDeliveryDate?: string; // Fecha propuesta de entrega del vehículo
  proposedDeliveryDate?: string; // Nueva fecha de entrega propuesta durante la negociación
  deliveryDateProposedBy?: 'client' | 'workshop'; // Quién propone la fecha ('client' o 'workshop')
  deliveryDateStatus?: 'pending_acceptance' | 'accepted' | 'rejected'; // Estado de aceptación de la fecha propuesta
  citaAcceptedBy?: 'client' | 'workshop';
  citaAcceptedByName?: string;
  citaAcceptedAt?: string;
  citaHistory?: CitaProposal[];
  vehicleImages?: string[]; // Imágenes adjuntas del vehículo / daños para el presupuesto y expediente
  notes?: string;
  payments?: DocumentPayment[];
  assignedEmployeeId?: string; // Para ordenes de trabajo
  workOrderStatus?: WorkOrderStatus;
  createdByEmployeeId?: string; // Si fue creado por un empleado
  createdByName?: string;
  needsBossPricing?: boolean; // Verdadero si el empleado no tiene permiso de precios y el jefe debe completarlo
  invoiceConfirmed?: boolean; // Verdadero si la factura ha sido confirmada por el usuario
  citaStatus?: 'pendiente' | 'cita_aceptada' | 'cita_confirmada';
  tallerStatus?: 'pendiente' | 'enviar_a_taller' | 'en_reparacion' | 'reparacion_finalizada';
  facturacionStatus?: 'bloqueado' | 'finalizar_reparacion' | 'facturar' | 'facturado' | 'factura_enviada';
}

export interface PlateRecognizerResult {
  plate: string;
  confidence: number;
  region?: { code: string; score: number };
  vehicle?: { type: string; score: number };
  box?: { ymin: number; xmin: number; ymax: number; xmax: number };
}

export interface SystemConfig {
  githubRepoUrl: string;
  hasPlateRecognizerKey: boolean;
  hasResendKey: boolean;
}

export interface EmployeePermissions {
  // Acceso a conceptos / módulos de la aplicación
  accessExpedientes?: boolean; // Roadmap y seguimiento de reparaciones
  accessSolicitudes?: boolean; // Solicitudes de clientes
  accessClientes?: boolean;    // Ficha de clientes y vehículos del taller
  accessPresupuestos?: boolean;// Elaboración de presupuestos
  accessCitas?: boolean;       // Agenda y citas de taller
  accessTaller?: boolean;      // Taller y órdenes de trabajo (OTs)
  accessFacturacion?: boolean; // Facturación y cobros
  accessBalances?: boolean;    // Balances económicos y rendimiento
  accessProveedores?: boolean; // Proveedores y recambios
  accessIncidencias?: boolean; // Gestión de incidencias

  // Permisos operativos específicos
  manageWorkOrders: boolean; // default: true (Iniciar y Finalizar OTs)
  createBudgets: boolean;    // default: true (cumplimentar líneas de presupuesto)
  canSetPrices: boolean;     // default: false (solo el jefe puede asignar precios por defecto en DM CAR)
  scanPlates: boolean;       // default: true (usar cámara OCR para generar presupuesto)
  viewAgenda: boolean;       // default: false
  viewReports: boolean;      // default: false
}

export interface Employee {
  id: string;
  name: string;
  dni?: string;
  phone?: string;
  email?: string;
  role: 'autorizado';
  profession?: string; // Puesto / Profesión (ej: Chapista, Pintor, Mecánico)
  cnoCode?: string; // Código CNO-11 oficial (ej: 7313 Chapistas, 7232 Pintores)
  cnoDescription?: string; // Título oficial del epígrafe según Ministerio de Trabajo
  cotizacionGroup?: string; // Grupo de cotización Seguridad Social (ej: Grupo 8 Oficiales de 1ª y 2ª)
  accidentsEpigrafe?: string; // Tarifa de primas de accidentes (ej: 45.20 Reparación de vehículos)
  permissions: EmployeePermissions;
}

export interface InternalNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'order_status_change' | 'general' | 'metis_budget_review' | 'metis_invoice_paid';
  orderId?: string;
  orderNumber?: string;
  employeeName?: string;
  newStatus?: WorkOrderStatus;
  budgetId?: string;
  invoiceId?: string;
  totalAmount?: number;
}

export type HighContrastThemeId =
  | 'blanco-puro'
  | 'hueso-nordico'
  | 'plata-industrial'
  | 'grafito-neutro'
  | 'titanio-ahumado'
  | 'antracita-taller'
  | 'noche-neon'
  | 'negro-obsidiana';

export interface AppUser {
  id: string;
  fullName: string;
  fiscalAddress: string;
  cif: string;
  phone: string;
  email: string;
  verified: boolean;
  createdAt: string;
  currentTier: 'lite' | 'pro' | 'enterprise';
  agencyEmail?: string;
  
  businessType?: 'autonomo' | 'empresa';
  sector?: string;
  branch?: string;
  specialty?: string;
  
  employees?: Employee[];
  
  // Personalización y Temas
  themeId?: HighContrastThemeId;
  logoUrl?: string;
  bgPortraitUrl?: string;
  bgLandscapeUrl?: string;
  bgBentoMenuUrl?: string;
  metisTechnicalAdviceEnabled?: boolean;
}

export interface MetisMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isAudio?: boolean;
}

export interface VehicleOcrData {
  circulationPermitImages?: string[];
  technicalSheetImages?: string[];
  extractedAt?: string;
  plate?: string;
  brand?: string;
  model?: string;
  vin?: string;
  color?: string;
  registrationDate?: string;
  engineDisplacement?: string; // cm3 (Campo P.1)
  power?: string; // kW / CV (Campo P.2)
  fuelType?: string; // (Campo P.3)
  euroNorm?: string; // (Campo V.7)
  tareWeight?: string; // Tara / Masa en orden de marcha (Campo G)
  maxAuthorizedMass?: string; // MMA (Campo F.1)
  seats?: string | number; // Plazas (Campo S.1)
  vehicleCategory?: string; // Categoría (Campo J)
  version?: string; // Variante / Versión (Campo D.2)
  itvExpiryDate?: string; // Vencimiento ITV
  rawNotes?: string;
}

export interface ClientVehicle {
  plate: string;
  brand?: string;
  model?: string;
  type?: string;
  color?: string;
  vin?: string;
  images?: string[];
  ocrData?: VehicleOcrData;
}

export interface Client {
  id: string;
  clientNumber?: number; // Número identificador correlativo/numérico de cliente en Supabase y Gestarian (ej: 1, 2, 3...)
  name: string;
  cif: string;
  address: string;
  phone: string;
  email: string;
  clientType?: 'particular' | 'empresa'; // 'empresa' o 'particular'
  isAutonomo?: boolean; // Verdadero si es un autónomo profesional
  hasAppInstalled?: boolean; // Verdadero si el cliente tiene la app móvil instalada
  appInstalledAt?: string;
  plates?: string[]; // Matrículas asociadas a los vehículos del cliente
  vehicles?: ClientVehicle[]; // Listado estructurado de vehículos del cliente
  notes?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  budgetId?: string;
  date: string;
  time: string;
  title: string;
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notes?: string;
}

export interface QuarterlyReport {
  year: number;
  quarter: '1T' | '2T' | '3T' | '4T';
  periodLabel: string;
  totalInvoices: number;
  totalSubtotal: number;
  totalIva: number;
  totalIrpf: number;
  totalGross: number;
  invoices: GestarianDocument[];
}

export interface SolicitudItem {
  id: string;
  number: string;
  expediente: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  type: string;
  date: string;
  description: string;
  images?: string[];
  status?: 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PRESUPUESTADA' | 'DESCARTADA' | string;
  reviewNotes?: string;
  reviewedAt?: string;
}
