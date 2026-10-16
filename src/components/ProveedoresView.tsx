import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { 
  Search, Plus, Truck, Phone, Mail, FileText, 
  MessageCircle, Package, Camera, RefreshCw, AlertCircle,
  Eye, Check, X, Building2, UploadCloud, Receipt, Layers, MapPin
} from 'lucide-react';
import { SheetFIcon } from './BudgetIcons';
import { AppUser, GestarianDocument } from '../types';
import { playGentleChime } from '../utils/audioNotification';

interface ProveedoresViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  user?: AppUser;
  documents?: GestarianDocument[];
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenFacturaRecibidaModal?: () => void;
  onAddReceivedInvoice?: (doc: GestarianDocument) => void;
  onViewDoc?: (doc: GestarianDocument) => void;
  onShowToast?: (message: string) => void;
}

export interface ProveedorItem {
  id: string;
  code: string;
  name: string;
  cif: string;
  direccionFiscal?: string;
  sector: string;
  phone: string;
  email: string;
  pendingOrderRef: string;
  expedienteVinculado: string;
  lastDelivery: string;
}

const INITIAL_PROVEEDORES: ProveedorItem[] = [
  {
    id: 'prov-1',
    code: 'PROV-01',
    name: 'Cecauto Recambios Central S.A.',
    cif: 'A08234112',
    direccionFiscal: 'Calle San Salvador 14, Pol. Ind. Cobo Calleja, 28947 Fuenlabrada (Madrid)',
    sector: 'CHAPA, PARAGOLPES Y ELEMENTOS AMOVIBLES',
    phone: '912345678',
    email: 'pedidos@cecauto.es',
    pendingOrderRef: 'PED-2026-081',
    expedienteVinculado: 'E260004',
    lastDelivery: 'Aleta der. Golf VII',
  },
  {
    id: 'prov-2',
    code: 'PROV-02',
    name: 'Axalta Coating Systems España S.L.',
    cif: 'B28114092',
    direccionFiscal: 'Av. de la Industria 82, Pol. Ind. Can Lorenzo, 08980 Sant Feliu de Llobregat (Barcelona)',
    sector: 'PINTURAS, BARNICES HS Y FONDOS DE COLOR',
    phone: '934567890',
    email: 'contacto@axalta.es',
    pendingOrderRef: 'PED-2026-082',
    expedienteVinculado: 'E260005',
    lastDelivery: 'Gama Cromax Pro',
  },
  {
    id: 'prov-3',
    code: 'PROV-03',
    name: 'Zaphiro Carrocería & Anexos',
    cif: 'B91238472',
    direccionFiscal: 'Polígono Industrial PISA, Calle Artesanía 12, 41927 Mairena del Aljarafe (Sevilla)',
    sector: 'ABRASIVOS, MASILLAS Y CINTAS DE ENMASCARAR',
    phone: '945678901',
    email: 'comercial@zaphiro.com',
    pendingOrderRef: 'PED-2026-083',
    expedienteVinculado: 'E260006',
    lastDelivery: 'Discos abrasivos y burletes',
  },
  {
    id: 'prov-4',
    code: 'PROV-04',
    name: 'Cristalbox Lunas del Automóvil S.L.',
    cif: 'B78129841',
    direccionFiscal: 'Passeig de la Zona Franca 110, 08038 Barcelona',
    sector: 'PARABRISAS, LUNAS TÉRMICAS Y CRISTALERÍA',
    phone: '916789012',
    email: 'cristal@cristalbox.es',
    pendingOrderRef: 'PED-2026-084',
    expedienteVinculado: 'E260007',
    lastDelivery: 'Parabrisas acústico sensor',
  },
];

const PROVEEDORES_STORAGE_KEY = 'gestarian_proveedores_v1';

const getStoredProveedores = (): ProveedorItem[] => {
  try {
    const stored = localStorage.getItem(PROVEEDORES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_PROVEEDORES;
};

const saveStoredProveedores = (items: ProveedorItem[]) => {
  try {
    localStorage.setItem(PROVEEDORES_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
};

export const ProveedoresView: React.FC<ProveedoresViewProps> = ({
  id,
  logoUrl,
  userFullName,
  user,
  documents = [],
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenFacturaRecibidaModal,
  onAddReceivedInvoice,
  onViewDoc,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'proveedores' | 'facturas'>('proveedores');
  const [proveedores, setProveedores] = useState<ProveedorItem[]>(getStoredProveedores);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Modales manuales
  const [isNewProviderModalOpen, setIsNewProviderModalOpen] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvCif, setNewProvCif] = useState('');
  const [newProvFiscalAddress, setNewProvFiscalAddress] = useState('');
  const [newProvSector, setNewProvSector] = useState('');
  const [newProvPhone, setNewProvPhone] = useState('');
  const [newProvEmail, setNewProvEmail] = useState('');

  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
  const [selectedTargetProvider, setSelectedTargetProvider] = useState<ProveedorItem | null>(null);
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState('');
  const [manualBaseAmount, setManualBaseAmount] = useState('');
  const [manualIvaRate, setManualIvaRate] = useState('21');
  const [manualItemDescription, setManualItemDescription] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Facturas recibidas asociadas a proveedores
  const facturasRecibidas = documents.filter((d) => d.type === 'factura_recibida');

  // Escuchador para evento global de botón cámara del footer
  useEffect(() => {
    const handleFooterCameraTrigger = () => {
      cameraInputRef.current?.click();
    };
    window.addEventListener('gestarian_scan_proveedor_factura', handleFooterCameraTrigger);
    return () => window.removeEventListener('gestarian_scan_proveedor_factura', handleFooterCameraTrigger);
  }, []);

  // Lógica de escaneo con OCR inteligente para factura de proveedor
  const handleScanInvoiceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);
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
        body: JSON.stringify({ 
          image: base64,
          filename: file.name,
          mimeType: file.type || 'image/jpeg'
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al escanear la factura.');
      }

      const extracted = result.data || {};
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const frDocs = facturasRecibidas.filter(d => d.number.startsWith(`FR${currentYear}`));
      const nextNum = frDocs.length + 1;
      const formattedNum = String(nextNum).padStart(4, '0');
      const invoiceNum = extracted.invoiceNumber || `FR${currentYear}${formattedNum}`;

      const issuerName = extracted.issuerName?.trim() || 'Proveedor Recambios';
      const issuerCif = extracted.issuerCif?.trim() || '---';
      const issuerAddress = extracted.issuerAddress?.trim() || '';
      const baseAmount = Number(extracted.baseAmount) || Number(extracted.totalAmount ? extracted.totalAmount / 1.21 : 100);
      const ivaAmount = Number(extracted.ivaAmount) || Number(extracted.totalAmount ? extracted.totalAmount - baseAmount : (baseAmount * 0.21));
      const totalAmount = Number(extracted.totalAmount) || (baseAmount + ivaAmount);
      const ivaRate = baseAmount > 0 && ivaAmount > 0 ? Math.round((ivaAmount / baseAmount) * 100) : 21;

      // 1. Poner los datos en una tarjeta de factura recibida (GestarianDocument)
      const newReceivedInvoice: GestarianDocument = {
        id: crypto.randomUUID(),
        type: 'factura_recibida',
        number: invoiceNum,
        date: new Date().toLocaleDateString('es-ES'),
        issuerId: crypto.randomUUID(),
        issuerName,
        issuerCif,
        issuerAddress,
        issuerPhone: extracted.issuerPhone || '',
        issuerEmail: extracted.issuerEmail || '',
        clientId: user?.id || 'client-self',
        clientName: user?.fullName || 'Nuestra Empresa',
        clientCif: user?.cif || '',
        clientAddress: user?.fiscalAddress || '',
        clientEmail: user?.email || '',
        clientPhone: user?.phone || '',
        items: (extracted.items && extracted.items.length > 0)
          ? extracted.items.map((it: any, idx: number) => ({
              id: crypto.randomUUID(),
              description: it.description || `Partida ${idx + 1}`,
              quantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice) || Number(it.amount) || baseAmount,
              amount: Number(it.amount) || baseAmount
            }))
          : [{
              id: crypto.randomUUID(),
              description: 'Material / Recambios según factura recibida',
              quantity: 1,
              unitPrice: baseAmount,
              amount: baseAmount
            }],
        subtotal: baseAmount,
        applyIva: true,
        ivaRate,
        ivaAmount,
        applyIrpf: false,
        irpfRate: 0,
        irpfAmount: 0,
        total: totalAmount,
        status: 'confirmada',
        isLocked: true,
        attachmentBase64: base64.replace(/^data:[^;]+;base64,/, ''),
        attachmentFilename: file.name,
        attachmentMimeType: file.type || 'image/jpeg'
      };

      if (onAddReceivedInvoice) {
        onAddReceivedInvoice(newReceivedInvoice);
      }

      // 2. Comprobar si el proveedor está creado anteriormente en las tarjetas de proveedores
      const cleanIssuerCif = issuerCif.replace(/[\s-]/g, '').toUpperCase();
      const existingProv = proveedores.find(p => {
        const cleanPProvCif = p.cif.replace(/[\s-]/g, '').toUpperCase();
        if (cleanIssuerCif && cleanIssuerCif !== '---' && cleanPProvCif === cleanIssuerCif) return true;
        return p.name.trim().toLowerCase() === issuerName.toLowerCase();
      });

      let createdNewProv = false;
      let finalProvs = [...proveedores];

      if (!existingProv) {
        // Crear la ficha de proveedor en una tarjeta en la página de proveedores
        const newCode = `PROV-${String(proveedores.length + 1).padStart(2, '0')}`;
        const firstItemDesc = extracted.items?.[0]?.description || 'Recambios y suministros de automoción';
        const newProvItem: ProveedorItem = {
          id: `prov-${Date.now()}`,
          code: newCode,
          name: issuerName,
          cif: issuerCif,
          sector: extracted.sector || 'RECAMBIOS Y SUMINISTROS',
          phone: extracted.issuerPhone || '---',
          email: extracted.issuerEmail || '---',
          pendingOrderRef: `FACT: ${invoiceNum}`,
          expedienteVinculado: '---',
          lastDelivery: firstItemDesc,
        };
        finalProvs = [newProvItem, ...proveedores];
        setProveedores(finalProvs);
        saveStoredProveedores(finalProvs);
        createdNewProv = true;
      } else {
        // Actualizar datos del proveedor existente
        finalProvs = proveedores.map(p => {
          if (p.id === existingProv.id) {
            return {
              ...p,
              pendingOrderRef: `FACT: ${invoiceNum}`,
              lastDelivery: extracted.items?.[0]?.description || p.lastDelivery,
            };
          }
          return p;
        });
        setProveedores(finalProvs);
        saveStoredProveedores(finalProvs);
      }

      playGentleChime();
      const msg = createdNewProv 
        ? `Factura ${invoiceNum} registrada en tarjeta y NUEVA ficha de proveedor "${issuerName}" creada con éxito.`
        : `Factura ${invoiceNum} registrada y vinculada a la ficha del proveedor "${existingProv?.name}".`;
      
      if (onShowToast) {
        onShowToast(msg);
      }
    } catch (err: any) {
      console.error('Error en escaneo de factura de proveedor:', err);
      setScanError(err.message || 'Error al procesar el escaneo de la factura.');
      if (onShowToast) {
        onShowToast(err.message || 'Error al escanear la factura.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Crear proveedor manual
  const handleCreateManualProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim()) return;

    const newCode = `PROV-${String(proveedores.length + 1).padStart(2, '0')}`;
    const newProvItem: ProveedorItem = {
      id: `prov-${Date.now()}`,
      code: newCode,
      name: newProvName.trim(),
      cif: newProvCif.trim().toUpperCase() || '---',
      direccionFiscal: newProvFiscalAddress.trim() || '---',
      sector: newProvSector.trim().toUpperCase() || 'SUMINISTROS GENERALES',
      phone: newProvPhone.trim() || '---',
      email: newProvEmail.trim() || '---',
      pendingOrderRef: `PED-${Date.now().toString().slice(-4)}`,
      expedienteVinculado: '---',
      lastDelivery: 'Alta manual de proveedor',
    };

    const updated = [newProvItem, ...proveedores];
    setProveedores(updated);
    saveStoredProveedores(updated);
    playGentleChime();
    if (onShowToast) {
      onShowToast(`Proveedor "${newProvItem.name}" dado de alta con éxito.`);
    }

    setIsNewProviderModalOpen(false);
    setNewProvName('');
    setNewProvCif('');
    setNewProvFiscalAddress('');
    setNewProvSector('');
    setNewProvPhone('');
    setNewProvEmail('');
  };

  // Registrar factura recibida manual para un proveedor
  const handleSaveManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetProvider && !newProvName.trim()) return;

    const targetProv = selectedTargetProvider || {
      id: `prov-${Date.now()}`,
      code: `PROV-${String(proveedores.length + 1).padStart(2, '0')}`,
      name: newProvName.trim(),
      cif: newProvCif.trim().toUpperCase() || '---',
      sector: 'SUMINISTROS',
      phone: '---',
      email: '---',
      pendingOrderRef: '',
      expedienteVinculado: '---',
      lastDelivery: ''
    };

    const base = parseFloat(manualBaseAmount) || 0;
    const rate = parseFloat(manualIvaRate) || 21;
    const iva = (base * rate) / 100;
    const total = base + iva;

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const frDocs = facturasRecibidas.filter(d => d.number.startsWith(`FR${currentYear}`));
    const nextNum = frDocs.length + 1;
    const formattedNum = String(nextNum).padStart(4, '0');
    const invNum = manualInvoiceNumber.trim().toUpperCase() || `FR${currentYear}${formattedNum}`;

    const newDoc: GestarianDocument = {
      id: crypto.randomUUID(),
      type: 'factura_recibida',
      number: invNum,
      date: new Date().toLocaleDateString('es-ES'),
      issuerId: targetProv.id,
      issuerName: targetProv.name,
      issuerCif: targetProv.cif,
      issuerAddress: '',
      issuerPhone: targetProv.phone || '',
      issuerEmail: targetProv.email || '',
      clientId: user?.id || 'client-self',
      clientName: user?.fullName || 'Nuestra Empresa',
      clientCif: user?.cif || '',
      clientAddress: user?.fiscalAddress || '',
      clientEmail: user?.email || '',
      clientPhone: user?.phone || '',
      items: [{
        id: crypto.randomUUID(),
        description: manualItemDescription.trim() || 'Materiales y recambios',
        quantity: 1,
        unitPrice: base,
        amount: base
      }],
      subtotal: base,
      applyIva: true,
      ivaRate: rate,
      ivaAmount: iva,
      applyIrpf: false,
      irpfRate: 0,
      irpfAmount: 0,
      total,
      status: 'confirmada',
      isLocked: true,
    };

    if (onAddReceivedInvoice) {
      onAddReceivedInvoice(newDoc);
    }

    // Actualizar proveedor
    const updated = proveedores.map(p => {
      if (p.id === targetProv.id) {
        return {
          ...p,
          pendingOrderRef: `FACT: ${invNum}`,
          lastDelivery: manualItemDescription.trim() || p.lastDelivery
        };
      }
      return p;
    });
    setProveedores(updated);
    saveStoredProveedores(updated);
    playGentleChime();
    if (onShowToast) {
      onShowToast(`Factura ${invNum} registrada correctamente.`);
    }

    setIsManualInvoiceModalOpen(false);
    setSelectedTargetProvider(null);
    setManualInvoiceNumber('');
    setManualBaseAmount('');
    setManualItemDescription('');
  };

  // Filtrado de proveedores
  const filtered = proveedores.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.cif.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q)
    );
  });

  // Filtrado de facturas recibidas
  const filteredFacturas = facturasRecibidas.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.number.toLowerCase().includes(q) ||
      f.issuerName.toLowerCase().includes(q) ||
      (f.issuerCif && f.issuerCif.toLowerCase().includes(q))
    );
  });

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col bg-white overflow-y-auto">
      <PageHeader
        pageId={id || 'page-proveedores'}
        title="Proveedores"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      {/* Input oculto para captura con cámara / OCR */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleScanInvoiceFile}
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col gap-6">
        
        {/* Banner de procesamiento OCR cuando está escaneando */}
        {isScanning && (
          <div className="bg-sky-50 border-2 border-sky-400 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left shadow-md animate-in fade-in duration-200">
            <RefreshCw className="w-10 h-10 text-sky-600 animate-spin shrink-0" />
            <div>
              <h3 className="text-base font-black text-sky-950 uppercase tracking-wide">
                Escaneando factura e importando datos con IA...
              </h3>
              <p className="text-xs font-semibold text-sky-800 mt-0.5">
                Extrayendo número, importes, emisor y creando automáticamente la ficha del proveedor si no existía.
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de error si falla el escaneo */}
        {scanError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">{scanError}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setScanError(null)} 
              className="text-rose-500 hover:text-rose-800 font-black cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Barra superior con buscador, selector de pestaña y botones de acción */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          
          {/* Pestañas: Fichas de Proveedores vs Facturas Recibidas */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('proveedores')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'proveedores'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>Proveedores ({proveedores.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facturas')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'facturas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Facturas Recibidas ({facturasRecibidas.length})</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'proveedores' ? "Buscar por nombre, CIF, referencia o sector..." : "Buscar por número, emisor o CIF..."}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          {/* Acciones principales: Cámara OCR, Nuevo Proveedor y Factura Manual */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BOTÓN CÁMARA PARA ESCANEAR FACTURAS CON LECTURA INTELIGENTE OCR */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Fotografiar o escanear factura con lectura OCR inteligente e importar automáticamente"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Escanear Factura OCR</span>
            </button>

            {/* BOTÓN NUEVO PROVEEDOR MANUAL */}
            <button
              type="button"
              onClick={() => setIsNewProviderModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F2942] border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
              title="Dar de alta una ficha de proveedor manualmente"
            >
              <Plus className="w-3.5 h-3.5 text-blue-700" />
              <span>Nuevo Proveedor</span>
            </button>

            {/* BOTÓN FACTURA MANUAL */}
            <button
              type="button"
              onClick={() => {
                setSelectedTargetProvider(null);
                setIsManualInvoiceModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
              title="Registrar factura recibida introduciendo los importes manualmente"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Factura Manual</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
        {activeTab === 'proveedores' ? (
          /* PESTAÑA 1: FICHAS DE PROVEEDORES */
          filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
              No se encontraron proveedores con el criterio de búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((prov) => {
                const provInvoices = facturasRecibidas.filter(
                  (f) => (f.issuerCif && prov.cif !== '---' && f.issuerCif.replace(/[\s-]/g, '').toUpperCase() === prov.cif.replace(/[\s-]/g, '').toUpperCase()) ||
                         f.issuerName.trim().toLowerCase() === prov.name.trim().toLowerCase()
                );

                return (
                  <StandardCard
                    key={prov.id}
                    status="ACTIVO"
                    statusColor="border-[3px] border-emerald-500"
                    statusTextColor="text-emerald-600"
                    vehiclePlate={prov.code}
                    subtitle={prov.sector}
                    title={prov.name}
                    refCode={`CIF: ${prov.cif}`}
                    expediente={prov.pendingOrderRef}
                    isExpandable={true}
                    actions={
                      <div className="flex flex-col gap-3">
                        <div className="text-xs text-[#64748B] bg-white p-2.5 rounded border border-gray-200 flex flex-col gap-1.5">
                          <div><strong>Último material pedido:</strong> {prov.lastDelivery}</div>
                          {prov.direccionFiscal && prov.direccionFiscal !== '---' && (
                            <div className="text-slate-700 flex items-start gap-1.5 pt-1 border-t border-gray-100">
                              <MapPin className="w-3.5 h-3.5 text-[#0F2942] shrink-0 mt-0.5" />
                              <span className="leading-snug"><strong>Dir. Fiscal:</strong> {prov.direccionFiscal}</span>
                            </div>
                          )}
                          {provInvoices.length > 0 && (
                            <div className="text-emerald-700 font-bold flex items-center justify-between pt-1 border-t border-gray-100">
                              <span>Facturas recibidas vinculadas:</span>
                              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono text-[11px]">
                                {provInvoices.length} {provInvoices.length === 1 ? 'factura' : 'facturas'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Iconos de acción desplegados con el mismo diseño exacto de la tarjeta extendida */}
                        <div className="grid grid-cols-4 gap-3 items-center justify-items-center pt-2 border-t border-gray-200">
                          {/* 1. Escanear factura directamente para este proveedor */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cameraInputRef.current?.click();
                            }}
                            className="p-2 text-sky-600 hover:text-sky-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                            title={`Escanear factura para ${prov.name}`}
                            aria-label="Escanear Factura"
                          >
                            <Camera className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </button>

                          {/* 2. WhatsApp con el proveedor */}
                          <a
                            href={`https://wa.me/34${prov.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                            title={`WhatsApp con ${prov.name} (${prov.phone})`}
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </a>

                          {/* 3. Llamar por teléfono */}
                          <a
                            href={`tel:${prov.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                            title={`Llamar a ${prov.name} (${prov.phone})`}
                            aria-label="Llamar"
                          >
                            <Phone className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </a>

                          {/* 4. Enviar Email */}
                          <a
                            href={`mailto:${prov.email}?subject=Consulta de Pedido ${prov.pendingOrderRef}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                            title={`Email a ${prov.name} (${prov.email})`}
                            aria-label="Email"
                          >
                            <Mail className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </a>
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )
        ) : (
          /* PESTAÑA 2: TARJETAS DE FACTURAS RECIBIDAS */
          filteredFacturas.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-[#CBD5E1] text-[#64748B] flex flex-col items-center justify-center gap-3">
              <UploadCloud className="w-12 h-12 text-slate-300" />
              <p className="font-bold text-sm text-[#0F2942]">No hay facturas recibidas registradas</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Pulsa en <strong>"Escanear Factura OCR"</strong> con la cámara o en el footer para importar automáticamente datos de facturas y crear fichas de proveedores.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFacturas.map((doc) => (
                <div 
                  key={doc.id} 
                  onClick={() => onViewDoc && onViewDoc(doc)}
                  className="bg-rose-500/5 border border-rose-400 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-rose-500 transition-all relative overflow-hidden group cursor-pointer w-full flex flex-col justify-between"
                  title="Pulsar para abrir la factura en el visor de documentos"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <FileText className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-xs">
                        {doc.number}
                      </span>
                      <span className="text-xs font-bold text-gray-500">{doc.date}</span>
                    </div>
                    
                    <h4 className="font-black text-[#0F172A] text-base leading-tight mb-1 truncate group-hover:text-rose-600 transition-colors">
                      {doc.issuerName}
                    </h4>
                    <p className="text-xs font-mono text-gray-500 mb-3">{doc.issuerCif || '---'}</p>
                    
                    <div className="mt-auto space-y-1 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-[11px] text-gray-600 font-semibold">
                        <span>Base Imponible:</span>
                        <span className="font-mono text-[#0F172A] font-bold">
                          {doc.subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-600 font-semibold">
                        <span>IVA ({doc.ivaRate}%):</span>
                        <span className="font-mono text-[#0F172A] font-bold">
                          {doc.ivaAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-rose-600 pt-1 mt-1 border-t border-gray-200">
                        <span className="uppercase tracking-wider">Total Factura:</span>
                        <span className="font-mono">
                          {doc.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-rose-700 transition-colors">
                      <span className="flex items-center gap-1 font-bold">
                        <Eye className="w-3.5 h-3.5" />
                        Ver factura en visor
                      </span>
                      <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        Documento oficial
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* MODAL 1: ALTA DE NUEVO PROVEEDOR MANUAL */}
      {isNewProviderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#0F2942] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-wide">Nuevo Proveedor</h3>
                  <p className="text-xs text-slate-300">Dar de alta ficha de proveedor en el sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProviderModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualProvider} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuciones del Automóvil S.L."
                  value={newProvName}
                  onChange={(e) => setNewProvName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">CIF / NIF</label>
                  <input
                    type="text"
                    placeholder="Ej: B12345678"
                    value={newProvCif}
                    onChange={(e) => setNewProvCif(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Sector / Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej: CHAPA Y PINTURA"
                    value={newProvSector}
                    onChange={(e) => setNewProvSector(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0F2942]" />
                  Dirección Fiscal / Sede Social
                </label>
                <input
                  type="text"
                  placeholder="Ej: Calle San Salvador 14, Pol. Ind. Cobo Calleja, 28947 Fuenlabrada"
                  value={newProvFiscalAddress}
                  onChange={(e) => setNewProvFiscalAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej: 912345678"
                    value={newProvPhone}
                    onChange={(e) => setNewProvPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942]"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: pedidos@proveedor.es"
                    value={newProvEmail}
                    onChange={(e) => setNewProvEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewProviderModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INCORPORAR FACTURA RECIBIDA MANUALMENTE */}
      {isManualInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#0F2942] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-wide">Registrar Factura Recibida</h3>
                  <p className="text-xs text-slate-300">Incorporar factura de proveedor al sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualInvoiceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualInvoice} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Proveedor *</label>
                <select
                  required
                  value={selectedTargetProvider?.id || ''}
                  onChange={(e) => {
                    const found = proveedores.find(p => p.id === e.target.value);
                    setSelectedTargetProvider(found || null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-bold"
                >
                  <option value="">-- Seleccionar proveedor existente --</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.cif})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Nº Factura Proveedor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: FR-2026-901"
                    value={manualInvoiceNumber}
                    onChange={(e) => setManualInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">IVA (%)</label>
                  <select
                    value={manualIvaRate}
                    onChange={(e) => setManualIvaRate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-bold"
                  >
                    <option value="21">21% General</option>
                    <option value="10">10% Reducido</option>
                    <option value="4">4% Superreducido</option>
                    <option value="0">0% Exento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Base Imponible (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={manualBaseAmount}
                  onChange={(e) => setManualBaseAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-slate-300 rounded-xl outline-none focus:border-[#0F2942] font-mono font-black"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Concepto / Material recibido</label>
                <input
                  type="text"
                  placeholder="Ej: Piezas paragolpes, pintura o consumibles"
                  value={manualItemDescription}
                  onChange={(e) => setManualItemDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-[#0F2942]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsManualInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
