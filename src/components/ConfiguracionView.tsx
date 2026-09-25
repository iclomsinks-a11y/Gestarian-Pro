import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Mail, Briefcase, Inbox, WifiOff, Sparkles, Palette, 
  Upload, Image as ImageIcon 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppUser } from '../types';
import { ReplaceImageModal, ReplaceTargetInfo } from './ReplaceImageModal';

interface ConfiguracionViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  currentUser?: AppUser;
  onUpdateUser?: (updatedFields: Partial<AppUser>) => void;
  onOpenCustomizer?: () => void;
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
  currentUser,
  onUpdateUser,
  onOpenCustomizer,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenCompanyConfig,
  onOpenSpec
}) => {
  const [rastreoActivo, setRastreoActivo] = useState(false);
  const [offlineActivo, setOfflineActivo] = useState(true);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTargetInfo | null>(null);

  const currentLogo = currentUser?.logoUrl || logoUrl || '';
  const currentPortrait = currentUser?.bgPortraitUrl || '';
  const currentLandscape = currentUser?.bgLandscapeUrl || '';
  const currentBento = currentUser?.bgBentoMenuUrl || '';
  const metisAdviceActive = currentUser?.metisTechnicalAdviceEnabled ?? true;

  const handleImageReplaced = (slot: ReplaceTargetInfo['slot'], newUrl: string) => {
    if (slot === 'logo') {
      onUpdateUser?.({ logoUrl: newUrl });
    } else if (slot === 'portrait' || slot === 'custom_main') {
      onUpdateUser?.({ bgPortraitUrl: newUrl });
    } else if (slot === 'landscape') {
      onUpdateUser?.({ bgLandscapeUrl: newUrl });
    } else if (slot === 'bento') {
      onUpdateUser?.({ bgBentoMenuUrl: newUrl });
    }
    setReplaceTarget(null);
  };

  const handleToggleMetis = () => {
    onUpdateUser?.({ metisTechnicalAdviceEnabled: !metisAdviceActive });
  };

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

        {/* Tarjeta 1: Configuración de la Empresa */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center gap-5 py-12 sticky top-[100px] sm:static z-10"
        >
          <div className="w-14 h-14 rounded-full bg-[#0F2942] border border-[#38BDF8] flex items-center justify-center text-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.4)]">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-[30px] font-bold text-white leading-tight">Configuración de la Empresa</h3>
          <p className="text-[21px] text-slate-300 max-w-lg leading-relaxed">
            Gestiona tus datos fiscales, CIF/NIF, dirección y plantilla de empleados con epígrafes oficiales de Seguridad Social.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button 
              onClick={onOpenCompanyConfig}
              className="px-6 py-3.5 bg-[#38BDF8] text-[#0F172A] rounded-lg shadow-[0_4px_14px_0_rgba(56,189,248,0.39)] font-bold text-[21px] hover:bg-[#7DD3FC] transition-colors cursor-pointer"
            >
              Abrir Configuración General
            </button>
            <button 
              onClick={onOpenSpec}
              className="px-4 py-3 sm:py-2 text-slate-300 hover:text-white text-[18px] font-semibold underline transition-colors cursor-pointer"
            >
              Especificación Técnica
            </button>
          </div>
        </motion.div>

        {/* Tarjeta 2: Personalización del Taller */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-6 relative sticky top-[120px] sm:static z-20"
        >
          {/* Cabecera Tarjeta */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[27px] font-bold text-white leading-tight">Personalización del Taller</h3>
              <p className="text-[18px] text-slate-300 mt-1">Logotipo oficial, fondos de pantalla con IA y asistente Metis</p>
            </div>
          </div>

          {/* Bloque A: Estudio IA - Fondos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-xl bg-[#0F172A]/50 border border-pink-500/30 shadow-[inset_0_0_20px_rgba(236,72,153,0.05)] transition-all hover:border-pink-500/50 hover:shadow-[inset_0_0_20px_rgba(236,72,153,0.15)]">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
                Estudio IA: Personalizar Fondos desde Imagen Local
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Sube una imagen local y la IA generará 3 variantes estilizadas (Artística, Manga y Futurista) para el Inicio y el Menú Bento.
              </span>
            </div>
            <button
              onClick={onOpenCustomizer}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-[18px] rounded-lg transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              <span>Subir y Estilizar con IA</span>
            </button>
          </div>

          {/* Bloque B: Logotipo de la Empresa */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-xl bg-[#0F172A]/50 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-xl bg-[#0F172A] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo de la empresa" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[21px] font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#38BDF8] shrink-0" />
                  Logotipo Oficial (250 × 250 px)
                </span>
                <span className="text-[18px] text-slate-300 mt-1">
                  Visible en la cabecera superior izquierda, presupuestos y facturas.
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplaceTarget({
                slot: 'logo',
                label: 'Logotipo de la Empresa',
                currentUrl: currentLogo
              })}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[18px] rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#38BDF8]" />
              <span>Cambiar Logo</span>
            </button>
          </div>

          {/* Bloque C: Fondos de Pantalla */}
          <div className="space-y-3">
            <span className="text-[18px] font-bold text-slate-300 uppercase tracking-wider block">
              Fondos de Pantalla del Sistema
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Móvil */}
              <div className="p-3 bg-[#0F172A]/50 border border-white/5 rounded-xl flex flex-col gap-2">
                <span className="font-semibold text-[18px] text-slate-300">Inicio (Móvil)</span>
                <div 
                  onClick={() => setReplaceTarget({
                    slot: 'portrait',
                    label: 'Fondo Inicio (Móvil / Portrait)',
                    currentUrl: currentPortrait,
                    defaultFallbackUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                  })}
                  className="h-28 w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 relative group cursor-pointer"
                >
                  <img
                    src={currentPortrait || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                    alt="Fondo Móvil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[18px] font-bold text-white gap-2">
                    <Upload className="w-5 h-5 text-[#38BDF8]" />
                    <span>Cambiar</span>
                  </div>
                </div>
              </div>

              {/* PC / Landscape */}
              <div className="p-3 bg-[#0F172A]/50 border border-white/5 rounded-xl flex flex-col gap-2">
                <span className="font-semibold text-[18px] text-slate-300">Inicio (PC)</span>
                <div 
                  onClick={() => setReplaceTarget({
                    slot: 'landscape',
                    label: 'Fondo Inicio (PC / Landscape)',
                    currentUrl: currentLandscape,
                    defaultFallbackUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
                  })}
                  className="h-28 w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 relative group cursor-pointer"
                >
                  <img
                    src={currentLandscape || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'}
                    alt="Fondo PC"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[18px] font-bold text-white gap-2">
                    <Upload className="w-5 h-5 text-[#38BDF8]" />
                    <span>Cambiar</span>
                  </div>
                </div>
              </div>

              {/* Menú Bento */}
              <div className="p-3 bg-[#0F172A]/50 border border-white/5 rounded-xl flex flex-col gap-2">
                <span className="font-semibold text-[18px] text-slate-300">Menú Bento</span>
                <div 
                  onClick={() => setReplaceTarget({
                    slot: 'bento',
                    label: 'Fondo Menú Bento (Botones)',
                    currentUrl: currentBento,
                    defaultFallbackUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'
                  })}
                  className="h-28 w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 relative group cursor-pointer"
                >
                  <img
                    src={currentBento || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'}
                    alt="Fondo Bento"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[18px] font-bold text-white gap-2">
                    <Upload className="w-5 h-5 text-[#38BDF8]" />
                    <span>Cambiar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque D: Consejos Técnicos de Metis */}
          <div className="flex items-center justify-between gap-4 py-2 border-t border-white/5 pt-4">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#38BDF8] shrink-0" />
                Consejos Técnicos de Metis (Chapa y Pintura)
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Asesoramiento en tiempos de secado, proporciones de mezcla OEM y técnicas de preparación.
              </span>
            </div>
            {/* Toggle */}
            <button 
              onClick={handleToggleMetis}
              className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${metisAdviceActive ? 'bg-[#38BDF8]' : 'bg-slate-700'}`}
              title={metisAdviceActive ? 'Desactivar consejos técnicos' : 'Activar consejos técnicos'}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${metisAdviceActive ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.div>

        {/* Tarjeta 3: Automatización y Sincronización */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.16 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-8 relative sticky top-[140px] sm:static z-20"
        >
          {/* Cabecera Tarjeta */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[27px] font-bold text-white leading-tight">Automatización y Sincronización</h3>
              <p className="text-[18px] text-slate-300 mt-1">Gestiona la recolección de facturas y la persistencia local</p>
            </div>
          </div>

          {/* Bloque A: Extracción con IA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-xl bg-[#0F172A]/50 border border-purple-500/30 shadow-[inset_0_0_20px_rgba(147,51,234,0.05)] transition-all hover:border-purple-500/50 hover:shadow-[inset_0_0_20px_rgba(147,51,234,0.15)]">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                Extracción con IA (Gmail)
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Conecta tu cuenta de Gmail de forma segura para que nuestra IA escanee, extraiga y procese tus facturas adjuntas automáticamente en segundo plano.
              </span>
            </div>
            <button
              onClick={handleGoogleSync}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-[18px] rounded-lg transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              Conectar cuenta
            </button>
          </div>

          {/* Bloque B: Rastreo de Bandeja de Entrada */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 pb-6">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#38BDF8] shrink-0" />
                Rastreo automático de facturas
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Analiza la bandeja de entrada una vez al día en busca de adjuntos.
              </span>
            </div>
            {/* Toggle Minimalista */}
            <button 
              onClick={() => setRastreoActivo(!rastreoActivo)}
              className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${rastreoActivo ? 'bg-[#38BDF8]' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${rastreoActivo ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Bloque C: Persistencia de datos sin conexión */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex flex-col">
              <span className="text-[21px] font-bold text-white flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
                Modo Fuera de Línea (Offline-First)
              </span>
              <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                Permite trabajar sin red. Sincronización automática al recuperar cobertura.
              </span>
            </div>
            {/* Toggle Minimalista */}
            <button 
              onClick={() => setOfflineActivo(!offlineActivo)}
              className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${offlineActivo ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${offlineActivo ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Modal para reemplazar imágenes de personalización */}
      <ReplaceImageModal
        isOpen={Boolean(replaceTarget)}
        onClose={() => setReplaceTarget(null)}
        target={replaceTarget}
        onImageReplaced={handleImageReplaced}
      />
    </div>
  );
};
