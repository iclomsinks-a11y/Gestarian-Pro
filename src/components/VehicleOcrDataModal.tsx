import React, { useState } from 'react';
import { X, FileText, Calendar, Zap, ShieldCheck, Truck, Car, Eye, Download, Printer, CheckCircle2 } from 'lucide-react';
import { ClientVehicle, VehicleOcrData } from '../types';

interface VehicleOcrDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: ClientVehicle;
  clientName?: string;
  onEdit?: () => void; // Opcional: boton editar vehiculo
}

export const VehicleOcrDataModal: React.FC<VehicleOcrDataModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  clientName,
}) => {
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const ocr = vehicle.ocrData || {};
  const circulationImages = ocr.circulationPermitImages || [];
  const technicalImages = ocr.technicalSheetImages || [];
  const allDocImages = [...circulationImages, ...technicalImages];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#0F2942] animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#0F2942] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Ficha Técnica Oficial & OCR DGT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Datos Extraídos
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-sm text-yellow-300 border border-white/20">
                  {vehicle.plate}
                </span>
                <span>{vehicle.brand || ocr.brand} {vehicle.model || ocr.model}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {clientName && (
            <div className="text-xs text-gray-500 flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Titular / Cliente:</span>
              <span>{clientName}</span>
            </div>
          )}

          {/* Bloque 1: Identificación Principal del Vehículo */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              1. Identificación y Homologación (Campos A, D.1, D.2, D.3, E)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Matrícula (A)</span>
                <span className="text-sm font-mono font-bold text-[#0F2942]">
                  {ocr.plate || vehicle.plate || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Marca (D.1)</span>
                <span className="text-sm font-bold text-[#0F2942]">
                  {ocr.brand || vehicle.brand || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Modelo / Comercial (D.3)</span>
                <span className="text-sm font-semibold text-[#0F2942]">
                  {ocr.model || vehicle.model || '—'}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Número de Bastidor / VIN (E)</span>
                <span className="text-sm font-mono font-bold tracking-wider text-[#0F2942]">
                  {ocr.vin || vehicle.vin || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Color</span>
                <span className="text-sm font-medium text-[#0F2942]">
                  {ocr.color || vehicle.color || '—'}
                </span>
              </div>

              {ocr.version && (
                <div className="col-span-2 sm:col-span-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Variante / Versión (D.2)</span>
                  <span className="text-xs font-mono text-gray-700">{ocr.version}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bloque 2: Motorización, Combustible y Emisiones */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              2. Motorización, Propulsión y Emisiones (Campos P.1, P.2, P.3, V.7)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Combustible (P.3)</span>
                <span className="text-xs font-bold text-emerald-700">
                  {ocr.fuelType || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Cilindrada (P.1)</span>
                <span className="text-xs font-bold text-[#0F2942]">
                  {ocr.engineDisplacement || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Potencia Neta (P.2)</span>
                <span className="text-xs font-bold text-[#0F2942]">
                  {ocr.power || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Normativa / Distintivo (V.7)</span>
                <span className="text-xs font-bold text-blue-700">
                  {ocr.euroNorm || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 3: Masas, Plazas y Fechas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-500" />
              3. Masas, Plazas y Fechas Reglamentarias (Campos B, F.1, G, S.1)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">1ª Matriculación (B)</span>
                <span className="text-xs font-bold text-[#0F2942] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {ocr.registrationDate || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Plazas de Asiento (S.1)</span>
                <span className="text-xs font-bold text-[#0F2942]">
                  {ocr.seats ? `${ocr.seats} plazas` : '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Tara / Orden marcha (G)</span>
                <span className="text-xs font-bold text-[#0F2942]">
                  {ocr.tareWeight || '—'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Masa Máx. MMA (F.1)</span>
                <span className="text-xs font-bold text-[#0F2942]">
                  {ocr.maxAuthorizedMass || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 4: Documentos Originales Escaneados */}
          {allDocImages.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                4. Documentos Escaneados Guardados (Permiso de Circulación / Ficha Técnica)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {circulationImages.map((img, idx) => (
                  <div key={`circ-${idx}`} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col group">
                    <div className="relative aspect-4/3 bg-black/5 overflow-hidden">
                      <img src={img} alt="Permiso de Circulación" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <button
                        type="button"
                        onClick={() => setSelectedDocImage(img)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-2 text-[10px] font-bold text-gray-600 truncate text-center">
                      Permiso de Circulación {idx + 1}
                    </div>
                  </div>
                ))}

                {technicalImages.map((img, idx) => (
                  <div key={`tech-${idx}`} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col group">
                    <div className="relative aspect-4/3 bg-black/5 overflow-hidden">
                      <img src={img} alt="Ficha Técnica" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <button
                        type="button"
                        onClick={() => setSelectedDocImage(img)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-2 text-[10px] font-bold text-gray-600 truncate text-center">
                      Ficha Técnica {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal para ver documento a pantalla completa */}
        {selectedDocImage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setSelectedDocImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-xl overflow-hidden">
              <img src={selectedDocImage} alt="Documento completo" className="max-w-full max-h-[85vh] object-contain" />
              <button
                type="button"
                onClick={() => setSelectedDocImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Pie de acciones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {ocr.extractedAt ? `Extraído el ${new Date(ocr.extractedAt).toLocaleDateString('es-ES')}` : 'Datos extraídos mediante escaneo oficial DGT'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#0F2942] hover:bg-[#1E3A5F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
