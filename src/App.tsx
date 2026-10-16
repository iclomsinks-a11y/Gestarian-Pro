import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { TierCards } from './components/TierCards';
import { DocumentList } from './components/DocumentList';
import { NewUserModal } from './components/NewUserModal';
import { CreateDocumentModal } from './components/CreateDocumentModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { DocumentDispatchModal } from './components/DocumentDispatchModal';
import { ClientAreaModal } from './components/ClientAreaModal';
import { FiscalReportsModal } from './components/FiscalReportsModal';
import { AgendaModal } from './components/AgendaModal';
import { SpecModal } from './components/SpecModal';
import { PlateScannerModal } from './components/PlateScannerModal';

import { HomeView } from './components/HomeView';
import { NavigationMenu } from './components/NavigationMenu';
import { ExpedientesView } from './components/ExpedientesView';
import { PlaceholderView } from './components/PlaceholderView';
import { FacturacionView } from './components/FacturacionView';
import { BalancesView } from './components/BalancesView';
import { SolicitudesView } from './components/SolicitudesView';
import { ClientesCardsView } from './components/ClientesCardsView';
import { CitasView } from './components/CitasView';
import { TallerCardsView } from './components/TallerCardsView';
import { ProveedoresView } from './components/ProveedoresView';
import { IncidenciasView } from './components/IncidenciasView';
import { ConfiguracionView } from './components/ConfiguracionView';
import { FullScreenClientForm } from './components/FullScreenClientForm';
import { WorkOrdersModal } from './components/WorkOrdersModal';
import { NotificationsModal } from './components/NotificationsModal';
import { MetisChatModal } from './components/MetisChatModal';
import { MetisVoiceAssistantModal } from './components/MetisVoiceAssistantModal';
import { ImageCustomizerModal } from './components/ImageCustomizerModal';
import { ClientAppLandingModal } from './components/ClientAppLandingModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { ClientPortalLoginView } from './components/ClientPortalLoginView';
import { DetectedInvoicesModal } from './components/DetectedInvoicesModal';
import { IntroAnimation } from './components/IntroAnimation';
import { PageLayoutWrapper } from './components/PageLayoutWrapper';
import { RoadmapTracker } from './components/RoadmapTracker';
import { ExpedienteDatosModal } from './components/ExpedienteDatosModal';
import { MiEquipoView } from './components/MiEquipoView';
import { EnterpriseAeatModal } from './components/EnterpriseAeatModal';
import { QuickExtrasModal } from './components/QuickExtrasModal';
import { googleSignIn, getAccessToken } from './firebase';
import { scanGmailForInvoices } from './services/gmailScannerService';
import { generateDocumentPdf } from './services/pdfGenerator';
import {
  AppUser,
  Client,
  Employee,
  GestarianDocument,
  Appointment,
  DocumentType,
  SystemConfig,
  InternalNotification,
  WorkOrderStatus,
  GestarianPlan,
} from './types';
import {
  getStoredUser,
  saveStoredUser,
  getStoredClients,
  saveStoredClients,
  getStoredDocuments,
  saveStoredDocuments,
  getStoredAppointments,
  saveStoredAppointments,
  getStoredNotifications,
  saveStoredNotifications,
  getNextDocumentNumber,
  getExpedienteFromDocNumber,
} from './services/storage';
import { fetchSystemConfig } from './services/plateRecognizerService';
import { syncClientToSupabase } from './services/supabaseClient';
import { playGentleChime } from './utils/audioNotification';
import { ShieldCheck, FolderOpen } from 'lucide-react';

const PAGES = [
  'page-inicio',
  'page-expedientes',
  'page-solicitudes',
  'page-clientes',
  'page-presupuestos',
  'page-citas',
  'page-taller',
  'page-facturacion',
  'page-balances',
  'page-proveedores',
  'page-equipo',
  'page-incidencias',
  'page-configuracion'
];

export default function App() {
  // Estado principal persistente
  const [user, setUser] = useState<AppUser>(getStoredUser);
  const [targetExpedienteId, setTargetExpedienteId] = useState<string | null>(null);
  const [isExpedienteRoadmapOpen, setIsExpedienteRoadmapOpen] = useState<boolean>(false);
  const [activeExpedientePlate, setActiveExpedientePlate] = useState<string | null>(null);
  const [targetClientId, setTargetClientId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>(getStoredClients);
  const [documents, setDocuments] = useState<GestarianDocument[]>(getStoredDocuments);
  const [appointments, setAppointments] = useState<Appointment[]>(getStoredAppointments);
  const [notifications, setNotifications] = useState<InternalNotification[]>(getStoredNotifications);

  // Detección y conmutación entre las 4 versiones: ?plan=lite|quick|pro|enterprise o almacenamiento
  const [currentTier, setCurrentTier] = useState<GestarianPlan>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPlan = params.get('plan')?.toLowerCase();
      if (urlPlan === 'lite' || urlPlan === 'quick' || urlPlan === 'pro' || urlPlan === 'enterprise') {
        return urlPlan as GestarianPlan;
      }
    }
    return (user.currentTier as GestarianPlan) || 'pro';
  });

  const [isEnterpriseAeatOpen, setIsEnterpriseAeatOpen] = useState(false);
  const [isQuickExtrasOpen, setIsQuickExtrasOpen] = useState(false);

  // Sincronizar parámetro ?plan= en URL si no existe
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('plan')) {
        const url = new URL(window.location.href);
        url.searchParams.set('plan', currentTier);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [currentTier]);

  const handleSelectPlan = (plan: GestarianPlan) => {
    setCurrentTier(plan);
    setUser((prev) => {
      const next = { ...prev, currentTier: plan };
      saveStoredUser(next);
      return next;
    });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('plan', plan);
      window.history.replaceState({}, '', url.toString());
    }
    showToast(`Conmutado a GESTARIAN ${plan.toUpperCase()}`);
    if (plan === 'lite') {
      const current = screenHistory[screenHistory.length - 1];
      if (
        current !== 'page-inicio' &&
        current !== 'page-presupuestos' &&
        current !== 'page-facturacion' &&
        current !== 'page-configuracion'
      ) {
        navigateToSection('page-presupuestos');
      }
    } else if (plan === 'quick') {
      const current = screenHistory[screenHistory.length - 1];
      if (
        current !== 'page-inicio' &&
        current !== 'page-clientes' &&
        current !== 'page-proveedores' &&
        current !== 'page-balances' &&
        current !== 'page-configuracion'
      ) {
        navigateToSection('page-clientes');
      }
    }
  };

  // Landing pública — visible cuando el usuario no ha configurado la app
  const isUserConfigured = Boolean(user.fullName && user.fullName.trim().length > 2);
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Configuración del Sistema (GitHub repo, API Plate Recognizer)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    githubRepoUrl: 'https://github.com/iclomsinks-a11y/GESTARIAN-AIS',
    hasPlateRecognizerKey: false,
    hasResendKey: false,
  });

  // Modales
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isNewClientFullScreenOpen, setIsNewClientFullScreenOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [budgetSearchFilter, setBudgetSearchFilter] = useState<string>('');
  const [clientExpedienteFilter, setClientExpedienteFilter] = useState<string | null>(null);
  const [clientFacturacionFilter, setClientFacturacionFilter] = useState<string | null>(null);
  const [isClientAreaOpen, setIsClientAreaOpen] = useState(false);
  const [isFiscalReportsOpen, setIsFiscalReportsOpen] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isWorkOrdersOpen, setIsWorkOrdersOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [isPlateScannerOpen, setIsPlateScannerOpen] = useState(false);
  const [isMetisChatOpen, setIsMetisChatOpen] = useState(false);
  const [isMetisVoiceOpen, setIsMetisVoiceOpen] = useState(false);
  const [loggedClientSession, setLoggedClientSession] = useState<Client | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('gestarian_logged_client');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loggedEmployeeSession, setLoggedEmployeeSession] = useState<Employee | null>(null);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);

  // Autenticación unificada de acceso (Email + Contraseña)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasPassword = Boolean(localStorage.getItem('gestarian_auth_password'));
    const sessionActive = localStorage.getItem('gestarian_auth_session') === 'true';
    return sessionActive && hasPassword;
  });

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    showToast(`Acceso concedido para ${email}`);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gestarian_auth_session');
    }
    setIsAuthenticated(false);
    showToast('Sesión cerrada y acceso bloqueado');
    const el = document.getElementById('page-inicio');
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setScreenHistory(['page-inicio']);
  };

  // Envío oficial (WhatsApp / Correo) con URL corta
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchModalDoc, setDispatchModalDoc] = useState<GestarianDocument | null>(null);

  // Creación y Visualización de Documentos
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [createDocType, setCreateDocType] = useState<DocumentType>('presupuesto');
  const [budgetToConvert, setBudgetToConvert] = useState<GestarianDocument | null>(null);
  const [preselectedClientIdForNewDoc, setPreselectedClientIdForNewDoc] = useState<string | null>(null);

  // Inicialización inmediata de documento si se accede desde un enlace de WhatsApp (/d/..., /doc/..., ?data=...)
  const initialUrlDocInfo = React.useMemo(() => {
    if (typeof window === 'undefined') return { doc: null, isClient: false };
    const pathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    let viewParam = params.get('view');
    let idParam = params.get('id');

    if (!viewParam && pathname) {
      if (pathname.includes('/doc/')) {
        viewParam = 'doc';
        idParam = pathname.split('/doc/')[1].split('/')[0].split('?')[0];
      } else if (pathname.includes('/d/')) {
        viewParam = 'doc';
        idParam = pathname.split('/d/')[1].split('/')[0].split('?')[0];
      } else if (pathname.includes('/p/')) {
        viewParam = 'doc';
        idParam = pathname.split('/p/')[1].split('/')[0].split('?')[0];
      }
    }

    if (viewParam === 'doc' && idParam) {
      const cleanId = decodeURIComponent(idParam).trim().toUpperCase();
      const dataParam = params.get('data');
      if (dataParam) {
        try {
          const jsonStr = decodeURIComponent(atob(decodeURIComponent(dataParam)));
          const parsed = JSON.parse(jsonStr);
          if (parsed && (parsed.n || parsed.e)) {
            const parsedDoc: GestarianDocument = {
              id: `doc_${parsed.n || cleanId}`,
              number: parsed.n || cleanId,
              series: '2026',
              type: parsed.t || (cleanId.startsWith('F') ? 'factura' : 'presupuesto'),
              date: parsed.dt || new Date().toISOString().split('T')[0],
              dueDate: parsed.dt || new Date().toISOString().split('T')[0],
              issuerId: user.id,
              issuerName: user.fullName || 'Taller',
              issuerCif: user.cif || '',
              issuerAddress: user.fiscalAddress || '',
              issuerPhone: user.phone || '',
              issuerEmail: user.email || '',
              clientId: 'cli_url',
              clientName: parsed.cn || 'Cliente',
              clientCif: parsed.cc || '',
              clientAddress: parsed.ca || '',
              clientPhone: parsed.cp || '',
              clientEmail: parsed.ce || '',
              items: Array.isArray(parsed.items) && parsed.items.length > 0
                ? parsed.items.map((it: any, index: number) => ({
                    id: it.id || String(index + 1),
                    description: it.d || 'Concepto de taller',
                    quantity: Number(it.q) || 1,
                    unitPrice: Number(it.u) || 0,
                    amount: Number(it.a) || 0,
                  }))
                : [
                    {
                      id: '1',
                      description: 'Servicio de taller / reparación',
                      quantity: 1,
                      unitPrice: Number(parsed.tot) || 100,
                      amount: Number(parsed.tot) || 100,
                    },
                  ],
              subtotal: Number(parsed.sub) || Number(parsed.tot) || 0,
              applyIva: true,
              ivaRate: 21,
              ivaAmount: Number(parsed.iva) || 0,
              applyIrpf: false,
              irpfRate: 0,
              irpfAmount: 0,
              total: Number(parsed.tot) || 0,
              status: 'enviado',
              isLocked: false,
              expediente: parsed.e || `E26${(cleanId.replace(/\D/g, '') || '0001').slice(-4).padStart(4, '0')}`,
              vehiclePlate: parsed.vp || '',
              vehicleBrand: parsed.vb || '',
              vehicleModel: parsed.vm || '',
              vehicleDeliveryDate: parsed.vd || '',
              notes: parsed.notes || '',
            };
            return { doc: parsedDoc, isClient: true };
          }
        } catch (e) {}
      }
    }
    return { doc: null, isClient: false };
  }, [user]);

  const [isViewDocOpen, setIsViewDocOpen] = useState<boolean>(() => Boolean(initialUrlDocInfo.doc));
  const [selectedDoc, setSelectedDoc] = useState<GestarianDocument | null>(() => initialUrlDocInfo.doc);
  const [isClientDocViewMode, setIsClientDocViewMode] = useState<boolean>(() => initialUrlDocInfo.isClient);
  const [agendaBudgetTrigger, setAgendaBudgetTrigger] = useState<GestarianDocument | null>(null);

  // Notificación global breve sin animación y con sonido suave
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, duration = 3500) => {
    playGentleChime();
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(''), duration);
  };

  // Cargar configuración de servidor (Plate Recognizer, GitHub repo)
  useEffect(() => {
    fetchSystemConfig().then((cfg) => {
      setSystemConfig(cfg);
    });
  }, []);

  // Garantizar que al iniciar o tras la animación de intro se muestre siempre la portada de inicio (page-inicio)
  useEffect(() => {
    if (!showIntro) {
      setScreenHistory(['page-inicio']);
      const resetToHome = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = 0;
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'instant' as any });
        }
        const el = document.getElementById('page-inicio');
        if (el) {
          el.scrollIntoView({ behavior: 'instant' as any, inline: 'start', block: 'nearest' });
          el.scrollTop = 0;
        }
      };
      resetToHome();
      const t1 = setTimeout(resetToHome, 50);
      const t2 = setTimeout(resetToHome, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [showIntro]);

  // Estados para selección de cliente para presupuesto y rastreo de facturas
  const [isSelectingClientForBudget, setIsSelectingClientForBudget] = useState<boolean>(false);
  const [detectedInvoices, setDetectedInvoices] = useState<GestarianDocument[]>(() => {
    try {
      const stored = localStorage.getItem('gestarian_detected_invoices_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [isDetectedInvoicesOpen, setIsDetectedInvoicesOpen] = useState<boolean>(false);
  const [hasAutoDetectedInvoices, setHasAutoDetectedInvoices] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('gestarian_detected_invoices_v1');
      if (stored && JSON.parse(stored).length > 0) return true;
      const storedDocs = localStorage.getItem('gestarian_documents');
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        return parsed.some((d: any) => 
          d.isFromGmail || 
          d.notes?.includes('Gmail') || 
          d.items?.some((it: any) => it.description?.includes('Factura extraída de email'))
        );
      }
    } catch (e) {}
    return false;
  });
  const [isScanningInvoices, setIsScanningInvoices] = useState<boolean>(false);
  const [scanButtonStatus, setScanButtonStatus] = useState<'idle' | 'scanning' | 'detected' | 'not_found'>(() => {
    try {
      const stored = localStorage.getItem('gestarian_detected_invoices_v1');
      if (stored && JSON.parse(stored).length > 0) return 'detected';
    } catch (e) {}
    return 'idle';
  });
  const [facturacionInitialTab, setFacturacionInitialTab] = useState<'emitidas' | 'recibidas'>('emitidas');

  const handleViewDetectedInvoices = () => {
    setIsDetectedInvoicesOpen(true);
  };

  const handleIncorporateDetectedInvoice = (doc: GestarianDocument) => {
    const incorporatedDoc: GestarianDocument = {
      ...doc,
      status: 'confirmada',
      type: 'factura_recibida',
      expediente: undefined, // Las facturas recibidas NUNCA generan expediente
    };
    setDocuments(prev => [incorporatedDoc, ...prev.filter(d => d.id !== doc.id && d.number !== doc.number)]);
    setDetectedInvoices(prev => {
      const next = prev.filter(d => d.id !== doc.id && d.number !== doc.number);
      localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(next));
      if (next.length === 0) {
        setScanButtonStatus('idle');
        setHasAutoDetectedInvoices(false);
      }
      return next;
    });
  };

  const handleRejectDetectedInvoice = (docId: string) => {
    setDetectedInvoices(prev => {
      const next = prev.map(d => d.id === docId ? { ...d, status: 'rechazada' as any } : d);
      localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteDetectedInvoice = (docId: string) => {
    setDetectedInvoices(prev => {
      const next = prev.filter(d => d.id !== docId);
      localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(next));
      if (next.length === 0) {
        setScanButtonStatus('idle');
        setHasAutoDetectedInvoices(false);
      }
      return next;
    });
  };

  const handleTriggerExtraScan = async () => {
    if (isScanningInvoices || scanButtonStatus === 'scanning') return;
    setIsScanningInvoices(true);
    setScanButtonStatus('scanning');
    showToast('Iniciando rastreo de facturas en Gmail...');

    // Temporizador de seguridad para evitar que la UI quede bloqueada
    const safetyTimeout = setTimeout(() => {
      setIsScanningInvoices(false);
      setScanButtonStatus(prev => prev === 'scanning' ? 'idle' : prev);
    }, 25000);

    try {
      let token = getAccessToken();
      if (!token) {
        // Solicitar autorización de Google si aún no se ha obtenido el token
        const result = await googleSignIn();
        token = result?.accessToken || null;
      }

      let found: GestarianDocument[] = [];

      if (token) {
        found = await scanGmailForInvoices(token);
      } else {
        // Fallback a endpoint de servidor si no hay token directo de cliente
        const res = await fetch('/api/scan-gmail-now');
        if (res.ok) {
          const data = await res.json();
          if (data.invoices && Array.isArray(data.invoices)) {
            found = data.invoices;
          }
        }
      }

      if (found && found.length > 0) {
        setDetectedInvoices((prev) => {
          const prevIds = new Set(prev.map((d) => d.id).concat(prev.map((d) => d.number)));
          const uniqueNew = found.filter((d: GestarianDocument) => !prevIds.has(d.id) && !prevIds.has(d.number));
          const combined = [...uniqueNew, ...prev];
          localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(combined));
          return combined;
        });
        setHasAutoDetectedInvoices(true);
        setScanButtonStatus('detected');
        showToast(`¡Rastreo completado! Se han detectado ${found.length} factura(s)`);
      } else {
        setScanButtonStatus('not_found');
        showToast('Rastreo completado: No se han detectado nuevas facturas');
        // Permanece durante 5 segundos y vuelve a su estado original
        setTimeout(() => {
          setScanButtonStatus(prev => prev === 'not_found' ? 'idle' : prev);
        }, 5000);
      }
    } catch (e: any) {
      console.error('Error al rastrear Gmail:', e);
      setScanButtonStatus('not_found');
      setTimeout(() => {
        setScanButtonStatus(prev => prev === 'not_found' ? 'idle' : prev);
      }, 5000);
      if (e?.code === 'auth/popup-closed-by-user') {
        showToast('Ventana de autorización de Google cerrada');
      } else {
        showToast('Rastreo completado sin incidencias');
      }
    } finally {
      clearTimeout(safetyTimeout);
      setIsScanningInvoices(false);
    }
  };

  // 1. Escaneo al iniciar la aplicación / autenticarse
  useEffect(() => {
    if (!isAuthenticated || currentTier === 'lite' || typeof window === 'undefined') return;
    const runStartupScan = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const found = await scanGmailForInvoices(token);
          if (found && found.length > 0) {
            setDetectedInvoices((prev) => {
              const prevIds = new Set(prev.map((d) => d.id).concat(prev.map((d) => d.number)));
              const uniqueNew = found.filter((d: GestarianDocument) => !prevIds.has(d.id) && !prevIds.has(d.number));
              const combined = [...uniqueNew, ...prev];
              localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(combined));
              return combined;
            });
            setHasAutoDetectedInvoices(true);
            setScanButtonStatus('detected');
            showToast(`¡Se han detectado ${found.length} facturas nuevas en Gmail al iniciar!`);
          }
        } else {
          const scanRes = await fetch('/api/scan-gmail-now');
          if (scanRes.ok) {
            const scanData = await scanRes.json();
            if (scanData.invoices && scanData.invoices.length > 0) {
              setDetectedInvoices((prev) => {
                const prevIds = new Set(prev.map((d) => d.id).concat(prev.map((d) => d.number)));
                const uniqueNew = scanData.invoices.filter((d: GestarianDocument) => !prevIds.has(d.id) && !prevIds.has(d.number));
                const combined = [...uniqueNew, ...prev];
                localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(combined));
                return combined;
              });
              setHasAutoDetectedInvoices(true);
              setScanButtonStatus('detected');
              showToast(`¡Se han detectado ${scanData.invoices.length} facturas nuevas en segundo plano!`);
            }
          }
        }
      } catch (e) {
        // Silencioso en caso de error para no interrumpir el inicio
      }
    };
    // Pequeño retraso para permitir carga fluida de la interfaz inicial tras la animación (15 segundos)
    const timer = setTimeout(runStartupScan, 15000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // 2. Escaneo programado a las horas fijadas (06:00, 10:00, 16:00)
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const scheduledHours = ['06:00', '10:00', '16:00'];
    let lastRanMinute = '';

    const interval = setInterval(async () => {
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (scheduledHours.includes(currentHM) && lastRanMinute !== currentHM) {
        lastRanMinute = currentHM;
        console.log(`[SCHEDULED SCAN] Ejecutando escaneo automático de las ${currentHM}...`);
        try {
          const token = getAccessToken();
          if (token) {
            const found = await scanGmailForInvoices(token);
            if (found && found.length > 0) {
              setDetectedInvoices((prev) => {
                const prevIds = new Set(prev.map((d) => d.id).concat(prev.map((d) => d.number)));
                const uniqueNew = found.filter((d: GestarianDocument) => !prevIds.has(d.id) && !prevIds.has(d.number));
                const combined = [...uniqueNew, ...prev];
                localStorage.setItem('gestarian_detected_invoices_v1', JSON.stringify(combined));
                return combined;
              });
              setHasAutoDetectedInvoices(true);
              setScanButtonStatus('detected');
              showToast(`[${currentHM}] ¡Escaneo programado: ${found.length} nuevas facturas detectadas!`);
            }
          } else {
            await fetch('/api/scan-gmail-now').catch(() => {});
          }
        } catch (err) {
          console.warn('[SCHEDULED SCAN] Error en escaneo programado:', err);
        }
      }
    }, 45000); // Comprobar cada 45 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Manejo automático de enlaces recibidos en WhatsApp / Email y respuesta de Google Auth Popup
  const urlHandledRef = useRef<boolean>(false);

  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        showToast('✅ Conexión con Google completada correctamente');
        try {
          const scanRes = await fetch('/api/scan-gmail-now');
          if (scanRes.ok) {
            const scanData = await scanRes.json();
            if (scanData.invoices && scanData.invoices.length > 0) {
              setDocuments(prev => {
                const prevIds = new Set(prev.map(d => d.id));
                const uniqueNew = scanData.invoices.filter((d: GestarianDocument) => !prevIds.has(d.id));
                return [...prev, ...uniqueNew];
              });
              setHasAutoDetectedInvoices(true);
              showToast(`¡Se han detectado ${scanData.invoices.length} facturas nuevas en Gmail!`);
            }
          }
        } catch (e) {
          console.error("Error post auth scan:", e);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  useEffect(() => {
    const handleNewBudget = () => handleOpenNewBudget();
    const handleNewInvoice = () => handleOpenNewInvoice();
    const handleNavigateSection = (e: any) => {
      if (e?.detail?.sectionId) {
        navigateToSection(e.detail.sectionId);
      }
    };
    window.addEventListener('gestarian_new_budget', handleNewBudget);
    window.addEventListener('gestarian_new_invoice', handleNewInvoice);
    window.addEventListener('gestarian_navigate_section', handleNavigateSection);
    return () => {
      window.removeEventListener('gestarian_new_budget', handleNewBudget);
      window.removeEventListener('gestarian_new_invoice', handleNewInvoice);
      window.removeEventListener('gestarian_navigate_section', handleNavigateSection);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || urlHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    
    // Notificación de éxito de Google Auth
    const googleAuth = params.get('google_auth');
    if (googleAuth === 'success') {
      setTimeout(() => {
        showToast('✅ Conexión con Google completada correctamente');
      }, 500);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname + '?view=configuracion');
    } else if (googleAuth === 'error') {
      const msg = params.get('message') || 'Error desconocido';
      setTimeout(() => {
        showToast(`❌ Error conectando a Google: ${msg}`);
      }, 500);
    }

    let viewParam = params.get('view');
    let idParam = params.get('id');

    // Soporte para enlaces cortos gestairan.com (/doc/P26001, /exp/E26001, /app)
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    if (!viewParam && pathname) {
      if (pathname.includes('/doc/')) {
        viewParam = 'doc';
        idParam = pathname.split('/doc/')[1].split('/')[0].split('?')[0];
      } else if (pathname.includes('/d/')) {
        viewParam = 'doc';
        idParam = pathname.split('/d/')[1].split('/')[0].split('?')[0];
      } else if (pathname.includes('/p/')) {
        viewParam = 'doc';
        idParam = pathname.split('/p/')[1].split('/')[0].split('?')[0];
      } else if (pathname.includes('/exp/')) {
        viewParam = 'expediente';
        idParam = pathname.split('/exp/')[1].split('/')[0].split('?')[0];
      } else if (pathname.includes('/app')) {
        viewParam = 'app-clientes';
      } else if (hostname.includes('clientes-gestarian')) {
        viewParam = 'login-clientes';
      }
    }

    if (!viewParam) return;

    urlHandledRef.current = true;

    if (viewParam === 'doc' && idParam) {
      const cleanId = decodeURIComponent(idParam).trim().toUpperCase();
      const dataParam = params.get('data');

      let decodedDocFromUrl: GestarianDocument | null = null;
      if (dataParam) {
        try {
          const jsonStr = decodeURIComponent(atob(decodeURIComponent(dataParam)));
          const parsed = JSON.parse(jsonStr);
          if (parsed && (parsed.n || parsed.e)) {
            decodedDocFromUrl = {
              id: `doc_${parsed.n || cleanId}`,
              number: parsed.n || cleanId,
              series: '2026',
              type: parsed.t || (cleanId.startsWith('F') ? 'factura' : 'presupuesto'),
              date: parsed.dt || new Date().toISOString().split('T')[0],
              dueDate: parsed.dt || new Date().toISOString().split('T')[0],
              issuerId: user.id,
              issuerName: user.fullName,
              issuerCif: user.cif,
              issuerAddress: user.fiscalAddress,
              issuerPhone: user.phone,
              issuerEmail: user.email,
              clientId: 'cli_url',
              clientName: parsed.cn || 'Cliente',
              clientCif: parsed.cc || '',
              clientAddress: parsed.ca || '',
              clientPhone: parsed.cp || '',
              clientEmail: parsed.ce || '',
              items: Array.isArray(parsed.items) && parsed.items.length > 0
                ? parsed.items.map((it: any, index: number) => ({
                    id: String(index + 1),
                    description: it.d || 'Concepto de taller',
                    quantity: Number(it.q) || 1,
                    unitPrice: Number(it.u) || 0,
                    amount: Number(it.a) || 0,
                  }))
                : [
                    {
                      id: '1',
                      description: 'Servicio de taller / reparación',
                      quantity: 1,
                      unitPrice: Number(parsed.tot) || 100,
                      amount: Number(parsed.tot) || 100,
                    },
                  ],
              subtotal: Number(parsed.sub) || Number(parsed.tot) || 0,
              applyIva: true,
              ivaRate: 21,
              ivaAmount: Number(parsed.iva) || 0,
              applyIrpf: false,
              irpfRate: 0,
              irpfAmount: 0,
              total: Number(parsed.tot) || 0,
              status: 'enviado',
              isLocked: false,
              expediente: parsed.e || `E26${(cleanId.replace(/\D/g, '') || '0001').slice(-4).padStart(4, '0')}`,
              vehiclePlate: parsed.vp || '',
              vehicleBrand: parsed.vb || '',
              vehicleModel: parsed.vm || '',
              vehicleDeliveryDate: parsed.vd || '',
              notes: parsed.notes || '',
            };
          }
        } catch (e) {
          console.error("Error decoding document data from URL:", e);
        }
      }

      // Check freshly from localStorage
      const currentStoredDocs = getStoredDocuments();
      const foundDoc = currentStoredDocs.find(
        (d) =>
          d.number.toUpperCase() === cleanId ||
          d.id.toUpperCase() === cleanId ||
          d.expediente?.toUpperCase() === cleanId
      );

      const fallbackDoc: GestarianDocument = {
        id: `doc_${cleanId}`,
        number: cleanId,
        series: '2026',
        type: cleanId.startsWith('F') ? 'factura' : 'presupuesto',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        issuerId: user.id,
        issuerName: user.fullName,
        issuerCif: user.cif,
        issuerAddress: user.fiscalAddress,
        issuerPhone: user.phone,
        issuerEmail: user.email,
        clientId: 'cli_url',
        clientName: 'Cliente',
        clientCif: '',
        clientAddress: '',
        clientPhone: '',
        clientEmail: '',
        items: [
          {
            id: '1',
            description: 'Servicio de mantenimiento / reparación',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
        subtotal: 100,
        applyIva: true,
        ivaRate: 21,
        ivaAmount: 21,
        applyIrpf: false,
        irpfRate: 0,
        irpfAmount: 0,
        total: 121,
        status: 'enviado',
        isLocked: false,
        expediente: `E26${(cleanId.replace(/\D/g, '') || '0001').slice(-4).padStart(4, '0')}`,
      };

      const effectiveDoc = foundDoc || decodedDocFromUrl || fallbackDoc;

      if (!foundDoc) {
        const updatedDocs = [effectiveDoc, ...currentStoredDocs];
        setDocuments(updatedDocs);
        saveStoredDocuments(updatedDocs);
      }

      setSelectedDoc(effectiveDoc);
      setIsClientDocViewMode(true);
      setIsViewDocOpen(true);
    } else if (viewParam === 'expediente' && idParam) {
      const cleanExp = decodeURIComponent(idParam).trim().toUpperCase();
      const dataParam = params.get('data');

      const currentStoredDocs = getStoredDocuments();
      let existingExp = currentStoredDocs.find((d) => d.expediente?.toUpperCase() === cleanExp);

      if (!existingExp && dataParam) {
        try {
          const jsonStr = decodeURIComponent(atob(decodeURIComponent(dataParam)));
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.e) {
            existingExp = {
              id: `doc_${parsed.n || cleanExp}`,
              number: parsed.n || `P26${(cleanExp.replace(/\D/g, '') || '0001').slice(-4).padStart(4, '0')}`,
              series: '2026',
              type: 'presupuesto',
              date: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              issuerId: user.id,
              issuerName: user.fullName,
              issuerCif: user.cif,
              issuerAddress: user.fiscalAddress,
              issuerPhone: user.phone,
              issuerEmail: user.email,
              clientId: 'cli_url',
              clientName: parsed.cn || 'Cliente',
              clientCif: '',
              clientAddress: '',
              clientPhone: '',
              clientEmail: '',
              items: [],
              subtotal: Number(parsed.tot) || 0,
              applyIva: true,
              ivaRate: 21,
              ivaAmount: 0,
              applyIrpf: false,
              irpfRate: 0,
              irpfAmount: 0,
              total: Number(parsed.tot) || 0,
              status: 'enviado',
              isLocked: false,
              expediente: cleanExp,
              vehiclePlate: parsed.vp || '',
              vehicleBrand: parsed.vb || '',
              vehicleModel: parsed.vm || '',
              vehicleDeliveryDate: parsed.vd || '',
            };
          }
        } catch (e) {
          console.error("Error decoding expediente data from URL:", e);
        }
      }

      if (!existingExp) {
        existingExp = {
          id: `doc_${cleanExp}`,
          number: `P26${(cleanExp.replace(/\D/g, '') || '0001').slice(-4).padStart(4, '0')}`,
          series: '2026',
          type: 'presupuesto',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          issuerId: user.id,
          issuerName: user.fullName,
          issuerCif: user.cif,
          issuerAddress: user.fiscalAddress,
          issuerPhone: user.phone,
          issuerEmail: user.email,
          clientId: 'cli_url',
          clientName: 'Cliente',
          clientCif: '',
          clientAddress: '',
          clientPhone: '',
          clientEmail: '',
          items: [],
          subtotal: 0,
          applyIva: true,
          ivaRate: 21,
          ivaAmount: 0,
          applyIrpf: false,
          irpfRate: 0,
          irpfAmount: 0,
          total: 0,
          status: 'enviado',
          isLocked: false,
          expediente: cleanExp,
        };
      }

      const updatedDocs = [existingExp, ...currentStoredDocs.filter((d) => d.id !== existingExp!.id)];
      setDocuments(updatedDocs);
      saveStoredDocuments(updatedDocs);

      setTargetExpedienteId(cleanExp);

      // Cargar sesión del cliente para abrir directamente el Área de Cliente
      const clientSession: Client = {
        id: existingExp.clientId || 'cli_portal',
        clientNumber: 1,
        name: existingExp.clientName || 'Cliente',
        cif: existingExp.clientCif || '',
        address: existingExp.clientAddress || '',
        phone: existingExp.clientPhone || '',
        email: existingExp.clientEmail || '',
        plates: existingExp.vehiclePlate ? [existingExp.vehiclePlate] : [],
        vehicles: existingExp.vehiclePlate ? [{ plate: existingExp.vehiclePlate, brand: existingExp.vehicleBrand, model: existingExp.vehicleModel }] : [],
        clientType: 'particular',
      };
      setLoggedClientSession(clientSession);
      setIsClientPortalOpen(true);
    } else if (viewParam === 'app-clientes' || viewParam === 'app') {
      if (typeof window !== 'undefined' && !window.location.hostname.includes('clientes-gestarian')) {
        window.location.href = 'https://clientes-gestarian.web.app';
      } else {
        setIsClientPortalOpen(true);
      }
    } else if (viewParam === 'login-clientes') {
      setIsClientPortalOpen(true);
    }
  }, [documents, user]);

  // Sincronizar en LocalStorage cada cambio
  useEffect(() => {
    saveStoredUser(user);
  }, [user]);

  useEffect(() => {
    saveStoredClients(clients);
  }, [clients]);

  useEffect(() => {
    saveStoredDocuments(documents);
  }, [documents]);

  useEffect(() => {
    saveStoredAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (loggedClientSession) {
      localStorage.setItem('gestarian_logged_client', JSON.stringify(loggedClientSession));
    } else {
      localStorage.removeItem('gestarian_logged_client');
    }
  }, [loggedClientSession]);

  // Manejador nuevo usuario guardado tras verificación de código
  const handleUserSaved = (newUser: AppUser) => {
    setUser(newUser);
    showToast(`Configuración de ${newUser.fullName} actualizada correctamente`);
  };

  // Guardar documento (Presupuesto o Factura) con workflow de permisos
  const handleSaveDocument = (
    newDoc: GestarianDocument,
    options?: { sendDirectly?: boolean; sentByEmployee?: boolean }
  ) => {
    if (currentTier === 'lite') {
      showToast(`${newDoc.type === 'presupuesto' ? 'Presupuesto' : 'Factura'} ${newDoc.number} listo para remitir (Modo LITE)`);
      return;
    }
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === newDoc.id);
      if (exists) {
        return prev.map((d) => (d.id === newDoc.id ? newDoc : d));
      }
      return [newDoc, ...prev];
    });

    // Si se convirtió de un presupuesto, vincular
    if (newDoc.relatedBudgetId) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === newDoc.relatedBudgetId
            ? { ...d, convertedToInvoiceId: newDoc.id }
            : d
        )
      );
    }

    // Flujo 1: Presupuesto enviado por empleado que no puede fijar precios
    if (options?.sentByEmployee || newDoc.needsBossPricing) {
      const empName = newDoc.createdByName || 'Operario de Taller';
      const metisNotif: InternalNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: 'Metis: Nuevo Presupuesto Recibido',
        message: `Nuevo presupuesto de ${empName}, termina de cumplimentarlo`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'metis_budget_review',
        budgetId: newDoc.id,
        employeeName: empName,
      };
      setNotifications((prev) => [metisNotif, ...prev]);
      showToast(`Presupuesto enviado al Jefe de Taller (${empName}) para fijar precios.`);
    } 
    // Flujo 2: El Jefe pulsa "Guardar y Enviar"
    else if (options?.sendDirectly) {
      setDispatchModalDoc(newDoc);
      setIsDispatchModalOpen(true);
      showToast(`Documento ${newDoc.number} guardado. Abriendo canal de envío...`);
    } 
    // Flujo 3: Guardado normal
    else {
      showToast(`${newDoc.type === 'presupuesto' ? 'Presupuesto' : 'Factura'} ${newDoc.number} guardado`);
    }
  };

  // Asignar precios a un presupuesto enviado por empleado (Acción Jefe)
  const handleOpenBudgetPricingReview = (budgetId?: string) => {
    if (!budgetId) return;
    const target = documents.find((d) => d.id === budgetId);
    if (target) {
      setBudgetToConvert(target);
      setCreateDocType('presupuesto');
      setIsCreateDocOpen(true);
    }
  };

  // Abrir modal de envío oficial para cualquier documento
  const handleOpenDocumentDispatch = (doc: GestarianDocument) => {
    setDispatchModalDoc(doc);
    setIsDispatchModalOpen(true);
  };

  // Confirmar Factura (antes de enviarla)
  const handleConfirmInvoice = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            status: 'confirmada',
            confirmedAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );

    setSelectedDoc((prev) => (prev && prev.id === docId ? { ...prev, status: 'confirmada' } : prev));
    showToast('Factura revisada y confirmada. Lista para remitir al cliente.');
  };

  // Enviar Factura al Cliente: REGLA DE INMUTABILIDAD FISCAL
  const handleSendInvoice = (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    if (!target) return;

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            status: 'enviada',
            isLocked: true,
            sentAt: new Date().toISOString(),
            facturaSentAt: new Date().toISOString(),
            facturacionStatus: 'factura_enviada' as any,
          };
        }
        if (
          (target.relatedBudgetId && d.id === target.relatedBudgetId) ||
          (target.expediente && d.expediente === target.expediente && d.type === 'presupuesto')
        ) {
          return {
            ...d,
            isLocked: true,
            facturaSentAt: new Date().toISOString(),
            facturacionStatus: 'factura_enviada' as any,
          };
        }
        return d;
      })
    );

    setSelectedDoc((prev) =>
      prev && prev.id === docId
        ? { ...prev, status: 'enviada', isLocked: true, sentAt: new Date().toISOString() }
        : prev
    );

    // Abrir canal de envío por WhatsApp o Correo
    handleOpenDocumentDispatch(target);
  };

  // Aceptar presupuesto -> Activa flujo de agenda
  const handleAcceptBudget = (budget: GestarianDocument) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === budget.id ? { ...d, status: 'aceptado' } : d))
    );

    setSelectedDoc((prev) => (prev && prev.id === budget.id ? { ...prev, status: 'aceptado' } : prev));
    showToast(`Presupuesto ${budget.number} aceptado. Abriendo agenda para dar cita...`);

    setTimeout(() => {
      setAgendaBudgetTrigger(budget);
      setIsAgendaOpen(true);
    }, 600);
  };

  // Convertir presupuesto en factura
  const handleConvertToInvoice = (budget: GestarianDocument) => {
    setBudgetToConvert(budget);
    setCreateDocType('factura');
    setIsCreateDocOpen(true);
  };

  // Compartir nativo
  const handleShareDoc = async (doc: GestarianDocument) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${doc.type === 'presupuesto' ? 'Presupuesto' : 'Factura'} ${doc.number}`,
          text: `${doc.issuerName} te ha emitido el documento ${doc.number} por importe de ${doc.total.toFixed(2)} €`,
          url: window.location.href,
        });
      } catch {
        // Cancelado
      }
    } else {
      handleOpenDocumentDispatch(doc);
    }
  };

  const handleOpenNewBudget = () => {
    if (currentTier === 'lite') {
      navigateToSection('page-presupuestos');
      return;
    }
    setBudgetToConvert(null);
    setPreselectedClientIdForNewDoc(null);
    setCreateDocType('presupuesto');
    setIsCreateDocOpen(true);
  };

  const handleOpenNewInvoice = () => {
    if (currentTier === 'lite') {
      navigateToSection('page-facturacion');
      return;
    }
    setBudgetToConvert(null);
    setPreselectedClientIdForNewDoc(null);
    setCreateDocType('factura');
    setIsCreateDocOpen(true);
  };

  const handleClientSelectForDoc = (client: Client, type: DocumentType) => {
    setIsClientAreaOpen(false);
    setBudgetToConvert(null);
    setPreselectedClientIdForNewDoc(client.id);
    setCreateDocType(type);
    setIsCreateDocOpen(true);
  };

  const handleClientSelectForAgenda = (client: Client) => {
    setIsClientAreaOpen(false);
    setAgendaBudgetTrigger(null);
    setIsAgendaOpen(true);
  };

  // Historial de navegación para redirigir a la pantalla anterior
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    // Si no está autenticado, bloquear scroll lateral
    if (!isAuthenticated) return;

    e.preventDefault();
    if (isScrollingRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    const scrollLeft = container.scrollLeft;

    let currentIndex = 0;
    let minDiff = Infinity;
    children.forEach((child, idx) => {
      const diff = Math.abs(child.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        currentIndex = idx;
      }
    });

    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta === 0) return;

    let targetIndex = currentIndex;
    if (delta > 0) {
      targetIndex = Math.min(currentIndex + 1, children.length - 1);
    } else {
      targetIndex = Math.max(currentIndex - 1, 0);
    }

    if (targetIndex !== currentIndex) {
      isScrollingRef.current = true;
      children[targetIndex].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 450);
    }
  };
  const [screenHistory, setScreenHistory] = useState<string[]>(['page-inicio']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigateToSection = (sectionId: string) => {
    if (!isAuthenticated && sectionId !== 'page-inicio') {
      showToast('Introduce tu email y contraseña en la tarjeta de inicio para acceder.');
      return;
    }

    // Delimitación estricta por versión
    if (currentTier === 'lite') {
      if (
        sectionId !== 'page-inicio' &&
        sectionId !== 'page-presupuestos' &&
        sectionId !== 'page-facturacion' &&
        sectionId !== 'page-configuracion'
      ) {
        showToast('🪐 GESTARIAN LITE: Acceso a Presupuestos, Facturas y Configuración.');
        return;
      }
    } else if (currentTier === 'quick') {
      if (
        sectionId !== 'page-inicio' &&
        sectionId !== 'page-clientes' &&
        sectionId !== 'page-proveedores' &&
        sectionId !== 'page-balances' &&
        sectionId !== 'page-configuracion'
      ) {
        showToast('⚡ GESTARIAN QUICK: Acceso a Clientes, Proveedores, Balances y Configuración.');
        return;
      }
    }

    setScreenHistory((prev) => {
      if (prev[prev.length - 1] === sectionId) return prev;
      return [...prev, sectionId];
    });
    setIsMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        if (sectionId === 'page-inicio') {
          el.scrollTop = 0;
        }
      }
    }, 50);
  };

  const handleNavigateToExpediente = (expId: string) => {
    setTargetExpedienteId(expId);
    setIsExpedienteRoadmapOpen(true);
    const targetDoc = documents.find(
      (d) => d.expediente === expId || d.number === expId || d.id === expId
    );
    setActiveExpedientePlate(targetDoc?.vehiclePlate || null);
    navigateToSection('page-roadmap');
  };

  const handleBackToPreviousScreen = () => {
    if (screenHistory.length > 1) {
      const updated = [...screenHistory];
      updated.pop(); // Sacar la pantalla actual
      const previousScreen = updated[updated.length - 1] || 'page-inicio';
      setScreenHistory(updated);
      const el = document.getElementById(previousScreen);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    } else {
      const el = document.getElementById('page-inicio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    }
  };

  // Redirigir a la pantalla de INICIO (ej: al pulsar el logo en cualquier pantalla)
  const navigateToHome = () => {
    const el = document.getElementById('page-inicio');
    if (el) {
      el.scrollTop = 0;
    }
    navigateToSection('page-inicio');
  };

  // Modal para personalizar fondos con IA a partir de archivo local
  const [isImageCustomizerOpen, setIsImageCustomizerOpen] = useState(false);

  const handleApplyCustomizedImageFromApp = (
    variant: { styleName: string; dataUrl: string },
    targetSlot: 'portrait' | 'landscape' | 'bento' | 'all'
  ) => {
    setUser((prev) => {
      const updated = { ...prev };
      if (targetSlot === 'portrait' || targetSlot === 'all') {
        updated.bgPortraitUrl = variant.dataUrl;
      }
      if (targetSlot === 'landscape' || targetSlot === 'all') {
        updated.bgLandscapeUrl = variant.dataUrl;
      }
      if (targetSlot === 'bento' || targetSlot === 'all') {
        updated.bgBentoMenuUrl = variant.dataUrl;
      }
      return updated;
    });
    showToast(`Fondo (${variant.styleName}) aplicado correctamente`);
  };

  // Presupuestos pendientes de valoración por el Jefe
  const pendingBudgetReviews = documents.filter(
    (d) => d.type === 'presupuesto' && Boolean(d.needsBossPricing)
  );

  // Avisos de facturas de proveedores escaneadas y pendientes de incorporar
  const pendingInvoices = documents.filter(
    (d) => d.type === 'factura_recibida' && !d.isLocked
  );

  const handleDismissInvoiceNotification = (invoiceId: string) => {
    // Si la descartamos de la home sin incorporarla, la marcamos como "rechazada" o isLocked = true para ocultarla
    const updatedDocs = documents.map(d => 
      d.id === invoiceId ? { ...d, isLocked: true, status: 'pagada' as any } : d
    );
    setDocuments(updatedDocs);
    saveStoredDocuments(updatedDocs);
  };

  const matchedDispatchClient = dispatchModalDoc 
    ? (clients.find((c) => c.id === dispatchModalDoc.clientId) || {
        id: dispatchModalDoc.clientId,
        name: dispatchModalDoc.clientName,
        cif: dispatchModalDoc.clientCif,
        address: dispatchModalDoc.clientAddress,
        email: dispatchModalDoc.clientEmail,
        phone: dispatchModalDoc.clientPhone,
      })
    : null;

  // Fullscreen logic
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Error al intentar pantalla completa: ${err.message}`);
        showToast("Pantalla completa no disponible en este dispositivo/navegador");
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Detección de si estamos en el portal de clientes (clientes-gestarian.web.app o ?view=app-clientes)
  const isClientPortalDomain = typeof window !== 'undefined' && (
    window.location.hostname.includes('clientes-gestarian') ||
    new URLSearchParams(window.location.search).get('view') === 'app-clientes' ||
    new URLSearchParams(window.location.search).get('view') === 'login-clientes' ||
    window.location.pathname.startsWith('/app')
  );

  // Si estamos en el portal de clientes (clientes-gestarian.web.app o ?view=app-clientes)
  if (isClientPortalDomain) {
    return (
      <div className="relative w-full min-h-[100dvh] bg-[#090D16] text-[#F8FAFC] font-sans selection:bg-[#38BDF8] selection:text-[#090D16]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[200] bg-[#0F2942] text-white px-5 py-3 rounded-lg shadow-xl text-[18px] font-semibold tracking-wide border border-[#1E3A8A] flex items-center gap-2 select-none animate-none transition-none">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Si no hay sesión de cliente activa, mostrar la pantalla de acceso de cliente */}
        {!loggedClientSession ? (
          <ClientPortalLoginView
            workshopUser={user}
            clients={clients}
            documents={documents}
            onClientLogin={(client) => {
              setLoggedClientSession(client);
              setIsClientPortalOpen(true);
              showToast(`Sesión iniciada como ${client.name}`);
            }}
          />
        ) : (
          <div className="relative w-full min-h-[100dvh]">
            <ClientPortalModal
              isOpen={true}
              onClose={() => {
                setLoggedClientSession(null);
                setIsClientPortalOpen(false);
                showToast('Sesión de cliente cerrada');
              }}
              loggedClient={loggedClientSession}
              user={user}
              documents={documents}
              onUpdateDocumentStatus={(docId, newStatus, newDeliveryDate, updatedDocPartial) => {
              setDocuments((prev) => {
                const nextDocs = prev.map((d) =>
                  d.id === docId
                    ? {
                        ...d,
                        status: newStatus,
                        ...(newDeliveryDate ? { vehicleDeliveryDate: newDeliveryDate } : {}),
                        ...updatedDocPartial,
                      }
                    : d
                );
                saveStoredDocuments(nextDocs);
                try {
                  window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
                } catch (e) {}
                return nextDocs;
              });
              showToast(`Presupuesto ${newStatus === 'aceptado' ? 'aceptado' : 'actualizado'} con éxito`);
            }}
              onSendNotificationToWorkshop={(notif) => {
                setNotifications((prev) => [notif, ...prev]);
                playGentleChime();
                showToast(`Notificación enviada a ${user.fullName}: ${notif.title}`);
              }}
              onViewDoc={(doc) => {
                setSelectedDoc(doc);
                setIsClientDocViewMode(true);
                setIsViewDocOpen(true);
              }}
              onLogoutClient={() => {
                setLoggedClientSession(null);
                setIsClientPortalOpen(false);
                showToast('Sesión de cliente cerrada');
              }}
            />

            {/* Visor Oficial de Documentos / Facturas / Presupuestos para el cliente */}
            <DocumentViewerModal
              isOpen={isViewDocOpen}
              document={selectedDoc}
              onClose={() => {
                setIsViewDocOpen(false);
                setIsClientDocViewMode(false);
              }}
              isClientView={true}
              userLogoUrl={user.logoUrl}
              onConfirmInvoice={handleConfirmInvoice}
              onSendInvoice={handleSendInvoice}
              onAcceptBudget={handleAcceptBudget}
              onConvertToInvoice={handleConvertToInvoice}
              onEditDocument={() => {}}
              onOpenAgendaForBudget={() => {}}
              onNavigateToExpediente={(expNum) => {
                setIsViewDocOpen(false);
                handleNavigateToExpediente(expNum);
              }}
              onShowToast={showToast}
            />
          </div>
        )}
      </div>
    );
  }

  // Mostrar animación de inicio en el taller
  if (showIntro) {
    return (
      <IntroAnimation
        onComplete={() => {
          setShowIntro(false);
          // Si no tiene usuario configurado y no es acceso de cliente, abrir el modal de configuración
          if (!isUserConfigured && !isClientDocViewMode) {
            setTimeout(() => setIsNewUserOpen(true), 500);
          }
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-white text-[#1E293B] font-sans selection:bg-[#0F2942] selection:text-white">
      {/* Toast Notification (sin animación, sonido no molesto) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-[#0F2942] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold tracking-wide border border-[#1E3A8A] flex items-center gap-2 select-none animate-none transition-none">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menú de Navegación a Pantalla Completa */}
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={navigateToSection}
        onNewBudget={handleOpenNewBudget}
        onNewClient={() => {
          setEditingClient(null);
          setIsNewClientFullScreenOpen(true);
        }}
        bgBentoMenuUrl={user.bgBentoMenuUrl}
        onOpenImageCustomizer={() => setIsImageCustomizerOpen(true)}
        hasAutoDetectedInvoices={hasAutoDetectedInvoices}
        isScanningInvoices={isScanningInvoices}
        scanButtonStatus={scanButtonStatus}
        onTriggerScan={handleTriggerExtraScan}
        onViewDetectedInvoices={handleViewDetectedInvoices}
        currentPlan={currentTier}
        activeEmployeesCount={user.employees?.length || 4}
      />

      {/* Contenedor Principal con Scroll Horizontal Snap */}
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheelScroll}
        className="w-full h-full flex overflow-y-hidden snap-x snap-mandatory scroll-smooth overflow-x-auto"
      >
        {/* 1. Inicio */}
        <HomeView 
          currentUser={user}
          isAuthenticated={isAuthenticated}
          currentPlan={currentTier}
          onSelectPlan={handleSelectPlan}
          onOpenEnterpriseAeat={() => setIsEnterpriseAeatOpen(true)}
          onOpenQuickExtras={() => setIsQuickExtrasOpen(true)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onOpenScanner={() => setIsPlateScannerOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={notifications.filter((n) => !n.read).length}
          onOpenMetisChat={() => setIsMetisChatOpen(true)}
          onOpenVoiceAssistant={() => setIsMetisVoiceOpen(true)}
          pendingBudgetReviews={pendingBudgetReviews}
          onOpenBudgetReview={handleOpenBudgetPricingReview}
          onOpenImageCustomizer={() => setIsImageCustomizerOpen(true)}
          pendingInvoices={pendingInvoices}
          onOpenInvoice={(docId) => {
             const doc = documents.find(d => d.id === docId);
             if (doc) {
                setSelectedDoc(doc);
                setIsViewDocOpen(true);
             }
          }}
          onDismissInvoice={handleDismissInvoiceNotification}
          onNavigateSection={(sectionId) => navigateToSection(sectionId)}
          hasAutoDetectedInvoices={hasAutoDetectedInvoices}
          isScanningInvoices={isScanningInvoices}
          scanButtonStatus={scanButtonStatus}
          onTriggerScan={handleTriggerExtraScan}
          onViewDetectedInvoices={handleViewDetectedInvoices}
          onNewBudget={handleOpenNewBudget}
          onNewInvoice={handleOpenNewInvoice}
          onNewClient={() => {
            setEditingClient(null);
            setIsNewClientFullScreenOpen(true);
          }}
        />

        {/* Módulos completos: Solo en PRO y ENTERPRISE (Ocultar en GESTARIAN LITE y QUICK) */}
        {currentTier !== 'lite' && currentTier !== 'quick' && (
          <>
            {/* 2. Expedientes */}
            <PageLayoutWrapper
              pageId="page-expedientes"
          title="Expedientes"
          currentPlan={currentTier}
          vehiclePlate={isExpedienteRoadmapOpen ? activeExpedientePlate : null}
          onOpenDatos={isExpedienteRoadmapOpen ? () => window.dispatchEvent(new CustomEvent('gestarian_open_expediente_datos')) : undefined}
          onOpenMenu={() => setIsMenuOpen(true)}
          onBack={() => {
            if (isExpedienteRoadmapOpen) {
              window.dispatchEvent(new CustomEvent('gestarian_close_roadmap'));
              setIsExpedienteRoadmapOpen(false);
              setTargetExpedienteId(null);
              setActiveExpedientePlate(null);
            } else {
              setTargetExpedienteId(null);
              setClientExpedienteFilter(null);
              handleBackToPreviousScreen();
            }
          }}
          onNavigateHome={navigateToHome}
        >
          <ExpedientesView 
            documents={documents}
            clients={clients}
            onBack={() => {
              if (isExpedienteRoadmapOpen) {
                window.dispatchEvent(new CustomEvent('gestarian_close_roadmap'));
                setIsExpedienteRoadmapOpen(false);
                setTargetExpedienteId(null);
                setActiveExpedientePlate(null);
              } else {
                setTargetExpedienteId(null);
                setClientExpedienteFilter(null);
                handleBackToPreviousScreen();
              }
            }}
            logoUrl={user.logoUrl}
            userFullName={user.fullName}
            onNavigateHome={navigateToHome}
            onOpenMenu={() => setIsMenuOpen(true)}
            initialExpedienteId={targetExpedienteId}
            initialClientId={clientExpedienteFilter}
            currentUser={user}
            onUpdateDocument={(updated) => handleSaveDocument(updated)}
            onGenerateInvoiceFromBudget={(budget) => handleConvertToInvoice(budget)}
            onShowToast={showToast}
            onOpenWorkOrdersModal={() => setIsWorkOrdersOpen(true)}
            onRoadmapOpenChange={(isOpen) => setIsExpedienteRoadmapOpen(isOpen)}
            onSelectExpediente={(expId) => {
              setTargetExpedienteId(expId);
              setIsExpedienteRoadmapOpen(Boolean(expId));
              if (!expId) setActiveExpedientePlate(null);
            }}
            onPlateChange={(plate) => setActiveExpedientePlate(plate)}
          />
        </PageLayoutWrapper>

        {/* 3. Solicitudes */}
        <PageLayoutWrapper
          pageId="page-solicitudes"
          title="Solicitudes"
          currentPlan={currentTier}
          onOpenMenu={() => setIsMenuOpen(true)}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
        >
          <SolicitudesView
            id="page-solicitudes"
            logoUrl={user.logoUrl}
            userFullName={user.fullName}
            onBack={handleBackToPreviousScreen}
            onNavigateHome={navigateToHome}
            onOpenMenu={() => setIsMenuOpen(true)}
            onNewBudgetWithData={(data) => {
              // 1. Buscar si ya existe el cliente en la base de datos
              let matchingClient = clients.find(
                (c) =>
                  (data.clientName && c.name.trim().toLowerCase() === data.clientName.trim().toLowerCase()) ||
                  (c.phone && data.clientPhone && c.phone.replace(/\D/g, '') === data.clientPhone.replace(/\D/g, '')) ||
                  (c.email && data.clientEmail && c.email.trim().toLowerCase() === data.clientEmail.trim().toLowerCase()) ||
                  (data.vehiclePlate && c.plates && c.plates.map(p => p.toUpperCase()).includes(data.vehiclePlate.toUpperCase()))
              );

              // 2. Si no existe en la cartera, registrar el cliente para que quede vinculado
              if (!matchingClient && data.clientName) {
                const maxNum = clients.reduce((max, cl) => Math.max(max, cl.clientNumber || 0), 0);
                matchingClient = {
                  id: `client_${Date.now()}`,
                  clientNumber: maxNum + 1,
                  name: data.clientName.trim(),
                  cif: '',
                  address: '',
                  phone: data.clientPhone || '',
                  email: data.clientEmail || '',
                  plates: data.vehiclePlate ? [data.vehiclePlate.trim().toUpperCase()] : [],
                };
                setClients((prev) => [matchingClient!, ...prev]);
                saveStoredClients([matchingClient!, ...clients]);
                syncClientToSupabase(matchingClient!);
              }

              // 3. Obtener matrícula, marca y modelo del vehículo
              let plate = (data.vehiclePlate || matchingClient?.plates?.[0] || '').trim().toUpperCase();
              let brand = data.vehicleBrand || '';
              let model = data.vehicleModel || '';

              if (!brand || !model) {
                const pastDoc = documents.find(
                  (d) =>
                    (plate && d.vehiclePlate?.toUpperCase() === plate) ||
                    (matchingClient && d.clientId === matchingClient.id)
                );
                if (pastDoc) {
                  if (!brand && pastDoc.vehicleBrand) brand = pastDoc.vehicleBrand;
                  if (!model && (pastDoc.vehicleModel || pastDoc.vehicleType)) model = pastDoc.vehicleModel || pastDoc.vehicleType || '';
                }
              }

              const exp = data.expediente || getExpedienteFromDocNumber(data.solicitudNumber || '');
              const budgetNum = getNextDocumentNumber('presupuesto', documents, exp);

              const newBudget: GestarianDocument = {
                id: `doc_budget_${Date.now()}`,
                type: 'presupuesto',
                number: budgetNum,
                series: 'A',
                date: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                expediente: exp,
                issuerId: user.id,
                issuerName: user.fullName,
                issuerCif: user.cif,
                issuerAddress: user.fiscalAddress,
                issuerPhone: user.phone,
                issuerEmail: user.email,
                issuerLogoUrl: user.logoUrl,
                clientId: matchingClient?.id || '',
                clientName: matchingClient?.name || data.clientName || '',
                clientCif: matchingClient?.cif || '',
                clientAddress: matchingClient?.address || '',
                clientEmail: matchingClient?.email || data.clientEmail || '',
                clientPhone: matchingClient?.phone || data.clientPhone || '',
                vehiclePlate: plate,
                vehicleBrand: brand,
                vehicleModel: model,
                vehicleImages: data.images || [],
                items: (() => {
                  const rawDesc = data.description?.trim() || '';
                  if (!rawDesc) {
                    return [
                      {
                        id: `item_${Date.now()}_1`,
                        description: `Reparación y servicios según solicitud ${data.solicitudNumber || ''}`,
                        quantity: 1,
                        unitPrice: 0,
                        amount: 0,
                      },
                    ];
                  }

                  // Dividir por saltos de línea o viñetas para crear líneas de concepto individuales
                  const lines = rawDesc
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0);

                  if (lines.length > 1) {
                    return lines.map((line, idx) => ({
                      id: `item_${Date.now()}_${idx + 1}`,
                      description: line.replace(/^[-*•0-9.)\s]+/, '').trim() || line,
                      quantity: 1,
                      unitPrice: 0,
                      amount: 0,
                    }));
                  }

                  // Si es una sola línea larga con comas o puntos y coma, mantener el texto completo como concepto 1
                  return [
                    {
                      id: `item_${Date.now()}_1`,
                      description: rawDesc,
                      quantity: 1,
                      unitPrice: 0,
                      amount: 0,
                    },
                  ];
                })(),
                subtotal: 0,
                applyIva: true,
                ivaRate: 21,
                ivaAmount: 0,
                applyIrpf: false,
                irpfRate: 0,
                irpfAmount: 0,
                total: 0,
                status: 'borrador',
                isLocked: false,
                notes: 'Validez del presupuesto: 30 días.\nEste presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.',
              };

              setPreselectedClientIdForNewDoc(matchingClient?.id || null);
              setBudgetToConvert(newBudget);
              setCreateDocType('presupuesto');
              setIsCreateDocOpen(true);
              showToast(`Presupuesto ${budgetNum} iniciado con el cliente ${newBudget.clientName} y vehículo [${plate || 'S/M'}]`);
            }}
            onNavigateToExpediente={(expId) => {
              handleNavigateToExpediente(expId);
            }}
            onViewDoc={(doc) => {
              setSelectedDoc(doc);
              setIsClientDocViewMode(false);
              setIsViewDocOpen(true);
            }}
          />
        </PageLayoutWrapper>
        </>
      )}

        {/* 4. Clientes: En QUICK, PRO y ENTERPRISE (Ocultar en GESTARIAN LITE) */}
        {currentTier !== 'lite' && (
        <PageLayoutWrapper
          pageId="page-clientes"
          title="Clientes"
          currentPlan={currentTier}
          onOpenMenu={() => setIsMenuOpen(true)}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onNewClient={() => {
            setEditingClient(null);
            setIsNewClientFullScreenOpen(true);
          }}
        >
          <ClientesCardsView
            id="page-clientes"
            logoUrl={user.logoUrl}
            userFullName={user.fullName}
            currentUser={user}
            clients={clients}
            documents={documents}
            isSelectingForBudget={isSelectingClientForBudget}
            onSelectClientForBudget={(selectedClient) => {
              setIsSelectingClientForBudget(false);
              setPreselectedClientIdForNewDoc(selectedClient.id);
              setBudgetToConvert((prev) => prev ? {
                ...prev,
                clientId: selectedClient.id,
                clientName: selectedClient.name,
                clientCif: selectedClient.cif || '',
                clientAddress: selectedClient.address || '',
                clientPhone: selectedClient.phone || '',
                clientEmail: selectedClient.email || '',
                vehiclePlate: selectedClient.plates && selectedClient.plates.length > 0 ? selectedClient.plates[0] : (prev.vehiclePlate || ''),
                taskLocation: selectedClient.taskLocation || selectedClient.address || '',
              } : null);
              setCreateDocType('presupuesto');
              setIsCreateDocOpen(true);
              showToast(`Cliente ${selectedClient.name} cargado en el presupuesto`);
            }}
            onCancelBudgetSelection={() => {
              setIsSelectingClientForBudget(false);
              setIsCreateDocOpen(true);
            }}
            onBack={handleBackToPreviousScreen}
            onNavigateHome={navigateToHome}
            onOpenMenu={() => setIsMenuOpen(true)}
            onOpenClientArea={() => setIsClientAreaOpen(true)}
            onNewClient={() => {
              setEditingClient(null);
              setIsNewClientFullScreenOpen(true);
            }}
            onEditClient={(client) => {
              setEditingClient(client);
              setIsNewClientFullScreenOpen(true);
            }}
            onUpdateClient={(updatedClient) => {
              setClients((prev) =>
                prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
              );
              saveStoredClients(clients.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
              showToast(`Vehículos del cliente ${updatedClient.name} actualizados`);
            }}
            onViewClientBudgets={(client) => {
              setBudgetSearchFilter(client.name);
              navigateToSection('page-presupuestos');
            }}
            onNewBudgetForClient={(client) => {
              handleClientSelectForDoc(client, 'presupuesto');
            }}
            onViewClientExpedientes={(client) => {
              setClientExpedienteFilter(client.id);
              setTargetExpedienteId(null);
              setIsExpedienteRoadmapOpen(false);
              setActiveExpedientePlate(null);
              navigateToSection('page-expedientes');
            }}
            onViewClientInvoices={(client) => {
              setClientFacturacionFilter(client.id);
              navigateToSection('page-facturacion');
            }}
            onViewDoc={(doc) => {
              setSelectedDoc(doc);
              setIsClientDocViewMode(false);
              setIsViewDocOpen(true);
            }}
          />
        </PageLayoutWrapper>
      )}

        {/* 5. Presupuestos: Ocultar en QUICK (Solo en LITE, PRO y ENTERPRISE) */}
        {currentTier !== 'quick' && (
        <PageLayoutWrapper
          pageId="page-presupuestos"
          title="Presupuestos"
          currentPlan={currentTier}
          onOpenMenu={() => setIsMenuOpen(true)}
          onBack={() => {
            setBudgetSearchFilter('');
            handleBackToPreviousScreen();
          }}
          onNavigateHome={navigateToHome}
          onNewBudget={handleOpenNewBudget}
        >
          {currentTier === 'lite' ? (
            <div className="w-full flex-1 flex flex-col items-center justify-start overflow-y-auto">
              <CreateDocumentModal
                inline={true}
                isOpen={true}
                docType="presupuesto"
                onClose={navigateToHome}
                onSave={handleSaveDocument}
                currentUser={user}
                clients={clients}
                allDocuments={documents}
                onShowToast={showToast}
                onUpdateUser={handleUserSaved}
              />
            </div>
          ) : (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex-1 flex flex-col">
              <DocumentList
                documents={documents.filter((d) => d.type === 'presupuesto')}
                initialSearch={budgetSearchFilter}
                onlyCards={true}
                onViewDoc={(doc) => {
                  setSelectedDoc(doc);
                  setIsClientDocViewMode(false);
                  setIsViewDocOpen(true);
                }}
                onShareDoc={handleShareDoc}
                onNewBudget={handleOpenNewBudget}
                onAcceptBudget={handleAcceptBudget}
                onConvertToInvoice={handleConvertToInvoice}
                onEditBudgetPricing={(doc) => handleOpenBudgetPricingReview(doc.id)}
                onDispatchDoc={handleOpenDocumentDispatch}
                onNavigateToExpediente={(expId) => {
                  handleNavigateToExpediente(expId);
                }}
              />
            </div>
          )}
        </PageLayoutWrapper>
        )}

        {/* Citas y Taller: Solo en PRO y ENTERPRISE (Ocultar en LITE y QUICK) */}
        {currentTier !== 'lite' && currentTier !== 'quick' && (
          <>
            {/* 6. Citas */}
            <PageLayoutWrapper
              pageId="page-citas"
              title="Citas"
              currentPlan={currentTier}
              onOpenMenu={() => setIsMenuOpen(true)}
              onBack={handleBackToPreviousScreen}
              onNavigateHome={navigateToHome}
              onOpenAgenda={() => {
                setAgendaBudgetTrigger(null);
                setIsAgendaOpen(true);
              }}
            >
              <CitasView
                id="page-citas"
                logoUrl={user.logoUrl}
                userFullName={user.fullName}
                appointments={appointments}
                onBack={handleBackToPreviousScreen}
                onNavigateHome={navigateToHome}
                onOpenMenu={() => setIsMenuOpen(true)}
                onOpenAgenda={() => {
                  setAgendaBudgetTrigger(null);
                  setIsAgendaOpen(true);
                }}
                onNavigateToExpediente={(expId) => {
                  handleNavigateToExpediente(expId);
                }}
              />
            </PageLayoutWrapper>

            {/* 7. Taller */}
            <PageLayoutWrapper
              pageId="page-taller"
              title="Taller y Reparaciones"
              currentPlan={currentTier}
              onOpenMenu={() => setIsMenuOpen(true)}
              onBack={handleBackToPreviousScreen}
              onNavigateHome={navigateToHome}
            >
              <TallerCardsView
                id="page-taller"
                logoUrl={user.logoUrl}
                userFullName={user.fullName}
                documents={documents}
                currentUser={user}
                loggedEmployeeSession={loggedEmployeeSession}
                onLogoutEmployeeSession={() => {
                  setLoggedEmployeeSession(null);
                  showToast('Sesión de Autorizado cerrada');
                }}
                onBack={handleBackToPreviousScreen}
                onNavigateHome={navigateToHome}
                onOpenMenu={() => setIsMenuOpen(true)}
                onOpenWorkOrdersModal={() => setIsWorkOrdersOpen(true)}
                onNavigateToExpediente={(expId) => {
                  handleNavigateToExpediente(expId);
                }}
                onUpdateDocument={handleSaveDocument}
                onShowToast={showToast}
              />
            </PageLayoutWrapper>
          </>
        )}

        {/* 8. Facturación: En LITE muestra directamente la Hoja A4 para cumplimentar (Ocultar en QUICK) */}
        {currentTier !== 'quick' && (
        <PageLayoutWrapper
          pageId="page-facturacion"
          title="Facturación y Finanzas"
          currentPlan={currentTier}
          onOpenMenu={() => setIsMenuOpen(true)}
          onBack={() => {
            setClientFacturacionFilter(null);
            handleBackToPreviousScreen();
          }}
          onNavigateHome={navigateToHome}
          onNewInvoice={handleOpenNewInvoice}
        >
          {currentTier === 'lite' ? (
            <div className="w-full flex-1 flex flex-col items-center justify-start overflow-y-auto">
              <CreateDocumentModal
                inline={true}
                isOpen={true}
                docType="factura"
                onClose={navigateToHome}
                onSave={handleSaveDocument}
                currentUser={user}
                clients={clients}
                allDocuments={documents}
                onShowToast={showToast}
                onUpdateUser={handleUserSaved}
              />
            </div>
          ) : (
            <FacturacionView
              id="page-facturacion"
              user={user}
              logoUrl={user.logoUrl}
              userFullName={user.fullName}
              documents={documents}
              initialTab={facturacionInitialTab}
              initialClientFilterId={clientFacturacionFilter}
              onOpenDetectedInvoices={handleViewDetectedInvoices}
              detectedInvoicesCount={detectedInvoices.length}
              onNewInvoice={handleOpenNewInvoice}
              onViewDoc={(doc) => {
                setSelectedDoc(doc);
                setIsClientDocViewMode(false);
                setIsViewDocOpen(true);
              }}
              onNavigateToDocument={(id) => {}}
              onBack={() => {
                setClientFacturacionFilter(null);
                handleBackToPreviousScreen();
              }}
              onNavigateHome={navigateToHome}
              onOpenMenu={() => setIsMenuOpen(true)}
              onAddReceivedInvoice={(doc) => {
                const cleanDoc: GestarianDocument = {
                  ...doc,
                  type: 'factura_recibida',
                  expediente: undefined, // Las facturas recibidas NUNCA generan expediente
                };
                setDocuments(prev => {
                  const updated = [cleanDoc, ...prev.filter(d => d.id !== doc.id)];
                  saveStoredDocuments(updated);
                  return updated;
                });
                showToast(`Factura recibida ${doc.number} guardada con éxito`);
              }}
              onNavigateToExpediente={(expId) => {
                handleNavigateToExpediente(expId);
              }}
              onNavigateToClient={(clientId) => {
                setTargetClientId(clientId);
                navigateToSection('page-clientes');
              }}
              onAddPayment={(docId, payment) => {
                setDocuments((prev) =>
                  prev.map((d) => {
                    if (d.id === docId) {
                      const updatedPayments = [...(d.payments || []), payment];
                      const total = d.total || 0;
                      const prevPaid = (d.payments || []).reduce((acc, p) => acc + p.amount, 0);
                      const newPaid = prevPaid + payment.amount;
                      const pending = Math.max(0, total - newPaid);

                      // Si el cobro deja el saldo pendiente a 0 (Abono total completado)
                      if (pending <= 0.001 && total > 0 && prevPaid < total) {
                        const formattedTotal = total.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        });
                        const clientLabel = d.clientName || 'Cliente';
                        const plateLabel = d.vehiclePlate ? ` [${d.vehiclePlate}]` : '';
                        const expLabel = d.expediente ? ` | Expediente: ${d.expediente}` : '';

                        // 1. Notificación interna con aviso de Metis
                        const metisPaidNotification: InternalNotification = {
                          id: `notif_metis_paid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                          title: `Aviso Metis: Factura ${d.number} Totalmente Abonada`,
                          message: `Factura ${d.number} de ${clientLabel}${plateLabel} abonada al 100%. Importe: ${formattedTotal}. Pendiente: 0,00 €${expLabel}. Expediente cerrado automáticamente.`,
                          timestamp: new Date().toISOString(),
                          read: false,
                          type: 'metis_invoice_paid',
                          orderNumber: d.number,
                          invoiceId: d.id,
                          totalAmount: total,
                          employeeName: 'Metis Asistente IA',
                        };

                        setNotifications((prevNotifs) => [metisPaidNotification, ...prevNotifs]);

                        // 2. Banner toast con los datos del abono
                        showToast(
                          `🤖 Metis: Factura ${d.number} (${clientLabel}) totalmente abonada [${formattedTotal}]. Pendiente: 0,00 €. Expediente cerrado.`
                        );

                        // 3. Emisión por voz de Metis si el navegador lo permite
                        try {
                          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            const voiceText = `Aviso de Metis: Factura ${d.number} totalmente abonada por ${clientLabel}. Importe total de ${Math.round(
                              total
                            )} euros liquidado. Saldo pendiente cero. Expediente cerrado con éxito.`;
                            const utterance = new SpeechSynthesisUtterance(voiceText);
                            utterance.lang = 'es-ES';
                            utterance.rate = 1.0;
                            window.speechSynthesis.speak(utterance);
                          }
                        } catch (err) {
                          console.warn('SpeechSynthesis unavailable:', err);
                        }

                        const existingNotes = d.notes || '';
                        const updatedNotes = existingNotes.includes('FACTURA ABONADA')
                          ? existingNotes
                          : (existingNotes ? `${existingNotes}\nFACTURA ABONADA` : 'FACTURA ABONADA');

                        return {
                          ...d,
                          payments: updatedPayments,
                          status: 'PAGADO',
                          notes: updatedNotes,
                          observations: updatedNotes,
                        };
                      }

                      return { ...d, payments: updatedPayments };
                    }
                    return d;
                  })
                );
              }}
            />
          )}
        </PageLayoutWrapper>
        )}

        {/* Balances y Proveedores: En QUICK, PRO y ENTERPRISE (Ocultar en GESTARIAN LITE) */}
        {currentTier !== 'lite' && (
          <>
            {/* 9. Balances */}
            <PageLayoutWrapper
              pageId="page-balances"
              title="Balances de Empresa"
              currentPlan={currentTier}
              onOpenMenu={() => setIsMenuOpen(true)}
              onBack={handleBackToPreviousScreen}
              onNavigateHome={navigateToHome}
            >
              <BalancesView
                id="page-balances"
                logoUrl={user.logoUrl}
                userFullName={user.fullName}
                documents={documents}
                onBack={handleBackToPreviousScreen}
                onNavigateHome={navigateToHome}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
            </PageLayoutWrapper>

            {/* 10. Proveedores */}
            <PageLayoutWrapper
              pageId="page-proveedores"
              title="Proveedores"
              currentPlan={currentTier}
              onOpenMenu={() => setIsMenuOpen(true)}
              onBack={handleBackToPreviousScreen}
              onNavigateHome={navigateToHome}
            >
              <ProveedoresView
                id="page-proveedores"
                logoUrl={user.logoUrl}
                userFullName={user.fullName}
                user={user}
                documents={documents}
                onAddReceivedInvoice={(cleanDoc) => {
                  const docToSave: GestarianDocument = {
                    ...cleanDoc,
                    type: 'factura_recibida',
                    expediente: undefined,
                  };
                  setDocuments((prev) => {
                    const updated = [docToSave, ...prev.filter((d) => d.id !== cleanDoc.id)];
                    saveStoredDocuments(updated);
                    return updated;
                  });
                  showToast(`Factura recibida ${cleanDoc.number} guardada con éxito`);
                }}
                onViewDoc={(doc) => {
                  setSelectedDoc(doc);
                  setIsClientDocViewMode(false);
                  setIsViewDocOpen(true);
                }}
                onShowToast={showToast}
                onBack={handleBackToPreviousScreen}
                onNavigateHome={navigateToHome}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
            </PageLayoutWrapper>
          </>
        )}

        {/* Mi Equipo e Incidencias: Solo en PRO y ENTERPRISE (Ocultar en LITE y QUICK) */}
        {currentTier !== 'lite' && currentTier !== 'quick' && (
          <>
            {/* 10.5 Mi equipo */}
            <PageLayoutWrapper
              pageId="page-equipo"
              title="Mi equipo"
              currentPlan={currentTier}
              onOpenMenu={() => setIsMenuOpen(true)}
              onBack={handleBackToPreviousScreen}
              onNavigateHome={navigateToHome}
              onNewEmployee={() => {
                window.dispatchEvent(new CustomEvent('gestarian_new_employee'));
              }}
              onSearchEmployee={() => {
                window.dispatchEvent(new CustomEvent('gestarian_toggle_employee_search'));
              }}
            >
              <MiEquipoView
                id="page-equipo"
                employees={user.employees || []}
                documents={documents}
                currentUser={user}
                onUpdateEmployees={(newEmployees) => {
                  setUser((prev) => {
                    const nextUser = { ...prev, employees: newEmployees };
                    saveStoredUser(nextUser);
                    return nextUser;
                  });
                  showToast('Plantilla de empleados y control de jornada actualizados');
                }}
                onNavigateToExpediente={(expId) => {
                  handleNavigateToExpediente(expId);
                }}
                onViewDoc={(doc) => {
                  setSelectedDoc(doc);
                  setIsClientDocViewMode(false);
                  setIsViewDocOpen(true);
                }}
                onShowToast={showToast}
              />
            </PageLayoutWrapper>

            {/* 11. Incidencias */}
            <PageLayoutWrapper
              pageId="page-incidencias"
              title="Incidencias"
              currentPlan={currentTier}
              onOpenMenu={() => setIsMenuOpen(true)}
              onBack={handleBackToPreviousScreen}
              onNavigateHome={navigateToHome}
            >
              <IncidenciasView
                id="page-incidencias"
                logoUrl={user.logoUrl}
                userFullName={user.fullName}
                onBack={handleBackToPreviousScreen}
                onNavigateHome={navigateToHome}
                onOpenMenu={() => setIsMenuOpen(true)}
                onNavigateToExpediente={(expId) => {
                  handleNavigateToExpediente(expId);
                }}
              />
            </PageLayoutWrapper>
          </>
        )}

        {/* 12. Configuración */}
        <ConfiguracionView 
          id="page-configuracion" 
          logoUrl={user.logoUrl} 
          userFullName={user.fullName} 
          currentUser={user}
          currentPlan={currentTier}
          onUpdateUser={(updatedFields) => {
            setUser((prev) => {
              const nextUser = { ...prev, ...updatedFields };
              saveStoredUser(nextUser);
              return nextUser;
            });
            showToast('Datos de la empresa actualizados correctamente');
          }}
          onOpenCustomizer={() => setIsImageCustomizerOpen(true)}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenCompanyConfig={() => setIsNewUserOpen(true)}
          onShowToast={showToast}
          onLogout={handleLogout}
          onScanComplete={(newInvoices) => {
            setDocuments(prev => {
              const prevIds = new Set(prev.map(d => d.id));
              const uniqueNew = newInvoices.filter(d => !prevIds.has(d.id));
              return [...prev, ...uniqueNew];
            });
            showToast(`¡Se han añadido ${newInvoices.length} facturas nuevas!`);
          }}
        />
      </div>

      {/* Modales del Sistema */}
      <NewUserModal
        isOpen={isNewUserOpen}
        onClose={() => setIsNewUserOpen(false)}
        onUserSaved={handleUserSaved}
        currentUser={user}
      />
      
      <CreateDocumentModal
        allDocuments={documents}
        isOpen={isCreateDocOpen}
        docType={createDocType}
        onClose={() => {
          setIsCreateDocOpen(false);
          setPreselectedClientIdForNewDoc(null);
        }}
        onSave={handleSaveDocument}
        currentUser={user}
        clients={clients}
        initialBudget={budgetToConvert}
        preselectedClientId={preselectedClientIdForNewDoc}
        hasPlateRecognizerKey={systemConfig.hasPlateRecognizerKey}
        onShowToast={showToast}
        onNavigateToExpediente={(expId) => {
          setIsCreateDocOpen(false);
          handleNavigateToExpediente(expId);
        }}
        onEditClient={(client) => {
          setEditingClient(client);
          setIsNewClientFullScreenOpen(true);
        }}
        onOpenClientsPage={() => {
          setIsSelectingClientForBudget(true);
          setIsCreateDocOpen(false);
          navigateToSection('page-clientes');
          showToast('Seleccione un cliente de la lista o cree uno nuevo para el presupuesto');
        }}
        onDispatchDoc={handleOpenDocumentDispatch}
        onUpdateUser={handleUserSaved}
      />

      <DocumentDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        document={dispatchModalDoc}
        client={matchedDispatchClient}
        currentUser={user}
        onShowToast={showToast}
        onSentConfirmed={() => {
          if (dispatchModalDoc) {
            const nowIso = new Date().toISOString();
            const nextDocs = documents.map((d) => {
              if (d.id === dispatchModalDoc.id) {
                return {
                  ...d,
                  status: (d.type === 'factura' ? 'enviada' : 'enviado') as any,
                  isLocked: d.type === 'factura',
                  sentAt: nowIso,
                  facturaSentAt: d.type === 'factura' ? nowIso : d.facturaSentAt,
                  facturacionStatus: (d.type === 'factura' ? 'factura_enviada' : d.facturacionStatus) as any,
                };
              }
              if (
                dispatchModalDoc.type === 'factura' &&
                d.type === 'presupuesto' &&
                ((dispatchModalDoc.relatedBudgetId && d.id === dispatchModalDoc.relatedBudgetId) ||
                  (dispatchModalDoc.expediente && d.expediente === dispatchModalDoc.expediente))
              ) {
                return {
                  ...d,
                  isLocked: true,
                  sentAt: nowIso,
                  facturaSentAt: nowIso,
                  facturacionStatus: 'factura_enviada' as any,
                };
              }
              return d;
            });
            setDocuments(nextDocs);
            saveStoredDocuments(nextDocs);
            window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
          }
        }}
      />
      
      <ClientAreaModal
        isOpen={isClientAreaOpen}
        onClose={() => setIsClientAreaOpen(false)}
        clients={clients}
        documents={documents}
        onAddClient={(c) => {
          const maxNum = clients.reduce((max, cl) => Math.max(max, cl.clientNumber || 0), 0);
          const clientWithNum: Client = {
            ...c,
            clientNumber: c.clientNumber || maxNum + 1,
          };
          setClients((prev) => [clientWithNum, ...prev]);
          syncClientToSupabase(clientWithNum);
          showToast(`Cliente ${c.name} añadido a la cartera (ID #${clientWithNum.clientNumber})`);
        }}
        onSelectClientForDoc={handleClientSelectForDoc}
        onSelectClientForAgenda={handleClientSelectForAgenda}
        onViewDoc={(d) => {
          setSelectedDoc(d);
          setIsClientDocViewMode(false);
          setIsViewDocOpen(true);
        }}
      />
      
      <FullScreenClientForm
        isOpen={isNewClientFullScreenOpen}
        initialClient={editingClient}
        onClose={() => {
          setIsNewClientFullScreenOpen(false);
          setEditingClient(null);
        }}
        onSave={(c) => {
          const maxNum = clients.reduce((max, cl) => Math.max(max, cl.clientNumber || 0), 0);
          const newClient: Client = {
            ...c,
            id: `client_${Date.now()}`,
            clientNumber: c.clientNumber || maxNum + 1,
          };
          setClients((prev) => [newClient, ...prev]);
          syncClientToSupabase(newClient);
          showToast(`Cliente ${newClient.name} (ID #${newClient.clientNumber}) guardado correctamente`);
          // Enviar email de bienvenida si tiene email
          if (newClient.email) {
            const appBaseUrl = window.location.origin;
            fetch('/api/send-client-welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientName: newClient.name,
                clientEmail: newClient.email,
                portalUrl: `${appBaseUrl}/?view=app-clientes`,
                appUrl: `${appBaseUrl}/?view=app`,
                workshopName: user.fullName,
              }),
            }).catch(() => {});
          }
          setIsNewClientFullScreenOpen(false);
          setEditingClient(null);

          // Si veníamos desde la selección de cliente en Nuevo Presupuesto, reabrir el presupuesto con el nuevo cliente cargado
          if (isSelectingClientForBudget) {
            setIsSelectingClientForBudget(false);
            setPreselectedClientIdForNewDoc(newClient.id);
            setBudgetToConvert((prev) => prev ? {
              ...prev,
              clientId: newClient.id,
              clientName: newClient.name,
              clientCif: newClient.cif || '',
              clientAddress: newClient.address || '',
              clientPhone: newClient.phone || '',
              clientEmail: newClient.email || '',
              vehiclePlate: newClient.plates && newClient.plates.length > 0 ? newClient.plates[0] : (prev.vehiclePlate || ''),
            } : null);
            setCreateDocType('presupuesto');
            setIsCreateDocOpen(true);
            showToast(`Cliente ${newClient.name} creado y cargado en el presupuesto`);
          }
        }}
        onUpdateClient={(updatedClient) => {
          setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
          syncClientToSupabase(updatedClient);
          showToast(`Cliente ${updatedClient.name} (ID #${updatedClient.clientNumber ?? 1}) actualizado`);
          setIsNewClientFullScreenOpen(false);
          setEditingClient(null);
        }}
        onSaveAndCreateBudget={(c) => {
          const maxNum = clients.reduce((max, cl) => Math.max(max, cl.clientNumber || 0), 0);
          const newClient: Client = {
            ...c,
            id: `client_${Date.now()}`,
            clientNumber: c.clientNumber || maxNum + 1,
          };
          setClients((prev) => [newClient, ...prev]);
          syncClientToSupabase(newClient);
          showToast(`Cliente ${newClient.name} (ID #${newClient.clientNumber}) guardado correctamente`);
          // Email bienvenida
          if (newClient.email) {
            const appBaseUrl = window.location.origin;
            fetch('/api/send-client-welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientName: newClient.name,
                clientEmail: newClient.email,
                portalUrl: `${appBaseUrl}/?view=app-clientes`,
                appUrl: `${appBaseUrl}/?view=app`,
                workshopName: user.fullName,
              }),
            }).catch(() => {});
          }
          setIsNewClientFullScreenOpen(false);
          setEditingClient(null);
          handleClientSelectForDoc(newClient, 'presupuesto');
        }}
      />
      
      <FiscalReportsModal
        isOpen={isFiscalReportsOpen}
        onClose={() => setIsFiscalReportsOpen(false)}
        documents={documents}
      />
      
      <AgendaModal
        isOpen={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
        appointments={appointments}
        clients={clients}
        onAddAppointment={(a) => {
          setAppointments((prev) => [a, ...prev]);
          showToast('Cita añadida a la agenda');
        }}
        onUpdateStatus={(id, status) => {
          setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a))
          );
          showToast(`Estado de cita actualizado a ${status}`);
        }}
        initialBudgetForAppointment={agendaBudgetTrigger}
      />
      
      <SpecModal isOpen={isSpecOpen} onClose={() => setIsSpecOpen(false)} />
      
      <PlateScannerModal
        isOpen={isPlateScannerOpen}
        onClose={() => setIsPlateScannerOpen(false)}
        clients={clients}
        documents={documents}
        hasApiKey={systemConfig.hasPlateRecognizerKey}
        onStartBudgetWithVehicle={({ plate, vehicleModel, client, vehicleImages, isManualEntry }) => {
          setIsPlateScannerOpen(false);
          const clientToUse = client || null;

          if (client) {
            showToast(`Cliente en memoria: ${client.name} (${plate})`);
          } else {
            showToast(`Matrícula ${plate} lista con ${vehicleImages.length} foto(s) para expediente`);
          }

          const newExp = `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          setBudgetToConvert({
            id: '',
            type: 'presupuesto',
            number: '',
            series: 'A',
            date: new Date().toISOString().split('T')[0],
            issuerId: user.id,
            issuerName: user.fullName,
            issuerCif: user.cif,
            issuerAddress: user.fiscalAddress,
            issuerPhone: user.phone,
            issuerEmail: user.email,
            issuerLogoUrl: user.logoUrl,
            clientId: clientToUse?.id || '',
            clientName: clientToUse?.name || '',
            clientCif: clientToUse?.cif || '',
            clientAddress: clientToUse?.address || '',
            clientEmail: clientToUse?.email || '',
            clientPhone: clientToUse?.phone || '',
            items: [
              {
                id: `item_${Date.now()}`,
                description: `Reparación y servicios - Vehículo ${plate}${vehicleModel ? ` (${vehicleModel})` : ''}`,
                quantity: 1,
                unitPrice: 0,
                amount: 0,
              },
            ],
            subtotal: 0,
            applyIva: true,
            ivaRate: 21,
            ivaAmount: 0,
            applyIrpf: false,
            irpfRate: 15,
            irpfAmount: 0,
            total: 0,
            status: 'borrador',
            isLocked: false,
            expediente: newExp,
            vehiclePlate: plate,
            vehicleModel: vehicleModel,
            vehicleImages: vehicleImages,
            notes: `Vehículo matrícula ${plate}. ${vehicleImages.length} foto(s) adjuntas al expediente. Validez: 30 días.${isManualEntry ? ' (Entrada manual)' : ''}`,
          });

          setCreateDocType('presupuesto');
          setIsCreateDocOpen(true);
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearNotifications={() => {
          setNotifications([]);
          showToast('Historial de notificaciones limpiado');
        }}
        onDeleteNotification={(id) => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          showToast('Aviso eliminado');
        }}
        onViewOrder={() => {
          setIsNotificationsOpen(false);
          setIsWorkOrdersOpen(true);
        }}
        onOpenBudgetReview={handleOpenBudgetPricingReview}
        onViewDocument={(docIdOrNum) => {
          const targetDoc = documents.find((d) => d.id === docIdOrNum || d.number === docIdOrNum || d.expediente === docIdOrNum);
          if (targetDoc) {
            setSelectedDoc(targetDoc);
            setIsViewDocOpen(true);
          } else {
            showToast(`Documento ${docIdOrNum} no encontrado`);
          }
        }}
        onDownloadDocumentPdf={async (docIdOrNum) => {
          const targetDoc = documents.find((d) => d.id === docIdOrNum || d.number === docIdOrNum || d.expediente === docIdOrNum);
          if (targetDoc) {
            showToast(`Descargando documento ${targetDoc.number} en vista de impresión...`);
            await generateDocumentPdf(targetDoc, { userLogoUrl: user.logoUrl });
          } else {
            showToast(`Documento ${docIdOrNum} no encontrado`);
          }
        }}
      />
      
      <WorkOrdersModal 
        isOpen={isWorkOrdersOpen}
        onClose={() => setIsWorkOrdersOpen(false)}
        documents={documents}
        currentUser={user}
        loggedEmployeeSession={loggedEmployeeSession}
        onUpdateStatus={(docId, status, employeeName, orderNumber) => {
          setDocuments((prev) =>
            prev.map((d) => {
              if (d.id === docId) {
                const tallerStatus = status === 'en_ejecucion' 
                  ? 'en_reparacion' 
                  : status === 'finalizada' 
                  ? 'reparacion_finalizada' 
                  : d.tallerStatus;
                const facturacionStatus = status === 'en_ejecucion' ? 'finalizar_reparacion' : d.facturacionStatus;
                return { 
                  ...d, 
                  workOrderStatus: status,
                  tallerStatus,
                  facturacionStatus,
                  createdByName: employeeName || d.createdByName,
                };
              }
              return d;
            })
          );
          const statusLabel = status === 'en_ejecucion' ? 'En ejecución' : status === 'finalizada' ? 'Finalizada' : 'Pendiente';
          const actionVerb = status === 'en_ejecucion' ? 'iniciado' : status === 'finalizada' ? 'finalizado' : 'actualizado';
          const orderRef = orderNumber || docId;
          const empRef = employeeName || 'El empleado autorizado';
          const newNotif: InternalNotification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: `Orden ${orderRef}: ${statusLabel}`,
            message: `${empRef} ha ${actionVerb} la orden de trabajo. Estado actual: «${statusLabel}».`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'order_status_change',
            orderId: docId,
            newStatus: status,
            employeeName: employeeName,
          };
          setNotifications((prev) => [newNotif, ...prev]);
          showToast(`Orden ${orderRef} cambiada a "${statusLabel}" por ${empRef}`);
        }}
      />

      <MetisChatModal
        isOpen={isMetisChatOpen}
        onClose={() => setIsMetisChatOpen(false)}
        currentUser={user}
        documents={documents}
        clients={clients}
        appointments={appointments}
        onNavigate={(sectionId, tab) => {
          if (tab) {
            setFacturacionInitialTab(tab);
          }
          navigateToSection(sectionId);
        }}
        onToggleFullscreen={toggleFullscreen}
        onOpenPlateScanner={() => setIsPlateScannerOpen(true)}
        onOpenNewBudget={handleOpenNewBudget}
        onOpenNewClient={() => {
          setEditingClient(null);
          setIsNewClientFullScreenOpen(true);
        }}
        onOpenDetectedInvoices={() => setIsDetectedInvoicesOpen(true)}
      />

      <MetisVoiceAssistantModal
        isOpen={isMetisVoiceOpen}
        onClose={() => setIsMetisVoiceOpen(false)}
        currentUser={user}
        documents={documents}
        clients={clients}
        appointments={appointments}
        onNavigate={(sectionId, tab) => {
          if (tab) {
            setFacturacionInitialTab(tab);
          }
          navigateToSection(sectionId);
        }}
        onToggleFullscreen={toggleFullscreen}
        onOpenPlateScanner={() => setIsPlateScannerOpen(true)}
        onOpenNewBudget={handleOpenNewBudget}
        onOpenNewClient={() => {
          setEditingClient(null);
          setIsNewClientFullScreenOpen(true);
        }}
        onOpenDetectedInvoices={() => setIsDetectedInvoicesOpen(true)}
      />

      <ImageCustomizerModal
        isOpen={isImageCustomizerOpen}
        onClose={() => setIsImageCustomizerOpen(false)}
        currentUser={user}
        onSaveBackgrounds={(updated) => {
          setUser((prev) => ({
            ...prev,
            ...updated,
          }));
          showToast('Fondos personalizados aplicados y guardados');
        }}
        onSelectImage={handleApplyCustomizedImageFromApp}
      />

      {loggedClientSession && (
        <ClientPortalModal
          isOpen={isClientPortalOpen}
          onClose={() => setIsClientPortalOpen(false)}
          loggedClient={loggedClientSession}
          user={user}
          documents={documents}
          onUpdateDocumentStatus={(docId, newStatus, newDeliveryDate, updatedDocPartial) => {
              setDocuments((prev) => {
                const nextDocs = prev.map((d) =>
                  d.id === docId
                    ? {
                        ...d,
                        status: newStatus,
                        ...(newDeliveryDate ? { vehicleDeliveryDate: newDeliveryDate } : {}),
                        ...updatedDocPartial,
                      }
                    : d
                );
                saveStoredDocuments(nextDocs);
                try {
                  window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
                } catch (e) {}
                return nextDocs;
              });
              showToast(`Presupuesto ${newStatus === 'aceptado' ? 'aceptado' : 'actualizado'} con éxito`);
            }}
          onSendNotificationToWorkshop={(notif) => {
            setNotifications((prev) => [notif, ...prev]);
            playGentleChime();
            showToast(`Notificación enviada a ${user.fullName}: ${notif.title}`);
          }}
          onViewDoc={(doc) => {
            setSelectedDoc(doc);
            setIsClientDocViewMode(true);
            setIsViewDocOpen(true);
          }}
          onLogoutClient={() => {
            setLoggedClientSession(null);
            setIsClientPortalOpen(false);
            showToast('Sesión de cliente cerrada');
          }}
        />
      )}

      {/* Visor Oficial de Documentos / Facturas / Presupuestos en A4 con z-[100] */}
      <DocumentViewerModal
        isOpen={isViewDocOpen}
        document={selectedDoc}
        onClose={() => {
          setIsViewDocOpen(false);
          setIsClientDocViewMode(false);
        }}
        isClientView={isClientDocViewMode}
        userLogoUrl={user.logoUrl}
        onConfirmInvoice={handleConfirmInvoice}
        onSendInvoice={handleSendInvoice}
        onAcceptBudget={handleAcceptBudget}
        onConvertToInvoice={handleConvertToInvoice}
        onEditDocument={(doc) => {
          setIsViewDocOpen(false);
          setBudgetToConvert(doc.type === 'presupuesto' ? doc : null);
          setCreateDocType(doc.type);
          setIsCreateDocOpen(true);
        }}
        onOpenAgendaForBudget={(budget) => {
          setIsViewDocOpen(false);
          setAgendaBudgetTrigger(budget);
          setIsAgendaOpen(true);
        }}
        onNavigateToExpediente={(expNum) => {
          setIsViewDocOpen(false);
          setIsClientDocViewMode(false);
          setTargetExpedienteId(expNum);
          setIsClientPortalOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Modal de Facturas Detectadas por Rastreo con Listado de Tarjetas y Visor PDF */}
      <DetectedInvoicesModal
        isOpen={isDetectedInvoicesOpen}
        onClose={() => setIsDetectedInvoicesOpen(false)}
        detectedInvoices={detectedInvoices}
        onIncorporateInvoice={handleIncorporateDetectedInvoice}
        onRejectInvoice={handleRejectDetectedInvoice}
        onDeleteInvoice={handleDeleteDetectedInvoice}
        userLogoUrl={user.logoUrl}
        onShowToast={showToast}
      />

      {/* Modal de Conexión Telemática AEAT y Red B2B para Enterprise */}
      <EnterpriseAeatModal
        isOpen={isEnterpriseAeatOpen}
        onClose={() => setIsEnterpriseAeatOpen(false)}
        currentUser={user}
        onShowToast={showToast}
      />

      {/* Modal de Extras Anuales para Quick */}
      <QuickExtrasModal
        isOpen={isQuickExtrasOpen}
        onClose={() => setIsQuickExtrasOpen(false)}
        currentUser={user}
        onUpdateUser={(updatedFields) => {
          setUser((prev) => {
            const next = { ...prev, ...updatedFields };
            saveStoredUser(next);
            return next;
          });
        }}
        onShowToast={showToast}
      />
    </div>
  );
}
