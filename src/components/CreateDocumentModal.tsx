import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Car,
  Upload,
  Image as ImageIcon,
  UserPen,
  Users,
  Printer,
  Save,
  FolderKanban,
  MessageCircle,
  Mail,
  Calendar,
  Lock,
  Search,
  Euro,
  CheckCircle2,
  Home,
} from "lucide-react";
import {
  AppUser,
  Client,
  DocumentItem,
  DocumentType,
  GestarianDocument,
  DocumentPayment,
  getDefaultIvaRate,
} from "../types";
import { SheetPlusPIcon } from "./BudgetIcons";
import { playGentleChime } from "../utils/audioNotification";
import { ExpedienteImagesModal } from "./ExpedienteImagesModal";
import { DeliveryDatePickerModal } from "./DeliveryDatePickerModal";
import {
  getNextDocumentNumber,
  getExpedienteFromDocNumber,
  sanitizePlate,
  getStoredSolicitudes,
  saveStoredSolicitudes,
} from "../services/storage";
import { buildDocumentDispatchPayload } from "../services/documentDispatchService";

export function formatDeliveryDateDisplay(dateStr: string): string {
  if (!dateStr) return "";

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}))?/);
  const esMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[T\s](\d{2}:\d{2}))?/);

  let y: number, m: number, d: number, timeStr = "";

  if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10) - 1;
    d = parseInt(isoMatch[3], 10);
    timeStr = isoMatch[4] || "";
  } else if (esMatch) {
    d = parseInt(esMatch[1], 10);
    m = parseInt(esMatch[2], 10) - 1;
    y = parseInt(esMatch[3], 10);
    timeStr = esMatch[4] || "";
  } else {
    return dateStr.replace(/\b20\d\d\b\s*/, "").trim();
  }

  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dateObj = new Date(y, m, d);
  const dayName = daysOfWeek[dateObj.getDay()];
  const monthName = monthNames[m];

  return `${dayName} ${d} ${monthName}${timeStr ? ` ${timeStr}` : ''}`;
}

export function get30DaysList(): { isoDate: string; dayName: string; dayNum: number; monthName: string }[] {
  const daysList = [];
  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const isoDate = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];
    const dayNum = d.getDate();
    const monthName = monthNames[d.getMonth()];
    daysList.push({ isoDate, dayName, dayNum, monthName });
  }
  return daysList;
}

interface CreateDocumentModalProps {
  isOpen: boolean;
  inline?: boolean;
  docType: DocumentType;
  onClose: () => void;
  onSave: (
    doc: GestarianDocument,
    options?: { sendDirectly?: boolean; sentByEmployee?: boolean },
  ) => void;
  currentUser: AppUser;
  clients: Client[];
  initialBudget?: GestarianDocument | null;
  preselectedClientId?: string | null;
  allDocuments?: GestarianDocument[];
  hasPlateRecognizerKey?: boolean;
  onShowToast?: (msg: string) => void;
  onNavigateToExpediente?: (expId: string) => void;
  onEditClient?: (client: Client) => void;
  onDispatchDoc?: (doc: GestarianDocument) => void;
  onUpdateUser?: (user: AppUser) => void;
  onOpenClientsPage?: () => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  inline = false,
  docType,
  onClose,
  onSave,
  currentUser,
  clients,
  initialBudget,
  preselectedClientId,
  allDocuments = [],
  onShowToast,
  onNavigateToExpediente,
  onEditClient,
  onUpdateUser,
  onOpenClientsPage,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Un presupuesto SÓLO se cierra cuando la factura asociada ha sido enviada al cliente
  const isInvoiceSentForBudget = Boolean(
    initialBudget?.type === 'presupuesto' &&
    initialBudget?.convertedToInvoiceId &&
    allDocuments.some((d) => d.id === initialBudget.convertedToInvoiceId && (d.status === 'enviada' || d.isLocked))
  );

  const isLocked = Boolean(
    initialBudget?.isLocked ||
    isInvoiceSentForBudget ||
    (docType === 'factura' && (initialBudget?.status === 'enviada' || initialBudget?.isLocked))
  );

  const [creatorId, setCreatorId] = useState<string>(
    initialBudget?.needsBossPricing
      ? "boss"
      : initialBudget?.createdByEmployeeId || "boss",
  );

  const selectedCreatorEmp = currentUser.employees?.find(
    (e) => e.id === creatorId,
  );
  const canSetPrices =
    creatorId === "boss"
      ? true
      : (selectedCreatorEmp?.permissions?.canSetPrices ?? false);

  // Estados del documento
  const [series] = useState<string>(initialBudget?.series || "A");
  const [docNumber, setDocNumber] = useState<string>(() => {
    if (initialBudget && initialBudget.type === docType) return initialBudget.number;
    if (initialBudget) {
      const exp = initialBudget.expediente || getExpedienteFromDocNumber(initialBudget.number);
      return getNextDocumentNumber(docType, allDocuments, exp);
    }
    return getNextDocumentNumber(docType, allDocuments);
  });
  const [date, setDate] = useState<string>(
    () => initialBudget?.date || new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialBudget?.dueDate) return initialBudget.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialBudget?.clientId || preselectedClientId || "",
  );
  const [isChangingClient, setIsChangingClient] = useState(false);
  const [isQuickNewClient, setIsQuickNewClient] = useState(false);

  // Cliente rápido
  const [quickName, setQuickName] = useState("");
  const [quickCif, setQuickCif] = useState("");
  const [quickAddress, setQuickAddress] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickIsAutonomo, setQuickIsAutonomo] = useState(false);

  // Vehículo y control de visualización
  const [showVehicleData, setShowVehicleData] = useState<boolean>(() => {
    return initialBudget?.showVehicleData !== false;
  });
  const [is30DaysCalendarOpen, setIs30DaysCalendarOpen] = useState<boolean>(false);

  const [vehiclePlate, setVehiclePlate] = useState<string>(
    sanitizePlate(initialBudget?.vehiclePlate || ""),
  );
  const [vehicleBrand, setVehicleBrand] = useState<string>(
    initialBudget?.vehicleBrand || "",
  );
  const [vehicleModel, setVehicleModel] = useState<string>(
    initialBudget?.vehicleModel || "",
  );
  const [vehicleDeliveryDate, setVehicleDeliveryDate] = useState<string>(
    initialBudget?.vehicleDeliveryDate || "",
  );
  const [vehicleImages, setVehicleImages] = useState<string[]>(
    initialBudget?.vehicleImages || [],
  );

  // Localización y control de visualización
  const [showLocationData, setShowLocationData] = useState<boolean>(() => {
    if (initialBudget?.showLocationData !== undefined) {
      return initialBudget.showLocationData;
    }
    return currentUser?.enableLocation === true;
  });
  const [taskLocation, setTaskLocation] = useState<string>(() => {
    return initialBudget?.taskLocation || "";
  });

  // Líneas del documento
  const [items, setItems] = useState<DocumentItem[]>(() => {
    if (initialBudget?.items && initialBudget.items.length > 0) {
      return initialBudget.items.map((it) => ({ ...it }));
    }
    return [
      {
        id: `item-${Date.now()}-1`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ];
  });

  // Impuestos
  const configuredIvaRate = getDefaultIvaRate(currentUser);
  const [applyIva, setApplyIva] = useState<boolean>(
    docType === 'factura' ? true : (initialBudget ? (initialBudget.applyIva ?? true) : true),
  );
  const [ivaRate, setIvaRate] = useState<number>(
    docType === 'factura' ? configuredIvaRate : (initialBudget?.ivaRate ?? configuredIvaRate),
  );
  const [applyIrpf, setApplyIrpf] = useState<boolean>(
    initialBudget ? initialBudget.applyIrpf : false,
  );
  const [irpfRate] = useState<number>(initialBudget?.irpfRate ?? 15);

  const isLite = currentUser.currentTier === 'lite';
  const isQuick = currentUser.currentTier === 'quick';

  // Observaciones con cláusula obligatoria
  const defaultNotesText =
    "Validez del presupuesto: 30 días.\nEste presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.";

  const [notes, setNotes] = useState<string>(() => {
    if (isLite || isQuick) {
      if (initialBudget && initialBudget.type === docType && initialBudget.notes) {
        return initialBudget.notes;
      }
      return "";
    }
    if (initialBudget?.notes) {
      if (
        !initialBudget.notes.includes(
          "Se ruega puntualidad para entregar el vehículo",
        )
      ) {
        return `${initialBudget.notes.trim()}\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.`;
      }
      return initialBudget.notes;
    }
    return docType === "presupuesto" ? defaultNotesText : "";
  });

  // Expediente
  const [expediente, setExpediente] = useState<string>(() => {
    if (initialBudget?.expediente) return initialBudget.expediente;
    if (initialBudget?.number) return getExpedienteFromDocNumber(initialBudget.number);
    return getExpedienteFromDocNumber(getNextDocumentNumber(docType, allDocuments));
  });
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    if (!initialBudget?.id) return false;
    if (docType === 'presupuesto') {
      return Boolean((initialBudget.vehicleDeliveryDate || initialBudget.proposedDeliveryDate)?.trim());
    }
    return true;
  });
  const [savedExpedienteId, setSavedExpedienteId] = useState<string>(() => {
    if (initialBudget?.expediente) return initialBudget.expediente;
    if (initialBudget?.number) return getExpedienteFromDocNumber(initialBudget.number);
    return "";
  });
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Pagos y Cobros para Facturas
  const [payments, setPayments] = useState<DocumentPayment[]>(initialBudget?.payments || []);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('Tarjeta');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Toast de 5s no animado y botón flotante de confirmación de factura
  const [showReviewToast, setShowReviewToast] = useState<boolean>(false);
  const [isInvoiceConfirmed, setIsInvoiceConfirmed] = useState<boolean>(Boolean(initialBudget?.invoiceConfirmed) || isLite || isQuick);
  const [dateWarningMsg, setDateWarningMsg] = useState<string>("");

  // Auto-ocultar el mensaje de aviso de fecha de entrega tras 5 segundos
  useEffect(() => {
    if (dateWarningMsg) {
      const timer = setTimeout(() => {
        setDateWarningMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dateWarningMsg]);

  useEffect(() => {
    if (!isLite && !isQuick && isOpen && docType === 'factura' && !isInvoiceConfirmed) {
      setShowReviewToast(true);
      const timer = setTimeout(() => {
        setShowReviewToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, docType, isInvoiceConfirmed, isLite, isQuick]);

  // Modales adicionales
  const [isExpedienteImagesOpen, setIsExpedienteImagesOpen] = useState(false);
  const [isDeliveryDatePickerOpen, setIsDeliveryDatePickerOpen] = useState(false);
  const [isSelectVehicleModalOpen, setIsSelectVehicleModalOpen] = useState(false);

  // Referencias a inputs de archivos y control de ciclo de vida para no resetear al guardar
  const logoInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);
  const prevBudgetTrackIdRef = useRef<string | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | null>(initialBudget?.id || null);

  // Generar numeración correlativa estándar P26XXXX / F26XXXX y E26XXXX y sincronizar estado
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    const isNewlyOpened = !prevIsOpenRef.current;
    const currentTrackId = initialBudget
      ? `${initialBudget.id}_${docType}`
      : `new_${docType}_${preselectedClientId || ''}`;
    const isBudgetChanged = currentTrackId !== prevBudgetTrackIdRef.current;

    prevIsOpenRef.current = true;
    prevBudgetTrackIdRef.current = currentTrackId;

    // Si la modal ya estaba abierta y no cambió el presupuesto a editar, NO sobreescribir ni resetear datos
    if (!isNewlyOpened && !isBudgetChanged) {
      return;
    }

    if (initialBudget) {
      setSavedDocId(initialBudget.id);
      const exp = initialBudget.expediente || getExpedienteFromDocNumber(initialBudget.number);
      setExpediente(exp);
      setSavedExpedienteId(exp);

      if (initialBudget.type === docType) {
        setDocNumber(initialBudget.number);
        // El presupuesto no se puede dar por guardado si no ha sido cumplimentada la fecha propuesta de entrega
        const hasDeliveryDate = Boolean(
          (initialBudget.vehicleDeliveryDate || initialBudget.proposedDeliveryDate)?.trim()
        );
        setIsSaved(docType === 'presupuesto' ? hasDeliveryDate : true);
      } else {
        // Conversión a otro tipo de documento manteniendo la misma terminación de 4 dígitos del expediente
        const convertedNum = getNextDocumentNumber(docType, allDocuments, exp);
        setDocNumber(convertedNum);
        setIsSaved(false);
      }

      setDate(initialBudget.date || new Date().toISOString().split("T")[0]);
      setDueDate(initialBudget.dueDate || new Date().toISOString().split("T")[0]);

      if (initialBudget.clientId) {
        setSelectedClientId(initialBudget.clientId);
      } else {
        setSelectedClientId("");
        setQuickName(initialBudget.clientName || "");
        setQuickCif(initialBudget.clientCif || "");
        setQuickAddress(initialBudget.clientAddress || "");
        setQuickPhone(initialBudget.clientPhone || "");
        setQuickEmail(initialBudget.clientEmail || "");
      }

      setShowVehicleData(initialBudget.showVehicleData !== false);
      setVehiclePlate(sanitizePlate(initialBudget.vehiclePlate || ""));
      setVehicleBrand(initialBudget.vehicleBrand || "");
      setVehicleModel(initialBudget.vehicleModel || "");
      setVehicleDeliveryDate(initialBudget.vehicleDeliveryDate || "");
      setVehicleImages(initialBudget.vehicleImages || []);
      setShowLocationData(initialBudget.showLocationData !== undefined ? initialBudget.showLocationData : (currentUser?.enableLocation === true));
      setTaskLocation(initialBudget.taskLocation || "");
      setPayments(initialBudget.payments || []);
      setIsInvoiceConfirmed(Boolean(initialBudget.invoiceConfirmed));

      if (initialBudget.items && initialBudget.items.length > 0) {
        setItems(initialBudget.items.map((it) => ({ ...it })));
      }

      if (docType === 'factura') {
        setApplyIva(true);
        setIvaRate(configuredIvaRate);
      } else {
        setApplyIva(initialBudget.applyIva ?? true);
        setIvaRate(initialBudget.ivaRate ?? configuredIvaRate);
      }
      setApplyIrpf(initialBudget.applyIrpf ?? false);

      if (isLite || isQuick) {
        if (initialBudget.type === docType && initialBudget.notes) {
          setNotes(initialBudget.notes);
        } else {
          setNotes("");
        }
      } else if (initialBudget.notes) {
        let finalNotes = initialBudget.notes;
        if (!finalNotes.includes("Se ruega puntualidad para entregar el vehículo")) {
          finalNotes = `${finalNotes.trim()}\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.`;
        }
        setNotes(finalNotes);
      } else {
        setNotes(docType === "presupuesto" ? defaultNotesText : "");
      }
    } else {
      setSavedDocId(null);
      const nextNumber = getNextDocumentNumber(docType, allDocuments);
      setDocNumber(nextNumber);
      const newExp = getExpedienteFromDocNumber(nextNumber);
      setExpediente(newExp);
      setSavedExpedienteId("");
      setIsSaved(false);
      setDate(new Date().toISOString().split("T")[0]);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split("T")[0]);

      if (preselectedClientId) {
        setSelectedClientId(preselectedClientId);
      } else {
        setSelectedClientId("");
        setQuickName("");
        setQuickCif("");
        setQuickAddress("");
        setQuickPhone("");
        setQuickEmail("");
      }

      setShowVehicleData(currentUser?.enableVehicle !== false);
      setVehiclePlate("");
      setVehicleBrand("");
      setVehicleModel("");
      setVehicleDeliveryDate("");
      setVehicleImages([]);
      setShowLocationData(currentUser?.enableLocation === true);
      setTaskLocation("");
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
      setApplyIva(true);
      setIvaRate(configuredIvaRate);
      setApplyIrpf(false);
      setNotes((isLite || isQuick) ? "" : (docType === "presupuesto" ? defaultNotesText : ""));
    }
  }, [isOpen, initialBudget, docType, preselectedClientId, isLite, isQuick, configuredIvaRate]);

  // Listener para resetear hoja A4 limpia al pulsar "Nuevo Presupuesto" o "Nueva Factura" en modo inline (Lite)
  useEffect(() => {
    if (!inline) return;
    const handleResetDoc = () => {
      const nextNumber = getNextDocumentNumber(docType, allDocuments);
      setDocNumber(nextNumber);
      const newExp = getExpedienteFromDocNumber(nextNumber);
      setExpediente(newExp);
      setSavedExpedienteId("");
      setSavedDocId(null);
      setIsSaved(false);
      setDate(new Date().toISOString().split("T")[0]);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split("T")[0]);
      setSelectedClientId("");
      setQuickName("");
      setQuickCif("");
      setQuickAddress("");
      setQuickPhone("");
      setQuickEmail("");
      setShowVehicleData(currentUser?.enableVehicle !== false);
      setVehiclePlate("");
      setVehicleBrand("");
      setVehicleModel("");
      setVehicleDeliveryDate("");
      setVehicleImages([]);
      setShowLocationData(currentUser?.enableLocation === true);
      setTaskLocation("");
      setItems([
        {
          id: `item-${Date.now()}-1`,
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
      setApplyIva(true);
      setIvaRate(configuredIvaRate);
      setApplyIrpf(false);
      setNotes((isLite || isQuick) ? "" : (docType === "presupuesto" ? defaultNotesText : ""));
    };

    const evtName = docType === 'presupuesto' ? 'gestarian_new_budget' : 'gestarian_new_invoice';
    window.addEventListener(evtName, handleResetDoc);
    return () => window.removeEventListener(evtName, handleResetDoc);
  }, [inline, docType, allDocuments, isLite, isQuick, configuredIvaRate]);

  // Selección de cliente
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  useEffect(() => {
    if (selectedClient && !initialBudget) {
      if (selectedClient.taskLocation) {
        setTaskLocation(selectedClient.taskLocation);
      } else if (selectedClient.address && !taskLocation) {
        setTaskLocation(selectedClient.address);
      }
      const clientVehicles = selectedClient.vehicles || [];
      if (clientVehicles.length === 1) {
        const firstVeh = clientVehicles[0];
        setVehiclePlate(sanitizePlate(firstVeh.plate || ""));
        setVehicleBrand(firstVeh.brand || "");
        setVehicleModel(firstVeh.model || "");
        if (firstVeh.images && firstVeh.images.length > 0) {
          setVehicleImages(firstVeh.images);
        }
      } else if (clientVehicles.length > 1) {
        // Si el cliente tiene varios vehículos, auto-cargar el primero si no hay ninguno pero además abrir el modal de sus vehículos
        if (!vehiclePlate) {
          const firstVeh = clientVehicles[0];
          setVehiclePlate(sanitizePlate(firstVeh.plate || ""));
          setVehicleBrand(firstVeh.brand || "");
          setVehicleModel(firstVeh.model || "");
          if (firstVeh.images && firstVeh.images.length > 0) {
            setVehicleImages(firstVeh.images);
          }
        }
        setIsSelectVehicleModalOpen(true);
      } else if (
        selectedClient.plates &&
        selectedClient.plates.length > 0 &&
        !vehiclePlate
      ) {
        setVehiclePlate(sanitizePlate(selectedClient.plates[0]));
      }
    }
  }, [selectedClient, initialBudget]);

  // Cálculo de totales
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const effectiveApplyIva = docType === 'factura' ? true : applyIva;
  const effectiveIvaRate = docType === 'factura' ? configuredIvaRate : ivaRate;
  const ivaAmount = effectiveApplyIva ? (subtotal * effectiveIvaRate) / 100 : 0;
  const irpfAmount = applyIrpf ? (subtotal * irpfRate) / 100 : 0;
  const total = subtotal + ivaAmount - irpfAmount;

  // Manejadores de tabla
  const handleItemChange = (
    index: number,
    field: keyof DocumentItem,
    val: string | number,
  ) => {
    if (isLocked) return;
    const updated = [...items];
    const target = { ...updated[index] };

    if (field === "description") {
      target.description = String(val);
    } else if (field === "quantity") {
      const q = parseFloat(String(val)) || 0;
      target.quantity = q;
      target.amount = Math.round(q * target.unitPrice * 100) / 100;
    } else if (field === "unitPrice") {
      const p = parseFloat(String(val)) || 0;
      target.unitPrice = p;
      target.amount = Math.round(target.quantity * p * 100) / 100;
    }
    updated[index] = target;
    setItems(updated);
    setIsSaved(false);
  };

  const addItemRow = () => {
    if (isLocked) return;
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length + 1}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
    setIsSaved(false);
  };

  const removeItemRow = (index: number) => {
    if (isLocked) return;
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
    setIsSaved(false);
  };

  // Clasificación del cliente para envío de presupuestos:
  // 1. Empresa SL: CIF empieza por B (o A) -> Enviar por Email
  // 2. Autónomo profesional: isAutonomo marcado -> Enviar por WhatsApp y Email
  // 3. Particular no profesional: DNI/NIE (no empieza por B, no autónomo) -> Enviar por WhatsApp
  const cifUpper = (selectedClient?.cif || quickCif || "").trim().toUpperCase();
  const isSLCompany =
    cifUpper.startsWith("B") ||
    cifUpper.startsWith("A") ||
    selectedClient?.clientType === "empresa";
  const isAutonomoClient = Boolean(selectedClient?.isAutonomo || quickIsAutonomo);
  const isParticularClient = !isSLCompany && !isAutonomoClient;
  const clientEmailToUse = (selectedClient?.email || quickEmail || "").trim();
  const [isEmailDeliveryActive, setIsEmailDeliveryActive] = useState<boolean>(true);
  const isCompanyOrAutonomo = isSLCompany || isAutonomoClient;
  const isCompanyOrAutonomoWithEmail = isCompanyOrAutonomo && Boolean(clientEmailToUse) && isEmailDeliveryActive;

  // Guardar documento
  const handleSaveDocument = () => {
    if (isLocked) {
      if (onShowToast) onShowToast("El documento está cerrado y no se puede modificar.");
      return;
    }

    // 1. Datos del cliente (al menos Nombre, CIF/DNI y Domicilio/Dirección)
    const clientName = (selectedClient?.name || quickName.trim());
    const clientCif = (selectedClient?.cif || quickCif.trim());
    const clientAddress = (selectedClient?.address || quickAddress.trim());

    if (!clientName || !clientCif || !clientAddress) {
      const msg = "Faltan datos obligatorios del cliente: debe completar Nombre, CIF/DNI y Domicilio.";
      setDateWarningMsg(msg);
      setErrorMsg(msg);
      if (onShowToast) onShowToast(msg);
      return;
    }

    // 2. Al menos un concepto con descripción, cantidad y precio
    const validItems = items.filter(
      (it) => it.description && it.description.trim() !== "" && Number(it.quantity) > 0 && Number(it.unitPrice) > 0
    );

    if (validItems.length === 0) {
      const msg = "Debe incluir al menos un concepto con cantidad y precio.";
      setDateWarningMsg(msg);
      setErrorMsg(msg);
      if (onShowToast) onShowToast(msg);
      return;
    }

    // 3. Fecha de entrega obligatoria para presupuestos (excepto en GESTARIAN LITE)
    if (currentUser.currentTier !== 'lite' && docType === "presupuesto" && (!vehicleDeliveryDate || !vehicleDeliveryDate.trim())) {
      const msg = "La fecha propuesta de entrega es obligatoria para poder guardar el presupuesto.";
      setDateWarningMsg(msg);
      setErrorMsg(msg);
      if (onShowToast) onShowToast(msg);
      return;
    }

    // Limpiar cualquier aviso previo
    setDateWarningMsg("");
    setErrorMsg("");

    const cleanPlate = sanitizePlate(vehiclePlate);
    const finalExpediente = expediente || getExpedienteFromDocNumber(docNumber);

    const docId = initialBudget?.id || `doc_${Date.now()}`;
    const docData: GestarianDocument = {
      id: docId,
      type: docType,
      number: docNumber,
      series,
      date,
      dueDate,
      issuerId: currentUser.id,
      issuerName: currentUser.fullName,
      issuerCif: currentUser.cif,
      issuerAddress: currentUser.fiscalAddress,
      issuerPhone: currentUser.phone,
      issuerEmail: currentUser.email,
      issuerLogoUrl: currentUser.logoUrl,
      clientId: selectedClient?.id || `cli_temp_${Date.now()}`,
      clientName: selectedClient?.name || quickName.trim(),
      clientCif: selectedClient?.cif || quickCif.trim().toUpperCase(),
      clientAddress: selectedClient?.address || quickAddress.trim(),
      clientPhone: selectedClient?.phone || quickPhone.trim(),
      clientEmail: selectedClient?.email || quickEmail.trim(),
      items: items.map((it) => ({
        ...it,
        description: it.description.trim() || "Concepto de taller",
      })),
      subtotal,
      applyIva: effectiveApplyIva,
      ivaRate: effectiveIvaRate,
      ivaAmount,
      applyIrpf,
      irpfRate,
      irpfAmount,
      total,
      status: initialBudget?.status || "borrador",
      isLocked: false,
      expediente: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick') ? undefined : finalExpediente,
      showVehicleData,
      showLocationData,
      taskLocation: showLocationData ? taskLocation.trim() : '',
      vehiclePlate: showVehicleData ? cleanPlate : '',
      vehicleBrand: showVehicleData ? vehicleBrand.trim() : '',
      vehicleModel: showVehicleData ? vehicleModel.trim() : '',
      vehicleDeliveryDate: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData) ? '' : vehicleDeliveryDate,
      vehicleDeliveryTime: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : (vehicleDeliveryDate.match(/(\d{2}:\d{2})/)?.[1] || initialBudget?.vehicleDeliveryTime || '10:00'),
      proposedDeliveryDate: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData) ? undefined : (vehicleDeliveryDate || undefined),
      proposedDeliveryTime: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : (vehicleDeliveryDate.match(/(\d{2}:\d{2})/)?.[1] || initialBudget?.proposedDeliveryTime || '10:00'),
      deliveryDateProposedBy: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : 'workshop',
      vehicleImages: showVehicleData ? vehicleImages : [],
      notes,
      payments,
      invoiceConfirmed: isInvoiceConfirmed,
    };

    onSave(docData, { sendDirectly: false });
    setIsSaved(true);
    setSavedExpedienteId(finalExpediente);
    setErrorMsg("");
    playGentleChime();
    if (onShowToast) {
      onShowToast(`${docType === 'factura' ? 'Factura' : 'Presupuesto'} ${docNumber} guardado correctamente.`);
    }
  };

  const handlePrint = () => {
    if (docType === "presupuesto" && (!vehicleDeliveryDate || !vehicleDeliveryDate.trim())) {
      const msg = "Debe cumplimentar la fecha propuesta de entrega antes de guardar o imprimir el presupuesto.";
      setDateWarningMsg(msg);
      setErrorMsg(msg);
      if (onShowToast) {
        onShowToast(msg);
      }
      return;
    }
    if (!isSaved) {
      if (onShowToast) {
        onShowToast("Guarde el presupuesto antes de imprimirlo.");
      }
      return;
    }
    window.print();
  };

  const handleAccessClientData = () => {
    if (selectedClient && onEditClient) {
      onEditClient(selectedClient);
    } else if (onShowToast) {
      onShowToast("Seleccione un cliente para ver su ficha.");
    }
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    if (docType === "presupuesto" && (!vehicleDeliveryDate || !vehicleDeliveryDate.trim())) {
      const msg = "Debe cumplimentar la fecha propuesta de entrega antes de guardar o enviar el presupuesto.";
      setDateWarningMsg(msg);
      setErrorMsg(msg);
      if (onShowToast) {
        onShowToast(msg);
      }
      return;
    }
    if (!isSaved) {
      if (onShowToast) {
        onShowToast("Guarde el documento antes de enviarlo.");
      }
      return;
    }
    const phone = selectedClient?.phone || quickPhone;
    if (!phone) {
      if (onShowToast) {
        onShowToast("El cliente no tiene un teléfono registrado para WhatsApp.");
      }
      return;
    }

    const cleanPlate = sanitizePlate(vehiclePlate);
    const finalExpediente = savedExpedienteId || expediente || getExpedienteFromDocNumber(docNumber);

    const docData: GestarianDocument = {
      id: initialBudget?.id || `doc_${Date.now()}`,
      type: docType,
      number: docNumber,
      series,
      date,
      dueDate,
      issuerId: currentUser.id,
      issuerName: currentUser.fullName,
      issuerCif: currentUser.cif,
      issuerAddress: currentUser.fiscalAddress,
      issuerPhone: currentUser.phone,
      issuerEmail: currentUser.email,
      issuerLogoUrl: currentUser.logoUrl,
      clientId: selectedClient?.id || `cli_temp_${Date.now()}`,
      clientName: selectedClient?.name || quickName.trim() || "Cliente",
      clientCif: selectedClient?.cif || quickCif.trim().toUpperCase(),
      clientAddress: selectedClient?.address || quickAddress.trim(),
      clientPhone: phone,
      clientEmail: selectedClient?.email || quickEmail.trim(),
      items,
      subtotal,
      applyIva: effectiveApplyIva,
      ivaRate: effectiveIvaRate,
      ivaAmount,
      applyIrpf,
      irpfRate,
      irpfAmount,
      total,
      status: "enviado",
      sentAt: new Date().toISOString(),
      isLocked: false,
      expediente: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick') ? undefined : finalExpediente,
      showVehicleData,
      showLocationData,
      taskLocation: showLocationData ? taskLocation.trim() : '',
      vehiclePlate: showVehicleData ? cleanPlate : '',
      vehicleBrand: showVehicleData ? vehicleBrand.trim() : '',
      vehicleModel: showVehicleData ? vehicleModel.trim() : '',
      vehicleDeliveryDate: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData) ? '' : vehicleDeliveryDate,
      vehicleDeliveryTime: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : (vehicleDeliveryDate.match(/(\d{2}:\d{2})/)?.[1] || initialBudget?.vehicleDeliveryTime || '10:00'),
      proposedDeliveryDate: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData) ? undefined : (vehicleDeliveryDate || undefined),
      proposedDeliveryTime: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : (vehicleDeliveryDate.match(/(\d{2}:\d{2})/)?.[1] || initialBudget?.proposedDeliveryTime || '10:00'),
      deliveryDateProposedBy: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : 'workshop',
      notes,
    };

    onSave(docData, { sendDirectly: false });
    setIsSaved(true);

    // Sincronizar solicitud vinculada a ATENDIDA al remitir el presupuesto al cliente
    try {
      const storedSols = getStoredSolicitudes();
      const updatedSols = storedSols.map((s) => {
        if (
          (s.expediente && s.expediente === finalExpediente) ||
          (s.id && (s.id === initialBudget?.solicitudId || s.number === initialBudget?.solicitudNumber))
        ) {
          return { ...s, status: "ATENDIDA" };
        }
        return s;
      });
      saveStoredSolicitudes(updatedSols);
      window.dispatchEvent(new CustomEvent("gestarian_solicitudes_updated"));
    } catch (e) {
      console.error("Error sincronizando solicitud:", e);
    }

    const clientObj: Client = selectedClient || {
      id: `cli_temp_${Date.now()}`,
      name: quickName.trim() || "Cliente",
      cif: quickCif.trim().toUpperCase(),
      phone: phone,
      email: quickEmail.trim(),
      address: quickAddress.trim(),
      isAutonomo: quickIsAutonomo,
      clientType: quickIsAutonomo ? "autonomo" : "particular",
    };

    const payload = buildDocumentDispatchPayload(docData, clientObj, currentUser, 'whatsapp');
    if (payload.actionUrl) {
      const win = window.open(payload.actionUrl, "_blank", "noopener,noreferrer");
      if (!win) {
        window.location.href = payload.actionUrl;
      }
      if (onShowToast) {
        onShowToast("Presupuesto enviado por WhatsApp.");
      }
    }
  };

  // Enviar por Email
  const handleSendEmail = () => {
    if (docType === "presupuesto" && (!vehicleDeliveryDate || !vehicleDeliveryDate.trim())) {
      const msg = "Debe cumplimentar la fecha propuesta de entrega antes de guardar o enviar el presupuesto.";
      setDateWarningMsg(msg);
      setErrorMsg(msg);
      if (onShowToast) {
        onShowToast(msg);
      }
      return;
    }
    if (!isSaved) {
      if (onShowToast) {
        onShowToast("Guarde el documento antes de enviarlo.");
      }
      return;
    }
    const email = selectedClient?.email || quickEmail;
    if (!email) {
      if (onShowToast) {
        onShowToast("El cliente no tiene un correo electrónico registrado.");
      }
      return;
    }

    const cleanPlate = sanitizePlate(vehiclePlate);
    const finalExpediente = savedExpedienteId || expediente || getExpedienteFromDocNumber(docNumber);

    const docData: GestarianDocument = {
      id: initialBudget?.id || `doc_${Date.now()}`,
      type: docType,
      number: docNumber,
      series,
      date,
      dueDate,
      issuerId: currentUser.id,
      issuerName: currentUser.fullName,
      issuerCif: currentUser.cif,
      issuerAddress: currentUser.fiscalAddress,
      issuerPhone: currentUser.phone,
      issuerEmail: currentUser.email,
      issuerLogoUrl: currentUser.logoUrl,
      clientId: selectedClient?.id || `cli_temp_${Date.now()}`,
      clientName: selectedClient?.name || quickName.trim() || "Empresa",
      clientCif: selectedClient?.cif || quickCif.trim().toUpperCase(),
      clientAddress: selectedClient?.address || quickAddress.trim(),
      clientPhone: selectedClient?.phone || quickPhone.trim(),
      clientEmail: email,
      items,
      subtotal,
      applyIva: effectiveApplyIva,
      ivaRate: effectiveIvaRate,
      ivaAmount,
      applyIrpf,
      irpfRate,
      irpfAmount,
      total,
      status: "enviado",
      sentAt: new Date().toISOString(),
      isLocked: false,
      expediente: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick') ? undefined : finalExpediente,
      showVehicleData,
      showLocationData,
      taskLocation: showLocationData ? taskLocation.trim() : '',
      vehiclePlate: showVehicleData ? cleanPlate : '',
      vehicleBrand: showVehicleData ? vehicleBrand.trim() : '',
      vehicleModel: showVehicleData ? vehicleModel.trim() : '',
      vehicleDeliveryDate: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData) ? '' : vehicleDeliveryDate,
      vehicleDeliveryTime: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : (vehicleDeliveryDate.match(/(\d{2}:\d{2})/)?.[1] || initialBudget?.vehicleDeliveryTime || '10:00'),
      proposedDeliveryDate: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData) ? undefined : (vehicleDeliveryDate || undefined),
      proposedDeliveryTime: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : (vehicleDeliveryDate.match(/(\d{2}:\d{2})/)?.[1] || initialBudget?.proposedDeliveryTime || '10:00'),
      deliveryDateProposedBy: (currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick' || !showVehicleData || !vehicleDeliveryDate) ? undefined : 'workshop',
      notes,
    };

    onSave(docData, { sendDirectly: false });
    setIsSaved(true);

    // Sincronizar solicitud vinculada a ATENDIDA al remitir el presupuesto al cliente
    try {
      const storedSols = getStoredSolicitudes();
      const updatedSols = storedSols.map((s) => {
        if (
          (s.expediente && s.expediente === finalExpediente) ||
          (s.id && (s.id === initialBudget?.solicitudId || s.number === initialBudget?.solicitudNumber))
        ) {
          return { ...s, status: "ATENDIDA" };
        }
        return s;
      });
      saveStoredSolicitudes(updatedSols);
      window.dispatchEvent(new CustomEvent("gestarian_solicitudes_updated"));
    } catch (e) {
      console.error("Error sincronizando solicitud:", e);
    }

    const clientObj: Client = selectedClient || {
      id: `cli_temp_${Date.now()}`,
      name: quickName.trim() || "Empresa",
      cif: quickCif.trim().toUpperCase(),
      address: quickAddress || "",
      phone: quickPhone.trim(),
      email: email,
      isAutonomo: quickIsAutonomo,
      clientType: isSLCompany ? "empresa" : "autonomo",
    };

    const payload = buildDocumentDispatchPayload(docData, clientObj, currentUser, 'email');
    if (payload.actionUrl) {
      window.location.href = payload.actionUrl;
      if (onShowToast) {
        onShowToast("Abriendo aplicación de correo electrónico...");
      }
    }
  };

  if (!isOpen && !inline) return null;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(0, total - totalPaid);

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newPaymentAmount);
    if (!amt || amt <= 0) return;
    const newP: DocumentPayment = {
      id: `pay_${Date.now()}`,
      amount: amt,
      date: newPaymentDate || new Date().toISOString().split("T")[0],
    };
    const updatedPayments = [...payments, newP];
    setPayments(updatedPayments);
    setNewPaymentAmount("");
    if (onShowToast) onShowToast(`Cobro de ${amt.toFixed(2)} € registrado.`);
  };

  return (
    <div
      className={inline
        ? "w-full h-full flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 bg-slate-100/90 overflow-y-auto"
        : "fixed inset-0 z-50 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 bg-white overflow-y-auto"
      }
      onClick={(e) => {
        if (!inline && e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toast no animado de 5 segundos al generar la factura (Oculto en Lite) */}
      {showReviewToast && !isLite && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#0F2942] text-white px-6 py-3 rounded-xl shadow-2xl border border-sky-400/50 flex items-center gap-3 text-xs font-bold transition-none print:hidden">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Revise y confirme la factura antes de guardar</span>
        </div>
      )}

      {/* Botón flotante superior centrado para Confirmar Factura (Oculto en Lite) */}
      {docType === "factura" && !isInvoiceConfirmed && !isLite && (
        <div className="sticky top-2 z-[90] my-2 flex justify-center w-full pointer-events-auto print:hidden">
          <button
            type="button"
            onClick={() => {
              setIsInvoiceConfirmed(true);
              setShowReviewToast(false);
              handleSaveDocument();
              if (onShowToast) onShowToast("Factura revisada y confirmada con éxito.");
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-2xl border-2 border-white flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Confirmar Factura</span>
          </button>
        </div>
      )}

      {/* HOJA DEL PRESUPUESTO / FACTURA: ANCHO TOTAL EN PANTALLA COMPLETA, RELLENO COLOR BLANCO */}
      <div
        className="w-full max-w-5xl my-1 sm:my-3 bg-white text-blue-950 rounded-2xl border border-sky-100 shadow-xl flex flex-col relative p-4 sm:p-8 md:p-10 font-sans select-none"
        style={{
          minHeight: "1050px",
        }}
      >
        {/* PRIMERA LÍNEA: INPUT NÚMERO DE FACTURA Y CALENDARIO DE FECHA (80% DEL ANCHO EN MÓVIL Y TABLET PORTRAIT) */}
        <div className="relative flex flex-col md:flex-row items-center justify-between pb-4 mb-5 border-b-2 border-blue-950 gap-4 w-full">
          {/* GRUPO DE INPUTS PRINCIPALES: NÚMERO Y FECHA (80% DE ANCHO EN MÓVIL Y TABLET PORTRAIT) */}
          <div className="w-[80%] max-w-2xl mx-auto md:w-auto md:max-w-none md:mx-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            {/* Input Número de Factura / Presupuesto con teclado alfanumérico por defecto en móvil/tablet */}
            <div className="flex-1 flex flex-col justify-center">
              <label className="text-[11px] font-black uppercase text-blue-900 tracking-wider mb-1 block">
                Nº {docType === 'factura' ? 'Factura' : 'Presupuesto'}:
              </label>
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                value={docNumber}
                readOnly={isLocked}
                onChange={(e) => {
                  setDocNumber(e.target.value.toUpperCase());
                  setIsSaved(false);
                }}
                className="w-full font-mono font-black text-xl sm:text-2xl text-blue-950 bg-white border-2 border-sky-400 focus:border-blue-900 rounded-2xl px-4 py-2.5 outline-none shadow-xs transition-all"
                placeholder={docType === 'factura' ? "Ej: F260001" : "Ej: P260001"}
              />
            </div>

            {/* Input / Botón Fecha de Emisión con Dibujito de Calendario (Próximos 30 Días) */}
            <div className="flex-1 flex flex-col justify-center">
              <label className="text-[11px] font-black uppercase text-blue-900 tracking-wider mb-1 block">
                Fecha de Emisión:
              </label>
              <div className="flex items-center gap-2 bg-sky-50 border-2 border-sky-400 rounded-2xl px-3 py-1.5 shadow-xs">
                {/* Dibujito de Calendario que abre el selector interactivo de 30 días */}
                <button
                  type="button"
                  onClick={() => !isLocked && setIs30DaysCalendarOpen(true)}
                  className="p-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  title="Abrir calendario interactivo (Próximos 30 días)"
                >
                  <Calendar className="w-6 h-6 stroke-[2.5]" />
                </button>

                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  value={date}
                  readOnly={isLocked}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setIsSaved(false);
                  }}
                  className="w-full font-mono font-black text-base sm:text-lg text-blue-950 bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Expediente (Ocultar en GESTARIAN LITE y QUICK) */}
          {currentUser.currentTier !== 'lite' && currentUser.currentTier !== 'quick' && (
            <div className="hidden lg:flex items-center gap-2 bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-2xl shrink-0">
              <span className="text-xs uppercase font-black text-slate-500">Expediente:</span>
              <span className="text-xl font-black font-mono tracking-tight text-sky-700">
                {savedExpedienteId || expediente || getExpedienteFromDocNumber(docNumber)}
              </span>
            </div>
          )}

          {/* Botón cerrar a la derecha */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer print:hidden flex items-center gap-1.5 border border-blue-200"
              title="Cerrar y volver"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Notificación de bloqueo si el documento está cerrado */}
        {isLocked && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs sm:text-sm text-amber-900 flex items-center gap-2 print:hidden">
            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            <span className="font-semibold">
              Presupuesto cerrado: Factura enviada al cliente tras la reparación. La edición queda bloqueada.
            </span>
          </div>
        )}

        {/* MENSAJE DE AVISO DE FECHA DE ENTREGA: APARECE AL PULSAR GUARDAR SI NO ESTÁ CUMPLIMENTADA, DURA 5 SEGUNDOS Y SE OCULTA SOLO */}
        {dateWarningMsg && (
          <div className="mb-4 p-4 bg-amber-500 text-white rounded-2xl shadow-lg border-2 border-amber-600 flex items-center justify-between gap-3 text-sm sm:text-base font-bold animate-pulse print:hidden">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-6 h-6 text-amber-100 shrink-0" />
              <span>{dateWarningMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setDateWarningMsg("")}
              className="p-1 hover:bg-amber-600 rounded-lg text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* SEGUNDA LÍNEA: TARJETAS DE EMPRESA EMISORA Y CLIENTE (PRIMERO EMISOR Y LUEGO CLIENTE) - FONDO CELESTE CLARITO SIN LÍNEA DE BORDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* 1. Tarjeta Empresa/Taller Emisor: Esquinas redondeadas, relleno fondo celeste clarito visible sin línea de borde */}
          <div className="bg-sky-100/80 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 shadow-xs">
            <div className="flex-1 min-w-0">
              <span className="font-black text-xs sm:text-sm uppercase text-blue-950 tracking-wider block mb-2">
                EMPRESA / TALLER EMISOR:
              </span>
              <h2 className="text-lg sm:text-xl font-black text-blue-950 uppercase tracking-tight truncate">
                {currentUser.fullName}
              </h2>
              <p className="text-sm sm:text-base text-blue-900 mt-1 leading-relaxed">
                {currentUser.fiscalAddress || "Dirección de la empresa"}
              </p>
              <p className="text-sm sm:text-base text-blue-900 mt-0.5">
                NIF/CIF: <span className="font-bold text-blue-950">{currentUser.cif}</span>
              </p>
              <p className="text-sm sm:text-base text-blue-900 mt-0.5">
                Teléfono: <span className="font-bold text-blue-950">{currentUser.phone}</span> {currentUser.email ? `| Email: ${currentUser.email}` : ''}
              </p>
            </div>

            {currentUser.logoUrl ? (
              <div className="shrink-0 flex items-center justify-center p-1.5 bg-white rounded-xl shadow-xs">
                <img
                  src={currentUser.logoUrl}
                  alt="Logo Empresa"
                  className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
                />
              </div>
            ) : null}
          </div>

          {/* 2. Tarjeta Cliente: Esquinas redondeadas, relleno fondo celeste clarito visible sin línea de borde */}
          {/* 2. Tarjeta Cliente: Relleno manual directo de datos del cliente */}
          <div className="bg-sky-100/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-start shadow-xs">
            <span className="font-black text-xs sm:text-sm uppercase text-blue-950 tracking-wider mb-2">
              DATOS DEL CLIENTE:
            </span>

            <div className="space-y-2 text-blue-950">
              <input
                type="text"
                placeholder="Nombre o Razón Social del Cliente *"
                value={quickName}
                readOnly={isLocked}
                onChange={(e) => {
                  setQuickName(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full font-black text-base sm:text-lg uppercase text-blue-950 bg-white/90 px-3.5 py-1.5 rounded-xl border border-sky-300 outline-none placeholder-blue-300 shadow-2xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="NIF / CIF *"
                  value={quickCif}
                  readOnly={isLocked}
                  onChange={(e) => {
                    setQuickCif(e.target.value.toUpperCase());
                    setIsSaved(false);
                  }}
                  className="w-full font-bold text-sm sm:text-base text-blue-950 bg-white/90 px-3 py-1.5 rounded-xl border border-sky-300 outline-none placeholder-blue-300 shadow-2xs"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (WhatsApp)"
                  value={quickPhone}
                  readOnly={isLocked}
                  onChange={(e) => {
                    setQuickPhone(e.target.value);
                    setIsSaved(false);
                  }}
                  className="w-full font-bold text-sm sm:text-base text-blue-950 bg-white/90 px-3 py-1.5 rounded-xl border border-sky-300 outline-none placeholder-blue-300 shadow-2xs"
                />
              </div>
              <input
                type="email"
                placeholder="Correo Electrónico (Email)"
                value={quickEmail}
                readOnly={isLocked}
                onChange={(e) => {
                  setQuickEmail(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full font-bold text-sm sm:text-base text-blue-950 bg-white/90 px-3 py-1 rounded-xl border border-sky-300 outline-none placeholder-blue-300 shadow-2xs"
              />
              <input
                type="text"
                placeholder="Dirección / Domicilio *"
                value={quickAddress}
                readOnly={isLocked}
                onChange={(e) => {
                  setQuickAddress(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full font-medium text-sm sm:text-base text-blue-950 bg-white/90 px-3 py-1 rounded-xl border border-sky-300 outline-none placeholder-blue-300 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 3. TARJETA VEHÍCULO CON CASILLA ACTIVAR/DESACTIVAR DATOS DE VEHÍCULO */}
        {currentUser?.enableVehicle !== false && (
          <div className="bg-sky-100/80 rounded-2xl p-4 sm:p-5 mb-3 flex flex-col gap-3 shadow-xs">
            {/* Casilla activar / desactivar datos de vehículo */}
            <div className="flex items-center justify-between pb-2 border-b border-sky-300/80">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showVehicleData}
                  disabled={isLocked}
                  onChange={(e) => {
                    setShowVehicleData(e.target.checked);
                    setIsSaved(false);
                  }}
                  className="w-5 h-5 rounded text-blue-900 accent-blue-900 cursor-pointer"
                />
                <span className="font-extrabold text-xs sm:text-sm text-blue-950 uppercase tracking-wide">
                  Incluir datos del vehículo en la factura
                </span>
              </label>
              {!showVehicleData && (
                <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  Datos de vehículo desactivados
                </span>
              )}
            </div>

            {/* Fila Superior e Inferior de Datos de Vehículo (Solo si está activado) */}
            {showVehicleData && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                {/* Fila Superior: Cochecito y Dibujo de Matrícula al lado */}
                <div className="flex items-center gap-3">
                  <Car className="w-8 h-8 text-blue-900 shrink-0" />
                  {/* Dibujo de la Matrícula al lado */}
                  <div className="flex items-center border-2 border-slate-900 bg-white rounded-xl overflow-hidden shadow-xs h-10">
                    <div className="bg-blue-800 text-white font-black text-xs px-2.5 h-full flex items-center justify-center border-r border-slate-900">
                      <span>E</span>
                    </div>
                    <input
                      type="text"
                      placeholder="MATRÍCULA"
                      value={vehiclePlate}
                      readOnly={isLocked}
                      onChange={(e) => {
                        setVehiclePlate(sanitizePlate(e.target.value));
                        setIsSaved(false);
                      }}
                      className="font-mono font-black uppercase text-blue-950 bg-transparent px-3 text-base sm:text-xl tracking-widest outline-none w-36 sm:w-44 text-center"
                    />
                  </div>
                </div>

                {/* Fila Inferior: Inscribir directamente la marca y el modelo en una sola línea, el dato sin título */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-sky-300/80">
                  <input
                    type="text"
                    placeholder="Marca del vehículo"
                    value={vehicleBrand}
                    readOnly={isLocked}
                    onChange={(e) => {
                      setVehicleBrand(e.target.value);
                      setIsSaved(false);
                    }}
                    className="font-black text-base sm:text-xl uppercase text-blue-950 bg-white/90 px-3.5 py-1.5 rounded-xl border border-sky-300 outline-none w-40 sm:w-52 shadow-2xs placeholder-blue-300"
                  />
                  <input
                    type="text"
                    placeholder="Modelo del vehículo"
                    value={vehicleModel}
                    readOnly={isLocked}
                    onChange={(e) => {
                      setVehicleModel(e.target.value);
                      setIsSaved(false);
                    }}
                    className="font-black text-base sm:text-xl uppercase text-blue-950 bg-white/90 px-3.5 py-1.5 rounded-xl border border-sky-300 outline-none w-40 sm:w-52 shadow-2xs placeholder-blue-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3B. TARJETA LOCALIZACIÓN CON CASILLA ACTIVAR/DESACTIVAR DATOS DE LOCALIZACIÓN */}
        {(currentUser?.enableLocation || docType === 'factura' || initialBudget?.taskLocation || initialBudget?.showLocationData !== undefined) && (
          <div className="bg-emerald-50/90 rounded-2xl p-4 sm:p-5 mb-3 flex flex-col gap-3 shadow-xs border border-emerald-300/80">
            {/* Casilla activar / desactivar datos de localización */}
            <div className="flex items-center justify-between pb-2 border-b border-emerald-300/80">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLocationData}
                  disabled={isLocked}
                  onChange={(e) => {
                    setShowLocationData(e.target.checked);
                    setIsSaved(false);
                  }}
                  className="w-5 h-5 rounded text-emerald-900 accent-emerald-900 cursor-pointer"
                />
                <span className="font-extrabold text-xs sm:text-sm text-emerald-950 uppercase tracking-wide">
                  Incluir datos de localización en la {docType === 'factura' ? 'factura' : 'factura/presupuesto'}
                </span>
              </label>
              {!showLocationData && (
                <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  Datos de localización desactivados
                </span>
              )}
            </div>

            {/* Fila con botón de casita e input para introducir el lugar donde se realiza la tarea */}
            {showLocationData && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  {/* Botón casita */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedClient?.address && !taskLocation) {
                        setTaskLocation(selectedClient.address);
                        setIsSaved(false);
                      }
                    }}
                    title={selectedClient?.address ? "Pulsar para autocompletar con la dirección del cliente" : "Lugar de la tarea"}
                    className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Home className="w-6 h-6 shrink-0" />
                  </button>

                  {/* Input del lugar donde se realiza la tarea */}
                  <div className="flex-1 flex items-center border-2 border-emerald-900 bg-white rounded-xl overflow-hidden shadow-xs h-10 px-3">
                    <input
                      type="text"
                      placeholder="LUGAR DONDE SE REALIZA LA TAREA"
                      value={taskLocation}
                      readOnly={isLocked}
                      onChange={(e) => {
                        setTaskLocation(e.target.value);
                        setIsSaved(false);
                      }}
                      className="w-full font-bold uppercase text-emerald-950 bg-transparent text-sm sm:text-base tracking-wide outline-none placeholder-emerald-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTÓN PROPONER FECHA DE ENTREGA (Ocultar en GESTARIAN LITE y QUICK) */}
        {currentUser.currentTier !== 'lite' && currentUser.currentTier !== 'quick' && (
          <div className="mb-5 flex items-center justify-start">
            {!vehicleDeliveryDate ? (
              <button
                type="button"
                onClick={() => !isLocked && setIsDeliveryDatePickerOpen(true)}
                className="px-5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl border border-orange-300 cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
                title="PROPONER FECHA DE ENTREGA"
              >
                <Calendar className="w-5 h-5 text-orange-600 shrink-0" />
                <span>PROPONER FECHA DE ENTREGA</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => !isLocked && setIsDeliveryDatePickerOpen(true)}
                className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl border border-orange-300 cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-102"
                title="Pulsar para modificar la fecha de entrega propuesta"
              >
                <Calendar className="w-5 h-5 text-orange-600 shrink-0" />
                <span>Entrega propuesta:</span>
                <span className="font-mono text-sm sm:text-base font-black text-orange-950 bg-white px-2.5 py-0.5 rounded-lg border border-orange-300">
                  {formatDeliveryDateDisplay(vehicleDeliveryDate)}
                </span>
              </button>
            )}
          </div>
        )}

        {/* 4. TABLA DE CONCEPTOS DEL PRESUPUESTO (SOLO: CONCEPTO, UD. PRECIO, IMPORTE - TIPOGRAFÍA X1.5) */}
        <div className="flex-1 flex flex-col mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-blue-950 text-blue-950 font-black uppercase tracking-wider text-base sm:text-lg">
                <th className="py-3 px-2 text-left w-3/5">Concepto</th>
                <th className="py-3 px-2 text-center w-24">Ud.</th>
                <th className="py-3 px-2 text-right w-32">Precio</th>
                <th className="py-3 px-2 text-right w-36">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="group hover:bg-blue-50/50 transition-colors">
                  <td className="py-3 px-2 relative">
                    <input
                      type="text"
                      value={it.description}
                      readOnly={isLocked}
                      placeholder="Pulsar para escribir concepto o trabajo..."
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full bg-transparent outline-none font-bold text-base sm:text-xl text-blue-950 placeholder-blue-300"
                    />
                    {!isLocked && items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={it.quantity}
                      readOnly={isLocked}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-full bg-transparent outline-none text-center font-mono font-bold text-base sm:text-xl text-blue-950"
                    />
                  </td>
                  <td className="py-3 px-2 text-right">
                    {canSetPrices ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.unitPrice}
                        readOnly={isLocked}
                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                        className="w-full bg-transparent outline-none text-right font-mono font-bold text-base sm:text-xl text-blue-950"
                      />
                    ) : (
                      <span className="italic text-amber-700 text-sm">A valorar</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-black text-base sm:text-xl text-blue-950">
                    {canSetPrices ? `${it.amount.toFixed(2)} €` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* BOTÓN + PARA AÑADIR LÍNEA: CENTRADO DEBAJO DE LA ÚLTIMA LÍNEA */}
          {!isLocked && (
            <div className="flex justify-center pt-3 pb-2 print:hidden">
              <button
                type="button"
                onClick={addItemRow}
                className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-950 border border-blue-300 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Añadir nueva línea de concepto"
              >
                <Plus className="w-6 h-6 font-bold" />
              </button>
            </div>
          )}
        </div>

        {/* 5. OBSERVACIONES Y TOTALES (BASE IMPONIBLE, IVA Y TOTAL TAMAÑO X 1.5) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-blue-200 pt-4 mb-6">
          {/* Observaciones */}
          <div>
            <span className="font-black text-base sm:text-lg uppercase text-blue-950 block mb-1.5">
              Observaciones:
            </span>
            <textarea
              rows={4}
              value={notes}
              readOnly={isLocked}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 text-base sm:text-xl outline-none resize-none leading-relaxed font-sans font-medium"
              placeholder={isLite ? "" : defaultNotesText}
            />
          </div>

          {/* Totales: Base Imponible, IVA y Total las tres líneas tamaño x 1.5 */}
          <div className="flex flex-col justify-end space-y-3 md:pl-8">
            <div className="flex justify-between items-center text-blue-900">
              <span className="font-bold text-lg sm:text-2xl">Base Imponible:</span>
              <span className="font-mono font-bold text-lg sm:text-2xl">{canSetPrices ? `${subtotal.toFixed(2)} €` : "-"}</span>
            </div>

            {docType === 'factura' ? (
              <div className="flex justify-between items-center text-blue-900">
                <span className="font-bold text-lg sm:text-2xl">IVA ({effectiveIvaRate}%):</span>
                <span className="font-mono font-bold text-lg sm:text-2xl">{canSetPrices ? `${ivaAmount.toFixed(2)} €` : "0.00 €"}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-blue-900">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyIva}
                    disabled={!canSetPrices || isLocked}
                    onChange={(e) => setApplyIva(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-900 accent-blue-900"
                  />
                  <span className="font-bold text-lg sm:text-2xl">IVA ({effectiveIvaRate}%):</span>
                </label>
                <span className="font-mono font-bold text-lg sm:text-2xl">{canSetPrices && applyIva ? `${ivaAmount.toFixed(2)} €` : "0.00 €"}</span>
              </div>
            )}

            {applyIrpf && (
              <div className="flex justify-between items-center text-blue-900">
                <span className="font-bold text-lg sm:text-2xl">Retención IRPF (15%):</span>
                <span className="font-mono font-bold text-lg sm:text-2xl text-red-600">-{irpfAmount.toFixed(2)} €</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t-2 border-blue-950 text-blue-950">
              <span className="text-xl sm:text-3xl font-black uppercase">TOTAL:</span>
              <span className="text-3xl sm:text-5xl font-black font-mono">
                {canSetPrices ? `${total.toFixed(2)} €` : "Pendiente"}
              </span>
            </div>
          </div>
        </div>

        {/* 6. BOTONES DEL FOOTER CONVERTIDOS EN ICONOS FLOTANTES LIMPIOS SIN DESCRIPCIÓN EN UNA SOLA FILA */}
        {/* 6. BOTÓN PRINCIPAL DE GUARDAR Y ACCIONES DEL FOOTER */}
        <div className="mt-auto pt-6 border-t-2 border-blue-950 flex flex-col items-center justify-center gap-4 print:hidden">
          
          {/* Botón principal de Guardar Presupuesto / Factura */}
          <div className="w-full flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleSaveDocument}
              disabled={isLocked}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-xl ${
                isLocked
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                  : isSaved
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/30"
                  : "bg-blue-900 hover:bg-blue-800 text-white cursor-pointer shadow-blue-900/40 hover:scale-102 active:scale-95"
              }`}
            >
              <Save className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
              <span>
                {isSaved
                  ? `${docType === 'factura' ? 'Factura Guardada' : 'Presupuesto Guardado'}`
                  : `Guardar ${docType === 'factura' ? 'Factura' : 'Presupuesto'}`}
              </span>
            </button>

            {!isSaved && (
              <p className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 mt-1">
                Presione "Guardar {docType === 'factura' ? 'Factura' : 'Presupuesto'}" para activar el envío por WhatsApp, Email e Impresión.
              </p>
            )}

            {isSaved && (
              <div className="w-full flex items-center justify-center text-xs sm:text-sm font-bold px-1 mt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-mono text-xs sm:text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {(currentUser.currentTier === 'lite' || currentUser.currentTier === 'quick')
                      ? `${docType === 'factura' ? 'FACTURA' : 'PRESUPUESTO'} LISTO PARA REMITIR`
                      : `EXPEDIENTE [${savedExpedienteId || expediente}] GUARDADO Y ACTIVADO`}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Iconos flotantes limpios de acción en una sola fila */}
          <div className="w-full flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-8 py-2 px-1">
            {/* 1. EMAIL (activado al guardar) */}
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={!isSaved || !Boolean(quickEmail || selectedClient?.email)}
              className={`p-2 transition-all flex flex-col items-center gap-1 ${
                isSaved && Boolean(quickEmail || selectedClient?.email)
                  ? "cursor-pointer hover:scale-125 active:scale-95 text-sky-600"
                  : "opacity-30 cursor-not-allowed text-slate-400"
              }`}
              title="Enviar por Email"
            >
              <Mail className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2.2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
            </button>

            {/* 2. WHATSAPP (activado al guardar) */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={!isSaved}
              className={`p-2 transition-all flex flex-col items-center gap-1 ${
                isSaved
                  ? "cursor-pointer hover:scale-125 active:scale-95 text-emerald-600"
                  : "opacity-30 cursor-not-allowed text-slate-400"
              }`}
              title="Enviar por WhatsApp"
            >
              <MessageCircle className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2.2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
            </button>

            {/* 3. IMÁGENES DEL VEHÍCULO (Ocultar en GESTARIAN LITE y QUICK) */}
            {currentUser.currentTier !== 'lite' && currentUser.currentTier !== 'quick' && (
              <button
                type="button"
                onClick={() => setIsExpedienteImagesOpen(true)}
                className="p-2 cursor-pointer transition-all hover:scale-125 active:scale-95 text-sky-600 relative flex flex-col items-center gap-1"
                title={`Ver imágenes del vehículo (${vehicleImages.length})`}
              >
                <div className="relative">
                  <ImageIcon className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2.2} />
                  {vehicleImages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {vehicleImages.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Fotos</span>
              </button>
            )}

            {/* 4. IMPRIMIR (activado al guardar) */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!isSaved}
              className={`p-2 transition-all flex flex-col items-center gap-1 ${
                isSaved
                  ? "cursor-pointer hover:scale-125 active:scale-95 text-blue-800"
                  : "opacity-30 cursor-not-allowed text-slate-400"
              }`}
              title="Imprimir / Exportar PDF"
            >
              <Printer className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2.2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Imprimir</span>
            </button>

            {/* 5. EXPEDIENTE (Ocultar en GESTARIAN LITE y QUICK) */}
            {currentUser.currentTier !== 'lite' && currentUser.currentTier !== 'quick' && (
              <button
                type="button"
                onClick={() => {
                  const expNum = savedExpedienteId || expediente || getExpedienteFromDocNumber(docNumber);
                  if (onNavigateToExpediente) {
                    onNavigateToExpediente(expNum);
                  } else if (onShowToast) {
                    onShowToast(`Expediente: ${expNum}`);
                  }
                }}
                className="p-1 sm:p-1.5 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-blue-950"
                title="Ver expediente del presupuesto"
              >
                <FolderKanban className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

          {/* PANEL DE CONTROL DE COBROS PARA FACTURAS (SOLO PRO Y ENTERPRISE) */}
          {docType === "factura" && (currentUser.currentTier === 'pro' || currentUser.currentTier === 'enterprise') && (
            <div className="mt-6 pt-6 border-t-2 border-slate-900 bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-[#0F2942]">
                  <Euro className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Panel de Control de Cobros y Abonos</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded font-mono">Total: {total.toFixed(2)} €</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded font-mono">Abonado: {totalPaid.toFixed(2)} €</span>
                  <span className={`px-2.5 py-1 rounded font-mono ${pendingAmount <= 0 ? "bg-emerald-600 text-white" : "bg-rose-100 text-rose-900"}`}>
                    {pendingAmount <= 0 ? "ABONO TOTAL (100%)" : `Pendiente: ${pendingAmount.toFixed(2)} €`}
                  </span>
                </div>
              </div>

              {/* Mensaje de Abono Total cuando la factura está 100% liquidada */}
              {pendingAmount <= 0 ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-xl mb-4 text-emerald-950 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                      Abono Total de la Factura
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      La factura ha sido abonada y liquidada al 100%. Importe pendiente: <strong>0,00 €</strong>. Consulte a continuación el historial de abonos.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs uppercase rounded-full shrink-0 shadow-xs">
                    Liquidada
                  </span>
                </div>
              ) : (
                /* Formulario para registrar cobros (solo visible si queda saldo pendiente) */
                <form onSubmit={handleRegisterPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Importe a cobrar (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      max={pendingAmount}
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                      placeholder={`${pendingAmount.toFixed(2)} €`}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Método de Pago</label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Bizum">Bizum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm cursor-pointer"
                    >
                      Registrar Cobro
                    </button>
                  </div>
                </form>
              )}

              {/* Historial de Abonos */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Historial de Abonos:</span>
                <div className="divide-y divide-slate-200 bg-white rounded border border-slate-200 overflow-hidden">
                  {payments.length > 0 ? (
                    payments.map((p, idx) => (
                      <div key={p.id || idx} className="p-2.5 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-mono">{p.date}</span>
                          <span className="text-slate-500 text-[11px]">({p.method || 'Abono'})</span>
                        </div>
                        <span className="text-emerald-700 font-bold font-mono">+{p.amount.toFixed(2)} €</span>
                      </div>
                    ))
                  ) : pendingAmount <= 0 ? (
                    <div className="p-2.5 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-mono">{date}</span>
                        <span className="text-slate-500 text-[11px]">(Cobro total de la factura)</span>
                      </div>
                      <span className="text-emerald-700 font-bold font-mono">+{total.toFixed(2)} €</span>
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-slate-400 italic">
                      No hay abonos registrados todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Modal visor de imágenes del expediente */}
      <ExpedienteImagesModal
        isOpen={isExpedienteImagesOpen}
        onClose={() => setIsExpedienteImagesOpen(false)}
        document={{
          id: initialBudget?.id || `doc_temp_${docNumber}`,
          number: initialBudget?.number || docNumber,
          expediente: savedExpedienteId || expediente,
          type: docType,
          series,
          date,
          dueDate,
          issuerId: currentUser.id,
          issuerName: currentUser.fullName,
          issuerCif: currentUser.cif,
          issuerAddress: currentUser.fiscalAddress,
          issuerPhone: currentUser.phone,
          issuerEmail: currentUser.email,
          clientId: selectedClient?.id || "",
          clientName: selectedClient?.name || "",
          clientCif: selectedClient?.cif || "",
          clientAddress: selectedClient?.address || "",
          clientPhone: selectedClient?.phone || "",
          clientEmail: selectedClient?.email || "",
          items,
          subtotal,
          applyIva: effectiveApplyIva,
          ivaRate: effectiveIvaRate,
          ivaAmount,
          applyIrpf,
          irpfRate,
          irpfAmount,
          total,
          status: initialBudget?.status || "borrador",
          isLocked,
          vehiclePlate,
          vehicleBrand,
          vehicleModel,
          vehicleDeliveryDate,
          vehicleImages,
        }}
        client={selectedClient}
        onUpdateImages={(updatedImages) => {
          setVehicleImages(updatedImages);
          if (isSaved) {
            handleSaveDocument();
          }
        }}
        onShowToast={onShowToast}
      />

      {/* Modal de 30 Días para Proponer Fecha de Entrega */}
      <DeliveryDatePickerModal
        isOpen={isDeliveryDatePickerOpen}
        onClose={() => setIsDeliveryDatePickerOpen(false)}
        initialDate={vehicleDeliveryDate}
        onSelectDeliveryDate={(formattedDate) => {
          setVehicleDeliveryDate(formattedDate);
          setErrorMsg("");
          setIsSaved(false);
          if (onShowToast) {
            onShowToast(`Fecha propuesta de entrega fijada: ${formattedDate}`);
          }
        }}
      />

      {/* Modal de Calendario Interactivo de 30 Días para Fecha del Documento */}
      {is30DaysCalendarOpen && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setIs30DaysCalendarOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border-2 border-sky-300 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-blue-950">
                <Calendar className="w-6 h-6 text-sky-600" />
                <h3 className="font-black text-base sm:text-lg uppercase">
                  Seleccionar Fecha (Próximos 30 Días)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIs30DaysCalendarOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600">
              Seleccione la fecha de emisión del documento entre hoy y los siguientes 30 días:
            </p>

            {/* Parrilla de 30 días */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[320px] overflow-y-auto p-1">
              {get30DaysList().map((d) => {
                const isSelected = date === d.isoDate;
                return (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => {
                      setDate(d.isoDate);
                      setIsSaved(false);
                      setIs30DaysCalendarOpen(false);
                      if (onShowToast) onShowToast(`Fecha fijada: ${d.isoDate}`);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sky-600 text-white border-sky-700 shadow-md scale-105"
                        : "bg-slate-50 hover:bg-sky-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase opacity-80">{d.dayName.slice(0, 3)}</span>
                    <span className="text-lg font-black font-mono my-0.5">{d.dayNum}</span>
                    <span className="text-[10px] font-extrabold uppercase">{d.monthName}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIs30DaysCalendarOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
