import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, ShieldAlert, Bot, User, Clock, CheckCircle2, AlertCircle, Wrench, ShieldCheck, Trash2, LogOut } from 'lucide-react';
import { AppUser, MetisMessage, Employee } from '../types';

interface MetisChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
}

interface WorkshopReminder {
  id: string;
  text: string;
  createdAt: string;
  completed: boolean;
}

export const MetisChatModal: React.FC<MetisChatModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<MetisMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy **Metis**, la asistente inteligente especializada en el taller **${currentUser.fullName || 'DM CAR'}**.\n\nPuedo ayudarte con los procedimientos de la aplicación (crear presupuestos, dar de alta clientes, estados de cobro en el panel de facturación, seguimiento de reparaciones para clientes...) o acompañarte durante la reparación recordando notas técnicas y tiempos de trabajo.\n\n¿En qué te puedo ayudar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
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

  if (!isOpen) return null;

  const currentEmployee: Employee | undefined = 
    activeProfile !== 'jefe' 
      ? currentUser.employees?.find(e => e.id === activeProfile) 
      : undefined;

  const isEmployee = activeProfile !== 'jefe';

  // Lógica de respuesta inteligente especializada
  const processQuery = (userQuery: string): string => {
    const q = userQuery.toLowerCase();

    // 1. FILTRO DE SEGURIDAD ESTRICTO: EMPLEADOS NO PUEDEN ACCEDER A DATOS ECONÓMICOS
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

    // 2. DETECCIÓN DE RECORDATORIOS
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

    // 3. CONSULTAS SOBRE PRESUPUESTOS
    if (q.includes('presupuesto') || q.includes('generar presupuesto') || q.includes('hacer presupuesto')) {
      if (isEmployee && currentEmployee?.permissions?.createBudgets === false) {
        return `⚠️ **Permiso Restringido:** Tu usuario actual no tiene asignado el permiso de *Emisión de Presupuestos*. No obstante, el procedimiento en GESTARIAN es:\n\n1. Ve a la pantalla **Presupuestos** o usa el escáner de matrículas.\n2. Pulsa el botón **+ Nuevo Presupuesto**.\n3. Selecciona el cliente y añade las partidas (mano de obra de chapa, pintura, recambios).\n4. Se calcula automáticamente con IVA 21% y serie correlativa.`;
      }
      return `📋 **Cómo generar un presupuesto en GESTARIAN:**\n\n1. **Acceso:** Desde el Menú de inicio, navega a la sección **Presupuestos** o pulsa **+ Nuevo Presupuesto**.\n2. **Identificación rápida:** En talleres de automoción, puedes usar la cámara en el footer de inicio para escanear la matrícula con OCR ALPR, lo que abrirá el presupuesto pre-rellenado con el vehículo.\n3. **Datos del Cliente:** Selecciona un cliente de tu cartera o pulsa *+ Nuevo Cliente*.\n4. **Partidas del Taller:** Añade mano de obra de chapa, preparación, aplicación de fondo/pintura y piezas de recambio con sus precios.\n5. **Firma y Aceptación:** Puedes descargarlo en formato estándar A4 oficial, compartirlo o convertirlo en factura con un solo clic en cuanto el cliente dé su aprobación.`;
    }

    // 4. CONSULTAS SOBRE ALTA DE CLIENTES
    if (q.includes('alta cliente') || q.includes('nuevo cliente') || q.includes('dar de alta') || q.includes('registrar cliente')) {
      return `👤 **Cómo dar de alta un nuevo cliente:**\n\n1. En el Menú de inicio, viaja a la pantalla **Clientes**.\n2. Pulsa en **+ Nuevo Cliente** o accede a la *Cartera de Clientes*.\n3. Completa los datos: Nombre o Razón Social, CIF/NIF, Teléfono, Email y Dirección fiscal.\n4. **Para talleres (Muy importante):** Añade la **matrícula** del vehículo del cliente. Así, cuando el vehículo entre al taller y uses la cámara OCR, el sistema vinculará la orden de trabajo directamente con su ficha.`;
    }

    // 5. CONSULTAS SOBRE PANEL DE CONTROL DE COBROS (SOLO JEFE)
    if (q.includes('cobro') || q.includes('panel de control') || q.includes('abono') || q.includes('estado de factura') || q.includes('facturacion') || q.includes('facturación')) {
      return `💳 **Panel de Control de Cobros (Sección Facturación):**\n\n1. **Ubicación:** Entra en la página **Facturación** desde el menú principal.\n2. **Panel Superior:** En la parte superior verás el resumen consolidado de cobros (total facturado, facturas confirmadas y pendientes de cobro).\n3. **Pestañas Emitidas / Recibidas:** Dispones de dos pestañas para separar tus facturas emitidas a clientes y las facturas recibidas de proveedores.\n4. **Detalle del Expediente:** Al pulsar sobre cualquier tarjeta de factura, se abre el control con su número de expediente y debajo la factura desplegada en formato A4 listo para impresión o envío tributario.`;
    }

    // 6. CONSULTAS SOBRE PORTAL DE CLIENTES Y SEGUIMIENTO DE REPARACIÓN
    if (q.includes('cliente') && (q.includes('portal') || q.includes('reparado') || q.includes('reparacion') || q.includes('reparación') || q.includes('vehiculo') || q.includes('vehículo') || q.includes('estado') || q.includes('expediente'))) {
      return `🚗 **Arquitectura del Portal de Clientes y Seguimiento:**\n\n1. **Portal de Usuario (Esta Aplicación):** Es el panel de control del taller para gestionar expedientes, presupuestos, reparaciones y personal.\n\n2. **Portal de Clientes (Área Externa para Clientes):**\n   - **Desde la web:** El cliente puede entrar desde la página principal de **gestarian.com** pulsando en *Área de Clientes* con su matrícula o número de expediente.\n   - **Enlace con el Presupuesto:** Cuando envías un presupuesto, el mensaje incluye el enlace directo de seguimiento de su expediente vinculado en tiempo real.\n   - **Descarga de la App:** En ese mismo mensaje se envía el enlace de descarga de la app del Portal de Clientes:\n     • Por **WhatsApp** si el destinatario es un particular.\n     • Por **Email** si es una empresa (sociedad con CIF).\n\n3. **Qué ve el cliente en su portal:**\n   - Estado del vehículo (Pendiente, En Ejecución, Finalizado).\n   - Desglose del presupuesto y aprobación online.\n   - Descarga de facturas oficiales emitidas.`;
    }

    // 7. CONSEJOS TÉCNICOS DE CHAPA Y PINTURA
    const isTechnicalQuery = q.includes('chapa') || q.includes('pintura') || q.includes('barniz') || q.includes('secado') || q.includes('lija') || q.includes('masilla') || q.includes('imprimacion') || q.includes('imprimación') || q.includes('catalizador') || q.includes('color') || q.includes('decapar') || q.includes('pulir');

    if (isTechnicalQuery) {
      if (currentUser.metisTechnicalAdviceEnabled === false) {
        return `⚠️ **Asesoramiento Técnico Desactivado**\n\nLa opción de consejos técnicos de chapa y pintura está deshabilitada en la configuración de la empresa. El Administrador puede reactivarla desde *Configuración > Personalización > Asistente Metis*.`;
      }

      if (q.includes('barniz') || q.includes('secado')) {
        return `🎨 **Consejo Técnico de Pintura (Barniz y Secado):**\n\n- **Barnices UHS / Alto Sólidos:** Proporción habitual 2:1 con catalizador medio + 5-10% de diluyente acrílico según temperatura ambiente (20°C standard).\n- **Tiempos de evaporación (Flash-off):** Deja evaporar entre manos de 10 a 15 minutos hasta que esté mate antes de hornear.\n- **Ciclo de cabina:** 30 minutos a 60°C de temperatura de chapa para un curado óptimo antes del pulido.`;
      }

      if (q.includes('masilla') || q.includes('lija')) {
        return `🔨 **Consejo Técnico de Chapa (Masillado y Lijado):**\n\n- **Catalización:** Mezcla masilla de poliéster con un 2% a 3% de peróxido de benzoilo (evita el exceso para prevenir sombras o sangrado en la pintura).\n- **Granos recomendados:** Inicia el desbastado con lija P80/P120, afina la masilla con P180/P240 y remata la zona de transición con P320 antes de fondear con aparejo.\n- **Aparejo 4:1:** Aplica 2 o 3 manos respetando el flash-off y lija al agua con P800 o en seco con P400/P500 para el color.`;
      }

      return `🔧 **Consejo Técnico de Taller DM CAR:**\n\nPara trabajos de carrocería y pintura de alta calidad:\n- Asegura la desgasificación y limpieza con desengrasante antisiliconas antes de meter la pieza en cabina.\n- Revisa la presión del manómetro de la pistola (2.0 a 2.2 bar para barniz HVLP).\n- Si necesitas que te avise con un temporizador o recuerde la referencia del color, solo dímelo ("Metis, recuerda comprobar la aleta derecha a las 12:30").`;
    }

    // 8. CONSULTAS DE BALANCES O INFORMES (SOLO JEFE)
    if (q.includes('balance') || q.includes('informe') || q.includes('trimestre') || q.includes('iva') || q.includes('irpf')) {
      return `📊 **Balances y Rendimiento Fiscal (Acceso Jefe DM CAR):**\n\n- En la sección **Balances**, GESTARIAN desglosa automáticamente el Modelo 303 (IVA repercutido y soportado) y el Modelo 130 de IRPF.\n- Puedes consultar el total de base imponible, cuotas de IVA devengadas y emitir un resumen exportable para tu gestoría en formato oficial.\n- Recuerda que la pestaña de *Facturación Recibida* te permite imputar los gastos de proveedores de pintura y recambios para deducir el IVA correspondiente.`;
    }

    // RESPUESTA GENERAL
    return `Entendido. Como asistente de taller de **${currentUser.fullName}**, estoy aquí para optimizar tu jornada:\n\n- ¿Deseas saber cómo gestionar una orden de reparación?\n- ¿Necesitas que guarde un recordatorio o aviso durante tu intervención?\n- ¿Tienes dudas sobre cómo un cliente revisa su vehículo o sobre presupuestos?\n\nIndícame qué necesitas y te guiaré paso a paso.`;
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg: MetisMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const replyContent = processQuery(userText);
      const assistantMsg: MetisMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600);
  };

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

          <div className="flex items-center gap-3">
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
                    className={`text-[10px] mt-1.5 text-right ${
                      isUser ? 'text-white/60' : 'text-[#94A3B8]'
                    }`}
                  >
                    {m.timestamp}
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
            Área de clientes y reparación
          </button>
          <button
            type="button"
            onClick={() => setInput('Recuérdame revisar el secado del barniz en 20 minutos')}
            className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-full text-[#0F2942] font-medium shrink-0 transition-colors"
          >
            Recordar secado barniz
          </button>
          <button
            type="button"
            onClick={() => setInput('¿Cómo funciona el panel de control de cobros y facturas?')}
            className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-full text-[#0F2942] font-medium shrink-0 transition-colors"
          >
            Panel de cobros {isEmployee ? '(Test Bloqueo)' : ''}
          </button>
        </div>

        {/* Input de Envío */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#CBD5E1] flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-[#475569] border border-[#CBD5E1] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Salir de Metis"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isEmployee 
                ? `Pregunta a Metis sobre procedimientos, consejos de taller o recordatorios (${currentEmployee?.name || 'Empleado'})...` 
                : "Pregunta a Metis sobre cualquier asunto del taller, presupuestos, cobros o técnica..."
            }
            className="flex-1 px-4 py-2.5 bg-[#F8F9FA] border border-[#CBD5E1] focus:border-[#0F2942] focus:bg-white rounded-xl text-sm text-[#0F172A] outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] disabled:bg-[#94A3B8] text-white rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
