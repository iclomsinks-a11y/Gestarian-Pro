import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PageHeader } from './PageHeader';
import { StandardCard } from './StandardCard';
import { 
  Search, Plus, Truck, Phone, Mail, FileText, 
  MessageCircle, Package, Camera, RefreshCw, AlertCircle,
  Eye, Check, X, Building2, UploadCloud, Receipt, Layers, MapPin, Download,
  Pencil, ArrowLeft, ExternalLink, UserPen, Save
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

const DEMO_RECEIPT_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850"><rect width="600" height="850" fill="%23f8fafc"/><rect x="40" y="40" width="520" height="770" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2" rx="8"/><text x="70" y="90" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">CECAUTO RECAMBIOS CENTRAL S.A.</text><text x="70" y="120" font-family="sans-serif" font-size="12" fill="%2364748b">CIF: A08234112 · Pol. Ind. Cobo Calleja, Fuenlabrada</text><line x1="70" y1="140" x2="530" y2="140" stroke="%23e2e8f0" stroke-width="2"/><text x="70" y="180" font-family="monospace" font-size="14" font-weight="bold" fill="%230284c7">ALBARÁN / FACTURA: PED-2026-081</text><text x="400" y="180" font-family="monospace" font-size="12" fill="%2364748b">28/10/2026</text><rect x="70" y="210" width="460" height="40" fill="%23f1f5f9" rx="4"/><text x="85" y="235" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23475569">DESCRIPCIÓN RECAMBIOS</text><text x="360" y="235" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23475569">CANT</text><text x="450" y="235" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23475569">TOTAL</text><text x="85" y="280" font-family="sans-serif" font-size="12" font-weight="bold" fill="%231e293b">Aleta delantera der. Volkswagen Golf VII</text><text x="370" y="280" font-family="monospace" font-size="12" fill="%23334155">1</text><text x="450" y="280" font-family="monospace" font-size="12" font-weight="bold" fill="%230f172a">285,50 €</text><line x1="70" y1="310" x2="530" y2="310" stroke="%23e2e8f0" stroke-width="1"/><text x="85" y="340" font-family="sans-serif" font-size="11" fill="%2364748b">Material recibido en taller conforme por jefe de chapa.</text><rect x="330" y="380" width="200" height="90" fill="%23f8fafc" stroke="%23e2e8f0" rx="4"/><text x="345" y="405" font-family="sans-serif" font-size="11" fill="%2364748b">Base Imponible: 285,50 €</text><text x="345" y="425" font-family="sans-serif" font-size="11" fill="%2364748b">IVA (21%): 59,96 €</text><text x="345" y="455" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23047857">TOTAL: 345,46 €</text><rect x="70" y="520" width="160" height="60" fill="%23ecfdf5" stroke="%236ee7b7" rx="6"/><text x="85" y="555" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23065f46">VERIFICADO OCR ✓</text></svg>`;

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

  // Historial de pedidos desplegable por tarjeta de proveedor
  const [openHistoryMap, setOpenHistoryMap] = useState<Record<string, boolean>>({});
  // Modal de previsualización de imagen guardada en OCR
  const [selectedOcrImageDoc, setSelectedOcrImageDoc] = useState<GestarianDocument | null>(null);

  // Tarjeta de proveedor expandida / seleccionada
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  // Ficha completa del proveedor (ojito)
  const [viewingProviderFicha, setViewingProviderFicha] = useState<ProveedorItem | null>(null);
  // Edición de proveedor
  const [editingProvider, setEditingProvider] = useState<ProveedorItem | null>(null);
  const [editFormData, setEditFormData] = useState<ProveedorItem | null>(null);
  const [providerFichaHasChanges, setProviderFichaHasChanges] = useState<boolean>(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gestarian_ficha_view_changed', { detail: { isOpen: Boolean(viewingProviderFicha) } }));
    if (!viewingProviderFicha) {
      setProviderFichaHasChanges(false);
    }
  }, [viewingProviderFicha]);

  const handleShowAllProveedores = () => {
    setSearch('');
    setIsSearchOpen(false);
    setExpandedProviderId(null);
    setViewingProviderFicha(null);
    setEditingProvider(null);
    (window as any).__gestarian_selected_provider = null;
    window.dispatchEvent(new CustomEvent('gestarian_provider_selected', { detail: { provider: null } }));
  };

  useEffect(() => {
    (window as any).__gestarian_handle_proveedores_back = () => {
      if (editingProvider) {
        setEditingProvider(null);
        return true;
      }
      if (viewingProviderFicha) {
        setViewingProviderFicha(null);
        return true;
      }
      if (expandedProviderId) {
        setExpandedProviderId(null);
        (window as any).__gestarian_selected_provider = null;
        window.dispatchEvent(new CustomEvent('gestarian_provider_selected', { detail: { provider: null } }));
        return true;
      }
      return false;
    };
    return () => {
      delete (window as any).__gestarian_handle_proveedores_back;
    };
  }, [editingProvider, viewingProviderFicha, expandedProviderId]);

  useEffect(() => {
    const handleProvsUpdated = () => {
      setProveedores(getStoredProveedores());
    };
    window.addEventListener('gestarian_proveedores_updated', handleProvsUpdated);
    return () => window.removeEventListener('gestarian_proveedores_updated', handleProvsUpdated);
  }, []);

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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Facturas recibidas asociadas a proveedores
  const facturasRecibidas = documents.filter((d) => d.type === 'factura_recibida');

  // Notificar al footer del cambio de pestaña activa
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gestarian_proveedores_tab_changed', { detail: { tab: activeTab } }));
  }, [activeTab]);

  // Escuchadores para eventos globales del footer (Lupa buscador, Nuevo proveedor, Cámara OCR)
  useEffect(() => {
    const handleFooterCameraTrigger = () => {
      cameraInputRef.current?.click();
    };
    const handleToggleSearch = () => {
      setIsSearchOpen((prev) => {
        const next = !prev;
        if (next) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return next;
      });
    };
    const handleNewProveedor = () => {
      setIsNewProviderModalOpen(true);
    };

    window.addEventListener('gestarian_scan_proveedor_factura', handleFooterCameraTrigger);
    window.addEventListener('gestarian_toggle_proveedores_search', handleToggleSearch);
    window.addEventListener('gestarian_new_proveedor', handleNewProveedor);

    return () => {
      window.removeEventListener('gestarian_scan_proveedor_factura', handleFooterCameraTrigger);
      window.removeEventListener('gestarian_toggle_proveedores_search', handleToggleSearch);
      window.removeEventListener('gestarian_new_proveedor', handleNewProveedor);
    };
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

  // Helper para convertir fecha o ISO a timestamp numérico
  const parseDocTimestamp = (dateStr?: string, createdAt?: string): number => {
    if (createdAt) {
      const t = new Date(createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (dateStr) {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const t = new Date(y, m, d).getTime();
          if (!isNaN(t)) return t;
        }
      }
      const t = new Date(dateStr).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  // Obtener documentos vinculados al proveedor
  const getProviderDocuments = (prov: ProveedorItem): GestarianDocument[] => {
    const cleanProvCif = prov.cif ? prov.cif.replace(/[\s-]/g, '').toUpperCase() : '';
    const provNameLower = prov.name ? prov.name.trim().toLowerCase() : '';

    const matched = documents.filter((d) => {
      if (d.issuerId && d.issuerId === prov.id) return true;
      if (cleanProvCif && cleanProvCif !== '---' && d.issuerCif) {
        const cleanDocCif = d.issuerCif.replace(/[\s-]/g, '').toUpperCase();
        if (cleanDocCif === cleanProvCif) return true;
      }
      if (d.issuerName && provNameLower && d.issuerName.trim().toLowerCase() === provNameLower) {
        return true;
      }
      return false;
    });

    return [...matched].sort((a, b) => {
      const timeA = parseDocTimestamp(a.date, a.createdAt);
      const timeB = parseDocTimestamp(b.date, b.createdAt);
      return timeB - timeA;
    });
  };

  // Documentos efectivos del proveedor (incluyendo pedido inicial si aún no se han registrado facturas)
  const getEffectiveProviderDocs = (prov: ProveedorItem): GestarianDocument[] => {
    const realDocs = getProviderDocuments(prov);
    if (realDocs.length > 0) return realDocs;

    if (prov.pendingOrderRef) {
      return [{
        id: `doc-init-${prov.id}`,
        type: 'factura_recibida',
        number: prov.pendingOrderRef,
        date: '28/10/2026',
        issuerId: prov.id,
        issuerName: prov.name,
        issuerCif: prov.cif,
        issuerAddress: prov.direccionFiscal || '',
        issuerPhone: prov.phone,
        issuerEmail: prov.email,
        clientId: user?.id || 'client-self',
        clientName: user?.fullName || 'Nuestra Empresa',
        clientCif: user?.cif || '',
        clientAddress: user?.fiscalAddress || '',
        clientEmail: user?.email || '',
        clientPhone: user?.phone || '',
        items: [
          {
            id: `item-${prov.id}`,
            description: prov.lastDelivery || 'Materiales y recambios para taller según pedido',
            quantity: 1,
            unitPrice: 285.50,
            amount: 285.50
          }
        ],
        subtotal: 285.50,
        applyIva: true,
        ivaRate: 21,
        ivaAmount: 59.96,
        applyIrpf: false,
        irpfRate: 0,
        irpfAmount: 0,
        total: 345.46,
        status: 'confirmada',
        isLocked: true,
        attachmentBase64: prov.id === 'prov-1' ? DEMO_RECEIPT_IMAGE : '',
        attachmentFilename: `Pedido_${prov.pendingOrderRef}.jpg`,
        attachmentMimeType: 'image/jpeg'
      }];
    }
    return [];
  };

  // 2. Ordenar proveedores según el último documento incorporado (los que tienen documentos más recientes van primero)
  const sortedProveedores = [...proveedores].sort((a, b) => {
    const docsA = getEffectiveProviderDocs(a);
    const docsB = getEffectiveProviderDocs(b);
    const timeA = docsA.length > 0 ? parseDocTimestamp(docsA[0].date, docsA[0].createdAt) : 0;
    const timeB = docsB.length > 0 ? parseDocTimestamp(docsB[0].date, docsB[0].createdAt) : 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return 0;
  });

  // Filtrado de proveedores ordenados
  const filtered = sortedProveedores.filter((p) => {
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

        {/* Tarjeta superior limpia: Únicamente los botones de Proveedores y Facturas Recibidas */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-3 sm:p-4 shadow-xs flex items-center justify-center">
          {/* Pestañas: Fichas de Proveedores vs Facturas Recibidas */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 flex-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab('proveedores')}
              className={`whitespace-nowrap px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'proveedores'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Proveedores ({proveedores.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facturas')}
              className={`whitespace-nowrap px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'facturas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Facturas Recibidas ({facturasRecibidas.length})</span>
            </button>
          </div>
        </div>

        {/* Buscador flotante interactivo activado desde la lupa del footer */}
        {isSearchOpen && (
          <div className="bg-white border-2 border-sky-400 rounded-2xl p-3 sm:p-3.5 shadow-md flex items-center gap-3 animate-in fade-in duration-200">
            <Search className="w-5 h-5 text-sky-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'proveedores' ? "Buscar proveedor por nombre, CIF, referencia o sector..." : "Buscar factura por número, emisor o CIF..."}
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

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
                const provDocs = getEffectiveProviderDocs(prov);
                const isHistoryOpen = Boolean(openHistoryMap[prov.id]);
                const docWithPhoto = provDocs.find((d) => Boolean(d.attachmentBase64));

                return (
                  <StandardCard
                    key={prov.id}
                    status="ACTIVO"
                    statusColor="border border-emerald-500"
                    statusTextColor="text-emerald-600"
                    hidePlate={true}
                    subtitle={prov.sector}
                    title={prov.name}
                    refCode={`CIF: ${prov.cif}`}
                    isExpandable={true}
                    expanded={expandedProviderId === prov.id}
                    onToggleExpand={(nextExpanded) => {
                      if (nextExpanded) {
                        setExpandedProviderId(prov.id);
                        (window as any).__gestarian_selected_provider = prov;
                        window.dispatchEvent(new CustomEvent('gestarian_provider_selected', { detail: { provider: prov } }));
                      } else {
                        if (expandedProviderId === prov.id) {
                          setExpandedProviderId(null);
                          (window as any).__gestarian_selected_provider = null;
                          window.dispatchEvent(new CustomEvent('gestarian_provider_selected', { detail: { provider: null } }));
                        }
                      }
                    }}
                    actions={
                      <div className="flex flex-col gap-3">
                        <div className="text-xs text-[#64748B] bg-white p-2.5 rounded-xl border border-gray-200 flex flex-col gap-1.5 shadow-2xs">
                          <div><strong>Último material pedido:</strong> {prov.lastDelivery}</div>
                          {prov.direccionFiscal && prov.direccionFiscal !== '---' && (
                            <div className="text-slate-700 flex items-start gap-1.5 pt-1 border-t border-gray-100">
                              <MapPin className="w-3.5 h-3.5 text-[#0F2942] shrink-0 mt-0.5" />
                              <span className="leading-snug"><strong>Dir. Fiscal:</strong> {prov.direccionFiscal}</span>
                            </div>
                          )}
                          {provDocs.length > 0 && (
                            <div className="text-emerald-700 font-bold flex items-center justify-between pt-1 border-t border-gray-100">
                              <span>Pedidos y facturas vinculadas:</span>
                              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono text-[11px]">
                                {provDocs.length} {provDocs.length === 1 ? 'documento' : 'documentos'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Iconos de acción desplegados reducidos a tamaño x0.8 (w-9.5 h-9.5 sm:w-11 sm:h-11) */}
                        <div className="flex items-center justify-around gap-1 sm:gap-2 pt-2 border-t border-gray-200 w-full overflow-x-auto">
                          {/* 1. Icono de Ver Ficha del Proveedor (Ojito) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingProviderFicha(prov);
                            }}
                            className="p-1 sm:p-1.5 text-sky-600 hover:text-sky-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                            title={`Ver ficha completa de ${prov.name}`}
                            aria-label="Ver Ficha Proveedor"
                          >
                            <Eye className="w-9.5 h-9.5 sm:w-11 sm:h-11" strokeWidth={1.8} />
                          </button>

                          {/* 2. Icono de Historial de Pedidos */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenHistoryMap((prev) => ({
                                ...prev,
                                [prov.id]: !prev[prov.id],
                              }));
                            }}
                            className={`p-1 sm:p-1.5 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 ${
                              isHistoryOpen ? 'text-amber-500 scale-110 drop-shadow-xs' : 'text-amber-600 hover:text-amber-700'
                            }`}
                            title={`Historial de pedidos (${provDocs.length})`}
                            aria-label="Historial de Pedidos"
                          >
                            <Package className="w-9.5 h-9.5 sm:w-11 sm:h-11" strokeWidth={1.8} />
                          </button>

                          {/* 3. WhatsApp */}
                          <a
                            href={`https://wa.me/34${prov.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 sm:p-1.5 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                            title={`WhatsApp con ${prov.name} (${prov.phone})`}
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="w-9.5 h-9.5 sm:w-11 sm:h-11" strokeWidth={1.8} />
                          </a>

                          {/* 4. Llamar por teléfono */}
                          <a
                            href={`tel:${prov.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 sm:p-1.5 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                            title={`Llamar a ${prov.name} (${prov.phone})`}
                            aria-label="Llamar"
                          >
                            <Phone className="w-9.5 h-9.5 sm:w-11 sm:h-11" strokeWidth={1.8} />
                          </a>

                          {/* 5. Enviar Email */}
                          <a
                            href={`mailto:${prov.email}?subject=Consulta de Pedido ${prov.pendingOrderRef || ''}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 sm:p-1.5 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                            title={`Email a ${prov.name} (${prov.email})`}
                            aria-label="Email"
                          >
                            <Mail className="w-9.5 h-9.5 sm:w-11 sm:h-11" strokeWidth={1.8} />
                          </a>
                        </div>

                        {/* Listado desplegable de pedidos al pulsar el icono de historial */}
                        {isHistoryOpen && (
                          <div className="mt-2 pt-2.5 border-t border-slate-200 flex flex-col gap-2 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-amber-600" />
                                <span>Listado de Pedidos ({provDocs.length})</span>
                              </span>
                              {docWithPhoto && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOcrImageDoc(docWithPhoto);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                  title="Ver foto tomada y guardada para extraer datos por OCR"
                                >
                                  <Camera className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Ver Foto OCR</span>
                                </button>
                              )}
                            </div>

                            {provDocs.length === 0 ? (
                              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                                No hay pedidos ni facturas registradas para este proveedor.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-0.5">
                                {provDocs.map((docItem) => {
                                  const hasPhoto = Boolean(docItem.attachmentBase64);

                                  return (
                                    <div
                                      key={docItem.id}
                                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-1.5"
                                    >
                                      {/* Línea 1: Número de pedido y fecha en una sola línea */}
                                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-black text-slate-900">
                                        <span className="font-mono text-slate-900 truncate">
                                          Nº Pedido: {docItem.number}
                                        </span>
                                        <span className="text-slate-500 font-mono font-bold text-xs shrink-0">
                                          {docItem.date}
                                        </span>
                                      </div>

                                      {/* Línea 2: Importe e icono del ojito para ver en el visor (y botón para ver imagen OCR) */}
                                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Importe:</span>
                                          <span className="font-mono font-black text-emerald-700 text-xs sm:text-sm">
                                            {docItem.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          {hasPhoto && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOcrImageDoc(docItem);
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                              title="Ver imagen guardada al tomar la foto para extraer los datos por OCR"
                                            >
                                              <Camera className="w-3.5 h-3.5 text-sky-600" />
                                              <span>Foto OCR</span>
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (onViewDoc) {
                                                onViewDoc(docItem);
                                              }
                                            }}
                                            className="p-1.5 bg-[#0F2942] hover:bg-blue-700 text-white rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                                            title="Ver documento en el visor con todos los datos aportados o extraídos por OCR"
                                            aria-label="Ver documento en el visor"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
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

      {/* MODAL 3: VER IMAGEN QUE SE GUARDÓ AL TOMAR LA FOTO PARA EXTRAER DATOS POR OCR */}
      {selectedOcrImageDoc && (
        <div 
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setSelectedOcrImageDoc(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="p-4 sm:p-5 bg-[#0F2942] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-300 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-black truncate text-white uppercase tracking-wide">
                    Foto Guardada para OCR · {selectedOcrImageDoc.number}
                  </h4>
                  <p className="text-xs text-slate-300 truncate font-mono">
                    {selectedOcrImageDoc.issuerName} · {selectedOcrImageDoc.date} · {selectedOcrImageDoc.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOcrImageDoc(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar visor de imagen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visualización de la imagen capturada */}
            <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-auto flex items-center justify-center min-h-[320px]">
              {selectedOcrImageDoc.attachmentBase64 ? (
                <img
                  src={
                    selectedOcrImageDoc.attachmentBase64.startsWith('data:')
                      ? selectedOcrImageDoc.attachmentBase64
                      : `data:${selectedOcrImageDoc.attachmentMimeType || 'image/jpeg'};base64,${selectedOcrImageDoc.attachmentBase64}`
                  }
                  alt={`Captura OCR de ${selectedOcrImageDoc.number}`}
                  className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-xl border border-slate-800"
                />
              ) : (
                <div className="text-slate-400 text-xs font-bold text-center p-8">
                  No se dispone de imagen adjunta para este documento.
                </div>
              )}
            </div>

            {/* Pie con acciones */}
            <div className="p-3 sm:p-4 bg-[#FAF9F6] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-bold truncate max-w-xs">
                {selectedOcrImageDoc.attachmentFilename || 'Captura_Factura_OCR.jpg'}
              </div>

              <div className="flex items-center gap-2">
                {selectedOcrImageDoc.attachmentBase64 && (
                  <a
                    href={
                      selectedOcrImageDoc.attachmentBase64.startsWith('data:')
                        ? selectedOcrImageDoc.attachmentBase64
                        : `data:${selectedOcrImageDoc.attachmentMimeType || 'image/jpeg'};base64,${selectedOcrImageDoc.attachmentBase64}`
                    }
                    download={selectedOcrImageDoc.attachmentFilename || `Factura_${selectedOcrImageDoc.number}.jpg`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Imagen</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const doc = selectedOcrImageDoc;
                    setSelectedOcrImageDoc(null);
                    if (onViewDoc) {
                      onViewDoc(doc);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Abrir Documento en Visor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FICHA COMPLETA DEL PROVEEDOR (AL PULSAR EL OJITO) */}
      {viewingProviderFicha && (() => {
        const prov = viewingProviderFicha;
        const provDocs = getEffectiveProviderDocs(prov);
        const docWithPhoto = provDocs.find((d) => Boolean(d.attachmentBase64));

        return (
          <div 
            className="fixed inset-0 z-[125] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none overflow-y-auto"
            onClick={() => setViewingProviderFicha(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border-2 border-sky-400 animate-in zoom-in-95 my-auto p-6 sm:p-10 gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera de la Ficha: Arriba únicamente el nombre del proveedor */}
              <div className="pb-6 border-b-2 border-slate-200 text-center sm:text-left shrink-0">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F2942] uppercase tracking-tight">
                  {prov.name}
                </h2>
              </div>

              {/* Contenido con scroll de la Ficha */}
              <div className="overflow-y-auto flex-1 flex flex-col gap-6 text-slate-800 pr-1">
                {/* 1. Tarjeta Identificación Fiscal y Sector */}
                <div className="bg-slate-50 p-6 sm:p-7 rounded-2xl border border-slate-200 flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
                    <span className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-500">
                      Datos Fiscales & Sector
                    </span>
                    <span className="font-mono text-base sm:text-xl font-black text-slate-800 bg-white border border-slate-300 px-3 py-1 rounded-xl shadow-2xs">
                      CIF: {prov.cif}
                    </span>
                  </div>

                  <div className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                    <Building2 className="w-6 h-6 text-sky-600 shrink-0" />
                    <span>Sector: {prov.sector || 'Recambios y suministros'}</span>
                  </div>

                  {prov.direccionFiscal && prov.direccionFiscal !== '---' && (
                    <div className="text-base sm:text-xl text-slate-700 font-medium flex items-start gap-2.5 pt-2 border-t border-slate-200">
                      <MapPin className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{prov.direccionFiscal}</span>
                    </div>
                  )}

                  {prov.lastDelivery && (
                    <div className="text-base sm:text-lg text-slate-600 pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-900">Último material pedido:</span> {prov.lastDelivery}
                    </div>
                  )}
                </div>

                {/* 2. Tarjeta Canales de Comunicación Directa */}
                <div className="bg-slate-50 p-6 sm:p-7 rounded-2xl border border-slate-200 flex flex-col gap-4">
                  <span className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-3">
                    Contacto Directo
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a
                      href={`https://wa.me/34${prov.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base sm:text-lg font-black transition-all shadow-xs"
                    >
                      <MessageCircle className="w-5 h-5 text-white shrink-0" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${prov.phone}`}
                      className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-black transition-all shadow-xs"
                    >
                      <Phone className="w-5 h-5 text-white shrink-0" />
                      <span>Llamar</span>
                    </a>
                    <a
                      href={`mailto:${prov.email}?subject=Consulta Proveedor ${prov.name}`}
                      className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base sm:text-lg font-black transition-all shadow-xs"
                    >
                      <Mail className="w-5 h-5 text-white shrink-0" />
                      <span className="truncate">Email</span>
                    </a>
                  </div>
                </div>

                {/* 3. Tarjeta Pedidos y Facturas Recibidas Vinculadas */}
                <div className="bg-slate-50 p-6 sm:p-7 rounded-2xl border border-slate-200 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                      <Package className="w-6 h-6 text-amber-600" />
                      <span className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-800">
                        Historial de Pedidos y Facturas ({provDocs.length})
                      </span>
                    </div>
                    {docWithPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedOcrImageDoc(docWithPhoto)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                        title="Ver foto tomada para extraer datos por OCR"
                      >
                        <Camera className="w-4 h-4 text-sky-600" />
                        <span>Ver Foto OCR</span>
                      </button>
                    )}
                  </div>

                  {provDocs.length === 0 ? (
                    <div className="p-4 text-center text-base text-slate-400 italic">
                      No hay pedidos ni facturas registradas para este proveedor.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-200">
                      {provDocs.map((docItem) => {
                        const hasPhoto = Boolean(docItem.attachmentBase64);

                        return (
                          <div
                            key={docItem.id}
                            className="pt-3 flex flex-col gap-2 hover:bg-white/60 p-2 rounded-xl transition-all"
                          >
                            <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-black text-slate-900">
                              <span className="font-mono text-slate-900 truncate">
                                Nº: {docItem.number}
                              </span>
                              <span className="text-slate-500 font-mono text-sm sm:text-base shrink-0">
                                {docItem.date}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 pt-1">
                              <span className="font-mono font-black text-emerald-700 text-lg sm:text-2xl">
                                {docItem.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                              </span>
                              <div className="flex items-center gap-2">
                                {hasPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOcrImageDoc(docItem)}
                                    className="p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                                    title="Ver foto tomada para OCR"
                                  >
                                    <Camera className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onViewDoc) onViewDoc(docItem);
                                  }}
                                  className="p-2 text-slate-700 hover:text-[#0F2942] hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Ver documento en visor"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer de la Ficha: Iconos flotantes limpios (Editar Proveedor, Guardar si hay cambios, X Salir) y Botón Cerrar Ficha */}
              <div className="pt-6 border-t-2 border-slate-200 flex flex-col items-center justify-center gap-6 shrink-0">
                <div className="flex items-center justify-center gap-10 sm:gap-14">
                  {/* Icono 1: Editar Proveedor */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProvider(prov);
                      setEditFormData({ ...prov });
                    }}
                    className="p-2 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-[#0F2942]"
                    title="Editar Proveedor"
                  >
                    <UserPen className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.2} />
                  </button>

                  {/* Icono 2: Guardar (Solo si hay cambios) */}
                  {providerFichaHasChanges && (
                    <button
                      type="button"
                      onClick={() => {
                        setProviderFichaHasChanges(false);
                      }}
                      className="p-2 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-emerald-600 animate-in zoom-in-90 duration-200"
                      title="Guardar Cambios"
                    >
                      <Save className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.2} />
                    </button>
                  )}

                  {/* Icono 3: Salir X */}
                  <button
                    type="button"
                    onClick={() => setViewingProviderFicha(null)}
                    className="p-2 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-slate-700 hover:text-rose-600"
                    title="Cerrar Ficha / Salir"
                  >
                    <X className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.2} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingProviderFicha(null)}
                  className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-base sm:text-lg font-black uppercase transition-colors cursor-pointer"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 5: EDITAR PROVEEDOR */}
      {editingProvider && editFormData && (
        <div 
          className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none overflow-y-auto"
          onClick={() => setEditingProvider(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300 animate-in zoom-in-95 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="p-4 sm:p-5 bg-[#0F2942] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Editar Proveedor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProvider(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editFormData.name.trim()) return;

                const updatedProvs = proveedores.map((p) => (p.id === editFormData.id ? editFormData : p));
                setProveedores(updatedProvs);
                saveStoredProveedores(updatedProvs);
                if (viewingProviderFicha && viewingProviderFicha.id === editFormData.id) {
                  setViewingProviderFicha(editFormData);
                }
                setEditingProvider(null);
                window.dispatchEvent(new CustomEvent('gestarian_proveedores_updated'));
                if (onShowToast) {
                  onShowToast(`Proveedor ${editFormData.name} actualizado`);
                }
              }}
              className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 text-slate-800"
            >
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                    CIF / NIF
                  </label>
                  <input
                    type="text"
                    value={editFormData.cif}
                    onChange={(e) => setEditFormData({ ...editFormData, cif: e.target.value.toUpperCase() })}
                    className="w-full text-xs sm:text-sm font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                    Sector / Especialidad
                  </label>
                  <input
                    type="text"
                    value={editFormData.sector}
                    onChange={(e) => setEditFormData({ ...editFormData, sector: e.target.value.toUpperCase() })}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                    Teléfono (Llamadas / WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                    Correo Electrónico (Email)
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  value={editFormData.direccionFiscal || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, direccionFiscal: e.target.value })}
                  placeholder="Calle, número, polígono, ciudad, provincia..."
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                  Último Material Pedido / Observaciones
                </label>
                <input
                  type="text"
                  value={editFormData.lastDelivery || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, lastDelivery: e.target.value })}
                  className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
