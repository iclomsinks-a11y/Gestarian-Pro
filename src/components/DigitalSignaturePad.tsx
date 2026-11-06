import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FileSignature, RotateCcw, Check, CheckCircle2, Trash2, ShieldCheck, PenTool } from 'lucide-react';

interface DigitalSignaturePadProps {
  existingSignature?: string;
  signedAt?: string;
  signedByName?: string;
  clientName?: string;
  docTitle?: string;
  documentNumber?: string;
  isReadOnly?: boolean;
  onSaveSignature: (signatureDataUrl: string) => void;
  onClearSignature?: () => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  existingSignature,
  signedAt,
  signedByName,
  clientName,
  docTitle = 'Documento',
  documentNumber = '',
  isReadOnly = false,
  onSaveSignature,
  onClearSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(!existingSignature);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  // Inicializar o limpiar el canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo transparente y trazo nítido
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureError(null);
  }, []);

  useEffect(() => {
    if (isEditingExisting) {
      // Breve retardo para asegurar que el canvas esté en el DOM montado
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditingExisting, initCanvas]);

  // Obtener coordenadas normalizadas relativas al canvas
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    if ('touches' in e) {
      // Prevenir scroll en móviles al tocar el canvas
      if (e.cancelable) e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F2942'; // Azul marino oscuro para trazo formal

    setIsDrawing(true);
    setHasDrawn(true);
    setSignatureError(null);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const handleConfirmSignature = () => {
    if (!hasDrawn) {
      setSignatureError('Por favor, dibuje su firma en el recuadro antes de confirmar.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL('image/png');
    onSaveSignature(signatureDataUrl);
    setIsEditingExisting(false);
    setSignatureError(null);
  };

  const handleStartReSign = () => {
    setIsEditingExisting(true);
    setTimeout(() => {
      initCanvas();
    }, 50);
  };

  const handleClear = () => {
    initCanvas();
  };

  // Modo A: Firma ya registrada y confirmada
  if (existingSignature && !isEditingExisting) {
    return (
      <div className="w-full bg-slate-50 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-sm mt-5 print:mt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base text-emerald-950 uppercase tracking-wide">
                  Documento Firmado Digitalmente
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  Conformidad Registrada
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                Firmado por: <strong>{signedByName || clientName || 'Cliente'}</strong>
              </p>
              {signedAt && (
                <p className="text-[11px] font-mono text-slate-500">
                  Fecha y hora: {new Date(signedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
            <div className="bg-white border-2 border-dashed border-emerald-400/80 rounded-xl p-2 shadow-xs shrink-0 flex items-center justify-center">
              <img
                src={existingSignature}
                alt={`Firma de ${signedByName || clientName || 'Cliente'}`}
                className="h-16 max-w-[220px] object-contain select-none"
              />
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2 print:hidden no-print">
                <button
                  type="button"
                  onClick={handleStartReSign}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-400 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Volver a firmar o modificar firma"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Volver a firmar</span>
                </button>
                {onClearSignature && (
                  <button
                    type="button"
                    onClick={onClearSignature}
                    className="p-2 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl transition-all shadow-xs cursor-pointer"
                    title="Eliminar firma"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modo B: Recuadro interactivo de captura de firma (Touch / Cursor)
  return (
    <div className="w-full bg-indigo-50/70 border-2 border-dashed border-indigo-400/80 rounded-2xl p-4 sm:p-5 mt-5 shadow-sm print:hidden no-print">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <FileSignature className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base text-indigo-950 uppercase tracking-wide">
              Firma Digital de Conformidad
            </h4>
            <p className="text-[11px] sm:text-xs text-indigo-900/80">
              Firme directamente en el recuadro con el dedo (pantalla táctil) o con el cursor del ratón
            </p>
          </div>
        </div>

        {clientName && (
          <span className="hidden sm:inline-block text-xs font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
            Cliente: {clientName}
          </span>
        )}
      </div>

      {/* Área del Canvas con guía visual */}
      <div className="relative w-full rounded-xl overflow-hidden bg-white border border-indigo-200 shadow-inner select-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="w-full h-36 sm:h-40 block cursor-crosshair touch-none bg-transparent relative z-10"
        />

        {/* Marca de agua / Línea base de firma de apoyo */}
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col justify-end pb-5 px-6 pointer-events-none select-none z-0">
            <div className="w-full border-b-2 border-dashed border-slate-300 flex items-center justify-between pb-1">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                ✕ Firma del cliente
              </span>
              <span className="text-[10px] font-sans text-slate-400 italic">
                Pantalla táctil o cursor
              </span>
            </div>
          </div>
        )}
      </div>

      {signatureError && (
        <p className="text-xs text-red-600 font-bold mt-2">
          {signatureError}
        </p>
      )}

      {/* Botones de acción */}
      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <div className="text-[11px] text-slate-500">
          Al confirmar, la firma quedará sellada e incorporada en el documento oficial.
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasDrawn}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              hasDrawn
                ? 'bg-white text-slate-700 hover:text-red-600 hover:bg-red-50 border-slate-300'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
            title="Limpiar trazo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>

          {existingSignature && isEditingExisting && (
            <button
              type="button"
              onClick={() => setIsEditingExisting(false)}
              className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmSignature}
            className="px-5 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-emerald-400/40"
          >
            <Check className="w-4 h-4 font-black" />
            <span>Confirmar y Guardar Firma</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignaturePad;
