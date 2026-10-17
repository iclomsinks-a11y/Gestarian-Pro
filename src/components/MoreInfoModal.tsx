import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, Zap, Gem, Building2, Globe, 
  FileText, Calculator, Camera, Bell, Users, Clock, 
  Smartphone, Database, Server, Cpu, QrCode, ArrowRight,
  ExternalLink, Sparkles
} from 'lucide-react';
import { GestarianPlan } from '../types';

interface MoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (plan: GestarianPlan) => void;
  currentPlan?: GestarianPlan;
}

export const MoreInfoModal: React.FC<MoreInfoModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan = 'pro',
}) => {
  const [activeTab, setActiveTab] = useState<'comparativa' | GestarianPlan>('comparativa');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-[#0B101B] border border-slate-700/80 rounded-3xl p-5 sm:p-8 text-white shadow-2xl my-auto animate-in zoom-in-95 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Análisis Exhaustivo del Ecosistema GESTARIAN</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white">
              Más Información sobre Versiones y Normativa
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
              Descubre qué versión de GESTARIAN se ajusta con exactitud a las necesidades operativas, fiscales y legales de tu actividad.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación del Análisis */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto shrink-0 border-b border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('comparativa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'comparativa'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            📊 Matriz Comparativa
          </button>
          <button
            onClick={() => setActiveTab('lite')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'lite'
                ? 'bg-slate-200 text-slate-950 font-black'
                : 'bg-[#0c131d] text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            🪐 Gestarian Lite (Gratis)
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-sky-400 text-slate-950 font-black'
                : 'bg-[#061829] text-sky-300 hover:bg-slate-800 border border-sky-800/60'
            }`}
          >
            ⚡ Gestarian Quick (BD)
          </button>
          <button
            onClick={() => setActiveTab('pro')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pro'
                ? 'bg-emerald-400 text-slate-950 font-black'
                : 'bg-[#061a14] text-emerald-300 hover:bg-slate-800 border border-emerald-800/60'
            }`}
          >
            💎 Gestarian Pro (Taller)
          </button>
          <button
            onClick={() => setActiveTab('enterprise')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'enterprise'
                ? 'bg-indigo-400 text-slate-950 font-black'
                : 'bg-[#120c2b] text-indigo-300 hover:bg-slate-800 border border-purple-900/60'
            }`}
          >
            🏢 Gestarian Enterprise (AEAT)
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">

          {/* TAB: COMPARATIVA GLOBAL */}
          {activeTab === 'comparativa' && (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                      <th className="p-3 font-bold uppercase tracking-wider">Capacidad / Módulo</th>
                      <th className="p-3 font-bold uppercase text-slate-200">LITE</th>
                      <th className="p-3 font-bold uppercase text-sky-400">QUICK</th>
                      <th className="p-3 font-bold uppercase text-emerald-400">PRO</th>
                      <th className="p-3 font-bold uppercase text-indigo-400">ENTERPRISE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    <tr>
                      <td className="p-3 font-medium text-white">Coste de acceso</td>
                      <td className="p-3 font-bold text-emerald-400">100% Gratis</td>
                      <td className="p-3">Custodia 1er año gratis</td>
                      <td className="p-3">Plan Integral Taller</td>
                      <td className="p-3">Flotas / Multisede</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Almacenamiento de datos</td>
                      <td className="p-3">Local (dispositivo)</td>
                      <td className="p-3 text-sky-300">BD Clientes/Proveedores</td>
                      <td className="p-3 text-emerald-300">BD Completa + Fotos</td>
                      <td className="p-3 text-indigo-300">Nube ilimitada 24/7</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Presupuestos y Facturas A4</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">QR Veri*Factu AEAT oficial</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Envío WhatsApp sin guardar agenda</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Rastreo automático de facturas / Gmail</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-sky-400">Opcional (+19€/año)</td>
                      <td className="p-3 text-emerald-400">Incluido</td>
                      <td className="p-3 text-indigo-400">Incluido en tiempo real</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Reconocimiento matrículas ALPR</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Expedientes con Roadmap interactivo</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Portal Web exclusivo para Clientes</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Asistente Metis IA con voz bidireccional</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                      <td className="p-3"><Check className="w-4 h-4 text-emerald-400" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">Sede Electrónica AEAT telemática</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3 text-slate-500">—</td>
                      <td className="p-3"><Check className="w-4 h-4 text-indigo-400" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cumplimiento Normativo Veri*Factu y Ley 11/2021 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700 flex flex-col md:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                    Garantía Normativa Veri*Factu y Ley Antifraude 11/2021
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed font-light">
                    Todas las versiones de GESTARIAN generan facturas oficiales que integran el código QR oficial de cotejo de la Agencia Estatal de Administración Tributaria (AEAT), encadenamiento criptográfico con algoritmo SHA-256 e inalterabilidad de los registros.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GESTARIAN LITE */}
          {activeTab === 'lite' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#0c131d] border border-slate-700/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase text-white">GESTARIAN LITE</h3>
                    <p className="text-xs text-emerald-400 font-semibold">100% Gratuito · Sin cuotas · Sin base de datos en la nube</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  Diseñado para autónomos, instaladores, peritos, fontaneros, cerrajeros y profesionales que necesitan emitir una factura o un presupuesto en 30 segundos directamente desde su teléfono móvil o portátil en el lugar del trabajo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="text-xs font-bold text-slate-200 mb-1">⚡ Emisión Inmediata A4</p>
                    <p className="text-[11px] text-slate-400">Sin registros previos ni formularios obligatorios complejos. Abre la app, introduce cliente y partidas y obtén tu documento listo.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="text-xs font-bold text-slate-200 mb-1">📲 WhatsApp al Instante</p>
                    <p className="text-[11px] text-slate-400">Envía el documento al cliente por WhatsApp de inmediato sin guardar su número de teléfono en tu agenda.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="text-xs font-bold text-slate-200 mb-1">🔒 Máxima Privacidad</p>
                    <p className="text-[11px] text-slate-400">Los datos se almacenan exclusivamente en tu propio navegador. Ningún tercero ni servidor recopila tu información.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="text-xs font-bold text-slate-200 mb-1">🏛️ Conforme Veri*Factu</p>
                    <p className="text-[11px] text-slate-400">Genera el código QR oficial de la AEAT con validación de integridad para total tranquilidad fiscal.</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectPlan?.('lite');
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-950 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Entrar a Gestarian Lite
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GESTARIAN QUICK */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#061829] border border-sky-800/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-600/40 text-sky-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase text-white">GESTARIAN QUICK</h3>
                    <p className="text-xs text-sky-300 font-semibold">Base de datos de Clientes y Proveedores + Custodia 1er Año Gratis</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  La solución idónea para negocios de comercio, servicios técnicos y autónomos con cartera de clientes habituales y proveedores frecuentes que requieren trazabilidad de facturación y cobros.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-sky-900/50">
                    <p className="text-xs font-bold text-sky-300 mb-1">📁 Fichero de Clientes y Proveedores</p>
                    <p className="text-[11px] text-slate-400">Guarda datos fiscales, direcciones, NIF/CIF y teléfonos con autocompletado instantáneo en facturas y presupuestos.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-sky-900/50">
                    <p className="text-xs font-bold text-sky-300 mb-1">🛡️ Custodia Segura de Documentos</p>
                    <p className="text-[11px] text-slate-400">1er año de custodia gratuita en base de datos. Ampliación opcional: +10€/año (1-4 años) y +15€/año (4-8 años) según prescripción tributaria.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-sky-900/50">
                    <p className="text-xs font-bold text-sky-300 mb-1">🤖 Rastreo Email + OCR (+19€/año)</p>
                    <p className="text-[11px] text-slate-400">Módulo opcional que monitoriza tu Gmail en segundo plano y extrae automáticamente facturas recibidas de tus proveedores.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-sky-900/50">
                    <p className="text-xs font-bold text-sky-300 mb-1">📈 Balances y Control de Gastos</p>
                    <p className="text-[11px] text-slate-400">Resumen de ingresos, gastos públicos, estado de cobros y totales trimestrales para tu gestoría contable.</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-sky-900/50 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectPlan?.('quick');
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    Entrar a Gestarian Quick
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GESTARIAN PRO */}
          {activeTab === 'pro' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#061a14] border border-emerald-800/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-600/40 text-emerald-400">
                    <Gem className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase text-white">GESTARIAN PRO</h3>
                    <p className="text-xs text-emerald-300 font-semibold">Taller Mecánico & Carrocería · Expedientes · ALPR · Portal Clientes · Metis IA</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  La herramienta de referencia para talleres de mecánica, chapa y pintura, neumáticos y centros de automoción. Digitaliza todo el ciclo del vehículo desde su recepción en el elevador hasta la entrega de llaves.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/50">
                    <p className="text-xs font-bold text-emerald-300 mb-1">🚗 Expedientes con Roadmap en Vivo</p>
                    <p className="text-[11px] text-slate-400">Estados interactivos: Entrada, Peritación, Desmontaje, Reparación, Pintura, Control de Calidad y Entrega con fotos de avance.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/50">
                    <p className="text-xs font-bold text-emerald-300 mb-1">📸 Escáner ALPR de Matrículas</p>
                    <p className="text-[11px] text-slate-400">Apunta la cámara del móvil a la matrícula del coche y el sistema localiza su historial, marca, modelo y propietario al segundo.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/50">
                    <p className="text-xs font-bold text-emerald-300 mb-1">🌐 Portal Web para Clientes</p>
                    <p className="text-[11px] text-slate-400">El conductor consulta el progreso de su coche, visualiza fotos del taller y aprueba presupuestos online desde su móvil.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/50">
                    <p className="text-xs font-bold text-emerald-300 mb-1">🎙️ Asistente Metis IA con Voz</p>
                    <p className="text-[11px] text-slate-400">Dictado por voz sin tocar la pantalla con las manos manchadas, recomendaciones técnicas y generación de órdenes de trabajo.</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-emerald-900/50 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectPlan?.('pro');
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Entrar a Gestarian Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GESTARIAN ENTERPRISE */}
          {activeTab === 'enterprise' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#120c2b] border border-purple-900/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-indigo-600/40 text-indigo-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase text-white">GESTARIAN ENTERPRISE</h3>
                    <p className="text-xs text-indigo-300 font-semibold">Grandes Flotas · Sede Electrónica AEAT Directa · Red B2B Multisede</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  Concebida para concesionarios, flotas corporativas, redes de franquicias y empresas con altos volúmenes de facturación y requerimientos de auditoría fiscal continua.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-900/50">
                    <p className="text-xs font-bold text-indigo-300 mb-1">🏛️ Sede AEAT con Certificado Digital</p>
                    <p className="text-[11px] text-slate-400">Conexión web service SOAP / REST oficial con los servidores de la Agencia Tributaria para remisión en tiempo real.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-900/50">
                    <p className="text-xs font-bold text-indigo-300 mb-1">🏢 Arquitectura Multisede y B2B</p>
                    <p className="text-[11px] text-slate-400">Sincronización de inventario, operarios y bases de datos compartidas entre diferentes sedes y distribuidores de recambios.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-900/50">
                    <p className="text-xs font-bold text-indigo-300 mb-1">📊 Business Intelligence Predictivo</p>
                    <p className="text-[11px] text-slate-400">Métricas de rentabilidad por operario, tiempos de mano de obra en cabina de pintura y predicción de flujo de caja.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-900/50">
                    <p className="text-xs font-bold text-indigo-300 mb-1">🛡️ SLA y Soporte 24/7</p>
                    <p className="text-[11px] text-slate-400">Ingeniería de soporte dedicada, copias de seguridad de alta disponibilidad y custodia ilimitada.</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-purple-900/50 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectPlan?.('enterprise');
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    Entrar a Gestarian Enterprise
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
