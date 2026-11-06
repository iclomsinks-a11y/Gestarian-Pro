import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Client, GestarianDocument, ClientVehicle, AppUser, Appointment, GestarianPlan } from '../types';
import { 
  Search, Plus, Users, Phone, Mail, MapPin, 
  UserPen, FolderKanban, ChevronDown, Car, Home,
  MessageCircle, Pencil, FileText, Sparkles, Image as ImageIcon,
  CheckCircle2, Receipt, ShieldCheck, AlertTriangle, Calendar, Clock, Wrench,
  Eye, ArrowLeft, X, ExternalLink, Save, Trash2, Camera
} from 'lucide-react';
import { FacturaCard } from './FacturacionView';
import { getClientStatus, getClientDocColors } from '../utils/clientStatusHelper';
import { getClientVehiclesList, ClientVehicleInfo } from '../utils/clientVehiclesHelper';
import { VehicleFormModal } from './VehicleFormModal';
import { VehicleOcrDataModal } from './VehicleOcrDataModal';
import { ClientLocationModal } from './ClientLocationModal';
import { playGentleChime } from '../utils/audioNotification';
import { 
  saveStoredClients, getStoredAppointments, saveStoredAppointments, 
  saveStoredDocuments, DEFAULT_USER, sanitizePlate 
} from '../services/storage';
import { 
  isAutomotiveWorkshop, isVehicleFeatureActive, isVehicleMaintenanceEligible, getVehicleItvAlerts, generatePreItvBudgetAndAppointment, 
  parseItvDate, formatDateDmy, VehicleItvAlert 
} from '../services/preventiveMaintenanceService';

import { SheetPIcon, SheetPlusPIcon, SheetFIcon } from './BudgetIcons';
export { SheetPIcon, SheetPlusPIcon, SheetFIcon };

interface ClientesCardsViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  currentUser?: AppUser;
  currentPlan?: GestarianPlan;
  clients: Client[];
  documents?: GestarianDocument[];
  onAddPreItvBudgetAndAppointment?: (budget: GestarianDocument, appointment: Appointment) => void;
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

interface ClientVehicleCardProps {
  client: Client;
  vehicle: ClientVehicleInfo;
  onNewVehicle: (client: Client) => void;
  onEditVehicle: (client: Client, vehicle: ClientVehicleInfo) => void;
  onDeleteVehicle: (client: Client, plate: string) => void;
  onOpenImages: (client: Client, vehicle: ClientVehicleInfo) => void;
  onSaveVehicle: (client: Client, updated: ClientVehicle) => void;
}

const ClientVehicleCard: React.FC<ClientVehicleCardProps> = ({
  client,
  vehicle,
  onNewVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onOpenImages,
  onSaveVehicle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [plate, setPlate] = useState(vehicle.plate);
  const [brand, setBrand] = useState(vehicle.brand);
  const [model, setModel] = useState(vehicle.model);
  const [vin, setVin] = useState(vehicle.vin || '');
  const [color, setColor] = useState(vehicle.color || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  React.useEffect(() => {
    setPlate(vehicle.plate);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setVin(vehicle.vin || '');
    setColor(vehicle.color || '');
  }, [vehicle]);

  const handleSave = () => {
    const cleanPlate = sanitizePlate(plate) || vehicle.plate;
    const updated: ClientVehicle = {
      plate: cleanPlate,
      brand: brand.trim().toUpperCase(),
      model: model.trim(),
      vin: vin.trim().toUpperCase(),
      color: color.trim(),
      images: vehicle.images || [],
      ocrData: vehicle.ocrData,
    };
    onSaveVehicle(client, updated);
    setIsEditing(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="p-3.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col gap-2.5">
      {/* Cabecera: Placa y Marca/Modelo */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Matrícula europea o input de edición */}
        {isEditing ? (
          <div className="flex items-center bg-white border-2 border-blue-500 rounded overflow-hidden h-8 min-w-[120px] shadow-xs shrink-0">
            <div className="bg-blue-700 h-full w-5 flex flex-col items-center justify-center shrink-0">
              <span className="text-[5px] text-yellow-300 font-bold mb-0.5">⭐</span>
              <span className="text-[9px] text-white font-bold leading-none">E</span>
            </div>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="1234BBB"
              className="flex-1 px-2 font-mono font-black text-sm uppercase text-[#0F172A] outline-none"
            />
          </div>
        ) : (
          <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-8 min-w-[120px] shadow-xs shrink-0">
            <div className="bg-blue-700 h-full w-5 flex flex-col items-center justify-center shrink-0">
              <span className="text-[5px] text-yellow-300 font-bold mb-0.5">⭐</span>
              <span className="text-[10px] text-white font-bold leading-none">E</span>
            </div>
            <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-base tracking-widest text-[#0F172A]">
              {vehicle.plate}
            </div>
          </div>
        )}

        {/* Marca y Modelo */}
        {isEditing ? (
          <div className="flex-1 flex gap-2 min-w-[160px]">
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Marca"
              className="w-1/2 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg outline-none focus:border-blue-500 uppercase"
            />
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Modelo"
              className="w-1/2 px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <span className="font-black text-sm uppercase text-[#0F2942] truncate">
              {vehicle.brand || '—'}
            </span>
            <span className="text-xs text-slate-600 font-medium truncate">
              {vehicle.model || '—'}
            </span>
          </div>
        )}
      </div>

      {/* Inputs opcionales adicionales en modo edición */}
      {isEditing && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Nº Bastidor / VIN"
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg outline-none font-mono uppercase"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Color del vehículo"
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg outline-none"
          />
        </div>
      )}

      {/* Barra de 5 Iconos de acción obligatorios: nuevo vehículo, editar vehículo, eliminar vehículo, imágenes y guardar */}
      <div className="flex items-center justify-end gap-2 sm:gap-4 pt-2 border-t border-slate-100 flex-wrap">
        {/* 1. Nuevo vehículo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNewVehicle(client);
          }}
          className="p-1.5 text-sky-700 hover:text-sky-900 hover:bg-sky-50 rounded-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          title="Nuevo vehículo"
          aria-label="Nuevo vehículo"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold hidden sm:inline">Nuevo</span>
        </button>

        {/* 2. Editar vehículo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className={`p-1.5 ${isEditing ? 'text-amber-800 bg-amber-50 rounded-lg font-black' : 'text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg'} hover:scale-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer`}
          title="Editar vehículo"
          aria-label="Editar vehículo"
        >
          <Pencil className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold hidden sm:inline">Editar</span>
        </button>

        {/* 3. Eliminar vehículo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`¿Está seguro de eliminar el vehículo con matrícula ${vehicle.plate}?`)) {
              onDeleteVehicle(client, vehicle.plate);
            }
          }}
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          title="Eliminar vehículo"
          aria-label="Eliminar vehículo"
        >
          <Trash2 className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold hidden sm:inline">Eliminar</span>
        </button>

        {/* 4. Imágenes */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImages(client, vehicle);
          }}
          className="p-1.5 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-1 relative cursor-pointer"
          title="Imágenes del vehículo"
          aria-label="Imágenes del vehículo"
        >
          <Camera className="w-4 h-4 stroke-[2.2]" />
          {(vehicle.images?.length || 0) > 0 && (
            <span className="bg-purple-600 text-white text-[9px] font-black rounded-full px-1.5 py-0.2 leading-tight">
              {vehicle.images!.length}
            </span>
          )}
          <span className="text-[11px] font-bold hidden sm:inline">Imágenes</span>
        </button>

        {/* 5. Guardar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className={`p-1.5 ${savedFeedback ? 'text-emerald-800 bg-emerald-50 rounded-lg scale-105 font-black' : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg'} hover:scale-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer`}
          title="Guardar vehículo"
          aria-label="Guardar vehículo"
        >
          <Save className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-bold hidden sm:inline">{savedFeedback ? 'Guardado' : 'Guardar'}</span>
        </button>
      </div>
    </div>
  );
};

const VehicleImagesViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  vehicle: ClientVehicleInfo;
  onSaveImages: (client: Client, plate: string, images: string[]) => void;
}> = ({ isOpen, onClose, client, vehicle, onSaveImages }) => {
  const [images, setImages] = useState<string[]>(vehicle.images || []);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setImages(vehicle.images || []);
    setActiveIdx(0);
  }, [vehicle]);

  if (!isOpen) return null;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const promises = Array.from(files).map((f) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(f as File);
      });
    });
    Promise.all(promises).then((newImgs) => {
      const next = [...images, ...newImgs];
      setImages(next);
      setActiveIdx(next.length - 1);
      onSaveImages(client, vehicle.plate, next);
    });
    e.target.value = '';
  };

  const handleDeleteImg = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    setActiveIdx(Math.max(0, idx - 1));
    onSaveImages(client, vehicle.plate, next);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl flex flex-col gap-4 border border-slate-200 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-7 min-w-[105px] shadow-xs">
              <div className="bg-blue-700 h-full w-4 flex flex-col items-center justify-center shrink-0">
                <span className="text-[4px] text-yellow-300 font-bold mb-0.5">⭐</span>
                <span className="text-[8px] text-white font-bold leading-none">E</span>
              </div>
              <div className="flex-1 flex items-center justify-center px-2 font-mono font-black text-sm tracking-wider text-[#0F172A]">
                {vehicle.plate}
              </div>
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-[#0F2942] truncate">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Imágenes ({images.length}) · {client.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-[220px]">
          {images.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="relative aspect-video w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                <img
                  src={images[activeIdx] || images[0]}
                  alt="Vehículo"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImg(activeIdx)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer"
                  title="Eliminar esta foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                        activeIdx === i ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2 border-2 border-dashed border-slate-200 rounded-xl">
              <Camera className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <span className="text-xs font-semibold">No hay imágenes adjuntas de este vehículo</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAddFiles}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddFiles}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-purple-600" />
              <span>Cámara</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Galería</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#0F2942] hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer ml-auto"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClientesCardsView: React.FC<ClientesCardsViewProps> = ({
  id,
  logoUrl,
  userFullName,
  currentUser,
  currentPlan,
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
  onAddPreItvBudgetAndAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'clientes' | 'facturas' | 'mantenimientos'>('clientes');
  const [mantenimientoFilter, setMantenimientoFilter] = useState<'all' | 'urgent' | 'pending' | 'accepted'>('all');
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const isVehicleActive = currentUser?.enableVehicle !== false;
  const isLocationActive = currentUser?.enableLocation === true;
  const isLite = currentPlan === 'lite' || currentUser?.currentTier === 'lite';
  const isQuick = currentPlan === 'quick' || currentUser?.currentTier === 'quick';
  const isProOrEnterprise = currentPlan === 'pro' || currentPlan === 'enterprise' || currentUser?.currentTier === 'pro' || currentUser?.currentTier === 'enterprise';
  const isAutoBusiness = isVehicleFeatureActive(currentUser);
  const showVehiclePlate = isVehicleActive && isAutoBusiness;

  // Avisos de mantenimiento de vehículos: Disponible en todas las versiones excepto Lite,
  // solo si la empresa es del sector automoción y especialidad mecánica/reparación/mantenimiento.
  const isVehicleMaintenanceAlertsActive = !isLite && isVehicleMaintenanceEligible(currentUser) && (
    isQuick
      ? (currentUser?.enableVehicleMaintenanceAlerts === true || currentUser?.quickExtras?.vehicleMaintenanceAlertsEnabled === true)
      : (currentUser?.enableVehicleMaintenanceAlerts !== false)
  );

  const itvAlerts = isVehicleMaintenanceAlertsActive ? getVehicleItvAlerts(clients, documents, 60) : [];
  const pendingItvAlertsCount = itvAlerts.filter((a) => !a.isBudgetAccepted).length;

  const handleCreatePreItv = (alert: VehicleItvAlert) => {
    const { budget: newBudget, appointment: newAppointment } = generatePreItvBudgetAndAppointment(
      alert.client,
      alert.vehicle,
      currentUser || DEFAULT_USER,
      documents,
      alert.itvDate
    );

    const nextDocs = [newBudget, ...documents];
    saveStoredDocuments(nextDocs);
    window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));

    const storedApps = getStoredAppointments();
    saveStoredAppointments([newAppointment, ...storedApps]);
    window.dispatchEvent(new CustomEvent('gestarian_appointments_updated'));

    if (onAddPreItvBudgetAndAppointment) {
      onAddPreItvBudgetAndAppointment(newBudget, newAppointment);
    }

    playGentleChime();
  };

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
  const [vehicleForImages, setVehicleForImages] = useState<{ client: Client; vehicle: ClientVehicleInfo } | null>(null);

  const handleDirectSaveVehicle = (targetClient: Client, savedVehicle: ClientVehicle) => {
    const normPlate = sanitizePlate(savedVehicle.plate);
    const existingVehicles = targetClient.vehicles ? [...targetClient.vehicles] : [];
    const idx = existingVehicles.findIndex(v => sanitizePlate(v.plate) === normPlate);
    if (idx >= 0) {
      existingVehicles[idx] = {
        ...existingVehicles[idx],
        ...savedVehicle,
        plate: normPlate,
      };
    } else {
      existingVehicles.push({
        ...savedVehicle,
        plate: normPlate,
      });
    }
    const currentPlates = targetClient.plates ? [...targetClient.plates] : [];
    if (!currentPlates.map(p => sanitizePlate(p)).includes(normPlate)) {
      currentPlates.push(normPlate);
    }
    const updatedClient: Client = {
      ...targetClient,
      vehicles: existingVehicles,
      plates: currentPlates,
    };
    if (onUpdateClient) onUpdateClient(updatedClient);
    try {
      const allStored = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      saveStoredClients(allStored);
    } catch (e) {
      console.error('Error guardando vehículo:', e);
    }
    window.dispatchEvent(new CustomEvent('gestarian_clients_updated'));
    playGentleChime();
  };

  const handleDirectDeleteVehicle = (targetClient: Client, plateToDelete: string) => {
    const normPlate = sanitizePlate(plateToDelete);
    const existingVehicles = targetClient.vehicles 
      ? targetClient.vehicles.filter(v => sanitizePlate(v.plate) !== normPlate)
      : [];
    const currentPlates = targetClient.plates 
      ? targetClient.plates.filter(p => sanitizePlate(p) !== normPlate)
      : [];
    const updatedClient: Client = {
      ...targetClient,
      vehicles: existingVehicles,
      plates: currentPlates,
    };
    if (onUpdateClient) onUpdateClient(updatedClient);
    try {
      const allStored = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      saveStoredClients(allStored);
    } catch (e) {
      console.error('Error eliminando vehículo:', e);
    }
    window.dispatchEvent(new CustomEvent('gestarian_clients_updated'));
    playGentleChime();
  };

  const handleSaveVehicleImages = (targetClient: Client, plate: string, newImages: string[]) => {
    const normPlate = sanitizePlate(plate);
    const existingVehicles = targetClient.vehicles ? [...targetClient.vehicles] : [];
    const idx = existingVehicles.findIndex(v => sanitizePlate(v.plate) === normPlate);
    if (idx >= 0) {
      existingVehicles[idx] = {
        ...existingVehicles[idx],
        images: newImages,
      };
    } else {
      existingVehicles.push({
        plate: normPlate,
        images: newImages,
      });
    }
    const updatedClient: Client = {
      ...targetClient,
      vehicles: existingVehicles,
    };
    if (onUpdateClient) onUpdateClient(updatedClient);
    try {
      const allStored = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      saveStoredClients(allStored);
    } catch (e) {
      console.error('Error guardando imágenes del vehículo:', e);
    }
    window.dispatchEvent(new CustomEvent('gestarian_clients_updated'));
    playGentleChime();
  };

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

  const [viewingClientFicha, setViewingClientFicha] = useState<Client | null>(null);
  const [fichaHasChanges, setFichaHasChanges] = useState<boolean>(false);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('gestarian_ficha_view_changed', { detail: { isOpen: Boolean(viewingClientFicha) } }));
    if (!viewingClientFicha) {
      setFichaHasChanges(false);
    }
  }, [viewingClientFicha]);

  const handleShowAllClients = () => {
    setViewingClientFicha(null);
    setExpandedClientId(null);
    (window as any).__gestarian_selected_client = null;
    (window as any).__gestarian_selected_client_id = null;
    setSearch('');
    setIsSearchOpen(false);
    setActiveTab('clientes');
  };

  const handleViewClientFicha = (client: Client) => {
    setViewingClientFicha(client);
    setExpandedClientId(client.id);
    (window as any).__gestarian_selected_client = client;
    (window as any).__gestarian_selected_client_id = client.id;
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClientId((prev) => {
      const next = prev === clientId ? null : clientId;
      const target = next ? clients.find(c => c.id === next) || null : null;
      (window as any).__gestarian_selected_client = target;
      (window as any).__gestarian_selected_client_id = next;
      return next;
    });
  };

  React.useEffect(() => {
    (window as any).__gestarian_handle_clientes_back = () => {
      if (viewingClientFicha) {
        setViewingClientFicha(null);
        return true;
      }
      if (expandedClientId) {
        setExpandedClientId(null);
        (window as any).__gestarian_selected_client = null;
        (window as any).__gestarian_selected_client_id = null;
        return true;
      }
      if (search) {
        setSearch('');
        setIsSearchOpen(false);
        return true;
      }
      return false;
    };
    return () => {
      delete (window as any).__gestarian_handle_clientes_back;
    };
  }, [viewingClientFicha, expandedClientId, search]);

  React.useEffect(() => {
    const handleShowAll = () => handleShowAllClients();
    const handleEditFromFooter = () => {
      const target = viewingClientFicha || (expandedClientId ? clients.find(c => c.id === expandedClientId) : null) || (clients.length > 0 ? clients[0] : null);
      if (target && onEditClient) {
        onEditClient(target);
      }
    };
    window.addEventListener('gestarian_show_all_clients', handleShowAll);
    window.addEventListener('gestarian_edit_client', handleEditFromFooter);
    return () => {
      window.removeEventListener('gestarian_show_all_clients', handleShowAll);
      window.removeEventListener('gestarian_edit_client', handleEditFromFooter);
    };
  }, [viewingClientFicha, expandedClientId, clients, onEditClient]);

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
    <div id={id} className="w-screen h-[100dvh] max-h-[100dvh] shrink-0 snap-start flex flex-col bg-white overflow-y-auto">
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
        {isQuick ? (
          /* En versión Quick: Sin tarjeta contenedora, únicamente los 3 botones flotantes centrados en una sola línea sin dibujitos */
          <div className="w-full flex items-center justify-center pt-2 pb-1">
            <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 flex-nowrap max-w-full overflow-x-auto p-1.5 bg-slate-100/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={handleShowAllClients}
                className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'clientes' && !viewingClientFicha
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                Clientes ({clients.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewingClientFicha(null);
                  setActiveTab('facturas');
                }}
                className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'facturas'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                Facturas Emitidas ({issuedInvoices.length})
              </button>

              {isVehicleMaintenanceAlertsActive && (
                <button
                  type="button"
                  onClick={() => {
                    setViewingClientFicha(null);
                    setActiveTab('mantenimientos');
                  }}
                  className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'mantenimientos'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/70'
                  }`}
                >
                  <span>Avisos Mantenimiento ({itvAlerts.length})</span>
                  {pendingItvAlertsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Barra superior estándar con selector de pestaña y buscador */
          <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            {/* Pestañas sin dibujitos para optimizar espacio */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 flex-nowrap overflow-x-auto">
              <button
                type="button"
                onClick={handleShowAllClients}
                className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'clientes' && !viewingClientFicha
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Clientes ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('facturas')}
                className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'facturas'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                Facturas Emitidas ({issuedInvoices.length})
              </button>
              {isVehicleMaintenanceAlertsActive && (
                <button
                  type="button"
                  onClick={() => setActiveTab('mantenimientos')}
                  className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'mantenimientos'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/60'
                  }`}
                >
                  <span>Avisos Mantenimiento ({itvAlerts.length})</span>
                  {pendingItvAlertsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              )}
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
        )}

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
                    userTier={currentUser?.currentTier || currentPlan || (isQuick ? 'quick' : undefined)}
                  />
                ))}
              </div>
            );
          })()
        ) : activeTab === 'mantenimientos' ? (
          (() => {
            const filteredAlerts = itvAlerts.filter((a) => {
              if (mantenimientoFilter === 'urgent') return a.urgency === 'overdue' || a.urgency === 'imminent';
              if (mantenimientoFilter === 'pending') return !a.existingBudget;
              if (mantenimientoFilter === 'accepted') return a.isBudgetAccepted;
              return true;
            }).filter((a) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase().trim();
              return (
                a.client.name.toLowerCase().includes(q) ||
                a.plate.toLowerCase().includes(q) ||
                a.vehicleLabel.toLowerCase().includes(q)
              );
            });

            return (
              <div className="space-y-6">
                {/* Cabecera explicativa con KPIs */}
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-300 rounded-2xl shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                          Sector Automoción · Taller de Chapa, Pintura y Mecánica
                        </span>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900">
                          Avisos Automáticos de ITV & Mantenimientos Preventivos
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold">
                        {itvAlerts.length} vehículos en seguimiento
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Detección proactiva de vencimientos de inspección técnica reglamentaria y mantenimientos preventivos. Genera con 1 solo clic presupuestos de revisión pre-ITV y citas previas vinculadas para que el cliente las acepte desde su portal y solo tenga que traer el vehículo en la fecha acordada.
                  </p>

                  {/* Filtros rápidos */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={() => setMantenimientoFilter('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        mantenimientoFilter === 'all'
                          ? 'bg-[#0F2942] text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Todos ({itvAlerts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMantenimientoFilter('urgent')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        mantenimientoFilter === 'urgent'
                          ? 'bg-red-700 text-white'
                          : 'bg-white text-red-800 border border-red-300 hover:bg-red-50'
                      }`}
                    >
                      ⚠️ Urgentes o Vencidos ({itvAlerts.filter(a => a.urgency === 'overdue' || a.urgency === 'imminent').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMantenimientoFilter('pending')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        mantenimientoFilter === 'pending'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      ⚡ Sin Presupuesto Enviado ({itvAlerts.filter(a => !a.existingBudget).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMantenimientoFilter('accepted')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        mantenimientoFilter === 'accepted'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      ✅ Citas Confirmadas por Cliente ({itvAlerts.filter(a => a.isBudgetAccepted).length})
                    </button>
                  </div>
                </div>

                {/* Grid de tarjetas de vehículos */}
                {filteredAlerts.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs font-medium">
                    No hay vehículos que cumplan el filtro seleccionado.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {filteredAlerts.map((alert) => (
                      <div
                        key={`itv_card_${alert.plate}`}
                        className={`p-5 rounded-2xl border-2 shadow-xs hover:shadow-md transition-all space-y-4 bg-white ${
                          alert.isBudgetAccepted
                            ? 'border-emerald-400 bg-emerald-50/20'
                            : alert.existingBudget
                            ? 'border-blue-300'
                            : alert.urgency === 'overdue' || alert.urgency === 'imminent'
                            ? 'border-red-300'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Cabecera Tarjeta: Matrícula y Alerta ITV */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm px-2.5 py-1 bg-slate-900 text-white rounded-md tracking-wider">
                                🇪🇸 {alert.plate}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${alert.urgencyColor}`}>
                                {alert.urgencyLabel}
                              </span>
                            </div>
                            <strong className="text-sm font-bold text-slate-900 block mt-1.5">
                              {alert.vehicleLabel}
                            </strong>
                            <span className="text-[11px] text-slate-500 block">
                              Vencimiento ITV: <strong>{formatDateDmy(alert.itvDate)}</strong>
                              {alert.vehicle.mileage ? ` · ${alert.vehicle.mileage.toLocaleString('es-ES')} km` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Datos de contacto del cliente */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Titular / Cliente
                          </span>
                          <strong className="text-slate-900 block">{alert.client.name}</strong>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-600 font-mono text-[11px]">
                              {alert.client.phone || alert.client.email || 'Sin teléfono'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleWhatsApp(alert.client, e)}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded cursor-pointer"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handlePhoneCall(alert.client, e)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                                title="Llamar"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleEmail(alert.client, e)}
                                className="p-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                                title="Enviar Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Estado del Presupuesto y Cita Pre-ITV */}
                        <div className="pt-1 space-y-2.5">
                          {alert.existingBudget ? (
                            <div className="space-y-2">
                              {alert.isBudgetAccepted ? (
                                <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-950 rounded-xl space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>CITA CONFIRMADA POR EL CLIENTE</span>
                                  </div>
                                  <span className="text-[11px] text-emerald-800 block">
                                    📅 Cita en taller: <strong>{alert.proposedAppointmentDate} a las {alert.proposedAppointmentTime} h</strong>
                                  </span>
                                </div>
                              ) : (
                                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                                    <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                                    <span>PRESUPUESTO ENVIADO AL PORTAL</span>
                                  </div>
                                  <span className="text-[11px] text-blue-800 block">
                                    Cita propuesta: <strong>{alert.proposedAppointmentDate} a las {alert.proposedAppointmentTime} h</strong> (Pendiente de confirmación)
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => onViewDoc && onViewDoc(alert.existingBudget!)}
                                className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-800" />
                                <span>Ver Presupuesto Pre-ITV ({alert.existingBudget.number} · {alert.existingBudget.total.toFixed(2)} €)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className="text-[11px] text-slate-500 block leading-tight">
                                Sin propuesta enviada aún. Genera el presupuesto pre-ITV (90 € + IVA = 108,90 €) y la cita previa vinculada con 1 clic:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCreatePreItv(alert)}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>⚡ Generar Presupuesto Pre-ITV y Cita</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : viewingClientFicha ? (
          /* FICHA COMPLETA DEL CLIENTE CON TODOS LOS DATOS */
          (() => {
            const client = viewingClientFicha;
            const clientVehicles = getClientVehiclesList(client, documents);
            const clientDocs = documents.filter((d) => d.clientId === client.id);
            const clientInvoices = clientDocs.filter((d) => d.type === 'factura' || d.type === 'factura_rectificativa');
            const totalInvoiced = clientInvoices.reduce((sum, d) => sum + (d.total || 0), 0);
            const totalPaid = clientInvoices.reduce((sum, d) => {
              const paid = (d.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
              return sum + (d.status === 'pagada' || d.status === 'PAGADO' ? (d.total || 0) : paid);
            }, 0);
            const pendingAmount = Math.max(0, totalInvoiced - totalPaid);

            return (
              <div className="w-full bg-white rounded-3xl border-2 border-sky-400 shadow-2xl p-6 sm:p-10 flex flex-col gap-8 animate-in fade-in duration-200">
                {/* Cabecera de la Ficha: Arriba únicamente el nombre del cliente */}
                <div className="pb-6 border-b-2 border-slate-200 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F2942] uppercase tracking-tight">
                    {client.name}
                  </h2>
                </div>

                {/* Grid de 2 columnas con los bloques de datos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bloque 1: Identificación y Contacto */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6">
                    <h3 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-[#0F2942] flex items-center gap-2.5 border-b border-slate-200 pb-3">
                      <Users className="w-6 h-6 text-sky-600" />
                      <span>Datos Identificativos & Contacto</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">NIF / CIF / DNI</span>
                        <strong className="text-slate-900 font-mono text-xl sm:text-2xl font-black block mt-1">{client.cif || 'No especificado'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">Régimen</span>
                        <strong className="text-slate-900 capitalize text-xl sm:text-2xl font-black block mt-1">{client.isAutonomo ? 'Autónomo' : (client.clientType || 'Particular')}</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">Teléfono Principal</span>
                          <strong className="text-slate-900 font-mono text-xl sm:text-2xl font-black block mt-1">{client.phone || 'Sin teléfono'}</strong>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleWhatsApp(client, e)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handlePhoneCall(client, e)}
                              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-xs"
                              title="Llamar"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">Correo Electrónico</span>
                          <span className="text-slate-900 font-bold text-base sm:text-xl break-all block mt-1">{client.email || 'Sin correo registrado'}</span>
                        </div>
                        {client.email && (
                          <button
                            type="button"
                            onClick={(e) => handleEmail(client, e)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                          >
                            <Mail className="w-5 h-5" />
                            <span>Email</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Domicilio y Localización */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6">
                    <h3 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-[#0F2942] flex items-center gap-2.5 border-b border-slate-200 pb-3">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                      <span>Domicilio Fiscal & Localización</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">Dirección Fiscal / Domicilio</span>
                        <p className="text-slate-900 font-bold text-lg sm:text-xl leading-relaxed mt-1">
                          {client.address || client.fiscalAddress || 'Sin dirección fiscal registrada'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200">
                        <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">Ubicación de Trabajos / Intervención</span>
                        <div className="flex items-center justify-between gap-3 mt-1 flex-wrap">
                          <p className="text-slate-900 font-bold text-lg sm:text-xl leading-relaxed">
                            {client.taskLocation || client.address || 'Misma que dirección fiscal'}
                          </p>
                          {isLocationActive && (
                            <button
                              type="button"
                              onClick={() => setLocationManagerClient(client)}
                              className="px-4 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-sm sm:text-base font-black uppercase shrink-0 cursor-pointer"
                            >
                              Modificar
                            </button>
                          )}
                        </div>
                      </div>

                      {client.notes && (
                        <div className="pt-3 border-t border-slate-200">
                          <span className="text-slate-500 font-bold uppercase block text-xs sm:text-sm tracking-wider">Observaciones & Notas</span>
                          <p className="text-slate-700 italic text-base sm:text-xl mt-1 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Flota de Vehículos / Matrículas */}
                {showVehiclePlate && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
                      <h3 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-[#0F2942] flex items-center gap-2.5">
                        <Car className="w-6 h-6 text-blue-600" />
                        <span>Vehículos Registrados ({clientVehicles.length})</span>
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleOpenAddVehicle(client, e)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm sm:text-base font-black uppercase flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Añadir Vehículo</span>
                      </button>
                    </div>

                    {clientVehicles.length === 0 ? (
                      <p className="text-base sm:text-lg text-slate-400 italic">No hay vehículos registrados para este cliente.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {clientVehicles.map((v) => (
                          <div key={v.plate} className="bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                              {/* Dibujo matrícula europea con texto ampliado */}
                              <div className="flex items-center bg-white border-2 border-gray-600 rounded-lg overflow-hidden h-10 sm:h-12 min-w-[140px] sm:min-w-[160px] shadow-2xs">
                                <div className="bg-blue-700 h-full w-7 sm:w-8 flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[7px] sm:text-[9px] text-yellow-300 font-bold mb-0.5">⭐</span>
                                  <span className="text-[11px] sm:text-[13px] text-white font-black leading-none">E</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center px-3 font-mono font-black text-xl sm:text-2xl tracking-wider text-[#0F172A]">
                                  {v.plate}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleOpenEditVehicle(client, v, e)}
                                className="p-2 text-slate-400 hover:text-blue-700 cursor-pointer rounded-lg hover:bg-slate-100"
                                title="Editar Vehículo"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-1">
                              <strong className="text-slate-900 block uppercase text-base sm:text-xl font-black">{v.brand} {v.model}</strong>
                              {v.color && <span className="text-slate-600 text-sm sm:text-base font-semibold block">Color: {v.color}</span>}
                              {v.vin && <span className="text-slate-500 font-mono text-xs sm:text-sm block">VIN: {v.vin}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bloque 4: Historial Económico & Facturación */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
                    <h3 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-[#0F2942] flex items-center gap-2.5">
                      <Receipt className="w-6 h-6 text-emerald-600" />
                      <span>Resumen Contable & Facturación</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-lg font-mono font-black">
                      <span className="text-slate-600">Total: {totalInvoiced.toFixed(2)} €</span>
                      <span className="text-emerald-700">Cobrado: {totalPaid.toFixed(2)} €</span>
                      {pendingAmount > 0.01 && (
                        <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-300">
                          Pendiente: {pendingAmount.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>

                  {clientInvoices.length === 0 ? (
                    <p className="text-base sm:text-lg text-slate-400 italic">No hay facturas emitidas a este cliente todavía.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {clientInvoices.map((inv) => (
                        <div key={inv.id} className="py-3.5 flex items-center justify-between gap-3 text-base sm:text-lg">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono font-black text-slate-900 text-lg sm:text-2xl">{inv.number}</span>
                            <span className="text-slate-500 font-mono text-base sm:text-lg">{inv.date}</span>
                            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-black uppercase ${
                              inv.status === 'pagada' || inv.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <strong className="font-mono text-xl sm:text-3xl font-black text-slate-900">{inv.total.toFixed(2)} €</strong>
                            {onViewDoc && (
                              <button
                                type="button"
                                onClick={() => onViewDoc(inv)}
                                className="p-2 text-sky-600 hover:text-sky-800 cursor-pointer rounded-lg hover:bg-sky-50"
                                title="Ver documento"
                              >
                                <Eye className="w-6 h-6" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer de la Ficha: Iconos flotantes limpios (Editar, Guardar si hay cambios, X Salir) y Botón Cerrar Ficha */}
                <div className="pt-6 border-t-2 border-slate-200 flex flex-col items-center justify-center gap-6">
                  {/* Iconos flotantes inferiores */}
                  <div className="flex items-center justify-center gap-10 sm:gap-14">
                    {/* Icono 1: Editar */}
                    <button
                      type="button"
                      onClick={() => onEditClient(client)}
                      className="p-2 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-[#0F2942]"
                      title="Editar Cliente"
                    >
                      <UserPen className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.2} />
                    </button>

                    {/* Icono 2: Guardar (Solo aparece si se ha producido algún cambio) */}
                    {fichaHasChanges && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateClient) onUpdateClient(client);
                          setFichaHasChanges(false);
                        }}
                        className="p-2 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-emerald-600 animate-in zoom-in-90 duration-200"
                        title="Guardar Cambios"
                      >
                        <Save className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.2} />
                      </button>
                    )}

                    {/* Icono 3: Salir X */}
                    <button
                      type="button"
                      onClick={() => setViewingClientFicha(null)}
                      className="p-2 cursor-pointer transition-transform hover:scale-125 active:scale-95 text-slate-700 hover:text-rose-600"
                      title="Cerrar Ficha / Salir"
                    >
                      <X className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.2} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingClientFicha(null)}
                    className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-base sm:text-lg font-black uppercase transition-colors cursor-pointer"
                  >
                    Cerrar Ficha
                  </button>
                </div>
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
              const hasMultipleVehicles = clientVehicles.length > 1;
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
                    {/* Línea 1: Nombre arriba en línea 1 y número de cliente con icono de nuevo presupuesto */}
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

                    {/* Línea 2: Matrícula (solo sector automoción) o Localización según configuración */}
                    {showVehiclePlate ? (
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
                    ) : isLocationActive ? (
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

                  {/* Sección expandida al pulsar: En Quick en una sola línea a tamaño x 0.8 */}
                  {isExpanded && (
                    <div
                      className="bg-[#FAF9F6] border-t border-[#E2E0D8] p-3 sm:p-4 animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isQuick ? (
                        /* EN QUICK: Todos los iconos en una sola línea a tamaño x 0.8 */
                        <div className="flex items-center justify-around gap-1 sm:gap-2 w-full overflow-x-auto py-1">
                          {/* 1. Icono de Vehículo (Si el cliente tiene más de un vehículo en sector automoción) */}
                          {showVehiclePlate && hasMultipleVehicles && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenVehiclesClientId((prev) => (prev === client.id ? null : client.id));
                              }}
                              className={`p-1 sm:p-1.5 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0 relative ${
                                openVehiclesClientId === client.id ? 'text-blue-600 scale-110' : ''
                              }`}
                              title={`Mostrar los ${clientVehicles.length} vehículos del cliente`}
                              aria-label="Mostrar vehículos del cliente"
                            >
                              <Car className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.8} />
                              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                                {clientVehicles.length}
                              </span>
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
                              className="p-1 sm:p-1.5 text-[#0F2942] hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                              title="Localización de la Tarea / Dirección del Cliente"
                              aria-label="Localización de la Tarea"
                            >
                              <Home className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.8} />
                            </button>
                          )}

                          {/* 2. Ver Ficha Completa del Cliente (Ojito) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewClientFicha(client);
                            }}
                            className="p-1 sm:p-1.5 text-[#0F2942] hover:text-sky-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                            title={`Ver ficha completa de ${client.name}`}
                            aria-label="Ver ficha del cliente"
                          >
                            <Eye className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.8} />
                          </button>

                          {/* 3. Ver Facturas */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('facturas');
                              setSearch(client.name);
                            }}
                            className="p-1 sm:p-1.5 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                            title={`Ver facturas emitidas de ${client.name}`}
                            aria-label="Ver facturas emitidas"
                          >
                            <SheetFIcon className="w-9 h-9 sm:w-10 sm:h-10" />
                          </button>

                          {/* 4. WhatsApp */}
                          <button
                            type="button"
                            onClick={(e) => handleWhatsApp(client, e)}
                            className={`p-1 sm:p-1.5 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0 ${
                              !client.phone ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={client.phone ? `WhatsApp: ${client.phone}` : 'Sin teléfono registrado'}
                            aria-label="WhatsApp"
                            disabled={!client.phone}
                          >
                            <MessageCircle className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.8} />
                          </button>

                          {/* 5. Teléfono */}
                          <button
                            type="button"
                            onClick={(e) => handlePhoneCall(client, e)}
                            className={`p-1 sm:p-1.5 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0 ${
                              !client.phone ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={client.phone ? `Llamar a ${client.phone}` : 'Sin teléfono registrado'}
                            aria-label="Llamada telefónica"
                            disabled={!client.phone}
                          >
                            <Phone className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.8} />
                          </button>

                          {/* 6. Email */}
                          <button
                            type="button"
                            onClick={(e) => handleEmail(client, e)}
                            className={`p-1 sm:p-1.5 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center shrink-0 ${
                              !client.email ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={client.email ? `Email: ${client.email}` : 'Sin correo registrado'}
                            aria-label="Enviar correo"
                            disabled={!client.email}
                          >
                            <Mail className="w-9 h-9 sm:w-10 sm:h-10" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {/* Fila 1: Vehículo / Casita (según activación en Configuración), Editar Cliente, Nuevo Presupuesto, Ver Presupuestos, Ver Expedientes */}
                          <div className="flex flex-wrap justify-around items-center gap-3">
                            {/* 1. Icono de Vehículo (Si el cliente tiene más de un vehículo en sector automoción) */}
                            {showVehiclePlate && hasMultipleVehicles && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenVehiclesClientId((prev) => (prev === client.id ? null : client.id));
                                }}
                                className={`p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative ${
                                  openVehiclesClientId === client.id ? 'text-blue-600 scale-110' : ''
                                }`}
                                title={`Mostrar los ${clientVehicles.length} vehículos del cliente`}
                                aria-label="Mostrar vehículos del cliente"
                              >
                                <Car className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                                  {clientVehicles.length}
                                </span>
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

                            {/* 2. Ver Ficha Completa del Cliente (Ojito) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClientFicha(client);
                              }}
                              className="p-2 text-[#0F2942] hover:text-sky-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                              title={`Ver ficha completa de ${client.name}`}
                              aria-label="Ver ficha del cliente"
                            >
                              <Eye className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                            </button>

                            {/* 2B. Nuevo Presupuesto (Ocultar en Quick) */}
                            {currentUser?.currentTier !== 'quick' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNewBudgetForClient(client);
                                }}
                                className="p-2 text-[#0F2942] hover:text-sky-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                                title={`Crear nuevo presupuesto para ${client.name}`}
                                aria-label="Nuevo presupuesto"
                              >
                                <SheetPlusPIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                              </button>
                            )}

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

                      {/* Desplegable de tarjetas de los vehículos del cliente si está abierto */}
                      {openVehiclesClientId === client.id && (
                        <div className="mt-4 pt-3.5 border-t border-[#E2E0D8] flex flex-col gap-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Car className="w-5 h-5 text-[#0F2942]" />
                              <span className="font-black text-xs uppercase tracking-wider text-[#0F2942]">
                                Vehículos del Cliente ({clientVehicles.length})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddVehicle(client, e);
                              }}
                              className="px-3 py-1 bg-[#0F2942] hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Añadir nuevo vehículo"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Nuevo Vehículo</span>
                            </button>
                          </div>

                          {/* Grid de tarjetas de vehículos */}
                          <div className="grid grid-cols-1 gap-2.5">
                            {clientVehicles.map((veh) => (
                              <ClientVehicleCard
                                key={veh.plate}
                                client={client}
                                vehicle={veh}
                                onNewVehicle={(c) => handleOpenAddVehicle(c)}
                                onEditVehicle={(c, v) => handleOpenEditVehicle(c, v)}
                                onDeleteVehicle={(c, plate) => handleDirectDeleteVehicle(c, plate)}
                                onOpenImages={(c, v) => setVehicleForImages({ client: c, vehicle: v })}
                                onSaveVehicle={(c, updated) => handleDirectSaveVehicle(c, updated)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
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
                  <ClientVehicleCard
                    key={veh.plate}
                    client={vehicleManagerClient}
                    vehicle={veh}
                    onNewVehicle={(c) => {
                      setVehicleManagerClient(null);
                      handleOpenAddVehicle(c);
                    }}
                    onEditVehicle={(c, v) => handleOpenEditVehicle(c, v)}
                    onDeleteVehicle={(c, plate) => handleDirectDeleteVehicle(c, plate)}
                    onOpenImages={(c, v) => setVehicleForImages({ client: c, vehicle: v })}
                    onSaveVehicle={(c, updated) => handleDirectSaveVehicle(c, updated)}
                  />
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

      {/* Modal para ver y gestionar imágenes del vehículo */}
      {vehicleForImages && (
        <VehicleImagesViewerModal
          isOpen={Boolean(vehicleForImages)}
          onClose={() => setVehicleForImages(null)}
          client={vehicleForImages.client}
          vehicle={vehicleForImages.vehicle}
          onSaveImages={(c, plate, imgs) => {
            handleSaveVehicleImages(c, plate, imgs);
            setVehicleForImages((prev) =>
              prev ? { ...prev, vehicle: { ...prev.vehicle, images: imgs } } : null
            );
          }}
        />
      )}
    </div>
  );
};
