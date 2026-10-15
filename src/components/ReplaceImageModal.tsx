import React, { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Check, Trash2, ArrowRight } from 'lucide-react';

export interface ReplaceTargetInfo {
  slot: 'portrait' | 'landscape' | 'bento' | 'logo' | 'custom_main';
  label: string;
  currentUrl: string;
  defaultFallbackUrl?: string;
}

interface ReplaceImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ReplaceTargetInfo | null;
  onImageReplaced: (slot: ReplaceTargetInfo['slot'], newUrl: string) => void;
}

export const ReplaceImageModal: React.FC<ReplaceImageModalProps> = ({
  isOpen,
  onClose,
  target,
  onImageReplaced,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !target) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP, etc.).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo desde el dispositivo.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyReplacement = () => {
    if (!previewUrl) return;
    onImageReplaced(target.slot, previewUrl);
    handleCloseModal();
  };

  const handleResetToDefault = () => {
    const fallback = target.defaultFallbackUrl || '';
    onImageReplaced(target.slot, fallback);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      <div className="w-full max-w-lg bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-5 py-4 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#38BDF8]/15 border border-[#38BDF8]/30 rounded-xl text-[#38BDF8]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Reemplazar Imagen</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] rounded-full border border-[#38BDF8]/40">
                  Galería Local
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">{target.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input de archivo nativo oculto */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Comparativa / Previsualización */}
          <div className="grid grid-cols-2 gap-3">
            {/* Imagen actual */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Imagen Actual
              </span>
              <div className="h-32 w-full rounded-xl overflow-hidden border border-[#334155] bg-black">
                {target.currentUrl ? (
                  <img
                    src={target.currentUrl}
                    alt="Actual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-2 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nueva imagen seleccionada */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider block">
                Nueva Imagen (Galería)
              </span>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`h-32 w-full rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? 'border-emerald-500 bg-black'
                    : 'border-dashed border-[#38BDF8]/60 hover:border-[#38BDF8] bg-[#1E293B]/50 hover:bg-[#1E293B]'
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Nueva vista previa"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : isProcessing ? (
                  <div className="text-center text-xs text-[#38BDF8]">
                    <div className="w-6 h-6 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Cargando imagen...</span>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-300">
                    <Upload className="w-6 h-6 text-[#38BDF8] mx-auto animate-bounce" />
                    <span className="text-xs font-bold block text-white">
                      Elegir de Galería
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Pulsa para abrir fotos
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón Principal: Subir desde Galería */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>
              {previewUrl ? 'Cambiar otra foto de la galería' : 'Subir desde la Galería del Dispositivo'}
            </span>
          </button>

          {/* Opciones secundarias */}
          {target.defaultFallbackUrl && target.currentUrl !== target.defaultFallbackUrl && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Restablecer imagen predeterminada del sistema</span>
            </button>
          )}
        </div>

        {/* Pie de acciones */}
        <div className="px-5 py-3.5 bg-[#1E293B] border-t border-[#334155] flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!previewUrl}
            onClick={handleApplyReplacement}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              previewUrl
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Confirmar y Reemplazar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
