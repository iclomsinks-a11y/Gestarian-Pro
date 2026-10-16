import React, { useState, useRef } from 'react';
import { 
  X, Camera, ArrowUp, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { Client, GestarianDocument } from '../types';
import { playGentleChime } from '../utils/audioNotification';

interface ExpedienteImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GestarianDocument;
  client?: Client | null;
  onUpdateImages: (updatedImages: string[]) => void;
  onOpenClientArea?: () => void;
  onShowToast?: (msg: string, duration?: number) => void;
}

export const ExpedienteImagesModal: React.FC<ExpedienteImagesModalProps> = ({
  isOpen,
  onClose,
  document,
  client,
  onUpdateImages,
}) => {
  const images = document.vehicleImages || [];
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const hasApp = Boolean(client?.hasAppInstalled);
  const isCompany = client?.clientType === 'empresa' || (client?.cif && (client.cif.startsWith('B') || client.cif.startsWith('A')));

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    Promise.all(filePromises).then((newBase64Images) => {
      const updated = [...images, ...newBase64Images];
      onUpdateImages(updated);
      setSelectedIndex(updated.length - 1);
      playGentleChime();
    });

    e.target.value = '';
  };

  const handleDeleteImage = (indexToDelete: number) => {
    if (!confirm('¿Desea eliminar esta imagen del vehículo?')) return;
    const updated = images.filter((_, idx) => idx !== indexToDelete);
    onUpdateImages(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden text-white select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* CABECERA: SOLO ARRIBA CENTRADA LA MATRÍCULA */}
      <div className="w-full pt-4 pb-2 px-4 flex items-center justify-center relative bg-gradient-to-b from-black via-black/80 to-transparent shrink-0 z-20">
        <div className="flex items-center border-2 border-slate-800 bg-white rounded-xl overflow-hidden shadow-2xl h-10 sm:h-11">
          <div className="bg-blue-800 text-white font-black text-xs px-2.5 sm:px-3 h-full flex items-center justify-center border-r border-slate-900">
            <span>E</span>
          </div>
          <span className="font-mono font-black uppercase text-blue-950 px-3 sm:px-5 text-lg sm:text-2xl tracking-widest">
            {document.vehiclePlate || 'SIN MATRÍCULA'}
          </span>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: IMÁGENES A TODA PANTALLA MÁS MINIATURAS DENTRO DE LA IMAGEN PRINCIPAL PERO ABAJO */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-black">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 text-white/40">
            <ImageIcon className="w-20 h-20 mb-3 opacity-30" />
            <p className="text-sm font-bold uppercase tracking-wider">No hay imágenes guardadas para este vehículo</p>
            <p className="text-xs text-white/30 mt-1 max-w-sm">Use el icono de cámara o subida de la barra inferior para añadir fotografías.</p>
          </div>
        ) : (
          <>
            {/* Imagen Principal */}
            <img
              src={images[selectedIndex]}
              alt={`Imagen ${selectedIndex + 1} del vehículo`}
              className="max-w-full max-h-full object-contain"
            />

            {/* BOTÓN 'X' ARRIBA DE LA IMAGEN PRINCIPAL SOLO PARA ELIMINAR LA IMAGEN */}
            <button
              type="button"
              onClick={() => handleDeleteImage(selectedIndex)}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-2xl"
              title="Eliminar esta imagen del vehículo"
            >
              <X className="w-6 h-6" />
            </button>

            {/* SLIDER DE NAVEGACIÓN DE IMÁGENES PRINCIPALES */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110 cursor-pointer backdrop-blur-xs shadow-xl"
                  title="Imagen anterior"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110 cursor-pointer backdrop-blur-xs shadow-xl"
                  title="Imagen siguiente"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* MINIATURAS DENTRO DE LA IMAGEN PRINCIPAL PERO ABAJO (CON SCROLL Y SIN BOTÓN DE ELIMINAR) */}
            <div className="absolute bottom-4 left-0 right-0 z-30 px-4 flex justify-center pointer-events-auto">
              <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-2 px-3 bg-black/75 backdrop-blur-md rounded-2xl border border-white/15 scrollbar-thin shadow-2xl">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedIndex === idx
                        ? 'border-sky-400 ring-2 ring-sky-400/50 scale-105 opacity-100'
                        : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/60'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* INPUTS OCULTOS PARA CÁMARA Y ARCHIVOS */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleAddImageFile}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddImageFile}
        className="hidden"
      />

      {/* ESPACIO ABAJO PARA RELLENO DEL ÁREA DONDE ESTÁN LOS ICONOS:
          - ICONO DE CÁMARA ABAJO A LA IZQUIERDA
          - ICONO DE SUBIR IMAGEN SOLO UNA FLECHA APUNTANDO HACIA ARRIBA SIN RELLENO NI RECUADRO NI ENVOLTORIO
          - BOTÓN CERRAR
      */}
      <div className="w-full bg-[#080c14] border-t border-white/10 px-6 sm:px-10 py-4 flex items-center justify-between z-40 shrink-0">
        {/* ICONO DE CÁMARA ABAJO A LA IZQUIERDA */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="p-1 text-white hover:text-sky-400 transition-transform hover:scale-110 cursor-pointer"
          title="Abrir cámara"
        >
          <Camera className="w-8 h-8 text-white" />
        </button>

        {/* ICONO DE SUBIR IMAGEN: SOLO UNA FLECHA APUNTANDO HACIA ARRIBA SIN RELLENO NI RECUADRO NI ENVOLTORIO */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-0 bg-transparent border-none text-white hover:text-sky-400 transition-transform hover:scale-110 cursor-pointer outline-none"
          title="Subir imagen desde archivo"
        >
          <ArrowUp className="w-8 h-8 text-white" strokeWidth={2.8} />
        </button>

        {/* BOTÓN CERRAR */}
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
