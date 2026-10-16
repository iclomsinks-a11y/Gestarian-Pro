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
      borderClass: 'border border-rose-500',
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
      borderClass: 'border border-blue-500',
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
      borderClass: 'border border-orange-500',
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
    borderClass: 'border border-emerald-500',
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
      borderClass: 'border border-rose-500',
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
      borderClass: 'border border-blue-500',
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
      borderClass: 'border border-orange-500',
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
    borderClass: 'border border-emerald-500',
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

export interface ClientDocColorsInfo {
  latestBudgetNum?: string;
  latestExpedienteNum?: string;
  latestInvoiceNum?: string;
  budgetColor: string;
  expedienteColor: string;
  invoiceColor: string;
  cardBorderColor: string;
  cardBgColor: string;
}

/**
 * Calcula los colores específicos de los números ID (Presupuesto, Expediente, Factura)
 * y el color del borde de la tarjeta según el estado de cada documento y la última acción.
 */
export function getClientDocColors(clientDocs: GestarianDocument[]): ClientDocColorsInfo {
  const budgets = clientDocs.filter((d) => d.type === 'presupuesto' || (d.type as string) === 'budget');
  const invoices = clientDocs.filter((d) => d.type === 'factura');
  const expedientes = Array.from(new Set(clientDocs.filter((d) => Boolean(d.expediente)).map((d) => d.expediente!)));

  const latestBudget = budgets[budgets.length - 1];
  const latestInvoice = invoices[invoices.length - 1];
  const latestExpedienteNum = expedientes[expedientes.length - 1];

  // 1. Color Presupuesto:
  // - Naranja: si no está enviado al cliente (borrador / !sentAt / needsBossPricing)
  // - Azul: si no está aceptado aún (enviado / pendiente de confirmación)
  // - Rojo: si ha sido rechazado
  // - Verde: si ha sido aceptado o pagado
  let budgetColor = 'text-[#0F2942]';
  if (latestBudget) {
    const st = (latestBudget.status || '').toLowerCase();
    const isSent = Boolean(latestBudget.sentAt || st === 'enviado' || st === 'enviada');
    if (st === 'rechazado' || st === 'rechazada') {
      budgetColor = 'text-rose-600';
    } else if (st === 'aceptado' || st === 'pagado' || st === 'pagada') {
      budgetColor = 'text-emerald-600';
    } else if (!isSent || st === 'borrador' || latestBudget.needsBossPricing) {
      budgetColor = 'text-amber-500'; // Naranja si no está enviado
    } else {
      budgetColor = 'text-blue-600'; // Azul si enviado pero no aceptado aún
    }
  }

  // 2. Color Factura:
  // - Rojo: si está impagada
  // - Azul: si está en abono parcial
  // - Verde: si está abonada (totalmente pagada)
  let invoiceColor = 'text-[#0F2942]';
  if (latestInvoice) {
    const total = latestInvoice.total || 0;
    const paid = (latestInvoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const pending = Math.max(0, total - paid);
    const st = (latestInvoice.status || '').toLowerCase();

    if (pending <= 0.01 || st === 'pagada' || st === 'pagado') {
      invoiceColor = 'text-emerald-600'; // Abonada -> verde
    } else if (paid > 0.01) {
      invoiceColor = 'text-blue-600'; // Parcial abono -> azul
    } else {
      invoiceColor = 'text-rose-600'; // Impagada -> rojo
    }
  }

  // 3. Color Expediente & Color de Borde de la Tarjeta (1px):
  // - Verde: si el expediente está cerrado porque la factura ha sido totalmente abonada
  // - Azul: si trabajo en ejecución o abono parcial
  // - Rojo: si hay factura impagada
  // - Naranja: si presupuesto pendiente no enviado o borrador
  let expedienteColor = 'text-[#0F2942]';
  let cardBorderColor = 'border border-emerald-500';

  if (latestExpedienteNum) {
    const expDocs = clientDocs.filter((d) => d.expediente === latestExpedienteNum);
    const expInvoices = expDocs.filter((d) => d.type === 'factura');
    const expBudgets = expDocs.filter((d) => d.type === 'presupuesto' || (d.type as string) === 'budget');

    let hasUnpaid = false;
    let hasPartial = false;
    let allInvoicesPaid = expInvoices.length > 0;

    for (const inv of expInvoices) {
      const invTotal = inv.total || 0;
      const invPaid = (inv.payments || []).reduce((a, b) => a + b.amount, 0);
      const invPend = Math.max(0, invTotal - invPaid);
      if (invPend > 0.01) {
        allInvoicesPaid = false;
        if (invPaid > 0.01) hasPartial = true;
        else hasUnpaid = true;
      }
    }

    const hasActiveWork = expDocs.some((d) => d.workOrderStatus === 'en_ejecucion' || d.workOrderStatus === 'pendiente');
    const hasUnsentBudget = expBudgets.some((b) => b.status === 'borrador' || !b.sentAt);

    if (expInvoices.length > 0 && allInvoicesPaid) {
      expedienteColor = 'text-emerald-600';
      cardBorderColor = 'border border-emerald-500';
    } else if (hasUnpaid) {
      expedienteColor = 'text-rose-600';
      cardBorderColor = 'border border-rose-500';
    } else if (hasPartial || hasActiveWork) {
      expedienteColor = 'text-blue-600';
      cardBorderColor = 'border border-blue-500';
    } else if (hasUnsentBudget || expInvoices.length === 0) {
      expedienteColor = 'text-amber-500';
      cardBorderColor = 'border border-amber-500';
    } else {
      expedienteColor = 'text-blue-600';
      cardBorderColor = 'border border-blue-500';
    }
  } else {
    // Si no hay expediente asignado explícito, calcular el color del borde basado en la factura o presupuesto activo
    if (latestInvoice) {
      if (invoiceColor === 'text-rose-600') cardBorderColor = 'border border-rose-500';
      else if (invoiceColor === 'text-blue-600') cardBorderColor = 'border border-blue-500';
      else if (invoiceColor === 'text-emerald-600') cardBorderColor = 'border border-emerald-500';
    } else if (latestBudget) {
      if (budgetColor === 'text-rose-600') cardBorderColor = 'border border-rose-500';
      else if (budgetColor === 'text-amber-500') cardBorderColor = 'border border-amber-500';
      else if (budgetColor === 'text-blue-600') cardBorderColor = 'border border-blue-500';
      else if (budgetColor === 'text-emerald-600') cardBorderColor = 'border border-emerald-500';
    }
  }

  let cardBgColor = 'bg-emerald-500/5';
  if (cardBorderColor.includes('rose-500')) {
    cardBgColor = 'bg-rose-500/5';
  } else if (cardBorderColor.includes('blue-500')) {
    cardBgColor = 'bg-blue-500/5';
  } else if (cardBorderColor.includes('amber-500')) {
    cardBgColor = 'bg-amber-500/5';
  } else {
    cardBgColor = 'bg-emerald-500/5';
  }

  return {
    latestBudgetNum: latestBudget?.number,
    latestExpedienteNum,
    latestInvoiceNum: latestInvoice?.number,
    budgetColor,
    expedienteColor,
    invoiceColor,
    cardBorderColor,
    cardBgColor,
  };
}

export interface SingleDocColorsInfo {
  budgetNum?: string;
  budgetColor: string;
  expNum?: string;
  expedienteColor: string;
  invoiceNum?: string;
  invoiceColor: string;
}

/**
 * Calcula los colores y números vinculados (Presupuesto, Expediente, Factura)
 * para una tarjeta de documento individual (ej. tarjeta de presupuesto)
 */
export function getDocStatusColors(doc: GestarianDocument, allDocs: GestarianDocument[]): SingleDocColorsInfo {
  const isBudget = doc.type === 'presupuesto' || (doc.type as string) === 'budget';
  const isInvoice = doc.type === 'factura';

  const budgetNum = isBudget ? doc.number : (doc.relatedBudgetId ? allDocs.find((d) => d.id === doc.relatedBudgetId)?.number : undefined);
  const invoiceNum = isInvoice ? doc.number : (doc.convertedToInvoiceId ? allDocs.find((d) => d.id === doc.convertedToInvoiceId)?.number : allDocs.find((d) => d.type === 'factura' && (d.relatedBudgetId === doc.id || (d.expediente && d.expediente === doc.expediente)))?.number);
  const expNum = doc.expediente || (doc.number && doc.number.startsWith('P') ? `E${doc.number.replace(/\D/g, '')}` : undefined);

  // 1. Color Presupuesto:
  let budgetColor = 'text-amber-500';
  if (budgetNum) {
    const budgetDoc = isBudget ? doc : allDocs.find((d) => d.number === budgetNum);
    const st = (budgetDoc?.status || '').toLowerCase();
    const isSent = Boolean(budgetDoc?.sentAt || st === 'enviado' || st === 'enviada');

    const isClientProposedPending = budgetDoc?.deliveryDateProposedBy === 'client' && budgetDoc?.deliveryDateStatus === 'pending_acceptance';

    if (st === 'rechazado' || st === 'rechazada') {
      budgetColor = 'text-rose-600';
    } else if (isClientProposedPending) {
      budgetColor = 'text-orange-500';
    } else if (budgetDoc?.acceptedByClient || st === 'aceptado' || st === 'pagado' || st === 'pagada') {
      budgetColor = 'text-emerald-600';
    } else if (!isSent || st === 'borrador') {
      budgetColor = 'text-amber-500';
    } else {
      budgetColor = 'text-blue-600';
    }
  }

  // 2. Color Factura:
  let invoiceColor = 'text-rose-600';
  if (invoiceNum) {
    const invDoc = isInvoice ? doc : allDocs.find((d) => d.number === invoiceNum);
    if (invDoc) {
      const total = invDoc.total || 0;
      const paid = (invDoc.payments || []).reduce((a, b) => a + b.amount, 0);
      const pending = Math.max(0, total - paid);
      const st = (invDoc.status || '').toLowerCase();

      if (pending <= 0.01 || st === 'pagada' || st === 'pagado') {
        invoiceColor = 'text-emerald-600';
      } else if (paid > 0.01) {
        invoiceColor = 'text-blue-600';
      } else {
        invoiceColor = 'text-rose-600';
      }
    }
  }

  // 3. Color Expediente:
  let expedienteColor = 'text-blue-600';
  if (expNum) {
    const expDocs = allDocs.filter((d) => d.expediente === expNum || (d.number && d.number.includes(expNum.replace(/\D/g, ''))));
    const expInvoices = expDocs.filter((d) => d.type === 'factura');
    let allPaid = expInvoices.length > 0;

    for (const inv of expInvoices) {
      const invTotal = inv.total || 0;
      const invPaid = (inv.payments || []).reduce((a, b) => a + b.amount, 0);
      if (invTotal - invPaid > 0.01) {
        allPaid = false;
      }
    }

    if (expInvoices.length > 0 && allPaid) {
      expedienteColor = 'text-emerald-600';
    } else if (doc.status === 'rechazado' || doc.status === 'rechazada') {
      expedienteColor = 'text-rose-600';
    } else if (budgetColor === 'text-amber-500') {
      expedienteColor = 'text-amber-500';
    } else {
      expedienteColor = 'text-blue-600';
    }
  }

  return {
    budgetNum,
    budgetColor,
    expNum,
    expedienteColor,
    invoiceNum,
    invoiceColor,
  };
}
