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
} from "lucide-react";
import {
  AppUser,
  Client,
  DocumentItem,
  DocumentType,
  GestarianDocument,
  DocumentPayment,
} from "../types";
import { SheetPlusPIcon } from "./BudgetIcons";
import { playGentleChime } from "../utils/audioNotification";
import { ExpedienteImagesModal } from "./ExpedienteImagesModal";
import { DeliveryDatePickerModal } from "./DeliveryDatePickerModal";
import {
  getNextDocumentNumber,
  getExpedienteFromDocNumber,
  sanitizePlate,
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

interface CreateDocumentModalProps {
  isOpen: boolean;
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
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
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

  // Vehículo
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
  const [applyIva, setApplyIva] = useState<boolean>(
    initialBudget ? initialBudget.applyIva : true,
  );
  const [ivaRate] = useState<number>(initialBudget?.ivaRate ?? 21);
  const [applyIrpf, setApplyIrpf] = useState<boolean>(
    initialBudget ? initialBudget.applyIrpf : false,
  );
  const [irpfRate] = useState<number>(initialBudget?.irpfRate ?? 15);

  // Observaciones con cláusula obligatoria
  const defaultNotesText =
    "Validez del presupuesto: 30 días.\nEste presupuesto puede verse alterado en función de incidencias no contempladas en primera valoración.\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.";

  const [notes, setNotes] = useState<string>(() => {
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
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(initialBudget?.id));
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
  const [isInvoiceConfirmed, setIsInvoiceConfirmed] = useState<boolean>(Boolean(initialBudget?.invoiceConfirmed));

  useEffect(() => {
    if (isOpen && docType === 'factura' && !isInvoiceConfirmed) {
      setShowReviewToast(true);
      const timer = setTimeout(() => {
        setShowReviewToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, docType, isInvoiceConfirmed]);

  // Modales adicionales
  const [isExpedienteImagesOpen, setIsExpedienteImagesOpen] = useState(false);
  const [isDeliveryDatePickerOpen, setIsDeliveryDatePickerOpen] = useState(false);

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
        setIsSaved(true);
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

      setVehiclePlate(sanitizePlate(initialBudget.vehiclePlate || ""));
      setVehicleBrand(initialBudget.vehicleBrand || "");
      setVehicleModel(initialBudget.vehicleModel || "");
      setVehicleDeliveryDate(initialBudget.vehicleDeliveryDate || "");
      setVehicleImages(initialBudget.vehicleImages || []);
      setPayments(initialBudget.payments || []);
      setIsInvoiceConfirmed(Boolean(initialBudget.invoiceConfirmed));

      if (initialBudget.items && initialBudget.items.length > 0) {
        setItems(initialBudget.items.map((it) => ({ ...it })));
      }

      setApplyIva(initialBudget.applyIva ?? true);
      setApplyIrpf(initialBudget.applyIrpf ?? false);

      if (initialBudget.notes) {
        let finalNotes = initialBudget.notes;
        if (!finalNotes.includes("Se ruega puntualidad para entregar el vehículo")) {
          finalNotes = `${finalNotes.trim()}\nSe ruega puntualidad para entregar el vehículo en la fecha y hora establecida.`;
        }
        setNotes(finalNotes);
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

      setVehiclePlate("");
      setVehicleBrand("");
      setVehicleModel("");
      setVehicleDeliveryDate("");
      setVehicleImages([]);
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
      setApplyIrpf(false);
      setNotes(docType === "presupuesto" ? defaultNotesText : "");
    }
  }, [isOpen, initialBudget, docType, preselectedClientId]);

  // Selección de cliente
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  useEffect(() => {
    if (selectedClient && !initialBudget) {
      if (
        selectedClient.vehicles &&
        selectedClient.vehicles.length > 0 &&
        !vehiclePlate
      ) {
        const firstVeh = selectedClient.vehicles[0];
        setVehiclePlate(sanitizePlate(firstVeh.plate || ""));
        setVehicleBrand(firstVeh.brand || "");
        setVehicleModel(firstVeh.model || "");
      } else if (
        selectedClient.plates &&
        selectedClient.plates.length > 0 &&
        !vehiclePlate
      ) {
        setVehiclePlate(sanitizePlate(selectedClient.plates[0]));
      }
    }
  }, [selectedClient, initialBudget, vehiclePlate]);

  // Cálculo de totales
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const ivaAmount = applyIva ? (subtotal * ivaRate) / 100 : 0;
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
  };

  const removeItemRow = (index: number) => {
    if (isLocked) return;
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
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

  // Guardar documento
  const handleSaveDocument = () => {
    if (isLocked) {
      if (onShowToast) onShowToast("El documento está cerrado y no se puede modificar.");
      return;
    }

    if (!selectedClient && !quickName.trim()) {
      setErrorMsg("Debe seleccionar un cliente o introducir sus datos.");
      return;
    }

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
      applyIva,
      ivaRate,
      ivaAmount,
      applyIrpf,
      irpfRate,
      irpfAmount,
      total,
      status: initialBudget?.status || "borrador",
      isLocked: false,
      expediente: finalExpediente,
      vehiclePlate: cleanPlate,
      vehicleBrand: vehicleBrand.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleDeliveryDate,
      proposedDeliveryDate: vehicleDeliveryDate || undefined,
      deliveryDateProposedBy: vehicleDeliveryDate ? 'workshop' : undefined,
      vehicleImages,
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
    if (!isSaved) {
      handleSaveDocument();
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
    if (!isSaved) {
      handleSaveDocument();
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
      applyIva,
      ivaRate,
      ivaAmount,
      applyIrpf,
      irpfRate,
      irpfAmount,
      total,
      status: initialBudget?.status || "borrador",
      isLocked: false,
      expediente: finalExpediente,
      vehiclePlate: cleanPlate,
      vehicleBrand: vehicleBrand.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleDeliveryDate,
      proposedDeliveryDate: vehicleDeliveryDate || undefined,
      deliveryDateProposedBy: vehicleDeliveryDate ? 'workshop' : undefined,
      notes,
    };

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
        onShowToast("Abriendo WhatsApp para enviar el presupuesto...");
      }
    }
  };

  // Enviar por Email
  const handleSendEmail = () => {
    if (!isSaved) {
      handleSaveDocument();
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
      applyIva,
      ivaRate,
      ivaAmount,
      applyIrpf,
      irpfRate,
      irpfAmount,
      total,
      status: initialBudget?.status || "borrador",
      isLocked: false,
      expediente: finalExpediente,
      vehiclePlate: cleanPlate,
      vehicleBrand: vehicleBrand.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleDeliveryDate,
      proposedDeliveryDate: vehicleDeliveryDate || undefined,
      deliveryDateProposedBy: vehicleDeliveryDate ? 'workshop' : undefined,
      notes,
    };

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

  if (!isOpen) return null;

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 bg-[#0F172A]/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Toast no animado de 5 segundos al generar la factura */}
      {showReviewToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#0F2942] text-white px-6 py-3 rounded-xl shadow-2xl border border-sky-400/50 flex items-center gap-3 text-xs font-bold transition-none print:hidden">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Revise y confirme la factura antes de guardar</span>
        </div>
      )}

      {/* Botón flotante superior centrado para Confirmar Factura */}
      {docType === "factura" && !isInvoiceConfirmed && (
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

      {/* HOJA A4 REAL: 95% de ancho en móvil, 90% en tablet, 80% en PC */}
      <div
        className="w-[95%] md:w-[90%] lg:w-[80%] max-w-[1050px] my-2 sm:my-4 bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 flex flex-col relative p-4 sm:p-8 md:p-10 font-sans select-none"
        style={{
          minHeight: "1050px",
          boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {/* CABECERA: TÍTULO CENTRADO Y BOTÓN CANCELAR A LA DERECHA */}
        <div className="relative flex items-center justify-center pb-2 mb-3">
          <h1 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wider text-center">
            {docType === "presupuesto" ? "PRESUPUESTO" : "FACTURA"}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded transition-all cursor-pointer print:hidden flex items-center gap-1 border border-slate-300 shadow-xs"
            title="Cancelar y cerrar"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>
        </div>

        {/* Notificación de bloqueo si el documento está cerrado */}
        {isLocked && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 flex items-center gap-2 print:hidden">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold">
              Presupuesto cerrado: Factura enviada al cliente tras la reparación. La edición queda bloqueada.
            </span>
          </div>
        )}

        {/* TÍTULO PRINCIPAL CENTRADO OFICIAL: PRESUPUESTO / FACTURA */}
        <div className="text-center pb-3 mb-4 border-b-2 border-slate-900">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-[#0F2942]">
            {docType === "presupuesto" ? "PRESUPUESTO" : docType === "factura" ? "FACTURA" : "DOCUMENTO"}
          </h1>
          <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
            {docType === "presupuesto" ? "PRESUPUESTO OFICIAL" : "FACTURA OFICIAL"} Nº {docNumber} {expediente ? `• EXPEDIENTE ${expediente}` : ''}
          </p>
        </div>

        {/* 1. SECCIÓN SUPERIOR: A LA IZQUIERDA EL LOGO (250x250px) Y A LA DERECHA DEL LOGO LOS DATOS DE LA EMPRESA */}
        <div className="flex flex-row items-start gap-4 border-b border-slate-300 pb-4 mb-5">
          {/* Logo a la izquierda - exactamente 250x250px */}
          <div className="shrink-0">
            {currentUser.logoUrl ? (
              <div 
                className="relative group flex items-center justify-center bg-white border border-slate-200 rounded p-1"
                style={{ width: '250px', height: '250px', minWidth: '250px', maxWidth: '250px', minHeight: '250px', maxHeight: '250px' }}
              >
                <img
                  src={currentUser.logoUrl}
                  alt="Logo"
                  width={250}
                  height={250}
                  className="object-contain"
                  style={{ width: '250px', height: '250px', maxWidth: '250px', maxHeight: '250px', objectFit: 'contain' }}
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold rounded transition-opacity cursor-pointer px-2 text-center"
                    title="Cambiar Logotipo"
                  >
                    Cambiar Logo
                  </button>
                )}
              </div>
            ) : (
              !isLocked && (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  style={{ width: '250px', height: '250px' }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 flex flex-col items-center justify-center text-xs font-bold rounded border border-dashed border-slate-300 transition-all cursor-pointer print:hidden"
                  title="Subir logotipo"
                >
                  <Upload className="w-6 h-6 mb-1 text-slate-400" />
                  <span>Subir Logo</span>
                  <span className="text-[10px] text-slate-400 font-normal">250 × 250 px</span>
                </button>
              )
            )}

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    if (dataUrl && onUpdateUser) {
                      onUpdateUser({ ...currentUser, logoUrl: dataUrl });
                      if (onShowToast) onShowToast("Logotipo actualizado.");
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          {/* A la derecha del logo los datos de la empresa */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate">
              {currentUser.fullName}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {currentUser.fiscalAddress || "Dirección de la empresa"}
            </p>
            <p className="text-xs text-slate-600">
              CIF/NIF: <span className="font-semibold text-slate-900">{currentUser.cif}</span>
            </p>
            <p className="text-xs text-slate-600">
              {currentUser.phone} | {currentUser.email}
            </p>
          </div>
        </div>

        {/* 2. SECCIÓN CLIENTE (IZQUIERDA) Y DATOS DE EMISIÓN / PRESUPUESTO / EXPEDIENTE (DERECHA) */}
        <div className="flex flex-row justify-between items-start gap-2 sm:gap-4 border-b border-slate-300 pb-4 mb-5 text-xs">
          {/* Lado izquierdo: CLIENTE (60% del ancho disponible en móvil, truncando lo que sobrepase, completo en impresión) */}
          <div className="w-[60%] sm:flex-1 max-w-[60%] sm:max-w-none min-w-0 pr-1 sm:pr-2 overflow-hidden print:overflow-visible print:w-auto print:max-w-none">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="font-black text-xs uppercase text-slate-900 tracking-wider">
                CLIENTE:
              </span>
              {!isLocked && !selectedClient && (
                <div className="flex items-center gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickNewClient(false);
                    }}
                    className={`transition-colors cursor-pointer ${
                      !isQuickNewClient ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Seleccionar cliente"
                  >
                    <Search className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickNewClient(true);
                    }}
                    className={`transition-colors cursor-pointer ${
                      isQuickNewClient ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Nuevo cliente"
                  >
                    <SheetPlusPIcon className="w-10 h-10 sm:w-11 sm:h-11" />
                  </button>
                </div>
              )}
            </div>

            {isQuickNewClient && !selectedClient ? (
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded border border-slate-200 print:bg-transparent print:border-0 print:p-0">
                <input
                  type="text"
                  placeholder="Nombre / Razón Social *"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="CIF / NIF *"
                    value={quickCif}
                    onChange={(e) => setQuickCif(e.target.value.toUpperCase())}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white uppercase"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono *"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email *"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
                <input
                  type="text"
                  placeholder="Dirección *"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={quickIsAutonomo}
                    onChange={(e) => setQuickIsAutonomo(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  <span className="font-semibold">Autónomo profesional</span>
                </label>
              </div>
            ) : (
              <div>
                {!selectedClient && (
                  <div className="mb-2 print:hidden relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedClientId}
                      onChange={(e) => {
                        setSelectedClientId(e.target.value);
                        setIsChangingClient(false);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-sm sm:text-base bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-900 cursor-pointer focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs outline-none"
                    >
                      <option value="" disabled className="text-sm font-medium text-slate-500">
                        Seleccionar cliente...
                      </option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id} className="text-sm sm:text-base font-semibold py-1 text-slate-900">
                          {c.name} {c.cif ? `(${c.cif})` : ""} {c.isAutonomo ? "[Autónomo]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedClient ? (
                  <div className="space-y-0.5 text-slate-800 overflow-hidden print:overflow-visible">
                    <p className="font-bold text-sm uppercase text-slate-950 truncate print:whitespace-normal print:overflow-visible">
                      {selectedClient.name}
                    </p>
                    <p className="text-slate-600 truncate print:whitespace-normal print:overflow-visible">
                      NIF/CIF: <span className="font-semibold text-slate-900">{selectedClient.cif || "---"}</span>
                    </p>
                    <p className="text-slate-600 truncate print:whitespace-normal print:overflow-visible">
                      Dirección: {selectedClient.address || "---"}
                    </p>
                    <p className="text-slate-600 truncate print:whitespace-normal print:overflow-visible">
                      Tel: {selectedClient.phone || "---"}
                    </p>
                    <p className="text-slate-600 truncate print:whitespace-normal print:overflow-visible">
                      Email: {selectedClient.email || "---"}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">
                    Ningún cliente seleccionado
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lado derecho: METADATOS JUSTIFICADOS A LA DERECHA */}
          <div className="shrink-0 flex flex-col items-end text-right space-y-1 pt-0.5 min-w-[80px]">
            {/* Fecha y debajo centrada la fecha */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider leading-none">
                FECHA
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs mt-0.5 leading-tight">
                {(date || new Date().toISOString().split("T")[0]).split("-").reverse().join("/")}
              </span>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              <span className="font-bold text-slate-600 uppercase text-[10px]">
                Nº:
              </span>
              <span className="font-black text-slate-950 font-mono text-xs">
                {docNumber}
              </span>
            </div>

            <div className="flex items-center justify-end gap-1.5">
              <span className="font-bold text-slate-600 uppercase text-[10px]">
                Exp:
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs uppercase">
                {savedExpedienteId || expediente || getExpedienteFromDocNumber(docNumber)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN VEHÍCULO (DEBAJO DE CLIENTE Y METADATOS) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-300 pb-4 mb-5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-600" />
              VEHÍCULO:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Matrícula"
                value={vehiclePlate}
                readOnly={isLocked}
                onChange={(e) => setVehiclePlate(sanitizePlate(e.target.value))}
                className="font-mono font-black uppercase text-slate-950 bg-transparent border-0 outline-none p-0 w-[75px] text-xs tracking-tight placeholder:text-slate-400"
              />
              <input
                type="text"
                placeholder="Marca"
                value={vehicleBrand}
                readOnly={isLocked}
                onChange={(e) => setVehicleBrand(e.target.value)}
                className="font-bold text-slate-800 bg-transparent border-0 outline-none p-0 w-24 placeholder:text-slate-400"
              />
              <input
                type="text"
                placeholder="Modelo"
                value={vehicleModel}
                readOnly={isLocked}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="font-bold text-slate-800 bg-transparent border-0 outline-none p-0 w-24 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* FECHA PROPUESTA DE ENTREGA (LIMPIA SIN RECUADROS NI DIBUJO DE CALENDARIO) */}
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
            {vehicleDeliveryDate ? (
              <button
                type="button"
                onClick={() => !isLocked && setIsDeliveryDatePickerOpen(true)}
                className="text-left sm:text-right bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="Cambiar fecha propuesta de entrega"
              >
                <span className="block font-black text-slate-700 uppercase text-[10px] tracking-wider leading-none">
                  Fecha propuesta de entrega:
                </span>
                <span className="block font-bold text-slate-950 text-sm sm:text-base mt-0.5 leading-tight">
                  {formatDeliveryDateDisplay(vehicleDeliveryDate)}
                </span>
              </button>
            ) : (
              !isLocked && (
                <button
                  type="button"
                  onClick={() => setIsDeliveryDatePickerOpen(true)}
                  className="px-2 py-1 text-slate-500 hover:text-blue-600 text-xs font-semibold cursor-pointer transition-colors print:hidden flex items-center gap-1"
                >
                  <span>+ Establecer fecha propuesta de entrega</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 4. TABLA DE CONCEPTOS DEL PRESUPUESTO */}
        <div className="flex-1 flex flex-col mb-6">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2 px-2 text-left w-3/5">Descripción</th>
                <th className="py-2 px-2 text-center w-16">Ud.</th>
                <th className="py-2 px-2 text-right w-24">Precio Unit.</th>
                <th className="py-2 px-2 text-right w-24">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-2 relative">
                    <input
                      type="text"
                      value={it.description}
                      readOnly={isLocked}
                      placeholder="Descripción del trabajo / recambio..."
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full bg-transparent outline-none font-medium text-slate-900 placeholder-slate-300"
                    />
                    {!isLocked && items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={it.quantity}
                      readOnly={isLocked}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-full bg-transparent outline-none text-center font-mono font-semibold text-slate-900"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    {canSetPrices ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.unitPrice}
                        readOnly={isLocked}
                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                        className="w-full bg-transparent outline-none text-right font-mono font-semibold text-slate-900"
                      />
                    ) : (
                      <span className="italic text-amber-700 text-[10px]">A valorar</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Añadir nueva línea de concepto"
              >
                <Plus className="w-5 h-5 font-bold" />
              </button>
            </div>
          )}
        </div>

        {/* 5. OBSERVACIONES Y TOTALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-300 pt-4 mb-6 text-xs">
          {/* Observaciones */}
          <div>
            <span className="font-bold text-[11px] uppercase text-slate-700 block mb-1">
              Observaciones:
            </span>
            <textarea
              rows={4}
              value={notes}
              readOnly={isLocked}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-slate-50/70 border border-slate-200 rounded text-slate-700 text-xs outline-none resize-none leading-relaxed font-sans"
              placeholder={defaultNotesText}
            />
          </div>

          {/* Totales */}
          <div className="flex flex-col justify-end space-y-1.5 md:pl-8">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold">Base Imponible:</span>
              <span className="font-mono font-bold">{canSetPrices ? `${subtotal.toFixed(2)} €` : "-"}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyIva}
                  disabled={!canSetPrices || isLocked}
                  onChange={(e) => setApplyIva(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-slate-800"
                />
                <span>IVA (21%):</span>
              </label>
              <span className="font-mono font-bold">{canSetPrices && applyIva ? `${ivaAmount.toFixed(2)} €` : "0.00 €"}</span>
            </div>

            {applyIrpf && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Retención IRPF (15%):</span>
                <span className="font-mono font-bold text-red-600">-{irpfAmount.toFixed(2)} €</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 text-slate-950">
              <span className="text-sm font-black uppercase">TOTAL:</span>
              <span className="text-xl font-black font-mono">
                {canSetPrices ? `${total.toFixed(2)} €` : "Pendiente"}
              </span>
            </div>
          </div>
        </div>

        {/* 6. ICONOS DE ACCIÓN AL FINAL DE LA HOJA A4 */}
        <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap print:hidden">
          {errorMsg && (
            <div className="w-full p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-xs font-bold flex items-center gap-2">
            {isSaved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs font-mono text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>GUARDADO [{savedExpedienteId || expediente}] — Listo para enviar</span>
              </span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">
                Presupuesto pendiente de guardar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
            {/* 1. Icono GUARDAR: siempre activo */}
            <button
              type="button"
              onClick={handleSaveDocument}
              disabled={isLocked}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold text-xs uppercase tracking-wider ${
                isLocked
                  ? "bg-slate-100 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed"
                  : isSaved
                  ? "bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100 hover:scale-105 shadow-2xs"
                  : "bg-sky-600 border-sky-600 text-white hover:bg-sky-500 hover:scale-105 shadow-md animate-pulse"
              }`}
              title="Guardar cambios del presupuesto en la hoja A4"
            >
              <Save className="w-4 h-4" strokeWidth={2.2} />
              <span>{isSaved ? "Guardado" : "Guardar"}</span>
            </button>

            {/* 2. Icono IMPRIMIR */}
            <button
              type="button"
              onClick={handlePrint}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                isSaved
                  ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:scale-105 shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}
              title={isSaved ? "Imprimir / Exportar a PDF" : "Guardará y abrirá vista de impresión"}
            >
              <Printer className="w-5 h-5" strokeWidth={1.8} />
            </button>

            {/* 3. Icono IMÁGENES / EXPEDIENTE */}
            <button
              type="button"
              onClick={() => setIsExpedienteImagesOpen(true)}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-blue-600 hover:scale-105 transition-all cursor-pointer relative"
              title={`Fotos del expediente (${vehicleImages.length})`}
            >
              <ImageIcon className="w-5 h-5" strokeWidth={1.8} />
              {vehicleImages.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  {vehicleImages.length}
                </span>
              )}
            </button>

            {/* 4. Icono FICHA CLIENTE */}
            <button
              type="button"
              onClick={handleAccessClientData}
              disabled={!selectedClient}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                selectedClient
                  ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600 hover:scale-105"
                  : "bg-slate-50 border-slate-100 text-slate-300 opacity-40 cursor-not-allowed pointer-events-none"
              }`}
              title={selectedClient ? "Ficha del cliente" : "Seleccione un cliente para ver su ficha"}
            >
              <UserPen className="w-5 h-5" strokeWidth={1.8} />
            </button>

            {/* 5. Icono ENVIAR POR WHATSAPP */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold text-xs ${
                isSaved
                  ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 shadow-md shadow-emerald-200 animate-pulse"
                  : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:scale-105"
              }`}
              title="Enviar presupuesto por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
              <span>WhatsApp</span>
            </button>

            {/* 6. Icono ENVIAR POR EMAIL */}
            <button
              type="button"
              onClick={handleSendEmail}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold text-xs ${
                isSaved
                  ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-md shadow-blue-200"
                  : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:scale-105"
              }`}
              title="Enviar presupuesto por Email"
            >
              <Mail className="w-4 h-4" strokeWidth={2} />
              <span>Email</span>
            </button>
          </div>

          {/* PANEL DE CONTROL DE COBROS PARA FACTURAS */}
          {docType === "factura" && (
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
          applyIva,
          ivaRate,
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
          if (onShowToast) {
            onShowToast(`Fecha de entrega fijada: ${formattedDate}`);
          }
        }}
      />
    </div>
  );
};
