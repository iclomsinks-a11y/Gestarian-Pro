import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Client, GestarianDocument, ClientVehicle } from '../types';
import { 
  Search, Plus, Users, Phone, Mail, MapPin, 
  UserPen, FolderKanban, Receipt, ChevronDown, Car,
  MessageCircle, Pencil, FileText, Sparkles, Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { getClientStatus } from '../utils/clientStatusHelper';
import { getClientVehiclesList, ClientVehicleInfo } from '../utils/clientVehiclesHelper';
import { VehicleFormModal } from './VehicleFormModal';
import { VehicleOcrDataModal } from './VehicleOcrDataModal';
import { playGentleChime } from '../utils/audioNotification';
import { saveStoredClients } from '../services/storage';

import { SheetPIcon, SheetPlusPIcon } from './BudgetIcons';
export { SheetPIcon, SheetPlusPIcon };

interface ClientesCardsViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  clients: Client[];
  documents?: GestarianDocument[];
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
}

export const ClientesCardsView: React.FC<ClientesCardsViewProps> = ({
  id,
  logoUrl,
  userFullName,
  clients,
  documents = [],
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
}) => {
  const [search, setSearch] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [openVehiclesClientId, setOpenVehiclesClientId] = useState<string | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Record<string, string>>({});

  // Gestión de Vehículos con Formulario y Lectura OCR
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [targetClientForVehicle, setTargetClientForVehicle] = useState<Client | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<ClientVehicle | null>(null);

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
    <div id={id} className="min-h-screen bg-[#FDFBF7] flex flex-col snap-start shrink-0 w-full overflow-y-auto">
      <PageHeader
        pageId="page-clientes"
        title="Clientes"
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        onOpenMenu={onOpenMenu}
        logoUrl={logoUrl}
        userFullName={userFullName}
      />

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Barra superior con buscador y botón de nuevo cliente */}
        <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por ID, nombre, CIF, teléfono o matrícula..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg outline-none focus:border-[#0F2942]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B] hidden sm:inline-block">
              Total: {clients.length} clientes
            </span>

            <button
              type="button"
              onClick={onNewClient}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Tarjetas informativas de clientes (sin estado) */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs">
            No se encontraron clientes registrados con el criterio de búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {filtered.map((client) => {
              const clientVehicles = getClientVehiclesList(client, documents);
              const hasSingleVehicle = clientVehicles.length === 1;
              const hasMultipleVehicles = clientVehicles.length > 1;
              const singleVehicle = hasSingleVehicle ? clientVehicles[0] : null;
              const isVehiclesOpen = openVehiclesClientId === client.id;
              const isExpanded = expandedClientId === client.id;
              const clientNum = client.clientNumber ?? 1;
              const statusInfo = getClientStatus(client, documents);

              return (
                <div
                  key={client.id}
                  className={`bg-white rounded-xl shadow-xs hover:shadow-md transition-all ${statusInfo.borderClass} ${
                    isExpanded ? 'ring-2 ring-black/10' : ''
                  } overflow-hidden cursor-pointer flex flex-col`}
                >
                  {/* Cuerpo principal de la tarjeta informativa */}
                  <div
                    className="p-5 flex flex-col gap-3.5 select-none"
                    onClick={() => toggleExpand(client.id)}
                  >
                    {/* Línea 1: ID de cliente (sin envoltorio ni relleno), estado con código de color, y matrícula o botón seleccionar vehículo */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* ID de cliente formato iD:..., SIN ENVOLTORIO NI RELLENO */}
                        <span
                          className="font-mono text-xs sm:text-sm font-bold text-[#0F172A] tracking-wider select-text"
                          title="Identificador numérico de cliente"
                        >
                          iD:{clientNum}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.badgeBorder}`}
                          title={`Estado del cliente: ${statusInfo.label}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Matrícula Oficial y botones de vehículo (solo si tiene 1 solo vehículo) */}
                      {hasSingleVehicle && singleVehicle && (
                        <div className="flex items-center gap-1.5 ml-auto shrink-0 flex-wrap justify-end">
                          <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-xs shrink-0">
                            <div className="bg-blue-700 h-full w-6 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[6px] text-yellow-300 font-bold mb-0.5">⭐</span>
                              <span className="text-[10px] text-white font-bold leading-none">E</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-lg tracking-widest text-[#0F172A]">
                              {singleVehicle.plate}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Botón editar vehículo */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditVehicle(client, singleVehicle, e)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-[#0F2942] border border-[#CBD5E1] rounded text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs hover:border-[#0F2942] cursor-pointer"
                              title={`Editar vehículo ${singleVehicle.plate}`}
                            >
                              <Pencil className="w-3 h-3 text-[#0F2942]" />
                              <span>Editar</span>
                            </button>

                            {/* Botón ver todos los datos (si tiene OCR) */}
                            {singleVehicle.ocrData && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenOcrModal(client, singleVehicle, e)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                title="Ver todos los datos extraídos por OCR"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>Datos OCR</span>
                              </button>
                            )}

                            {/* Botón + Añadir vehículo */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenAddVehicle(client, e)}
                              className="px-1.5 py-1 bg-slate-50 hover:bg-[#0F2942] hover:text-white text-[#64748B] border border-dashed border-[#CBD5E1] rounded text-[10px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                              title="Añadir otro vehículo para este cliente"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Vehículo</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botón Seleccionar Vehículo (si tiene más de 1 vehículo) */}
                      {hasMultipleVehicles && (
                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVehiclesList(client.id);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
                              isVehiclesOpen
                                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                                : 'bg-white hover:bg-slate-50 text-[#0F2942] border-[#CBD5E1] hover:border-[#0F2942]'
                            }`}
                            title="Desplegar listado de vehículos del cliente"
                          >
                            <Car className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                            <span>Seleccionar vehículo</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                isVehiclesOpen ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {clientVehicles.length}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isVehiclesOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenAddVehicle(client, e)}
                            className="p-1.5 bg-slate-50 hover:bg-[#0F2942] hover:text-white text-[#64748B] border border-dashed border-[#CBD5E1] rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Añadir vehículo a este cliente"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Línea 2: Marca, Modelo, Color, VIN y fotos (solo si tiene un solo vehículo) */}
                    {hasSingleVehicle && singleVehicle && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                        <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#0F2942] rounded border border-[#E2E8F0] font-black text-xs uppercase tracking-wider">
                          {singleVehicle.brand}
                        </span>
                        <span className="text-[#334155] font-bold tracking-wide">
                          {singleVehicle.model}
                        </span>
                        {singleVehicle.color && (
                          <span className="text-xs text-[#64748B] font-medium">
                            • {singleVehicle.color}
                          </span>
                        )}
                        {singleVehicle.vin && (
                          <span className="text-[10px] font-mono text-[#94A3B8] bg-slate-100 px-1.5 py-0.2 rounded">
                            VIN: {singleVehicle.vin}
                          </span>
                        )}
                        {singleVehicle.images && singleVehicle.images.length > 0 && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded flex items-center gap-1 border border-blue-200">
                            <ImageIcon className="w-3 h-3" /> {singleVehicle.images.length} fotos
                          </span>
                        )}
                      </div>
                    )}

                    {/* Línea 3: Nombre del Cliente */}
                    <div className="text-xl font-black text-[#0F172A] truncate">
                      {client.name}
                    </div>

                    {/* Desplegable de subtarjetas de vehículos cuando tiene más de 1 vehículo */}
                    {hasMultipleVehicles && isVehiclesOpen && (
                      <div
                        className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1">
                          <span className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-[#0F2942]" strokeWidth={1.8} />
                            Vehículos del cliente ({clientVehicles.length})
                          </span>
                          <span className="text-[10px] text-[#94A3B8] font-medium">
                            Toca para seleccionar
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {clientVehicles.map((veh) => {
                            const isSelected = selectedVehicles[client.id] === veh.plate;
                            return (
                              <div
                                key={veh.plate}
                                onClick={() => handleSelectVehicle(client.id, veh.plate)}
                                className={`p-2.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? 'bg-white border-[#0F2942] ring-2 ring-[#0F2942]/20'
                                    : 'bg-white border-[#E2E8F0] hover:border-[#0F2942]/60 hover:bg-slate-50/60'
                                }`}
                                title={`Vehículo: ${veh.brand} ${veh.model} (${veh.plate})`}
                              >
                                {/* Subtarjeta: Marca y Modelo */}
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-[#0F2942] uppercase tracking-wider">
                                      {veh.brand}
                                    </span>
                                    {isSelected && (
                                      <span className="text-[9px] font-bold bg-[#0F2942] text-white px-1.5 py-0.2 rounded tracking-wide">
                                        SELECCIONADO
                                      </span>
                                    )}
                                    {veh.images && veh.images.length > 0 && (
                                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded flex items-center gap-0.5 border border-blue-200">
                                        <ImageIcon className="w-2.5 h-2.5" /> {veh.images.length}
                                      </span>
                                    )}
                                    {veh.ocrData && (
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        OCR ✓
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-[#475569] font-medium truncate">
                                    {veh.model} {veh.color ? `• ${veh.color}` : ''}
                                  </span>
                                  {veh.vin && (
                                    <span className="text-[10px] font-mono text-[#94A3B8]">
                                      VIN: {veh.vin}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  {/* Subtarjeta: Matrícula Oficial Española */}
                                  <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-7 min-w-[115px] shadow-2xs shrink-0">
                                    <div className="bg-blue-700 h-full w-5 flex flex-col items-center justify-center shrink-0">
                                      <span className="text-[5px] text-yellow-300 font-bold leading-none">⭐</span>
                                      <span className="text-[9px] text-white font-bold leading-none">E</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center px-2 font-mono font-black text-sm tracking-wider text-[#0F172A]">
                                      {veh.plate}
                                    </div>
                                  </div>

                                  {/* Botón editar vehículo */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditVehicle(client, veh, e)}
                                    className="p-1.5 bg-white hover:bg-slate-100 text-[#0F2942] border border-[#CBD5E1] rounded text-xs font-bold transition-all shadow-2xs hover:border-[#0F2942] cursor-pointer"
                                    title={`Editar vehículo ${veh.plate}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-[#0F2942]" />
                                  </button>

                                  {/* Botón ver datos OCR */}
                                  {veh.ocrData && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenOcrModal(client, veh, e)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                      title="Ver todos los datos extraídos por OCR"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Botón + AÑADIR VEHÍCULO */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenAddVehicle(client, e)}
                          className="w-full mt-1 py-2 px-3 bg-white hover:bg-[#0F2942] text-[#0F2942] hover:text-white border border-dashed border-[#94A3B8] hover:border-[#0F2942] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ AÑADIR VEHÍCULO</span>
                        </button>
                      </div>
                    )}

                    {/* Línea 4: Datos adicionales y flecha de expansión */}
                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-gray-100">
                      <div className="truncate max-w-[80%] flex items-center gap-1.5">
                        {client.address ? (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{client.address}</span>
                          </>
                        ) : (
                          <span>{clientVehicles.length} vehículo(s) registrados</span>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180 text-[#0F2942]' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Sección expandida hacia abajo: Filas de iconos de acción */}
                  {isExpanded && (
                    <div
                      className="bg-[#FAF9F6] border-t border-[#E2E0D8] p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Vehículos del Cliente: Ficha completa con botón editar, OCR y + Añadir vehículo */}
                      <div className="bg-white p-3 rounded-lg border border-[#CBD5E1] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F2942] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-[#0F2942]" />
                            Vehículos del Cliente ({clientVehicles.length})
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleOpenAddVehicle(client, e)}
                            className="px-2 py-1 bg-[#0F2942] hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Añadir Vehículo</span>
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          {clientVehicles.length === 0 ? (
                            <div className="text-xs text-gray-500 italic py-1">
                              No hay vehículos registrados para este cliente.
                            </div>
                          ) : (
                            clientVehicles.map((veh) => (
                              <div
                                key={veh.plate}
                                className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {/* Matrícula Oficial */}
                                  <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-7 min-w-[110px] shadow-2xs shrink-0">
                                    <div className="bg-blue-700 h-full w-5 flex flex-col items-center justify-center shrink-0">
                                      <span className="text-[5px] text-yellow-300 font-bold leading-none">⭐</span>
                                      <span className="text-[9px] text-white font-bold leading-none">E</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center px-2 font-mono font-black text-sm tracking-wider text-[#0F172A]">
                                      {veh.plate}
                                    </div>
                                  </div>

                                  <div className="flex flex-col min-w-0 text-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-black text-[#0F2942] uppercase">{veh.brand}</span>
                                      <span className="text-[#334155] font-semibold">{veh.model}</span>
                                      {veh.color && <span className="text-gray-500">• {veh.color}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B] flex-wrap">
                                      {veh.vin && <span className="font-mono">VIN: {veh.vin}</span>}
                                      {veh.images && veh.images.length > 0 && (
                                        <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 flex items-center gap-1">
                                          <ImageIcon className="w-2.5 h-2.5" /> {veh.images.length} fotos
                                        </span>
                                      )}
                                      {veh.ocrData && (
                                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                                          <CheckCircle2 className="w-2.5 h-2.5" /> Docs OCR
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                  {/* Botón editar vehículo */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditVehicle(client, veh, e)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0F2942] border border-[#CBD5E1] rounded text-xs font-bold transition-all shadow-2xs hover:border-[#0F2942] flex items-center gap-1 cursor-pointer"
                                    title={`Editar vehículo ${veh.plate}`}
                                  >
                                    <Pencil className="w-3 h-3 text-[#0F2942]" />
                                    <span>Editar vehículo</span>
                                  </button>

                                  {/* Botón ver todos los datos (cuando se extraen datos de ocr) */}
                                  {veh.ocrData && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenOcrModal(client, veh, e)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                      title="Ver todos los datos extraídos de los documentos leídos mediante OCR"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Ver todos los datos</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Resumen de cobros y datos de contacto */}
                      <div className="text-xs text-[#475569] bg-white p-3 rounded-lg border border-[#E2E0D8] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                          <span className="font-bold text-[#0F2942] uppercase text-[10px] tracking-wider">Control de Cobros / Expediente:</span>
                          <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.badgeBorder}`}>
                            Pendiente: {statusInfo.pendingAmount.toFixed(2)} € {statusInfo.pendingAmount === 0 ? '(Cerrado)' : ''}
                          </span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{client.address}</span>
                          </div>
                        )}
                      </div>

                      {/* ICONOS DE ACCIÓN DEL CLIENTE:
                          Todos los iconos sin títulos, solo icono flotante dibujo sin envoltorio ni circulito ni cuadradito
                      */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-center justify-items-center py-1">
                          {/* 1. Editar datos del cliente */}
                          <button
                            type="button"
                            onClick={() => onEditClient(client)}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Editar datos del cliente y vehículos"
                            aria-label="Editar datos del cliente"
                          >
                            <UserPen className="w-5 h-5" strokeWidth={1.8} />
                          </button>

                          {/* 2. Presupuestos (hoja con P mayúscula dentro) */}
                          <button
                            type="button"
                            onClick={() => onViewClientBudgets(client)}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Ver presupuestos del cliente"
                            aria-label="Ver presupuestos"
                          >
                            <SheetPIcon className="w-5 h-5" />
                          </button>

                          {/* 3. Nuevo presupuesto (hoja con '+' y 'P' mayúscula dentro) */}
                          <button
                            type="button"
                            onClick={() => onNewBudgetForClient(client)}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Crear nuevo presupuesto para este cliente"
                            aria-label="Nuevo presupuesto"
                          >
                            <SheetPlusPIcon className="w-5 h-5" />
                          </button>

                          {/* 4. Expedientes */}
                          <button
                            type="button"
                            onClick={() => onViewClientExpedientes(client)}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title="Ver expedientes del cliente"
                            aria-label="Ver expedientes"
                          >
                            <FolderKanban className="w-5 h-5" strokeWidth={1.8} />
                          </button>

                          {/* 5. Facturas emitidas */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewClientInvoices(client);
                            }}
                            className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                            title={`Ver facturas emitidas de ${client.name}`}
                            aria-label="Ver facturas emitidas"
                          >
                            <Receipt className="w-5 h-5" strokeWidth={1.8} />
                          </button>

                          {/* 6. WhatsApp */}
                          <button
                            type="button"
                            onClick={(e) => handleWhatsApp(client, e)}
                            className={`p-2 text-emerald-600 hover:text-emerald-700 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                              !client.phone ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={client.phone ? `WhatsApp: ${client.phone}` : 'Sin teléfono registrado'}
                            aria-label="WhatsApp"
                            disabled={!client.phone}
                          >
                            <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
                          </button>

                          {/* 7. Teléfono (llamada directa) */}
                          <button
                            type="button"
                            onClick={(e) => handlePhoneCall(client, e)}
                            className={`p-2 text-blue-600 hover:text-blue-700 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                              !client.phone ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={client.phone ? `Llamar a ${client.phone}` : 'Sin teléfono registrado'}
                            aria-label="Llamada telefónica"
                            disabled={!client.phone}
                          >
                            <Phone className="w-5 h-5" strokeWidth={1.8} />
                          </button>

                          {/* 8. Email (envío directo) */}
                          <button
                            type="button"
                            onClick={(e) => handleEmail(client, e)}
                            className={`p-2 text-violet-600 hover:text-violet-700 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                              !client.email ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={client.email ? `Enviar email a ${client.email}` : 'Sin email registrado'}
                            aria-label="Enviar email"
                            disabled={!client.email}
                          >
                            <Mail className="w-5 h-5" strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </div>
  );
};
