import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, ShieldAlert, Bot, User, Clock, CheckCircle2, AlertCircle, Wrench, ShieldCheck, Trash2, LogOut, Landmark, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { AppUser, MetisMessage, Employee, GestarianDocument, Client, Appointment } from '../types';
import { getAeatFiscalAdvice } from '../data/aeatFiscalKnowledge';

interface MetisChatModalProps {
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

interface WorkshopReminder {
  id: string;
  text: string;
  createdAt: string;
  completed: boolean;
}

export const MetisChatModal: React.FC<MetisChatModalProps> = ({
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
  const [messages, setMessages] = useState<MetisMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy **Metis**, la asistente inteligente especializada en gestión de taller y asesoría tributaria para **${currentUser.fullName || 'DM CAR'}**.\n\nCuento con conocimientos normativos oficiales de la **Agencia Tributaria (AEAT)** para **Autónomos** y **Sociedades Limitadas (S.L.)**:\n- **Modelos Oficiales:** 303 (IVA), 130/131 (IRPF), 200/202 (Sociedades), 111/190 (Nóminas), 115/180 (Alquileres), 347 y 349.\n- **Gastos deducibles:** Recambios, pinturas, maquinaria, naves, vehículos y suministros.\n- **Normativa Veri*factu & Factura Electrónica B2B (Ley Antifraude / Crea y Crece)**.\n- **Comparativa Autónomo vs S.L.** y calendario oficial de presentaciones.\n\nTambién te ayudo con la operativa del taller (presupuestos, portal de clientes, órdenes de trabajo y consejos técnicos de chapa/pintura).\n\n¿Qué consulta deseas realizar?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Estados para reconocimiento de voz (micrófono) y respuesta por altavoz (voz)
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceResponseEnabled, setIsVoiceResponseEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasDetectedSpeechRef = useRef<boolean>(false);
  const lastSoundDetectedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Perfil que está interactuando: 'jefe' o ID de empleado
  const [activeProfile, setActiveProfile] = useState<'jefe' | string>('jefe');
  
  // Recordatorios activos durante la reparación
  const [reminders, setReminders] = useState<WorkshopReminder[]>([
    {
      id: 'rem_1',
      text: 'Comprobar secado de imprimación epoxi (Cabina 1)',
      createdAt: '11:30',
      completed: false,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Simular la lógica de avisos trimestrales
      if (currentUser.agencyEmail) {
        const checkQuarterlyAlerts = () => {
          const today = new Date();
          // Simulación estática para la demo (como si estuviéramos a día 20 de septiembre, a 10 días del cierre 30 de septiembre)
          // El 17 de septiembre ya está a 13 días.
          const msg1 = "🚨 **Cierre Trimestral Próximo:** Quedan pocos días para el cierre trimestral. Por favor, asegúrate de incorporar todas las facturas de gastos pendientes.";
          const msg2 = "📩 **Aviso de Envío Automático:** Mañana a las 10:00 se enviará el informe trimestral a la gestoría (" + currentUser.agencyEmail + "). Las facturas no incorporadas podrás incluirlas en el siguiente trimestre de acuerdo con la legislación vigente.";
          
          setMessages(prev => {
            const hasAlert = prev.some(m => m.id === 'q-alert');
            if (!hasAlert) {
              return [
                ...prev,
                {
                  id: 'q-alert',
                  role: 'assistant',
                  content: msg1,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
                {
                  id: 'q-alert-2',
                  role: 'assistant',
                  content: msg2,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
              ];
            }
            return prev;
          });
        };
        checkQuarterlyAlerts();
      }
    }
  }, [messages, isOpen, currentUser.agencyEmail]);

  // Escuchar tecla Escape para salir de Metis sin quedarse bloqueado
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentEmployee: Employee | undefined = 
    activeProfile !== 'jefe' 
      ? currentUser.employees?.find(e => e.id === activeProfile) 
      : undefined;

  const isEmployee = activeProfile !== 'jefe';

  const handleActionTag = (text: string) => {
    if (text.includes('[ACTION:fullscreen]')) {
      if (onToggleFullscreen) onToggleFullscreen();
    }
    if (text.includes('[ACTION:nav:facturacion:recibidas]')) {
      if (onNavigate) {
        onNavigate('page-facturacion', 'recibidas');
        setTimeout(() => onClose(), 1200);
      }
    }
    if (text.includes('[ACTION:nav:facturacion:emitidas]')) {
      if (onNavigate) {
        onNavigate('page-facturacion', 'emitidas');
        setTimeout(() => onClose(), 1200);
      }
    }
    if (text.includes('[ACTION:nav:clientes]')) {
      if (onNavigate) {
        onNavigate('page-clientes');
        setTimeout(() => onClose(), 1200);
      }
    }
    if (text.includes('[ACTION:new-client]')) {
      if (onOpenNewClient) {
        onOpenNewClient();
        setTimeout(() => onClose(), 1200);
      }
    }
    if (text.includes('[ACTION:new-budget]')) {
      if (onOpenNewBudget) {
        onOpenNewBudget();
        setTimeout(() => onClose(), 1200);
      }
    }
    if (text.includes('[ACTION:scanner]')) {
      if (onOpenPlateScanner) {
        onOpenPlateScanner();
        setTimeout(() => onClose(), 1200);
      }
    }
  };

  const cleanActionTags = (text: string): string => {
    return text.replace(/\[ACTION:[^\]]+\]/g, '').trim();
  };

  // Lógica local de respuesta inteligente (fallback o respuesta offline basada en datos reales del taller)
  const processQueryFallback = (userQuery: string): string => {
    const q = userQuery.toLowerCase();

    // 1. CONSULTA SOBRE CLIENTES (Pregunta del usuario en captura: ¿Cuántos clientes tenemos en la base de datos?)
    if (q.includes('cliente') || q.includes('clientes')) {
      if (
        q.includes('cuanto') ||
        q.includes('cuánto') ||
        q.includes('total') ||
        q.includes('numero') ||
        q.includes('número') ||
        q.includes('hay') ||
        q.includes('tenemos') ||
        q.includes('base de datos') ||
        q.includes('cartera')
      ) {
        const total = clients.length;
        if (total === 0) {
          return `📊 **Clientes en Base de Datos:**\n\nActualmente no hay clientes registrados en la base de datos de **${currentUser.fullName}**.\n\nPuedes dar de alta el primer cliente pulsando en *Nuevo Cliente* o diciéndome *"abrir nuevo cliente"*.`;
        }
        const sample = clients
          .slice(0, 6)
          .map(c => `• **${c.name}**${c.plates && c.plates.length ? ` (Matrícula: ${c.plates[0]})` : ''}${c.phone ? ` - 📞 ${c.phone}` : ''}`)
          .join('\n');

        return `📊 **Clientes en Base de Datos de ${currentUser.fullName}:**\n\nActualmente tenemos **${total} clientes** registrados en el sistema del taller.\n\nAquí tienes algunos de los clientes registrados:\n${sample}${total > 6 ? `\n\n*(Y ${total - 6} clientes más en el sistema).*` : ''}\n\nPuedes consultarme los datos de cualquier cliente específico o decirme *"ir a clientes"* para abrir la cartera completa.`;
      }
    }

    // 2. COMANDO: PANTALLA COMPLETA
    if (q.includes('pantalla completa') || q.includes('pantalla grande') || q.includes('maximizar')) {
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
      }, 1000);
      return `🖥️ **Modo Pantalla Completa Activado**\n\nHe activado el modo de pantalla completa para el taller. Cerrando el asistente para mostrarte la vista completa.`;
    }

    // 3. COMANDO: FACTURAS RECIBIDAS
    if (
      q.includes('facturas recibidas') ||
      q.includes('factura recibida') ||
      q.includes('recibidas') ||
      q.includes('facturas de compras') ||
      q.includes('facturas de proveedores') ||
      q.includes('gastos recibidos')
    ) {
      if (isEmployee) {
        return `⛔ **Acceso Restringido:** Las facturas de proveedores y gastos recibidos están reservados al perfil de Administrador / Jefe de taller.`;
      }
      if (onNavigate) {
        onNavigate('page-facturacion', 'recibidas');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
      return `📥 **Abriendo Facturas Recibidas**\n\nTe dirijo inmediatamente a la pestaña de **Facturas Recibidas** en la sección de Facturas para ver y gestionar todas las facturas de proveedores y gastos incorporados.`;
    }

    // 4. COMANDO: FACTURAS EMITIDAS
    if (
      q.includes('facturas emitidas') ||
      q.includes('factura emitida') ||
      q.includes('emitidas') ||
      q.includes('facturas a clientes')
    ) {
      if (isEmployee) {
        return `⛔ **Acceso Restringido:** La facturación a clientes está reservada al perfil de Administrador / Jefe de taller.`;
      }
      if (onNavigate) {
        onNavigate('page-facturacion', 'emitidas');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
      return `📤 **Abriendo Facturas Emitidas**\n\nTe dirijo a la pestaña de **Facturas Emitidas** a clientes.`;
    }

    // 5. COMANDO: FACTURAS DETECTADAS POR RASTREO / EMAIL
    if (
      q.includes('facturas detectadas') ||
      q.includes('facturas por rastreo') ||
      q.includes('facturas de email') ||
      q.includes('facturas de gmail') ||
      q.includes('rastreo de facturas')
    ) {
      if (isEmployee) {
        return `⛔ **Acceso Restringido:** El rastreo de facturas está reservado al Administrador.`;
      }
      if (onOpenDetectedInvoices) {
        onOpenDetectedInvoices();
      }
      setTimeout(() => {
        onClose();
      }, 1000);
      return `📧 **Abriendo Facturas Detectadas por Rastreo**\n\nAbriendo el listado de facturas detectadas automáticamente en tu correo electrónico con sus conceptos extraídos.`;
    }

    // 6. FILTRO DE SEGURIDAD ESTRICTO: EMPLEADOS NO PUEDEN ACCEDER A DATOS ECONÓMICOS
    const economicKeywords = [
      'factura', 'facturacion', 'facturación', 'cobro', 'cobros', 'abono', 'abonos',
      'balance', 'balances', 'cuenta', 'cuentas', 'beneficio', 'beneficios',
      'rendimiento', 'rendimientos', 'dinero', 'ingreso', 'ingresos', 'precio',
      'cuanto cobramos', 'cuánto cobramos', 'ganancia', 'ganancias', 'iva', 'irpf',
      'impuesto', 'impuestos', 'rentabilidad', 'margen', 'trimestre', 'trimestral',
      'cuanto se factura', 'cuánto se factura', 'total cobrado', 'caja'
    ];

    const asksEconomic = economicKeywords.some(kw => q.includes(kw));

    if (isEmployee && asksEconomic) {
      return `⛔ **Acceso Denegado por Política de Seguridad**\n\nComo empleado autorizado (**${currentEmployee?.name || 'Técnico'}**), no tienes permisos para consultar datos económicos, estados de cobro, facturación ni balances del taller.\n\nEstas consultas están reservadas estrictamente al perfil de **Administrador / Jefe de Taller** de **${currentUser.fullName}**.\n\nPuedes consultarme sobre:\n- Cómo dar de alta un cliente nuevo.\n- Cómo seguir la reparación de un vehículo en el Área de Clientes.\n- Cómo crear o verificar una Orden de Trabajo.\n- Consejos técnicos de chapa y pintura.\n- Recordatorios durante tu trabajo en el taller.`;
    }

    // 7. CONSULTAS Y NAVEGACIÓN A FACTURAS
    if (q.includes('factura') || q.includes('facturas') || q.includes('facturacion') || q.includes('facturación')) {
      if (q.includes('cuantas') || q.includes('cuántas') || q.includes('hay') || q.includes('tengo')) {
        const emitidasCount = documents.filter(d => d.type === 'factura').length;
        const recibidasCount = documents.filter(d => (d.type as any) === 'factura_recibida').length;
        return `📊 **Resumen de Facturas en Sistema:**\n- **Facturas Emitidas a Clientes:** ${emitidasCount}\n- **Facturas Recibidas de Proveedores:** ${recibidasCount}\n\nPuedes decirme *"muestra las facturas recibidas"* o *"muestra las facturas emitidas"* para acceder directamente.`;
      }

      if (onNavigate) {
        onNavigate('page-facturacion');
        setTimeout(() => onClose(), 1000);
      }
      return `💳 **Abriendo la sección de Facturas**\n\nNavegando a la pantalla de Facturas del taller.`;
    }

    // 8. DETECCIÓN DE RECORDATORIOS
    if (q.includes('recuerda') || q.includes('acuérdate') || q.includes('recordar') || q.includes('avísame') || q.includes('anota')) {
      const reminderText = userQuery.replace(/^(recuérdame|recuerda|acuérdate de|por favor recuerda|anota que|anota)\s*/i, '').trim();
      if (reminderText) {
        setReminders(prev => [
          ...prev,
          {
            id: `rem_${Date.now()}`,
            text: reminderText,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: false,
          }
        ]);
        return `✅ **¡Anotado en tus recordatorios de taller!**\n\nHe guardado: *" ${reminderText} "*.\n\nPuedes ver la lista en el panel superior de este asistente mientras sigues trabajando.`;
      }
    }

    // 9. CONSULTAS SOBRE CITAS
    if (q.includes('cita') || q.includes('citas') || q.includes('agenda')) {
      const totalCitas = appointments.length;
      if (totalCitas === 0) {
        return `📅 **Agenda de Citas:**\n\nActualmente no hay citas programadas en el taller de **${currentUser.fullName}**.`;
      }
      const upcoming = appointments.slice(0, 4).map(a => `• **${a.date} ${a.time || ''}**: ${a.title} (${a.clientName})`).join('\n');
      return `📅 **Citas Programadas (${totalCitas} en total):**\n\n${upcoming}\n\nPuedes ver la agenda completa en la sección Citas.`;
    }

    // 10. CONSULTAS SOBRE PRESUPUESTOS
    if (q.includes('presupuesto') || q.includes('generar presupuesto') || q.includes('hacer presupuesto')) {
      const budgetsCount = documents.filter(d => d.type === 'presupuesto' || d.type === 'budget').length;
      if (isEmployee && currentEmployee?.permissions?.createBudgets === false) {
        return `⚠️ **Permiso Restringido:** Tu usuario actual no tiene asignado el permiso de *Emisión de Presupuestos*.`;
      }
      return `📋 **Presupuestos de Taller (Total en sistema: ${budgetsCount}):**\n\n1. Para crear uno nuevo, pulsa **+ Nuevo Presupuesto** o escanea la matrícula con la cámara OCR.\n2. Selecciona el cliente (tienes ${clients.length} disponibles) y añade las partidas de chapa y pintura.\n3. Se calcula automáticamente con IVA 21% y se puede enviar al cliente al instante.`;
    }

    // 11. CONSEJOS TÉCNICOS DE CHAPA Y PINTURA
    const isTechnicalQuery = q.includes('chapa') || q.includes('pintura') || q.includes('barniz') || q.includes('secado') || q.includes('lija') || q.includes('masilla') || q.includes('imprimacion') || q.includes('imprimación') || q.includes('catalizador') || q.includes('color') || q.includes('decapar') || q.includes('pulir');

    if (isTechnicalQuery) {
      if (currentUser.metisTechnicalAdviceEnabled === false) {
        return `⚠️ **Asesoramiento Técnico Desactivado**\n\nLa opción de consejos técnicos de chapa y pintura está deshabilitada en la configuración de la empresa.`;
      }

      if (q.includes('barniz') || q.includes('secado')) {
        return `🎨 **Consejo Técnico de Pintura (Barniz y Secado):**\n\n- **Barnices UHS / Alto Sólidos:** Proporción habitual 2:1 con catalizador medio + 5-10% de diluyente acrílico según temperatura ambiente (20°C standard).\n- **Tiempos de evaporación (Flash-off):** Deja evaporar entre manos de 10 a 15 minutos hasta que esté mate antes de hornear.\n- **Ciclo de cabina:** 30 minutos a 60°C de temperatura de chapa para un curado óptimo antes del pulido.`;
      }

      if (q.includes('masilla') || q.includes('lija')) {
        return `🔨 **Consejo Técnico de Chapa (Masillado y Lijado):**\n\n- **Catalización:** Mezcla masilla de poliéster con un 2% a 3% de peróxido de benzoilo (evita el exceso para prevenir sombras o sangrado en la pintura).\n- **Granos recomendados:** Inicia el desbastado con lija P80/P120, afina la masilla con P180/P240 y remata la zona de transición con P320 antes de fondear con aparejo.`;
      }

      return `🔧 **Consejo Técnico de Taller DM CAR:**\n\nPara trabajos de carrocería y pintura de alta calidad:\n- Asegura la desgasificación y limpieza con desengrasante antisiliconas antes de meter la pieza en cabina.\n- Revisa la presión del manómetro de la pistola (2.0 a 2.2 bar para barniz HVLP).`;
    }

    // 12. CONSULTAS FISCALES Y TRIBUTARIAS AEAT
    const isSL = currentUser.businessType === 'empresa' ||
                 currentUser.fiscalAddress?.toLowerCase().includes('s.l') || 
                 currentUser.fullName?.toUpperCase().includes('S.L') || 
                 currentUser.fullName?.toUpperCase().includes('SOCIEDAD') || 
                 (currentUser.cif ? currentUser.cif.toUpperCase().startsWith('B') : false);

    const fiscalAdvice = getAeatFiscalAdvice(userQuery, { isEmployee, isSL });
    if (fiscalAdvice) {
      return fiscalAdvice;
    }

    // 13. RESPUESTA GENERAL CONTEXTUALIZADA CON DATOS REALES
    return `Entendido. Como asistente de taller de **${currentUser.fullName}**, tengo acceso en tiempo real a tus **${clients.length} clientes**, **${documents.length} documentos** y **${appointments.length} citas**.\n\nPuedes preguntarme por:\n- 👥 **Clientes:** Número de clientes, vehículos, teléfonos o expedientes.\n- 📋 **Gestión de Taller:** Presupuestos, facturas recibidas y emitidas.\n- 🏛️ **Consultas Fiscales AEAT:** Modelos 303, 130, 200, gastos deducibles y Veri*Factu.\n- 🚗 **Chapa y Pintura:** Consejos técnicos, tiempos de secado y órdenes de trabajo.\n\n¿En qué te puedo ayudar ahora mismo?`;
  };

  // Limpieza y detención de voz al cerrar o desmontar
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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // Limpieza de formato markdown y emojis para que la voz en el altavoz suene limpia y natural
  const cleanMarkdownForSpeech = (rawText: string): string => {
    return rawText
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
  };

  // Reproducir voz por el altavoz del dispositivo (motor dual: Web Speech nativo + Servidor TTS para compatibilidad total en Android Chrome)
  const speakText = async (text: string) => {
    if (typeof window === 'undefined') return;
    stopSpeaking();

    const cleaned = cleanMarkdownForSpeech(text);
    if (!cleaned) return;

    setIsSpeaking(true);
    let browserSpoke = false;

    // 1. Intentar SpeechSynthesis del navegador
    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang === 'es-ES' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Monica') || v.name.includes('Jorge') || v.name.includes('Spanish')))
          || voices.find(v => v.lang.startsWith('es'));

        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }

        utterance.onstart = () => {
          browserSpoke = true;
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
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

    // 2. Reproductor de audio mediante endpoint TTS (imprescindible en Android Chrome donde la síntesis web tras fetch() suele ser silenciada)
    try {
      const res = await fetch('/api/metis-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audio) {
          // Si el sintetizador del navegador ya empezó a hablar activamente, dejamos que termine sin superposición
          if (window.speechSynthesis && window.speechSynthesis.speaking && browserSpoke) {
            return;
          }

          if (!audioPlayerRef.current) {
            audioPlayerRef.current = new Audio();
          }

          const player = audioPlayerRef.current;
          player.src = `data:${data.mimeType || 'audio/mpeg'};base64,${data.audio}`;
          player.onplay = () => setIsSpeaking(true);
          player.onended = () => setIsSpeaking(false);
          player.onerror = () => setIsSpeaking(false);

          await player.play().catch((playErr) => {
            console.warn('Audio play error en altavoz:', playErr);
          });
        }
      }
    } catch (ttsErr) {
      console.warn('Error solicitando audio TTS al servidor:', ttsErr);
    }
  };

  // Enviar mensaje unificado (por texto o por voz), siempre escribiendo en el chat y respondiendo con voz si está activo
  const sendMessage = async (textToSend: string, shouldSpeak: boolean = isVoiceResponseEnabled) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Si Metis estaba hablando, silenciarla para escuchar o procesar el nuevo mensaje
    stopSpeaking();

    const userMsg: MetisMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    lastTranscriptRef.current = '';
    setIsTyping(true);

    try {
      let replyContent = '';

      // Preparar el resumen estructurado del taller en tiempo real para Gemini
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
        reminders: reminders.map(r => ({
          text: r.text,
          createdAt: r.createdAt,
          completed: r.completed
        }))
      };

      try {
        const res = await fetch('/api/metis-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userQuery: trimmed,
            history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            currentUser,
            activeProfile,
            employeeInfo: currentEmployee ? {
              name: currentEmployee.name,
              profession: currentEmployee.profession,
              permissions: currentEmployee.permissions
            } : null,
            workshopContext
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.reply) {
            replyContent = data.reply;
          }
        }
      } catch (apiErr) {
        console.warn('Error llamando a /api/metis-chat, usando fallback:', apiErr);
      }

      if (!replyContent) {
        replyContent = processQueryFallback(trimmed);
      }

      // Ejecutar directivas de acción
      handleActionTag(replyContent);
      const cleanReply = cleanActionTags(replyContent);

      const assistantMsg: MetisMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: cleanReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);

      if (shouldSpeak && isVoiceResponseEnabled) {
        speakText(cleanReply);
      }
    } catch (err) {
      console.error('Error general en sendMessage:', err);
      const fallbackText = processQueryFallback(trimmed);
      const fallbackMsg: MetisMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setIsTyping(false);
      if (shouldSpeak && isVoiceResponseEnabled) {
        speakText(fallbackText);
      }
    }
  };

  // Finalizar escucha y enviar a Metis (sea por Web Speech API o mediante transcripción multimodal Gemini)
  const finishAndSubmitSpeech = async () => {
    if (!isListeningRef.current) return;
    
    // Texto detectado en tiempo real por Web Speech API
    const fastText = (lastTranscriptRef.current || input).trim();
    
    // Detener la captura de hardware
    stopListening();

    if (fastText) {
      // Éxito inmediato por reconocimiento del navegador (0 segundos de espera)
      sendMessage(fastText, true);
      return;
    }

    // Si Web Speech API no escribió nada (en iframes o navegadores que bloquean speech-api de Google),
    // transcribimos el audio grabado por MediaRecorder usando el modelo especializado gemini-3.5-transcribe
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
          const transcribedText = data.text.trim();
          setInput(transcribedText);
          sendMessage(transcribedText, true);
        } else {
          setVoiceError('No se pudo transcribir la voz o el volumen fue muy bajo. Por favor, pulsa el micrófono y habla de nuevo.');
        }
      } catch (err: any) {
        console.error('Error al transcribir audio con Gemini:', err);
        setVoiceError('No se pudo procesar el audio: ' + (err.message || 'error de conexión'));
      } finally {
        setIsTranscribing(false);
      }
    } else {
      setIsListening(false);
    }
  };

  // Reconocimiento de voz mediante micrófono con subida rápida tras hablar
  const startListening = async () => {
    setVoiceError(null);
    stopSpeaking();

    // 1. Desbloquear audio player y síntesis en el gesto del usuario para que Android Chrome permita reproducir el altavoz
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }

    // 2. Solicitar permiso y mantener activo el flujo de audio del micrófono
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador incompatible con captura de audio');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;
    } catch (err: any) {
      console.warn('Error accediendo al micrófono:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError('Permiso de micrófono bloqueado. Haz clic en el candado de la barra de tu navegador y selecciona "Permitir micrófono".');
      } else {
        setVoiceError('No se pudo acceder al micrófono: ' + (err.message || 'comprueba la conexión del micro'));
      }
      setIsListening(false);
      return;
    }

    // 3. Conectar AudioContext y AnalyserNode para medir volumen real y visualizar ondas sonoras
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (e) {
      console.warn('AnalyserNode no inicializado:', e);
    }

    // 4. Iniciar MediaRecorder para grabar el audio del usuario como respaldo infalible
    audioChunksRef.current = [];
    try {
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
          else mimeType = '';
        }
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(150);
        mediaRecorderRef.current = recorder;
      }
    } catch (e) {
      console.warn('MediaRecorder error:', e);
    }

    // 5. Iniciar estados de escucha
    isListeningRef.current = true;
    setIsListening(true);
    hasDetectedSpeechRef.current = false;
    lastSoundDetectedAtRef.current = 0;
    lastTranscriptRef.current = '';

    // 6. Bucle en tiempo real de análisis de nivel de audio y pausa breve de silencio
    const checkAudioLevel = () => {
      if (!isListeningRef.current) return;

      let currentLevel = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        currentLevel = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(currentLevel);
      }

      // Si detecta sonido de voz real (umbral 14 para evitar disparos por estática o ruido ambiental de fondo)
      if (currentLevel >= 14) {
        hasDetectedSpeechRef.current = true;
        lastSoundDetectedAtRef.current = Date.now();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (hasDetectedSpeechRef.current && lastSoundDetectedAtRef.current > 0) {
        // El usuario habló y ahora lleva una pequeña pausa sin hablar
        const silentDuration = Date.now() - lastSoundDetectedAtRef.current;
        if (silentDuration >= 800) {
          // Tras 800ms de pausa: enviar automáticamente a Metis
          finishAndSubmitSpeech();
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };
    animFrameRef.current = requestAnimationFrame(checkAudioLevel);

    // 7. En paralelo, iniciar Web Speech API si el navegador lo soporta para transcripción en vivo
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          transcript = transcript.trim();

          if (transcript) {
            setInput(transcript);
            lastTranscriptRef.current = transcript;
            hasDetectedSpeechRef.current = true;
            lastSoundDetectedAtRef.current = Date.now();

            // Autodetección rápida: si el usuario hace una pausa de 800ms tras hablar, enviar inmediatamente
            if (speechDebounceTimerRef.current) {
              clearTimeout(speechDebounceTimerRef.current);
            }
            speechDebounceTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && lastTranscriptRef.current.trim()) {
                finishAndSubmitSpeech();
              }
            }, 800);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Error en SpeechRecognition:', event.error);
          if (event.error === 'not-allowed') {
            setVoiceError('Permiso de micrófono bloqueado en el navegador.');
          }
          // No detenemos la escucha porque MediaRecorder sigue grabando para el backend Gemini
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.warn('SpeechRecognition no pudo iniciarse:', err);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      finishAndSubmitSpeech();
    } else {
      startListening();
    }
  };

  // Detener voz y micrófono si se cierra o desmonta
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopSpeaking();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isListening) {
      stopListening();
    }
    sendMessage(input, isVoiceResponseEnabled);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#FAF9F6] border border-[#CBD5E1] rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabecera de Metis */}
        <div className="bg-[#0F2942] text-white px-5 py-4 flex items-center justify-between border-b border-[#1E3A8A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F2942] border-2 border-white flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.7)] text-sm font-black text-[#38BDF8]">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-wide">Metis</h3>
                <span className="px-2 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold uppercase rounded-full border border-[#38BDF8]/40">
                  Especialista Taller
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {currentUser.fullName} • {currentUser.specialty || 'Chapa y Pintura'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón de Altavoz para activar/desactivar respuesta por voz */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setIsVoiceResponseEnabled(prev => !prev);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isVoiceResponseEnabled
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40 hover:bg-[#38BDF8]/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
              title={isVoiceResponseEnabled ? 'Respuesta por voz en el altavoz activada (clic para silenciar)' : 'Respuesta por voz silenciada (clic para activar)'}
            >
              {isVoiceResponseEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="hidden md:inline text-[11px]">Altavoz Activo</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden md:inline text-[11px]">Altavoz Mudo</span>
                </>
              )}
            </button>

            {/* Selector de Perfil / Rol para pruebas */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
              <select
                value={activeProfile}
                onChange={(e) => setActiveProfile(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer font-medium"
                title="Cambiar perfil para comprobar permisos de Metis"
              >
                <option value="jefe" className="text-[#0F172A]">Jefe / Administrador</option>
                {currentUser.employees?.map(emp => (
                  <option key={emp.id} value={emp.id} className="text-[#0F172A]">
                    Empleado: {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Prominente para Salir de Metis */}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Salir de Metis"
            >
              <X className="w-4 h-4" />
              <span>Salir de Metis</span>
            </button>
          </div>
        </div>

        {/* Barra de Recordatorios Activos de Taller */}
        {reminders.length > 0 && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A8A] shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>Recordatorios de trabajo:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {reminders.map(rem => (
                <div 
                  key={rem.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${
                    rem.completed 
                      ? 'bg-gray-100 text-gray-500 border-gray-200 line-through' 
                      : 'bg-white text-[#0F2942] border-[#BFDBFE] shadow-xs'
                  }`}
                >
                  <button 
                    onClick={() => setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, completed: !r.completed } : r))}
                    className="hover:text-emerald-600"
                  >
                    <CheckCircle2 className={`w-3 h-3 ${rem.completed ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </button>
                  <span>{rem.text}</span>
                  <button 
                    onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zona de Mensajes */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#0F2942] border border-[#38BDF8] flex items-center justify-center text-[11px] font-black text-[#38BDF8] shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    isUser
                      ? 'bg-[#0F2942] text-white rounded-br-xs'
                      : 'bg-white text-[#1E293B] border border-[#E2E8F0] shadow-xs rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed">
                    {m.content}
                  </div>
                  <div
                    className={`text-[10px] mt-1.5 flex items-center justify-between gap-2 ${
                      isUser ? 'text-white/60 justify-end' : 'text-[#94A3B8]'
                    }`}
                  >
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => speakText(m.content)}
                        className="hover:text-[#0F2942] text-[#64748B] flex items-center gap-1 transition-colors text-[10px] font-semibold cursor-pointer"
                        title="Escuchar respuesta por el altavoz"
                      >
                        <Volume2 className="w-3 h-3 text-[#38BDF8]" />
                        <span>Escuchar voz</span>
                      </button>
                    )}
                    <span className="ml-auto">{m.timestamp}</span>
                  </div>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#334155] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {isEmployee ? (currentEmployee?.name[0] || 'E') : 'J'}
                  </div>
                )}
              </div>
            );
          })}
          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-[#64748B]">
              <div className="w-8 h-8 rounded-full bg-[#0F2942] flex items-center justify-center text-[10px] font-black text-[#38BDF8]">
                AI
              </div>
              <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Metis está respondiendo...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        <div className="px-4 py-2 bg-white/70 border-t border-[#E2E8F0] flex gap-2 overflow-x-auto text-[11px]">
          <span className="text-[#64748B] font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#38BDF8]" />
            Sugerencias:
          </span>
          <button
            type="button"
            onClick={() => setInput('¿Qué obligaciones tributarias tiene un autónomo vs una Sociedad Limitada en la AEAT?')}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full text-amber-900 font-medium shrink-0 transition-colors flex items-center gap-1"
          >
            <Landmark className="w-3 h-3 text-amber-600" />
            Autónomo vs S.L.
          </button>
          <button
            type="button"
            onClick={() => setInput('¿Cuáles son los plazos y modelos trimestrales de la AEAT (303, 130, 200, 115)?')}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-full text-sky-900 font-medium shrink-0 transition-colors flex items-center gap-1"
          >
            <Landmark className="w-3 h-3 text-sky-600" />
            Modelos AEAT y Plazos
          </button>
          <button
            type="button"
            onClick={() => setInput('¿Qué gastos de pintura, recambios y maquinaria son deducibles en el taller?')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-full text-emerald-900 font-medium shrink-0 transition-colors"
          >
            Gastos deducibles taller
          </button>
          <button
            type="button"
            onClick={() => setInput('¿Qué exige la normativa Veri*factu y la Ley Antifraude para facturas de taller?')}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-full text-purple-900 font-medium shrink-0 transition-colors"
          >
            Veri*factu y Factura Electrónica
          </button>
          <button
            type="button"
            onClick={() => setInput('¿Cómo se genera un presupuesto de taller?')}
            className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-full text-[#0F2942] font-medium shrink-0 transition-colors"
          >
            Generar presupuesto
          </button>
          <button
            type="button"
            onClick={() => setInput('¿Cómo ve el cliente el estado de su vehículo en el área de clientes?')}
            className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-full text-[#0F2942] font-medium shrink-0 transition-colors"
          >
            Área de clientes
          </button>
        </div>

        {/* Aviso de error de micrófono si ocurre */}
        {voiceError && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <span className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="shrink-0">⚠️</span>
              <span className="truncate">{voiceError}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={startListening}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Permitir Micrófono
              </button>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="text-amber-900 hover:text-amber-700 font-bold px-1 cursor-pointer"
                title="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Banner animado cuando el micrófono o la transcripción están activos */}
        {(isListening || isTranscribing) && (
          <div className="px-4 py-2 bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-950 animate-in fade-in">
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>

              {/* Indicador de ecualizador / volumen de voz en tiempo real */}
              <div
                className="flex items-center gap-0.5 h-3.5 px-1.5 bg-white/80 rounded-md border border-rose-200 shrink-0"
                title={`Nivel de audio del micrófono: ${audioLevel}%`}
              >
                {[0.4, 0.7, 1.0, 0.6, 0.8].map((mult, idx) => {
                  const barHeight = Math.max(3, Math.min(14, Math.round((audioLevel / 100) * 14 * mult)));
                  return (
                    <span
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        audioLevel >= 8 ? 'bg-rose-600' : 'bg-slate-300'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  );
                })}
              </div>

              {isTranscribing ? (
                <span className="font-bold text-rose-900 shrink-0 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  ⚡ Procesando audio con IA ultra-rápida...
                </span>
              ) : (
                <span className="font-bold text-rose-900 shrink-0">
                  {audioLevel >= 14 ? '🎤 Hablando:' : '🎤 Escuchando:'}
                </span>
              )}

              <span className="text-[#334155] italic truncate max-w-xs sm:max-w-md">
                {input.trim()
                  ? `"${input}"`
                  : isTranscribing
                    ? 'Transcribiendo audio...'
                    : audioLevel >= 14
                      ? 'Detectando tu voz...'
                      : 'Habla al micro... Se enviará automáticamente o pulsa Enviar ahora'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isListening && (
                <button
                  type="button"
                  onClick={finishAndSubmitSpeech}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-sm animate-pulse"
                  title="Enviar de inmediato sin esperar la pausa"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar ahora ⚡</span>
                </button>
              )}
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer px-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Input de Envío */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-[#CBD5E1] flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-[#475569] border border-[#CBD5E1] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Salir de Metis"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? "🎤 Escuchando... El texto se enviará tras 1 segundo de pausa"
                : isEmployee 
                  ? `Pregunta a Metis (${currentEmployee?.name || 'Empleado'})...` 
                  : "Pregunta a Metis sobre cualquier asunto del taller, presupuestos o técnica..."
            }
            className={`flex-1 px-4 py-2.5 border rounded-xl text-sm text-[#0F172A] outline-none transition-all ${
              isListening
                ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-200'
                : 'bg-[#F8F9FA] border-[#CBD5E1] focus:border-[#0F2942] focus:bg-white'
            }`}
          />

          {/* Botón Silenciar Altavoz si Metis está hablando */}
          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer animate-pulse"
              title="Metis está respondiendo por el altavoz. Pulsa para silenciar"
            >
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span className="hidden md:inline">Silenciar</span>
            </button>
          )}

          {/* Botón de Micrófono para Entrada de Voz */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer border ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-[#0F2942] border-[#CBD5E1]'
            }`}
            title={
              isListening 
                ? 'Micrófono activo (pausa de 1s para enviar). Pulsa para detener o enviar ahora' 
                : 'Pulsar para hablar por voz con Metis'
            }
            aria-label="Introducir texto por voz con micrófono"
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 text-white animate-bounce" />
                <span className="hidden sm:inline text-[11px] font-bold">Escuchando</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-[#0F2942]" />
                <span className="hidden sm:inline text-[11px]">Voz</span>
              </>
            )}
          </button>

          {/* Botón Enviar */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 sm:px-5 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] disabled:bg-[#94A3B8] text-white rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Enviar mensaje a Metis"
          >
            <span className="hidden sm:inline">Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
