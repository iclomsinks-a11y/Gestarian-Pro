import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle, FileText, CheckCircle2, RotateCcw, ArrowRight, Trash2, Edit3, Video } from 'lucide-react';
import { Client, GestarianDocument } from '../types';

interface PlateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  documents: GestarianDocument[];
  hasApiKey?: boolean;
  onStartBudgetWithVehicle: (data: {
    plate: string;
    client?: Client;
    vehicleModel?: string;
    vehicleImages: string[];
    isManualEntry?: boolean;
  }) => void;
}

export const PlateScannerModal: React.FC<PlateScannerModalProps> = ({
  isOpen,
  onClose,
  clients,
  documents,
  hasApiKey = false,
  onStartBudgetWithVehicle,
}) => {
  const [step, setStep] = useState<'scan_plate' | 'vehicle_visor' | 'manual_entry'>('scan_plate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recognizedPlate, setRecognizedPlate] = useState<string>('');
  const [matchedClient, setMatchedClient] = useState<Client | null>(null);
  const [vehicleModel, setVehicleModel] = useState<string>('');

  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const [manualPlate, setManualPlate] = useState<string>('');

  const plateCameraInputRef = useRef<HTMLInputElement>(null);
  const vehicleCameraInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);


  const startCamera = async () => {
    try {
      if (stream) return;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("Error al acceder a la cámara", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);


  // When modal closes or step changes, stop camera if needed
  useEffect(() => {
    if (!isOpen || step !== 'scan_plate') {
      stopCamera();
    } else if (isOpen && step === 'scan_plate') {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, step]);


  useEffect(() => {
    if (isOpen) {
      setStep('scan_plate');
      setIsProcessing(false);
      setError(null);
      setRecognizedPlate('');
      setMatchedClient(null);
      setVehicleModel('');
      setVehicleImages([]);
      setActiveImageIndex(0);
      setManualPlate('');
    }
  }, [isOpen]);

  const findClientAndVehicleByPlate = (plate: string) => {
    const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const foundClient = clients.find((c) => 
      c.plates && c.plates.some((p) => p.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate)
    );
    const previousDoc = documents.find(
      (d) => d.vehiclePlate && d.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate
    );
    let detectedModel = '';
    if (previousDoc?.vehicleModel) {
      detectedModel = previousDoc.vehicleModel;
    } else if (previousDoc?.vehicleType) {
      detectedModel = previousDoc.vehicleType;
    } else if (foundClient?.vehicles && foundClient.vehicles.length > 0) {
      const matchV = foundClient.vehicles.find((v) => v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate);
      if (matchV) detectedModel = `${matchV.brand} ${matchV.model}`;
    }
    return { foundClient, detectedModel };
  };

  const processDetectedPlate = (plate: string, defaultModelHint?: string) => {
    setRecognizedPlate(plate);
    const { foundClient, detectedModel } = findClientAndVehicleByPlate(plate);
    if (foundClient) setMatchedClient(foundClient);
    setVehicleModel(detectedModel || defaultModelHint || 'Turismo / Sedán');
    setStep('vehicle_visor');
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'snapshot.jpg', { type: 'image/jpeg' });
            handlePlateCapture(file);
          }
        }, 'image/jpeg');
      }
    } else if (plateCameraInputRef.current) {
      // Fallback if camera feed not available
      plateCameraInputRef.current.click();
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePlateCapture = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64Image = await convertFileToBase64(file);
      
      const response = await fetch('/api/plate-recognizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, region: 'es' })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al procesar la matrícula');
      }
      
      if (result.data && result.data.results && result.data.results.length > 0) {
        const detectedPlate = result.data.results[0].plate.toUpperCase();
        processDetectedPlate(detectedPlate, 'Vehículo (detectado)');
      } else {
        setError('No se encontró ninguna matrícula en la imagen.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor OCR.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVehiclePhotoCapture = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const base64 = await convertFileToBase64(file);
      setVehicleImages((prev) => {
        const next = [...prev, base64];
        setActiveImageIndex(next.length - 1);
        return next;
      });
    } catch (e) {
      console.error('Error al adjuntar foto del vehículo:', e);
    }
  };

  const handleDeleteActiveImage = () => {
    if (vehicleImages.length === 0) return;
    setVehicleImages((prev) => {
      const next = prev.filter((_, idx) => idx !== activeImageIndex);
      if (activeImageIndex >= next.length && next.length > 0) {
        setActiveImageIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleGenerateBudget = () => {
    const finalPlate = (recognizedPlate || manualPlate).trim().toUpperCase();
    if (!finalPlate) {
      setError('Introduce una matrícula válida antes de generar el presupuesto.');
      return;
    }
    onStartBudgetWithVehicle({
      plate: finalPlate,
      client: matchedClient || undefined,
      vehicleModel: vehicleModel || undefined,
      vehicleImages,
      isManualEntry: step === 'manual_entry',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0F172A]/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full max-w-2xl bg-[#0F172A] border-0 sm:border border-[#334155] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200 ${step === 'scan_plate' ? 'h-full sm:h-auto' : ''}`}>
        
        <input
          type="file"
          ref={plateCameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePlateCapture(file);
            e.target.value = '';
          }}
          className="hidden"
        />
        
        <input
          type="file"
          ref={vehicleCameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleVehiclePhotoCapture(file);
            e.target.value = '';
          }}
          className="hidden"
        />

        {step === 'scan_plate' && (
          <div className="flex flex-col h-full sm:h-[500px]">
            <div className="relative h-[60%] bg-[#020617] border-b border-white/10 overflow-hidden flex flex-col">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#38BDF8] via-transparent to-transparent pointer-events-none" />
              
              
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full">
                {stream ? (
                  <div className="relative w-full h-full">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[85%] max-w-[320px] aspect-[4/1] border-2 border-[#38BDF8] rounded-xl relative flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-[2px]">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#38BDF8] -mt-1 -ml-1" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#38BDF8] -mt-1 -mr-1" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#38BDF8] -mb-1 -ml-1" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#38BDF8] -mb-1 -mr-1" />
                        </div>
                        {isProcessing && (
                          <div className="absolute inset-0 bg-[#38BDF8]/20 flex flex-col items-center justify-center animate-pulse">
                            <div className="w-full h-1 bg-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,1)] animate-[scan_2s_ease-in-out_infinite]" />
                          </div>
                        )}
                        {!isProcessing && <p className="text-white/70 font-mono text-sm font-bold tracking-widest drop-shadow-md">ENCUADRE MATRÍCULA</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-[85%] max-w-[320px] aspect-[4/1] border-2 border-[#38BDF8] rounded-xl relative flex items-center justify-center overflow-hidden bg-black/40">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#38BDF8]/10 to-transparent" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#38BDF8] -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#38BDF8] -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#38BDF8] -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#38BDF8] -mb-1 -mr-1" />
                    </div>
                    {isProcessing && (
                      <div className="absolute inset-0 bg-[#38BDF8]/20 flex flex-col items-center justify-center animate-pulse">
                        <div className="w-full h-1 bg-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,1)] animate-[scan_2s_ease-in-out_infinite]" />
                      </div>
                    )}
                    {!isProcessing && <p className="text-white/40 font-mono text-sm font-bold tracking-widest">CÁMARA NO DISPONIBLE</p>}
                  </div>
                )}
              </div>

              <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-[#38BDF8]" />
                  </div>
                  <span className="font-bold text-sm tracking-wide shadow-black drop-shadow-md">Escáner OCR</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer border border-white/10 pointer-events-auto mr-[40px]"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#0F172A] p-6 flex flex-col items-center justify-center gap-6">
              {error && (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="p-3 w-full bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-start justify-center gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                  <div className="flex w-full items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setStep('manual_entry')}
                      className="flex-1 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider border border-[#38BDF8]/40 transition-colors cursor-pointer"
                    >
                      Introducir Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        captureFrame();
                      }}
                      className="flex-1 py-2.5 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                    >
                      Reintentar OCR
                    </button>
                  </div>
                </div>
              )}
              {!error && (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={captureFrame}
                    className="relative w-20 h-20 rounded-full border-4 border-[#38BDF8] flex items-center justify-center bg-white/5 hover:bg-white/15 active:bg-white/20 transition-all cursor-pointer group shrink-0"
                  >
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center group-hover:scale-95 transition-transform">
                      <Camera className="w-7 h-7 text-[#0F172A]" />
                    </div>
                  </button>
                  <p className="text-[#94A3B8] text-xs text-center max-w-xs leading-relaxed">
                    {isProcessing ? 'Leyendo Matrícula...' : 'Encuadra la matrícula en el recuadro superior y pulsa el botón para capturar'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {step === 'vehicle_visor' && (
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="relative bg-[#020617] p-3 sm:p-4 flex flex-col items-center justify-between min-h-[360px] sm:min-h-[420px] select-none">
              <div className="w-full flex items-center justify-between z-20 pb-2">
                <div className="w-20 hidden sm:block">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
                    {vehicleImages.length > 0 ? `Foto ${activeImageIndex + 1} de ${vehicleImages.length}` : 'Visor'}
                  </span>
                </div>
                
                <div className="mx-auto flex flex-col items-center">
                  <div className="relative inline-flex items-center bg-white rounded-md border-2 border-black px-1 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    <div className="bg-[#003399] text-white flex flex-col items-center justify-center px-1.5 py-0.5 rounded-xs mr-2">
                      <span className="text-[#FFCC00] text-[8px] leading-none font-bold">★★</span>
                      <span className="text-white font-extrabold text-[11px] leading-none tracking-widest mt-0.5">E</span>
                    </div>
                    <span className="font-mono text-black font-extrabold text-base sm:text-lg tracking-widest px-2 py-0.5 select-all">
                      {recognizedPlate}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full border ${matchedClient ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400' : 'bg-[#0F2942]/90 border-[#38BDF8]/30 text-[#38BDF8]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-semibold text-white">
                      {matchedClient ? 'Matrícula en base de datos' : 'Cliente Nuevo / No Registrado'}
                    </span>
                    {matchedClient && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-emerald-300 truncate max-w-[150px]">{matchedClient.name} {vehicleModel ? ` - ${vehicleModel}` : ''}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-20 flex items-center justify-end gap-1 sm:gap-2">
                  {vehicleImages.length > 0 && (
                    <button
                      onClick={handleDeleteActiveImage}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full transition-colors cursor-pointer"
                      title="Eliminar foto actual"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-xl border border-white/5 bg-black/50 my-2">
                {vehicleImages.length > 0 ? (
                  <>
                    <img
                      src={vehicleImages[activeImageIndex]}
                      alt="Vehículo"
                      className="w-full h-full object-contain"
                    />
                    {vehicleImages.length > 1 && (
                      <div className="absolute bottom-2 left-0 w-full flex justify-center gap-1.5 z-10">
                        {vehicleImages.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${idx === activeImageIndex ? 'w-4 bg-[#38BDF8]' : 'w-1.5 bg-white/30'}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/30 p-6 text-center">
                    <Camera className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">Sin imágenes adjuntas</p>
                    <p className="text-xs mt-1">Usa el botón de abajo para fotografiar el vehículo</p>
                  </div>
                )}
              </div>

            </div>
            
            <div className="p-3 sm:p-4 bg-[#0F172A] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => vehicleCameraInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white rounded-xl text-sm font-bold uppercase tracking-wider border border-[#38BDF8]/30 transition-all cursor-pointer shadow-md w-full sm:w-auto"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <span>Seguir Tomando Imágenes</span>
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Salir
                </button>
                <button
                  type="button"
                  onClick={handleGenerateBudget}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer border border-emerald-400/40"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generar Presupuesto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'manual_entry' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/20 flex items-center justify-center text-white">
                  <Edit3 className="w-5 h-5 text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Introducir Matrícula Manualmente
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Escribe la matrícula, sube las fotos del vehículo y genera el presupuesto.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#38BDF8] mb-1.5 text-center">
                  Matrícula del Vehículo
                </label>
                <div className="flex justify-center w-full mt-4 mb-2">
                  <input
                    type="text"
                    required
                    value={manualPlate}
                    onChange={(e) => {
                      const newPlate = e.target.value.toUpperCase();
                      setManualPlate(newPlate);
                      setError(null);
                      
                      const { foundClient, detectedModel } = findClientAndVehicleByPlate(newPlate);
                      setMatchedClient(foundClient || null);
                      setVehicleModel(detectedModel || '');
                    }}
                    placeholder="1234-BBB"
                    className="w-[80%] h-20 sm:h-24 text-center bg-white/10 border-2 border-white/20 focus:border-[#38BDF8] rounded-xl text-white font-mono font-black text-4xl sm:text-5xl uppercase outline-none shadow-inner"
                  />
                </div>
                {manualPlate.trim().length >= 4 && (
                  <div className="flex justify-center mb-6">
                    <div className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full border ${matchedClient ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400' : 'bg-[#0F2942]/90 border-[#38BDF8]/30 text-[#38BDF8]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="font-semibold text-white">
                        {matchedClient ? 'Matrícula en base de datos' : 'Cliente Nuevo / No Registrado'}
                      </span>
                      {matchedClient && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="text-emerald-300 truncate max-w-[150px]">{matchedClient.name} {vehicleModel ? ` - ${vehicleModel}` : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Imágenes del Vehículo / Daños para el Expediente
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => vehicleCameraInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white rounded-xl text-sm font-bold uppercase tracking-wider border border-[#38BDF8]/30 transition-all cursor-pointer shadow-md w-full"
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <span>Seguir Tomando Imágenes</span>
                  </button>
                </div>
              </div>

              {vehicleImages.length > 0 && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                    Fotos adjuntas ({vehicleImages.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {vehicleImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 group">
                        <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setVehicleImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 gap-3">
              <button
                type="button"
                onClick={() => setStep('scan_plate')}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white/70 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Volver al Escáner OCR</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateBudget}
                disabled={!manualPlate.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Generar Presupuesto</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
