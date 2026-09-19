import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import { AppUser } from '../types';

interface MetisVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
}

export const MetisVoiceAssistantModal: React.FC<MetisVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [isActive, setIsActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastSpeech, setLastSpeech] = useState<string>('Conectando con Metis...');
  const [selectedRole, setSelectedRole] = useState<'jefe' | 'empleado'>('jefe');

  // Control de audio / síntesis de voz
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);

  // Escuchar tecla Escape para salir sin quedarse bloqueado
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSpeaking();
        stopListening();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Al abrir el modal, activar la conversación y bienvenida por voz
  useEffect(() => {
    if (isOpen) {
      setIsActive(true);
      const timer = setTimeout(() => {
        speakResponse(
          `Hola, te habla Metis. Estoy activa como tu compañera en el taller de ${currentUser.fullName || 'DM CAR'}. Puedes hablarme con las manos libres mientras reparas o trabajas con la chapa y pintura.`
        );
      }, 500);
      return () => clearTimeout(timer);
    } else {
      stopSpeaking();
      stopListening();
    }
  }, [isOpen]);

  // Síntesis de voz (hablar al usuario)
  const speakResponse = (text: string) => {
    if (!synthRef.current) {
      setLastSpeech(text);
      return;
    }

    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Buscar voz en español
      const voices = synthRef.current.getVoices();
      const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setLastSpeech(text);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Cuando Metis termina de hablar, escuchar al usuario si está activo
        if (isActive) {
          startListening();
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setLastSpeech(text);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Reconocimiento de voz por micrófono
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsListening(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      const recognition = new SpeechRec();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  // Procesamiento de voz según rol y consulta
  const handleVoiceInput = (rawText: string) => {
    const q = rawText.toLowerCase();

    // Restricción a empleados de datos económicos
    const economicKeywords = [
      'factura', 'cobro', 'balance', 'beneficio', 'dinero', 'ingreso',
      'cuanto cobramos', 'ganancia', 'iva', 'irpf', 'margen', 'rendimiento'
    ];

    if (selectedRole === 'empleado' && economicKeywords.some((k) => q.includes(k))) {
      speakResponse(
        'Acceso restringido. Por motivos de seguridad de DM CAR, los datos de facturación y balances están reservados exclusivamente al jefe de taller.'
      );
      return;
    }

    // Recordatorios de taller
    if (q.includes('recuerda') || q.includes('acuérdate') || q.includes('avísame')) {
      speakResponse(
        `Anotado compañero. Me encargaré de recordártelo en el taller mientras sigues trabajando.`
      );
      return;
    }

    // Consejos de chapa y pintura
    if (q.includes('barniz') || q.includes('secado') || q.includes('pintura')) {
      if (currentUser.metisTechnicalAdviceEnabled === false) {
        speakResponse(
          'Los consejos técnicos de taller están deshabilitados temporalmente en la configuración de la empresa.'
        );
        return;
      }
      speakResponse(
        'Para el barniz de alto sólidos, recuerda respetar diez minutos de evaporación entre manos y treinta minutos a sesenta grados en cabina.'
      );
      return;
    }

    if (q.includes('presupuesto')) {
      speakResponse(
        'Para el presupuesto puedes escanear la matrícula con la cámara del inicio o entrar directamente en la sección de presupuestos.'
      );
      return;
    }

    if (q.includes('cliente') || q.includes('portal')) {
      speakResponse(
        'El cliente puede consultar su reparación accediendo al portal de clientes desde gestarian punto com, o mediante el enlace de seguimiento y descarga de la app que le enviamos con su presupuesto por WhatsApp si es particular o por correo si es empresa.'
      );
      return;
    }

    // Respuesta general de compañero
    speakResponse(
      `Te he escuchado perfectamente. Estoy a tu lado para cualquier paso técnico o procedimiento de la empresa que necesites.`
    );
  };

  const toggleConversation = () => {
    if (isActive) {
      // Interrumpir conversación
      setIsActive(false);
      stopSpeaking();
      stopListening();
    } else {
      // Reactivar conversación
      setIsActive(true);
      speakResponse('Conversación reactivada. Te escucho compañero.');
    }
  };

  if (!isOpen) return null;

  // Fondo del usuario según orientación
  const bgImage = currentUser.bgPortraitUrl || currentUser.bgLandscapeUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopSpeaking();
          stopListening();
          onClose();
        }
      }}
    >
      {/* 1. Fondo exterior difuminado de la imagen portrait/landscape del usuario */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 blur-2xl scale-110 opacity-70 pointer-events-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 z-0 bg-[#0B1329]/80 backdrop-blur-xl pointer-events-none" />

      {/* Botón Prominente de Salir de Conversación Bidireccional */}
      <button
        onClick={() => {
          stopSpeaking();
          stopListening();
          onClose();
        }}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(244,63,94,0.65)] border border-rose-300/40 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
        title="Salir de la conversación bidireccional"
      >
        <X className="w-4 h-4" />
        <span>Salir de conversación</span>
      </button>

      {/* Selector de Rol en la esquina superior izquierda */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs text-white">
        <span className="text-[11px] text-white/60">Rol:</span>
        <button
          onClick={() => setSelectedRole('jefe')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
            selectedRole === 'jefe' ? 'bg-[#38BDF8] text-[#0F172A]' : 'text-white/70 hover:text-white'
          }`}
        >
          Jefe
        </button>
        <button
          onClick={() => setSelectedRole('empleado')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
            selectedRole === 'empleado' ? 'bg-[#38BDF8] text-[#0F172A]' : 'text-white/70 hover:text-white'
          }`}
        >
          Empleado
        </button>
      </div>

      {/* 2. Tarjeta rectangular con esquinas redondeadas y halo de resplandor (glow exterior) */}
      <div className="relative z-20 w-[340px] sm:w-[420px] h-[520px] sm:h-[590px] rounded-[36px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(56,189,248,0.35)] border border-white/20 flex flex-col justify-between p-7">
        
        {/* FONDO DIFUSO MOVIÉNDOSE COMO CUANDO UNA IA GENERA UNA IMAGEN */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A1128]">
          <div className="absolute -inset-[50%] opacity-80 blur-3xl animate-[spin_16s_linear_infinite]">
            <div className="w-full h-full bg-gradient-to-tr from-[#38BDF8]/40 via-[#818CF8]/30 to-[#C084FC]/40" />
          </div>
          <div className="absolute -inset-[40%] opacity-70 blur-2xl animate-[pulse_6s_ease-in-out_infinite]">
            <div className="w-full h-full bg-radial from-[#0284C7]/50 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" />
        </div>

        {/* 3. DOS LUCES CON ESTELA QUE RECORREN LA PISTA EN SIMETRÍA A VELOCIDAD REDUCIDA (x0.5 = 4 SEGUNDOS POR VUELTA) CON INTENSO GLOW */}
        {isActive ? (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-300 opacity-100 overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Filtro de super-resplandor con glow multinivel */}
              <filter id="cyclistGlowSuper" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur2" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur3" />
                <feMerge>
                  <feMergeNode in="blur3" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              {/* Gradiente Luz 1 */}
              <linearGradient id="cyclistTrailGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="1" />
                <stop offset="65%" stopColor="#0284C7" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </linearGradient>

              {/* Gradiente Luz 2 (Simétrica) */}
              <linearGradient id="cyclistTrailGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#67E8F9" stopOpacity="1" />
                <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Pista base tenue */}
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="34"
              ry="34"
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.2"
              strokeWidth="1.5"
            />

            {/* Luz 1: Velocidad reducida x0.5 (4s por ciclo continuo) con glow intensificado */}
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="34"
              ry="34"
              fill="none"
              stroke="url(#cyclistTrailGrad1)"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="22 78"
              filter="url(#cyclistGlowSuper)"
              style={{
                animation: 'indoorTrackCyclist1 4s linear infinite',
              }}
            />

            {/* Luz 2: Luz que viaja simétrica en el extremo opuesto (desplazamiento a 180°), velocidad x0.5 (4s) y glow */}
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="34"
              ry="34"
              fill="none"
              stroke="url(#cyclistTrailGrad2)"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="22 78"
              filter="url(#cyclistGlowSuper)"
              style={{
                animation: 'indoorTrackCyclist2 4s linear infinite',
              }}
            />
          </svg>
        ) : null}

        {/* CSS para la animación del ciclo a velocidad x0.5 (4 segundos) y simetría perfecta */}
        <style>{`
          @keyframes indoorTrackCyclist1 {
            0% {
              stroke-dashoffset: 0;
            }
            100% {
              stroke-dashoffset: -100;
            }
          }
          @keyframes indoorTrackCyclist2 {
            0% {
              stroke-dashoffset: -50;
            }
            100% {
              stroke-dashoffset: -150;
            }
          }
        `}</style>

        {/* CABECERA INTERNA DE LA TARJETA */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0F2942]/90 border border-[#38BDF8] flex items-center justify-center text-[11px] font-black text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.6)]">
              AI
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">Metis</h3>
              <p className="text-[10px] text-[#38BDF8] font-medium tracking-wide">
                {isActive ? (isSpeaking ? 'Hablando contigo' : isListening ? 'Escuchando tu voz...' : 'En línea (Manos Libres)') : 'Conversación pausada'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] font-semibold text-white/90">
              {isActive ? 'Activo' : 'Pausa'}
            </span>
          </div>
        </div>

        {/* ZONA CENTRAL: ORBE VIVO / ONDAS DE AUDIO BIOCONVERSACIONALES */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-4">
          <div className="relative flex items-center justify-center">
            {/* Anillos resonantes */}
            {isActive && (
              <>
                <div className={`absolute w-44 h-44 rounded-full border border-[#38BDF8]/20 ${isSpeaking || isListening ? 'animate-ping' : ''}`} style={{ animationDuration: '3s' }} />
                <div className={`absolute w-36 h-36 rounded-full border border-[#818CF8]/30 ${isSpeaking ? 'scale-110' : 'scale-100'} transition-transform duration-500`} />
              </>
            )}

            {/* Núcleo de Metis */}
            <div
              onClick={toggleConversation}
              className={`cursor-pointer w-28 h-28 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl backdrop-blur-md ${
                isActive
                  ? 'bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] shadow-[0_0_40px_rgba(56,189,248,0.7)] scale-100 hover:scale-105'
                  : 'bg-white/10 border border-white/20 shadow-none scale-95 opacity-60'
              }`}
            >
              {isSpeaking ? (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-7 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1.5 h-11 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-8 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                  <div className="w-1.5 h-5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : isListening ? (
                <Mic className="w-10 h-10 text-white animate-pulse" />
              ) : (
                <Sparkles className="w-9 h-9 text-white" />
              )}
            </div>
          </div>

          {/* Subtítulo dinámico fluido */}
          <div className="mt-8 text-center max-w-[280px]">
            <p className="text-xs text-white/90 font-medium leading-relaxed drop-shadow-sm min-h-[40px] flex items-center justify-center">
              {isActive ? (
                isSpeaking ? (
                  `« ${lastSpeech} »`
                ) : isListening ? (
                  <span className="text-[#38BDF8] animate-pulse">Te escucho... háblame</span>
                ) : (
                  <span className="text-white/70">Habla con libertad o pulsa un botón rápido</span>
                )
              ) : (
                <span className="text-amber-200/80">Luz detenida. Pulsa reanudar para hablar con Metis</span>
              )}
            </p>
          </div>
        </div>

        {/* PIE DE CONTROLES RÁPIDOS Y BOTONES MANOS LIBRES */}
        <div className="relative z-10 space-y-3">
          {/* Botones de consulta rápida hablada */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => handleVoiceInput('¿Cómo va el secado del barniz?')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-full whitespace-nowrap backdrop-blur-sm transition-all"
            >
              🎨 Tiempos barniz
            </button>
            <button
              onClick={() => handleVoiceInput('Recuérdame comprobar la masilla')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-full whitespace-nowrap backdrop-blur-sm transition-all"
            >
              📝 Recordar masilla
            </button>
            <button
              onClick={() => handleVoiceInput('¿Cómo se genera un presupuesto?')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-full whitespace-nowrap backdrop-blur-sm transition-all"
            >
              📋 Presupuesto
            </button>
          </div>

          {/* Barra de acción principal */}
          <div className="flex items-center justify-between pt-3 border-t border-white/15">
            <button
              onClick={toggleConversation}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
                isActive
                  ? 'bg-rose-500/80 hover:bg-rose-600 text-white border border-rose-400/40'
                  : 'bg-[#38BDF8] hover:bg-[#0284C7] text-[#0F172A]'
              }`}
            >
              {isActive ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Interrumpir</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Reanudar</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speakResponse('Te escucho con total atención.');
                  }
                }}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-all"
                title={isSpeaking ? 'Silenciar voz' : 'Probar voz de Metis'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#38BDF8]" />}
              </button>

              <button
                onClick={startListening}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-all"
                title="Hablar ahora"
              >
                <Mic className={`w-4 h-4 ${isListening ? 'text-[#38BDF8] animate-pulse' : 'text-white'}`} />
              </button>
            </div>
          </div>

          {/* Botón explícito para Salir de la Conversación Bidireccional */}
          <button
            onClick={() => {
              stopSpeaking();
              stopListening();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-500/25 to-red-600/25 hover:from-rose-500/40 hover:to-red-600/40 text-rose-200 hover:text-white border border-rose-500/40 hover:border-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-2"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Salir de conversación bidireccional</span>
          </button>
        </div>

      </div>
    </div>
  );
};
