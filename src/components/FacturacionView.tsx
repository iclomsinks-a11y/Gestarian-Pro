import React, { useState, useRef } from 'react';
import { PageHeader } from './PageHeader';
import { GestarianDocument, AppUser, DocumentPayment } from '../types';
import { Camera, FileText, UploadCloud, AlertCircle, RefreshCw, FolderOpen, Euro, User, Check, Plus } from 'lucide-react';

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
    return { status: 'ABONADA', color: 'border-emerald-500', text: 'text-emerald-500' };
  }
  
  const issueDate = parseDateStr(doc.date);
  const now = new Date();
  const daysSinceIssue = (now.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
  
  if (paid === 0) {
    if (daysSinceIssue > 7) {
      return { status: 'IMPAGADA', color: 'border-rose-500', text: 'text-rose-500' };
    } else {
      return { status: 'PENDIENTE', color: 'border-orange-500', text: 'text-orange-500' };
    }
  } else {
    // Parcial
    const lastPaymentDate = new Date(Math.max(...payments.map(p => parseDateStr(p.date).getTime())));
    const daysSinceLastPayment = (now.getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysSinceLastPayment > 30) {
      return { status: 'IMPAGADA', color: 'border-rose-500', text: 'text-rose-500' };
    } else {
      return { status: 'PARCIAL', color: 'border-[#38BDF8]', text: 'text-[#38BDF8]' };
    }
  }
};

const FacturaCard: React.FC<{
  doc: GestarianDocument;
  onViewDoc: (doc: GestarianDocument) => void;
  onNavigateToExpediente?: (id: string) => void;
  onNavigateToClient?: (id: string) => void;
  onAddPayment?: (docId: string, payment: DocumentPayment) => void;
}> = ({ doc, onViewDoc, onNavigateToExpediente, onNavigateToClient, onAddPayment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showPaymentControl, setShowPaymentControl] = useState(false);

  const { status, color, text } = getInvoiceStatusInfo(doc);
  
  const payments = doc.payments || [];
  const total = doc.total || 0;
  const paid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const pending = total - paid;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || amount > pending || !onAddPayment) return;
    
    onAddPayment(doc.id, {
      id: crypto.randomUUID(),
      amount,
      date: new Date().toLocaleDateString('es-ES')
    });
    setPaymentAmount('');
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-[3px] ${color}`}
    >
      <div className="p-5 flex flex-col gap-4" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Line 1: Status & License Plate */}
        <div className="flex items-center justify-between">
          <span className={`font-black text-sm tracking-widest ${text}`}>
            {status}
          </span>
          {/* Matrícula (Desplazada a la derecha) */}
          <div className="flex items-center ml-auto bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-sm">
            <div className="bg-blue-700 h-full w-6 flex flex-col items-center justify-center shrink-0">
              <span className="text-[6px] text-yellow-300 font-bold mb-0.5">⭐</span>
              <span className="text-[10px] text-white font-bold leading-none">E</span>
            </div>
            <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-lg tracking-widest text-[#0F172A]">
              {doc.vehiclePlate || 'SIN-MAT'}
            </div>
          </div>
        </div>

        {/* Line 2: Brand and Model */}
        <div className="text-sm font-bold text-[#475569] uppercase tracking-wider">
          {doc.vehicleBrand || ''} {doc.vehicleModel || doc.vehicleType || 'Vehículo Genérico'}
        </div>

        {/* Line 3: Client Name */}
        <div className="text-xl font-black text-[#0F172A] truncate">
          {doc.clientName || 'Cliente Desconocido'}
        </div>

        {/* Line 4: Invoice and Expediente */}
        <div className="flex items-center gap-4 text-xs font-bold text-[#64748B] font-mono">
          <span>{doc.number}</span>
          {doc.expediente && (
            <span className="flex items-center gap-1 before:content-['•'] before:mr-2">
              {doc.expediente}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Actions */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-4">
          <div className="flex items-center justify-around">
            <button 
              onClick={(e) => { e.stopPropagation(); onViewDoc(doc); }}
              className="text-[#0F2942] hover:text-[#38BDF8] hover:scale-110 transition-transform p-3"
              title="Ver Factura"
            >
              <div className="relative">
                <FileText className="w-8 h-8" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">F</span>
              </div>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); doc.expediente && onNavigateToExpediente?.(doc.expediente); }}
              className="text-[#0F2942] hover:text-[#38BDF8] hover:scale-110 transition-transform p-3"
              title="Ir a Expediente"
            >
              <FolderOpen className="w-8 h-8" strokeWidth={1.5} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPaymentControl(!showPaymentControl); }}
              className="text-[#0F2942] hover:text-emerald-500 hover:scale-110 transition-transform p-3"
              title="Panel de Cobro"
            >
              <Euro className="w-8 h-8" strokeWidth={1.5} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); doc.clientId && onNavigateToClient?.(doc.clientId); }}
              className="text-[#0F2942] hover:text-[#38BDF8] hover:scale-110 transition-transform p-3"
              title="Ficha de Cliente"
            >
              <User className="w-8 h-8" strokeWidth={1.5} />
            </button>
          </div>

          {/* Payment Control Panel (Inline) */}
          {showPaymentControl && (
            <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm cursor-default" onClick={e => e.stopPropagation()}>
              <h4 className="text-sm font-black text-[#0F172A] uppercase mb-4 border-b border-gray-100 pb-2">Panel de Control de Cobro</h4>
              
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total Factura</div>
                  <div className="text-xl font-mono font-black text-[#0F172A]">
                    {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Pendiente</div>
                  <div className={`text-xl font-mono font-black ${pending > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {pending.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">Abonos Parciales</div>
                  <ul className="space-y-2">
                    {payments.map(p => (
                      <li key={p.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        <span className="font-mono text-gray-600">{p.date}</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {p.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pending > 0 && (
                <form onSubmit={handlePayment} className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">€</span>
                    <input 
                      type="number"
                      step="0.01"
                      max={pending}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-emerald-500 font-mono text-sm"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Abonar</span>
                  </button>
                </form>
              )}
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
  initialClientFilterId
}) => {
  const [activeTab, setActiveTab] = useState<'recibidas' | 'emitidas'>(initialTab || 'emitidas');
  const [clientFilterId, setClientFilterId] = useState<string | null>(initialClientFilterId || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const docId = `FR${currentYear}${formattedNum}`;
      
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
        items: [{
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
        isLocked: true
      };

      onAddReceivedInvoice(newDoc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col p-4 sm:p-8 bg-[#F8F7F3] overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full gap-8">
        <PageHeader
          pageId={id}
          title="Facturación"
          onOpenMenu={onOpenMenu}
          onBack={onBack}
          onNavigateHome={onNavigateHome}
        />
        
        {/* Toggle Nav */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <button 
            onClick={() => setActiveTab('recibidas')}
            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'recibidas' ? 'bg-[#0F2942] text-white shadow-md scale-105' : 'bg-white text-[#64748B] border border-gray-200 hover:border-[#0F2942] hover:text-[#0F2942]'}`}
          >
            Facturas Recibidas
          </button>
          <button 
            onClick={() => setActiveTab('emitidas')}
            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'emitidas' ? 'bg-[#0F2942] text-white shadow-md scale-105' : 'bg-white text-[#64748B] border border-gray-200 hover:border-[#0F2942] hover:text-[#0F2942]'}`}
          >
            Facturas Emitidas
          </button>
        </div>

        <div className="flex-1 pb-12">
          {activeTab === 'emitidas' ? (
            <div className="flex flex-col gap-4">
              {clientFilterId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
                  <span>Mostrando facturas emitidas del cliente seleccionado.</span>
                  <button
                    type="button"
                    onClick={() => setClientFilterId(null)}
                    className="font-bold underline hover:text-blue-700 cursor-pointer"
                  >
                    Ver todas las facturas
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {emitidas.map(doc => (
                  <FacturaCard 
                    key={doc.id} 
                    doc={doc} 
                    onViewDoc={onViewDoc} 
                    onNavigateToExpediente={onNavigateToExpediente}
                    onNavigateToClient={onNavigateToClient}
                    onAddPayment={onAddPayment}
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#0F172A]">Registro de Gastos</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-[#38BDF8] text-white px-5 py-2.5 rounded-full font-bold hover:bg-[#0284C7] shadow-sm transition-all text-xs tracking-wider uppercase"
                >
                  <Camera className="w-4 h-4" />
                  <span>Escanear Factura/Recibo</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCaptureFile}
                />
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
                  <p className="text-sm max-w-sm mt-2 text-gray-500">Usa el botón superior para fotografiar un recibo o factura y extraer sus datos automáticamente con Inteligencia Artificial.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recibidas.map((doc) => (
                    <div key={doc.id} className="bg-white border-l-4 border-l-rose-500 border-t border-r border-b border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                        <FileText className="w-24 h-24" />
                      </div>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-1 rounded text-xs">{doc.number}</span>
                          <span className="text-xs font-bold text-gray-500">{doc.date}</span>
                        </div>
                        
                        <h4 className="font-black text-[#0F172A] text-base leading-tight mb-1 truncate">{doc.issuerName}</h4>
                        <p className="text-xs font-mono text-gray-500 mb-4">{doc.issuerCif}</p>
                        
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
