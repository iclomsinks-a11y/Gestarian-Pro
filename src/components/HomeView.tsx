import React, { useState } from 'react';
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

// Iconos minimalistas en líneas de 1px sin relleno para las 4 versiones
const PLAN_OUTLINE_ICONS: Record<GestarianPlan, React.ReactNode> = {
  lite: <Globe className="w-8 h-8 text-slate-200" strokeWidth={1} />,
  quick: <Zap className="w-8 h-8 text-sky-400" strokeWidth={1} />,
  pro: <Gem className="w-8 h-8 text-emerald-400" strokeWidth={1} />,
  enterprise: <Building2 className="w-8 h-8 text-indigo-400" strokeWidth={1} />
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
    label: 'LITE', 
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
    label: 'QUICK', 
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
    label: 'PRO', 
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
    label: 'ENTERPRISE', 
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
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<GestarianPlan | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClientLoginModalOpen, setIsClientLoginModalOpen] = useState(false);
  const [clientEmailInput, setClientEmailInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientLoginError, setClientLoginError] = useState('');

  const activePlanConfig = PLANS_CONFIG.find(p => p.id === currentPlan) || PLANS_CONFIG[2];
  const usernameOnly = currentUser.email 
    ? currentUser.email.split('@')[0] 
    : (currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Usuario');

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
      // Cliente invitado o de paso
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

  return (
    <div
      className="relative w-screen min-w-full min-h-[100dvh] bg-[#090D16] text-slate-100 overflow-y-auto overflow-x-hidden"
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

      {/* CONTENIDO PRINCIPAL EN LANDING ÚNICA Y DIRECTA */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-6 sm:gap-8">
        
        {/* =========================================================================
            HEADER LIMPIO Y MINIMALISTA: GESTARIAN + ACCESO CLIENTES + LOGIN + REGISTRO
           ========================================================================= */}
        <header className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 gap-3 flex-wrap sm:flex-nowrap">
          
          {/* Logo y Selector de Plan Directo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                id="btn-home-plan-switcher"
                type="button"
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white cursor-pointer transition-all"
                title="Cambiar versión activa de GESTARIAN"
              >
                <span className="text-sm sm:text-base font-black tracking-[0.2em] uppercase text-white font-mono">
                  GESTARIAN
                </span>
                <span className="text-[10px] sm:text-xs font-bold tracking-wider px-2 py-0.5 rounded-md uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {activePlanConfig.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Menú desplegable para cambiar plan */}
              {isPlanDropdownOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 w-72 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cambiar Versión de GESTARIAN
                  </div>
                  {PLANS_CONFIG.map((p) => {
                    const isSelected = p.id === currentPlan;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPlan?.(p.id);
                          setIsPlanDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-500/20 text-white font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">{p.label}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              isSelected ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BOTONES DIRECTOS: ACCESO CLIENTES | INICIAR SESIÓN | REGISTRO */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            
            {/* 1. Botón Acceso a Clientes */}
            <button
              id="btn-landing-clientes"
              type="button"
              onClick={() => setIsClientLoginModalOpen(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-400/40 text-indigo-300 hover:text-indigo-200 text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Acceso exclusivo para Clientes del taller"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Área Clientes</span>
            </button>

            {/* 2. Botón Iniciar Sesión / Usuario */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-300 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl select-none flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>{usernameOnly}</span>
                </span>

                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={onOpenNotifications}
                    className="relative p-2 bg-slate-900 rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Avisos pendientes"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-landing-login"
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 sm:px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-sky-400/40 text-sky-300 hover:text-white text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Acceso para usuarios registrados"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span>Iniciar Sesión</span>
              </button>
            )}

            {/* 3. Botón Registro */}
            <button
              id="btn-landing-registro"
              type="button"
              onClick={() => {
                if (onOpenNewUser) {
                  onOpenNewUser();
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
              title="Crear nueva cuenta / Registro de empresa o autónomo"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registro</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            BARRA DE TRABAJO DIRECTA: RELOJ CASIO + ACCIONES RÁPIDAS SEGÚN EL PLAN
           ========================================================================= */}
        <section className="w-full flex flex-col items-center justify-center gap-4 py-2">
          {/* Reloj Casio Vintage */}
          <div className="w-full max-w-2xl mx-auto">
            <CasioVintageClock 
              isLightBackground={false} 
              fiscalAddress={currentUser.fiscalAddress} 
            />
          </div>

          {/* Avisos de Presupuestos / Notificaciones si existen */}
          {isAuthenticated && pendingBudgetReviews.length > 0 && (
            <div className="w-full max-w-lg mx-auto space-y-2">
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

          {/* ICONOS DE ACCIÓN RÁPIDA DE LA VERSIÓN ACTIVA (Acceso Inmediato sin pantalla intermedia) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 w-full max-w-xl mx-auto flex-wrap pt-2">
            {currentPlan === 'quick' ? (
              <>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else if (onNewInvoice) onNewInvoice();
                    else onNavigateSection?.('page-facturacion');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  title="Nueva Factura"
                >
                  <Calculator className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onNavigateSection?.('page-clientes');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                  title="Clientes"
                >
                  <Users className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onNavigateSection?.('page-proveedores');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  title="Proveedores"
                >
                  <Truck className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onNavigateSection?.('page-balances');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-violet-400/80 shadow-[0_0_12px_rgba(139,92,246,0.35)]"
                  title="Balances"
                >
                  <PieChart className="w-6 h-6 text-violet-400" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onNavigateSection?.('page-configuracion');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-slate-500 shadow-[0_0_12px_rgba(156,163,175,0.25)]"
                  title="Configuración"
                >
                  <Settings className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                </button>
              </>
            ) : currentPlan === 'lite' ? (
              <>
                <button
                  onClick={() => {
                    if (onNewBudget) onNewBudget();
                    else onNavigateSection?.('page-presupuestos');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  title="Crear Presupuesto A4 Directo"
                >
                  <FileText className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => {
                    if (onNewInvoice) onNewInvoice();
                    else onNavigateSection?.('page-facturacion');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                  title="Crear Factura A4 Directa"
                >
                  <Calculator className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
                </button>
              </>
            ) : currentPlan === 'enterprise' ? (
              <>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onOpenScanner();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.35)]"
                  title="Escanear Matrícula OCR ALPR"
                >
                  <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.4} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else if (onOpenEnterpriseAeat) onOpenEnterpriseAeat();
                    else onNavigateSection?.('page-configuracion');
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.35)]"
                  title="Sede Electrónica AEAT"
                >
                  <Building2 className="w-6 h-6 text-indigo-400" strokeWidth={1.4} />
                </button>
                <button
                  onClick={onOpenMenu}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                  title="Menú de Secciones (+)"
                >
                  <Plus className="w-6 h-6 text-pink-400" strokeWidth={2} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onOpenMetisChat();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  title="Asistente Metis IA"
                >
                  <span className="font-bold text-lg text-amber-400">AI</span>
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onOpenVoiceAssistant();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                  title="Voz y Conversación Bidireccional"
                >
                  <BidirectionalWavesIcon className="w-6 h-6 text-purple-400" />
                </button>
              </>
            ) : (
              // DEFAULT PRO
              <>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onOpenScanner();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.35)]"
                  title="Escanear Matrícula OCR ALPR"
                >
                  <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.4} />
                </button>
                <button
                  onClick={onOpenMenu}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                  title="Menú de Secciones (+)"
                >
                  <Plus className="w-6 h-6 text-pink-400" strokeWidth={2} />
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onOpenMetisChat();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  title="Asistente Metis IA"
                >
                  <span className="font-bold text-lg text-amber-400">AI</span>
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) setIsLoginModalOpen(true);
                    else onOpenVoiceAssistant();
                  }}
                  className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                  title="Voz y Conversación Bidireccional"
                >
                  <BidirectionalWavesIcon className="w-6 h-6 text-purple-400" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* =========================================================================
            LAS CUATRO TARJETAS DE VERSIONES: INFORMACIÓN ACTUALIZADA Y ACCESO DIRECTO
           ========================================================================= */}
        <section className="w-full pt-4">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.15em] text-white">
              Versiones y Planes GESTARIAN
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
              Elige tu versión para acceder directamente a la aplicación o crear tu cuenta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 w-full items-stretch">
            {PLANS_CONFIG.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              return (
                <div 
                  key={plan.id}
                  className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 border ${
                    isCurrent 
                      ? 'bg-slate-900/90 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/50' 
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-xl'
                  }`}
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {PLAN_OUTLINE_ICONS[plan.id]}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isCurrent
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white tracking-wider uppercase mb-1">
                      {plan.label}
                    </h3>
                    
                    <p className="text-xs text-slate-300 leading-relaxed min-h-[48px] mb-4 font-light">
                      {plan.desc}
                    </p>

                    {/* Características detalladas */}
                    <ul className="space-y-2 mb-4 border-t border-slate-800/80 pt-3">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Acciones directas de la tarjeta */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/80 mt-auto">
                    {/* Botón Entrar / Seleccionar */}
                    <button
                      type="button"
                      onClick={() => handleSelectPlanDirect(plan.id)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isCurrent
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Versión Activa' : `Entrar a ${plan.label}`}</span>
                    </button>

                    {/* Botón Registro para el Plan */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPlan?.(plan.id);
                        if (onOpenNewUser) {
                          onOpenNewUser();
                        } else {
                          setIsLoginModalOpen(true);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800 hover:border-slate-600"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                      <span>Registro en {plan.label}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            BANNER DESTACADO: ACCESO AL PORTAL DE CLIENTES
           ========================================================================= */}
        <section className="w-full pt-2 pb-6">
          <div className="w-full bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 text-white flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                <span>Portal de Clientes Gestarian</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed font-light">
                Consulta el estado de tu vehículo en tiempo real, revisa presupuestos oficiales, autoriza reparaciones y descarga tus facturas con total comodidad introduciendo tu Email o DNI/CIF/Matrícula.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setIsClientLoginModalOpen(true)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Users className="w-4 h-4" />
                <span>Acceder como Cliente</span>
              </button>

              <a
                href="https://www.clientes-gestarian.web.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                title="Abrir portal web independiente"
              >
                <span>Web Externa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

      </div>

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

            {/* Acceso rápido a clientes registrados del taller */}
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
