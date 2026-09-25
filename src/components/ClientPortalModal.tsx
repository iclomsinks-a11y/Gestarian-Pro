import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, FileText, CheckCircle2, XCircle, Clock, Calendar, 
  Download, Image as ImageIcon, Plus, Send, AlertTriangle, ShieldCheck, 
  CreditCard, Check, ChevronRight, LogOut, Car, Wrench, Upload, MessageSquare,
  ChevronDown, ChevronUp, CheckCircle, Info
} from 'lucide-react';
import { Client, GestarianDocument, AppUser, InternalNotification, BudgetStatus, SolicitudItem } from '../types';
import { addStoredSolicitud, getStoredSolicitudes, getNextSolicitudData } from '../services/storage';

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  loggedClient: Client;
  user: AppUser;
  documents: GestarianDocument[];
  onUpdateDocumentStatus: (
    docId: string, 
    newStatus: BudgetStatus, 
    newDeliveryDate?: string,
    updatedDocPartial?: Partial<GestarianDocument>
  ) => void;
  onSendNotificationToWorkshop: (notif: InternalNotification) => void;
  onViewDoc: (doc: GestarianDocument) => void;
  onLogoutClient: () => void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  isOpen,
  onClose,
  loggedClient,
  user,
  documents,
  onUpdateDocumentStatus,
  onSendNotificationToWorkshop,
  onViewDoc,
  onLogoutClient,
}) => {
  const [activeTab, setActiveTab] = useState<'expedientes' | 'deudas' | 'solicitud' | 'notificaciones'>('expedientes');

  // Estado para solicitud online de presupuesto
  const [reqPlate, setReqPlate] = useState(loggedClient.plates?.[0] || '');
  const [reqDescription, setReqDescription] = useState('');
  const [reqImages, setReqImages] = useState<string[]>([]);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [clientSolicitudes, setClientSolicitudes] = useState<SolicitudItem[]>([]);

  // Sincronizar y filtrar solicitudes pertenecientes a este cliente
  const filterClientSolicitudes = (list: SolicitudItem[]) => {
    if (!loggedClient) return [];
    return list.filter((sol) => {
      if (sol.clientName && loggedClient.name && sol.clientName.trim().toLowerCase() === loggedClient.name.trim().toLowerCase()) return true;
      if (sol.clientPhone && loggedClient.phone) {
        const p1 = sol.clientPhone.replace(/\D/g, '');
        const p2 = loggedClient.phone.replace(/\D/g, '');
        if (p1 && p2 && (p1.endsWith(p2) || p2.endsWith(p1))) return true;
      }
      if (sol.clientEmail && loggedClient.email && sol.clientEmail.trim().toLowerCase() === loggedClient.email.trim().toLowerCase()) return true;
      if (loggedClient.plates && sol.vehiclePlate) {
        const cleanSolPlate = sol.vehiclePlate.replace(/[\s-]/g, '').toUpperCase();
        if (loggedClient.plates.some(p => p.replace(/[\s-]/g, '').toUpperCase() === cleanSolPlate)) return true;
      }
      return false;
    });
  };

  useEffect(() => {
    const updateList = () => {
      const all = getStoredSolicitudes();
      setClientSolicitudes(filterClientSolicitudes(all));
    };

    updateList();

    window.addEventListener('storage', updateList);
    window.addEventListener('gestarian_solicitudes_updated', updateList);

    return () => {
      window.removeEventListener('storage', updateList);
      window.removeEventListener('gestarian_solicitudes_updated', updateList);
    };
  }, [loggedClient]);

  if (!isOpen || !loggedClient) return null;

  // Filtrar documentos del cliente
  const clientDocs = documents.filter((d) => {
    if (d.clientId && d.clientId === loggedClient.id) return true;
    if (d.clientCif && loggedClient.cif && d.clientCif.trim().toUpperCase() === loggedClient.cif.trim().toUpperCase()) return true;
    if (d.clientEmail && loggedClient.email && d.clientEmail.trim().toLowerCase() === loggedClient.email.trim().toLowerCase()) return true;
    if (d.vehiclePlate && loggedClient.plates && loggedClient.plates.some(p => p.trim().toUpperCase() === d.vehiclePlate?.trim().toUpperCase())) return true;
    if (d.vehiclePlate && loggedClient.vehicles && loggedClient.vehicles.some(v => v.plate.trim().toUpperCase() === d.vehiclePlate?.trim().toUpperCase())) return true;
    return false;
  });
  const clientBudgets = clientDocs.filter((d) => d.type === 'presupuesto');
  const clientInvoices = clientDocs.filter((d) => d.type === 'factura');

  // Cálculo de Deudas
  const totalBilled = clientInvoices.reduce((acc, i) => acc + i.total, 0);
  const totalPaid = clientInvoices
    .filter((i) => i.status === 'confirmada')
    .reduce((acc, i) => acc + i.total, 0);
  const totalPendingDebt = totalBilled - totalPaid;

  const [proposingDateDocId, setProposingDateDocId] = useState<string | null>(null);
  const [customProposedDate, setCustomProposedDate] = useState<string>('');

  // Acciones sobre presupuestos y negociación de fecha y hora de entrega
  const handleAcceptBudget = (doc: GestarianDocument) => {
    const now = new Date().toISOString();
    const { date: workshopDate, time: workshopTime } = extractDateAndTime(doc);

    onUpdateDocumentStatus(doc.id, 'aceptado', workshopDate, {
      acceptedByClient: true,
      vehicleDeliveryDate: workshopDate,
      vehicleDeliveryTime: workshopTime,
      proposedDeliveryDate: workshopDate,
      proposedDeliveryTime: workshopTime,
      deliveryDateStatus: 'accepted',
      deliveryDateProposedBy: 'workshop',
      citaAcceptedBy: 'client',
      citaAcceptedByName: loggedClient.name,
      citaAcceptedAt: now,
    });

    const notif: InternalNotification = {
      id: `notif_${Date.now()}`,
      title: 'Presupuesto y Fecha de Entrega Aceptados',
      message: `El cliente ${loggedClient.name} ha ACEPTADO el presupuesto ${doc.number} y la fecha/hora propuesta de entrega (${workshopDate} a las ${workshopTime}).`,
      timestamp: now,
      read: false,
      type: 'general',
      budgetId: doc.id,
    };

    onSendNotificationToWorkshop(notif);
  };

  const handleProposeAlternativeDate = (
    doc: GestarianDocument,
    newDate: string,
    newTime: string,
    workshopDate: string,
    workshopTime: string
  ) => {
    const check = validateAlternativeDateTime(newDate, newTime, workshopDate, workshopTime);
    if (!check.isValid) {
      setDateTimeError(check.error);
      return;
    }

    const now = new Date().toISOString();

    onUpdateDocumentStatus(doc.id, 'aceptado', newDate, {
      acceptedByClient: true,
      vehicleDeliveryDate: newDate,
      vehicleDeliveryTime: newTime,
      proposedDeliveryDate: newDate,
      proposedDeliveryTime: newTime,
      deliveryDateProposedBy: 'client',
      deliveryDateStatus: 'pending_acceptance',
      citaAcceptedBy: 'client',
      citaAcceptedByName: loggedClient.name,
      citaAcceptedAt: now,
    });

    const notif: InternalNotification = {
      id: `notif_${Date.now()}`,
      title: 'Presupuesto Aceptado - Nueva Fecha/Hora de Entrega Propuesta',
      message: `El cliente ${loggedClient.name} ha aceptado el presupuesto ${doc.number}, proponiendo una nueva entrega para el ${newDate} a las ${newTime}. El taller puede revisarla en el Roadmap.`,
      timestamp: now,
      read: false,
      type: 'general',
      budgetId: doc.id,
    };

    onSendNotificationToWorkshop(notif);
    setProposingDateDocId(null);
    setCustomProposedDate('');
    setCustomProposedTime('');
    setDateTimeError(null);
  };

  const handleRejectBudget = (doc: GestarianDocument) => {
    onUpdateDocumentStatus(doc.id, 'rechazado');

    const notif: InternalNotification = {
      id: `notif_${Date.now()}`,
      title: 'Presupuesto Rechazado por Cliente',
      message: `El cliente ${loggedClient.name} ha RECHAZADO el presupuesto ${doc.number} (Expediente ${doc.expediente || doc.number}).`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      budgetId: doc.id,
    };

    onSendNotificationToWorkshop(notif);
  };

  // Manejador de subida de imágenes para solicitud
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReqImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitOnlineRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDescription.trim()) return;

    const notif: InternalNotification = {
      id: `notif_req_${Date.now()}`,
      title: 'Nueva Solicitud de Presupuesto Online',
      message: `El cliente ${loggedClient.name} (${loggedClient.phone || loggedClient.email}) ha enviado una solicitud online para el vehículo [${reqPlate || 'Sin Matrícula'}]: "${reqDescription}". (${reqImages.length} fotos adjuntas).`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
    };

    onSendNotificationToWorkshop(notif);

    // Guardar la tarjeta en la colección persistente de solicitudes del taller con ID S260000 reservado
    const currentList = getStoredSolicitudes();
    const { id: solId, number: solNumber, expediente: expNumber } = getNextSolicitudData(documents, currentList);
    const dateFormatted = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newSolicitud: SolicitudItem = {
      id: solId,
      number: solNumber,
      expediente: expNumber,
      clientName: loggedClient.name,
      clientPhone: loggedClient.phone || '',
      clientEmail: loggedClient.email || '',
      vehiclePlate: (reqPlate || 'SIN MATRÍCULA').trim().toUpperCase(),
      vehicleBrand: '',
      vehicleModel: '',
      type: 'Solicitud Presupuesto Online',
      date: dateFormatted,
      description: reqDescription.trim(),
      images: reqImages.length > 0 ? [...reqImages] : undefined,
      status: 'PENDIENTE',
    };

    addStoredSolicitud(newSolicitud);
    setClientSolicitudes((prev) => [newSolicitud, ...prev]);
    window.dispatchEvent(new CustomEvent('gestarian_solicitudes_updated', { detail: newSolicitud }));

    setReqSuccess(true);
    setReqDescription('');
    setReqImages([]);
    setShowNewRequestForm(false);
    setTimeout(() => setReqSuccess(false), 5000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F172A]/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#F8F7F3] border border-[#D5D2C9] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Personalizado del Cliente */}
        <div className="p-5 bg-[#0F2942] text-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#38BDF8] text-[#0F172A] rounded-lg flex items-center justify-center font-black text-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold uppercase tracking-widest text-[#38BDF8]">
                  Portal del Cliente • {user.fullName}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[13.5px] font-mono font-bold rounded border border-emerald-500/40">
                  ID #{loggedClient.clientNumber || 1}
                </span>
              </div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {loggedClient.name}
              </h2>
              <p className="text-[18px] text-slate-300">
                CIF: <strong className="font-mono text-white">{loggedClient.cif}</strong> • {loggedClient.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogoutClient}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[18px] font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer"
              title="Cerrar sesión cliente"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>Cambiar Cliente</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#E2E0D8] bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('expedientes')}
            className={`py-3.5 px-3 text-[18px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'expedientes'
                ? 'border-[#0F2942] text-[#0F2942] bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2942]'
            }`}
          >
            <FileText className="w-5 h-5 text-[#1E3A8A]" />
            <span>Mis Expedientes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deudas')}
            className={`py-3.5 px-3 text-[18px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'deudas'
                ? 'border-[#0F2942] text-[#0F2942] bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2942]'
            }`}
          >
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Control de Deudas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solicitud')}
            className={`py-3.5 px-3 text-[18px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'solicitud'
                ? 'border-[#0F2942] text-[#0F2942] bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2942]'
            }`}
          >
            <Clock className="w-5 h-5 text-purple-600" />
            <span>Mis Solicitudes y Seguimiento</span>
            {clientSolicitudes.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[15px] font-black bg-purple-100 text-purple-700">
                {clientSolicitudes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notificaciones')}
            className={`py-3.5 px-3 text-[18px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'notificaciones'
                ? 'border-[#0F2942] text-[#0F2942] bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2942]'
            }`}
          >
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <span>Avisos Taller</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F8F7F3]">
          {/* 1. MIS EXPEDIENTES Y PRESUPUESTOS */}
          {activeTab === 'expedientes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E0D8]">
                <h3 className="text-[18px] font-bold uppercase tracking-wider text-[#0F172A]">
                  Seguimiento de Expedientes y Presupuestos Oficiales
                </h3>
                <span className="text-[18px] font-mono text-[#64748B]">
                  {clientBudgets.length} registros
                </span>
              </div>

              {clientBudgets.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#E2E0D8] rounded-xl text-[18px] text-[#64748B]">
                  <FileText className="w-10 h-10 mx-auto text-[#CBD5E1] mb-2" />
                  <p className="font-bold text-[#0F172A]">No hay presupuestos activos registrados</p>
                  <p className="text-[16.5px] mt-1">
                    Puede solicitar un nuevo presupuesto online con fotos desde la pestaña superior.
                  </p>
                </div>
              ) : (
                clientBudgets.map((doc) => {
                  const isAccepted = doc.status === 'aceptado';
                  const isRejected = doc.status === 'rechazado';
                  const isPending = doc.status === 'enviado' || doc.status === 'borrador';

                  return (
                    <div
                      key={doc.id}
                      className="p-5 bg-white rounded-xl shadow-xs space-y-4 border border-[#E2E0D8]"
                    >
                      {/* Fecha y Hora estimadas fijadas por el taller (Informativa, solo lectura) */}
                      {(() => {
                        const { date: workshopDate, time: workshopTime } = extractDateAndTime(doc);
                        return (
                          <div className="p-3 bg-[#F8F7F3] border border-[#CBD5E1] rounded-lg flex flex-wrap items-center justify-between gap-3 text-[17px]">
                            <div className="flex items-center gap-2 text-[#0F2942]">
                              <Calendar className="w-5 h-5 text-[#1E3A8A]" />
                              <span className="font-semibold">Fecha y hora propuesta de entrega por el taller:</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#0F2942] bg-white px-3 py-1 rounded border border-[#CBD5E1] shadow-2xs">
                                📅 {workshopDate}
                              </span>
                              <span className="font-mono font-bold text-[#0F2942] bg-white px-3 py-1 rounded border border-[#CBD5E1] shadow-2xs inline-flex items-center gap-1">
                                <Clock className="w-4 h-4 text-[#1E3A8A]" /> {workshopTime}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Fila Cabecera Expediente */}
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#F1F0EB]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#0F2942] text-white font-mono font-bold text-[18px] rounded">
                              {doc.number}
                            </span>
                            {doc.expediente && (
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-mono font-bold text-[18px] rounded border border-blue-200">
                                Expediente {doc.expediente}
                              </span>
                            )}
                            <span className="text-[18px] text-[#64748B]">
                              Fecha: {doc.date}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <Car className="w-5 h-5 text-[#1E3A8A]" />
                            <span className="text-[21px] font-bold text-[#0F172A]">
                              {doc.vehicleBrand} {doc.vehicleModel}
                            </span>
                            {doc.vehiclePlate && (
                              <span className="font-mono text-[18px] font-bold bg-[#FAF9F5] border border-[#CBD5E1] px-2.5 py-0.5 rounded text-[#0F172A]">
                                🇪🇸 {doc.vehiclePlate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Estado y Total */}
                        <div className="text-right">
                          <div className="text-[27px] font-black font-mono text-[#0F172A]">
                            {doc.total.toFixed(2)} €
                          </div>
                          <div className="mt-1">
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-[15px] uppercase rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-4 h-4" />
                                Presupuesto Aceptado
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-800 font-bold text-[15px] uppercase rounded-full border border-red-300">
                                <XCircle className="w-4 h-4" />
                                Presupuesto Rechazado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 font-bold text-[15px] uppercase rounded-full border border-amber-300">
                                <Clock className="w-4 h-4" />
                                Pendiente de Aprobación
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fecha y Hora propuesta de entrega y estado de negociación */}
                      {(() => {
                        const { date: workshopDate, time: workshopTime } = extractDateAndTime(doc);
                        const isClientPending = doc.deliveryDateProposedBy === 'client' && doc.deliveryDateStatus === 'pending_acceptance';
                        const effectiveDate = doc.proposedDeliveryDate || doc.vehicleDeliveryDate || workshopDate;
                        const effectiveTime = doc.proposedDeliveryTime || doc.vehicleDeliveryTime || workshopTime;

                        return (
                          <div className="p-3.5 bg-[#FAF9F5] border border-[#E2E0D8] rounded-lg space-y-2 text-[18px]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 text-[#475569]">
                                <Calendar className="w-5 h-5 text-[#1E3A8A] shrink-0" />
                                <span className="font-semibold text-[#0F2942]">
                                  {isClientPending
                                    ? 'Fecha y hora propuestas por ti (pendiente confirmación taller):'
                                    : 'Fecha y hora propuesta de entrega del vehículo:'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                <span className="font-mono font-bold text-[#0F172A] bg-white px-3 py-1 rounded border border-[#CBD5E1] inline-flex items-center gap-1.5">
                                  <span>📅</span> {effectiveDate}
                                </span>
                                <span className="font-mono font-bold text-[#0F172A] bg-white px-3 py-1 rounded border border-[#CBD5E1] inline-flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-[#1E3A8A]" /> {effectiveTime}
                                </span>
                              </div>
                            </div>
                            {isClientPending && (
                              <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                                Has propuesto una nueva fecha/hora posterior. El taller revisará la propuesta para confirmar la cita en el Roadmap.
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Selector inline para proponer otra fecha de entrega si el cliente no acepta la fecha inicial */}
                      {isPending && proposingDateDocId === doc.id && (() => {
                        const { date: workshopDate, time: workshopTime } = extractDateAndTime(doc);
                        const check = validateAlternativeDateTime(customProposedDate, customProposedTime, workshopDate, workshopTime);

                        return (
                          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl space-y-3 text-[17px] animate-in fade-in">
                            <div className="flex items-center gap-2 font-bold text-[#0F2942]">
                              <Calendar className="w-5 h-5 text-[#1E3A8A]" />
                              <span>Proponer nueva fecha y hora de entrega al taller</span>
                            </div>
                            <p className="text-xs text-blue-900 leading-relaxed">
                              Indica cuándo deseas entregar el vehículo. <strong>Regla obligatoria:</strong> Siempre tiene que ser el <strong>mismo día más tarde</strong> de las <strong>{workshopTime}</strong> o en <strong>días posteriores</strong>, nunca antes de la fecha propuesta por el taller.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#0F2942] uppercase tracking-wide mb-1">
                                  Fecha de Entrega:
                                </label>
                                <input
                                  type="date"
                                  min={workshopDate}
                                  value={customProposedDate}
                                  onChange={(e) => {
                                    setCustomProposedDate(e.target.value);
                                    setDateTimeError(null);
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-[#94A3B8] rounded text-base font-mono font-semibold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#1E3A8A]"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#0F2942] uppercase tracking-wide mb-1">
                                  Hora de Entrega:
                                </label>
                                <input
                                  type="time"
                                  value={customProposedTime}
                                  onChange={(e) => {
                                    setCustomProposedTime(e.target.value);
                                    setDateTimeError(null);
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-[#94A3B8] rounded text-base font-mono font-semibold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#1E3A8A]"
                                />
                              </div>
                            </div>

                            {(dateTimeError || (!check.isValid && (customProposedDate || customProposedTime))) && (
                              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                <span>{dateTimeError || check.error}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <button
                                type="button"
                                disabled={!check.isValid}
                                onClick={() => handleProposeAlternativeDate(doc, customProposedDate, customProposedTime, workshopDate, workshopTime)}
                                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-[16px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                              >
                                Aceptar con esta Fecha y Hora
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProposingDateDocId(null);
                                  setCustomProposedDate('');
                                  setCustomProposedTime('');
                                  setDateTimeError(null);
                                }}
                                className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded text-[16px] font-semibold cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Conceptos resumen */}
                      <div className="space-y-1.5">
                        <span className="text-[15px] font-bold uppercase text-[#64748B]">
                          Trabajos e Insumos Incluidos:
                        </span>
                        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden">
                          {doc.items.map((it, idx) => (
                            <div key={idx} className="p-2.5 text-[18px] flex items-center justify-between">
                              <span className="text-[#334155]">{it.description}</span>
                              <span className="font-mono font-semibold text-[#0F172A]">
                                {it.amount.toFixed(2)} €
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botones de Respuesta del Cliente */}
                      <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#F1F0EB]">
                        <button
                          id="btn-ver-descargar-pdf-a4"
                          type="button"
                          onClick={() => onViewDoc(doc)}
                          className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-[18px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                          title="Abrir y visualizar el presupuesto completo oficial para guardar en PDF o imprimir"
                        >
                          <Download className="w-5 h-5 text-[#38BDF8]" />
                          <span>Ver / Descargar PDF A4</span>
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptBudget(doc)}
                                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[18px] font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                                title="Aceptar el presupuesto y la fecha propuesta de entrega"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Aceptar Presupuesto y Fecha Propuesta</span>
                              </button>

                              {proposingDateDocId !== doc.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                  const { date: workshopDate, time: workshopTime } = extractDateAndTime(doc);
                                  setProposingDateDocId(doc.id);
                                  setCustomProposedDate(workshopDate);
                                  const [h, m] = workshopTime.split(':').map(Number);
                                  const nextHour = String(Math.min(20, (h || 10) + 1)).padStart(2, '0');
                                  const nextTime = `${nextHour}:${String(m || 0).padStart(2, '0')}`;
                                  setCustomProposedTime(nextTime);
                                  setDateTimeError(null);
                                }}
                                  className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#0F2942] text-white text-[18px] font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                                  title="Proponer otra fecha de entrega si no puedes en la propuesta"
                                >
                                  <Calendar className="w-5 h-5" />
                                  <span>Proponer otra fecha</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRejectBudget(doc)}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-[18px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Rechazar este presupuesto"
                              >
                                <XCircle className="w-5 h-5" />
                                <span>Rechazar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. CONTROL DE DEUDAS Y ESTADO DE ABONOS */}
          {activeTab === 'deudas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-[#E2E0D8] rounded-xl shadow-2xs">
                  <span className="text-[15px] font-bold uppercase text-[#64748B]">Total Facturado</span>
                  <div className="text-[30px] font-black font-mono text-[#0F172A] mt-1">
                    {totalBilled.toFixed(2)} €
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
                  <span className="text-[15px] font-bold uppercase text-emerald-800">Total Liquidado</span>
                  <div className="text-[30px] font-black font-mono text-emerald-700 mt-1">
                    {totalPaid.toFixed(2)} €
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs">
                  <span className="text-[15px] font-bold uppercase text-amber-800">Estado de Deuda Activa</span>
                  <div className={`text-[30px] font-black font-mono mt-1 ${totalPendingDebt > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {totalPendingDebt.toFixed(2)} €
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E2E0D8] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#FAF9F5] border-b border-[#E2E0D8] flex items-center justify-between">
                  <h4 className="text-[18px] font-bold uppercase text-[#0F172A] tracking-wider">
                    Histórico de Facturas Emitidas
                  </h4>
                  <span className="text-[18px] text-[#64748B]">{clientInvoices.length} facturas</span>
                </div>

                {clientInvoices.length === 0 ? (
                  <div className="p-8 text-center text-[18px] text-[#64748B]">
                    No se han registrado facturas ni deudas pendientes a su nombre.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {clientInvoices.map((inv) => {
                      const isPaid = inv.status === 'confirmada';
                      return (
                        <div key={inv.id} className="p-4 flex items-center justify-between text-[18px]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#0F172A]">{inv.number}</span>
                              <span className="text-[16.5px] text-[#64748B]">{inv.date}</span>
                            </div>
                            <span className="text-[16.5px] text-[#475569] mt-0.5 block">
                              Concepto: Servicio de reparación / mantenimiento taller
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-[21px] text-[#0F172A]">
                              {inv.total.toFixed(2)} €
                            </span>

                            {isPaid ? (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-[15px] uppercase rounded-full border border-emerald-300">
                                Pagada
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-[15px] uppercase rounded-full border border-amber-300">
                                Pendiente de Cobro
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onViewDoc(inv)}
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-[#0F2942] rounded-lg transition-colors cursor-pointer"
                              title="Ver Factura PDF"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. SOLICITAR PRESUPUESTO ONLINE CON IMÁGENES Y SEGUIMIENTO */}
          {activeTab === 'solicitud' && (
            <div className="space-y-4">
              {/* Encabezado y Acción para Nueva Solicitud */}
              <div className="bg-white border border-[#E2E0D8] rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-[18px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span>Mis Solicitudes de Presupuesto y Seguimiento</span>
                  </h3>
                  <p className="text-[18px] text-[#64748B] mt-1">
                    Consulte el estado de valoración en tiempo real (Aprobada, Rechazada o Presupuestada por el taller DM CAR).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewRequestForm(!showNewRequestForm)}
                  className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[18px] font-bold uppercase rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {showNewRequestForm ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Cerrar Formulario</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ Nueva Solicitud</span>
                    </>
                  )}
                </button>
              </div>

              {reqSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[18px] rounded-xl flex items-center gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">¡Solicitud registrada y guardada con éxito!</span>
                    <span>
                      Ha quedado guardada en su portal y enviada al taller DM CAR. En esta misma pantalla podrá comprobar cuándo es aprobada o rechazada.
                    </span>
                  </div>
                </div>
              )}

              {/* Formulario desplegable si se solicita o si no hay ninguna solicitud previa */}
              {(showNewRequestForm || clientSolicitudes.length === 0) && (
                <div className="bg-white border border-[#E2E0D8] rounded-xl p-6 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-[#E2E0D8]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                      Nueva Solicitud de Presupuesto con Fotos
                    </h4>
                    <p className="text-[18px] text-[#64748B] mt-1">
                      Describa los trabajos o avería de su vehículo y adjunte fotos de los daños para recibir su presupuesto oficial.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitOnlineRequest} className="space-y-4">
                    <div>
                      <label className="block text-[15px] font-bold uppercase text-[#64748B] mb-1">
                        Matrícula del Vehículo
                      </label>
                      <input
                        type="text"
                        value={reqPlate}
                        onChange={(e) => setReqPlate(e.target.value.toUpperCase())}
                        placeholder="Ej: 4512LKT"
                        className="w-full max-w-xs px-3 py-2 text-[18px] font-mono font-bold uppercase bg-[#F8F7F3] border border-[#CBD5E1] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[15px] font-bold uppercase text-[#64748B] mb-1">
                        Descripción de la Reparación / Daños *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reqDescription}
                        onChange={(e) => setReqDescription(e.target.value)}
                        placeholder="Escriba aquí los detalles de la reparación necesaria, ruidos, chapa/pintura o mantenimiento..."
                        className="w-full p-3 text-[18px] bg-[#F8F7F3] border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#0F2942]"
                      />
                    </div>

                    <div>
                      <label className="block text-[15px] font-bold uppercase text-[#64748B] mb-1">
                        Adjuntar Fotografías del Vehículo / Daños (Opcional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[18px] font-bold uppercase rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5">
                          <Upload className="w-4 h-4" />
                          <span>Subir Fotos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[18px] text-[#64748B]">
                          {reqImages.length} fotos adjuntas
                        </span>
                      </div>

                      {reqImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {reqImages.map((img, i) => (
                            <div key={i} className="relative aspect-video bg-black rounded-lg overflow-hidden border">
                              <img src={img} alt="Vista previa" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[18px] font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar Solicitud a DM CAR</span>
                      </button>

                      {clientSolicitudes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewRequestForm(false)}
                          className="px-4 py-2.5 border border-gray-300 text-[#475569] hover:bg-gray-100 text-[18px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Historial de Solicitudes y Seguimiento de Estados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Historial de Solicitudes Registradas ({clientSolicitudes.length})
                  </h4>
                  <span className="text-[16.5px] text-[#64748B]">
                    Actualización en tiempo real
                  </span>
                </div>

                {clientSolicitudes.length === 0 ? (
                  <div className="bg-white border border-[#E2E0D8] rounded-xl p-8 text-center text-[18px] text-[#64748B]">
                    No tiene ninguna solicitud de presupuesto guardada aún. Pulse en "+ Nueva Solicitud" para enviar una consulta al taller.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {clientSolicitudes.map((sol) => {
                      const isApproved = sol.status === 'APROBADA';
                      const isRejected = sol.status === 'RECHAZADA';
                      const isBudgeted = sol.status === 'PRESUPUESTADA';
                      const isPending = !isApproved && !isRejected && !isBudgeted;

                      // Buscar si existe un presupuesto oficial en los documentos del cliente
                      const matchingBudget = clientBudgets.find(
                        (b) =>
                          b.expediente === sol.expediente ||
                          (b.vehiclePlate &&
                            sol.vehiclePlate &&
                            b.vehiclePlate.replace(/[\s-]/g, '') === sol.vehiclePlate.replace(/[\s-]/g, ''))
                      );

                      return (
                        <div
                          key={sol.id}
                          className={`bg-white border rounded-xl p-5 shadow-xs transition-all space-y-3 ${
                            isApproved
                              ? 'border-emerald-300 ring-1 ring-emerald-200'
                              : isRejected
                              ? 'border-rose-300 ring-1 ring-rose-200'
                              : isBudgeted
                              ? 'border-blue-300 ring-1 ring-blue-200'
                              : 'border-[#E2E0D8]'
                          }`}
                        >
                          {/* Cabecera de la Solicitud */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-black text-[18px] text-[#0F2942]">
                                {sol.number}
                              </span>
                              <span className="text-[18px] text-[#64748B] font-mono">
                                Exp: {sol.expediente}
                              </span>
                              <span className="text-[18px] text-[#94A3B8]">
                                {sol.date}
                              </span>
                              <span className="px-2 py-0.5 bg-[#0F2942] text-white font-mono text-[18px] font-bold rounded-md uppercase">
                                {sol.vehiclePlate || 'SIN MATRÍCULA'}
                              </span>
                            </div>

                            {/* Badge de Estado */}
                            <div>
                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[18px] font-extrabold shadow-2xs">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>APROBADA POR EL TALLER</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[18px] font-extrabold shadow-2xs">
                                  <XCircle className="w-4 h-4 text-rose-600" />
                                  <span>RECHAZADA POR EL TALLER</span>
                                </span>
                              )}
                              {isBudgeted && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[18px] font-extrabold shadow-2xs">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span>PRESUPUESTO EMITIDO</span>
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[18px] font-extrabold shadow-2xs animate-pulse">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  <span>EN REVISIÓN TÉCNICA</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Línea de Seguimiento / Workflow Tracker */}
                          <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                            <div className="flex items-center justify-between text-[16.5px] font-bold">
                              {/* Paso 1 */}
                              <div className="flex items-center gap-1.5 text-emerald-700">
                                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[15px] font-black">
                                  ✓
                                </span>
                                <span>1. Solicitud enviada</span>
                              </div>

                              <div className="flex-1 h-0.5 mx-2 bg-emerald-300" />

                              {/* Paso 2 */}
                              <div
                                className={`flex items-center gap-1.5 ${
                                  isPending
                                    ? 'text-amber-700 font-extrabold'
                                    : 'text-emerald-700'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[15px] font-black text-white ${
                                    isPending ? 'bg-amber-500' : 'bg-emerald-600'
                                  }`}
                                >
                                  {isPending ? '2' : '✓'}
                                </span>
                                <span>2. Valoración técnica</span>
                              </div>

                              <div
                                className={`flex-1 h-0.5 mx-2 ${
                                  isPending
                                    ? 'bg-gray-200'
                                    : isRejected
                                    ? 'bg-rose-300'
                                    : 'bg-emerald-300'
                                }`}
                              />

                              {/* Paso 3 */}
                              <div
                                className={`flex items-center gap-1.5 ${
                                  isApproved
                                    ? 'text-emerald-700 font-black'
                                    : isRejected
                                    ? 'text-rose-700 font-black'
                                    : isBudgeted
                                    ? 'text-blue-700 font-black'
                                    : 'text-gray-400'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[15px] font-black text-white ${
                                    isApproved
                                      ? 'bg-emerald-600'
                                      : isRejected
                                      ? 'bg-rose-600'
                                      : isBudgeted
                                      ? 'bg-blue-600'
                                      : 'bg-gray-300 text-gray-600'
                                  }`}
                                >
                                  {isApproved || isBudgeted
                                    ? '✓'
                                    : isRejected
                                    ? '✕'
                                    : '3'}
                                </span>
                                <span>
                                  {isApproved
                                    ? '3. Aprobada'
                                    : isRejected
                                    ? '3. Rechazada'
                                    : isBudgeted
                                    ? '3. Presupuestada'
                                    : '3. Dictamen'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Descripción y Detalles */}
                          <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EBE8DE] text-[18px] text-[#334155]">
                            <span className="font-bold text-[#0F2942] block mb-1">
                              Trabajos / Daños comunicados:
                            </span>
                            <p className="italic">"{sol.description}"</p>
                          </div>

                          {/* Galería de Fotos */}
                          {sol.images && sol.images.length > 0 && (
                            <div>
                              <span className="text-[15px] font-bold text-[#64748B] uppercase block mb-1">
                                Fotos de los daños adjuntas ({sol.images.length})
                              </span>
                              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {sol.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Foto ${idx + 1}`}
                                    className="w-16 h-12 object-cover rounded-md border border-gray-300 shadow-2xs shrink-0"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mensaje de resolución según estado */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[18px] border-t border-gray-100">
                            <div className="text-[#64748B]">
                              {isApproved && (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>
                                    El taller ha aprobado esta solicitud. Los trabajos están admitidos para ejecución y presupuesto.
                                  </span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                                  <XCircle className="w-4 h-4 text-rose-600" />
                                  <span>
                                    El taller no puede admitir esta reparación en este momento. Puede contactar por WhatsApp para más información.
                                  </span>
                                </span>
                              )}
                              {isBudgeted && (
                                <span className="text-blue-700 font-semibold flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span>
                                    El presupuesto oficial ya está emitido y disponible para su revisión.
                                  </span>
                                </span>
                              )}
                              {isPending && (
                                <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  <span>
                                    Su solicitud está pendiente de valoración técnica por el equipo de DM CAR.
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Enlace rápido a Presupuesto si ya existe */}
                            {matchingBudget && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('expedientes');
                                  onViewDoc(matchingBudget);
                                }}
                                className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[18px] font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Ver Presupuesto #{matchingBudget.number}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. AVISOS Y NOTIFICACIONES DEL TALLER */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] pb-2 border-b border-[#E2E0D8]">
                Avisos y Cambios de Estado de Reparaciones
              </h3>

              <div className="p-4 bg-white border border-[#E2E0D8] rounded-xl shadow-xs space-y-3 text-[18px]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-[#1E3A8A] rounded-lg">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#0F172A] block">
                      Vehículo en Proceso de Reparación
                    </span>
                    <p className="text-[#475569] text-[16.5px] mt-0.5">
                      Su expediente activo ha sido asignado a los operarios del taller DM CAR. Puede realizar el seguimiento de las fases en este portal.
                    </p>
                    <span className="text-[15px] text-[#94A3B8] block mt-1">Hoy a las 10:30</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F5] border-t border-[#E2E0D8] flex items-center justify-between shrink-0">
          <span className="text-[18px] text-[#64748B]">
            Portal del Cliente • Vinculado a DM CAR
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-lg text-[18px] font-bold uppercase transition-colors cursor-pointer"
          >
            Cerrar Portal
          </button>
        </div>
      </div>
    </div>
  );
};
