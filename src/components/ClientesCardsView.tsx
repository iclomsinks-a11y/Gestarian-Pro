import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Client, GestarianDocument, ClientVehicle, AppUser } from '../types';
import { 
  Search, Plus, Users, Phone, Mail, MapPin, 
  UserPen, FolderKanban, ChevronDown, Car, Home,
  MessageCircle, Pencil, FileText, Sparkles, Image as ImageIcon,
  CheckCircle2, Receipt
} from 'lucide-react';
import { FacturaCard } from './FacturacionView';
import { getClientStatus, getClientDocColors } from '../utils/clientStatusHelper';
import { getClientVehiclesList, ClientVehicleInfo } from '../utils/clientVehiclesHelper';
import { VehicleFormModal } from './VehicleFormModal';
import { VehicleOcrDataModal } from './VehicleOcrDataModal';
import { ClientLocationModal } from './ClientLocationModal';
import { playGentleChime } from '../utils/audioNotification';
import { saveStoredClients } from '../services/storage';

import { SheetPIcon, SheetPlusPIcon, SheetFIcon } from './BudgetIcons';
export { SheetPIcon, SheetPlusPIcon, SheetFIcon };

interface ClientesCardsViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  currentUser?: AppUser;
  clients: Client[];
  documents?: GestarianDocument[];
  isSelectingForBudget?: boolean;
  onSelectClientForBudget?: (client: Client) => void;
  onCancelBudgetSelection?: () => void;
  onBack: () => void;
  onNavigateHome: () => void;
  onOpenMenu: () => void;
  onOpenClientArea: () => void;
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  onViewClientBudgets: (client: Client) => void;
  onNewBudgetForClient: (client: Client) => void;
  onViewClientExpedientes: (client: Client) => void;
  onViewClientInvoices: (client: Client) => void;
  onViewDoc?: (doc: GestarianDocument) => void;
}

export const ClientesCardsView: React.FC<ClientesCardsViewProps> = ({
  id,
  logoUrl,
  userFullName,
  currentUser,
  clients,
  documents = [],
  isSelectingForBudget = false,
  onSelectClientForBudget,
  onCancelBudgetSelection,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenClientArea,
  onNewClient,
  onEditClient,
  onUpdateClient,
  onViewClientBudgets,
  onNewBudgetForClient,
  onViewClientExpedientes,
  onViewClientInvoices,
  onViewDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'clientes' | 'facturas'>('clientes');
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const isVehicleActive = currentUser?.enableVehicle !== false;
  const isLocationActive = currentUser?.enableLocation === true;

  const issuedInvoices = documents.filter(
    (doc) => doc.type === 'factura' || doc.type === 'factura_rectificativa' || doc.type === 'recibo_abono'
  );

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [openVehiclesClientId, setOpenVehiclesClientId] = useState<string | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const handleToggleSearch = () => {
      setIsSearchOpen((prev) => {
        const next = !prev;
        if (next) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return next;
      });
    };
    const handleNewClient = () => {
      if (onNewClient) onNewClient();
    };
    window.addEventListener('gestarian_toggle_client_search', handleToggleSearch);
    window.addEventListener('gestarian_new_client', handleNewClient);
    return () => {
      window.removeEventListener('gestarian_toggle_client_search', handleToggleSearch);
      window.removeEventListener('gestarian_new_client', handleNewClient);
    };
  }, [onNewClient]);

  // Gestión de Vehículos con Formulario y Lectura OCR
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [targetClientForVehicle, setTargetClientForVehicle] = useState<Client | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<ClientVehicle | null>(null);

  // Gestor de Vehículos por Modal
  const [vehicleManagerClient, setVehicleManagerClient] = useState<Client | null>(null);

  // Gestor de Localización por Modal
  const [locationManagerClient, setLocationManagerClient] = useState<Client | null>(null);

  const handleSaveLocation = (targetClient: Client, newLocation: string) => {
    const updatedClient: Client = {
      ...targetClient,
      taskLocation: newLocation,
    };
    if (onUpdateClient) {
      onUpdateClient(updatedClient);
    }
    try {
      const allStored = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
      saveStoredClients(allStored);
    } catch (e) {
      console.error('Error guardando localización del cliente:', e);
    }
    playGentleChime();
    setLocationManagerClient(null);
  };

  // Visor de datos OCR
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [selectedVehicleForOcr, setSelectedVehicleForOcr] = useState<ClientVehicle | null>(null);

  const handleOpenAddVehicle = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetClientForVehicle(client);
    setEditingVehicle(null);
    setIsVehicleFormOpen(true);
  };

  const handleOpenEditVehicle = (client: Client, v: ClientVehicleInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetClientForVehicle(client);
    const existing = client.vehicles?.find((cv) => cv.plate.toUpperCase() === v.plate.toUpperCase());
    setEditingVehicle({
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      color: v.color || existing?.color || '',
      vin: v.vin || existing?.vin || '',
      images: v.images || existing?.images || [],
      ocrData: v.ocrData || existing?.ocrData,
    });
    setIsVehicleFormOpen(true);
  };

  const handleOpenOcrModal = (client: Client, v: ClientVehicleInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetClientForVehicle(client);
    const existing = client.vehicles?.find((cv) => cv.plate.toUpperCase() === v.plate.toUpperCase());
    setSelectedVehicleForOcr({
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      color: v.color || existing?.color || '',
      vin: v.vin || existing?.vin || '',
      images: v.images || existing?.images || [],
      ocrData: v.ocrData || existing?.ocrData,
    });
    setIsOcrModalOpen(true);
  };

  const handleSaveVehicle = (savedVehicle: ClientVehicle) => {
    if (!targetClientForVehicle) return;

    const normPlate = savedVehicle.plate.trim().toUpperCase();
    const existingVehicles = targetClientForVehicle.vehicles ? [...targetClientForVehicle.vehicles] : [];
    const index = existingVehicles.findIndex((v) => v.plate.trim().toUpperCase() === normPlate);

    if (index >= 0) {
      existingVehicles[index] = savedVehicle;
    } else {
      existingVehicles.push(savedVehicle);
    }

    const currentPlates = targetClientForVehicle.plates ? [...targetClientForVehicle.plates] : [];
    if (!currentPlates.map(p => p.trim().toUpperCase()).includes(normPlate)) {
      currentPlates.push(normPlate);
    }

    const updatedClient: Client = {
      ...targetClientForVehicle,
      vehicles: existingVehicles,
      plates: currentPlates,
    };

    if (onUpdateClient) {
      onUpdateClient(updatedClient);
    }

    // Actualizar también en el almacenamiento local
    try {
      const allStored = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
      saveStoredClients(allStored);
    } catch (e) {
      console.error('Error guardando clientes:', e);
    }

    playGentleChime();
    setIsVehicleFormOpen(false);
    setTargetClientForVehicle(null);
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = (plateToDelete: string) => {
    if (!targetClientForVehicle) return;
    const existingVehicles = targetClientForVehicle.vehicles 
      ? targetClientForVehicle.vehicles.filter(v => v.plate.trim().toUpperCase() !== plateToDelete.trim().toUpperCase()) 
      : [];
    const currentPlates = targetClientForVehicle.plates 
      ? targetClientForVehicle.plates.filter(p => p.trim().toUpperCase() !== plateToDelete.trim().toUpperCase()) 
      : [];

    const updatedClient: Client = {
      ...targetClientForVehicle,
      vehicles: existingVehicles,
      plates: currentPlates,
    };

    if (onUpdateClient) {
      onUpdateClient(updatedClient);
    }

    try {
      const allStored = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
      saveStoredClients(allStored);
    } catch (e) {
      console.error('Error eliminando vehículo:', e);
    }

    playGentleChime();
    setIsVehicleFormOpen(false);
    setTargetClientForVehicle(null);
    setEditingVehicle(null);
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const toggleVehiclesList = (clientId: string) => {
    setOpenVehiclesClientId((prev) => (prev === clientId ? null : clientId));
  };

  const handleSelectVehicle = (clientId: string, plate: string) => {
    setSelectedVehicles((prev) => ({
      ...prev,
      [clientId]: plate,
    }));
  };

  // Acciones de contacto directo (WhatsApp, Teléfono, Email)
  const handleWhatsApp = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.phone) {
      alert(`El cliente "${client.name}" no tiene un número de teléfono registrado.`);
      return;
    }
    let cleanPhone = client.phone.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('00')) {
      if (cleanPhone.length === 9) {
        cleanPhone = `34${cleanPhone}`;
      }
    } else if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    const message = encodeURIComponent(
      `Hola ${client.name}, le contactamos desde el taller DM CAR en relación a su vehículo.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handlePhoneCall = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.phone) {
      alert(`El cliente "${client.name}" no tiene un número de teléfono registrado.`);
      return;
    }
    const cleanPhone = client.phone.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleEmail = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.email) {
      alert(`El cliente "${client.name}" no tiene un correo electrónico registrado.`);
      return;
    }
    const subject = encodeURIComponent(`Gestión Taller DM CAR - ${client.name}`);
    const body = encodeURIComponent(
      `Estimado/a ${client.name},\n\nLe contactamos desde el taller DM CAR con respecto a su vehículo.\n\nAtentamente,\nTaller DM CAR Chapa y Pintura`
    );
    window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
  };

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const idMatches = c.clientNumber !== undefined && (
      String(c.clientNumber) === q ||
      `#${c.clientNumber}` === q ||
      `id:${c.clientNumber}` === q ||
      String(c.clientNumber).padStart(3, '0') === q
    );
    return (
      idMatches ||
      c.name.toLowerCase().includes(q) ||
      c.cif.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.plates && c.plates.some((p) => p.toLowerCase().includes(q)))
    );
  });

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col bg-white overflow-y-auto">
      <PageHeader
        pageId="page-clientes"
        title="Clientes"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col gap-6">
        {/* Barra superior con selector de pestaña y buscador */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Pestañas */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('clientes')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'clientes'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Clientes ({clients.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('facturas')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'facturas'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Facturas Emitidas ({issuedInvoices.length})</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'clientes' ? "Buscar cliente por ID, nombre, CIF, teléfono, matrícula..." : "Buscar factura por número, cliente, CIF..."}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          {/* Acciones */}
          {activeTab === 'clientes' && (
            <button
              type="button"
              onClick={onNewClient}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>

        {/* Buscador secundario flotante si aplica */}
        {(isSearchOpen && activeTab === 'clientes') && (
          <div className="bg-white border-2 border-sky-400 rounded-2xl p-3.5 shadow-md flex items-center gap-3 animate-in fade-in duration-200">
            <Search className="w-5 h-5 text-sky-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por ID, nombre, CIF, teléfono o matrícula..."
              className="flex-1 bg-transparent text-sm font-medium outline-none text-slate-800 placeholder-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase px-2 py-1 cursor-pointer"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setIsSearchOpen(false);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Banner informativo de selección para Presupuesto */}
        {isSelectingForBudget && activeTab === 'clientes' && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl border-2 border-sky-400 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Seleccionando cliente para el Presupuesto
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  Busque o pulse sobre un cliente para seleccionarlo, o pulse "+ Nuevo Cliente" arriba para darlo de alta
                </p>
              </div>
            </div>
            {onCancelBudgetSelection && (
              <button
                type="button"
                onClick={onCancelBudgetSelection}
                className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black uppercase transition-all shrink-0 cursor-pointer border border-white/30"
              >
                Volver al Presupuesto
              </button>
            )}
          </div>
        )}

        {/* CONTENIDO DE PESTAÑAS */}
        {activeTab === 'facturas' ? (
          (() => {
            const filteredInvoices = issuedInvoices.filter((doc) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase().trim();
              return (
                doc.number.toLowerCase().includes(q) ||
                (doc.clientName && doc.clientName.toLowerCase().includes(q)) ||
                (doc.clientCif && doc.clientCif.toLowerCase().includes(q)) ||
                (doc.total && String(doc.total).includes(q))
              );
            });

            return filteredInvoices.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
                No se encontraron facturas emitidas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {filteredInvoices.map((doc) => (
                  <FacturaCard
                    key={doc.id}
                    doc={doc}
                    onViewDoc={onViewDoc || (() => {})}
                    userTier={currentUser?.currentTier}
                  />
                ))}
              </div>
            );
          })()
        ) : (
          /* Tarjetas informativas de clientes */
          filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
              No se encontraron clientes registrados con el criterio de búsqueda.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {filtered.map((client) => {
              const clientVehicles = getClientVehiclesList(client, documents);
              const primaryVehicle = clientVehicles[0] || null;
              const isExpanded = expandedClientId === client.id;
              const clientNum = client.clientNumber ?? 1;

              const clientDocs = documents.filter((d) => d.clientId === client.id);
              const docColors = getClientDocColors(clientDocs);

              return (
                <div
                  key={client.id}
                  className={`${docColors.cardBgColor} rounded-2xl shadow-xs hover:shadow-md transition-all ${docColors.cardBorderColor} ${
                    isExpanded ? 'ring-2 ring-black/10' : ''
                  } ${isSelectingForBudget ? 'ring-2 ring-sky-400 hover:ring-sky-600' : ''} overflow-hidden cursor-pointer flex flex-col w-full lg:w-full mx-auto`}
                >
                  {/* Barra de acción directa en modo selección para presupuesto */}
                  {isSelectingForBudget && onSelectClientForBudget && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClientForBudget(client);
                      }}
                      className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white px-4 py-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        Elegir para presupuesto
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClientForBudget(client);
                        }}
                        className="px-3 py-1 bg-white text-blue-900 hover:bg-sky-50 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Cargar en Presupuesto</span>
                      </button>
                    </div>
                  )}

                  {/* Cuerpo principal de la tarjeta informativa */}
                  <div
                    className="pt-5 px-5 pb-1.5 flex flex-col gap-2 select-none"
                    onClick={() => {
                      if (isSelectingForBudget && onSelectClientForBudget) {
                        onSelectClientForBudget(client);
                      } else {
                        toggleExpand(client.id);
                      }
                    }}
                  >
                    {/* Línea 1: Nombre arriba en línea 1 y número de cliente solo dentro de un círculo con relleno sutil sin borde */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-lg sm:text-xl font-black text-[#0F172A] truncate">
                        {client.name}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center font-mono text-sm font-black text-sky-950 shrink-0 select-text"
                        title={`Número de cliente: ${clientNum}`}
                      >
                        {clientNum}
                      </div>
                    </div>

                    {/* Línea 2: Matrícula o Localización según configuración */}
                    {!isVehicleActive && isLocationActive ? (
                      <div className="flex items-center justify-between gap-3 w-full my-0.5">
                        <div className="flex items-center bg-emerald-50 border-2 border-emerald-500 rounded overflow-hidden h-8 px-2.5 gap-1.5 shadow-xs shrink-0">
                          <Home className="w-4 h-4 text-emerald-800 shrink-0" />
                          <span className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-wider">
                            UBICACIÓN
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0">
                          <span className="text-xs sm:text-sm font-black uppercase text-[#0F2942] tracking-wider truncate w-full leading-tight">
                            {client.taskLocation || client.address || 'Sin localización registrada'}
                          </span>
                        </div>
                      </div>
                    ) : isVehicleActive ? (
                      <div className="flex items-center justify-between gap-3 w-full my-0.5">
                        {/* Matrícula dibujo a la izquierda (misma altura h-8 que en solicitudes) */}
                        {primaryVehicle?.plate ? (
                          <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-xs shrink-0">
                            <div className="bg-blue-700 h-full w-6 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[6px] text-yellow-300 font-bold mb-0.5">⭐</span>
                              <span className="text-[10px] text-white font-bold leading-none">E</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-lg tracking-widest text-[#0F172A]">
                              {primaryVehicle.plate}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center bg-slate-100 border border-slate-300 rounded h-8 px-3 text-xs font-mono font-bold text-slate-400 shrink-0">
                            SIN MATRÍCULA
                          </div>
                        )}

                        {/* Marca y Modelo a la derecha en dos líneas centrado en el espacio restante */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0">
                          <span className="text-sm sm:text-base font-black uppercase text-[#0F2942] tracking-wider truncate w-full leading-tight">
                            {primaryVehicle?.brand || '—'}
                          </span>
                          <span className="text-[14.5px] sm:text-[17px] font-bold text-slate-700 truncate w-full leading-tight mt-0.5">
                            {primaryVehicle?.model || '—'}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Línea 3: Números de presupuesto, expediente y factura solo (sin etiquetas PRES:, EXP:, FACT:) */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 flex-wrap font-mono">
                      <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                        {currentUser?.currentTier !== 'quick' && docColors.latestBudgetNum && (
                          <span
                            title="Presupuesto"
                            className={`text-xl sm:text-2xl font-black tracking-tight select-text ${docColors.budgetColor}`}
                          >
                            {docColors.latestBudgetNum}
                          </span>
                        )}

                        {currentUser?.currentTier !== 'quick' && currentUser?.currentTier !== 'lite' && docColors.latestExpedienteNum && (
                          <span
                            title="Expediente"
                            className={`text-xl sm:text-2xl font-black tracking-tight select-text ${docColors.expedienteColor}`}
                          >
                            {docColors.latestExpedienteNum}
                          </span>
                        )}

                        {docColors.latestInvoiceNum && (
                          <span
                            title="Factura"
                            className={`text-xl sm:text-2xl font-black tracking-tight select-text ${docColors.invoiceColor}`}
                          >
                            {docColors.latestInvoiceNum}
                          </span>
                        )}

                        {((currentUser?.currentTier === 'quick' && !docColors.latestInvoiceNum) ||
                          (currentUser?.currentTier !== 'quick' && !docColors.latestBudgetNum && !docColors.latestExpedienteNum && !docColors.latestInvoiceNum)) && (
                          <span className="text-xs text-slate-400 font-sans italic">
                            Sin documentos vinculados
                          </span>
                        )}
                      </div>

                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ml-auto shrink-0 ${
                          isExpanded ? 'rotate-180 text-[#0F2942]' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Sección expandida al pulsar: ÚNICAMENTE ICONOS EN DOS FILAS (TAMAÑO ESCALADO x1.5) */}
                  {isExpanded && (
                    <div
                      className="bg-[#FAF9F6] border-t border-[#E2E0D8] p-4 flex flex-col gap-4 animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Fila 1: Vehículo / Casita (según activación en Configuración), Editar Cliente, Ver Presupuestos, Ver Expedientes */}
                      <div className={`grid ${isVehicleActive && isLocationActive ? 'grid-cols-5' : (!isVehicleActive && !isLocationActive ? 'grid-cols-3' : 'grid-cols-4')} gap-3 items-center justify-items-center`}>
                        {/* 1. Icono de Vehículo (Si está activado en Configuración) */}
                        {isVehicleActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehicleManagerClient(client);
                            }}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Gestión de Vehículos (Editar, Añadir, Eliminar)"
                            aria-label="Gestión de Vehículos"
                          >
                            <Car className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </button>
                        )}

                        {/* 1B. Icono de Casita / Localización (Si está activado en Configuración) */}
                        {isLocationActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocationManagerClient(client);
                            }}
                            className="p-2 text-[#0F2942] hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Localización de la Tarea / Dirección del Cliente"
                            aria-label="Localización de la Tarea"
                          >
                            <Home className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </button>
                        )}

                        {/* 2. Editar Cliente */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClient(client);
                          }}
                          className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title="Editar datos del cliente"
                          aria-label="Editar cliente"
                        >
                          <UserPen className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>

                        {/* 3. Ver Presupuestos (Ocultar en Quick) */}
                        {currentUser?.currentTier !== 'quick' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewClientBudgets(client);
                            }}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Ver presupuestos del cliente"
                            aria-label="Ver presupuestos"
                          >
                            <SheetPIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                          </button>
                        )}

                        {/* 4. Ver Expedientes (Ocultar en Quick y Lite) */}
                        {currentUser?.currentTier !== 'quick' && currentUser?.currentTier !== 'lite' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewClientExpedientes(client);
                            }}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Ver expedientes del cliente"
                            aria-label="Ver expedientes"
                          >
                            <FolderKanban className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          </button>
                        )}
                      </div>

                      {/* Fila 2: Ver Facturas, WhatsApp, Teléfono, Email */}
                      <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
                        {/* 5. Ver Facturas */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentUser?.currentTier === 'quick') {
                              setActiveTab('facturas');
                              setSearch(client.name);
                            } else {
                              onViewClientInvoices(client);
                            }
                          }}
                          className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                          title={`Ver facturas emitidas de ${client.name}`}
                          aria-label="Ver facturas emitidas"
                        >
                          <SheetFIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                        </button>

                        {/* 6. WhatsApp */}
                        <button
                          type="button"
                          onClick={(e) => handleWhatsApp(client, e)}
                          className={`p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                            !client.phone ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title={client.phone ? `WhatsApp: ${client.phone}` : 'Sin teléfono registrado'}
                          aria-label="WhatsApp"
                          disabled={!client.phone}
                        >
                          <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>

                        {/* 7. Teléfono */}
                        <button
                          type="button"
                          onClick={(e) => handlePhoneCall(client, e)}
                          className={`p-2 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                            !client.phone ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title={client.phone ? `Llamar a ${client.phone}` : 'Sin teléfono registrado'}
                          aria-label="Llamada telefónica"
                          disabled={!client.phone}
                        >
                          <Phone className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>

                        {/* 8. Email */}
                        <button
                          type="button"
                          onClick={(e) => handleEmail(client, e)}
                          className={`p-2 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                            !client.email ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title={client.email ? `Email: ${client.email}` : 'Sin correo registrado'}
                          aria-label="Enviar correo"
                          disabled={!client.email}
                        >
                          <Mail className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botón directo de selección cuando se está en modo selección para Presupuesto */}
                  {isSelectingForBudget && onSelectClientForBudget && (
                    <div className="p-3 bg-blue-50/80 border-t border-blue-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClientForBudget(client);
                        }}
                        className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Seleccionar {client.name}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
      </div>

      {/* Modal para Gestión de Vehículos del Cliente (Editar, Añadir o Eliminar) */}
      {vehicleManagerClient && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setVehicleManagerClient(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-6 h-6 text-[#0F2942]" />
                <h3 className="font-black text-base uppercase text-[#0F2942] truncate">
                  Vehículos — {vehicleManagerClient.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVehicleManagerClient(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {getClientVehiclesList(vehicleManagerClient, documents).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Este cliente no tiene ningún vehículo registrado aún.
                </div>
              ) : (
                getClientVehiclesList(vehicleManagerClient, documents).map((veh) => (
                  <div
                    key={veh.plate}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                  >
                    <div className="flex items-center gap-3">
                      {/* Matrícula dibujo */}
                      <div className="flex items-center bg-white border-2 border-slate-400 rounded overflow-hidden h-8 min-w-[110px] shadow-2xs shrink-0">
                        <div className="bg-blue-700 h-full w-4 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[4px] text-yellow-300 font-bold mb-0.5">⭐</span>
                          <span className="text-[8px] text-white font-bold leading-none">E</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center px-2 font-mono font-black text-sm tracking-wider text-[#0F172A]">
                          {veh.plate}
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-xs uppercase text-[#0F2942] truncate">{veh.brand}</span>
                        <span className="text-xs text-slate-600 font-medium truncate">{veh.model}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          const c = vehicleManagerClient;
                          setVehicleManagerClient(null);
                          handleOpenEditVehicle(c, veh, e);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-[#0F2942] border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Editar vehículo"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#0F2942]" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Está seguro de eliminar el vehículo con matrícula ${veh.plate}?`)) {
                            setTargetClientForVehicle(vehicleManagerClient);
                            handleDeleteVehicle(veh.plate);
                            setVehicleManagerClient(null);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Eliminar vehículo"
                      >
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={(e) => {
                  const c = vehicleManagerClient;
                  setVehicleManagerClient(null);
                  handleOpenAddVehicle(c, e);
                }}
                className="flex-1 py-2.5 px-4 bg-[#0F2942] hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Añadir Vehículo</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleManagerClient(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para añadir o editar vehículo con OCR y cámara */}
      {isVehicleFormOpen && targetClientForVehicle && (
        <VehicleFormModal
          isOpen={isVehicleFormOpen}
          clientName={targetClientForVehicle.name}
          initialVehicle={editingVehicle || undefined}
          onClose={() => {
            setIsVehicleFormOpen(false);
            setTargetClientForVehicle(null);
            setEditingVehicle(null);
          }}
          onSave={handleSaveVehicle}
          onDelete={handleDeleteVehicle}
        />
      )}

      {/* Modal para ver todos los datos extraídos de OCR (Permiso + Ficha Técnica) */}
      {isOcrModalOpen && selectedVehicleForOcr && (
        <VehicleOcrDataModal
          isOpen={isOcrModalOpen}
          vehicle={selectedVehicleForOcr}
          onClose={() => {
            setIsOcrModalOpen(false);
            setSelectedVehicleForOcr(null);
          }}
          onEdit={() => {
            setIsOcrModalOpen(false);
            if (targetClientForVehicle) {
              setEditingVehicle(selectedVehicleForOcr);
              setIsVehicleFormOpen(true);
            }
          }}
        />
      )}

      {/* Modal para ver y editar la localización de la tarea del cliente */}
      {locationManagerClient && (
        <ClientLocationModal
          isOpen={Boolean(locationManagerClient)}
          client={locationManagerClient}
          onClose={() => setLocationManagerClient(null)}
          onSave={handleSaveLocation}
        />
      )}
    </div>
  );
};
