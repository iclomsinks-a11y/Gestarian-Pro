import React, { useState, useEffect, useCallback } from 'react';
import { Client, ClientVehicle } from '../types';
import { 
  X, Save, FileText, Building2, User, Phone, Mail, MapPin, 
  Car, Plus, Trash2, Pencil, Sparkles, Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { VehicleFormModal } from './VehicleFormModal';
import { VehicleOcrDataModal } from './VehicleOcrDataModal';

interface FullScreenClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'>) => void;
  onSaveAndCreateBudget?: (client: Omit<Client, 'id'>) => void;
  initialClient?: Client | null;
  onUpdateClient?: (client: Client) => void;
}

export const FullScreenClientForm: React.FC<FullScreenClientFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveAndCreateBudget,
  initialClient = null,
  onUpdateClient,
}) => {
  const [name, setName] = useState('');
  const [cif, setCif] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isAutonomo, setIsAutonomo] = useState(false);
  const [notes, setNotes] = useState('');
  const [plates, setPlates] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<ClientVehicle[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<ClientVehicle | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [selectedOcrVehicle, setSelectedOcrVehicle] = useState<ClientVehicle | null>(null);
  const [newPlateInput, setNewPlateInput] = useState('');
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setCif('');
    setAddress('');
    setPhone('');
    setEmail('');
    setIsAutonomo(false);
    setPlates([]);
    setVehicles([]);
    setNewPlateInput('');
    setNotes('');
    setError('');
    setIsVehicleModalOpen(false);
    setEditingVehicle(null);
    setIsOcrModalOpen(false);
    setSelectedOcrVehicle(null);
  }, []);

  // Sincronizar datos si se pasa un cliente para edición
  useEffect(() => {
    if (initialClient) {
      setName(initialClient.name || '');
      setCif(initialClient.cif || '');
      setAddress(initialClient.address || '');
      setPhone(initialClient.phone || '');
      setEmail(initialClient.email || '');
      setIsAutonomo(!!initialClient.isAutonomo);
      setNotes(initialClient.notes || '');
      const initVehs = initialClient.vehicles && initialClient.vehicles.length > 0
        ? [...initialClient.vehicles]
        : (initialClient.plates ? initialClient.plates.map(p => ({ plate: p })) : []);
      setVehicles(initVehs);
      setPlates(initVehs.map(v => v.plate));
    } else {
      resetForm();
    }
  }, [initialClient, isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetForm();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    if (!name.trim()) return 'El Nombre/Razón Social es obligatorio.';
    if (!cif.trim()) return 'El NIF/CIF es obligatorio.';
    if (!address.trim()) return 'La Dirección es obligatoria.';
    if (!phone.trim()) return 'El Teléfono es obligatorio.';
    if (!email.trim()) return 'El Email es obligatorio.';
    return '';
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: ClientVehicle) => {
    setEditingVehicle(veh);
    setIsVehicleModalOpen(true);
  };

  const handleOpenOcrModal = (veh: ClientVehicle) => {
    setSelectedOcrVehicle(veh);
    setIsOcrModalOpen(true);
  };

  const handleSaveVehicleModal = (savedVehicle: ClientVehicle) => {
    const normPlate = savedVehicle.plate.trim().toUpperCase();
    const updated = [...vehicles];
    const idx = updated.findIndex((v) => v.plate.trim().toUpperCase() === normPlate);
    if (idx >= 0) {
      updated[idx] = savedVehicle;
    } else {
      updated.push(savedVehicle);
    }
    setVehicles(updated);
    setPlates(updated.map((v) => v.plate));
    setIsVehicleModalOpen(false);
    setEditingVehicle(null);
  };

  const handleRemoveVehicle = (plateToRemove: string) => {
    const updated = vehicles.filter((v) => v.plate.trim().toUpperCase() !== plateToRemove.trim().toUpperCase());
    setVehicles(updated);
    setPlates(updated.map((v) => v.plate));
  };

  const handleAddPlate = () => {
    const formatted = newPlateInput.trim().toUpperCase();
    if (!formatted) return;
    if (vehicles.some(v => v.plate.trim().toUpperCase() === formatted)) {
      setError(`La matrícula ${formatted} ya está registrada en este cliente.`);
      return;
    }
    const newVeh: ClientVehicle = { plate: formatted };
    const updated = [...vehicles, newVeh];
    setVehicles(updated);
    setPlates(updated.map(v => v.plate));
    setNewPlateInput('');
    setError('');
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');

    // Si había texto sin pulsar añadir vehículo, incluirlo también
    let finalVehicles = [...vehicles];
    if (newPlateInput.trim()) {
      const pendingPlate = newPlateInput.trim().toUpperCase();
      if (!finalVehicles.some(v => v.plate.trim().toUpperCase() === pendingPlate)) {
        finalVehicles.push({ plate: pendingPlate });
      }
    }
    const finalPlates = finalVehicles.map(v => v.plate);

    if (initialClient && onUpdateClient) {
      onUpdateClient({
        ...initialClient,
        name: name.trim(),
        cif: cif.trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        isAutonomo,
        vehicles: finalVehicles.length > 0 ? finalVehicles : undefined,
        plates: finalPlates.length > 0 ? finalPlates : undefined,
        notes: notes.trim(),
      });
    } else {
      onSave({
        name: name.trim(),
        cif: cif.trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        isAutonomo,
        vehicles: finalVehicles.length > 0 ? finalVehicles : undefined,
        plates: finalPlates.length > 0 ? finalPlates : undefined,
        notes: notes.trim(),
      });
    }

    resetForm();
  };

  const handleSaveAndBudget = () => {
    if (!onSaveAndCreateBudget) {
      handleSave();
      return;
    }

    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');

    let finalVehicles = [...vehicles];
    if (newPlateInput.trim()) {
      const pendingPlate = newPlateInput.trim().toUpperCase();
      if (!finalVehicles.some(v => v.plate.trim().toUpperCase() === pendingPlate)) {
        finalVehicles.push({ plate: pendingPlate });
      }
    }
    const finalPlates = finalVehicles.map(v => v.plate);

    if (initialClient && onUpdateClient) {
      onUpdateClient({
        ...initialClient,
        name: name.trim(),
        cif: cif.trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        isAutonomo,
        vehicles: finalVehicles.length > 0 ? finalVehicles : undefined,
        plates: finalPlates.length > 0 ? finalPlates : undefined,
        notes: notes.trim(),
      });
    } else {
      onSaveAndCreateBudget({
        name: name.trim(),
        cif: cif.trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        isAutonomo,
        vehicles: finalVehicles.length > 0 ? finalVehicles : undefined,
        plates: finalPlates.length > 0 ? finalPlates : undefined,
        notes: notes.trim(),
      });
    }

    resetForm();
  };

  const isEditing = !!initialClient;

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-y-auto p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          resetForm();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl min-h-screen sm:min-h-[auto] bg-white sm:rounded-md sm:shadow-2xl sm:border border-[#E2E0D8] flex flex-col my-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E0D8] bg-[#F8F7F3] sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
                <User className="w-5 h-5 text-[#1E3A8A]" />
                {isEditing ? `Editar Cliente: ${initialClient.name}` : 'Alta de Nuevo Cliente'}
              </h2>
              {isEditing && (
                <span className="font-mono font-black text-xs px-2.5 py-1 bg-[#0F2942] text-white rounded shadow-xs">
                  ID #{initialClient.clientNumber ?? 1}
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {isEditing
                ? `Actualiza los datos del cliente (ID #${initialClient.clientNumber ?? 1}) y administra los vehículos vinculados.`
                : 'Introduce los datos obligatorios. Se asignará automáticamente el siguiente número correlativo de ID en la cartera y Supabase.'}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-[#475569] border border-[#CBD5E1] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Cerrar formulario"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] uppercase border-b border-[#E2E0D8] pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#475569]" />
                Datos Fiscales
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase">
                  Nombre / Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#1E3A8A]"
                  placeholder="Ej: Talleres Martínez S.L."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase">
                  NIF / CIF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cif}
                  onChange={(e) => setCif(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 text-sm uppercase bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#1E3A8A]"
                  placeholder="Ej: B12345678 (SL) o 12345678Z (Particular/Autónomo)"
                />
              </div>

              {/* Casilla Autónomo Profesional */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 p-2 bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm cursor-pointer hover:bg-[#E2E8F0]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAutonomo}
                    onChange={(e) => setIsAutonomo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] uppercase">
                      Autónomo Profesional
                    </span>
                    <p className="text-[11px] text-[#64748B] leading-tight">
                      Marcar si es un profesional autónomo (permite envío por WhatsApp y Email).
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#1E3A8A]"
                  placeholder="Calle, Número, Ciudad, CP"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] uppercase border-b border-[#E2E0D8] pb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#475569]" />
                Contacto y Notas
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#1E3A8A]"
                    placeholder="Ej: 600 123 456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#1E3A8A]"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase">
                  Notas Internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-[#F8F7F3] border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#1E3A8A] resize-none h-24"
                  placeholder="Observaciones de pago, horarios preferidos, personas de contacto..."
                />
              </div>
            </div>
          </div>

          {/* Sección de Vehículos del Cliente al final */}
          <div className="pt-4 border-t border-[#E2E0D8]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] uppercase flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#1E3A8A]" />
                  Vehículos del Cliente ({vehicles.length})
                </h3>
                <span className="text-xs font-normal text-[#64748B]">
                  Gestione matrículas, ficha técnica, fotos y OCR de permiso de circulación
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenAddVehicle}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Añadir Vehículo</span>
              </button>
            </div>

            {/* Listado detallado de vehículos */}
            {vehicles.length === 0 ? (
              <div className="p-4 bg-[#F8F7F3] rounded-lg border border-dashed border-[#CBD5E1] text-center mb-4">
                <p className="text-xs text-[#64748B]">
                  No hay vehículos registrados para este cliente. Utilice <strong>+ Añadir Vehículo</strong> para registrar matrícula, marca, modelo, VIN, fotos y OCR.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {vehicles.map((v) => {
                  const hasDetails = Boolean(v.brand || v.model);
                  const hasOcr = Boolean(v.ocrData);
                  const photosCount = (v.images && v.images.length) || 0;
                  return (
                    <div
                      key={v.plate}
                      className="p-3 bg-white border border-[#E2E0D8] rounded-xl shadow-xs flex flex-col justify-between hover:border-[#1E3A8A]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {/* Matrícula española estándar */}
                        <div className="flex items-center bg-white border-2 border-gray-400 rounded overflow-hidden h-7 shadow-2xs">
                          <div className="bg-blue-700 h-full w-4 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[4px] text-yellow-300 font-bold leading-none">⭐</span>
                            <span className="text-[7px] text-white font-bold leading-none">E</span>
                          </div>
                          <div className="px-2 font-mono font-black text-xs tracking-wider text-[#0F172A]">
                            {v.plate}
                          </div>
                        </div>

                        {/* Acciones del vehículo */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVehicle(v)}
                            className="p-1.5 text-gray-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Editar vehículo, fotos o datos"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicle(v.plate)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title={`Eliminar vehículo ${v.plate}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info de marca, modelo y color */}
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-[#0F172A] truncate">
                          {hasDetails ? `${v.brand || ''} ${v.model || ''}`.trim() : 'Sin marca/modelo'}
                          {v.color && <span className="font-normal text-gray-500 ml-1.5">({v.color})</span>}
                        </div>
                        {v.vin && (
                          <div className="text-[11px] font-mono text-gray-500 truncate">
                            VIN: {v.vin}
                          </div>
                        )}
                      </div>

                      {/* Badges de fotos y OCR */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-[11px]">
                        {photosCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                            <ImageIcon className="w-3 h-3" />
                            {photosCount} foto{photosCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Sin fotos</span>
                        )}

                        {hasOcr && (
                          <button
                            type="button"
                            onClick={() => handleOpenOcrModal(v)}
                            className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer"
                            title="Ver ficha técnica y permiso de circulación extraídos por OCR"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Ficha OCR
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Añadir matrícula rápida */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  value={newPlateInput}
                  onChange={(e) => setNewPlateInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlate();
                    }
                  }}
                  placeholder="Añadir matrícula rápida (ej: 1234-BBB)"
                  className="w-full px-3 py-1.5 text-xs uppercase font-mono font-bold tracking-wider bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPlate}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-[#0F172A] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#E2E0D8] bg-[#F1F0EB] flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-xs font-bold text-[#475569] hover:text-[#0F172A] bg-gray-200 hover:bg-gray-300 rounded-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
            <span>Cancelar / Salir</span>
          </button>
          
          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 sm:py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8F7F3] text-[#0F172A] text-xs font-bold uppercase tracking-wider transition-colors rounded-sm shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Guardar Cambios' : 'Guardar Cliente'}
          </button>

          {!isEditing && onSaveAndCreateBudget && (
            <button
              onClick={handleSaveAndBudget}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 sm:py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Guardar y Generar Presupuesto
            </button>
          )}
        </div>
      </div>

      {/* Modal para añadir o editar vehículo con OCR y cámara */}
      {isVehicleModalOpen && (
        <VehicleFormModal
          isOpen={isVehicleModalOpen}
          clientName={name || 'Nuevo Cliente'}
          initialVehicle={editingVehicle || undefined}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setEditingVehicle(null);
          }}
          onSave={handleSaveVehicleModal}
          onDelete={handleRemoveVehicle}
        />
      )}

      {/* Modal para ver datos OCR de permiso y ficha técnica */}
      {isOcrModalOpen && selectedOcrVehicle && (
        <VehicleOcrDataModal
          isOpen={isOcrModalOpen}
          vehicle={selectedOcrVehicle}
          onClose={() => {
            setIsOcrModalOpen(false);
            setSelectedOcrVehicle(null);
          }}
          onEdit={() => {
            setIsOcrModalOpen(false);
            setEditingVehicle(selectedOcrVehicle);
            setIsVehicleModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
