import React, { useState, useEffect } from 'react';
import { 
  Camera, Bell, Lock, LogOut, FileText, CheckCircle2,
  Users, Truck, Settings, Plus, Sparkles, AlertCircle,
  Menu, ChevronDown, Download, UserPlus, LogIn, ExternalLink, Globe, Building2, Smartphone, Check, Info,
  Zap, Gem, Calculator, PieChart, ShieldCheck, ArrowRight, X, Wrench, Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CasioVintageClock } from './CasioVintageClock';
import { AppUser, Client, GestarianDocument, GestarianPlan } from '../types';
import { LoginCard } from './LoginCard';
import { MoreInfoModal } from './MoreInfoModal';
import { DownloadAppModal } from './DownloadAppModal';

// Iconos minimalistas en líneas de 1px sin relleno para las 4 versiones
const PLAN_OUTLINE_ICONS: Record<GestarianPlan, React.ReactNode> = {
  lite: <Globe className="w-8 h-8 text-slate-300" strokeWidth={1.2} />,
  quick: <Zap className="w-8 h-8 text-sky-400" strokeWidth={1.2} />,
  pro: <Gem className="w-8 h-8 text-emerald-400" strokeWidth={1.2} />,
  enterprise: <Building2 className="w-8 h-8 text-indigo-400" strokeWidth={1.2} />
};

// Estilos de tarjetas con tonalidades oscuras diferenciadas para contrastar con el fondo negro
const PLAN_CARD_THEMES: Record<GestarianPlan, {
  cardBg: string;
  borderColor: string;
  activeBorderColor: string;
  ringColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  btnActiveBg: string;
  titleColor: string;
}> = {
  lite: {
    cardBg: 'bg-[#0c131d]',
    borderColor: 'border-slate-700/80 hover:border-slate-500',
    activeBorderColor: 'border-slate-400 shadow-[0_0_24px_rgba(203,213,225,0.15)]',
    ringColor: 'ring-1 ring-slate-400/50',
    badgeBg: 'bg-slate-800/80',
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-600',
    btnActiveBg: 'bg-slate-200 text-slate-950 font-black',
    titleColor: 'text-slate-100',
  },
  quick: {
    cardBg: 'bg-[#061829]',
    borderColor: 'border-sky-800/80 hover:border-sky-500',
    activeBorderColor: 'border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.25)]',
    ringColor: 'ring-1 ring-sky-400/50',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-700',
    btnActiveBg: 'bg-sky-400 text-slate-950 font-black',
    titleColor: 'text-sky-100',
  },
  pro: {
    cardBg: 'bg-[#061a14]',
    borderColor: 'border-emerald-800/80 hover:border-emerald-500',
    activeBorderColor: 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.25)]',
    ringColor: 'ring-1 ring-emerald-400/50',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700',
    btnActiveBg: 'bg-emerald-400 text-slate-950 font-black',
    titleColor: 'text-emerald-100',
  },
  enterprise: {
    cardBg: 'bg-[#120c2b]',
    borderColor: 'border-purple-900/80 hover:border-purple-500',
    activeBorderColor: 'border-indigo-400 shadow-[0_0_24px_rgba(167,139,250,0.25)]',
    ringColor: 'ring-1 ring-indigo-400/50',
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-700',
    btnActiveBg: 'bg-indigo-400 text-slate-950 font-black',
    titleColor: 'text-purple-100',
  },
};

// Icono personalizado para conversación bidireccional / ondas de voz
const BidirectionalWavesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.4" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 10v4" />
    <path d="M6 7v10" />
    <path d="M10 4v16" />
    <path d="M14 4v16" />
    <path d="M18 7v10" />
    <path d="M22 10v4" />
  </svg>
);

export interface HomeViewProps {
  currentUser: AppUser;
  isAuthenticated: boolean;
  currentPlan?: GestarianPlan;
  onSelectPlan?: (plan: GestarianPlan) => void;
  onOpenEnterpriseAeat?: () => void;
  onOpenQuickExtras?: () => void;
  onLoginSuccess: (email: string) => void;
  onLogout: () => void;
  onOpenScanner: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onOpenMetisChat: () => void;
  onOpenVoiceAssistant: () => void;
  pendingBudgetReviews?: GestarianDocument[];
  onOpenBudgetReview?: (budgetId: string) => void;
  onOpenImageCustomizer?: () => void;
  onOpenClientLanding?: () => void;
  pendingInvoices?: GestarianDocument[];
  onOpenInvoice?: (invoiceId: string) => void;
  onDismissInvoice?: (invoiceId: string) => void;
  onNavigateSection?: (sectionId: string) => void;
  onNewBudget?: () => void;
  onNewInvoice?: () => void;
  onNewClient?: () => void;
  hasAutoDetectedInvoices?: boolean;
  isScanningInvoices?: boolean;
  scanButtonStatus?: 'idle' | 'scanning' | 'detected' | 'not_found';
  onTriggerScan?: () => void;
  onViewDetectedInvoices?: () => void;
  onOpenNewUser?: () => void;
  onOpenClientPortalLogin?: () => void;
  clients?: Client[];
  documents?: GestarianDocument[];
  onClientLogin?: (client: Client) => void;
}

export const PLANS_CONFIG: { 
  id: GestarianPlan; 
  label: string; 
  icon: string; 
  desc: string; 
  badge: string;
  features: string[];
}[] = [
  { 
    id: 'lite', 
    label: 'Lite', 
    icon: '🪐', 
    desc: 'Emisión directa de presupuestos y facturas en smartphone o PC. Hoja A4 oficial con código QR Veri*Factu según normativa AEAT. Envío por WhatsApp sin guardar contactos. 100% gratuito sin base de datos ni servidor.', 
    badge: '100% Gratuito',
    features: [
      'Emisión directa de presupuestos y facturas en smartphone y PC',
      'Hoja A4 oficial con código QR Veri*Factu según normativa AEAT',
      'Envío directo por WhatsApp sin necesidad de guardar contactos en agenda',
      'Impresión oficial en PDF y almacenamiento en dispositivo local'
    ]
  },
  { 
    id: 'quick', 
    label: 'Quick', 
    icon: '⚡', 
    desc: 'Facturación ultrarrápida y base de datos completa de Clientes y Proveedores. Custodia gratuita durante el 1er año (+10€/año de 1 a 4 años, +15€/año de 4 a 8 años). Opcional: Rastreo email + Captura cámara OCR (+19€/año).', 
    badge: 'BD + Custodia 1er Año',
    features: [
      'Base de datos completa de Clientes y Proveedores con historial',
      'Presupuestos y facturas oficiales con control de cobros',
      'Custodia de base de datos gratis el 1er año (ampliable hasta 8 años)',
      'Opcional: Rastreo de facturas en email + Captura cámara OCR (+19 €/año)',
      'Balances financieros, control de cobros y gastos públicos'
    ]
  },
  { 
    id: 'pro', 
    label: 'Pro', 
    icon: '💎', 
    desc: 'Suite integral para talleres y profesionales. Expedientes con Roadmap de estados interactivos en tiempo real, presupuestos, facturas, órdenes de trabajo, escáner OCR ALPR de matrículas, portal de clientes con fotos y Asistente Metis IA con voz.', 
    badge: 'Recomendado',
    features: [
      'Expedientes de vehículos con Roadmap de estados interactivos',
      'Órdenes de trabajo y control integral del taller',
      'Escáner OCR ALPR de matrículas en vivo por cámara',
      'Portal web de clientes con fotos del vehículo y presupuestos online',
      'Asistente Metis IA con voz y conversación bidireccional',
      'Gestión de equipo de trabajo y balances fiscales completos'
    ]
  },
  { 
    id: 'enterprise', 
    label: 'Enterprise', 
    icon: '🏢', 
    desc: 'Solución corporativa multisede y grandes flotas. Conexión certificada con Sede Electrónica AEAT, Business Intelligence predictivo, red B2B, capacidad ilimitada y soporte prioritario 24/7.', 
    badge: 'Corporativo',
    features: [
      'Conexión certificada directa con Sede Electrónica AEAT',
      'Integración multisede y Red B2B entre talleres y proveedores',
      'Capacidad ilimitada de usuarios, empleados, sedes y vehículos',
      'Business Intelligence y analítica predictiva avanzada',
      'Custodia permanente de documentos en la nube y soporte 24/7'
    ]
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  isAuthenticated,
  currentPlan = 'pro',
  onSelectPlan,
  onOpenEnterpriseAeat,
  onOpenQuickExtras,
  onLoginSuccess,
  onLogout,
  onOpenScanner,
  onOpenMenu,
  onOpenNotifications,
  unreadNotificationsCount,
  onOpenMetisChat,
  onOpenVoiceAssistant,
  pendingBudgetReviews = [],
  onOpenBudgetReview,
  onOpenImageCustomizer,
  pendingInvoices = [],
  onOpenInvoice,
  onDismissInvoice,
  onNavigateSection,
  onNewBudget,
  onNewInvoice,
  scanButtonStatus = 'idle',
  onTriggerScan,
  onViewDetectedInvoices,
  hasAutoDetectedInvoices = false,
  isScanningInvoices = false,
  onOpenNewUser,
  clients = [],
  onClientLogin,
}) => {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClientLoginModalOpen, setIsClientLoginModalOpen] = useState(false);
  const [isMoreInfoModalOpen, setIsMoreInfoModalOpen] = useState(false);
  const [isDownloadAppModalOpen, setIsDownloadAppModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [clientEmailInput, setClientEmailInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientLoginError, setClientLoginError] = useState('');

  // Capturar evento de instalación PWA si está disponible
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const activePlanConfig = PLANS_CONFIG.find(p => p.id === currentPlan) || PLANS_CONFIG[2];

  // Nombre de usuario antes de la @ de su email (minimalista, sin recuadro ni relleno)
  const usernameBeforeAt = currentUser.email 
    ? currentUser.email.split('@')[0] 
    : (currentUser.fullName ? currentUser.fullName.split(' ')[0].toLowerCase() : 'usuario');

  // Cálculo de facturas/recibos detectados para la campanita del footer
  const totalDetectedAlerts = (hasAutoDetectedInvoices ? 1 : 0) + pendingInvoices.length + unreadNotificationsCount;

  const defaultSampleClients: Client[] = clients.length > 0 
    ? clients.slice(0, 4) 
    : [
        {
          id: 'cli_demo_1',
          clientNumber: 1,
          name: 'Carlos Ruiz García',
          cif: '12345678Z',
          email: 'carlos.ruiz@gmail.com',
          phone: '654987321',
          address: 'Calle Mayor 12, Madrid',
          plates: ['4582KMB'],
          vehicles: [{ plate: '4582KMB', brand: 'Volkswagen', model: 'Golf VII' }],
          clientType: 'particular',
        },
        {
          id: 'cli_demo_2',
          clientNumber: 2,
          name: 'Transportes Rápidos SL',
          cif: 'B98765432',
          email: 'logistica@transportesrapidos.com',
          phone: '912345678',
          address: 'Polígono Industrial Las Mercedes 4',
          plates: ['7891LKP'],
          vehicles: [{ plate: '7891LKP', brand: 'Mercedes-Benz', model: 'Sprinter' }],
          clientType: 'empresa',
        }
      ];

  const handleSelectPlanDirect = (planId: GestarianPlan) => {
    onSelectPlan?.(planId);
    if (planId === 'quick') {
      onOpenQuickExtras?.();
    }
  };

  const handleClientLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientLoginError('');

    const cleanEmail = clientEmailInput.trim().toLowerCase();
    const cleanId = clientIdInput.trim().toUpperCase().replace(/[\s-]/g, '');

    if (!cleanEmail && !cleanId) {
      setClientLoginError('Por favor, introduce tu correo o tu DNI/CIF/Matrícula.');
      return;
    }

    const clientPool = clients.length > 0 ? clients : defaultSampleClients;

    const matched = clientPool.find((c) => {
      const matchEmail = cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail;
      const matchCif = cleanId && c.cif && c.cif.trim().toUpperCase().replace(/[\s-]/g, '') === cleanId;
      const matchPlate = cleanId && (
        c.plates?.some((p) => p.trim().toUpperCase().replace(/[\s-]/g, '') === cleanId) ||
        c.vehicles?.some((v) => v.plate.trim().toUpperCase().replace(/[\s-]/g, '') === cleanId)
      );
      return matchEmail || matchCif || matchPlate;
    });

    if (matched) {
      if (onClientLogin) {
        onClientLogin(matched);
      }
      setIsClientLoginModalOpen(false);
      setClientEmailInput('');
      setClientIdInput('');
    } else {
      const guestClient: Client = {
        id: `cli_${Date.now()}`,
        clientNumber: 999,
        name: cleanEmail ? cleanEmail.split('@')[0] : (cleanId || 'Cliente Registrado'),
        cif: cleanId || 'TEMP',
        email: cleanEmail || '',
        phone: '',
        address: '',
        plates: cleanId.length <= 8 && /[0-9]/.test(cleanId) ? [cleanId] : [],
        vehicles: cleanId.length <= 8 && /[0-9]/.test(cleanId) ? [{ plate: cleanId, brand: 'Vehículo', model: 'Cliente' }] : [],
        clientType: 'particular',
      };
      if (onClientLogin) {
        onClientLogin(guestClient);
      }
      setIsClientLoginModalOpen(false);
      setClientEmailInput('');
      setClientIdInput('');
    }
  };

  // Manejador del clic en la campanita del footer (rastreo de facturas / avisos)
  const handleBellFooterClick = () => {
    if (hasAutoDetectedInvoices && onViewDetectedInvoices) {
      onViewDetectedInvoices();
    } else if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  return (
    <div
      className="relative w-screen h-screen shrink-0 snap-start bg-[#06080D] text-slate-100 overflow-y-auto overflow-x-hidden select-none"
      id="page-inicio"
    >
      {/* Fondo de Pantalla Personalizado si está habilitado en Configuración */}
      {currentUser.enableSystemWallpaper && (
        <>
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
            style={{
              backgroundImage: `url(${
                typeof window !== 'undefined' && window.innerHeight > window.innerWidth
                  ? currentUser.bgPortraitUrl ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                  : currentUser.bgLandscapeUrl ||
                    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
              })`,
            }}
          />
          <div className="fixed inset-0 z-0 bg-black/60 pointer-events-none" />
        </>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col gap-5 sm:gap-7">
        
        {/* =========================================================================
            ESTADO 1: USUARIO AUTENTICADO / HA ACCEDIDO CON SU CUENTA
           ========================================================================= */}
        {isAuthenticated ? (
          <>
            {/* CABECERA AUTENTICADA:
                - Arriba a la izquierda: SOLO la versión (Lite, Quick, Pro o Enterprise), minimalista sin recuadro ni relleno.
                - Arriba a la derecha: SOLO el nombre del usuario antes de la @, minimalista sin recuadro ni relleno.
            */}
            <header className="w-full flex items-center justify-between pt-1 pb-2">
              {/* Arriba izquierda: Solo versión, minimalista, sin recuadro ni relleno */}
              <div className="text-left">
                <span className="text-sm sm:text-base font-bold tracking-wider text-slate-300 font-sans uppercase">
                  {activePlanConfig.label}
                </span>
              </div>

              {/* Arriba derecha: Solo nombre antes de @, minimalista, sin recuadro ni relleno */}
              <div className="flex items-center gap-2.5 text-right">
                <span className="text-sm sm:text-base font-medium tracking-wide text-slate-300 font-sans">
                  {usernameBeforeAt}
                </span>
                <button
                  onClick={onLogout}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* A CONTINUACIÓN: LA HORA Y LA FECHA (Reloj Casio Vintage digital) */}
            <section className="w-full flex flex-col items-center justify-center pt-1 pb-2">
              <div className="w-full max-w-2xl mx-auto">
                <CasioVintageClock 
                  isLightBackground={false} 
                  fiscalAddress={currentUser.fiscalAddress} 
                />
              </div>

              {/* Avisos de presupuestos pendientes si existiesen */}
              {pendingBudgetReviews.length > 0 && (
                <div className="w-full max-w-lg mx-auto space-y-2 mt-3">
                  {pendingBudgetReviews.map((budget) => (
                    <div
                      key={budget.id}
                      onClick={() => onOpenBudgetReview && onOpenBudgetReview(budget.id)}
                      className="cursor-pointer bg-slate-900/95 border-2 border-sky-400 text-white p-3 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center justify-between gap-3 hover:scale-[1.02] transition-transform"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-sky-400 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0">
                          AI
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Presupuesto pendiente de {budget.createdByName || 'operario'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {budget.vehiclePlate ? `Matrícula: ${budget.vehiclePlate}` : budget.number}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-400/40">
                        Completar
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* EN EL PIÉ: LOS ICONOS CENTRADOS REPARTIÉNDOSE TODO EL ESPACIO UNIFORMEMENTE
                (A los extremos la mitad del espacio que entre los iconos -> justify-around)
                Incluye la campanita para Quick, Pro y Enterprise (rastreo de facturas/recibos).
            */}
            <footer className="w-full py-3 my-1">
              <div className="w-full max-w-xl mx-auto flex items-center justify-around px-2 sm:px-6">
                
                {/* 1. VERSIÓN QUICK */}
                {currentPlan === 'quick' && (
                  <>
                    <button
                      onClick={() => {
                        if (onNewInvoice) onNewInvoice();
                        else onNavigateSection?.('page-facturacion');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0"
                      title="Nueva Factura"
                    >
                      <Calculator className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => onNavigateSection?.('page-clientes')}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.35)] shrink-0"
                      title="Clientes"
                    >
                      <Users className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => onNavigateSection?.('page-proveedores')}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0"
                      title="Proveedores"
                    >
                      <Truck className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => onNavigateSection?.('page-balances')}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-violet-400/80 shadow-[0_0_12px_rgba(139,92,246,0.35)] shrink-0"
                      title="Balances"
                    >
                      <PieChart className="w-6 h-6 text-violet-400" strokeWidth={1.5} />
                    </button>

                    {/* Campanita en el footer para rastreo de facturas / recibos detectados */}
                    <button
                      onClick={handleBellFooterClick}
                      className="relative w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] shrink-0"
                      title="Rastreo de Facturas: Avisa cuando hay facturas o recibos detectados"
                    >
                      <Bell className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
                      {totalDetectedAlerts > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full animate-pulse shadow-md">
                          {totalDetectedAlerts}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => onNavigateSection?.('page-configuracion')}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-slate-500 shadow-[0_0_12px_rgba(156,163,175,0.25)] shrink-0"
                      title="Configuración"
                    >
                      <Settings className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                    </button>
                  </>
                )}

                {/* 2. VERSIÓN LITE */}
                {currentPlan === 'lite' && (
                  <>
                    <button
                      onClick={() => {
                        if (onNewBudget) onNewBudget();
                        else onNavigateSection?.('page-presupuestos');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0"
                      title="Crear Presupuesto A4 Directo"
                    >
                      <FileText className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => {
                        if (onNewInvoice) onNewInvoice();
                        else onNavigateSection?.('page-facturacion');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.35)] shrink-0"
                      title="Crear Factura A4 Directa"
                    >
                      <Calculator className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => onNavigateSection?.('page-configuracion')}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-slate-500 shadow-[0_0_12px_rgba(156,163,175,0.25)] shrink-0"
                      title="Configuración"
                    >
                      <Settings className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                    </button>
                  </>
                )}

                {/* 3. VERSIÓN ENTERPRISE */}
                {currentPlan === 'enterprise' && (
                  <>
                    <button
                      onClick={onOpenScanner}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.35)] shrink-0"
                      title="Escanear Matrícula OCR ALPR"
                    >
                      <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.4} />
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenEnterpriseAeat) onOpenEnterpriseAeat();
                        else onNavigateSection?.('page-configuracion');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.35)] shrink-0"
                      title="Sede Electrónica AEAT"
                    >
                      <Building2 className="w-6 h-6 text-indigo-400" strokeWidth={1.4} />
                    </button>

                    <button
                      onClick={onOpenMenu}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)] shrink-0"
                      title="Menú de Secciones (+)"
                    >
                      <Plus className="w-6 h-6 text-pink-400" strokeWidth={2} />
                    </button>

                    <button
                      onClick={onOpenMetisChat}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0"
                      title="Asistente Metis IA"
                    >
                      <span className="font-bold text-lg text-amber-400">AI</span>
                    </button>

                    <button
                      onClick={onOpenVoiceAssistant}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)] shrink-0"
                      title="Voz y Conversación Bidireccional"
                    >
                      <BidirectionalWavesIcon className="w-6 h-6 text-purple-400" />
                    </button>

                    {/* Campanita en el footer para rastreo de facturas / recibos detectados */}
                    <button
                      onClick={handleBellFooterClick}
                      className="relative w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] shrink-0"
                      title="Rastreo de Facturas: Avisa cuando hay facturas o recibos detectados"
                    >
                      <Bell className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
                      {totalDetectedAlerts > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full animate-pulse shadow-md">
                          {totalDetectedAlerts}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* 4. VERSIÓN PRO (DEFAULT) */}
                {currentPlan === 'pro' && (
                  <>
                    <button
                      onClick={onOpenScanner}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.35)] shrink-0"
                      title="Escanear Matrícula OCR ALPR"
                    >
                      <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.4} />
                    </button>

                    <button
                      onClick={onOpenMenu}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)] shrink-0"
                      title="Menú de Secciones (+)"
                    >
                      <Plus className="w-6 h-6 text-pink-400" strokeWidth={2} />
                    </button>

                    <button
                      onClick={onOpenMetisChat}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0"
                      title="Asistente Metis IA"
                    >
                      <span className="font-bold text-lg text-amber-400">AI</span>
                    </button>

                    <button
                      onClick={onOpenVoiceAssistant}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)] shrink-0"
                      title="Voz y Conversación Bidireccional"
                    >
                      <BidirectionalWavesIcon className="w-6 h-6 text-purple-400" />
                    </button>

                    {/* Campanita en el footer para rastreo de facturas / recibos detectados */}
                    <button
                      onClick={handleBellFooterClick}
                      className="relative w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] shrink-0"
                      title="Rastreo de Facturas: Avisa cuando hay facturas o recibos detectados"
                    >
                      <Bell className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
                      {totalDetectedAlerts > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full animate-pulse shadow-md">
                          {totalDetectedAlerts}
                        </span>
                      )}
                    </button>
                  </>
                )}

              </div>
            </footer>

            {/* A CONTINUACIÓN HACIA ABAJO EN MÓVIL PORTRAIT HACIENDO SCROLL:
                "GESTARIAN" centrado, y después las versiones y planes
            */}
            <section className="w-full pt-6 pb-12 border-t border-slate-900">
              <div className="text-center max-w-2xl mx-auto mb-6">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.25em] text-white">
                  GESTARIAN
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light tracking-wider">
                  Versiones y Planes Asistidos
                </p>
              </div>

              {/* LAS CUATRO TARJETAS DE VERSIONES CON RELLENO DE TONALIDADES MUY OSCURAS CONTRASTADAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 w-full items-stretch">
                {PLANS_CONFIG.map((plan) => {
                  const isCurrent = plan.id === currentPlan;
                  const theme = PLAN_CARD_THEMES[plan.id];
                  return (
                    <div 
                      key={plan.id}
                      className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 border ${theme.cardBg} ${
                        isCurrent 
                          ? `${theme.activeBorderColor} ${theme.ringColor}` 
                          : `${theme.borderColor} shadow-xl`
                      }`}
                    >
                      <div>
                        {/* Header de la tarjeta */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center shrink-0">
                            {PLAN_OUTLINE_ICONS[plan.id]}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                            {plan.badge}
                          </span>
                        </div>

                        <h3 className={`text-2xl font-black tracking-wider uppercase mb-1 ${theme.titleColor}`}>
                          {plan.label}
                        </h3>
                        
                        <p className="text-xs text-slate-300 leading-relaxed min-h-[48px] mb-4 font-light">
                          {plan.desc}
                        </p>

                        {/* Características */}
                        <ul className="space-y-2 mb-4 border-t border-white/5 pt-3">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Botón de selección */}
                      <div className="pt-3 border-t border-white/5 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleSelectPlanDirect(plan.id)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isCurrent
                              ? theme.btnActiveBg
                              : 'bg-slate-950/70 hover:bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCurrent ? 'Versión Activa' : `Entrar a ${plan.label}`}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* =========================================================================
             ESTADO 2: NO SE HA ACCEDIDO (PANTALLA DE INICIO SIN LOGIN)
             Requisitos:
             - GESTARIAN minimalista centrado
             - Debajo centrado: GESTIÓN ADMINISTRATIVA ASISTIDA como subtítulo
             - Después las cuatro tarjetas seguidas del acceso al área de cliente con sus
               botones de registro, login, más información y descarga de la aplicación.
             - Eliminamos el footer donde tenemos el botón de volver y de la casita.
             ========================================================================= */
          <>
            {/* 1. TÍTULO GESTARIAN MINIMALISTA Y SUBTÍTULO CENTRADO */}
            <header className="w-full text-center pt-3 pb-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.25em] text-white uppercase font-sans">
                GESTARIAN
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase mt-2">
                GESTIÓN ADMINISTRATIVA ASISTIDA
              </p>
            </header>

            {/* 2. LAS CUATRO TARJETAS DE VERSIONES CON TONOS OSCUROS CONTRASTADOS */}
            <section className="w-full pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 w-full items-stretch">
                {PLANS_CONFIG.map((plan) => {
                  const isCurrent = plan.id === currentPlan;
                  const theme = PLAN_CARD_THEMES[plan.id];
                  return (
                    <div 
                      key={plan.id}
                      className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 border ${theme.cardBg} ${
                        isCurrent 
                          ? `${theme.activeBorderColor} ${theme.ringColor}` 
                          : `${theme.borderColor} shadow-xl`
                      }`}
                    >
                      <div>
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center shrink-0">
                            {PLAN_OUTLINE_ICONS[plan.id]}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                            {plan.badge}
                          </span>
                        </div>

                        <h3 className={`text-2xl font-black tracking-wider uppercase mb-1 ${theme.titleColor}`}>
                          {plan.label}
                        </h3>
                        
                        <p className="text-xs text-slate-300 leading-relaxed min-h-[48px] mb-4 font-light">
                          {plan.desc}
                        </p>

                        {/* Características de cada versión */}
                        <ul className="space-y-2 mb-4 border-t border-white/5 pt-3">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Acciones de la tarjeta */}
                      <div className="space-y-2 pt-3 border-t border-white/5 mt-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPlanDirect(plan.id);
                            setIsLoginModalOpen(true);
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isCurrent
                              ? theme.btnActiveBg
                              : 'bg-slate-950/70 hover:bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Acceder a {plan.label}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. ACCESO AL ÁREA DE CLIENTE CON SUS 4 BOTONES:
                - Registro
                - Login
                - Más información
                - Descarga de la aplicación
            */}
            <section className="w-full pt-4 pb-12">
              <div className="w-full bg-[#0a101b] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col items-center justify-center gap-6 shadow-2xl">
                
                <div className="text-center max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Área de Clientes y Gestión Asistida</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                    Acceso al Área de Cliente
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light leading-relaxed">
                    Gestiona tu actividad profesional, emite facturas y presupuestos con Veri*Factu oficial o consulta el estado de reparación de tu vehículo en tiempo real.
                  </p>
                </div>

                {/* Los 4 Botones Requeridos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full max-w-4xl">
                  
                  {/* Botón 1: Registro */}
                  <button
                    id="btn-inicio-registro"
                    type="button"
                    onClick={() => {
                      if (onOpenNewUser) {
                        onOpenNewUser();
                      } else {
                        setIsLoginModalOpen(true);
                      }
                    }}
                    className="py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-95"
                    title="Crear nueva cuenta / Registro de empresa o autónomo"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registro</span>
                  </button>

                  {/* Botón 2: Login */}
                  <button
                    id="btn-inicio-login"
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-sky-400/50 text-sky-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                    title="Iniciar sesión con tu cuenta"
                  >
                    <LogIn className="w-4 h-4 text-sky-400" />
                    <span>Login</span>
                  </button>

                  {/* Botón 3: Más Información */}
                  <button
                    id="btn-inicio-mas-info"
                    type="button"
                    onClick={() => setIsMoreInfoModalOpen(true)}
                    className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                    title="Análisis exhaustivo y comparativa de cada versión"
                  >
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Más Información</span>
                  </button>

                  {/* Botón 4: Descarga de la Aplicación */}
                  <button
                    id="btn-inicio-descarga-app"
                    type="button"
                    onClick={() => setIsDownloadAppModalOpen(true)}
                    className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                    title="Descargar e instalar la aplicación en móvil o PC"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Descarga de la App</span>
                  </button>

                </div>

                {/* Acceso para clientes de taller (por DNI/CIF o matrícula) */}
                <div className="pt-4 border-t border-slate-800/80 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <span>¿Eres cliente del taller y quieres consultar tu vehículo?</span>
                  <button
                    type="button"
                    onClick={() => setIsClientLoginModalOpen(true)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    Acceder con Matrícula o DNI →
                  </button>
                </div>

              </div>
            </section>
          </>
        )}

      </div>

      {/* =========================================================================
          MODAL: MÁS INFORMACIÓN (ANÁLISIS EXHAUSTIVO DE VERSIONES Y NORMATIVA)
         ========================================================================= */}
      <MoreInfoModal 
        isOpen={isMoreInfoModalOpen}
        onClose={() => setIsMoreInfoModalOpen(false)}
        onSelectPlan={(p) => {
          onSelectPlan?.(p);
          setIsMoreInfoModalOpen(false);
        }}
        currentPlan={currentPlan}
      />

      {/* =========================================================================
          MODAL: DESCARGA DE LA APLICACIÓN (PWA / MÓVIL / ESCRITORIO)
         ========================================================================= */}
      <DownloadAppModal 
        isOpen={isDownloadAppModalOpen}
        onClose={() => setIsDownloadAppModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* =========================================================================
          MODAL DE ACCESO PARA CLIENTES (Email o DNI/CIF/Matrícula)
         ========================================================================= */}
      {isClientLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-md w-full text-white relative shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => {
                setIsClientLoginModalOpen(false);
                setClientLoginError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 text-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/40 text-indigo-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wider text-white">
                  Área de Clientes
                </h3>
                <p className="text-xs text-indigo-300 font-medium">Portal Web Gestarian</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5 font-light">
              Introduce tu correo electrónico o tu DNI/CIF o la matrícula de tu vehículo para acceder a tu historial de reparaciones y presupuestos.
            </p>

            <form onSubmit={handleClientLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico (opcional si pones DNI o Matrícula)
                </label>
                <input
                  type="email"
                  value={clientEmailInput}
                  onChange={(e) => setClientEmailInput(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-indigo-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  DNI / CIF o Matrícula del Vehículo
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value.toUpperCase())}
                  placeholder="ej. 12345678Z ó 4582KMB"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm uppercase focus:border-indigo-400 outline-none"
                />
              </div>

              {clientLoginError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{clientLoginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Acceder al Portal de Clientes</span>
              </button>
            </form>

            {/* Acceso rápido a clientes de prueba */}
            {defaultSampleClients.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Acceso Rápido de Prueba (Clientes del Taller):
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {defaultSampleClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (onClientLogin) {
                          onClientLogin(c);
                        }
                        setIsClientLoginModalOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="truncate">
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          {c.cif || c.plates?.[0] || c.email}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-400 shrink-0 font-bold">Entrar →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE INICIO DE SESIÓN / ACCESO DE USUARIOS REGISTRADOS
         ========================================================================= */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm sm:max-w-md mx-auto animate-in zoom-in-95">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-xs font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer z-50 shadow-lg"
            >
              Cerrar ✕
            </button>
            <LoginCard 
              currentUser={currentUser}
              onLoginSuccess={(email) => {
                onLoginSuccess(email);
                setIsLoginModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
