import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  Sparkles, 
  FileText, 
  ArrowRight,
  Database,
  Calendar,
  Camera,
  Car,
  Receipt,
  PieChart,
  Send,
  Lock,
  Download,
  Smartphone,
  Check,
  Layers,
  Boxes,
  Activity,
  Users,
  Clock
} from 'lucide-react';

// Características ampliadas para Gestarian Quick
const QUICK_FEATURES_AMPLIADAS = [
  {
    icon: Zap,
    titulo: 'Agilidad Extrema en un Clic',
    desc: 'La forma más rápida de generar una factura. Interfaz ultraligera y minimalista para aquellos que solo necesitan rellenar datos y emitir.'
  },
  {
    icon: FileText,
    titulo: 'Facturas Exprés',
    desc: 'Sin complicaciones. Solo los campos necesarios para que tu factura sea legal y profesional en tiempo récord. (Solo facturas).'
  },
  {
    icon: CheckCircle2,
    titulo: 'Totalmente Gratuito',
    desc: 'Accede de forma gratuita y empieza a facturar sin costes ocultos ni suscripciones.'
  }
];

// CaracterÃ­sticas ampliadas para Gestarian Lite
const LITE_FEATURES_AMPLIADAS = [
  {
    icon: Smartphone,
    titulo: 'FacturaciÃ³n UltrarrÃ¡pida en tu Smartphone',
    desc: 'Emite facturas legales en menos de 30 segundos directamente desde tu telÃ©fono mÃ³vil. DiseÃ±ado especÃ­ficamente para profesionales en movilidad, sin instalaciones complejas ni curva de aprendizaje.'
  },
  {
    icon: Lock,
    titulo: 'Cumplimiento Veri*Factu Oficial',
    desc: 'Adaptado a la normativa fiscal y antifraude de la Agencia Tributaria. Genera registros inalterables y cÃ³digos QR reglamentarios en cada factura para total tranquilidad ante cualquier inspecciÃ³n.'
  },
  {
    icon: Send,
    titulo: 'EnvÃ­o Directo por WhatsApp sin Guardar Contactos',
    desc: 'EnvÃ­a facturas y presupuestos directamente al chat de WhatsApp de tu cliente con un formato elegante y profesional, sin saturar la agenda de tu telÃ©fono.'
  },
  {
    icon: FileText,
    titulo: 'GeneraciÃ³n de PDF Profesional',
    desc: 'Documentos en formato PDF vectorial de alta calidad, limpios y con tus datos fiscales perfectamente organizados, listos para descargar, imprimir o archivar.'
  },
  {
    icon: Zap,
    titulo: '100% Gratuito: Cero Costes y Cero Comisiones',
    desc: 'Descarga libre y uso ilimitado sin cuotas mensuales, sin comisiones por factura y sin sorpresas. Una herramienta esencial para autÃ³nomos que empiezan o necesitan agilidad inmediata.'
  },
  {
    icon: Clock,
    titulo: 'Arranque Inmediato y Modo Ligero',
    desc: 'Carga instantÃ¡nea en cualquier navegador mÃ³vil o de escritorio. No consume espacio ni baterÃ­a en tu dispositivo gracias a su arquitectura ultraligera.'
  }
];

// CaracterÃ­sticas ampliadas para Gestarian Pro
const PRO_FEATURES_AMPLIADAS = [
  {
    icon: Database,
    titulo: 'Base de Datos sin Límite',
    desc: 'Almacenamiento ilimitado para clientes, vehículos, histórico de reparaciones, facturas y presupuestos. Todo centralizado y seguro 24/7.'
  },
  {
    icon: Send,
    titulo: 'Envío de Documentos por Email',
    desc: 'Envía tus facturas y presupuestos profesionales directamente a través de correo electrónico con un solo clic.'
  },
  {
    icon: Users,
    titulo: 'Portal de Cliente Integrado',
    desc: 'Ofrece a tus clientes un acceso privado donde podrán consultar el estado de sus vehículos y descargar sus facturas.'
  },
  {
    icon: Camera,
    titulo: 'Imágenes Disponibles de los Trabajos',
    desc: 'Adjunta fotos del estado del vehículo antes y después de la reparación para documentar el trabajo ante el cliente.'
  },
  {
    icon: Activity,
    titulo: 'Seguimiento de Trabajos en Tiempo Real',
    desc: 'Visualiza el estado de las reparaciones en vivo y mantén informados a tus clientes del progreso.'
  },
  {
    icon: Zap,
    titulo: 'Envío Automático a Gestoría',
    desc: 'Remite automáticamente toda la documentación necesaria para tus informes trimestrales, declaraciones de IVA y rendimientos directamente a tu gestor.'
  }
];

// CaracterÃ­sticas ampliadas para Gestarian Enterprise (PrÃ³ximamente)
const ENTERPRISE_FEATURES_AMPLIADAS = [
  {
    icon: Building2,
    titulo: 'Asesoramiento y Toma de Decisiones',
    desc: 'Orientación proactiva y analítica avanzada diseñada para empresas de mayor tamaño que necesitan tomar decisiones estratégicas fundamentadas.'
  },
  {
    icon: Activity,
    titulo: 'Business Intelligence y AnÃ¡lisis Predictivo',
    desc: 'Cuadro de mando integral con previsiÃ³n de tesorerÃ­a, rentabilidad por operario, anÃ¡lisis de mÃ¡rgenes por servicio y detecciÃ³n automÃ¡tica de cuellos de botella.'
  },
  {
    icon: Sparkles,
    titulo: 'Incluye Todo lo Ofrecido en Gestarian Pro',
    desc: 'Toda la potencia de Pro potenciada a escala corporativa con soporte prioritario 24/7 y herramientas a gran escala.'
  }
];

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [expandedCard, setExpandedCard] = useState<'quick' | 'lite' | 'pro' | 'enterprise' | null>(null);

  const handleDownloadApp = () => {
    // Todos los botones de acceso redirigen a la entrada unificada
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      {/* Oscurecimiento cinematogrÃ¡fico global al expandir cualquiera de las tarjetas */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => setExpandedCard(null)}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl lg:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              GESTARIAN
            </span>
          </div>
          <div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
            <button 
              onClick={onEnterApp}
              className="px-4 py-2 sm:px-6 sm:py-3 lg:px-6 lg:py-3 text-xs sm:text-sm lg:text-base font-bold rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg border border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Área de Cliente</span>
            </button>
            <button 
              onClick={onEnterApp}
              className="px-4 py-2 sm:px-6 sm:py-3 lg:px-6 lg:py-3 text-xs sm:text-sm lg:text-base font-bold rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Zona Usuarios (Dashboard)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 text-center max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: expandedCard ? 0.2 : 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 lg:gap-3 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 lg:mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs lg:text-sm font-medium tracking-wide">Asistente de IA y automatizaciÃ³n a tu servicio</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: expandedCard ? 0.2 : 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.15]"
          >
            Automatiza tu documentaciÃ³n y <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-400">
              recupera tu tiempo libre
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: expandedCard ? 0.2 : 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mb-8 leading-relaxed font-normal mx-auto"
          >
            Ahorra horas de trabajo a la semana automatizando la documentaciÃ³n de tu empresa con GESTARIAN. 
            Una plataforma asistida por IA y accesible 100% online con solo el mÃ³vil.
            <span className="text-slate-400 block mt-2 font-medium">
              Tu oficina en la nube con acceso total en todo momento, estÃ©s donde estÃ©s.
            </span>
          </motion.p>

          {/* BotÃ³n CTA Acceder x2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: expandedCard ? 0.2 : 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-14"
          >
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl font-extrabold rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/30"
            >
              <span>Acceso a Roles</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>

          {/* Grid de Productos (4 Tarjetas con animación y despliegue individual) */}
          <div className="relative w-full max-w-[96vw] xl:max-w-[1500px]">
            <div className={`flex overflow-x-auto xl:grid gap-6 w-full snap-x snap-mandatory pt-8 pb-8 xl:pb-0 px-4 xl:px-0 transition-all duration-500 ${
              expandedCard ? 'xl:grid-cols-1 justify-items-center' : 'xl:grid-cols-4'
            }`}>

              {/* 0. GESTARIAN QUICK (NUEVO) */}
              <AnimatePresence mode="popLayout">
                {!expandedCard && (
                  <motion.div 
                    layoutId="card-quick"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    onClick={() => setExpandedCard('quick')}
                    className="group relative rounded-3xl bg-slate-900/50 border border-slate-800 p-8 flex flex-col text-left hover:bg-slate-800/50 hover:border-amber-500/40 transition-colors min-w-[85vw] md:min-w-[400px] xl:min-w-0 snap-center shrink-0 cursor-pointer shadow-xl hover:scale-[1.02]"
                  >
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                  
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>

                  <div className="absolute top-8 right-8 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold tracking-wider border border-amber-500/30">
                    GRATIS 100%
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-white">Gestarian Quick</h3>
                  <p className="text-slate-400 mb-6 flex-1 text-sm lg:text-base">
                    Solo para facturas. La forma más rápida y ágil de generar documentos sin complicaciones.
                  </p>

                  <ul className="space-y-3 mb-8">
                    {['Exclusivo para facturas', 'Interfaz ultraligera', 'Gestión rápida', 'Gratis para siempre'].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="xl:whitespace-nowrap">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setExpandedCard('quick'); }}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-amber-600/90 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 mb-3"
                  >
                    <span>Ver más detalles de Quick</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadApp(); }}
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                    >
                      Acceder a Quick
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {!expandedCard && (
                  <motion.div 
                    layoutId="card-lite"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    onClick={() => setExpandedCard('lite')}
                    className="group relative rounded-3xl bg-slate-900/50 border border-slate-800 p-8 flex flex-col text-left hover:bg-slate-800/50 hover:border-emerald-500/40 transition-colors min-w-[85vw] md:min-w-0 snap-center shrink-0 cursor-pointer shadow-xl hover:scale-[1.02]"
                  >
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                  
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                  </div>

                  <div className="absolute top-8 right-8 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold tracking-wider border border-emerald-500/30">
                    GRATIS 100%
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-white">Gestarian Lite</h3>
                  <p className="text-slate-400 mb-6 flex-1 text-sm lg:text-base">
                    Facturas y presupuestos con tu smartphone cumpliendo con VeriFactu. Cero complicaciones.
                  </p>

                  <ul className="space-y-3 mb-8">
                    {['Facturas y Presupuestos', 'Envío por WhatsApp', 'PDF profesional', 'Descarga y uso 100% gratis'].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="xl:whitespace-nowrap">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setExpandedCard('lite'); }}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 mb-3"
                  >
                    <span>Conocer todo lo que Lite te ofrece</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadApp(); }}
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                    >
                      Acceder a Lite
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadApp(); }}
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 transition-colors border border-emerald-500/30 flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 2. GESTARIAN PRO (ESTADO NORMAL) */}
              <AnimatePresence mode="popLayout">
                {!expandedCard && (
                  <motion.div 
                    layoutId="card-pro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    onClick={() => setExpandedCard('pro')}
                    className="group relative rounded-3xl bg-gradient-to-b from-indigo-900/40 to-slate-900/50 border border-indigo-500/30 p-8 flex flex-col text-left transform xl:-translate-y-6 hover:border-indigo-400/60 transition-colors shadow-2xl shadow-indigo-900/25 min-w-[85vw] md:min-w-[400px] xl:min-w-0 snap-center shrink-0 cursor-pointer hover:scale-[1.02]"
                  >
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-60" />
                  
                  <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="absolute top-8 right-8 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wider border border-indigo-500/30">
                    RECOMENDADO
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-white">Gestarian Pro</h3>
                  <p className="text-slate-400 mb-6 flex-1 text-sm lg:text-base">
                    Diseñado para profesionales y pequeñas empresas. Todo lo que necesitas para tu negocio en una única plataforma.
                  </p>

                  <ul className="space-y-3 mb-8">
                    {[
                      'Facturas y presupuestos (Email/WA)',
                      'Base de datos sin límite',
                      'Portal de cliente e imágenes',
                      'Seguimiento en tiempo real',
                      'Envío automático a gestoría',
                      'Ideal para profesionales/PYMES'
                    ].map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
                        <span className="xl:whitespace-nowrap">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setExpandedCard('pro'); }}
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 mb-3"
                  >
                    <span>Conocer todo lo que Pro te ofrece</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadApp(); }}
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                    >
                      Acceder a Pro
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadApp(); }}
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 transition-colors border border-indigo-500/30 flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Pro</span>
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 3. GESTARIAN ENTERPRISE (ESTADO NORMAL) */}
              <AnimatePresence mode="popLayout">
                {!expandedCard && (
                  <motion.div 
                    layoutId="card-enterprise"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    onClick={() => setExpandedCard('enterprise')}
                    className="group relative rounded-3xl bg-slate-900/50 border border-purple-500/20 p-8 flex flex-col text-left min-w-[85vw] md:min-w-[400px] xl:min-w-0 snap-center shrink-0 cursor-pointer hover:border-purple-500/40 hover:bg-slate-800/40 transition-colors shadow-xl hover:scale-[1.02]"
                  >
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                  
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>

                  <div className="absolute top-8 right-8 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 text-xs font-semibold tracking-wide border border-purple-500/20">
                    EvoluciÃ³n de Pro
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-slate-200">Gestarian Enterprise</h3>
                  <p className="text-slate-400 mb-6 flex-1 text-sm lg:text-base">
                    Para empresas de mayor tamaño. Incluye todo lo anterior más herramientas de asesoramiento y toma de decisiones estratégicas.
                  </p>

                  <ul className="space-y-3 mb-8">
                    {['Para grandes empresas', 'Asesoramiento proactivo', 'Toma de decisiones', 'Todo lo incluido en Pro'].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="xl:whitespace-nowrap">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setExpandedCard('enterprise'); }}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-900/50 hover:bg-purple-800 text-purple-200 rounded-xl font-bold transition-all border border-purple-500/30 mb-3"
                  >
                    <span>Conocer Gestarian Enterprise</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2 opacity-60">
                    <button
                      disabled
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                    >
                      Acceder (PrÃ³x.)
                    </button>
                    <button
                      disabled
                      className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar (PrÃ³x.)</span>
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 0. EXPANDIDO: GESTARIAN QUICK */}
            <AnimatePresence>
              {expandedCard === 'quick' && (
                <motion.div
                  layoutId="card-quick"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-4 xl:inset-auto xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 z-50 w-auto xl:w-[min(1280px,96vw)] max-h-[92vh] overflow-y-auto bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col text-left"
                >
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 z-20"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 xl:gap-12 flex-1 items-start">
                    {/* Columna Izquierda */}
                    <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/30">
                          <Clock className="w-8 h-8 text-white" />
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-wider border border-amber-500/30 mb-3">
                          100% GRATIS DE POR VIDA
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Gestarian Quick</h2>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                          Facturación en 30 segundos desde tu móvil. Pensado para que no pierdas ni un minuto en papeleo innecesario con una interfaz diseñada para ser lo más rápida posible.
                        </p>

                        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                            <Check className="w-4 h-4 text-amber-400" />
                            <span>Descarga y Uso Gratuito</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Sin registro de tarjeta bancaria, sin suscripciones mensuales y sin límite de facturas. Totalmente libre para ti.
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5 text-amber-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Envío de facturas por WhatsApp</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          <span>Generador de PDF instantáneo</span>
                        </p>
                      </div>
                    </div>

                    {/* Columna Derecha */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="flex flex-col space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-400" />
                          <span>Todo lo que incluye Gestarian Quick</span>
                        </h3>
                        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          Uso y Descarga Gratis
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] lg:max-h-[58vh] overflow-y-auto pr-2">
                        {QUICK_FEATURES_AMPLIADAS.map((item, idx) => {
                          const IconComp = item.icon;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
                              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all text-left space-y-1.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                  {item.titulo}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed pl-9">
                                {item.desc}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Botones inferiores de Quick */}
                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => setExpandedCard(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer order-last sm:order-first"
                    >
                      ← Volver a todas las versiones
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleDownloadApp}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>Descargar Quick (Gratis)</span>
                      </button>

                      <button
                        onClick={handleDownloadApp}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center text-center cursor-pointer"
                      >
                        Acceder
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1. EXPANDIDO: GESTARIAN LITE */}
            <AnimatePresence>
              {expandedCard === 'lite' && (
                <motion.div
                  layoutId="card-lite"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-4 xl:inset-auto xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 z-50 w-auto xl:w-[min(1280px,96vw)] max-h-[92vh] overflow-y-auto bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col text-left"
                >
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 z-20"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 xl:gap-12 flex-1 items-start">
                    {/* Columna Izquierda */}
                    <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
                          <Zap className="w-8 h-8 text-white" />
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wider border border-emerald-500/30 mb-3">
                          100% GRATIS DE POR VIDA
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Gestarian Lite</h2>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                          FacturaciÃ³n en 30 segundos desde tu mÃ³vil con homologaciÃ³n Veri*Factu. 
                          Pensado para que no pierdas ni un minuto en papeleo innecesario.
                        </p>

                        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Descarga y Uso Gratuito</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Sin registro de tarjeta bancaria, sin suscripciones mensuales y sin lÃ­mite de facturas. Totalmente libre para ti.
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>EnvÃ­o de facturas por WhatsApp</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Generador de PDF instantÃ¡neo</span>
                        </p>
                      </div>
                    </div>

                    {/* Columna Derecha */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="flex flex-col space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-400" />
                          <span>Todo lo que incluye Gestarian Lite</span>
                        </h3>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          Uso y Descarga Gratis
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] lg:max-h-[58vh] overflow-y-auto pr-2">
                        {LITE_FEATURES_AMPLIADAS.map((item, idx) => {
                          const IconComp = item.icon;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
                              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all text-left space-y-1.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                  {item.titulo}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed pl-9">
                                {item.desc}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Botones inferiores de Lite */}
                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => setExpandedCard(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer order-last sm:order-first"
                    >
                      â† Volver a todas las versiones
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleDownloadApp}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Descargar Lite (Gratis)</span>
                      </button>

                      <a
                        href="https://lite-gestarian.web.app"
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-emerald-600/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Acceder a Lite</span>
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. EXPANDIDO: GESTARIAN PRO */}
            <AnimatePresence>
              {expandedCard === 'pro' && (
                <motion.div
                  layoutId="card-pro"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 w-auto md:w-[min(1280px,96vw)] max-h-[92vh] overflow-y-auto bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col text-left"
                >
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 z-20"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 xl:gap-12 flex-1 items-start">
                    {/* Columna Izquierda */}
                    <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
                          <Shield className="w-8 h-8 text-white" />
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wider border border-indigo-500/30 mb-3">
                          PLATAFORMA INTEGRAL PRO
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Gestarian Pro</h2>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                          Haz un presupuesto online y olvÃ­date del resto de documentaciÃ³n, GESTARIAN lo hace por ti. 
                          Solo confirma la factura y nosotros nos encargamos de enviarla junto a tus informes trimestrales y anuales a tu gestorÃ­a.
                        </p>

                        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span>Tranquilidad y tiempo libre</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            DiseÃ±ado para talleres y pymes que quieren delegar el papeleo en la tecnologÃ­a y recuperar su tiempo libre.
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Todo lo ofrecido en Lite incluido</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                          <span>Sin permanencia ni configuraciones complejas</span>
                        </p>
                      </div>
                    </div>

                    {/* Columna Derecha */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="flex flex-col space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          <span>Todo lo que Gestarian Pro hace por ti</span>
                        </h3>
                        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                          10 herramientas en una sola app
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] lg:max-h-[58vh] overflow-y-auto pr-2">
                        {PRO_FEATURES_AMPLIADAS.map((item, idx) => {
                          const IconComp = item.icon;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
                              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all text-left space-y-1.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                  {item.titulo}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed pl-9">
                                {item.desc}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Botones inferiores de Pro */}
                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => setExpandedCard(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer order-last sm:order-first"
                    >
                      â†  Volver a todas las versiones
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={onEnterApp}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>Acceso Cliente</span>
                      </button>

                      <button
                        onClick={handleDownloadApp}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 font-semibold text-xs sm:text-sm border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Pro</span>
                      </button>

                      <button
                        onClick={onEnterApp}
                        className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
                      >
                        <span>Acceder a Pro</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. EXPANDIDO: GESTARIAN ENTERPRISE */}
            <AnimatePresence>
              {expandedCard === 'enterprise' && (
                <motion.div
                  layoutId="card-enterprise"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 w-auto md:w-[min(1280px,96vw)] max-h-[92vh] overflow-y-auto bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col text-left"
                >
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 z-20"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 xl:gap-12 flex-1 items-start">
                    {/* Columna Izquierda */}
                    <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20">
                          <Building2 className="w-8 h-8 text-purple-400" />
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold tracking-wider border border-purple-500/30 mb-3">
                          PRÃ“XIMA EVOLUCIÃ“N EMPRESARIAL
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Gestarian Enterprise</h2>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                          EvoluciÃ³n avanzada de Gestarian Pro. Conecta a tu gestorÃ­a en tiempo real, 
                          controla stocks automatizados, supervisa mÃºltiples sedes y analiza tu negocio con business intelligence predictivo.
                        </p>

                        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>En Fase de Desarrollo</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Actualmente en diseÃ±o para grandes talleres y redes comerciales. Los botones de acceso y descarga se habilitarÃ¡n muy pronto.
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5 text-purple-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Incluye todas las funciones de Gestarian Pro</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                          <span>Arquitectura corporativa multi-taller</span>
                        </p>
                      </div>
                    </div>

                    {/* Columna Derecha */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="flex flex-col space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-purple-400" />
                          <span>Capacidades Avanzadas de Enterprise</span>
                        </h3>
                        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                          PrÃ³ximamente
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] lg:max-h-[58vh] overflow-y-auto pr-2">
                        {ENTERPRISE_FEATURES_AMPLIADAS.map((item, idx) => {
                          const IconComp = item.icon;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
                              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-purple-500/40 hover:bg-slate-900/80 transition-all text-left space-y-1.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                  {item.titulo}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed pl-9">
                                {item.desc}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Botones inferiores de Enterprise (no operativos todavÃ­a) */}
                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => setExpandedCard(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer order-last sm:order-first"
                    >
                      â† Volver a todas las versiones
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        disabled
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/50 text-slate-500 font-bold text-xs sm:text-sm border border-slate-700/50 cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Enterprise (PrÃ³ximamente)</span>
                      </button>

                      <button
                        disabled
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-900/30 text-purple-400/60 font-extrabold text-sm sm:text-base border border-purple-500/30 cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span>Acceso Enterprise (En Desarrollo)</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="py-8 text-center text-sm text-slate-500">
          <p>Â© {new Date().getFullYear()} Gestarian. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

