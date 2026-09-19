import React, { useState, useRef } from 'react';
import { 
  X, Camera, Plus, Trash2, Smartphone, MessageCircle, Mail, 
  CheckCircle2, AlertCircle, Eye, ChevronLeft, ChevronRight,
  Sparkles, ExternalLink, Image as ImageIcon
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
}

export const ExpedienteImagesModal: React.FC<ExpedienteImagesModalProps> = ({
  isOpen,
  onClose,
  document,
  client,
  onUpdateImages,
  onOpenClientArea,
}) => {
  const images = document.vehicleImages || [];
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [notificationStatus, setNotificationStatus] = useState<{
    type: 'app' | 'whatsapp' | 'email';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentExpediente = document.expediente || 'EXPEDIENTE EN CURSO';
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
      dispatchImageNotification(newBase64Images.length);
    });

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const dispatchImageNotification = (countAdded: number) => {
    playGentleChime();
    // REGLA OFICIAL DE NOTIFICACIÓN:
    // 1. Si tiene la app instalada: solo notificación en app (no whatsapp ni email)
    // 2. Si no tiene app:
    //    - Si es empresa: notificación por email
    //    - Si es particular: notificación por whatsapp
    if (hasApp) {
      setNotificationStatus({
        type: 'app',
        message: `${countAdded} imagen(es) subida(s). Notificación enviada a la App del cliente instalada en su dispositivo móvil (no se envía por WhatsApp ni por Email para evitar doble aviso).`,
      });
    } else if (isCompany) {
      const email = client?.email || document.clientEmail || 'correo corporativo';
      setNotificationStatus({
        type: 'email',
        message: `${countAdded} imagen(es) subida(s). Como el cliente es empresa y no tiene la app instalada, se ha despachado notificación automática por Email a ${email}.`,
      });
    } else {
      const phone = client?.phone || document.clientPhone || 'teléfono móvil';
      setNotificationStatus({
        type: 'whatsapp',
        message: `${countAdded} imagen(es) subida(s). Como el cliente particular no tiene la app instalada, se ha despachado aviso por WhatsApp al ${phone}.`,
      });
    }

    setTimeout(() => {
      setNotificationStatus(null);
    }, 6000);
  };

  const handleDeleteImage = (indexToDelete: number) => {
    if (!confirm('¿Desea eliminar esta imagen del expediente? Se actualizará también en el área del cliente.')) return;
    const updated = images.filter((_, idx) => idx !== indexToDelete);
    onUpdateImages(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#0F172A] border border-white/15 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-5 sm:px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Visor de Imágenes del Expediente
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentExpediente}
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 truncate">
                <span>{client?.name || document.clientName}</span>
                {document.vehiclePlate && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-200 border border-white/10">
                    {document.vehiclePlate}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de canal de notificación según estado del cliente */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border bg-white/5 border-white/10">
              {hasApp ? (
                <span className="flex items-center gap-1 text-emerald-400" title="Cliente con app instalada: aviso in-app exclusivo">
                  <Smartphone className="w-3.5 h-3.5" />
                  App Cliente Instalada
                </span>
              ) : isCompany ? (
                <span className="flex items-center gap-1 text-violet-300" title="Cliente empresa sin app: aviso por email">
                  <Mail className="w-3.5 h-3.5" />
                  Aviso por Email (Empresa)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400" title="Cliente particular sin app: aviso por WhatsApp">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Aviso por WhatsApp (Particular)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificación de envío inteligente en tiempo real */}
        {notificationStatus && (
          <div className="px-5 py-2.5 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notificationStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificationStatus(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Área Central: Visualizador y Galería */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 border border-dashed border-white/20 rounded-2xl p-6">
              <ImageIcon className="w-16 h-16 text-white/20 mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                No hay imágenes en este expediente
              </h3>
              <p className="text-xs text-white/50 max-w-md mt-1 mb-6 leading-relaxed">
                Adjunte fotografías de daños, piezas desmontadas o avance de la reparación. 
                Las imágenes quedarán guardadas automáticamente y se sincronizarán en tiempo real en el Área del Cliente.
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Abrir Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Subir Archivos</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Imagen Principal Seleccionada */}
              <div className="relative w-full aspect-16/9 max-h-[420px] bg-black/60 rounded-xl overflow-hidden border border-white/15 flex items-center justify-center group">
                <img
                  src={images[selectedIndex]}
                  alt={`Imagen ${selectedIndex + 1} de expediente`}
                  className="w-full h-full object-contain"
                />

                {/* Controles sobre la imagen */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs border border-white/20 text-[11px] font-mono text-white/80">
                  {selectedIndex + 1} / {images.length}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteImage(selectedIndex)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                  title="Eliminar esta imagen del expediente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Flechas de navegación */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Imagen anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Imagen siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Tira de Miniaturas */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedIndex === idx
                        ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                {/* Botón rápido para añadir más en la tira */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-14 rounded-lg border-2 border-dashed border-white/30 hover:border-blue-400 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-white/60 hover:text-blue-400 shrink-0 transition-all cursor-pointer"
                  title="Capturar foto con cámara"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-bold uppercase">Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-14 rounded-lg border-2 border-dashed border-white/30 hover:border-blue-400 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center text-white/60 hover:text-blue-400 shrink-0 transition-all cursor-pointer"
                  title="Subir desde galería o archivo"
                >
                  <Plus className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-bold uppercase">Archivo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inputs ocultos para cámara y selector de archivos */}
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

        {/* Pie de Acciones */}
        <div className="p-4 sm:px-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sincronización en directo con el Área de Cliente de Gestarian</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Añadir Imagen (Cámara)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Galería</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
