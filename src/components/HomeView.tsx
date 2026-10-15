import React, { useState } from 'react';
import { 
  Camera, Bell, Palette, ArrowRight, Lock, LogOut, FileText, CheckCircle2,
  FolderOpen, Inbox, Users, Calendar, Wrench, Calculator, PieChart,
  Truck, AlertTriangle, Settings, Plus, Sparkles, AlertCircle,
  Menu, ChevronDown, Download, UserPlus, LogIn, ExternalLink, Globe, Building2, Smartphone, Check, Info,
  Zap, Gem
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { CasioVintageClock } from './CasioVintageClock';
import { AppUser, GestarianDocument, GestarianPlan } from '../types';
import { LoginCard } from './LoginCard';
import { A4PlusPIcon, PlusClientIcon, allNavItems } from './NavigationMenu';

// Iconos minimalistas en líneas de 1px sin relleno para las 4 versiones
const PLAN_OUTLINE_ICONS: Record<GestarianPlan, React.ReactNode> = {
  lite: <Globe className="w-8 h-8 text-slate-200" strokeWidth={1} />,
  quick: <Zap className="w-8 h-8 text-sky-400" strokeWidth={1} />,
  pro: <Gem className="w-8 h-8 text-emerald-400" strokeWidth={1} />,
  enterprise: <Building2 className="w-8 h-8 text-indigo-400" strokeWidth={1} />
};

// Icono personalizado para representar conversación bidireccional / ondas de voz
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

// Icono con campana de avisos y destello para el botón de Avisos del footer
const AvisosNotificationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.4" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="18" cy="4" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

interface HomeViewProps {
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
}

const PLANS_CONFIG: { 
  id: GestarianPlan; 
  label: string; 
  icon: string; 
  desc: string; 
  badge: string;
  features: string[];
}[] = [
  { 
    id: 'lite', 
    label: 'LITE', 
    icon: '🪐', 
    desc: 'Presupuestos y Facturas Directas en local sin registro obligatorio.', 
    badge: 'Gratis',
    features: [
      'Emisión e impresión de presupuestos A4 con PDF',
      'Facturación directa para pymes y autónomos',
      'Almacenamiento ultra rápido en almacenamiento local',
      'Generación inmediata sin necesidad de servidor'
    ]
  },
  { 
    id: 'quick', 
    label: 'QUICK', 
    icon: '⚡', 
    desc: 'Base de datos de Clientes y Proveedores, presupuestos y facturas. Custodia 1er año gratis, de 1 a 4 años (+10€/año), de 4 a 8 años (+15€/año). Rastreo Email + Cámara OCR (+19€/año).', 
    badge: 'BD + Custodia 1 Año',
    features: [
      'Base de datos completa de Clientes y Proveedores',
      'Redacción y confección de Presupuestos y Facturas',
      'Custodia gratuita de base de datos durante el 1er año',
      'Custodia de 1 a 4 años: +10 € / año',
      'Custodia de 4 a 8 años: +15 € / año',
      'Rastreo de facturas por email + Captura cámara OCR con extracción de datos (+19 € / año)'
    ]
  },
  { 
    id: 'pro', 
    label: 'PRO', 
    icon: '💎', 
    desc: 'Suite completa de Taller, Expedientes, Roadmap y Asistente IA.', 
    badge: 'Completo',
    features: [
      'Expedientes completos con Roadmap de estados interactivos',
      'Órdenes de trabajo y control integral del taller',
      'Escáner OCR ALPR de matrículas por cámara',
      'Asistente Metis IA con voz y conversación bidireccional',
      'Gestión de equipo de trabajo e informes financieros'
    ]
  },
  { 
    id: 'enterprise', 
    label: 'ENTERPRISE', 
    icon: '🏢', 
    desc: 'Solución corporativa con Sede Electrónica AEAT y Red B2B.', 
    badge: 'Corporativo',
    features: [
      'Conexión certificada con Sede Electrónica AEAT',
      'Integración Red B2B y multisede',
      'Capacidad ilimitada de usuarios y vehículos',
      'Custodia permanente de documentos con copias de seguridad',
      'Soporte corporativo prioritario 24/7'
    ]
  },
];

// Componente para la entrada en CASCADA FLUIDA CON MOTION BLUR (Despliegue ultra rápido de 1.0s total)
const MotionBlurCascadeLine: React.FC<{
  children: React.ReactNode;
  delay: number;
  duration?: number;
  isIntroFinished: boolean;
  className?: string;
}> = ({
  children,
  delay,
  duration = 0.20,
  isIntroFinished,
  className = '',
}) => {
  if (isIntroFinished) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

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
}) => {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<GestarianPlan | null>(null);
  const [registeredUserEmail, setRegisteredUserEmail] = useState<string | null>(null);
  const [showRegisterSuccessModal, setShowRegisterSuccessModal] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasChosenVersion, setHasChosenVersion] = useState<boolean>(false);
  const [isIntroFinished, setIsIntroFinished] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && (window as any).__gestarian_intro_done) {
      return true;
    }
    return false;
  });

  React.useEffect(() => {
    if (!isIntroFinished) {
      const timer = setTimeout(() => {
        setIsIntroFinished(true);
        if (typeof window !== 'undefined') {
          (window as any).__gestarian_intro_done = true;
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isIntroFinished]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });

  // Parallax para Pantalla 1 (Portadas, Titulares y Versiones)
  const yBg = useTransform(scrollY, [0, 1000], [0, 250]);
  const yTitles = useTransform(scrollY, [0, 800], [0, -180]);
  const opacityTitles = useTransform(scrollY, [0, 450], [1, 0.1]);
  const scaleTitles = useTransform(scrollY, [0, 600], [1, 0.92]);
  const yVersions = useTransform(scrollY, [0, 800], [0, -100]);

  // Haces de luz y orbes flotantes con desplazamiento Parallax
  const yOrbSky = useTransform(scrollY, [0, 1000], [0, -320]);
  const yOrbIndigo = useTransform(scrollY, [0, 1000], [0, -220]);
  const yOrbEmerald = useTransform(scrollY, [0, 1000], [0, -400]);

  // Parallax escalonado para las 4 tarjetas de versión
  const yCardLite = useTransform(scrollY, [150, 850], [70, -10]);
  const yCardQuick = useTransform(scrollY, [150, 850], [110, -15]);
  const yCardPro = useTransform(scrollY, [150, 850], [150, -20]);
  const yCardEnterprise = useTransform(scrollY, [150, 850], [190, -25]);

  const yCustomerArea = useTransform(scrollY, [300, 1000], [100, -10]);
  const yBottomActions = useTransform(scrollY, [400, 1000], [80, -5]);

  const cardParallaxMap: Record<GestarianPlan, any> = {
    lite: yCardLite,
    quick: yCardQuick,
    pro: yCardPro,
    enterprise: yCardEnterprise,
  };

  const activePlanConfig = PLANS_CONFIG.find(p => p.id === currentPlan) || PLANS_CONFIG[2];
  const usernameOnly = currentUser.email 
    ? currentUser.email.split('@')[0] 
    : (currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Usuario');

  const isAutomocion =
    currentUser.sector?.toLowerCase().includes('automoci') ||
    currentUser.sector?.toLowerCase().includes('taller') ||
    currentUser.sector?.toLowerCase().includes('chapa') ||
    currentUser.fullName?.toLowerCase().includes('car');

  const hasCustomBg = Boolean(currentUser.bgPortraitUrl || currentUser.bgLandscapeUrl);

  const handleRegisterPlan = (planId: GestarianPlan) => {
    onSelectPlan?.(planId);
    setHasChosenVersion(true);
    if (planId === 'quick') {
      onOpenQuickExtras?.();
    } else {
      setShowRegisterSuccessModal(true);
    }
    const el = document.getElementById('page-inicio');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVersionCard = (planId: GestarianPlan) => {
    onSelectPlan?.(planId);
    setHasChosenVersion(true);
    if (planId === 'quick') {
      onOpenQuickExtras?.();
    }
    const el = document.getElementById('page-inicio');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadApp = () => {
    const alertMsg = registeredUserEmail || currentUser.email
      ? `Iniciando descarga del paquete de aplicación GESTARIAN (${currentPlan.toUpperCase()})...`
      : 'Para descargar la aplicación oficial, por favor inicia sesión o regístrate en la plataforma.';
    alert(alertMsg);
  };

  return (
    <div
      ref={scrollRef}
      className="relative w-screen min-w-full h-[100dvh] shrink-0 snap-start bg-black overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory"
      id="page-inicio"
    >
      {/* Elementos ambientales de luz flotantes con efecto Parallax */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          style={{ y: yOrbSky }}
          className="absolute top-[8%] left-[12%] w-96 h-96 rounded-full bg-sky-500/10 blur-[130px]"
        />
        <motion.div 
          style={{ y: yOrbIndigo }}
          className="absolute top-[42%] right-[8%] w-[32rem] h-[32rem] rounded-full bg-indigo-500/10 blur-[160px]"
        />
        <motion.div 
          style={{ y: yOrbEmerald }}
          className="absolute top-[78%] left-[20%] w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-[140px]"
        />
      </div>

      {/* Fondo de Pantalla del Sistema (Solo visible si está ACTIVADO en Configuración) */}
      {currentUser.enableSystemWallpaper && (
        <>
          <motion.div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-700"
            style={{
              y: yBg,
              backgroundImage: `url(${
                typeof window !== 'undefined' && window.innerHeight > window.innerWidth
                  ? currentUser.bgPortraitUrl ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                  : currentUser.bgLandscapeUrl ||
                    'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
              })`,
            }}
          />
          <div className="absolute inset-0 z-0 bg-black/55 pointer-events-none" />
        </>
      )}

      {/* =========================================================================
          PANTALLA 1: PORTADA PRINCIPAL (100vh full viewport snap)
         ========================================================================= */}
      <section className="relative z-10 w-full min-h-[100dvh] h-[100dvh] flex flex-col justify-between items-center px-3 sm:px-6 py-4 snap-start shrink-0 bg-transparent">
        
        {/* TOP BAR / HEADER (Solo visible si ya se eligió una versión/plan) */}
        {hasChosenVersion ? (
          <div className="w-full flex items-center justify-between z-30">
            {/* Selector de Plan / Versión en Top Left */}
            <div className="relative">
              <button
                id="btn-home-plan-switcher"
                type="button"
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="inline-flex flex-col items-start bg-transparent border-0 p-0 text-white cursor-pointer leading-none select-none hover:opacity-90 transition-opacity"
                title="Cambiar versión activa de GESTARIAN"
              >
                <span className="text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-white">
                  GESTARIAN
                </span>
                <span className="text-[11px] font-bold tracking-wider text-sky-300 font-sans self-end -mt-0.5">
                  {activePlanConfig.label}
                </span>
              </button>

              {isPlanDropdownOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 w-64 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Seleccionar Versión de GESTARIAN
                  </div>
                  {PLANS_CONFIG.map((p) => {
                    const isSelected = p.id === currentPlan;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPlan?.(p.id);
                          setHasChosenVersion(true);
                          setIsPlanDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-500/20 text-white font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base shrink-0">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">{p.label}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isSelected ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Acceso / Estado en Top Right */}
            <div className="flex items-center gap-2.5 justify-end">
              {isAuthenticated ? (
                <span className="text-xs sm:text-sm font-black text-sky-300 font-mono tracking-wider select-none">
                  {usernameOnly}
                </span>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0F2942]/90 hover:bg-[#1E3A8A] text-white backdrop-blur-md rounded-xl border border-sky-400/40 text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-sky-400" />
                  <span>Iniciar Sesión</span>
                </button>
              )}

              {isAuthenticated && unreadNotificationsCount > 0 && (
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 bg-[#0F2942]/90 backdrop-blur-md rounded-full border border-rose-500/50 text-rose-400 hover:text-rose-300 hover:bg-[#1E3A8A] transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse cursor-pointer"
                  title="Avisos de METIS pendientes"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full border border-[#0F172A]">
                    {unreadNotificationsCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-6 z-30" />
        )}

        {/* RELOJ CASIO VINTAGE EN EL HEADER (Solo visible si ya se eligió una versión/plan) */}
        {hasChosenVersion ? (
          <div className="relative z-10 w-full pt-2 px-3 sm:px-6 shrink-0">
            <CasioVintageClock 
              isLightBackground={false} 
              fiscalAddress={currentUser.fiscalAddress} 
            />
          </div>
        ) : (
          <div className="shrink-0 h-4" />
        )}

        {/* CENTRO: GESTARIAN ANIMADO */}
        <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-between px-4 py-2 my-auto overflow-hidden min-h-[80vh]">
          
          {/* Popups de notificaciones flotantes pendientes (si autenticado y versión elegida) */}
          {hasChosenVersion && isAuthenticated && pendingBudgetReviews.length > 0 && (
            <div className="w-full max-w-lg mx-auto mb-2 space-y-2">
              {pendingBudgetReviews.map((budget) => (
                <div
                  key={budget.id}
                  onClick={() => onOpenBudgetReview && onOpenBudgetReview(budget.id)}
                  className="cursor-pointer bg-[#0F2942]/95 border-2 border-[#38BDF8] text-white p-3 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.55)] backdrop-blur-md flex items-center justify-between gap-3 hover:scale-[1.02] transition-transform animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0F2942] border-2 border-white flex items-center justify-center text-[#38BDF8] font-black text-xs shrink-0">
                      AI
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        Nuevo presupuesto de {budget.createdByName || 'operario'}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        {budget.vehiclePlate ? `Matrícula: ${budget.vehiclePlate}` : budget.number}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider shrink-0 bg-[#38BDF8]/20 px-2 py-1 rounded-lg border border-[#38BDF8]/40">
                    Completar
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TITULARES ANIMADOS CON PARALLAX: Centrados en la mitad superior */}
          <motion.div 
            style={{ y: yTitles, opacity: opacityTitles, scale: scaleTitles }}
            className="w-full flex flex-col items-center justify-center pt-6 sm:pt-10 text-center select-none"
          >
            {/* LÍNEA 1 (0.00s): GESTARIAN */}
            <MotionBlurCascadeLine
              delay={0.00}
              duration={0.20}
              isIntroFinished={isIntroFinished}
              className="inline-block max-w-full"
            >
              <div className="relative overflow-hidden inline-block mx-auto max-w-full">
                <h1 className="w-[70vw] mx-auto text-center text-white font-thin tracking-[0.25em] sm:tracking-[0.35em] text-4xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[110px] uppercase leading-none">
                  GESTARIAN
                </h1>
              </div>
            </MotionBlurCascadeLine>

            {/* LÍNEA 2 (0.12s): GESTIÓN INTELIGENTE ASISTIDA */}
            <MotionBlurCascadeLine
              delay={0.12}
              duration={0.20}
              isIntroFinished={isIntroFinished}
              className="w-[70vw] mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center text-slate-300 font-thin tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-base md:text-xl lg:text-2xl xl:text-3xl uppercase mt-3 sm:mt-5"
            >
              <span>GESTIÓN</span>
              <span>INTELIGENTE</span>
              <span>ASISTIDA</span>
            </MotionBlurCascadeLine>
          </motion.div>

          {/* LÍNEAS 3-6 CON PARALLAX: VERSIONES EN CASCADA (Lite, Quick, Pro, Enterprise) */}
          <motion.div 
            style={{ y: yVersions }}
            className="w-full flex flex-col items-center justify-center my-4 sm:my-6 gap-3 sm:gap-4 select-none"
          >
            {[
              { id: 'lite' as GestarianPlan, label: 'Lite', delay: 0.24 },
              { id: 'quick' as GestarianPlan, label: 'Quick', delay: 0.36 },
              { id: 'pro' as GestarianPlan, label: 'Pro', delay: 0.48 },
              { id: 'enterprise' as GestarianPlan, label: 'Enterprise', delay: 0.60 },
            ].map((box) => (
              <MotionBlurCascadeLine
                key={box.id}
                delay={box.delay}
                duration={0.20}
                isIntroFinished={isIntroFinished}
                className="inline-block"
              >
                <button
                  type="button"
                  onClick={() => handleSelectVersionCard(box.id)}
                  className="py-1 px-4 bg-transparent border-0 outline-none transition-all duration-300 cursor-pointer flex items-center justify-center active:scale-95 hover:scale-105 group"
                  title={`Seleccionar versión ${box.label}`}
                >
                  <span
                    className={`relative text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.25em] transition-colors duration-300 ${
                      currentPlan === box.id
                        ? 'text-white font-normal border-b border-sky-400 pb-0.5'
                        : 'text-slate-300/80 hover:text-white font-thin'
                    }`}
                  >
                    {box.label}
                    {currentPlan === box.id && (
                      <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-sky-300 rounded-full blur-[1.5px] shadow-[0_0_8px_#38bdf8]" />
                    )}
                  </span>
                </button>
              </MotionBlurCascadeLine>
            ))}
          </motion.div>

          {/* LÍNEA 7 (0.72s): MÁS INFO Y VERSIONES */}
          <div className="w-full flex flex-col items-center justify-end pb-3 pt-2 select-none">
            <MotionBlurCascadeLine
              delay={0.72}
              duration={0.20}
              isIntroFinished={isIntroFinished}
              className="inline-block"
            >
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('seccion-tarjetas');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none"
                title="Desplazarse hacia abajo para ver más información y versiones"
              >
                <span className="text-sm sm:text-base md:text-lg tracking-[0.25em] uppercase font-thin text-slate-300 group-hover:text-white transition-colors">
                  MÁS INFO Y VERSIONES
                </span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="p-1.5"
                >
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 group-hover:text-white transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>
            </MotionBlurCascadeLine>
          </div>

        </div>

        {/* FOOTER PRINCIPAL: ICONOS DE ACCIÓN RÁPIDA (Solo visible si ya se eligió una versión) */}
        {hasChosenVersion && (
          <div className="relative z-30 w-full pb-2 sm:pb-3 pt-2 -translate-y-[10px] flex flex-col justify-center items-center shrink-0">
            <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-6 w-full max-w-sm sm:max-w-xl mx-auto flex-nowrap">
              
              {/* ICONOS FOOTER SEGÚN LA VERSIÓN ELEGIDA */}
              {currentPlan === 'quick' ? (
                <>
                  {/* QUICK 1. NUEVA FACTURA (Glow Esmeralda) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else if (onNewInvoice) {
                        onNewInvoice();
                      } else {
                        onNavigateSection?.('page-facturacion');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #10b981, 0 0 20px rgba(16, 185, 129, 0.45)',
                    }}
                    title="Nueva Factura"
                  >
                    <Calculator strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* QUICK 2. CLIENTES (Glow Cyan/Sky) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onNavigateSection?.('page-clientes');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.45)',
                    }}
                    title="Clientes"
                  >
                    <Users strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* QUICK 3. PROVEEDORES (Glow Ámbar) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onNavigateSection?.('page-proveedores');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.45)',
                    }}
                    title="Proveedores"
                  >
                    <Truck strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* QUICK 4. BALANCES (Glow Violeta) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onNavigateSection?.('page-balances');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #8b5cf6, 0 0 20px rgba(139, 92, 246, 0.45)',
                    }}
                    title="Balances"
                  >
                    <PieChart strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* QUICK 5. CONFIGURACIÓN (Glow Zinc/Gray) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onNavigateSection?.('page-configuracion');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #9ca3af, 0 0 20px rgba(156, 163, 175, 0.45)',
                    }}
                    title="Configuración"
                  >
                    <Settings strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>
                </>
              ) : currentPlan === 'lite' ? (
                <>
                  {/* LITE 1. PRESUPUESTOS (Hoja A4 Directa - Glow Esmeralda) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else if (onNewBudget) {
                        onNewBudget();
                      } else {
                        onNavigateSection?.('page-presupuestos');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #10b981, 0 0 20px rgba(16, 185, 129, 0.45)',
                    }}
                    title="Crear Presupuesto (Hoja A4)"
                  >
                    <FileText strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* LITE 2. FACTURAS (Hoja A4 Directa - Glow Sky) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else if (onNewInvoice) {
                        onNewInvoice();
                      } else {
                        onNavigateSection?.('page-facturacion');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.45)',
                    }}
                    title="Crear Factura (Hoja A4)"
                  >
                    <Calculator strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>
                </>
              ) : currentPlan === 'enterprise' ? (
                <>
                  {/* ENTERPRISE 1. CÁMARA OCR ALPR (Glow Verde) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenScanner();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #22c55e, 0 0 20px rgba(34, 197, 94, 0.45)',
                    }}
                    title="Escanear matrícula OCR ALPR"
                  >
                    <Camera strokeWidth={1.3} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* ENTERPRISE 2. SEDE ELECTRÓNICA AEAT (Glow Indigo) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else if (onOpenEnterpriseAeat) {
                        onOpenEnterpriseAeat();
                      } else {
                        onNavigateSection?.('page-configuracion');
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #6366f1, 0 0 20px rgba(99, 102, 241, 0.45)',
                    }}
                    title="Sede Electrónica AEAT"
                  >
                    <Building2 strokeWidth={1.4} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* ENTERPRISE 3. MENÚ + (Glow Rosa) */}
                  <button
                    onClick={onOpenMenu}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #ec4899, 0 0 20px rgba(236, 72, 153, 0.45)',
                    }}
                    title="Menú de secciones (+)"
                  >
                    <Plus strokeWidth={2} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* ENTERPRISE 4. METIS IA (Glow Naranja) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenMetisChat();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #f97316, 0 0 20px rgba(249, 115, 22, 0.45)',
                    }}
                    title="Asistente Metis IA"
                  >
                    <span className="font-normal tracking-tighter font-sans text-xl sm:text-2xl text-white leading-none select-none">
                      AI
                    </span>
                  </button>

                  {/* ENTERPRISE 5. VOZ BIDIRECCIONAL (Glow Morado) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenVoiceAssistant();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #a855f7, 0 0 20px rgba(168, 85, 247, 0.45)',
                    }}
                    title="Voz y Conversación Bidireccional"
                  >
                    <BidirectionalWavesIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>
                </>
              ) : (
                /* PRO PLAN FOOTER (POR DEFECTO) */
                <>
                  {/* PRO 1. Cámara OCR ALPR (Glow Verde) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenScanner();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #22c55e, 0 0 20px rgba(34, 197, 94, 0.45)',
                    }}
                    title="Escanear matrícula OCR ALPR"
                  >
                    <Camera strokeWidth={1.3} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* PRO 2. Avisos (Glow Ámbar / Rojo) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenNotifications();
                      }
                    }}
                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: unreadNotificationsCount > 0 
                        ? '0 0 12px #f43f5e, 0 0 24px rgba(244, 63, 94, 0.6)' 
                        : '0 0 10px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.45)',
                    }}
                    title="Avisos del Sistema"
                  >
                    <AvisosNotificationIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full border border-[#0F172A]">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* PRO 3. MENÚ + (Glow Rosa) */}
                  <button
                    onClick={onOpenMenu}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #ec4899, 0 0 20px rgba(236, 72, 153, 0.45)',
                    }}
                    title="Mostrar todos los botones en nueva pantalla (+)"
                  >
                    <Plus strokeWidth={2} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>

                  {/* PRO 4. Metis AI (Glow Naranja) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenMetisChat();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #f97316, 0 0 20px rgba(249, 115, 22, 0.45)',
                    }}
                    title="Asistente Metis IA"
                  >
                    <span className="font-normal tracking-tighter font-sans text-xl sm:text-2xl text-white leading-none select-none">
                      AI
                    </span>
                  </button>

                  {/* PRO 5. Voz Bidireccional (Glow Morado) */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsLoginModalOpen(true);
                      } else {
                        onOpenVoiceAssistant();
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shrink-0 text-white"
                    style={{
                      border: '1px solid #ffffff',
                      boxShadow: '0 0 10px #a855f7, 0 0 20px rgba(168, 85, 247, 0.45)',
                    }}
                    title="Voz y Conversación Bidireccional"
                  >
                    <BidirectionalWavesIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          PANTALLA 2: SECCIÓN LANDING DE TARJETAS Y VERSIÓN (Haciendo Scroll Down)
         ========================================================================= */}
      <section 
        id="seccion-tarjetas" 
        className="relative z-20 w-full min-h-screen py-6 sm:py-10 lg:py-8 xl:py-12 px-3 sm:px-6 lg:px-8 bg-neutral-950 backdrop-blur-2xl border-t border-neutral-800/80 flex flex-col items-center justify-center snap-start"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center">
          
          {/* GRID DE LAS 4 TARJETAS DE VERSIONES (4 columnas en PC y Tablet Landscape) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 w-full mb-8 lg:mb-10 xl:mb-12 items-stretch">
            {PLANS_CONFIG.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              return (
                <motion.div 
                  key={plan.id} 
                  style={{ y: cardParallaxMap[plan.id] }}
                  className="relative group flex flex-col h-full"
                >
                  {/* Aura / Resplandor 3D ambiental posterior bien visible */}
                  <div className={`absolute -inset-2 rounded-3xl blur-3xl transition-all duration-500 pointer-events-none ${
                    isCurrent 
                      ? 'bg-gradient-to-tr from-sky-500/50 via-cyan-400/35 to-blue-600/45 opacity-100 scale-100 group-hover:scale-105' 
                      : 'bg-gradient-to-tr from-slate-600/35 via-sky-500/30 to-slate-700/35 opacity-50 group-hover:opacity-100 group-hover:scale-105'
                  }`} />

                  {/* Sombra de suelo / levitación proyectada al elevarse */}
                  <div className="absolute -bottom-3 left-6 right-6 h-3 bg-black/90 blur-md rounded-full opacity-0 group-hover:opacity-80 transition-all duration-500 pointer-events-none" />

                  {/* Tarjeta principal optimizada para PC / Tablet Landscape */}
                  <div 
                    onClick={() => handleSelectVersionCard(plan.id)}
                    className={`relative rounded-2xl p-4 sm:p-5 lg:p-4 xl:p-6 flex flex-col justify-between transition-all duration-500 ease-out border cursor-pointer group-hover:-translate-y-2 lg:group-hover:-translate-y-2.5 h-full ${
                      isCurrent 
                        ? 'bg-neutral-950/95 border-sky-400 ring-1 ring-sky-400/40 shadow-[0_12px_30px_rgba(0,0,0,0.85)] group-hover:shadow-[0_25px_50px_rgba(56,189,248,0.25)]' 
                        : 'bg-neutral-950/95 border-slate-700/90 group-hover:border-sky-400/70 shadow-[0_12px_30px_rgba(0,0,0,0.85)] group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.95)]'
                    }`}
                  >
                    <div>
                      {/* Header de la tarjeta con icono de línea 1px sin relleno */}
                      <div className="flex items-center justify-between mb-3 lg:mb-3">
                        <div className="p-2 lg:p-2.5 rounded-xl bg-neutral-900/90 border border-slate-800 flex items-center justify-center shrink-0">
                          {PLAN_OUTLINE_ICONS[plan.id]}
                        </div>
                        <span className={`text-[11px] sm:text-xs xl:text-xs font-extralight uppercase tracking-[0.18em] px-2.5 py-1 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400/70'
                            : 'bg-neutral-900 text-neutral-300 border-slate-700 group-hover:border-slate-600'
                        }`}>
                          {plan.badge}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl lg:text-2xl xl:text-3xl font-extralight text-white tracking-[0.2em] uppercase mb-2">
                        {plan.label}
                      </h3>
                      <p className="text-xs sm:text-sm lg:text-xs xl:text-sm text-neutral-300 leading-relaxed min-h-[36px] sm:min-h-[44px] mb-3 lg:mb-4 font-light">
                        {plan.desc}
                      </p>

                      {/* Lista de características */}
                      <ul className="space-y-1.5 sm:space-y-2 mb-3 lg:mb-4 border-t border-slate-800 pt-3 lg:pt-3">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs xl:text-sm text-neutral-200 font-light">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Acciones de la tarjeta */}
                    <div className="space-y-2 pt-3 border-t border-slate-800 mt-auto" onClick={(e) => e.stopPropagation()}>
                      {/* Botón Registro de Usuario */}
                      <button
                        type="button"
                        onClick={() => handleRegisterPlan(plan.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 text-[11px] xl:text-xs font-extralight uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 hover:border-slate-500"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Registro</span>
                      </button>

                      {/* Botón Seleccionar / Versión Activa */}
                      <button
                        type="button"
                        onClick={() => handleSelectVersionCard(plan.id)}
                        className={`w-full py-2.5 px-3 rounded-xl text-[11px] xl:text-xs font-extralight uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isCurrent
                            ? 'bg-sky-500/10 text-sky-300 border-sky-400/70'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'Versión Activa' : 'Seleccionar Versión'}</span>
                      </button>

                      {/* Botón Descarga */}
                      <button
                        type="button"
                        onClick={handleDownloadApp}
                        className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/50 text-emerald-400 text-[11px] xl:text-xs font-extralight uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Descargar App</span>
                      </button>
                    </div>

                    {/* Línea inferior de 1px con punto/haz luminoso (glow) para la versión activa */}
                    {isCurrent && (
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400 to-transparent pointer-events-none rounded-b-2xl overflow-visible">
                        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 sm:w-20 h-[2px] bg-sky-300 rounded-full blur-[1.5px] shadow-[0_0_12px_#38bdf8]" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* TARJETA DESTACADA CON PARALLAX: ÁREA DE CLIENTES */}
          <motion.div 
            style={{ y: yCustomerArea }}
            className="relative w-full max-w-7xl mb-6 lg:mb-8 group"
          >
            {/* Aura 3D trasera Área de Clientes */}
            <div className="absolute -inset-1 rounded-3xl bg-indigo-500/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

            <div className="relative w-full bg-neutral-950/95 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 sm:p-6 lg:p-6 xl:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-slate-700 text-sky-400 text-xs font-extralight uppercase tracking-[0.2em]">
                  <Globe className="w-4 h-4" />
                  <span>Portal Web de Área de Clientes</span>
                </div>
                <p className="text-neutral-300 text-xs sm:text-sm lg:text-sm max-w-3xl leading-relaxed font-light">
                  Al área de clientes se accede mediante un enlace enviado tras ser invitado o desde la aplicación introduciendo tu email junto con el DNI/CIF o matrícula del vehículo.
                </p>
              </div>

              <a
                href="https://www.clientes-gestarian.web.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-sky-400/60 text-sky-300 font-extralight rounded-xl text-xs uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>Acceder al Área de Clientes</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* BOTONES FINALES AL FINAL DE LA PÁGINA CON PARALLAX */}
          <motion.div 
            style={{ y: yBottomActions }}
            className="relative w-full max-w-4xl group"
          >
            {/* Aura 3D trasera Botones */}
            <div className="absolute -inset-1 rounded-3xl bg-slate-700/15 blur-xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />

            <div className="relative w-full bg-neutral-950/95 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              
              {/* Botón Login */}
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsLoginModalOpen(true);
                  } else {
                    const pageInicio = document.getElementById('page-inicio');
                    pageInicio?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-extralight text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 hover:border-slate-500"
              >
                <LogIn className="w-4 h-4 text-sky-400" />
                <span>{isAuthenticated ? 'Sesión Iniciada' : 'Iniciar Sesión'}</span>
              </button>

              {/* Botón Registro */}
              <button
                type="button"
                onClick={() => handleRegisterPlan(currentPlan)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-sky-300 font-extralight text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-500/50 hover:border-sky-400"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registro de Usuario</span>
              </button>

              {/* Botón Descarga */}
              <button
                type="button"
                onClick={handleDownloadApp}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-400 font-extralight text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500/50 hover:border-emerald-400"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Aplicación</span>
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* MODAL MÁS INFORMACIÓN PLAN (Textos x1.5) */}
      {selectedPlanDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-7 max-w-xl w-full text-white space-y-5 relative shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setSelectedPlanDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold p-2"
            >
              ✕
            </button>

            {(() => {
              const info = PLANS_CONFIG.find(p => p.id === selectedPlanDetails);
              if (!info) return null;
              return (
                <>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-neutral-950 border border-slate-700 flex items-center justify-center shrink-0">
                      {PLAN_OUTLINE_ICONS[info.id]}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-wider">{info.label}</h3>
                      <p className="text-sm text-sky-400 font-bold uppercase mt-0.5">{info.badge}</p>
                    </div>
                  </div>

                  <p className="text-base text-slate-200 leading-relaxed">{info.desc}</p>

                  <div className="space-y-3 border-t border-slate-800 pt-4">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Incluye:</p>
                    <ul className="space-y-2.5">
                      {info.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-200">
                          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => {
                        handleRegisterPlan(info.id);
                        setSelectedPlanDetails(null);
                      }}
                      className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider cursor-pointer"
                    >
                      Seleccionar / Registrar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL REGISTRO CONFIRMADO */}
      {showRegisterSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-md w-full text-white space-y-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-white">
              Versión {currentPlan.toUpperCase()} Seleccionada
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Has seleccionado la versión <strong className="text-emerald-400">{currentPlan.toUpperCase()}</strong> de GESTARIAN. Puedes continuar utilizando la versión o descargar el instalador directo.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDownloadApp}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Descargar Instalador Ahora
              </button>
              <button
                onClick={() => setShowRegisterSuccessModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INICIO DE SESIÓN / ACCESO */}
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
