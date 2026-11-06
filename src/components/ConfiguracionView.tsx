import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { auth, googleSignIn, getAccessToken } from '../firebase';
import { 
  Mail, Briefcase, Inbox, WifiOff, Sparkles, Palette, 
  Upload, Image as ImageIcon, Save, CheckCircle2,
  Car, Home, Sliders, Percent, FileSignature, ShieldCheck, Building2, ExternalLink,
  Lock, Check, ArrowRight, Zap, Users, TrendingUp, Layers, Package, Camera, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppUser, GestarianDocument, GestarianPlan, getDefaultIvaRate } from '../types';
import { ReplaceImageModal, ReplaceTargetInfo } from './ReplaceImageModal';
import { scanGmailForInvoices } from '../services/gmailScannerService';
import { isVehicleMaintenanceEligible, isLocationFeatureEligible } from '../services/preventiveMaintenanceService';

interface ConfiguracionViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  currentUser?: AppUser;
  currentPlan?: GestarianPlan;
  onUpdateUser?: (updatedFields: Partial<AppUser>) => void;
  onOpenCustomizer?: () => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  onOpenCompanyConfig: () => void;
  onOpenEnterpriseAeat?: () => void;
  onLogout?: () => void;
  onScanComplete?: (invoices: GestarianDocument[]) => void;
  onShowToast?: (msg: string) => void;
}

export interface FeatureCatalogItem {
  id: string;
  name: string;
  category: 'Facturación' | 'Compras y Proveedores' | 'Taller y Vehículos' | 'Clientes y Portal' | 'Equipo y Fiscalidad';
  minPlan: 'lite' | 'quick' | 'pro' | 'enterprise';
  minPlanName: string;
  description: string;
  icon: any;
  quickNote?: string;
}

export const GESTARIAN_FEATURES_CATALOG: FeatureCatalogItem[] = [
  {
    id: 'feat-facturas',
    name: 'Emisión de Facturas Oficiales A4',
    category: 'Facturación',
    minPlan: 'lite',
    minPlanName: 'Lite',
    description: 'Generación legal de facturas con cálculo automático de bases, tipos de IVA, retención de IRPF y descarga en formato oficial imprimible.',
    icon: FileText,
  },
  {
    id: 'feat-clientes',
    name: 'Fichero Maestro de Clientes',
    category: 'Clientes y Portal',
    minPlan: 'lite',
    minPlanName: 'Lite',
    description: 'Directorio unificado de clientes con NIF/CIF, teléfonos, emails, direcciones fiscales e histórico de documentos emitidos.',
    icon: Users,
  },
  {
    id: 'feat-ocr',
    name: 'Escáner Inteligente OCR de Facturas de Proveedores',
    category: 'Compras y Proveedores',
    minPlan: 'quick',
    minPlanName: 'Quick',
    description: 'Extracción instantánea por IA de CIF, emisor, importes y partidas de recambios al tomar una fotografía o cargar un documento.',
    icon: Camera,
  },
  {
    id: 'feat-proveedores',
    name: 'Fichas de Proveedores, Historial y Foto OCR',
    category: 'Compras y Proveedores',
    minPlan: 'quick',
    minPlanName: 'Quick',
    description: 'Fichas automáticas de suministradores, listado de pedidos en una sola línea con importe y botón para ver la fotografía original escaneada.',
    icon: Package,
  },
  {
    id: 'feat-verifactu',
    name: 'Cumplimiento Normativo Veri*Factu (RD 1007/2023)',
    category: 'Facturación',
    minPlan: 'quick',
    minPlanName: 'Quick',
    description: 'Encadenamiento inalterable mediante huella criptográfica SHA-256 y preparación para facturación electrónica conforme a la Ley Antifraude.',
    icon: ShieldCheck,
  },
  {
    id: 'feat-location',
    name: 'Geolocalización de Tareas en Destino',
    category: 'Clientes y Portal',
    minPlan: 'quick',
    minPlanName: 'Quick',
    description: 'Registro de la ubicación física o lugar exacto donde se realiza la intervención para su inclusión en la cabecera del documento.',
    icon: Home,
  },
  {
    id: 'feat-whatsapp',
    name: 'Enlace Directo con WhatsApp de Clientes',
    category: 'Clientes y Portal',
    minPlan: 'quick',
    minPlanName: 'Quick',
    description: 'Envío automático de mensajes y enlaces oficiales al WhatsApp del cliente con un solo toque desde la tarjeta o visor.',
    icon: Mail,
  },
  {
    id: 'feat-presupuestos',
    name: 'Presupuestos Valorados y Cálculo de Margen',
    category: 'Facturación',
    minPlan: 'pro',
    minPlanName: 'Pro',
    description: 'Elaboración de presupuestos con cálculo de rentabilidad y conversión instantánea a factura oficial sin duplicidad de datos.',
    icon: Sliders,
  },
  {
    id: 'feat-firma',
    name: 'Firma Digital Interactiva del Cliente',
    category: 'Facturación',
    minPlan: 'pro',
    minPlanName: 'Pro (Suscripción)',
    description: 'Conformidad táctil o con cursor directamente en el visor de documentos, sellada legalmente con fecha y hora electrónica.',
    icon: FileSignature,
  },
  {
    id: 'feat-itv',
    name: 'Avisos Automáticos de ITV y Citas Pre-ITV',
    category: 'Taller y Vehículos',
    minPlan: 'pro',
    minPlanName: 'Pro',
    description: 'Detección proactiva de vencimientos reglamentarios y generación automática con un clic de presupuesto y cita previa vinculada.',
    icon: Car,
    quickNote: 'Disponible en Quick como opción extra (+60 €/año)',
  },
  {
    id: 'feat-portal',
    name: 'Portal Web Interactivo para Clientes',
    category: 'Clientes y Portal',
    minPlan: 'pro',
    minPlanName: 'Pro',
    description: 'Acceso online exclusivo donde el cliente consulta presupuestos, firma documentos y solicita citas desde cualquier dispositivo.',
    icon: ExternalLink,
  },
  {
    id: 'feat-gmail',
    name: 'Rastreo Inteligente de Facturas en Gmail',
    category: 'Compras y Proveedores',
    minPlan: 'pro',
    minPlanName: 'Pro',
    description: 'Sincronización con tu cuenta de correo para detectar facturas de proveedores adjuntas y cargarlas automáticamente en el sistema.',
    icon: Inbox,
  },
  {
    id: 'feat-metis',
    name: 'Asesor Técnico Metis para Automoción',
    category: 'Taller y Vehículos',
    minPlan: 'pro',
    minPlanName: 'Pro',
    description: 'Asesoramiento especializado en tiempos de secado de cabina, proporciones de mezcla OEM y técnicas de preparación de carrocería.',
    icon: Sparkles,
  },
  {
    id: 'feat-empleados',
    name: 'Control de Equipo y Permisos Granulares (RBAC)',
    category: 'Equipo y Fiscalidad',
    minPlan: 'enterprise',
    minPlanName: 'Enterprise',
    description: 'Gestión de operarios con asignación de órdenes de trabajo, control horario y bloqueo selectivo de precios y datos fiscales.',
    icon: Users,
  },
  {
    id: 'feat-aeat',
    name: 'Sede Electrónica AEAT en Tiempo Real',
    category: 'Equipo y Fiscalidad',
    minPlan: 'enterprise',
    minPlanName: 'Enterprise',
    description: 'Conexión telemática mediante certificado digital para la remisión directa de registros de facturación a la Agencia Tributaria.',
    icon: Building2,
  },
  {
    id: 'feat-sla',
    name: 'SLA Corporativo y Soporte Dedicado 24/7',
    category: 'Equipo y Fiscalidad',
    minPlan: 'enterprise',
    minPlanName: 'Enterprise',
    description: 'Canal prioritario continuo, copias de seguridad de alta frecuencia y asistencia técnica personalizada para flotas y grandes empresas.',
    icon: Zap,
  },
];

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  id,
  logoUrl,
  userFullName,
  currentUser,
  currentPlan,
  onUpdateUser,
  onOpenCustomizer,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenCompanyConfig,
  onOpenEnterpriseAeat,
  onLogout,
  onScanComplete,
  onShowToast,
}) => {
  const [rastreoActivo, setRastreoActivo] = useState(true);
  const [offlineActivo, setOfflineActivo] = useState(true);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTargetInfo | null>(null);
  const [isScanningGmail, setIsScanningGmail] = useState(false);

  // Campos de datos del usuario y fiscales (para Quick, Lite y general)
  const [userName, setUserName] = useState(currentUser?.fullName || '');
  const [userCif, setUserCif] = useState(currentUser?.cif || '');
  const [userFiscalAddress, setUserFiscalAddress] = useState(currentUser?.fiscalAddress || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userSector, setUserSector] = useState(currentUser?.sector || '');
  const [userBranch, setUserBranch] = useState(currentUser?.branch || '');
  const [userSpecialty, setUserSpecialty] = useState(currentUser?.specialty || '');
  const [isSavedFiscal, setIsSavedFiscal] = useState(false);

  // Estados de configuración de módulos: Vehículo, Localización, IVA y Firma Digital
  const isLite = currentPlan === 'lite' || currentUser?.currentTier === 'lite';
  const isQuick = currentPlan === 'quick' || currentUser?.currentTier === 'quick';
  const isPlanAllowedForSignature =
    currentPlan === 'pro' ||
    currentPlan === 'enterprise' ||
    currentUser?.currentTier === 'pro' ||
    currentUser?.currentTier === 'enterprise';

  const [enableVehicle, setEnableVehicle] = useState<boolean>(currentUser?.enableVehicle !== false);
  const [enableLocation, setEnableLocation] = useState<boolean>(currentUser?.enableLocation === true);
  const [enableDigitalSignature, setEnableDigitalSignature] = useState<boolean>(
    Boolean(isPlanAllowedForSignature && currentUser?.enableDigitalSignature)
  );
  const [enableVehicleMaintenanceAlerts, setEnableVehicleMaintenanceAlerts] = useState<boolean>(() => {
    if (isLite) return false;
    if (isQuick) {
      return Boolean(currentUser?.enableVehicleMaintenanceAlerts || currentUser?.quickExtras?.vehicleMaintenanceAlertsEnabled);
    }
    return currentUser?.enableVehicleMaintenanceAlerts !== false;
  });
  const [defaultIvaRate, setDefaultIvaRate] = useState<number>(() => {
    return getDefaultIvaRate(currentUser);
  });

  // Filtros interactivos del catálogo de funcionalidades
  const [featureFilter, setFeatureFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [featureCategory, setFeatureCategory] = useState<string>('all');

  const userEffectiveTier: 'lite' | 'quick' | 'pro' | 'enterprise' = (
    currentUser?.currentTier || currentPlan || (isQuick ? 'quick' : isLite ? 'lite' : 'pro')
  ) as any;

  const PLAN_RANK: Record<string, number> = {
    lite: 1,
    quick: 2,
    pro: 3,
    enterprise: 4,
  };

  const userRank = PLAN_RANK[userEffectiveTier] || 2;

  const activeFeaturesCount = GESTARIAN_FEATURES_CATALOG.filter(
    (f) => userRank >= PLAN_RANK[f.minPlan]
  ).length;

  const lockedFeaturesCount = GESTARIAN_FEATURES_CATALOG.filter(
    (f) => userRank < PLAN_RANK[f.minPlan]
  ).length;

  const displayedFeatures = GESTARIAN_FEATURES_CATALOG.filter((f) => {
    const isAct = userRank >= PLAN_RANK[f.minPlan];
    if (featureFilter === 'active' && !isAct) return false;
    if (featureFilter === 'locked' && isAct) return false;
    if (featureCategory !== 'all' && f.category !== featureCategory) return false;
    return true;
  });

  React.useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.fullName || '');
      setUserCif(currentUser.cif || '');
      setUserFiscalAddress(currentUser.fiscalAddress || '');
      setUserPhone(currentUser.phone || '');
      setUserEmail(currentUser.email || '');
      setUserSector(currentUser.sector || '');
      setUserBranch(currentUser.branch || '');
      setUserSpecialty(currentUser.specialty || '');
      setEnableVehicle(currentUser.enableVehicle !== false);
      setEnableLocation(currentUser.enableLocation === true);
      setEnableDigitalSignature(Boolean(isPlanAllowedForSignature && currentUser.enableDigitalSignature));
      if (!isLite) {
        if (isQuick) {
          setEnableVehicleMaintenanceAlerts(Boolean(currentUser.enableVehicleMaintenanceAlerts || currentUser.quickExtras?.vehicleMaintenanceAlertsEnabled));
        } else {
          setEnableVehicleMaintenanceAlerts(currentUser.enableVehicleMaintenanceAlerts !== false);
        }
      } else {
        setEnableVehicleMaintenanceAlerts(false);
      }
      if (currentUser.defaultIvaRate !== undefined) {
        setDefaultIvaRate(currentUser.defaultIvaRate);
      }
    }
  }, [currentUser, isLite, isQuick, isPlanAllowedForSignature]);

  const handleToggleDigitalSignature = () => {
    if (!isPlanAllowedForSignature) {
      if (onShowToast) {
        onShowToast('La firma digital interactiva está reservada para Pro (mediante suscripción) y Enterprise por defecto.');
      }
      return;
    }
    const nextVal = !enableDigitalSignature;
    setEnableDigitalSignature(nextVal);
    onUpdateUser?.({ enableDigitalSignature: nextVal });
    if (onShowToast) {
      onShowToast(`Firma digital interactiva ${nextVal ? 'activada' : 'desactivada'}`);
    }
  };

  const handleSaveIvaRate = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gestarian_default_iva_rate', String(defaultIvaRate));
    }
    onUpdateUser?.({ defaultIvaRate });
    if (onShowToast) {
      onShowToast(`Tasa de IVA por defecto actualizada a ${defaultIvaRate}%`);
    }
  };

  const handleToggleVehicle = () => {
    const nextVal = !enableVehicle;
    setEnableVehicle(nextVal);
    onUpdateUser?.({ enableVehicle: nextVal });
    if (onShowToast) {
      onShowToast(`Apartado de Vehículo ${nextVal ? 'activado' : 'desactivado'}`);
    }
  };

  const handleToggleLocation = () => {
    const nextVal = !enableLocation;
    setEnableLocation(nextVal);
    onUpdateUser?.({ enableLocation: nextVal });
    if (onShowToast) {
      onShowToast(`Apartado de Localización ${nextVal ? 'activado' : 'desactivado'}`);
    }
  };

  const handleToggleVehicleMaintenanceAlerts = () => {
    if (isLite) {
      if (onShowToast) onShowToast('Los avisos de mantenimiento de vehículos no están disponibles en la versión Lite.');
      return;
    }
    const nextVal = !enableVehicleMaintenanceAlerts;
    setEnableVehicleMaintenanceAlerts(nextVal);
    onUpdateUser?.({
      enableVehicleMaintenanceAlerts: nextVal,
      ...(isQuick ? {
        quickExtras: {
          ...currentUser?.quickExtras,
          vehicleMaintenanceAlertsEnabled: nextVal,
        }
      } : {})
    });
    if (onShowToast) {
      onShowToast(`Avisos de mantenimiento de vehículos ${nextVal ? 'activados' : 'desactivados'}`);
    }
  };

  const handleSaveFiscalData = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userName.trim()) return;
    onUpdateUser?.({
      fullName: userName.trim().toUpperCase(),
      cif: userCif.trim().toUpperCase(),
      fiscalAddress: userFiscalAddress.trim(),
      phone: userPhone.trim(),
      email: userEmail.trim().toLowerCase(),
      sector: userSector.trim(),
      branch: userBranch.trim(),
      specialty: userSpecialty.trim(),
    });
    setIsSavedFiscal(true);
    if (onShowToast) {
      onShowToast('Datos de usuario y fiscales actualizados correctamente');
    }
    setTimeout(() => setIsSavedFiscal(false), 3000);
  };

  const currentLogo = currentUser?.logoUrl || logoUrl || '';
  const currentPortrait = currentUser?.bgPortraitUrl || '';
  const currentLandscape = currentUser?.bgLandscapeUrl || '';
  const currentBento = currentUser?.bgBentoMenuUrl || '';
  const metisAdviceActive = currentUser?.metisTechnicalAdviceEnabled ?? true;
  const systemWallpaperActive = currentUser?.enableSystemWallpaper ?? false;

  const handleToggleSystemWallpaper = () => {
    onUpdateUser?.({ enableSystemWallpaper: !systemWallpaperActive });
  };

  const handleDirectFileUpload = (slot: 'portrait' | 'landscape' | 'bento' | 'logo', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (slot === 'logo') onUpdateUser?.({ logoUrl: result });
        else if (slot === 'portrait') onUpdateUser?.({ bgPortraitUrl: result, enableSystemWallpaper: true });
        else if (slot === 'landscape') onUpdateUser?.({ bgLandscapeUrl: result, enableSystemWallpaper: true });
        else if (slot === 'bento') onUpdateUser?.({ bgBentoMenuUrl: result, enableSystemWallpaper: true });
        if (onShowToast) onShowToast('Imagen personalizada actualizada correctamente');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageReplaced = (slot: ReplaceTargetInfo['slot'], newUrl: string) => {
    if (slot === 'logo') {
      onUpdateUser?.({ logoUrl: newUrl });
    } else if (slot === 'portrait' || slot === 'custom_main') {
      onUpdateUser?.({ bgPortraitUrl: newUrl, enableSystemWallpaper: true });
    } else if (slot === 'landscape') {
      onUpdateUser?.({ bgLandscapeUrl: newUrl, enableSystemWallpaper: true });
    } else if (slot === 'bento') {
      onUpdateUser?.({ bgBentoMenuUrl: newUrl, enableSystemWallpaper: true });
    }
    setReplaceTarget(null);
  };

  const handleToggleMetis = () => {
    onUpdateUser?.({ metisTechnicalAdviceEnabled: !metisAdviceActive });
  };

  const handleGoogleSync = async () => {
    try {
      setIsScanningGmail(true);
      let token = getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        token = result?.accessToken || null;
      }

      if (token) {
        setRastreoActivo(true);
        const invoices = await scanGmailForInvoices(token);
        setIsScanningGmail(false);
        if (invoices && invoices.length > 0) {
          onScanComplete?.(invoices);
          alert(`¡Google conectado con éxito! Se han detectado ${invoices.length} facturas nuevas.`);
        } else {
          alert('¡Google conectado correctamente! No se encontraron facturas nuevas en tu Gmail por ahora.');
        }
        if (onNavigateHome) onNavigateHome();
      } else {
        setIsScanningGmail(false);
      }
    } catch (err: any) {
      console.error("Error al conectar con Google:", err);
      setIsScanningGmail(false);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(`No se pudo conectar con Google: ${err.message || 'Error de autorización'}`);
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col bg-[#0F172A] overflow-y-auto">
      <PageHeader
        pageId={id || 'page-configuracion'}
        title="Configuración"
        onOpenMenu={isLite ? undefined : onOpenMenu}
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        hideScrollIndicator={isLite}
        hideMenu={isLite}
        currentPlan={currentPlan || currentUser?.currentTier}
      />

      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col h-full gap-8 relative pb-20">

        {/* Tarjeta 1: Datos del Usuario y Fiscales (Nombre, CIF/NIF, Dirección fiscal, Teléfono, Email) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-sky-400/30 shadow-2xl flex flex-col gap-6 relative"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Datos Fiscales y de la Empresa
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-1">
                Datos fiscales del emisor para presupuestos y facturas
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveFiscalData} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-base sm:text-lg outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  DNI/CIF *
                </label>
                <input
                  type="text"
                  value={userCif}
                  onChange={(e) => setUserCif(e.target.value.toUpperCase())}
                  placeholder="DNI / CIF"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-mono font-bold text-base sm:text-lg outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Número de teléfono"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-base sm:text-lg outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-base sm:text-lg outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Dirección fiscal completa *
              </label>
              <textarea
                rows={2}
                value={userFiscalAddress}
                onChange={(e) => setUserFiscalAddress(e.target.value)}
                placeholder="Dirección fiscal completa, código postal, localidad y provincia"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-medium text-base outline-none resize-none transition-colors"
                required
              />
            </div>

            {/* Actividad Empresarial: Sector, Rama y Especialidad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Sector
                </label>
                <input
                  type="text"
                  value={userSector}
                  onChange={(e) => setUserSector(e.target.value)}
                  placeholder="Ej: Automoción"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-sm sm:text-base outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Rama
                </label>
                <input
                  type="text"
                  value={userBranch}
                  onChange={(e) => setUserBranch(e.target.value)}
                  placeholder="Ej: Reparación / Alquiler"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-sm sm:text-base outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={userSpecialty}
                  onChange={(e) => setUserSpecialty(e.target.value)}
                  placeholder="Ej: Mantenimiento, Taller"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-sm sm:text-base outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
              <button
                type="submit"
                className={`px-8 py-3.5 rounded-xl font-black text-base sm:text-lg uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  isSavedFiscal
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950 active:scale-95 shadow-sky-500/30'
                }`}
              >
                {isSavedFiscal ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Datos Guardados</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Guardar Datos</span>
                  </>
                )}
              </button>

              {currentUser?.currentTier !== 'lite' && currentUser?.currentTier !== 'quick' && (
                <button
                  type="button"
                  onClick={onOpenCompanyConfig}
                  className="text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Abrir Configuración General Completa
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Tarjeta de Módulos Operativos: Vehículo y Localización (En TODAS las versiones) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-sky-400/30 shadow-2xl flex flex-col gap-6 relative"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Módulos Operativos y Firma Digital
              </h3>
              <p className="text-base sm:text-lg text-slate-300 mt-1">
                Activa o desactiva la gestión de vehículos, localización de tareas y la firma digital interactiva de documentos
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Apartado 1: Vehículo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-sky-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    Apartado de Vehículo
                  </span>
                  <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Habilita datos de vehículo (matrícula, marca y modelo) en la creación de facturas/presupuestos y el icono de vehículo en el desplegable de clientes.
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleToggleVehicle}
                className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer self-end sm:self-center ${enableVehicle ? "bg-sky-500" : "bg-slate-700"}`}
                title={enableVehicle ? 'Desactivar apartado de vehículo' : 'Activar apartado de vehículo'}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enableVehicle ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Apartado 1.5: Avisos de Mantenimiento de Vehículos e ITV (Solo si el sector es automoción y especialidad mecánica/reparación/mantenimiento) */}
            {isVehicleMaintenanceEligible(currentUser) && (
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border ${enableVehicleMaintenanceAlerts ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-amber-500/30'} transition-all`}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        Avisos de Mantenimiento de Vehículos e ITV
                      </span>
                      {isLite ? (
                        <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-slate-700 text-slate-300">
                          No disponible en Lite
                        </span>
                      ) : isQuick ? (
                        <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          +60 €/año (Opción Extra Quick)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          Incluido en tu Plan
                        </span>
                      )}
                    </div>
                    <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Supervisa automáticamente las fechas de caducidad de ITV y mantenimientos periódicos de los vehículos de los clientes con 60 días de margen, permitiendo emitir presupuestos y agendar citas preventivas.
                    </span>
                  </div>
                </div>

                {!isLite ? (
                  <button 
                    type="button"
                    onClick={handleToggleVehicleMaintenanceAlerts}
                    className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer self-end sm:self-center ${enableVehicleMaintenanceAlerts ? "bg-amber-500" : "bg-slate-700"}`}
                    title={enableVehicleMaintenanceAlerts ? 'Desactivar avisos de mantenimiento de vehículos' : 'Activar avisos de mantenimiento de vehículos'}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enableVehicleMaintenanceAlerts ? "translate-x-7" : "translate-x-0"}`} />
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 font-bold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 shrink-0 self-end sm:self-center">
                    Disponible en Quick, Pro y Enterprise
                  </div>
                )}
              </div>
            )}

            {/* Apartado 2: Localización (Solo si la empresa es de servicios/obras en inmueble del cliente) */}
            {isLocationFeatureEligible(currentUser) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-emerald-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Home className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      Apartado de Localización
                    </span>
                    <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Habilita la casilla e input de localización (lugar donde se realiza la tarea u obra) en facturas y muestra el icono de casita en el desplegable de clientes.
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleToggleLocation}
                  className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer self-end sm:self-center ${enableLocation ? "bg-emerald-500" : "bg-slate-700"}`}
                  title={enableLocation ? 'Desactivar apartado de localización' : 'Activar apartado de localización'}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enableLocation ? "translate-x-7" : "translate-x-0"}`} />
                </button>
              </div>
            )}


            {/* Apartado 3: Configuración de IVA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-teal-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Percent className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    Tasa de IVA por Defecto (%)
                  </span>
                  <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Especifica el porcentaje de IVA por defecto (ej. 21%). En <strong>facturas</strong> este IVA se aplicará siempre obligatoriamente, mientras que en <strong>presupuestos</strong> se podrá activar o desactivar libremente.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultIvaRate}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setDefaultIvaRate(val);
                    }}
                    className="w-24 px-3 py-2 bg-[#1E293B] border border-teal-400/50 rounded-xl text-white font-mono font-bold text-center text-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
                  />
                  <span className="ml-2 text-white font-bold text-lg">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveIvaRate}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors cursor-pointer text-base shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>

            {/* Apartado 4: Firma Digital Interactiva (Solo para Pro mediante suscripción y Enterprise por defecto) */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border ${enableDigitalSignature ? 'border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-indigo-500/30'} transition-all`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      Firma Digital Interactiva
                    </span>
                    <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                      Pro (Suscripción) • Enterprise
                    </span>
                  </div>
                  <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Permite a los clientes firmar presupuestos directamente desde la pantalla táctil o con el cursor del ratón en el visor oficial de documentos, registrando su conformidad con fecha y hora. Esta herramienta está reservada para Pro (mediante suscripción) y Enterprise por defecto (la versión Quick solo realiza facturas, no presupuestos).
                  </span>
                </div>
              </div>

              {isPlanAllowedForSignature ? (
                <button 
                  type="button"
                  onClick={handleToggleDigitalSignature}
                  className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer self-end sm:self-center ${enableDigitalSignature ? "bg-indigo-500" : "bg-slate-700"}`}
                  title={enableDigitalSignature ? 'Desactivar firma digital interactiva' : 'Activar firma digital interactiva'}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enableDigitalSignature ? "translate-x-7" : "translate-x-0"}`} />
                </button>
              ) : (
                <div className="text-sm text-amber-400 font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0 self-end sm:self-center">
                  Solo Pro y Enterprise
                </div>
              )}
            </div>

            {/* Apartado 5: Información Veri*Factu (Quick) o Sede Electrónica AEAT (Pro / Enterprise) */}
            {isQuick ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-emerald-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        Información Veri*Factu
                      </span>
                      <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        Cumplimiento Legal RD 1007/2023
                      </span>
                    </div>
                    <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                      El sistema emite facturas con encadenamiento inalterable mediante huella criptográfica SHA-256 y código QR oficial Veri*Factu según la Ley Antifraude y el RD 1007/2023. No requiere conexión telemática externa en la versión Quick.
                    </span>
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-wider shrink-0 self-end sm:self-center flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Activo y Conforme</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-blue-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        Sede Electrónica AEAT (Veri*Factu)
                      </span>
                      <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/40">
                        Enterprise / Conexión Oficial
                      </span>
                    </div>
                    <span className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Canal seguro con certificado digital para la remisión telemática de registros de facturación, códigos QR Veri*Factu y Red B2B interempresas.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenEnterpriseAeat}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0 self-end sm:self-center"
                >
                  <span>Abrir Sede AEAT</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tarjeta de Ecosistema de Versiones y Catálogo de Funcionalidades (Para todas las versiones) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          variants={cardVariants}
          className="p-6 sm:p-8 rounded-2xl bg-[#090D16] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-6 relative"
        >
          {/* Cabecera del Bloque */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 via-sky-500/20 to-amber-500/20 border border-white/20 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                <Layers className="w-6 h-6 text-sky-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    Ecosistema y Herramientas Gestarian
                  </h3>
                  <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md border ${
                    userEffectiveTier === 'enterprise'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : userEffectiveTier === 'pro'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : userEffectiveTier === 'quick'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                      : 'bg-slate-500/20 text-slate-300 border-slate-400/40'
                  }`}>
                    Tu Versión Activa: {userEffectiveTier.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Catálogo de herramientas operativas clasificadas por versión. Revisa las funciones activas en tu plan actual y las herramientas avanzadas disponibles para cuando tu volumen de negocio requiera dar el salto a un plan superior.
                </p>
              </div>
            </div>

            {/* Botón de acción para subir de plan */}
            {userEffectiveTier !== 'enterprise' && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateHome) onNavigateHome();
                  if (onShowToast) onShowToast('Selecciona tu plan deseado en las tarjetas de Inicio para tramitar la ampliación.');
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.35)] flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start md:self-center"
              >
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span>Mejorar Mi Versión</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Banner Estratégico de Escalado según Plan Actual */}
          {userEffectiveTier !== 'enterprise' ? (
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-sky-950/70 via-indigo-950/60 to-purple-950/70 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                    {userEffectiveTier === 'lite'
                      ? '¿Tu negocio necesita escaneo OCR y facturación ágil?'
                      : userEffectiveTier === 'quick'
                      ? '¿Tu negocio necesita presupuestos valorados y firma digital?'
                      : '¿Tu empresa cuenta con empleados y requiere conexión AEAT?'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {userEffectiveTier === 'lite'
                      ? 'Avanza a Quick o Pro para desbloquear el escaneo inteligente de compras, geolocalización de tareas, presupuestos y firma digital del cliente.'
                      : userEffectiveTier === 'quick'
                      ? 'La versión Quick está optimizada para emisión de facturas directas. Al avanzar a Gestarian Pro desbloquearás presupuestos valorados, firma táctil del cliente en pantalla, portal web interactivo y avisos de ITV.'
                      : 'Evoluciona a Gestarian Enterprise para gestionar operarios y empleados con control horario y permisos selectivos (RBAC), conexión directa con la Sede Electrónica AEAT y soporte corporativo 24/7.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateHome) onNavigateHome();
                  if (onShowToast) onShowToast('Selecciona tu plan superior en las tarjetas de Inicio.');
                }}
                className="whitespace-nowrap px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 self-end sm:self-center"
              >
                Ver Ventajas {userEffectiveTier === 'lite' ? 'Quick / Pro' : userEffectiveTier === 'quick' ? 'Pro' : 'Enterprise'}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs sm:text-sm font-bold">
                Cuentas con la versión <strong>Enterprise</strong>. Tienes activadas el 100% de las herramientas del catálogo sin restricciones operativas.
              </div>
            </div>
          )}

          {/* Filtros de visualización */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFeatureFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  featureFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                Todas ({GESTARIAN_FEATURES_CATALOG.length})
              </button>
              <button
                type="button"
                onClick={() => setFeatureFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  featureFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Activas en tu Plan ({activeFeaturesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFeatureFilter('locked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  featureFilter === 'locked'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloqueadas / Requiere Upgrade ({lockedFeaturesCount})</span>
              </button>
            </div>

            {/* Filtro por categoría */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {['all', 'Facturación', 'Compras y Proveedores', 'Taller y Vehículos', 'Clientes y Portal', 'Equipo y Fiscalidad'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFeatureCategory(cat)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    featureCategory === cat
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Categorías: Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Funcionalidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {displayedFeatures.map((feat) => {
              const IconComp = feat.icon;
              const isFeatureActive = userRank >= PLAN_RANK[feat.minPlan];

              return (
                <div
                  key={feat.id}
                  onClick={() => {
                    if (!isFeatureActive) {
                      if (onShowToast) {
                        onShowToast(`La funcionalidad "${feat.name}" está disponible a partir de la versión ${feat.minPlanName}. Pulsa en "Mejorar Mi Versión" para acceder.`);
                      }
                    }
                  }}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isFeatureActive
                      ? 'bg-[#0F172A]/80 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'bg-slate-950/60 border-amber-500/20 hover:border-amber-500/50 opacity-90 cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isFeatureActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {feat.category}
                        </span>
                      </div>

                      {/* Badge de estado en la versión del usuario */}
                      {isFeatureActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Activa</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>{feat.minPlanName}</span>
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm sm:text-base font-black leading-snug ${
                      isFeatureActive ? 'text-white' : 'text-slate-200'
                    }`}>
                      {feat.name}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {feat.description}
                    </p>

                    {feat.quickNote && (
                      <span className="text-[11px] font-bold text-sky-400 mt-0.5">
                        ℹ️ {feat.quickNote}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      Plan mínimo: <strong className="text-white">{feat.minPlanName}</strong>
                    </span>

                    {!isFeatureActive && (
                      <span className="font-black text-amber-400 hover:text-amber-300 flex items-center gap-1">
                        <span>Desbloquear</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Tarjeta 3: Automatización y Sincronización (Solo PRO y ENTERPRISE) */}
        {currentUser?.currentTier !== 'lite' && currentUser?.currentTier !== 'quick' && (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            variants={cardVariants}
            className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-8 relative sticky top-[120px] sm:static z-20"
          >
            {/* Cabecera Tarjeta */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[27px] font-bold text-white leading-tight">Automatización y Sincronización</h3>
                <p className="text-[18px] text-slate-300 mt-1">Gestiona la recolección de facturas y la persistencia local</p>
              </div>
            </div>

            {/* Bloque A: Extracción con IA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-xl bg-[#0F172A]/50 border border-purple-500/30 shadow-[inset_0_0_20px_rgba(147,51,234,0.05)] transition-all hover:border-purple-500/50 hover:shadow-[inset_0_0_20px_rgba(147,51,234,0.15)]">
              <div className="flex flex-col">
                <span className="text-[21px] font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                  Rastreo automático de facturas
                </span>
                <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                  Permite a la IA de Gestarian revisar continuamente tu correo ({currentUser?.email || "email de acceso"}) en busca de facturas nuevas, tanto al iniciar la app como en segundo plano.
                </span>
              </div>
              <button
                onClick={() => {
                  if (rastreoActivo) {
                    setRastreoActivo(false);
                  } else {
                    handleGoogleSync();
                    setRastreoActivo(true);
                  }
                }}
                disabled={isScanningGmail}
                className={`w-full sm:w-auto px-6 py-3 font-bold text-[18px] rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${rastreoActivo ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
              >
                {isScanningGmail ? "Conectando..." : (rastreoActivo ? "Conectado" : "Desconectado")}
              </button>
            </div>

            {/* Bloque C: Persistencia de datos sin conexión */}
            <div className="flex items-center justify-between gap-4 py-2 border-t border-white/5 pt-6">
              <div className="flex flex-col">
                <span className="text-[21px] font-bold text-white flex items-center gap-2">
                  <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
                  Modo Fuera de Línea (Offline-First)
                </span>
                <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                  Permite trabajar sin red. Sincronización automática al recuperar cobertura.
                </span>
              </div>
              {/* Toggle Minimalista */}
              <button 
                onClick={() => setOfflineActivo(!offlineActivo)}
                className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${offlineActivo ? "bg-emerald-500" : "bg-slate-700"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${offlineActivo ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Tarjeta 2: Personalización del Taller (Solo PRO y ENTERPRISE - Ocultar en LITE y QUICK) */}
        {currentUser?.currentTier !== 'lite' && currentUser?.currentTier !== 'quick' && (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            variants={cardVariants}
            className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-6 relative sticky top-[120px] sm:static z-20"
          >
          {/* Cabecera Tarjeta */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[27px] font-bold text-white leading-tight">Personalización del Taller</h3>
              <p className="text-[18px] text-slate-300 mt-1">Logotipo oficial, fondos de pantalla con IA y asistente Metis</p>
            </div>
          </div>

          {/* Bloque A: Estudio IA - Fondos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-xl bg-[#0F172A]/50 border border-pink-500/30 shadow-[inset_0_0_20px_rgba(236,72,153,0.05)] transition-all hover:border-pink-500/50 hover:shadow-[inset_0_0_20px_rgba(236,72,153,0.15)]">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
                Estudio IA: Personalizar Fondos desde Imagen Local
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Sube una imagen local y la IA generará 3 variantes estilizadas (Artística, Manga y Futurista) para el Inicio y el Menú Bento.
              </span>
            </div>
            <button
              onClick={onOpenCustomizer}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-[18px] rounded-lg transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              <span>Subir y Estilizar con IA</span>
            </button>
          </div>

          {/* Bloque B: Logotipo de la Empresa */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-xl bg-[#0F172A]/50 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-xl bg-[#0F172A] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo de la empresa" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[21px] font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#38BDF8] shrink-0" />
                  Logotipo Oficial (250 × 250 px)
                </span>
                <span className="text-[18px] text-slate-300 mt-1">
                  Visible en la cabecera superior izquierda, presupuestos y facturas.
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplaceTarget({
                slot: 'logo',
                label: 'Logotipo de la Empresa',
                currentUrl: currentLogo
              })}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[18px] rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#38BDF8]" />
              <span>Cambiar Logo</span>
            </button>
          </div>

          {/* Bloque C: Fondos de Pantalla */}
          <div className="space-y-4 p-4 rounded-xl bg-[#0F172A]/50 border border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div>
                <span className="text-[18px] font-bold text-white uppercase tracking-wider block">
                  Fondos de Pantalla del Sistema
                </span>
                <span className="text-xs sm:text-sm text-slate-300">
                  {systemWallpaperActive 
                    ? 'Fondos personalizados ACTIVADOS en la pantalla de inicio.' 
                    : 'Fondos DESACTIVADOS (Inicio en fondo negro puro).'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${systemWallpaperActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {systemWallpaperActive ? 'ACTIVADO' : 'DESACTIVADO'}
                </span>
                <button 
                  type="button"
                  onClick={handleToggleSystemWallpaper}
                  className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${systemWallpaperActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  title={systemWallpaperActive ? 'Desactivar fondos de pantalla' : 'Activar fondos de pantalla'}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${systemWallpaperActive ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Móvil / Portrait */}
              <div className="p-3 bg-[#0F172A]/80 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">Inicio (Móvil)</span>
                  <label className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Local</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectFileUpload('portrait', file);
                      }}
                    />
                  </label>
                </div>
                <div 
                  onClick={() => setReplaceTarget({
                    slot: 'portrait',
                    label: 'Fondo Inicio (Móvil / Portrait)',
                    currentUrl: currentPortrait,
                    defaultFallbackUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                  })}
                  className="h-28 w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 relative group cursor-pointer"
                >
                  <img
                    src={currentPortrait || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                    alt="Fondo Móvil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cambiar / Estilizar</span>
                  </div>
                </div>
              </div>

              {/* PC / Landscape */}
              <div className="p-3 bg-[#0F172A]/80 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">Inicio (PC)</span>
                  <label className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Local</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectFileUpload('landscape', file);
                      }}
                    />
                  </label>
                </div>
                <div 
                  onClick={() => setReplaceTarget({
                    slot: 'landscape',
                    label: 'Fondo Inicio (PC / Landscape)',
                    currentUrl: currentLandscape,
                    defaultFallbackUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
                  })}
                  className="h-28 w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 relative group cursor-pointer"
                >
                  <img
                    src={currentLandscape || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'}
                    alt="Fondo PC"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cambiar / Estilizar</span>
                  </div>
                </div>
              </div>

              {/* Menú Bento */}
              <div className="p-3 bg-[#0F172A]/80 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">Menú Bento</span>
                  <label className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Local</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectFileUpload('bento', file);
                      }}
                    />
                  </label>
                </div>
                <div 
                  onClick={() => setReplaceTarget({
                    slot: 'bento',
                    label: 'Fondo Menú Bento (Botones)',
                    currentUrl: currentBento,
                    defaultFallbackUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'
                  })}
                  className="h-28 w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 relative group cursor-pointer"
                >
                  <img
                    src={currentBento || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'}
                    alt="Fondo Bento"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cambiar / Estilizar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque D: Consejos Técnicos de Metis */}
          <div className="flex items-center justify-between gap-4 py-2 border-t border-white/5 pt-4">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#38BDF8] shrink-0" />
                Consejos Técnicos de Metis (Chapa y Pintura)
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Asesoramiento en tiempos de secado, proporciones de mezcla OEM y técnicas de preparación.
              </span>
            </div>
            {/* Toggle */}
            <button 
              onClick={handleToggleMetis}
              className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${metisAdviceActive ? 'bg-[#38BDF8]' : 'bg-slate-700'}`}
              title={metisAdviceActive ? 'Desactivar consejos técnicos' : 'Activar consejos técnicos'}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${metisAdviceActive ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.div>
      )}

        {/* Botón de Cerrar Sesión al final de la vista */}
        {onLogout && (
          <div className="mt-8 pt-8 border-t border-white/10 flex justify-center pb-8">
            <button
              onClick={onLogout}
              className="px-8 py-3 bg-rose-900/30 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/50 rounded-lg font-bold text-[18px] transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.1)] hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]"
            >
              CERRAR SESIÓN
            </button>
          </div>
        )}
      </div>

      {/* Modal para reemplazar imágenes de personalización */}
      <ReplaceImageModal
        isOpen={Boolean(replaceTarget)}
        onClose={() => setReplaceTarget(null)}
        target={replaceTarget}
        onImageReplaced={handleImageReplaced}
      />
    </div>
  );
};
