import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Plus, Trash2, CheckCircle2, AlertCircle, FileText, 
  Sparkles, Loader2, Eye, ShieldCheck, Car, RefreshCw
} from 'lucide-react';
import { ClientVehicle, VehicleOcrData } from '../types';
import { scanVehicleDocument } from '../services/vehicleDocScanService';
import { VehicleOcrDataModal } from './VehicleOcrDataModal';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: ClientVehicle) => void;
  onDelete?: (plate: string) => void;
  initialVehicle?: ClientVehicle | null;
  clientName?: string;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialVehicle,
  clientName,
}) => {
  const [plate, setPlate] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [vin, setVin] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [ocrData, setOcrData] = useState<VehicleOcrData | undefined>(undefined);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanType, setScanType] = useState<'permiso_circulacion' | 'ficha_tecnica'>('permiso_circulacion');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);

  const cameraImagesInputRef = useRef<HTMLInputElement>(null);
  const galleryImagesInputRef = useRef<HTMLInputElement>(null);
  const cameraOcrInputRef = useRef<HTMLInputElement>(null);
  const fileOcrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialVehicle) {
        setPlate(initialVehicle.plate || '');
        setBrand(initialVehicle.brand || '');
        setModel(initialVehicle.model || '');
        setColor(initialVehicle.color || '');
        setVin(initialVehicle.vin || '');
        setImages(initialVehicle.images || []);
        setOcrData(initialVehicle.ocrData);
      } else {
        setPlate('');
        setBrand('');
        setModel('');
        setColor('');
        setVin('');
        setImages([]);
        setOcrData(undefined);
      }
      setScanMessage(null);
      setIsScanning(false);
    }
  }, [isOpen, initialVehicle]);

  if (!isOpen) return null;

  // Añadir imágenes normales de vehículo
  const handleAddVehicleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file as File);
      });
    });

    Promise.all(filePromises).then((newImages) => {
      setImages((prev) => [...prev, ...newImages]);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Disparar captura OCR para Permiso de Circulación o Ficha Técnica
  const handleTriggerOcr = (type: 'permiso_circulacion' | 'ficha_tecnica') => {
    setScanType(type);
    if (cameraOcrInputRef.current) {
      cameraOcrInputRef.current.click();
    }
  };

  // Procesar imagen de documento con OCR
  const handleProcessOcrImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    setIsScanning(true);
    setScanMessage(`Leyendo ${scanType === 'permiso_circulacion' ? 'Permiso de Circulación' : 'Ficha Técnica'} mediante OCR con IA...`);

    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      const res = await scanVehicleDocument(base64Image, scanType);

      setIsScanning(false);

      if (res.success && res.data) {
        const extracted = res.data;

        // Auto-rellenar campos si se han extraído
        if (extracted.plate && !plate) setPlate(extracted.plate.toUpperCase().trim());
        if (extracted.brand) setBrand(extracted.brand.toUpperCase().trim());
        if (extracted.model) setModel(extracted.model.trim());
        if (extracted.vin) setVin(extracted.vin.toUpperCase().trim());
        if (extracted.color && !color) setColor(extracted.color.trim());

        // Actualizar datos de OCR
        setOcrData((prev) => {
          const currentOcr = prev || {};
          const currentCirculation = currentOcr.circulationPermitImages || [];
          const currentTechnical = currentOcr.technicalSheetImages || [];

          return {
            ...currentOcr,
            ...extracted,
            plate: extracted.plate || currentOcr.plate || plate,
            brand: extracted.brand || currentOcr.brand || brand,
            model: extracted.model || currentOcr.model || model,
            vin: extracted.vin || currentOcr.vin || vin,
            color: extracted.color || currentOcr.color || color,
            extractedAt: new Date().toISOString(),
            circulationPermitImages:
              scanType === 'permiso_circulacion'
                ? [...currentCirculation, base64Image]
                : currentCirculation,
            technicalSheetImages:
              scanType === 'ficha_tecnica'
                ? [...currentTechnical, base64Image]
                : currentTechnical,
          };
        });

        setScanMessage(
          `¡Documento leído con éxito! Se han extraído y autocompletado los datos del vehículo.`
        );
      } else {
        setScanMessage(
          res.error || 'No se pudo leer el documento. Por favor revise la nitidez o introduzca los datos manualmente.'
        );
      }
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      alert('Por favor introduzca la matrícula del vehículo.');
      return;
    }

    const cleanPlate = plate.trim().toUpperCase();
    const cleanBrand = brand.trim();
    const cleanModel = model.trim();
    const cleanColor = color.trim();
    const cleanVin = vin.trim().toUpperCase();

    onSave({
      plate: cleanPlate,
      brand: cleanBrand,
      model: cleanModel,
      color: cleanColor,
      vin: cleanVin,
      images,
      ocrData: ocrData ? {
        ...ocrData,
        plate: cleanPlate,
        brand: cleanBrand,
        model: cleanModel,
        color: cleanColor,
        vin: cleanVin,
      } : undefined,
    });

    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-[#0F2942] animate-in fade-in zoom-in-95 duration-200">
          {/* Cabecera */}
          <div className="px-6 py-4 bg-[#0F2942] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  {initialVehicle ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo'}
                </span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{plate || 'Nuevo Vehículo'}</span>
                  {clientName && (
                    <span className="text-xs font-normal text-gray-300">
                      • {clientName}
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SECCIÓN OCR: Botones para lectura de documentos con cámara */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2942]">
                    Lectura de Documentos OCR con Cámara
                  </h3>
                </div>
                {ocrData && (
                  <button
                    type="button"
                    onClick={() => setShowOcrModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver todos los datos</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-600 mb-3">
                Fotografíe el <strong>Permiso de Circulación</strong> o la <strong>Ficha Técnica</strong> para autocompletar automáticamente la matrícula, marca, modelo, VIN y especificaciones reglamentarias.
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleTriggerOcr('permiso_circulacion')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Leer Permiso Circulación</span>
                </button>

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleTriggerOcr('ficha_tecnica')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Leer Ficha Técnica</span>
                </button>
              </div>

              {/* Mensaje de escaneo en progreso o resultado */}
              {isScanning && (
                <div className="mt-3 p-3 bg-white/80 border border-blue-300 rounded-xl flex items-center gap-2 text-xs text-blue-800 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span>{scanMessage}</span>
                </div>
              )}

              {!isScanning && scanMessage && (
                <div className="mt-3 p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{scanMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScanMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN CAMPOS DEL VEHÍCULO: Matrícula, Marca, Modelo, Color, VIN */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Datos del Vehículo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Matrícula */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Matrícula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="Ej. 1234-BBB"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold text-[#0F2942] focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. RENAULT, VOLKSWAGEN..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-[#0F2942] focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. Megane E-Tech, Golf VII..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-[#0F2942] focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej. Blanco Puro, Negro Mitos..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-[#0F2942] focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* VIN (Número de Bastidor) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    VIN / Número de Bastidor (17 caracteres)
                  </label>
                  <input
                    type="text"
                    maxLength={17}
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="Ej. WVWZZZAUZHP123987"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold tracking-wider text-[#0F2942] focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN IMÁGENES DEL VEHÍCULO: Botón e Icono de imágenes con cámara */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Imágenes del Vehículo ({images.length})
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Fotografías del vehículo que quedan guardadas automáticamente.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => galleryImagesInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-blue-200"
                    title="Subir fotos desde galería o archivos"
                  >
                    <span>Subir desde Galería</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraImagesInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    title="Añadir fotos con la cámara"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Cámara</span>
                  </button>
                </div>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-4/3 rounded-xl overflow-hidden border border-gray-200 bg-black/5">
                      <img src={img} alt={`Vehículo foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => cameraImagesInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl bg-gray-50/60 hover:bg-blue-50/20 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Pulse aquí para añadir imágenes con la cámara
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Se guardarán automáticamente con el vehículo
                  </span>
                </div>
              )}
            </div>

            {/* Inputs ocultos para captura */}
            <input
              ref={cameraImagesInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleAddVehicleImages}
              className="hidden"
            />
            <input
              ref={galleryImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddVehicleImages}
              className="hidden"
            />
            <input
              ref={cameraOcrInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleProcessOcrImage}
              className="hidden"
            />
          </form>

          {/* Pie de acciones */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
            {ocrData ? (
              <button
                type="button"
                onClick={() => setShowOcrModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Ver todos los datos (Ficha OCR)</span>
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 italic">
                * Matrícula obligatoria
              </span>
            )}

            <div className="flex items-center gap-2.5">
              {initialVehicle && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    const plateToRemove = initialVehicle.plate || plate;
                    if (confirm(`¿Está seguro de eliminar el vehículo ${plateToRemove}?`)) {
                      onDelete(plateToRemove);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer mr-1"
                >
                  Eliminar Vehículo
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Guardar Vehículo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de visualización de todos los datos extraídos por OCR */}
      {showOcrModal && (
        <VehicleOcrDataModal
          isOpen={showOcrModal}
          onClose={() => setShowOcrModal(false)}
          vehicle={{
            plate: plate || 'Sin Matrícula',
            brand,
            model,
            color,
            vin,
            images,
            ocrData,
          }}
          clientName={clientName}
        />
      )}
    </>
  );
};
