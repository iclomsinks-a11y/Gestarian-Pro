import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Sparkles, Check, Image as ImageIcon, 
  Palette, RefreshCw, ZoomIn, Eye, Sliders, ArrowRight,
  SlidersHorizontal, CheckCircle2
} from 'lucide-react';
import { AppUser } from '../types';
import { 
  generateAllVariantsFromOriginal, 
  StylizedImageVariants, 
  ImageStyleType,
  StylizerOptions
} from '../services/imageStylizerService';

interface ImageCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AppUser;
  onSaveBackgrounds?: (updated: {
    bgPortraitUrl?: string;
    bgLandscapeUrl?: string;
    bgBentoMenuUrl?: string;
  }) => void;
  onSelectImage?: (
    variant: { styleName: string; dataUrl: string },
    targetSlot: 'portrait' | 'landscape' | 'bento' | 'all'
  ) => void;
  initialTarget?: 'portrait' | 'landscape' | 'bento' | 'all';
}

export const ImageCustomizerModal: React.FC<ImageCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveBackgrounds,
  onSelectImage,
  initialTarget = 'all',
}) => {
  const [targetSlot, setTargetSlot] = useState<'portrait' | 'landscape' | 'bento' | 'all'>(initialTarget);
  const [uploadedOriginalUrl, setUploadedOriginalUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [variants, setVariants] = useState<StylizedImageVariants | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyleType>('original');
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);
  const [refinementLevel, setRefinementLevel] = useState<number>(3); // Nivel 1 a 5 de refinamiento

  // Selecciones temporales antes de guardar
  const [bgPortrait, setBgPortrait] = useState<string>(currentUser?.bgPortraitUrl || '');
  const [bgLandscape, setBgLandscape] = useState<string>(currentUser?.bgLandscapeUrl || '');
  const [bgBento, setBgBento] = useState<string>(currentUser?.bgBentoMenuUrl || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setBgPortrait(currentUser.bgPortraitUrl || '');
        setBgLandscape(currentUser.bgLandscapeUrl || '');
        setBgBento(currentUser.bgBentoMenuUrl || '');
      }
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewLightboxUrl) {
          setPreviewLightboxUrl(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, previewLightboxUrl]);

  if (!isOpen) return null;

  // Manejar subida de archivo local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLocalFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processLocalFile(file);
    }
  };

  const processLocalFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setUploadedOriginalUrl(dataUrl);
        await runAiStylization(dataUrl, refinementLevel);
      }
    };
    reader.readAsDataURL(file);
  };

  // Ejecutar generación IA de las 3 variantes partiendo de la original
  const runAiStylization = async (originalSrc: string, customRefinement?: number) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressStatus('Iniciando motor IA de estilización y refinamiento...');

    const activeRefinement = customRefinement ?? refinementLevel;
    try {
      const result = await generateAllVariantsFromOriginal(
        originalSrc,
        (status, pct) => {
          setProgressStatus(status);
          setProgressPercent(pct);
        },
        { refinementLevel: activeRefinement, qualityBoost: true }
      );
      setVariants(result);
      setSelectedStyle('original');

      // Asignar según el slot activo
      applyStyleToSlot('original', result.original, targetSlot);
    } catch (err) {
      console.error('Error al generar variantes IA:', err);
      setProgressStatus('Error al procesar la imagen local.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyStyleToSlot = (
    styleKey: ImageStyleType,
    url: string,
    slot: 'portrait' | 'landscape' | 'bento' | 'all'
  ) => {
    setSelectedStyle(styleKey);
    if (slot === 'portrait' || slot === 'all') setBgPortrait(url);
    if (slot === 'landscape' || slot === 'all') setBgLandscape(url);
    if (slot === 'bento' || slot === 'all') setBgBento(url);

    if (onSelectImage) {
      onSelectImage(
        { styleName: styleLabels[styleKey]?.title || 'Estilo IA', dataUrl: url },
        slot
      );
    }
  };

  const handleSave = () => {
    if (onSaveBackgrounds) {
      onSaveBackgrounds({
        bgPortraitUrl: bgPortrait,
        bgLandscapeUrl: bgLandscape,
        bgBentoMenuUrl: bgBento,
      });
    }
    if (onSelectImage && variants) {
      const activeDataUrl = variants[selectedStyle] || variants.original;
      onSelectImage(
        { styleName: styleLabels[selectedStyle]?.title || 'Estilo IA', dataUrl: activeDataUrl },
        targetSlot
      );
    }
    onClose();
  };

  const styleLabels: Record<
    ImageStyleType,
    { title: string; subtitle: string; tagColor: string; description: string }
  > = {
    original: {
      title: 'Original',
      subtitle: 'Foto local sin alteraciones',
      tagColor: 'bg-slate-700 text-white',
      description: 'Tu imagen tal cual la capturaste, optimizada en nitidez y resolución.',
    },
    artistica: {
      title: 'Artística',
      subtitle: 'Lienzo al óleo & arte digital',
      tagColor: 'bg-amber-600 text-white',
      description: 'Pinceladas al óleo, tonos dorados cálidos y profundidad pictórica de museo.',
    },
    manga: {
      title: 'Manga / Anime',
      subtitle: 'Entintado cel-shading japonés',
      tagColor: 'bg-indigo-600 text-white',
      description: 'Trazos de tinta negra en bordes y colores vivos al estilo anime automotriz.',
    },
    futurista: {
      title: 'Futurista',
      subtitle: 'Cyberpunk & alta tecnología',
      tagColor: 'bg-cyan-600 text-white',
      description: 'Luces de neón cian/magenta, reflejos cromados y atmósfera sci-fi de taller avanzado.',
    },
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-xl text-[#38BDF8]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Personalización de Fondos con IA</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] rounded-full border border-[#38BDF8]/30">
                  3 Estilos IA
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Sube una imagen local de tu dispositivo. La IA genera 3 variantes refinadas (Artística, Manga y Futurista) respetando siempre el original.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            title="Cerrar personalizador"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Selector de Destino de la Imagen */}
        <div className="px-6 py-3 bg-[#131E32] border-b border-[#334155] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-[#94A3B8] uppercase tracking-wider">
            Aplicar fondo a:
          </span>
          <div className="flex items-center gap-1.5 bg-[#0F172A] p-1 rounded-xl border border-[#334155]">
            <button
              onClick={() => setTargetSlot('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                targetSlot === 'all'
                  ? 'bg-[#38BDF8] text-[#0F172A] shadow-sm font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Todos los Fondos
            </button>
            <button
              onClick={() => setTargetSlot('portrait')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                targetSlot === 'portrait'
                  ? 'bg-[#38BDF8] text-[#0F172A] shadow-sm font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Inicio (Portrait)
            </button>
            <button
              onClick={() => setTargetSlot('landscape')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                targetSlot === 'landscape'
                  ? 'bg-[#38BDF8] text-[#0F172A] shadow-sm font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Inicio (Landscape)
            </button>
            <button
              onClick={() => setTargetSlot('bento')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                targetSlot === 'bento'
                  ? 'bg-[#38BDF8] text-[#0F172A] shadow-sm font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Fondo Menú Bento
            </button>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Zona de Subida de Archivo Local */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#334155] hover:border-[#38BDF8] bg-[#1E293B]/60 hover:bg-[#1E293B] p-6 rounded-2xl text-center transition-all cursor-pointer group flex flex-col items-center justify-center relative"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">
              {uploadedOriginalUrl
                ? 'Cargar otra imagen local desde tu dispositivo'
                : 'Seleccionar imagen local del dispositivo'}
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-md">
              Haz clic o arrastra un archivo JPG, PNG o WEBP de tu taller, vehículo o foto preferida.
            </p>
          </div>

          {/* Barra de progreso si está procesando IA */}
          {isProcessing && (
            <div className="p-5 bg-[#1E293B] border border-[#38BDF8]/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-white">
                <span className="font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#38BDF8] animate-spin" />
                  {progressStatus}
                </span>
                <span className="font-mono text-[#38BDF8] font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#0F172A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#38BDF8] to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Galería de las CUATRO Imágenes (Original + 3 Estilos IA) */}
          {variants && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#38BDF8]" />
                  <span>Elige entre las 4 versiones para tu fondo:</span>
                </h3>
                <span className="text-[11px] text-[#94A3B8]">
                  Haz clic en cualquier versión para asignarla
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['original', 'artistica', 'manga', 'futurista'] as ImageStyleType[]).map((styleKey) => {
                  const url = variants[styleKey];
                  const info = styleLabels[styleKey];
                  const isCurrentlySelected = selectedStyle === styleKey;

                  return (
                    <div
                      key={styleKey}
                      className={`relative bg-[#1E293B] rounded-xl overflow-hidden border-2 transition-all flex flex-col group ${
                        isCurrentlySelected
                          ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/40 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                          : 'border-[#334155] hover:border-white/50'
                      }`}
                    >
                      {/* Imagen con botón de zoom */}
                      <div className="relative h-44 w-full bg-black overflow-hidden">
                        <img
                          src={url}
                          alt={info.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Etiqueta de Estilo */}
                        <div className="absolute top-2 left-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-md ${info.tagColor}`}
                          >
                            {info.title}
                          </span>
                        </div>

                        {/* Botón Zoom Lightbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewLightboxUrl(url);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-md transition-colors"
                          title="Ver en pantalla completa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Indicador de Seleccionado */}
                        {isCurrentlySelected && (
                          <div className="absolute bottom-2 right-2 p-1 bg-[#38BDF8] text-[#0F172A] rounded-full shadow-lg">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Detalles y Acciones */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <p className="text-xs font-bold text-white">{info.subtitle}</p>
                          <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-0.5">
                            {info.description}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-[#334155]">
                          <button
                            type="button"
                            onClick={() => applyStyleToSlot(styleKey, url, targetSlot)}
                            className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              isCurrentlySelected
                                ? 'bg-[#38BDF8] text-[#0F172A]'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isCurrentlySelected ? 'Seleccionada' : 'Usar esta imagen'}</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setBgPortrait(url);
                                setBgLandscape(url);
                              }}
                              className="px-2 py-1 bg-[#0F172A] hover:bg-white/10 text-[#94A3B8] hover:text-white rounded text-center truncate border border-[#334155]"
                              title="Asignar a Fondo de Inicio"
                            >
                              Fondo Inicio
                            </button>
                            <button
                              type="button"
                              onClick={() => setBgBento(url)}
                              className="px-2 py-1 bg-[#0F172A] hover:bg-white/10 text-[#94A3B8] hover:text-white rounded text-center truncate border border-[#334155]"
                              title="Asignar a Fondo Menú Bento"
                            >
                              Fondo Bento
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel de Refinamiento, Calidad y Carga de Nuevas Imágenes */}
              <div className="pt-4 border-t border-[#334155] space-y-4">
                {/* Control de Refinamiento y Calidad IA */}
                <div className="p-4 bg-[#131E32] rounded-xl border border-[#334155] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#38BDF8]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Toque de Personalización, Refinamiento y Calidad IA
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      Regula el nivel de acabado artístico, nitidez y contraste preservando siempre el aspecto de tu imagen original.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={refinementLevel}
                      onChange={(e) => setRefinementLevel(Number(e.target.value))}
                      className="w-32 sm:w-40 accent-[#38BDF8] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded border border-[#38BDF8]/30 shrink-0">
                      {refinementLevel === 1 && '1/5 · Sutil'}
                      {refinementLevel === 2 && '2/5 · Suave'}
                      {refinementLevel === 3 && '3/5 · Óptimo'}
                      {refinementLevel === 4 && '4/5 · Refinado'}
                      {refinementLevel === 5 && '5/5 · Ultra Calidad'}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción Final: Cargar más imágenes o Regenerar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 shadow-xs cursor-pointer hover:scale-102"
                  >
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cargar más imágenes para volver a editar</span>
                  </button>

                  {uploadedOriginalUrl && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => runAiStylization(uploadedOriginalUrl, refinementLevel)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] rounded-xl text-xs font-bold transition-all border border-[#38BDF8]/40 cursor-pointer hover:scale-102 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>Regenerar con este nivel de refinamiento y calidad</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resumen de fondos asignados actualmente */}
          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Vista previa de asignaciones actuales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#334155] flex items-center gap-3">
                {bgPortrait ? (
                  <img src={bgPortrait} alt="Portrait" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 bg-[#1E293B] rounded flex items-center justify-center text-[10px] text-[#64748B]">
                    Vacío
                  </div>
                )}
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-white">Inicio (Portrait)</span>
                  <span className="block text-[10px] text-[#94A3B8] truncate">
                    {bgPortrait ? 'Personalizado' : 'Predeterminado'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#334155] flex items-center gap-3">
                {bgLandscape ? (
                  <img src={bgLandscape} alt="Landscape" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 bg-[#1E293B] rounded flex items-center justify-center text-[10px] text-[#64748B]">
                    Vacío
                  </div>
                )}
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-white">Inicio (Landscape)</span>
                  <span className="block text-[10px] text-[#94A3B8] truncate">
                    {bgLandscape ? 'Personalizado' : 'Predeterminado'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#0F172A] rounded-lg border border-[#334155] flex items-center gap-3">
                {bgBento ? (
                  <img src={bgBento} alt="Bento" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 bg-[#1E293B] rounded flex items-center justify-center text-[10px] text-[#64748B]">
                    Vacío
                  </div>
                )}
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-white">Menú Bento</span>
                  <span className="block text-[10px] text-[#94A3B8] truncate">
                    {bgBento ? 'Personalizado' : 'Predeterminado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-4 bg-[#1E293B] border-t border-[#334155] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
            <span>Cancelar / Salir</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#38BDF8] hover:bg-[#0284C7] text-[#0F172A] font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Guardar y Aplicar Fondos</span>
          </button>
        </div>
      </div>

      {/* Lightbox para zoom de imagen en pantalla completa */}
      {previewLightboxUrl && (
        <div
          className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewLightboxUrl(null)}
        >
          <button
            onClick={() => setPreviewLightboxUrl(null)}
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewLightboxUrl}
            alt="Vista ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
