import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { auth, googleSignIn, getAccessToken } from '../firebase';
import { 
  Mail, Briefcase, Inbox, WifiOff, Sparkles, Palette, 
  Upload, Image as ImageIcon, Save, CheckCircle2,
  Car, Home, Sliders, Percent
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppUser, GestarianDocument, GestarianPlan, getDefaultIvaRate } from '../types';
import { ReplaceImageModal, ReplaceTargetInfo } from './ReplaceImageModal';
import { scanGmailForInvoices } from '../services/gmailScannerService';

interface ConfiguracionViewProps {
  id: string;
  logoUrl?: string;
  userFullName?: string;
  currentUser?: AppUser;
  currentPlan?: GestarianPlan;
  onUpdateUser?: (updatedFields: Partial<AppUser>) => void;
  onOpenCustomizer?: () => void;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onOpenMenu?: () => void;
  onOpenCompanyConfig: () => void;
  onLogout?: () => void;
  onScanComplete?: (invoices: GestarianDocument[]) => void;
  onShowToast?: (msg: string) => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  id,
  logoUrl,
  userFullName,
  currentUser,
  currentPlan,
  onUpdateUser,
  onOpenCustomizer,
  onBack,
  onNavigateHome,
  onOpenMenu,
  onOpenCompanyConfig,
  onLogout,
  onScanComplete,
  onShowToast,
}) => {
  const [rastreoActivo, setRastreoActivo] = useState(true);
  const [offlineActivo, setOfflineActivo] = useState(true);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTargetInfo | null>(null);
  const [isScanningGmail, setIsScanningGmail] = useState(false);

  // Campos de datos del usuario y fiscales (para Quick, Lite y general)
  const [userName, setUserName] = useState(currentUser?.fullName || '');
  const [userCif, setUserCif] = useState(currentUser?.cif || '');
  const [userFiscalAddress, setUserFiscalAddress] = useState(currentUser?.fiscalAddress || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [isSavedFiscal, setIsSavedFiscal] = useState(false);

  // Estados de configuración de módulos: Vehículo, Localización e IVA
  const [enableVehicle, setEnableVehicle] = useState<boolean>(currentUser?.enableVehicle !== false);
  const [enableLocation, setEnableLocation] = useState<boolean>(currentUser?.enableLocation === true);
  const [defaultIvaRate, setDefaultIvaRate] = useState<number>(() => {
    return getDefaultIvaRate(currentUser);
  });

  React.useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.fullName || '');
      setUserCif(currentUser.cif || '');
      setUserFiscalAddress(currentUser.fiscalAddress || '');
      setUserPhone(currentUser.phone || '');
      setUserEmail(currentUser.email || '');
      setEnableVehicle(currentUser.enableVehicle !== false);
      setEnableLocation(currentUser.enableLocation === true);
      if (currentUser.defaultIvaRate !== undefined) {
        setDefaultIvaRate(currentUser.defaultIvaRate);
      }
    }
  }, [currentUser]);

  const handleSaveIvaRate = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gestarian_default_iva_rate', String(defaultIvaRate));
    }
    onUpdateUser?.({ defaultIvaRate });
    if (onShowToast) {
      onShowToast(`Tasa de IVA por defecto actualizada a ${defaultIvaRate}%`);
    }
  };

  const handleToggleVehicle = () => {
    const nextVal = !enableVehicle;
    setEnableVehicle(nextVal);
    onUpdateUser?.({ enableVehicle: nextVal });
    if (onShowToast) {
      onShowToast(`Apartado de Vehículo ${nextVal ? 'activado' : 'desactivado'}`);
    }
  };

  const handleToggleLocation = () => {
    const nextVal = !enableLocation;
    setEnableLocation(nextVal);
    onUpdateUser?.({ enableLocation: nextVal });
    if (onShowToast) {
      onShowToast(`Apartado de Localización ${nextVal ? 'activado' : 'desactivado'}`);
    }
  };

  const handleSaveFiscalData = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userName.trim()) return;
    onUpdateUser?.({
      fullName: userName.trim().toUpperCase(),
      cif: userCif.trim().toUpperCase(),
      fiscalAddress: userFiscalAddress.trim(),
      phone: userPhone.trim(),
      email: userEmail.trim().toLowerCase(),
    });
    setIsSavedFiscal(true);
    if (onShowToast) {
      onShowToast('Datos de usuario y fiscales actualizados correctamente');
    }
    setTimeout(() => setIsSavedFiscal(false), 3000);
  };

  const currentLogo = currentUser?.logoUrl || logoUrl || '';
  const currentPortrait = currentUser?.bgPortraitUrl || '';
  const currentLandscape = currentUser?.bgLandscapeUrl || '';
  const currentBento = currentUser?.bgBentoMenuUrl || '';
  const metisAdviceActive = currentUser?.metisTechnicalAdviceEnabled ?? true;
  const systemWallpaperActive = currentUser?.enableSystemWallpaper ?? false;

  const handleToggleSystemWallpaper = () => {
    onUpdateUser?.({ enableSystemWallpaper: !systemWallpaperActive });
  };

  const handleDirectFileUpload = (slot: 'portrait' | 'landscape' | 'bento' | 'logo', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (slot === 'logo') onUpdateUser?.({ logoUrl: result });
        else if (slot === 'portrait') onUpdateUser?.({ bgPortraitUrl: result, enableSystemWallpaper: true });
        else if (slot === 'landscape') onUpdateUser?.({ bgLandscapeUrl: result, enableSystemWallpaper: true });
        else if (slot === 'bento') onUpdateUser?.({ bgBentoMenuUrl: result, enableSystemWallpaper: true });
        if (onShowToast) onShowToast('Imagen personalizada actualizada correctamente');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageReplaced = (slot: ReplaceTargetInfo['slot'], newUrl: string) => {
    if (slot === 'logo') {
      onUpdateUser?.({ logoUrl: newUrl });
    } else if (slot === 'portrait' || slot === 'custom_main') {
      onUpdateUser?.({ bgPortraitUrl: newUrl, enableSystemWallpaper: true });
    } else if (slot === 'landscape') {
      onUpdateUser?.({ bgLandscapeUrl: newUrl, enableSystemWallpaper: true });
    } else if (slot === 'bento') {
      onUpdateUser?.({ bgBentoMenuUrl: newUrl, enableSystemWallpaper: true });
    }
    setReplaceTarget(null);
  };

  const handleToggleMetis = () => {
    onUpdateUser?.({ metisTechnicalAdviceEnabled: !metisAdviceActive });
  };

  const handleGoogleSync = async () => {
    try {
      setIsScanningGmail(true);
      let token = getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        token = result?.accessToken || null;
      }

      if (token) {
        setRastreoActivo(true);
        const invoices = await scanGmailForInvoices(token);
        setIsScanningGmail(false);
        if (invoices && invoices.length > 0) {
          onScanComplete?.(invoices);
          alert(`¡Google conectado con éxito! Se han detectado ${invoices.length} facturas nuevas.`);
        } else {
          alert('¡Google conectado correctamente! No se encontraron facturas nuevas en tu Gmail por ahora.');
        }
        if (onNavigateHome) onNavigateHome();
      } else {
        setIsScanningGmail(false);
      }
    } catch (err: any) {
      console.error("Error al conectar con Google:", err);
      setIsScanningGmail(false);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(`No se pudo conectar con Google: ${err.message || 'Error de autorización'}`);
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const isLite = (currentPlan || currentUser?.currentTier) === 'lite';

  return (
    <div id={id} className="w-screen h-screen shrink-0 snap-start flex flex-col bg-[#0F172A] overflow-y-auto">
      <PageHeader
        pageId={id || 'page-configuracion'}
        title="Configuración"
        onOpenMenu={isLite ? undefined : onOpenMenu}
        onBack={onBack}
        onNavigateHome={onNavigateHome}
        hideScrollIndicator={isLite}
        hideMenu={isLite}
        currentPlan={currentPlan || currentUser?.currentTier}
      />

      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col h-full gap-8 relative pb-20">

        {/* Tarjeta 1: Datos del Usuario y Fiscales (Nombre, CIF/NIF, Dirección fiscal, Teléfono, Email) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-sky-400/30 shadow-2xl flex flex-col gap-6 relative"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Datos Fiscales y de la Empresa
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-1">
                Datos fiscales del emisor para presupuestos y facturas
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveFiscalData} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-base sm:text-lg outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  DNI/CIF *
                </label>
                <input
                  type="text"
                  value={userCif}
                  onChange={(e) => setUserCif(e.target.value.toUpperCase())}
                  placeholder="DNI / CIF"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-mono font-bold text-base sm:text-lg outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Número de teléfono"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-base sm:text-lg outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-bold text-base sm:text-lg outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Dirección fiscal completa *
              </label>
              <textarea
                rows={2}
                value={userFiscalAddress}
                onChange={(e) => setUserFiscalAddress(e.target.value)}
                placeholder="Dirección fiscal completa, código postal, localidad y provincia"
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-600 focus:border-sky-400 rounded-xl text-white font-medium text-base outline-none resize-none transition-colors"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
              <button
                type="submit"
                className={`px-8 py-3.5 rounded-xl font-black text-base sm:text-lg uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  isSavedFiscal
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950 active:scale-95 shadow-sky-500/30'
                }`}
              >
                {isSavedFiscal ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>Datos Guardados</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Guardar Datos</span>
                  </>
                )}
              </button>

              {currentUser?.currentTier !== 'lite' && currentUser?.currentTier !== 'quick' && (
                <button
                  type="button"
                  onClick={onOpenCompanyConfig}
                  className="text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Abrir Configuración General Completa
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Tarjeta de Módulos Operativos: Vehículo y Localización (En TODAS las versiones) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          variants={cardVariants}
          className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-sky-400/30 shadow-2xl flex flex-col gap-6 relative"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Módulos de Tarea: Vehículo y Localización
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-1">
                Activa o desactiva la gestión de vehículos o la localización de tareas según tu modelo de negocio
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Apartado 1: Vehículo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-sky-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    Apartado de Vehículo
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Habilita datos de vehículo (matrícula, marca y modelo) en la creación de facturas/presupuestos y el icono de vehículo en el desplegable de clientes.
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleToggleVehicle}
                className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer self-end sm:self-center ${enableVehicle ? "bg-sky-500" : "bg-slate-700"}`}
                title={enableVehicle ? 'Desactivar apartado de vehículo' : 'Activar apartado de vehículo'}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enableVehicle ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Apartado 2: Localización */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-emerald-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Home className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    Apartado de Localización
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Habilita la casilla e input de localización (lugar donde se realiza la tarea u obra) en facturas y muestra el icono de casita en el desplegable de clientes.
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleToggleLocation}
                className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer self-end sm:self-center ${enableLocation ? "bg-emerald-500" : "bg-slate-700"}`}
                title={enableLocation ? 'Desactivar apartado de localización' : 'Activar apartado de localización'}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enableLocation ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Apartado 3: Configuración de IVA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#0F172A]/70 border border-teal-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Percent className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    Tasa de IVA por Defecto (%)
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Especifica el porcentaje de IVA por defecto (ej. 21%). En <strong>facturas</strong> este IVA se aplicará siempre obligatoriamente, mientras que en <strong>presupuestos</strong> se podrá activar o desactivar libremente.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultIvaRate}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setDefaultIvaRate(val);
                    }}
                    className="w-24 px-3 py-2 bg-[#1E293B] border border-teal-400/50 rounded-xl text-white font-mono font-bold text-center text-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
                  />
                  <span className="ml-2 text-white font-bold text-lg">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveIvaRate}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tarjeta 3: Automatización y Sincronización (Solo PRO y ENTERPRISE) */}
        {currentUser?.currentTier !== 'lite' && currentUser?.currentTier !== 'quick' && (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            variants={cardVariants}
            className="bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-8 relative sticky top-[120px] sm:static z-20"
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
                  Rastreo automático de facturas
                </span>
                <span className="text-[18px] text-slate-300 mt-2 max-w-xl leading-relaxed">
                  Permite a la IA de Gestarian revisar continuamente tu correo ({currentUser?.email || "email de acceso"}) en busca de facturas nuevas, tanto al iniciar la app como en segundo plano.
                </span>
              </div>
              <button
                onClick={() => {
                  if (rastreoActivo) {
                    setRastreoActivo(false);
                  } else {
                    handleGoogleSync();
                    setRastreoActivo(true);
                  }
                }}
                disabled={isScanningGmail}
                className={`w-full sm:w-auto px-6 py-3 font-bold text-[18px] rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${rastreoActivo ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
              >
                {isScanningGmail ? "Conectando..." : (rastreoActivo ? "Conectado" : "Desconectado")}
              </button>
            </div>

            {/* Bloque C: Persistencia de datos sin conexión */}
            <div className="flex items-center justify-between gap-4 py-2 border-t border-white/5 pt-6">
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
                className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${offlineActivo ? "bg-emerald-500" : "bg-slate-700"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${offlineActivo ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Tarjeta 2: Personalización del Taller (Solo PRO y ENTERPRISE - Ocultar en LITE y QUICK) */}
        {currentUser?.currentTier !== 'lite' && currentUser?.currentTier !== 'quick' && (
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
          <div className="space-y-4 p-4 rounded-xl bg-[#0F172A]/50 border border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div>
                <span className="text-[18px] font-bold text-white uppercase tracking-wider block">
                  Fondos de Pantalla del Sistema
                </span>
                <span className="text-xs sm:text-sm text-slate-300">
                  {systemWallpaperActive 
                    ? 'Fondos personalizados ACTIVADOS en la pantalla de inicio.' 
                    : 'Fondos DESACTIVADOS (Inicio en fondo negro puro).'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${systemWallpaperActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {systemWallpaperActive ? 'ACTIVADO' : 'DESACTIVADO'}
                </span>
                <button 
                  type="button"
                  onClick={handleToggleSystemWallpaper}
                  className={`w-14 h-7 rounded-full p-1 transition-colors relative shadow-inner shrink-0 cursor-pointer ${systemWallpaperActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  title={systemWallpaperActive ? 'Desactivar fondos de pantalla' : 'Activar fondos de pantalla'}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${systemWallpaperActive ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Móvil / Portrait */}
              <div className="p-3 bg-[#0F172A]/80 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">Inicio (Móvil)</span>
                  <label className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Local</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectFileUpload('portrait', file);
                      }}
                    />
                  </label>
                </div>
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cambiar / Estilizar</span>
                  </div>
                </div>
              </div>

              {/* PC / Landscape */}
              <div className="p-3 bg-[#0F172A]/80 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">Inicio (PC)</span>
                  <label className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Local</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectFileUpload('landscape', file);
                      }}
                    />
                  </label>
                </div>
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cambiar / Estilizar</span>
                  </div>
                </div>
              </div>

              {/* Menú Bento */}
              <div className="p-3 bg-[#0F172A]/80 border border-white/10 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">Menú Bento</span>
                  <label className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Local</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectFileUpload('bento', file);
                      }}
                    />
                  </label>
                </div>
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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                    <Upload className="w-4 h-4 text-[#38BDF8]" />
                    <span>Cambiar / Estilizar</span>
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
      )}

        {/* Botón de Cerrar Sesión al final de la vista */}
        {onLogout && (
          <div className="mt-8 pt-8 border-t border-white/10 flex justify-center pb-8">
            <button
              onClick={onLogout}
              className="px-8 py-3 bg-rose-900/30 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/50 rounded-lg font-bold text-[18px] transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.1)] hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]"
            >
              CERRAR SESIÓN
            </button>
          </div>
        )}
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
