import { GestarianDocument, Client } from '../types';

export type CardStatusType = 'verde' | 'azul' | 'naranja' | 'rojo';

export interface StatusInfo {
  type: CardStatusType;
  color: string;           // Tailwind border color, e.g. 'border-emerald-500'
  borderClass: string;     // Full border class, e.g. 'border-[3px] border-emerald-500'
  textColor: string;       // e.g. 'text-emerald-600'
  bgColor: string;         // e.g. 'bg-emerald-50'
  badgeBorder: string;     // e.g. 'border-emerald-200'
  label: string;           // Descriptive label
  pendingAmount: number;
  paidAmount: number;
  totalAmount: number;
  invoiceCount: number;
  hasUnpaidInvoice: boolean;
}

export const parseDocDate = (str?: string): Date => {
  if (!str) return new Date();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(str);
};

/**
 * Determina el estado de un cliente en función de sus expedientes, presupuestos y facturas.
 * Reglas:
 * 1. ROJO: Si hay alguna factura impagada (vencida > 7 días sin abono, o > 30 días con pago parcial, o status 'IMPAGADA').
 * 2. AZUL: Si hay expediente activo en reparación/proceso, o abono parcial en proceso con saldo pendiente.
 * 3. NARANJA: Si hay presupuesto o factura pendiente inicial de abono.
 * 4. VERDE: Si no hay nada pendiente (saldo pendiente cero, expediente cerrado al 100% o cliente al día).
 */
export function getClientStatus(client: Client, documents: GestarianDocument[]): StatusInfo {
  // Filtrar documentos pertenecientes a este cliente
  const clientDocs = documents.filter((d) => {
    if (d.clientId && d.clientId === client.id) return true;
    if (d.clientCif && client.cif && d.clientCif.trim().toUpperCase() === client.cif.trim().toUpperCase()) return true;
    if (d.clientName && client.name && d.clientName.trim().toLowerCase() === client.name.trim().toLowerCase()) return true;
    if (d.vehiclePlate && client.plates && client.plates.includes(d.vehiclePlate)) return true;
    return false;
  });

  const invoices = clientDocs.filter((d) => d.type === 'factura');
  const budgets = clientDocs.filter((d) => d.type === 'presupuesto');

  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let hasUnpaidInvoice = false;
  let hasPartialPayment = false;
  let hasPendingInvoice = false;

  const now = new Date();

  for (const inv of invoices) {
    const invTotal = inv.total || 0;
    const invPayments = inv.payments || [];
    const invPaid = invPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const invPending = Math.max(0, invTotal - invPaid);

    totalAmount += invTotal;
    paidAmount += invPaid;
    pendingAmount += invPending;

    if (invPending > 0.01) {
      const issueDate = parseDocDate(inv.date);
      const daysSinceIssue = (now.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

      if (invPaid === 0) {
        if (daysSinceIssue > 7 || (inv.status as string) === 'IMPAGADA' || (inv.status as string) === 'impagada') {
          hasUnpaidInvoice = true;
        } else {
          hasPendingInvoice = true;
        }
      } else {
        // Abono parcial
        const lastPaymentDate = invPayments.length > 0
          ? new Date(Math.max(...invPayments.map((p) => parseDocDate(p.date).getTime())))
          : issueDate;
        const daysSinceLastPayment = (now.getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24);

        if (daysSinceLastPayment > 30 || (inv.status as string) === 'IMPAGADA' || (inv.status as string) === 'impagada') {
          hasUnpaidInvoice = true;
        } else {
          hasPartialPayment = true;
        }
      }
    }
  }

  // Comprobar presupuestos u órdenes activas
  const hasActiveExpediente = clientDocs.some((d) => {
    if (d.workOrderStatus === 'en_ejecucion' || d.workOrderStatus === 'pendiente') return true;
    if (d.type === 'presupuesto' && d.status === 'aceptado') return true;
    return false;
  });

  const hasPendingBudget = budgets.some((b) => b.status === 'borrador' || b.status === 'enviado' || b.needsBossPricing);

  // Jerarquía de estados estricta según especificación del taller
  if (hasUnpaidInvoice) {
    return {
      type: 'rojo',
      color: 'border-rose-500',
      borderClass: 'border-[3px] border-rose-500',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      label: 'FACTURA IMPAGADA',
      pendingAmount,
      paidAmount,
      totalAmount,
      invoiceCount: invoices.length,
      hasUnpaidInvoice: true,
    };
  }

  if (hasPartialPayment || hasActiveExpediente) {
    return {
      type: 'azul',
      color: 'border-blue-500',
      borderClass: 'border-[3px] border-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      label: hasPartialPayment ? 'ABONO PARCIAL' : 'EXPEDIENTE ACTIVO',
      pendingAmount,
      paidAmount,
      totalAmount,
      invoiceCount: invoices.length,
      hasUnpaidInvoice: false,
    };
  }

  if (hasPendingInvoice || hasPendingBudget) {
    return {
      type: 'naranja',
      color: 'border-orange-500',
      borderClass: 'border-[3px] border-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badgeBorder: 'border-orange-200',
      label: 'PENDIENTE',
      pendingAmount,
      paidAmount,
      totalAmount,
      invoiceCount: invoices.length,
      hasUnpaidInvoice: false,
    };
  }

  // Si no hay nada pendiente o todo está pagado (pendiente 0 €) -> VERDE
  return {
    type: 'verde',
    color: 'border-emerald-500',
    borderClass: 'border-[3px] border-emerald-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    label: 'CERRADO (0 €)',
    pendingAmount: 0,
    paidAmount,
    totalAmount,
    invoiceCount: invoices.length,
    hasUnpaidInvoice: false,
  };
}

/**
 * Determina el estado de un expediente según los documentos asociados a él.
 */
export function getExpedienteStatus(expedienteNum: string, documents: GestarianDocument[]): StatusInfo {
  const expDocs = documents.filter((d) => d.expediente === expedienteNum);
  const invoices = expDocs.filter((d) => d.type === 'factura');
  const budgets = expDocs.filter((d) => d.type === 'presupuesto');

  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let hasUnpaidInvoice = false;
  let hasPartialPayment = false;
  let hasPendingInvoice = false;

  const now = new Date();

  for (const inv of invoices) {
    const invTotal = inv.total || 0;
    const invPayments = inv.payments || [];
    const invPaid = invPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const invPending = Math.max(0, invTotal - invPaid);

    totalAmount += invTotal;
    paidAmount += invPaid;
    pendingAmount += invPending;

    if (invPending > 0.01) {
      const issueDate = parseDocDate(inv.date);
      const daysSinceIssue = (now.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

      if (invPaid === 0) {
        if (daysSinceIssue > 7 || (inv.status as string) === 'IMPAGADA' || (inv.status as string) === 'impagada') {
          hasUnpaidInvoice = true;
        } else {
          hasPendingInvoice = true;
        }
      } else {
        const lastPaymentDate = invPayments.length > 0
          ? new Date(Math.max(...invPayments.map((p) => parseDocDate(p.date).getTime())))
          : issueDate;
        const daysSinceLastPayment = (now.getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24);

        if (daysSinceLastPayment > 30 || (inv.status as string) === 'IMPAGADA' || (inv.status as string) === 'impagada') {
          hasUnpaidInvoice = true;
        } else {
          hasPartialPayment = true;
        }
      }
    }
  }

  const hasActiveWork = expDocs.some((d) => d.workOrderStatus === 'en_ejecucion' || d.workOrderStatus === 'pendiente');
  const hasPendingBudget = budgets.some((b) => b.status === 'borrador' || b.status === 'enviado' || b.needsBossPricing);

  // Un expediente solo puede considerarse cerrado si la factura ha sido efectivamente enviada al cliente
  const isInvoiceSent = expDocs.some(
    (d) =>
      Boolean(d.facturaSentAt) ||
      (d.type === 'factura' && (d.status === 'enviada' || d.status === 'enviado' || d.facturacionStatus === 'factura_enviada' || Boolean(d.sentAt))) ||
      d.facturacionStatus === 'factura_enviada'
  );

  if (hasUnpaidInvoice) {
    return {
      type: 'rojo',
      color: 'border-rose-500',
      borderClass: 'border-[3px] border-rose-500',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      label: 'IMPAGADA',
      pendingAmount,
      paidAmount,
      totalAmount,
      invoiceCount: invoices.length,
      hasUnpaidInvoice: true,
    };
  }

  if (hasPartialPayment || hasActiveWork) {
    return {
      type: 'azul',
      color: 'border-blue-500',
      borderClass: 'border-[3px] border-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      label: hasPartialPayment ? 'ABONO PARCIAL' : 'EN PROCESO',
      pendingAmount,
      paidAmount,
      totalAmount,
      invoiceCount: invoices.length,
      hasUnpaidInvoice: false,
    };
  }

  if (hasPendingInvoice || hasPendingBudget || !isInvoiceSent) {
    return {
      type: 'naranja',
      color: 'border-orange-500',
      borderClass: 'border-[3px] border-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badgeBorder: 'border-orange-200',
      label: !isInvoiceSent && invoices.length > 0 ? 'PENDIENTE ENVÍO FACTURA' : 'PENDIENTE',
      pendingAmount,
      paidAmount,
      totalAmount,
      invoiceCount: invoices.length,
      hasUnpaidInvoice: false,
    };
  }

  return {
    type: 'verde',
    color: 'border-emerald-500',
    borderClass: 'border-[3px] border-emerald-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    label: 'CERRADO',
    pendingAmount: 0,
    paidAmount,
    totalAmount,
    invoiceCount: invoices.length,
    hasUnpaidInvoice: false,
  };
}
