import React, { useState, useEffect } from 'react';
import { 
  Camera, Bell, Lock, LogOut, FileText, CheckCircle2,
  Users, Truck, Settings, Plus, Sparkles, AlertCircle,
  Menu, ChevronDown, Download, UserPlus, LogIn, ExternalLink, Globe, Building2, Smartphone, Check, Info,
  Zap, Gem, Calculator, PieChart, ShieldCheck, ArrowRight, X, Wrench, Car, Eye, EyeOff, KeyRound, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CasioVintageClock } from './CasioVintageClock';
import { AppUser, Client, GestarianDocument, GestarianPlan } from '../types';
import { MoreInfoModal } from './MoreInfoModal';
import { DownloadAppModal } from './DownloadAppModal';
import { SheetPlusFIcon } from './BudgetIcons';

// Iconos minimalistas en líneas de 1px sin relleno para las 4 versiones
const PLAN_OUTLINE_ICONS: Record<GestarianPlan, React.ReactNode> = {
  lite: <Globe className="w-8 h-8 text-emerald-400" strokeWidth={1.2} />,
  quick: <Zap className="w-8 h-8 text-pink-400" strokeWidth={1.2} />,
  pro: <Gem className="w-8 h-8 text-sky-400" strokeWidth={1.2} />,
  enterprise: <Building2 className="w-8 h-8 text-amber-400" strokeWidth={1.2} />
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
    cardBg: 'bg-[#061a14]',
    borderColor: 'border-emerald-900/80 hover:border-emerald-500',
    activeBorderColor: 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.25)]',
    ringColor: 'ring-1 ring-emerald-400/50',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-700',
    btnActiveBg: 'bg-emerald-400 text-slate-950 font-black',
    titleColor: 'text-emerald-100',
  },
  quick: {
    cardBg: 'bg-[#1f0b18]',
    borderColor: 'border-pink-900/80 hover:border-pink-500',
    activeBorderColor: 'border-pink-400 shadow-[0_0_24px_rgba(236,72,153,0.25)]',
    ringColor: 'ring-1 ring-pink-400/50',
    badgeBg: 'bg-pink-950/80',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-700',
    btnActiveBg: 'bg-pink-400 text-slate-950 font-black',
    titleColor: 'text-pink-100',
  },
  pro: {
    cardBg: 'bg-[#061829]',
    borderColor: 'border-sky-900/80 hover:border-sky-500',
    activeBorderColor: 'border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.25)]',
    ringColor: 'ring-1 ring-sky-400/50',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-700',
    btnActiveBg: 'bg-sky-400 text-slate-950 font-black',
    titleColor: 'text-sky-100',
  },
  enterprise: {
    cardBg: 'bg-[#1c1806]',
    borderColor: 'border-amber-900/80 hover:border-amber-500',
    activeBorderColor: 'border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.25)]',
    ringColor: 'ring-1 ring-amber-400/50',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-700',
    btnActiveBg: 'bg-amber-400 text-slate-950 font-black',
    titleColor: 'text-amber-100',
  },
};

const PLAN_BUTTON_GLOWS: Record<GestarianPlan, {
  border: string;
  text: string;
  glowInactive: string;
  glowActive: string;
}> = {
  lite: {
    border: 'border-emerald-500',
    text: 'text-emerald-200',
    glowInactive: 'border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    glowActive: 'border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.55),0_0_35px_rgba(16,185,129,0.3)] font-black scale-[1.01]',
  },
  quick: {
    border: 'border-pink-500',
    text: 'text-pink-200',
    glowInactive: 'border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.15)]',
    glowActive: 'border-pink-400 text-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.55),0_0_35px_rgba(236,72,153,0.3)] font-black scale-[1.01]',
  },
  pro: {
    border: 'border-sky-400',
    text: 'text-sky-200',
    glowInactive: 'border-sky-400/30 shadow-[0_0_8px_rgba(56,189,248,0.15)]',
    glowActive: 'border-sky-300 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.55),0_0_35px_rgba(56,189,248,0.3)] font-black scale-[1.01]',
  },
  enterprise: {
    border: 'border-amber-400',
    text: 'text-amber-200',
    glowInactive: 'border-amber-400/30 shadow-[0_0_8px_rgba(251,191,36,0.15)]',
    glowActive: 'border-amber-300 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.55),0_0_35px_rgba(251,191,36,0.3)] font-black scale-[1.01]',
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

  const [expandedPlan, setExpandedPlan] = useState<GestarianPlan | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginConfirmPassword, setLoginConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(true);

  const handleDirectPlanAccess = (planId: GestarianPlan) => {
    handleSelectPlanDirect(planId);
    try {
      localStorage.setItem('gestarian_auth_session', 'true');
    } catch {}
    onLoginSuccess(currentUser.email || 'usuario@gestarian.com');
  };

  const handleTogglePlanLogin = (planId: GestarianPlan) => {
    handleSelectPlanDirect(planId);
    if (expandedPlan === planId) {
      setExpandedPlan(null);
    } else {
      setExpandedPlan(planId);
      setLoginError(null);
      setIsLoginSuccess(false);
      setShowResetConfirm(false);
      try {
        const storedPass = localStorage.getItem('gestarian_auth_password');
        setIsFirstTimeLogin(!storedPass || storedPass.trim().length === 0);
        const storedEmail = localStorage.getItem('gestarian_auth_email');
        if (storedEmail) {
          setLoginEmail(storedEmail);
        } else if (currentUser.email) {
          setLoginEmail(currentUser.email);
        }
      } catch {
        setIsFirstTimeLogin(true);
      }
    }
  };

  const handleInlineLoginSubmit = (e: React.FormEvent, planId: GestarianPlan) => {
    e.preventDefault();
    setLoginError(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail) {
      setLoginError('Por favor, introduce un correo electrónico válido.');
      return;
    }

    if (cleanPass.length < 3) {
      setLoginError('La contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (isFirstTimeLogin) {
      if (cleanPass !== loginConfirmPassword.trim()) {
        setLoginError('Las contraseñas no coinciden. Por favor, verifícalas.');
        return;
      }

      try {
        localStorage.setItem('gestarian_auth_password', cleanPass);
        localStorage.setItem('gestarian_auth_email', cleanEmail);
        localStorage.setItem('gestarian_auth_session', 'true');
      } catch (err) {
        console.error('Error al guardar credenciales:', err);
      }

      setIsLoginSuccess(true);
      setTimeout(() => {
        onLoginSuccess(cleanEmail);
      }, 700);
    } else {
      const storedPass = localStorage.getItem('gestarian_auth_password') || '';
      if (cleanPass !== storedPass) {
        setLoginError('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
        return;
      }

      try {
        localStorage.setItem('gestarian_auth_session', 'true');
        localStorage.setItem('gestarian_auth_email', cleanEmail);
      } catch (err) {
        console.error('Error al guardar sesión:', err);
      }

      setIsLoginSuccess(true);
      setTimeout(() => {
        onLoginSuccess(cleanEmail);
      }, 600);
    }
  };

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
      setClientLoginError('Por favor, introduce tu correo y tu DNI o NIF/CIF.');
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
      id="page-inicio"
      className="relative w-screen h-[100dvh] max-h-[100dvh] shrink-0 snap-start bg-[#06080D] text-slate-100 overflow-y-auto overflow-x-hidden select-none"
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
      <div className="relative z-10 w-full max-w-7xl landscape:max-w-none landscape:w-[99vw] 2xl:w-[98vw] mx-auto px-4 sm:px-6 lg:px-3 py-2 landscape:py-1 flex flex-col gap-2 landscape:gap-1 min-h-[95vh] justify-between">
        
        {/* =========================================================================
            ESTADO 1: USUARIO AUTENTICADO / HA ACCEDIDO CON SU CUENTA
           ========================================================================= */}
        {isAuthenticated ? (
          <div className="w-full flex flex-col justify-between flex-1">
            {/* CABECERA AUTENTICADA:
                - Arriba a la izquierda: la versión (Lite, Quick, Pro o Enterprise).
                - Arriba a la derecha: el nombre del usuario antes de la @ con el botón de salir.
            */}
            <header className="w-full flex items-center justify-between pt-1 pb-1 shrink-0">
              <div className="text-left">
                <span className="text-sm sm:text-base font-bold tracking-wider text-slate-300 font-sans uppercase">
                  {activePlanConfig.label}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-right">
                <span className="text-sm sm:text-base font-medium tracking-wide text-slate-300 font-sans">
                  {usernameBeforeAt}
                </span>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Salir (Redirigir a la landing page)"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </header>

            {/* DEBAJO DE LA VERSIÓN Y EL USUARIO: HORA, FECHA Y GRADOS */}
            <div className="w-full max-w-2xl mx-auto pt-1 pb-2 shrink-0">
              <CasioVintageClock 
                isLightBackground={false} 
                fiscalAddress={currentUser.fiscalAddress} 
              />
            </div>

            {/* GESTARIAN CENTRADO EN EL MEDIO */}
            <section className="w-full flex flex-col items-center justify-center my-auto py-2 shrink-0">
              <div className="text-center">
                <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.35em] text-slate-200 uppercase font-sans">
                  GESTARIAN
                </h1>
              </div>

              {/* Avisos de presupuestos pendientes si existiesen */}
              {pendingBudgetReviews.length > 0 && (
                <div className="w-full max-w-lg mx-auto space-y-2 mt-4">
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

            {/* FOOTER: ICONOS DE LA VERSIÓN ACTIVA */}
            <footer className="w-full py-3 mt-auto shrink-0">
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
                      <SheetPlusFIcon className="w-6 h-6 text-emerald-400" />
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

                    <button
                      onClick={handleBellFooterClick}
                      className="relative w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] shrink-0"
                      title="Rastreo de Facturas"
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

                {/* 2. VERSIÓN LITE */}
                {currentPlan === 'lite' && (
                  <>
                    <button
                      onClick={() => {
                        if (onNewBudget) onNewBudget();
                        else onNavigateSection?.('page-presupuestos');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0"
                      title="Crear Presupuesto"
                    >
                      <FileText className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={() => {
                        if (onNewInvoice) onNewInvoice();
                        else onNavigateSection?.('page-facturacion');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.35)] shrink-0"
                      title="Crear Factura"
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
                      title="Escanear Matrícula OCR"
                    >
                      <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.4} />
                    </button>

                    <button
                      onClick={onOpenMenu}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)] shrink-0"
                      title="Menú"
                    >
                      <Plus className="w-6 h-6 text-pink-400" strokeWidth={2} />
                    </button>

                    <button
                      onClick={onOpenMetisChat}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0"
                      title="Metis IA"
                    >
                      <span className="font-bold text-lg text-amber-400">AI</span>
                    </button>

                    <button
                      onClick={onOpenVoiceAssistant}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)] shrink-0"
                      title="Voz"
                    >
                      <BidirectionalWavesIcon className="w-6 h-6 text-purple-400" />
                    </button>

                    <button
                      onClick={handleBellFooterClick}
                      className="relative w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] shrink-0"
                      title="Avisos"
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
                      title="Escanear Matrícula OCR"
                    >
                      <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.4} />
                    </button>

                    <button
                      onClick={onOpenMenu}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)] shrink-0"
                      title="Menú"
                    >
                      <Plus className="w-6 h-6 text-pink-400" strokeWidth={2} />
                    </button>

                    <button
                      onClick={onOpenMetisChat}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0"
                      title="Metis IA"
                    >
                      <span className="font-bold text-lg text-amber-400">AI</span>
                    </button>

                    <button
                      onClick={onOpenVoiceAssistant}
                      className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)] shrink-0"
                      title="Voz"
                    >
                      <BidirectionalWavesIcon className="w-6 h-6 text-purple-400" />
                    </button>

                    <button
                      onClick={handleBellFooterClick}
                      className="relative w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] shrink-0"
                      title="Avisos"
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
          </div>
        ) : (
          /* =========================================================================
             ESTADO 2: LANDING PAGE (NO AUTENTICADO)
             - Optimizada para landscape en una única pantalla
             ========================================================================= */
          <div className="w-full flex flex-col justify-between min-h-[92vh] landscape:min-h-[96vh] py-4">
            
            {/* SUPERIOR: GESTARIAN Y VERSIONES Y PLANES ASISTIDOS */}
            <div className="w-full flex flex-col items-center justify-center text-center py-6 sm:py-10 landscape:py-6">
              <h1 className="text-3xl sm:text-5xl lg:landscape:text-4xl xl:landscape:text-5xl font-extralight tracking-[0.35em] text-slate-200 uppercase font-sans">
                GESTARIAN
              </h1>
              <p className="text-[10px] sm:text-xs landscape:lg:text-[10px] font-light tracking-[0.30em] text-slate-400 uppercase mt-2 sm:mt-3 landscape:mt-2">
                Versiones y Planes Asistidos
              </p>
            </div>

            {/* TARJETAS INFORMATIVAS DE LAS VERSIONES ESTIRADAS */}
            <section className="w-full py-1 border-t border-slate-900 flex-1 flex flex-col justify-center">
              {/* 4 Botones en la misma línea repartiéndose el espacio equitativamente */}
              <div className="w-full max-w-5xl mx-auto px-2 mb-2 landscape:mb-1 flex items-center gap-2 sm:gap-3">
                {PLANS_CONFIG.map((plan) => {
                  const isActive = currentPlan === plan.id || expandedPlan === plan.id;
                  const glowStyle = PLAN_BUTTON_GLOWS[plan.id];
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleDirectPlanAccess(plan.id)}
                      className={`flex-1 py-2 sm:py-2.5 px-2 rounded-xl bg-transparent border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm landscape:lg:text-xs font-bold uppercase tracking-wider ${glowStyle.border} ${glowStyle.text} ${
                        isActive ? glowStyle.glowActive : glowStyle.glowInactive + ' hover:opacity-90'
                      }`}
                      title={`Acceder a ${plan.label}`}
                    >
                      <span className="truncate">{plan.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-[95%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 landscape:grid-cols-2 lg:landscape:grid-cols-4 gap-4 xl:gap-5 h-full items-stretch landscape:px-1 mb-4">
                {PLANS_CONFIG.map((plan, index) => {
                  const isCurrent = plan.id === currentPlan;
                  const theme = PLAN_CARD_THEMES[plan.id];
                  return (
                    <motion.div 
                      key={plan.id}
                      initial={{ opacity: 0, y: 70 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, margin: "-40px" }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                      className={`relative rounded-2xl p-4 sm:p-5 landscape:p-3.5 flex flex-col justify-between transition-all duration-300 border h-full ${theme.cardBg} ${
                        isCurrent 
                          ? `${theme.activeBorderColor} ${theme.ringColor}` 
                          : `${theme.borderColor} shadow-xl`
                      }`}
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Cabecera de la tarjeta */}
                          <div className="flex items-center justify-between mb-2 landscape:mb-1">
                            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center shrink-0">
                              {PLAN_OUTLINE_ICONS[plan.id]}
                            </div>
                            <span className={`text-[10px] lg:landscape:text-[10px] xl:landscape:text-xs 2xl:landscape:text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                              {plan.badge}
                            </span>
                          </div>

                          <h3 className={`text-xl sm:text-2xl lg:landscape:text-2xl xl:landscape:text-3xl 2xl:landscape:text-4xl font-black tracking-wider uppercase mb-2 ${theme.titleColor}`}>
                            {plan.label}
                          </h3>
                          
                          <p className="text-sm lg:landscape:text-sm xl:landscape:text-lg 2xl:landscape:text-xl text-slate-200 leading-relaxed landscape:leading-normal mb-3 font-normal">
                            {plan.desc}
                          </p>

                          <ul className="space-y-2 landscape:space-y-1.5 mb-3 border-t border-white/10 pt-2">
                            {plan.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm lg:landscape:text-xs xl:landscape:text-base 2xl:landscape:text-lg text-slate-200 font-normal">
                                <Check className="w-4 h-4 lg:landscape:w-4 lg:landscape:h-4 xl:landscape:w-5 xl:landscape:h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-snug">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5 mt-auto">
                          <button
                            type="button"
                            onClick={() => handleDirectPlanAccess(plan.id)}
                            className={`w-full py-2.5 landscape:py-2 px-3 rounded-xl text-xs lg:landscape:text-xs xl:landscape:text-sm 2xl:landscape:text-base font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${theme.btnActiveBg}`}
                          >
                            <LogIn className="w-3.5 h-3.5 lg:landscape:w-3.5 lg:landscape:h-3.5 xl:landscape:w-4 xl:landscape:h-4" />
                            <span>Acceder a {plan.label}</span>
                          </button>
                        </div>
                      </div>

                      {/* DESPLEGABLE FLUIDO POR DEBAJO DE LA TARJETA */}
                      <AnimatePresence>
                        {expandedPlan === plan.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-3 border-t border-white/10 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Acceso {plan.label}</span>
                                </span>
                                {isFirstTimeLogin && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full">
                                    Primera vez
                                  </span>
                                )}
                              </div>

                              {loginError && (
                                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-[11px] text-rose-300 font-medium">
                                  {loginError}
                                </div>
                              )}

                              {showResetConfirm ? (
                                <div className="p-3 bg-slate-950/90 border border-amber-500/40 rounded-xl space-y-2 text-center">
                                  <p className="text-[11px] text-slate-300">¿Restablecer contraseña de acceso?</p>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setShowResetConfirm(false)}
                                      className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        localStorage.removeItem('gestarian_auth_password');
                                        localStorage.removeItem('gestarian_auth_session');
                                        setIsFirstTimeLogin(true);
                                        setLoginPassword('');
                                        setLoginConfirmPassword('');
                                        setShowResetConfirm(false);
                                        setLoginError(null);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg"
                                    >
                                      Restablecer
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <form onSubmit={(e) => handleInlineLoginSubmit(e, plan.id)} className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                                      Correo Electrónico
                                    </label>
                                    <input
                                      type="email"
                                      required
                                      value={loginEmail}
                                      onChange={(e) => setLoginEmail(e.target.value)}
                                      placeholder="ejemplo@correo.com"
                                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                        {isFirstTimeLogin ? 'Crea Contraseña' : 'Contraseña'}
                                      </label>
                                      {!isFirstTimeLogin && (
                                        <button
                                          type="button"
                                          onClick={() => setShowResetConfirm(true)}
                                          className="text-[10px] text-sky-400 hover:underline"
                                        >
                                          ¿Olvidaste clave?
                                        </button>
                                      )}
                                    </div>
                                    <div className="relative flex items-center">
                                      <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder={isFirstTimeLogin ? 'Mínimo 3 caracteres' : '••••••••'}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 text-slate-400 hover:text-white"
                                      >
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>

                                  {isFirstTimeLogin && (
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                                        Confirmar Contraseña
                                      </label>
                                      <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={loginConfirmPassword}
                                        onChange={(e) => setLoginConfirmPassword(e.target.value)}
                                        placeholder="Repite la contraseña"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                                      />
                                    </div>
                                  )}

                                  <button
                                    type="submit"
                                    disabled={isLoginSuccess}
                                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                                      isLoginSuccess
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black'
                                    }`}
                                  >
                                    {isLoginSuccess ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Entrando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <LogIn className="w-3.5 h-3.5" />
                                        <span>Entrar a {plan.label}</span>
                                      </>
                                    )}
                                  </button>
                                </form>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* AL FINAL: UN BOTÓN MINIMALISTA DE ACCESO AL ÁREA DE CLIENTE */}
            <section className="w-full pt-4 pb-12 landscape:py-4 flex justify-center">
              <button
                type="button"
                onClick={() => setIsClientLoginModalOpen(true)}
                className="py-3.5 px-7 rounded-full bg-slate-900/90 hover:bg-slate-800 text-sky-400 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 cursor-pointer border border-sky-500/30 hover:border-sky-400/60 shadow-xl shadow-sky-500/10 hover:scale-105 active:scale-95"
                title="Acceso al Área de Cliente"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Acceso al Área de Cliente</span>
              </button>
            </section>
          </div>
        )}

      </div>

      {/* MODALES DE ACCESO Y MÁS INFORMACIÓN */}
      <AnimatePresence>
        {isMoreInfoModalOpen && (
          <MoreInfoModal
            isOpen={isMoreInfoModalOpen}
            onClose={() => setIsMoreInfoModalOpen(false)}
            onSelectPlan={(plan) => {
              handleSelectPlanDirect(plan);
              setIsMoreInfoModalOpen(false);
            }}
            currentPlan={currentPlan}
          />
        )}

        {isDownloadAppModalOpen && (
          <DownloadAppModal
            isOpen={isDownloadAppModalOpen}
            onClose={() => setIsDownloadAppModalOpen(false)}
            deferredPrompt={deferredPrompt}
          />
        )}

        {/* MODAL DE LOGIN DE CLIENTE / PORTAL DE CLIENTES (Email y DNI o NIF/CIF) */}
        {isClientLoginModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b1329] border border-sky-500/30 w-full max-w-md rounded-3xl p-6 text-white shadow-2xl relative"
            >
              <button
                onClick={() => setIsClientLoginModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900/80"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">Acceso al Área de Cliente</h3>
                <p className="text-xs text-slate-400 mt-1">Introduce tu correo electrónico y tu DNI o NIF/CIF</p>
              </div>

              <form onSubmit={handleClientLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Correo electrónico (Email)</label>
                  <input
                    type="email"
                    value={clientEmailInput}
                    onChange={(e) => setClientEmailInput(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">DNI o NIF/CIF</label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="Ej. 12345678Z o B12345678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 uppercase font-mono"
                  />
                </div>

                {clientLoginError && (
                  <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">{clientLoginError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/25 cursor-pointer mt-2"
                >
                  Acceder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
