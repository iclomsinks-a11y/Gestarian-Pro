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
import { AccessSelectorModal } from './components/AccessSelectorModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { IntroAnimation } from './components/IntroAnimation';
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
import { ShieldCheck, Maximize, Minimize } from 'lucide-react';

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
  'page-incidencias',
  'page-configuracion'
];

export default function App() {
  // Estado principal persistente
  const [user, setUser] = useState<AppUser>(getStoredUser);
  const [targetExpedienteId, setTargetExpedienteId] = useState<string | null>(null);
  const [targetClientId, setTargetClientId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>(getStoredClients);
  const [documents, setDocuments] = useState<GestarianDocument[]>(getStoredDocuments);
  const [appointments, setAppointments] = useState<Appointment[]>(getStoredAppointments);
  const [notifications, setNotifications] = useState<InternalNotification[]>(getStoredNotifications);
  const [currentTier, setCurrentTier] = useState<'lite' | 'pro' | 'enterprise'>(user.currentTier || 'pro');

  // Landing pública — visible cuando el usuario no ha configurado la app
  const isUserConfigured = Boolean(user.fullName && user.fullName.trim().length > 2);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Si hay ?view= param en URL o rutas específicas, no mostrar landing (enlace directo)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname;
      const hostname = window.location.hostname;
      
      if (params.get('view') || params.get('exp') || params.get('doc')) return false;
      if (pathname.includes('/doc/') || pathname.includes('/p/') || pathname.includes('/exp/') || pathname.includes('/app')) return false;
      if (hostname.includes('clientes-gestarian')) return false;
    }
    // Siempre mostrar la animación de inicio por defecto
    return true;
  });

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
  const [isAccessSelectorOpen, setIsAccessSelectorOpen] = useState(false);
  const [loggedClientSession, setLoggedClientSession] = useState<Client | null>(null);
  const [loggedEmployeeSession, setLoggedEmployeeSession] = useState<Employee | null>(null);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);

  // Envío oficial (WhatsApp / Correo) con URL corta de Supabase
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchModalDoc, setDispatchModalDoc] = useState<GestarianDocument | null>(null);

  // Creación y Visualización de Documentos
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [createDocType, setCreateDocType] = useState<DocumentType>('presupuesto');
  const [budgetToConvert, setBudgetToConvert] = useState<GestarianDocument | null>(null);
  const [preselectedClientIdForNewDoc, setPreselectedClientIdForNewDoc] = useState<string | null>(null);

  const [isViewDocOpen, setIsViewDocOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GestarianDocument | null>(null);
  const [isClientDocViewMode, setIsClientDocViewMode] = useState(false);
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

  // Manejo automático de enlaces recibidos en WhatsApp / Email
  const urlHandledRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || urlHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    let viewParam = params.get('view');
    let idParam = params.get('id');

    // Soporte para enlaces cortos gestairan.com (/doc/P26001, /exp/E26001, /app)
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    if (!viewParam && pathname) {
      if (pathname.includes('/doc/')) {
        viewParam = 'doc';
        idParam = pathname.split('/doc/')[1].split('/')[0].split('?')[0];
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
      window.location.href = 'https://clientes-gestarian.web.app';
    } else if (viewParam === 'login-clientes') {
      setIsAccessSelectorOpen(true);
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
            facturacionStatus: 'factura_enviada',
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
            facturacionStatus: 'factura_enviada',
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
    setBudgetToConvert(null);
    setPreselectedClientIdForNewDoc(null);
    setCreateDocType('presupuesto');
    setIsCreateDocOpen(true);
  };

  const handleOpenNewInvoice = () => {
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
    setScreenHistory((prev) => {
      if (prev[prev.length - 1] === sectionId) return prev;
      return [...prev, sectionId];
    });
    const el = document.getElementById(sectionId);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBackToPreviousScreen = () => {
    if (screenHistory.length > 1) {
      const updated = [...screenHistory];
      updated.pop(); // Sacar la pantalla actual
      const previousScreen = updated[updated.length - 1] || 'page-inicio';
      setScreenHistory(updated);
      const el = document.getElementById(previousScreen);
      if (el && scrollContainerRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      const el = document.getElementById('page-inicio');
      if (el && scrollContainerRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Redirigir a la pantalla de INICIO (ej: al pulsar el logo en cualquier pantalla)
  const navigateToHome = () => {
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

  // Mostrar animación de inicio
  if (showIntro) {
    return (
      <IntroAnimation
        onComplete={() => {
          setShowIntro(false);
          // Si no tiene usuario configurado, abrir el modal de configuración
          if (!isUserConfigured) {
            setTimeout(() => setIsNewUserOpen(true), 500);
          }
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#F8F7F3] text-[#1E293B] font-sans selection:bg-[#0F2942] selection:text-white">
      {/* Botón Flotante Pantalla Completa (Bottom Left) */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-[100] p-2 text-white mix-blend-difference hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
        title={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        
      </button>

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
      />

      {/* Contenedor Principal con Scroll Horizontal Snap */}
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheelScroll}
        className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth"
      >
        {/* 1. Inicio */}
        <HomeView 
          currentUser={user} 
          onOpenScanner={() => setIsPlateScannerOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={notifications.filter((n) => !n.read).length}
          onOpenMetisChat={() => setIsMetisChatOpen(true)}
          onOpenVoiceAssistant={() => setIsMetisVoiceOpen(true)}
          pendingBudgetReviews={pendingBudgetReviews}
          onOpenBudgetReview={handleOpenBudgetPricingReview}
          onOpenImageCustomizer={() => setIsImageCustomizerOpen(true)}
          onOpenAccessSelector={() => setIsAccessSelectorOpen(true)}
        />

        {/* 2. Expedientes */}
        <ExpedientesView 
          documents={documents}
          clients={clients}
          onBack={() => {
             setTargetExpedienteId(null);
             setClientExpedienteFilter(null);
             handleBackToPreviousScreen();
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
        />

        {/* 3. Solicitudes */}
        <SolicitudesView
          id="page-solicitudes"
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          onNewBudgetWithData={(data) => {
            const matchingClient = clients.find(
              (c) =>
                c.name.toLowerCase() === data.clientName?.toLowerCase() ||
                (c.phone && data.clientPhone && c.phone.replace(/\D/g, '') === data.clientPhone.replace(/\D/g, '')) ||
                (data.vehiclePlate && c.plates?.includes(data.vehiclePlate.toUpperCase()))
            );

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
              clientName: data.clientName || matchingClient?.name || '',
              clientCif: matchingClient?.cif || '',
              clientAddress: matchingClient?.address || '',
              clientEmail: data.clientEmail || matchingClient?.email || '',
              clientPhone: data.clientPhone || matchingClient?.phone || '',
              vehiclePlate: data.vehiclePlate || '',
              vehicleBrand: data.vehicleBrand || '',
              vehicleModel: data.vehicleModel || '',
              vehicleImages: data.images || [],
              items: [
                {
                  id: `item_${Date.now()}`,
                  description: data.description || `Reparación y servicios según solicitud ${data.solicitudNumber || ''}`,
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
              irpfRate: 0,
              irpfAmount: 0,
              total: 0,
              status: 'borrador',
              isLocked: false,
              notes: 'Validez del presupuesto: 30 días.\nEste presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.',
            };

            setBudgetToConvert(newBudget);
            setCreateDocType('presupuesto');
            setIsCreateDocOpen(true);
            showToast(`Presupuesto ${budgetNum} iniciado con el número reservado para la solicitud ${data.solicitudNumber || ''}`);
          }}
          onNavigateToExpediente={(expId) => {
            setTargetExpedienteId(expId);
            navigateToSection('page-expedientes');
          }}
        />

        {/* 4. Clientes */}
        <ClientesCardsView
          id="page-clientes"
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          clients={clients}
          documents={documents}
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
            navigateToSection('page-expedientes');
          }}
          onViewClientInvoices={(client) => {
            setClientFacturacionFilter(client.id);
            navigateToSection('page-facturacion');
          }}
        />

        {/* 5. Presupuestos */}
        <PlaceholderView 
          id="page-presupuestos" 
          title="Presupuestos" 
          logoUrl={user.logoUrl} 
          userFullName={user.fullName} 
          onBack={() => {
            setBudgetSearchFilter('');
            handleBackToPreviousScreen();
          }}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
        >
          <DocumentList
            documents={documents.filter((d) => d.type === 'presupuesto')}
            initialSearch={budgetSearchFilter}
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
          />
        </PlaceholderView>

        {/* 6. Citas */}
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
            setTargetExpedienteId(expId);
            navigateToSection('page-expedientes');
          }}
        />

        {/* 7. Taller */}
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
            setTargetExpedienteId(expId);
            navigateToSection('page-expedientes');
          }}
          onUpdateDocument={handleSaveDocument}
          onShowToast={showToast}
        />

        {/* 8. Facturación */}
        <FacturacionView
          id="page-facturacion"
          user={user}
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          documents={documents}
          initialTab="emitidas"
          initialClientFilterId={clientFacturacionFilter}
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
            setDocuments(prev => [...prev, doc]);
          }}
          onNavigateToExpediente={(expId) => {
            setTargetExpedienteId(expId);
            navigateToSection('page-expedientes');
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

                    return { ...d, payments: updatedPayments, status: 'PAGADO' };
                  }

                  return { ...d, payments: updatedPayments };
                }
                return d;
              })
            );
          }}
        />

        {/* 9. Balances */}
        <BalancesView
          id="page-balances"
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          documents={documents}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
        />

        {/* 10. Proveedores */}
        <ProveedoresView
          id="page-proveedores"
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
        />

        {/* 11. Incidencias */}
        <IncidenciasView
          id="page-incidencias"
          logoUrl={user.logoUrl}
          userFullName={user.fullName}
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          onNavigateToExpediente={(expId) => {
            setTargetExpedienteId(expId);
            navigateToSection('page-expedientes');
          }}
        />

        {/* 12. Configuración */}
        <ConfiguracionView 
          id="page-configuracion" 
          logoUrl={user.logoUrl} 
          userFullName={user.fullName} 
          onBack={handleBackToPreviousScreen}
          onNavigateHome={navigateToHome}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenCompanyConfig={() => setIsNewUserOpen(true)}
          onOpenSpec={() => setIsSpecOpen(true)}
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
          setTargetExpedienteId(expId);
          navigateToSection('page-expedientes');
        }}
        onEditClient={(client) => {
          setEditingClient(client);
          setIsNewClientFullScreenOpen(true);
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
        onSentConfirmed={() => {
          if (dispatchModalDoc) {
            setDocuments((prev) =>
              prev.map((d) => {
                if (d.id === dispatchModalDoc.id) {
                  return {
                    ...d,
                    status: d.type === 'factura' ? 'enviada' : 'confirmada',
                    isLocked: d.type === 'factura',
                    sentAt: new Date().toISOString(),
                    facturaSentAt: d.type === 'factura' ? new Date().toISOString() : d.facturaSentAt,
                    facturacionStatus: d.type === 'factura' ? 'factura_enviada' : d.facturacionStatus,
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
                    sentAt: new Date().toISOString(),
                    facturaSentAt: new Date().toISOString(),
                    facturacionStatus: 'factura_enviada',
                  };
                }
                return d;
              })
            );
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
      />

      <MetisVoiceAssistantModal
        isOpen={isMetisVoiceOpen}
        onClose={() => setIsMetisVoiceOpen(false)}
        currentUser={user}
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

      <AccessSelectorModal
        isOpen={isAccessSelectorOpen}
        onClose={() => setIsAccessSelectorOpen(false)}
        clients={clients}
        user={user}
        documents={documents}
        activeEmployeeSession={loggedEmployeeSession}
        onSelectClientSession={(client) => {
          setLoggedClientSession(client);
          setIsClientPortalOpen(true);
          showToast(`Sesión iniciada como cliente ${client.name}`);
        }}
        onSelectEmployeeSession={(emp) => {
          setLoggedEmployeeSession(emp);
          showToast(`Sesión iniciada como Autorizado: ${emp.name} (${emp.profession || 'Oficial'})`, 5000);
        }}
        onLogoutEmployeeSession={() => {
          setLoggedEmployeeSession(null);
          showToast('Sesión de Autorizado cerrada');
        }}
        onNavigateToTaller={() => {
          navigateToSection('page-taller');
        }}
        onOpenNewUserModal={() => setIsNewUserOpen(true)}
      />

      {loggedClientSession && (
        <ClientPortalModal
          isOpen={isClientPortalOpen}
          onClose={() => setIsClientPortalOpen(false)}
          loggedClient={loggedClientSession}
          user={user}
          documents={documents}
          onUpdateDocumentStatus={(docId, newStatus, newDeliveryDate, updatedDocPartial) => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === docId
                  ? {
                      ...d,
                      status: newStatus,
                      ...(newDeliveryDate ? { vehicleDeliveryDate: newDeliveryDate } : {}),
                      ...updatedDocPartial,
                    }
                  : d
              )
            );
            showToast(`Documento actualizado`);
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
    </div>
  );
}
