import React, { useState, useRef } from 'react';
import { PageHeader } from './PageHeader';
import { GestarianDocument, AppUser, DocumentPayment, GestarianPlan } from '../types';
import { Camera, FileText, UploadCloud, AlertCircle, RefreshCw, FolderOpen, FolderKanban, Euro, User, UserPen, Check, Plus, Mail, Eye, X, Image, Building2, Calendar, Phone, MapPin, Send, MessageSquare, CheckCircle2, Home } from 'lucide-react';
import { SheetFIcon } from './BudgetIcons';

interface FacturacionViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  user: AppUser;
  documents: GestarianDocument[];
  onViewDoc: (doc: GestarianDocument) => void;
  onNavigateToDocument: (id: string) => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  onAddReceivedInvoice: (doc: GestarianDocument) => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
  onNavigateToClient?: (clientId: string) => void;
  onAddPayment?: (docId: string, payment: DocumentPayment) => void;
  initialTab?: 'recibidas' | 'emitidas';
  initialClientFilterId?: string | null;
  onOpenDetectedInvoices?: () => void;
  detectedInvoicesCount?: number;
  onNewInvoice?: () => void;
}

const parseDateStr = (str: string) => {
  if (!str) return new Date();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(str);
};

const getInvoiceStatusInfo = (doc: GestarianDocument) => {
  const total = doc.total || 0;
  const payments = doc.payments || [];
  const paid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const pending = total - paid;
  
  if (pending <= 0 && total > 0) {
    return { status: 'ABONADA', color: 'border-emerald-500', text: 'text-emerald-500', bgColor: 'bg-emerald-500/5' };
  }
  
  const issueDate = parseDateStr(doc.date);
  const now = new Date();
  const daysSinceIssue = (now.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
  
  if (paid === 0) {
    if (daysSinceIssue > 7) {
      return { status: 'IMPAGADA', color: 'border-rose-500', text: 'text-rose-500', bgColor: 'bg-rose-500/5' };
    } else {
      return { status: 'PENDIENTE', color: 'border-orange-500', text: 'text-orange-500', bgColor: 'bg-orange-500/5' };
    }
  } else {
    // Parcial
    const lastPaymentDate = new Date(Math.max(...payments.map(p => parseDateStr(p.date).getTime())));
    const daysSinceLastPayment = (now.getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysSinceLastPayment > 30) {
      return { status: 'IMPAGADA', color: 'border-rose-500', text: 'text-rose-500', bgColor: 'bg-rose-500/5' };
    } else {
      return { status: 'PARCIAL', color: 'border-[#38BDF8]', text: 'text-[#38BDF8]', bgColor: 'bg-sky-500/5' };
    }
  }
};

export { getInvoiceStatusInfo };

export const FacturaCard: React.FC<{
  doc: GestarianDocument;
  onViewDoc: (doc: GestarianDocument) => void;
  onNavigateToExpediente?: (id: string) => void;
  onNavigateToClient?: (id: string) => void;
  onAddPayment?: (docId: string, payment: DocumentPayment) => void;
  userTier?: GestarianPlan;
}> = ({ doc, onViewDoc, onNavigateToExpediente, onNavigateToClient, onAddPayment, userTier }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showPaymentControl, setShowPaymentControl] = useState(false);

  const canUseCobros = userTier === 'pro' || userTier === 'enterprise';

  const { status, color, text, bgColor } = getInvoiceStatusInfo(doc);
  
  const payments = doc.payments || [];
  const total = doc.total || 0;
  const paid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const pending = total - paid;

  const handleSendReceipt = (addedAmount?: number) => {
    const currentPaid = paid + (addedAmount || 0);
    const currentPending = Math.max(0, total - currentPaid);
    const isFullyPaid = currentPending <= 0.001;
    const dateStr = new Date().toLocaleDateString('es-ES');

    const cleanPhone = (doc.clientPhone || '').replace(/\D/g, '');
    const email = doc.clientEmail || '';

    let message = '';
    let subject = '';

    if (isFullyPaid) {
      subject = `FACTURA ABONADA Nº ${doc.number} - ${doc.issuerName || 'Taller'}`;
      message = `*FACTURA ABONADA* - ${doc.issuerName || 'TALLER'}\n\n` +
        `Estimado/a ${doc.clientName || 'Cliente'},\n` +
        `Le confirmamos el abono total de su Factura Nº ${doc.number}.\n\n` +
        `• Importe Total: ${total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n` +
        `• Total Abonado: ${currentPaid.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n` +
        `• Saldo Pendiente: 0,00 €\n` +
        `• Matrícula: ${doc.vehiclePlate || 'N/A'}\n` +
        `• Observaciones: FACTURA ABONADA\n\n` +
        `Adjuntamos la factura original liquidada al 100% con la inscripción "FACTURA ABONADA" en color verde.\n` +
        `Gracias por su confianza.`;
    } else {
      subject = `Recibo y Extracto de Abono Factura Nº ${doc.number}`;
      message = `*EXTRACTO DE ABONO DE FACTURA* - ${doc.issuerName || 'TALLER'}\n\n` +
        `Estimado/a ${doc.clientName || 'Cliente'},\n` +
        `Le remitimos el recibo con el extracto del estado del abono de su Factura Nº ${doc.number}:\n\n` +
        `• Importe Total Factura: ${total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n` +
        (addedAmount ? `• Último Abono Registrado: ${addedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} (${dateStr})\n` : '') +
        `• Total Abonado a la Fecha: ${currentPaid.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n` +
        `• Saldo Pendiente de Pago: ${currentPending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n` +
        `• Matrícula: ${doc.vehiclePlate || 'N/A'}\n\n` +
        `Un saludo cordial.`;
    }

    // 1. Envío automático siempre a través de WhatsApp
    if (cleanPhone) {
      const formattedPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`;
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    // 2. Envío a través de Email
    if (email) {
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.open(mailtoUrl, '_blank');
      }, 400);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || amount > pending || !onAddPayment) return;
    
    onAddPayment(doc.id, {
      id: crypto.randomUUID(),
      amount,
      date: new Date().toLocaleDateString('es-ES')
    });

    // Envío automático del recibo/extracto al abonar
    handleSendReceipt(amount);
    setPaymentAmount('');
  };

  return (
    <div 
      className={`${bgColor} rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border ${color} w-full lg:w-full mx-auto`}
    >
      <div className="p-5 flex flex-col gap-4" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Line 1: Status & License Plate or Location */}
        <div className="flex items-center justify-between">
          <span className={`font-black text-sm tracking-widest ${text}`}>
            {status}
          </span>
          {/* Matrícula o Ubicación (Desplazada a la derecha) */}
          {doc.showLocationData && doc.taskLocation && (!doc.showVehicleData || !doc.vehiclePlate) ? (
            <div className="flex items-center ml-auto bg-emerald-50 border-2 border-emerald-500 rounded overflow-hidden h-8 px-2.5 gap-1.5 shadow-sm">
              <Home className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-wider max-w-[140px] truncate">
                {doc.taskLocation}
              </span>
            </div>
          ) : (
            <div className="flex items-center ml-auto bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-sm">
              <div className="bg-blue-700 h-full w-6 flex flex-col items-center justify-center shrink-0">
                <span className="text-[6px] text-yellow-300 font-bold mb-0.5">⭐</span>
                <span className="text-[10px] text-white font-bold leading-none">E</span>
              </div>
              <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-lg tracking-widest text-[#0F172A]">
                {doc.vehiclePlate || 'SIN-MAT'}
              </div>
            </div>
          )}
        </div>

        {/* Line 2: Brand and Model or Location */}
        {doc.showLocationData && doc.taskLocation && (!doc.showVehicleData || !doc.vehiclePlate) ? (
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-[#475569]">Lugar de tarea:</span> {doc.taskLocation}
          </div>
        ) : (
          <div className="text-sm font-bold text-[#475569] uppercase tracking-wider">
            {doc.vehicleBrand || ''} {doc.vehicleModel || doc.vehicleType || 'Vehículo Genérico'}
          </div>
        )}

        {/* Line 3: Client Name */}
        <div className="text-xl font-black text-[#0F172A] truncate">
          {doc.clientName || 'Cliente Desconocido'}
        </div>

        {/* Line 4: Invoice and Expediente (Sin expediente en Quick ni Lite) */}
        <div className="flex items-center gap-4 text-xs font-bold text-[#64748B] font-mono">
          <span>{doc.number}</span>
          {userTier !== 'quick' && userTier !== 'lite' && doc.expediente && (
            <span className="flex items-center gap-1 before:content-['•'] before:mr-2">
              {doc.expediente}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Actions */}
      {isExpanded && (
        <div className="bg-[#FAF9F6] border-t border-[#E2E0D8] p-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
            {/* 1. Ver Factura */}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onViewDoc(doc); }}
              className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
              title="Ver Factura"
              aria-label="Ver Factura"
            >
              <SheetFIcon className="w-12 h-12 sm:w-14 sm:h-14" />
            </button>

            {/* 2. Ir a Expediente (Oculto en Quick y Lite) */}
            {userTier !== 'quick' && userTier !== 'lite' && doc.expediente && onNavigateToExpediente ? (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onNavigateToExpediente(doc.expediente!); }}
                className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                title="Ir a Expediente"
                aria-label="Expediente"
              >
                <FolderKanban className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
              </button>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14" />
            )}

            {/* 3. Panel de Cobro (Solo disponible para Pro y Enterprise) */}
            {canUseCobros ? (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowPaymentControl(!showPaymentControl); }}
                className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                title="Panel de Control de Cobro"
                aria-label="Control de Cobro"
              >
                <Euro className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
              </button>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14" />
            )}

            {/* 4. Ficha de Cliente */}
            {doc.clientId && onNavigateToClient ? (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onNavigateToClient(doc.clientId!); }}
                className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                title="Ficha de Cliente"
                aria-label="Cliente"
              >
                <UserPen className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
              </button>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14" />
            )}
          </div>

          {/* Payment Control Panel (Inline) - Solo para Pro y Enterprise */}
          {showPaymentControl && canUseCobros && (
            <div className="mt-4 p-5 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-lg cursor-default" onClick={e => e.stopPropagation()}>
              <h4 className="text-base font-black text-[#0F172A] uppercase mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
                <span>Panel de Control de Cobro</span>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase">
                  {pending === 0 ? 'Liquidada 100%' : 'Cobro Pendiente'}
                </span>
              </h4>
              
              <div className="flex justify-between items-end mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-extrabold mb-1">Total Factura</div>
                  <div className="text-2xl font-mono font-black text-[#0F172A]">
                    {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-extrabold mb-1">Pendiente</div>
                  <div className={`text-2xl font-mono font-black ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {pending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="mb-5">
                  <div className="text-base sm:text-lg font-black text-[#0F2942] uppercase tracking-wider mb-2.5 flex items-center justify-between border-b border-slate-100 pb-1">
                    <span>ABONOS PARCIALES ({payments.length})</span>
                  </div>
                  <ul className="space-y-2">
                    {payments.map(p => (
                      <li key={p.id} className="flex justify-between items-center text-base bg-slate-50 p-3 rounded-xl border-2 border-slate-200">
                        <span className="font-mono text-slate-800 font-bold text-base">{p.date}</span>
                        <span className="font-mono font-black text-emerald-600 text-lg sm:text-xl">
                          +{p.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pending > 0 && (
                <div className="space-y-4 mt-4 pt-4 border-t-2 border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Abonar Importe Parcial o Total</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!onAddPayment) return;
                        onAddPayment(doc.id, {
                          id: crypto.randomUUID(),
                          amount: pending,
                          date: new Date().toLocaleDateString('es-ES')
                        });
                        handleSendReceipt(pending);
                        setPaymentAmount('');
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-95"
                      title="Abonar de inmediato la totalidad del saldo pendiente de la factura"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>ABONAR TODO ({pending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })})</span>
                    </button>
                  </div>

                  <form onSubmit={handlePayment} className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-black text-2xl">€</span>
                      <input 
                        type="number"
                        step="0.01"
                        max={pending}
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-300 rounded-2xl outline-none focus:border-emerald-500 font-mono font-black text-xl sm:text-2xl text-slate-900 bg-black/[0.03]"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-2xl text-base uppercase tracking-wider transition-all shadow-md cursor-pointer hover:scale-102 active:scale-95 shrink-0"
                    >
                      <Plus className="w-6 h-6 stroke-[3]" />
                      <span>Abonar</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Botón de enviar recibo al cliente */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendReceipt()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-98"
                  title="Enviar recibo automáticamente al cliente a través de WhatsApp y Email"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>Enviar Recibo al Cliente (WhatsApp + Email)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const FacturacionView: React.FC<FacturacionViewProps> = ({
  id,
  logoUrl,
  userFullName,
  user,
  documents,
  onViewDoc,
  onNavigateToDocument,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onAddReceivedInvoice,
  onNavigateToExpediente,
  onNavigateToClient,
  onAddPayment,
  initialTab,
  initialClientFilterId,
  onOpenDetectedInvoices,
  detectedInvoicesCount = 0,
  onNewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'recibidas' | 'emitidas'>(initialTab || 'emitidas');
  const [clientFilterId, setClientFilterId] = useState<string | null>(initialClientFilterId || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal de incorporar factura manualmente
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualProviderName, setManualProviderName] = useState('');
  const [manualProviderCif, setManualProviderCif] = useState('');
  const [manualProviderAddress, setManualProviderAddress] = useState('');
  const [manualProviderPhone, setManualProviderPhone] = useState('');
  const [manualProviderEmail, setManualProviderEmail] = useState('');
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState('');
  const [manualInvoiceDate, setManualInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualConcept, setManualConcept] = useState('');
  const [manualQuantity, setManualQuantity] = useState<number | string>(1);
  const [manualUnitPrice, setManualUnitPrice] = useState<number | string>('');
  const [manualAttachmentBase64, setManualAttachmentBase64] = useState<string | null>(null);
  const [manualAttachmentFilename, setManualAttachmentFilename] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    if (initialClientFilterId !== undefined) setClientFilterId(initialClientFilterId);
  }, [initialClientFilterId]);

  const emitidas = documents.filter((d) => {
    if (d.type !== 'factura') return false;
    if (clientFilterId && d.clientId !== clientFilterId) return false;
    return true;
  });
  const recibidas = documents.filter((d) => (d.type as any) === 'factura_recibida');

  // Cálculo de documentos pendientes de acción o confirmación para alertas y badges visuales
  const emitidasPendientesCount = emitidas.filter((doc) => {
    if (doc.status === 'borrador') return true;
    const { status } = getInvoiceStatusInfo(doc);
    return status === 'PENDIENTE' || status === 'IMPAGADA' || status === 'PARCIAL';
  }).length;

  const recibidasPendientesCount = (detectedInvoicesCount || 0) + recibidas.filter((doc) => {
    return doc.status === 'borrador' || !doc.isLocked;
  }).length;

  // Cálculos automáticos para el formulario manual con 21% de IVA
  const qty = Number(manualQuantity) || 0;
  const unitPrice = Number(manualUnitPrice) || 0;
  const manualBaseAmount = qty * unitPrice;
  const manualIvaAmount = manualBaseAmount * 0.21;
  const manualTotalAmount = manualBaseAmount + manualIvaAmount;

  const handleCaptureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    e.target.value = '';

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al escanear la factura.');
      }

      const currentYear = new Date().getFullYear().toString().slice(-2);
      const frDocs = recibidas.filter(d => d.number.startsWith(`FR${currentYear}`));
      const nextNum = frDocs.length + 1;
      const formattedNum = String(nextNum).padStart(4, '0');
      const docId = result.data?.invoiceNumber || `FR${currentYear}${formattedNum}`;
      
      const extracted = result.data;
      
      const newDoc: GestarianDocument = {
        id: crypto.randomUUID(),
        type: 'factura_recibida' as any,
        number: docId,
        date: new Date().toLocaleDateString('es-ES'),
        issuerId: crypto.randomUUID(),
        issuerName: extracted.issuerName || 'PROVEEDOR DESCONOCIDO',
        issuerCif: extracted.issuerCif || '---',
        issuerAddress: extracted.issuerAddress || '---',
        issuerPhone: '',
        issuerEmail: '',
        clientId: user.id,
        clientName: user.fullName || 'Nuestra Empresa',
        clientCif: user.cif || '',
        clientAddress: user.fiscalAddress || '',
        clientEmail: user.email || '',
        clientPhone: user.phone || '',
        items: (extracted.items && extracted.items.length > 0)
          ? extracted.items.map((it: any, idx: number) => ({
              id: crypto.randomUUID(),
              description: it.description || `Concepto ${idx + 1}`,
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || it.amount || 0,
              amount: it.amount || 0
            }))
          : [{
              id: crypto.randomUUID(),
              description: 'Gastos de factura recibida',
              quantity: 1,
              unitPrice: extracted.baseAmount || 0,
              amount: extracted.baseAmount || 0
            }],
        subtotal: extracted.baseAmount || 0,
        applyIva: true,
        ivaRate: extracted.baseAmount && extracted.ivaAmount 
          ? Math.round((extracted.ivaAmount / extracted.baseAmount) * 100) 
          : 21,
        ivaAmount: extracted.ivaAmount || 0,
        applyIrpf: false,
        irpfRate: 0,
        irpfAmount: 0,
        total: extracted.totalAmount || 0,
        status: 'confirmada',
        isLocked: true,
        attachmentBase64: base64.replace(/^data:[^;]+;base64,/, ''),
        attachmentFilename: file.name,
        attachmentMimeType: file.type || 'image/jpeg'
      } as any;

      onAddReceivedInvoice(newDoc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCaptureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).replace(/^data:[^;]+;base64,/, '');
      setManualAttachmentBase64(base64);
      setManualAttachmentFilename(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProviderName.trim()) {
      alert('Por favor, introduce el nombre del proveedor');
      return;
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const generatedNumber = manualInvoiceNumber.trim() || `FR${currentYear}-${Date.now().toString().slice(-5)}`;

    const newDoc: GestarianDocument = {
      id: `fact-rec-${Date.now()}`,
      type: 'factura_recibida',
      number: generatedNumber,
      date: manualInvoiceDate || new Date().toISOString().split('T')[0],
      issuerId: `prov-${Date.now()}`,
      issuerName: manualProviderName.trim(),
      issuerCif: manualProviderCif.trim(),
      issuerAddress: manualProviderAddress.trim(),
      issuerPhone: manualProviderPhone.trim(),
      issuerEmail: manualProviderEmail.trim(),
      clientId: user.id || 'usr_dmcar_01',
      clientName: user.fullName || 'DM CAR',
      clientCif: user.cif || '',
      clientAddress: user.fiscalAddress || '',
      clientEmail: user.email || '',
      clientPhone: user.phone || '',
      items: [
        {
          id: `item-${Date.now()}`,
          description: manualConcept.trim() || `Compra / Servicio de ${manualProviderName.trim()}`,
          quantity: qty || 1,
          unitPrice: unitPrice,
          amount: manualBaseAmount
        }
      ],
      subtotal: manualBaseAmount,
      applyIva: true,
      ivaRate: 21,
      ivaAmount: manualIvaAmount,
      applyIrpf: false,
      irpfRate: 0,
      irpfAmount: 0,
      total: manualTotalAmount,
      status: 'confirmada',
      isLocked: false,
      createdAt: new Date().toISOString(),
      ...(manualAttachmentBase64 ? {
        attachmentBase64: manualAttachmentBase64,
        attachmentFilename: manualAttachmentFilename || `Factura_${generatedNumber}.jpg`,
        attachmentMimeType: 'image/jpeg'
      } : {})
    } as any;

    onAddReceivedInvoice(newDoc);
    setIsManualModalOpen(false);

    // Resetear formulario
    setManualProviderName('');
    setManualProviderCif('');
    setManualProviderAddress('');
    setManualProviderPhone('');
    setManualProviderEmail('');
    setManualInvoiceNumber('');
    setManualConcept('');
    setManualQuantity(1);
    setManualUnitPrice('');
    setManualAttachmentBase64(null);
    setManualAttachmentFilename('');
  };

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col bg-white overflow-y-auto">
      {/* Cabecera con título Facturas */}
      <PageHeader
        pageId={id || 'page-facturacion'}
        title="Facturas"
        onOpenMenu={onOpenMenu}
        onBack={onBack}
        onNavigateHome={onNavigateHome}
      />
      
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex flex-col h-full gap-8">
        
        {/* Toggle Nav con nombres Emitidas y Recibidas con alertas y badges visuales */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <button 
            type="button"
            onClick={() => setActiveTab('emitidas')}
            className={`relative flex items-center gap-2.5 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === 'emitidas' 
                ? 'bg-[#0F2942] text-white shadow-md scale-105' 
                : 'bg-white text-[#64748B] border border-gray-200 hover:border-[#0F2942] hover:text-[#0F2942]'
            }`}
            title={emitidasPendientesCount > 0 ? `${emitidasPendientesCount} facturas emitidas pendientes de pago o confirmación` : 'Facturas Emitidas'}
          >
            <span>Emitidas</span>
            {emitidasPendientesCount > 0 && (
              <span className="flex items-center gap-1.5 ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black leading-none shadow-sm ${
                  activeTab === 'emitidas' 
                    ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300' 
                    : 'bg-amber-500 text-white'
                }`}>
                  {emitidasPendientesCount}
                </span>
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('recibidas')}
            className={`relative flex items-center gap-2.5 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === 'recibidas' 
                ? 'bg-[#0F2942] text-white shadow-md scale-105' 
                : 'bg-white text-[#64748B] border border-gray-200 hover:border-[#0F2942] hover:text-[#0F2942]'
            }`}
            title={recibidasPendientesCount > 0 ? `${recibidasPendientesCount} facturas recibidas o detectadas pendientes de revisión/incorporación` : 'Facturas Recibidas'}
          >
            <span>Recibidas</span>
            {recibidasPendientesCount > 0 && (
              <span className="flex items-center gap-1.5 ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black leading-none shadow-sm ${
                  activeTab === 'recibidas' 
                    ? 'bg-emerald-400 text-slate-950 ring-1 ring-emerald-300' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {recibidasPendientesCount}
                </span>
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 pb-12">
          {activeTab === 'emitidas' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                {clientFilterId ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 flex-1">
                    <span>Mostrando facturas emitidas del cliente seleccionado.</span>
                    <button
                      type="button"
                      onClick={() => setClientFilterId(null)}
                      className="font-bold underline hover:text-blue-700 cursor-pointer"
                    >
                      Ver todas las facturas
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Listado de Facturas Emitidas ({emitidas.length})
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onNewInvoice) {
                      onNewInvoice();
                    } else if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('gestarian_new_invoice'));
                    }
                  }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-bold shadow-md shadow-emerald-600/20 transition-all text-xs tracking-wider uppercase cursor-pointer shrink-0 ml-auto active:scale-95 hover:scale-102"
                  title="Crear Nueva Factura Emitida"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Nueva Factura</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {emitidas.map(doc => (
                  <FacturaCard 
                    key={doc.id} 
                    doc={doc} 
                    onViewDoc={onViewDoc} 
                    onNavigateToExpediente={onNavigateToExpediente}
                    onNavigateToClient={onNavigateToClient}
                    onAddPayment={onAddPayment}
                    userTier={user?.currentTier}
                  />
                ))}
                {emitidas.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    {clientFilterId
                      ? 'No hay facturas emitidas para este cliente.'
                      : 'No hay facturas emitidas.'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Botonera de Facturas Recibidas sin las dos líneas de texto */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Botón 1: Email (facturas detectadas por rastreo) */}
                  {onOpenDetectedInvoices && (
                    <button 
                      type="button"
                      onClick={onOpenDetectedInvoices}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold shadow-md transition-all text-xs tracking-wider uppercase border cursor-pointer ${
                        detectedInvoicesCount > 0
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-300/60 shadow-emerald-500/25 ring-2 ring-emerald-400/50 hover:scale-[1.02] active:scale-95'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Facturas detectadas por rastreo en Email"
                    >
                      <Mail className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>Email</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        detectedInvoicesCount > 0 ? 'bg-white text-emerald-900 shadow-sm' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {detectedInvoicesCount}
                      </span>
                    </button>
                  )}

                  {/* Botón 2: Incorporar con OCR */}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#38BDF8] text-white px-5 py-2.5 rounded-full font-bold hover:bg-[#0284C7] shadow-sm transition-all text-xs tracking-wider uppercase cursor-pointer"
                    title="Fotografiar o escanear factura con lectura OCR inteligente"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Incorporar con OCR</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                    onChange={handleCaptureFile}
                  />

                  {/* Botón 3: Incorporar manualmente */}
                  <button 
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="flex items-center gap-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-xs tracking-wider uppercase cursor-pointer border border-[#1E3A8A]"
                    title="Introducir datos de la factura manualmente"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Incorporar manualmente</span>
                  </button>
                </div>
              </div>
              
              {isProcessing && (
                <div className="bg-white p-6 rounded-xl border border-[#38BDF8] flex flex-col items-center justify-center mb-6 shadow-sm">
                  <RefreshCw className="w-8 h-8 text-[#38BDF8] animate-spin mb-3" />
                  <p className="font-bold text-[#0F172A] uppercase tracking-widest text-xs animate-pulse">Procesando OCR con Gemini...</p>
                </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Error en lectura</p>
                    <p className="text-xs">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-bold">✕</button>
                </div>
              )}

              {recibidas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 p-12">
                  <UploadCloud className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="font-bold text-lg text-[#0F172A]">No hay facturas recibidas</p>
                  <p className="text-sm max-w-sm mt-2 text-gray-500">Usa los botones superiores para incorporar facturas desde el Email, mediante OCR o introduciéndolas manualmente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recibidas.map((doc) => (
                    <div 
                      key={doc.id} 
                      onClick={() => onViewDoc(doc)}
                      className="bg-rose-500/5 border border-rose-500 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-rose-400 transition-all relative overflow-hidden group cursor-pointer w-full lg:w-full mx-auto"
                      title="Pulsar para abrir la factura original en el visor"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                        <FileText className="w-24 h-24" />
                      </div>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-1 rounded text-xs">{doc.number}</span>
                          <span className="text-xs font-bold text-gray-500">{doc.date}</span>
                        </div>
                        
                        <h4 className="font-black text-[#0F172A] text-base leading-tight mb-1 truncate group-hover:text-rose-600 transition-colors">{doc.issuerName}</h4>
                        <p className="text-xs font-mono text-gray-500 mb-4">{doc.issuerCif || '---'}</p>
                        
                        <div className="mt-auto space-y-1.5 pt-4 border-t border-gray-100">
                          <div className="flex justify-between text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                            <span>Base:</span>
                            <span className="font-mono text-[#0F172A]">{doc.subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                            <span>IVA ({doc.ivaRate}%):</span>
                            <span className="font-mono text-[#0F172A]">{doc.ivaAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-rose-600 pt-1 mt-1 border-t border-gray-100">
                            <span className="uppercase tracking-wider">Total:</span>
                            <span className="font-mono">{doc.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-rose-600 transition-colors">
                          <span className="flex items-center gap-1 font-semibold">
                            <Eye className="w-3.5 h-3.5" />
                            Ver factura original
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">PDF Original</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA INCORPORAR FACTURA RECIBIDA MANUALMENTE */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Cabecera del formulario */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F2942] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-wide">Incorporar Factura Manualmente</h3>
                  <p className="text-[11px] text-slate-300">Introduce los datos del proveedor y factura recibida</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del formulario con Scroll */}
            <form onSubmit={handleSaveManualInvoice} className="flex-1 overflow-y-auto p-6 space-y-6 text-[#0F172A]">
              
              {/* Bloque 1: Datos del Proveedor */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Datos del Proveedor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Razón Social *</label>
                    <input 
                      type="text"
                      required
                      value={manualProviderName}
                      onChange={(e) => setManualProviderName(e.target.value)}
                      placeholder="Ej: Recambios y Pinturas Automoción S.L."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CIF / NIF</label>
                    <input 
                      type="text"
                      value={manualProviderCif}
                      onChange={(e) => setManualProviderCif(e.target.value)}
                      placeholder="Ej: B-12345678"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                    <input 
                      type="tel"
                      value={manualProviderPhone}
                      onChange={(e) => setManualProviderPhone(e.target.value)}
                      placeholder="Ej: 912 345 678"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input 
                      type="email"
                      value={manualProviderEmail}
                      onChange={(e) => setManualProviderEmail(e.target.value)}
                      placeholder="Ej: facturacion@proveedor.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dirección</label>
                    <input 
                      type="text"
                      value={manualProviderAddress}
                      onChange={(e) => setManualProviderAddress(e.target.value)}
                      placeholder="Ej: Polígono Industrial Nave 4"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Datos de la Factura */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Datos de la Factura
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nº de Factura</label>
                    <input 
                      type="text"
                      value={manualInvoiceNumber}
                      onChange={(e) => setManualInvoiceNumber(e.target.value)}
                      placeholder="Ej: F-2026/0942"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                    <input 
                      type="date"
                      value={manualInvoiceDate}
                      onChange={(e) => setManualInvoiceDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Concepto / Descripción *</label>
                    <input 
                      type="text"
                      required
                      value={manualConcept}
                      onChange={(e) => setManualConcept(e.target.value)}
                      placeholder="Ej: Pintura base agua + barniz + filtros de cabina"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad</label>
                    <input 
                      type="number"
                      step="any"
                      min="0.01"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Importe Unitario (€ sin IVA) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={manualUnitPrice}
                      onChange={(e) => setManualUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-mono font-bold text-emerald-700 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 3: Cálculo Automático de Importes */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5">
                  <span>Base Imponible:</span>
                  <span className="font-mono font-bold">{manualBaseAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 mb-2">
                  <span>IVA Aplicado (21%):</span>
                  <span className="font-mono font-bold text-blue-700">{manualIvaAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-[#0F172A] pt-2 border-t border-slate-200">
                  <span className="uppercase tracking-wider">Total Calculado:</span>
                  <span className="font-mono text-emerald-700 text-lg">{manualTotalAmount.toFixed(2)} €</span>
                </div>
              </div>

              {/* Bloque 4: Adjuntar Imagen de la Factura (Opcional) */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Imagen de la Factura (Opcional):</span>
                  <span className="text-[11px] text-slate-400">No obligatorio para guardar</span>
                </div>

                {manualAttachmentBase64 ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Image className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-900 truncate">
                        {manualAttachmentFilename || 'Imagen adjunta'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setManualAttachmentBase64(null);
                        setManualAttachmentFilename('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded bg-rose-50 border border-rose-200 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => manualFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Adjuntar foto o imagen de la factura</span>
                    </button>
                    <input 
                      type="file"
                      ref={manualFileInputRef}
                      accept="image/*,application/pdf"
                      capture="environment"
                      className="hidden"
                      onChange={handleManualCaptureFile}
                    />
                  </div>
                )}
              </div>

              {/* Botón Incorporar al final */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-slate-600 hover:bg-gray-100 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Incorporar Factura</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
