import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Briefcase, Inbox, WifiOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfiguracionViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  onOpenCompanyConfig: () => void;
  onOpenSpec: () => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  id,
  logoUrl,
  userFullName,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenCompanyConfig,
  onOpenSpec
}) => {
  const [rastreoActivo, setRastreoActivo] = useState(false);
  const [offlineActivo, setOfflineActivo] = useState(true);

  const handleGoogleSync = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.send');

    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        const user = result.user;
        console.log("Usuario sincronizado:", user.email);
        console.log("Token capturado:", accessToken);
        alert("¡Cuenta de Gmail conectada! La sincronización automática de facturas está activa.");
      }).catch((error) => {
        console.error("Error de sincronización OAuth:", error);
        alert("Hubo un error al conectar la cuenta.");
      });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col p-4 sm:p-8 bg-[#0F172A] overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col h-full gap-8 relative pb-20">
        <PageHeader
          pageId={id}
          title="Configuración"
          onOpenMenu={onOpenMenu}
          onBack={onBack}
          onNavigateHome={onNavigateHome}
        />

        {/* Tarjeta 1: Configuración de la Empresa (La original de App.tsx) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center gap-4 py-12 sticky top-[100px] sm:static z-10"
        >
          <div className="w-12 h-12 rounded-full bg-[#0F2942] border border-[#38BDF8] flex items-center justify-center text-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.4)]">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Configuración de la Empresa</h3>
          <p className="text-sm text-slate-400 max-w-md">
            Gestiona tus datos fiscales, plantilla de empleados con epígrafes de Seguridad Social y personalización visual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button 
              onClick={onOpenCompanyConfig}
              className="px-6 py-3 bg-[#38BDF8] text-[#0F172A] rounded-lg shadow-[0_4px_14px_0_rgba(56,189,248,0.39)] font-bold text-sm hover:bg-[#7DD3FC] transition-colors"
            >
              Abrir Configuración General
            </button>
            <button 
              onClick={onOpenSpec}
              className="px-4 py-3 sm:py-2 text-slate-400 hover:text-white text-xs font-semibold underline transition-colors"
            >
              Especificación Técnica
            </button>
          </div>
        </motion.div>

        {/* Tarjeta 2: Automatización y Sincronización */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-8 relative sticky top-[140px] sm:static z-20"
        >
          {/* Cabecera Tarjeta */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Automatización y Sincronización</h3>
              <p className="text-xs text-slate-400">Gestiona la recolección de facturas y la persistencia local</p>
            </div>
          </div>

          {/* Bloque A: Extracción con IA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0F172A]/50 border border-purple-500/30 shadow-[inset_0_0_20px_rgba(147,51,234,0.05)] transition-all hover:border-purple-500/50 hover:shadow-[inset_0_0_20px_rgba(147,51,234,0.15)]">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                Extracción con IA (Gmail)
              </span>
              <span className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                Conecta tu cuenta de Gmail de forma segura para que nuestra IA escanee, extraiga y procese tus facturas adjuntas automáticamente en segundo plano.
              </span>
            </div>
            <button
              onClick={handleGoogleSync}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] flex items-center justify-center gap-2 shrink-0"
            >
              Conectar cuenta
            </button>
          </div>

          {/* Bloque B: Rastreo de Bandeja de Entrada */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 pb-6">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#38BDF8]" />
                Rastreo automático de facturas
              </span>
              <span className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                Analiza la bandeja de entrada una vez al día en busca de adjuntos.
              </span>
            </div>
            {/* Toggle Minimalista */}
            <button 
              onClick={() => setRastreoActivo(!rastreoActivo)}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative shadow-inner shrink-0 ${rastreoActivo ? 'bg-[#38BDF8]' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${rastreoActivo ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Bloque C: Persistencia de datos sin conexión */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-emerald-400" />
                Modo Fuera de Línea (Offline-First)
              </span>
              <span className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                Permite trabajar sin red. Sincronización automática al recuperar cobertura.
              </span>
            </div>
            {/* Toggle Minimalista */}
            <button 
              onClick={() => setOfflineActivo(!offlineActivo)}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative shadow-inner shrink-0 ${offlineActivo ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${offlineActivo ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
};
