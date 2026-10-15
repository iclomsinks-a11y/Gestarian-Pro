import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, ShieldAlert, Sparkles, LogOut, Landmark } from 'lucide-react';
import { AppUser, GestarianDocument, Client, Appointment } from '../types';
import { getAeatFiscalAdvice } from '../data/aeatFiscalKnowledge';

interface MetisVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onNavigate?: (sectionId: string, tab?: 'emitidas' | 'recibidas') => void;
  onToggleFullscreen?: () => void;
  onOpenPlateScanner?: () => void;
  onOpenNewBudget?: () => void;
  onOpenNewClient?: () => void;
  onOpenDetectedInvoices?: () => void;
  documents?: GestarianDocument[];
  clients?: Client[];
  appointments?: Appointment[];
}

export const MetisVoiceAssistantModal: React.FC<MetisVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
  onToggleFullscreen,
  onOpenPlateScanner,
  onOpenNewBudget,
  onOpenNewClient,
  onOpenDetectedInvoices,
  documents = [],
  clients = [],
  appointments = [],
}) => {
  const [isActive, setIsActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastSpeech, setLastSpeech] = useState<string>('Conectando con Metis...');
  const [selectedRole, setSelectedRole] = useState<'jefe' | 'empleado'>('jefe');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  // Control de audio / síntesis de voz
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasDetectedSpeechRef = useRef<boolean>(false);
  const lastSoundDetectedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const latestTranscriptRef = useRef<string>('');
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setMicPermissionError(null);
      const timer = setTimeout(() => {
        speakResponse(
          `Hola, te habla Metis. Estoy activa en el taller de ${currentUser.fullName || 'DM CAR'}. Puedes hablarme con las manos libres.`
        );
      }, 400);
      return () => clearTimeout(timer);
    } else {
      stopSpeaking();
      stopListening();
    }
  }, [isOpen]);

  // Síntesis de voz (hablar al usuario) por el altavoz (motor dual: Web Speech nativo + Servidor TTS para compatibilidad total en Android Chrome)
  const speakResponse = async (text: string) => {
    stopSpeaking();
    stopListening();

    if (typeof window === 'undefined') {
      setLastSpeech(text);
      if (isActive) startListening();
      return;
    }

    // Limpiar texto de asteriscos y códigos para habla natural
    const cleanText = text
      .replace(/\[ACTION:[^\]]+\]/g, '')
      .replace(/[*#_`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/^[-*•]\s+/gm, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      setLastSpeech(text);
      if (isActive) startListening();
      return;
    }

    setIsSpeaking(true);
    setLastSpeech(text);
    let browserSpoke = false;

    const finishSpeech = () => {
      setIsSpeaking(false);
      if (isActive) {
        startListening();
      }
    };

    // 1. Intentar con SpeechSynthesis del navegador
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find((v) => v.lang.startsWith('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }

        utterance.onstart = () => {
          browserSpoke = true;
          setIsSpeaking(true);
        };
        utterance.onend = finishSpeech;
        utterance.onerror = () => {
          // Si falla en navegador, permitimos que el fallback de audio reproduzca
        };

        setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (e) {}
        }, 50);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    // 2. Fallback de audio por altavoz mediante endpoint TTS (fundamental en Android Chrome)
    try {
      const res = await fetch('/api/metis-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audio) {
          if (window.speechSynthesis && window.speechSynthesis.speaking && browserSpoke) {
            return;
          }

          if (!audioPlayerRef.current) {
            audioPlayerRef.current = new Audio();
          }

          const player = audioPlayerRef.current;
          player.src = `data:${data.mimeType || 'audio/mpeg'};base64,${data.audio}`;
          player.onplay = () => setIsSpeaking(true);
          player.onended = finishSpeech;
          player.onerror = finishSpeech;

          await player.play().catch((playErr) => {
            console.warn('Audio play error en altavoz:', playErr);
            finishSpeech();
          });
          return;
        }
      }
    } catch (ttsErr) {
      console.warn('Error en TTS de MetisVoiceAssistantModal:', ttsErr);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch (e) {}
    }
    setIsSpeaking(false);
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setAudioLevel(0);
    if (speechDebounceTimerRef.current) {
      clearTimeout(speechDebounceTimerRef.current);
      speechDebounceTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  // Finalizar escucha y procesar la consulta por Web Speech o Gemini Multimodal
  const finishAndSubmitVoice = async (immediateText?: string) => {
    if (!isListeningRef.current) return;
    const fastText = (immediateText || latestTranscriptRef.current).trim();
    stopListening();

    if (fastText) {
      latestTranscriptRef.current = '';
      handleVoiceInput(fastText);
      return;
    }

    // Si Web Speech API no capturó texto, usar el fallback de Gemini con MediaRecorder
    if (audioChunksRef.current.length > 0 && hasDetectedSpeechRef.current) {
      setIsTranscribing(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });
        audioChunksRef.current = [];

        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Data,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });

        const data = await res.json();
        if (data.success && data.text && data.text.trim()) {
          handleVoiceInput(data.text.trim());
        } else {
          setLastSpeech('No pude escuchar con claridad. Por favor, habla de nuevo.');
          if (isActive) {
            startListening();
          }
        }
      } catch (err: any) {
        console.warn('Error en transcripción Gemini:', err);
        if (isActive) {
          startListening();
        }
      } finally {
        setIsTranscribing(false);
      }
    } else {
      if (isActive && !isSpeaking) {
        startListening();
      }
    }
  };

  // Reconocimiento de voz por micrófono
  const startListening = async () => {
    if (typeof window === 'undefined') return;
    if (isSpeaking) return;

    // 1. Reanudar el altavoz si está en pausa
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }

    // 2. Acceder al micro y mantener stream activo
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador incompatible');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioStreamRef.current = stream;
      setMicPermissionError(null);
    } catch (err: any) {
      console.warn('Error micrófono:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionError('Permiso de micrófono bloqueado. Haz clic en el candado para habilitarlo.');
      } else {
        setMicPermissionError('Error accediendo al micro: ' + (err.message || ''));
      }
      setIsListening(false);
      return;
    }

    // 3. AudioContext y AnalyserNode para nivel real
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (e) {
      console.warn('AudioContext error:', e);
    }

    // 4. MediaRecorder como respaldo
    audioChunksRef.current = [];
    try {
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
          else mimeType = '';
        }
        const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        rec.start(150);
        mediaRecorderRef.current = rec;
      }
    } catch (e) {
      console.warn('MediaRecorder error:', e);
    }

    // 5. Iniciar estados
    isListeningRef.current = true;
    setIsListening(true);
    hasDetectedSpeechRef.current = false;
    lastSoundDetectedAtRef.current = 0;
    latestTranscriptRef.current = '';

    // 6. Loop de nivel de audio y pausa breve de silencio
    const checkLoop = () => {
      if (!isListeningRef.current) return;
      let currentLevel = 0;
      if (analyserRef.current) {
        const arr = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(arr);
        let s = 0;
        for (let i = 0; i < arr.length; i++) s += arr[i];
        currentLevel = Math.min(100, Math.round(((s / arr.length) / 128) * 100));
        setAudioLevel(currentLevel);
      }

      // Umbral 14 para evitar estática y ruidos de taller
      if (currentLevel >= 14) {
        hasDetectedSpeechRef.current = true;
        lastSoundDetectedAtRef.current = Date.now();
      } else if (hasDetectedSpeechRef.current && lastSoundDetectedAtRef.current > 0) {
        const pauseTime = Date.now() - lastSoundDetectedAtRef.current;
        if (pauseTime >= 800) {
          finishAndSubmitVoice(latestTranscriptRef.current);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(checkLoop);
    };
    animFrameRef.current = requestAnimationFrame(checkLoop);

    // 7. Web Speech API en paralelo
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }
        const recognition = new SpeechRec();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          transcript = transcript.trim();
          if (transcript) {
            hasDetectedSpeechRef.current = true;
            lastSoundDetectedAtRef.current = Date.now();
            latestTranscriptRef.current = transcript;
            setLastSpeech(`"${transcript}"`);

            // Autodetección rápida: si hay pausa de 800ms tras hablar, procesar de inmediato
            if (speechDebounceTimerRef.current) {
              clearTimeout(speechDebounceTimerRef.current);
            }
            speechDebounceTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && latestTranscriptRef.current.trim()) {
                finishAndSubmitVoice(latestTranscriptRef.current);
              }
            }, 800);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRec error:', event.error);
          if (event.error === 'not-allowed') {
            setMicPermissionError('Permiso de micrófono bloqueado en el navegador.');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.warn('SpeechRec start error:', e);
      }
    }
  };

  // Procesamiento de voz con IA Gemini y acceso a base de datos del taller
  const handleVoiceInput = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    setLastSpeech(`"${trimmed}"`);

    // Consultar a /api/metis-chat con Gemini
    try {
      const workshopContext = {
        clients: clients.map(c => ({
          id: c.id,
          name: c.name,
          cif: c.cif,
          phone: c.phone,
          email: c.email,
          clientType: c.clientType,
          plates: c.plates || []
        })),
        documentsSummary: {
          totalDocuments: documents.length,
          invoicesEmitidasCount: documents.filter(d => d.type === 'factura').length,
          invoicesRecibidasCount: documents.filter(d => (d.type as any) === 'factura_recibida').length,
          budgetsCount: documents.filter(d => d.type === 'presupuesto' || d.type === 'budget').length,
          recentDocuments: documents.slice(-10).map(d => ({
            number: d.number,
            type: d.type,
            clientName: d.clientName,
            total: d.total,
            status: d.status,
            date: d.date
          }))
        },
        appointments: appointments.slice(0, 10).map(a => ({
          date: a.date,
          time: a.time,
          title: a.title,
          clientName: a.clientName,
          status: a.status
        })),
        reminders: []
      };

      const res = await fetch('/api/metis-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: trimmed,
          history: [],
          currentUser,
          activeProfile: selectedRole,
          employeeInfo: selectedRole === 'empleado' ? { name: 'Empleado', profession: 'Técnico Taller' } : null,
          workshopContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) {
          const reply = data.reply;
          // Acciones
          if (reply.includes('[ACTION:fullscreen]')) {
            if (onToggleFullscreen) onToggleFullscreen();
          }
          if (reply.includes('[ACTION:nav:facturacion:recibidas]')) {
            if (onNavigate) {
              onNavigate('page-facturacion', 'recibidas');
              setTimeout(() => onClose(), 1200);
            }
          }
          if (reply.includes('[ACTION:nav:facturacion:emitidas]')) {
            if (onNavigate) {
              onNavigate('page-facturacion', 'emitidas');
              setTimeout(() => onClose(), 1200);
            }
          }
          if (reply.includes('[ACTION:nav:clientes]')) {
            if (onNavigate) {
              onNavigate('page-clientes');
              setTimeout(() => onClose(), 1200);
            }
          }
          if (reply.includes('[ACTION:new-client]')) {
            if (onOpenNewClient) {
              onOpenNewClient();
              setTimeout(() => onClose(), 1200);
            }
          }
          if (reply.includes('[ACTION:new-budget]')) {
            if (onOpenNewBudget) {
              onOpenNewBudget();
              setTimeout(() => onClose(), 1200);
            }
          }
          if (reply.includes('[ACTION:scanner]')) {
            if (onOpenPlateScanner) {
              onOpenPlateScanner();
              setTimeout(() => onClose(), 1200);
            }
          }

          const cleanReply = reply.replace(/\[ACTION:[^\]]+\]/g, '').trim();
          speakResponse(cleanReply);
          return;
        }
      }
    } catch (err) {
      console.warn('Error en /api/metis-chat desde modo voz:', err);
    }

    handleLocalFallbackVoice(trimmed);
  };

  // Procesamiento local de reserva (fallback offline)
  const handleLocalFallbackVoice = (rawText: string) => {
    const q = rawText.toLowerCase().trim();

    // 0. CONSULTA SOBRE CLIENTES
    if (q.includes('cliente') || q.includes('clientes')) {
      if (q.includes('cuanto') || q.includes('cuánto') || q.includes('total') || q.includes('hay') || q.includes('tenemos') || q.includes('base de datos')) {
        speakResponse(`Actualmente tenemos ${clients.length} clientes registrados en el sistema del taller.`);
        return;
      }
    }

    // 1. COMANDO: PANTALLA COMPLETA
    if (q.includes('pantalla completa') || q.includes('pantalla grande') || q.includes('maximizar')) {
      speakResponse('Activando modo de pantalla completa.');
      if (onToggleFullscreen) {
        onToggleFullscreen();
      } else if (typeof document !== 'undefined') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 2. COMANDO: FACTURAS RECIBIDAS (De proveedores / compras / email)
    if (
      q.includes('facturas recibidas') ||
      q.includes('factura recibida') ||
      q.includes('recibidas') ||
      q.includes('facturas de compras') ||
      q.includes('facturas de proveedores') ||
      q.includes('gastos recibidos')
    ) {
      if (selectedRole === 'empleado') {
        speakResponse('Acceso restringido. Las facturas y gastos de proveedores están reservados al jefe de taller.');
        return;
      }
      speakResponse('Abriendo la sección de Facturas Recibidas.');
      if (onNavigate) {
        onNavigate('page-facturacion', 'recibidas');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 3. COMANDO: FACTURAS EMITIDAS
    if (
      q.includes('facturas emitidas') ||
      q.includes('factura emitida') ||
      q.includes('emitidas') ||
      q.includes('facturas a clientes')
    ) {
      if (selectedRole === 'empleado') {
        speakResponse('Acceso restringido. La facturación a clientes está reservada al jefe de taller.');
        return;
      }
      speakResponse('Abriendo la sección de Facturas Emitidas.');
      if (onNavigate) {
        onNavigate('page-facturacion', 'emitidas');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 4. COMANDO: FACTURAS DETECTADAS POR RASTREO / EMAIL
    if (
      q.includes('facturas detectadas') ||
      q.includes('facturas por rastreo') ||
      q.includes('facturas de email') ||
      q.includes('facturas de gmail') ||
      q.includes('rastreo de facturas')
    ) {
      if (selectedRole === 'empleado') {
        speakResponse('Acceso restringido al jefe de taller.');
        return;
      }
      speakResponse('Abriendo las facturas detectadas automáticamente por rastreo en tu email.');
      if (onOpenDetectedInvoices) {
        onOpenDetectedInvoices();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 5. COMANDO: FACTURAS GENERAL
    if (q.includes('factura') || q.includes('facturas') || q.includes('facturacion') || q.includes('facturación')) {
      if (selectedRole === 'empleado') {
        speakResponse('Acceso restringido. Los datos de facturación están reservados al jefe de taller.');
        return;
      }
      // Si pregunta cuántas hay
      if (q.includes('cuantas') || q.includes('cuántas') || q.includes('hay') || q.includes('tengo')) {
        const emitidasCount = documents.filter(d => d.type === 'factura').length;
        const recibidasCount = documents.filter(d => (d.type as any) === 'factura_recibida').length;
        speakResponse(`Tienes ${emitidasCount} facturas emitidas y ${recibidasCount} facturas recibidas de proveedores en el sistema.`);
        return;
      }

      speakResponse('Abriendo la sección de Facturas.');
      if (onNavigate) {
        onNavigate('page-facturacion');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 6. COMANDO: ESCANEAR MATRÍCULA / CÁMARA
    if (q.includes('escanear matrícula') || q.includes('escanear matricula') || q.includes('cámara') || q.includes('camara') || q.includes('escanear coche')) {
      speakResponse('Iniciando escáner de matrículas por cámara OCR.');
      if (onOpenPlateScanner) {
        onOpenPlateScanner();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 7. COMANDO: NUEVO PRESUPUESTO
    if (q.includes('nuevo presupuesto') || q.includes('crear presupuesto') || q.includes('hacer presupuesto')) {
      speakResponse('Abriendo creación de nuevo presupuesto.');
      if (onOpenNewBudget) {
        onOpenNewBudget();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 8. COMANDO: PRESUPUESTOS (Navegación o Consulta)
    if (q.includes('presupuesto') || q.includes('presupuestos')) {
      if (q.includes('cuantos') || q.includes('cuántos') || q.includes('hay')) {
        const budgetCount = documents.filter(d => d.type === 'presupuesto').length;
        speakResponse(`Actualmente hay ${budgetCount} presupuestos registrados en el taller.`);
        return;
      }
      speakResponse('Abriendo la sección de Presupuestos.');
      if (onNavigate) {
        onNavigate('page-presupuestos');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 9. COMANDO: CLIENTES
    if (q.includes('nuevo cliente') || q.includes('alta cliente') || q.includes('crear cliente')) {
      speakResponse('Abriendo formulario de alta de nuevo cliente.');
      if (onOpenNewClient) {
        onOpenNewClient();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    if (q.includes('cliente') || q.includes('clientes')) {
      speakResponse('Abriendo la cartera de clientes.');
      if (onNavigate) {
        onNavigate('page-clientes');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 10. COMANDO: EXPEDIENTES / TALLER
    if (q.includes('expediente') || q.includes('expedientes') || q.includes('taller') || q.includes('reparaciones') || q.includes('ordenes de trabajo')) {
      speakResponse('Abriendo expedientes y taller.');
      if (onNavigate) {
        onNavigate('page-expedientes');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 11. COMANDO: PROVEEDORES
    if (q.includes('proveedor') || q.includes('proveedores')) {
      speakResponse('Abriendo la lista de proveedores.');
      if (onNavigate) {
        onNavigate('page-proveedores');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 12. COMANDO: INCIDENCIAS
    if (q.includes('incidencia') || q.includes('incidencias')) {
      speakResponse('Abriendo el panel de incidencias.');
      if (onNavigate) {
        onNavigate('page-incidencias');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 13. COMANDO: BALANCES
    if (q.includes('balance') || q.includes('balances') || q.includes('informes')) {
      if (selectedRole === 'empleado') {
        speakResponse('Acceso restringido a los balances económicos del taller.');
        return;
      }
      speakResponse('Abriendo balances e informes contables.');
      if (onNavigate) {
        onNavigate('page-balances');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    // 14. COMANDO: CONFIGURACIÓN
    if (q.includes('configuracion') || q.includes('configuración') || q.includes('ajustes')) {
      speakResponse('Abriendo configuración del taller.');
      if (onNavigate) {
        onNavigate('page-configuracion');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
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

    // Consultas Fiscales AEAT (Autónomos vs Sociedades Limitadas, Modelos 303, 130, 200, 115, plazos y deducciones)
    const isSL = currentUser.businessType === 'empresa' ||
                 currentUser.fiscalAddress?.toLowerCase().includes('s.l') || 
                 currentUser.fullName?.toUpperCase().includes('S.L') || 
                 currentUser.fullName?.toUpperCase().includes('SOCIEDAD') || 
                 (currentUser.cif ? currentUser.cif.toUpperCase().startsWith('B') : false);

    const fiscalAdvice = getAeatFiscalAdvice(rawText, { 
      isEmployee: selectedRole === 'empleado', 
      isSL 
    });

    if (fiscalAdvice) {
      // Limpiar formato markdown para síntesis de voz natural
      const cleanVocalText = fiscalAdvice
        .replace(/[#*•_`]/g, '')
        .replace(/💡|🏛️|📅|🧾|🛡️|📌|✅|⚠️|⛔/g, '')
        .replace(/\n+/g, '. ')
        .trim();
      speakResponse(cleanVocalText);
      return;
    }

    // Respuesta adaptada inteligente
    speakResponse(
      `Entendido. Puedes pedirme abrir facturas recibidas, emitidas, presupuestos, clientes, poner pantalla completa, o consultarme dudas fiscales de la AEAT y procedimientos de taller.`
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
              ) : isTranscribing ? (
                <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
              ) : isListening ? (
                audioLevel >= 8 ? (
                  <div className="flex items-center gap-1">
                    {[0.5, 0.9, 1.2, 0.7, 1.0].map((m, idx) => {
                      const h = Math.max(6, Math.min(32, Math.round((audioLevel / 100) * 32 * m)));
                      return (
                        <div
                          key={idx}
                          className="w-1.5 bg-white rounded-full transition-all duration-75"
                          style={{ height: `${h}px` }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Mic className="w-10 h-10 text-white animate-pulse" />
                )
              ) : (
                <Sparkles className="w-9 h-9 text-white" />
              )}
            </div>
          </div>

          {/* Subtítulo dinámico fluido */}
          <div className="mt-6 text-center max-w-[280px]">
            {micPermissionError ? (
              <div className="bg-rose-500/20 border border-rose-400/40 rounded-xl p-2.5 backdrop-blur-md animate-in fade-in">
                <p className="text-[11px] text-rose-200 font-medium mb-1.5 leading-snug">
                  {micPermissionError}
                </p>
                <button
                  type="button"
                  onClick={startListening}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Habilitar Micrófono
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/90 font-medium leading-relaxed drop-shadow-sm min-h-[40px] flex items-center justify-center">
                {isActive ? (
                  isSpeaking ? (
                    `« ${lastSpeech} »`
                  ) : isTranscribing ? (
                    <span className="text-amber-300 font-bold animate-pulse">Procesando tu voz con IA...</span>
                  ) : isListening ? (
                    audioLevel >= 8 ? (
                      <span className="text-emerald-300 font-bold animate-pulse">🎤 Detectando tu voz...</span>
                    ) : (
                      <span className="text-[#38BDF8] animate-pulse">Te escucho... háblame con las manos libres</span>
                    )
                  ) : (
                    <span className="text-white/70">Habla con libertad o pulsa un botón rápido</span>
                  )
                ) : (
                  <span className="text-amber-200/80">Luz detenida. Pulsa reanudar para hablar con Metis</span>
                )}
              </p>
            )}
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
