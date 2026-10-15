import React, { useState } from 'react';
import { 
  X, Smartphone, CheckCircle, Download, Wrench, Clock, FileText, 
  ExternalLink, Globe, MessageSquare, Mail, Search, CheckCircle2, 
  ShieldCheck, ArrowRight, Car
} from 'lucide-react';
import { CLIENT_PORTAL_DOWNLOAD_URL } from '../services/documentDispatchService';

interface ClientAppLandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleExpediente?: string;
  documents?: any[]; // Allow optional documents array to search real data
}

export const ClientAppLandingModal: React.FC<ClientAppLandingModalProps> = ({
  isOpen,
  onClose,
  sampleExpediente = 'E260001',
  documents = [],
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'previewWeb'>('info');
  const [expedienteInput, setExpedienteInput] = useState(sampleExpediente);
  const [testedExpediente, setTestedExpediente] = useState<string | null>(null);

  // Search for real document if it exists
  const realDoc = testedExpediente 
    ? documents.find(d => d.expediente === testedExpediente || d.vehiclePlate === testedExpediente)
    : null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Cabecera */}
        <div className="relative p-5 sm:p-6 border-b border-white/10 flex items-start justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#38BDF8] to-[#0284C7] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8] block">
                Arquitectura Gestarian
              </span>
              <h2 className="text-xl font-bold tracking-tight">Portal de Clientes</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Área de Clientes accesible vía web o app móvil para seguimiento de expedientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-white/10 px-5 sm:px-6 shrink-0 bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Vías de Acceso y Arquitectura
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('previewWeb')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'previewWeb'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Simulador de Acceso Cliente
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'info' ? (
            <>
              {/* Las 3 Vías de Acceso Oficiales */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                  Cómo acceden tus clientes al Portal de Clientes:
                </span>

                {/* Vía 1: Enlace en Presupuesto */}
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      1. Enlace directo al expediente en el presupuesto
                    </h4>
                    <p className="text-[#94A3B8] text-xs mt-1 leading-relaxed">
                      Cuando el taller envía un presupuesto, el cliente recibe un enlace directo para consultar el seguimiento de su <strong className="text-white">expediente vinculado</strong> sin necesidad de recordar contraseñas.
                    </p>
                    <span className="inline-block mt-2 font-mono text-[10px] bg-black/40 text-emerald-300 px-2 py-1 rounded-sm border border-emerald-500/30">
                      gestarian.com/exp/E260001
                    </span>
                  </div>
                </div>

                {/* Vía 2: Página principal gestarian.com */}
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      2. Página principal de gestarian.com (Área de Clientes)
                    </h4>
                    <p className="text-[#94A3B8] text-xs mt-1 leading-relaxed">
                      Desde la cabecera de la web corporativa <strong className="text-white">gestarian.com</strong>, cualquier cliente puede acceder pulsando en <em>"Área de Clientes"</em> e introduciendo su matrícula o número de expediente.
                    </p>
                  </div>
                </div>

                {/* Vía 3: Descarga de la App Portal de Clientes */}
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      3. Descarga de la App del Portal del Cliente
                    </h4>
                    <p className="text-[#94A3B8] text-xs mt-1 leading-relaxed">
                      El enlace de descarga se envía en el <strong className="text-white">mismo mensaje</strong> que el presupuesto:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-200">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Cliente particular:</strong> Envío por WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-blue-950/40 border border-blue-500/30 rounded-lg text-[11px] text-blue-200">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span><strong>Cliente empresa:</strong> Envío por Email</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Enlace oficial de descarga */}
              <div className="pt-2">
                <a
                  href={CLIENT_PORTAL_DOWNLOAD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#38BDF8] hover:bg-[#0284C7] text-[#0F172A] hover:text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Enlace Oficial de Descarga: gestarian.com/app-clientes</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            /* Pestaña: Simulador de Acceso */
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1.5">
                  Probar consulta de expediente como cliente final:
                </label>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setTestedExpediente(expedienteInput.trim() || 'E260001');
                  }} 
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                    <input
                      type="text"
                      value={expedienteInput}
                      onChange={(e) => setExpedienteInput(e.target.value)}
                      placeholder="Ej: E260001 o 1234-BBB"
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-white/30 focus:outline-hidden focus:border-[#38BDF8]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#38BDF8] text-[#0F172A] font-bold rounded-lg hover:bg-[#0284C7] hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    Consultar
                  </button>
                </form>
              </div>

              {testedExpediente && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 p-4 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#38BDF8]" />
                      <span className="font-mono font-bold text-white">{testedExpediente}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {realDoc?.tallerStatus === 'reparacion_finalizada' ? 'Reparación Finalizada' : 
                       realDoc?.tallerStatus === 'en_reparacion' ? 'En Proceso de Reparación' : 
                       'En Proceso de Reparación'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-white/80">
                      <span>Vehículo asignado:</span>
                      <span className="font-bold text-white">
                        {realDoc ? `${realDoc.vehicleBrand} ${realDoc.vehicleModel} (${realDoc.vehiclePlate})` : 'Turismo SEAT León (1234-BBB)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>Taller asignado:</span>
                      <span className="font-bold text-white">DM CAR (Taller Piloto Oficial)</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>Estado de la reparación:</span>
                      <span className="text-[#38BDF8] font-bold">
                        {realDoc?.tallerStatus === 'reparacion_finalizada' ? 'Finalizada • Listo para entrega' :
                         realDoc?.tallerStatus === 'en_reparacion' ? 'Vehículo en taller • Trabajando' :
                         'Chapa finalizada • En Cabina de Pintura'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-[11px] text-[#94A3B8]">
                    Este es el visor en tiempo real que ve el cliente tanto en la web como en la app instalada en su móvil.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-white/10 flex justify-end shrink-0 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

