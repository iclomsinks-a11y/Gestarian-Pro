import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';

interface LongPressImagePreviewProps {
  imageUrl?: string;
  altText: string;
  title: string;
  slotLabel?: string;
  heightClass?: string;
  onLongPressTrigger: () => void;
  onDirectUploadClick?: () => void;
  className?: string;
}

export const LongPressImagePreview: React.FC<LongPressImagePreviewProps> = ({
  imageUrl,
  altText,
  title,
  slotLabel,
  heightClass = 'h-28',
  onLongPressTrigger,
  onDirectUploadClick,
  className = '',
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [remainingSeconds, setRemainingSeconds] = useState(3);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const touchStartCoords = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPressing(false);
    setProgress(0);
    setRemainingSeconds(3);
    touchStartCoords.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  const handleTrigger = useCallback(() => {
    cleanupTimers();
    triggeredRef.current = true;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        // Ignore vibration errors
      }
    }
    onLongPressTrigger();
  }, [cleanupTimers, onLongPressTrigger]);

  const handleStartPress = (clientX?: number, clientY?: number) => {
    triggeredRef.current = false;
    startTimeRef.current = Date.now();
    setIsPressing(true);
    setProgress(0);
    setRemainingSeconds(3);

    if (clientX !== undefined && clientY !== undefined) {
      touchStartCoords.current = { x: clientX, y: clientY };
    }

    // Intervalo de refresco fluido para la barra / anillo circular
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      const rem = Math.max(1, Math.ceil((3000 - elapsed) / 1000));
      setProgress(pct);
      setRemainingSeconds(rem);

      if (elapsed >= 3000) {
        handleTrigger();
      }
    }, 40);
  };

  const handleEndPress = () => {
    if (!triggeredRef.current) {
      cleanupTimers();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartCoords.current || !isPressing) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartCoords.current.x);
    const diffY = Math.abs(touch.clientY - touchStartCoords.current.y);
    // Si el usuario desplaza el dedo más de 12 píxeles, cancelar la pulsación prolongada
    if (diffX > 12 || diffY > 12) {
      cleanupTimers();
    }
  };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-[#CBD5E1] bg-black select-none cursor-pointer transition-all duration-200 group ${heightClass} ${
        isPressing ? 'scale-[0.985] ring-4 ring-[#38BDF8] shadow-xl' : 'hover:border-[#38BDF8]'
      } ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        if (e.button === 0) handleStartPress(e.clientX, e.clientY);
      }}
      onMouseUp={handleEndPress}
      onMouseLeave={handleEndPress}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleStartPress(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleEndPress}
      onTouchCancel={handleEndPress}
      onTouchMove={handleTouchMove}
      title="Mantén pulsada 3 segundos para reemplazar desde la galería"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Imagen o Placeholder */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-3 text-center">
          <ImageIcon className="w-8 h-8 text-slate-500 mb-1" />
          <span className="text-xs font-semibold text-slate-300">Sin imagen</span>
          <span className="text-[10px] text-slate-500">Mantén 3s o pulsa para subir</span>
        </div>
      )}

      {/* Degradado sutil en la parte inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Etiqueta de la parada/fondo */}
      {slotLabel && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 rounded-md bg-[#0F2942]/90 text-[#38BDF8] text-[10px] font-bold uppercase tracking-wider border border-[#38BDF8]/30 shadow-xs">
            {slotLabel}
          </span>
        </div>
      )}

      {/* Indicador en reposo: Mantén pulsada 3s */}
      {!isPressing && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-xs">
            <Clock className="w-3 h-3 text-[#38BDF8] shrink-0 animate-pulse" />
            <span>Mantén pulsada 3s para reemplazar</span>
          </span>

          {onDirectUploadClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDirectUploadClick();
              }}
              className="pointer-events-auto p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all cursor-pointer"
              title="Abrir galería para reemplazar"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Overlay interactivo durante la pulsación mantenida de 3 segundos */}
      {isPressing && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-3 z-20 text-white animate-in fade-in duration-150 pointer-events-none">
          {/* Anillo de progreso circular SVG */}
          <div className="relative w-14 h-14 flex items-center justify-center mb-1.5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="text-white/20"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                className="text-[#38BDF8] transition-all duration-75 ease-linear"
                strokeWidth="4"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * progress) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-[#38BDF8]">
              {remainingSeconds}s
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-white tracking-wide uppercase">
              Mantén pulsado...
            </p>
            <p className="text-[10px] text-[#38BDF8] font-medium">
              Abriendo reemplazo ({Math.round(progress)}%)
            </p>
          </div>

          {/* Barra inferior de progreso */}
          <div className="w-4/5 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#38BDF8] to-emerald-400 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
