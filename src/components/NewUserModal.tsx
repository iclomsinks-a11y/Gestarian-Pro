import React, { useState, useRef } from 'react';
import { 
  X, CheckCircle2, Mail, ShieldAlert, ArrowRight, RefreshCw, 
  KeyRound, Briefcase, Palette, Users, Save, Check, Sparkles, Upload, Image as ImageIcon,
  Sun, Moon, Eye, Inbox
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { AppUser, Employee, HighContrastThemeId } from '../types';
import { sendRegistrationVerificationCode } from '../services/emailService';
import { EmployeeManager } from './EmployeeManager';
import { ImageCustomizerModal } from './ImageCustomizerModal';
import { HIGH_CONTRAST_THEMES } from '../utils/themeConfig';
import { LongPressImagePreview } from './LongPressImagePreview';
import { ReplaceImageModal, ReplaceTargetInfo } from './ReplaceImageModal';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: (user: AppUser) => void;
  currentUser: AppUser;
  initialTab?: 'fiscal' | 'personalizacion' | 'empleados';
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  isOpen,
  onClose,
  onUserSaved,
  currentUser,
  initialTab = 'fiscal',
}) => {
  const isAlreadyVerified = Boolean(currentUser.verified);
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form');

  // Mandatory fields for invoice issuer
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [fiscalAddress, setFiscalAddress] = useState(currentUser.fiscalAddress || '');
  const [cif, setCif] = useState(currentUser.cif || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [agencyEmail, setAgencyEmail] = useState(currentUser.agencyEmail || '');

  // Business context fields
  const [businessType, setBusinessType] = useState<'autonomo' | 'empresa'>(currentUser.businessType || 'empresa');
  const [sector, setSector] = useState(currentUser.sector || 'Automoción');
  const [branch, setBranch] = useState(currentUser.branch || 'Reparaciones');
  const [specialty, setSpecialty] = useState(currentUser.specialty || 'Chapa y Pintura');

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(currentUser.employees || []);

  // Customization fields
  const [logoUrl, setLogoUrl] = useState(currentUser.logoUrl || '');
  const [bgPortraitUrl, setBgPortraitUrl] = useState(currentUser.bgPortraitUrl || '');
  const [bgLandscapeUrl, setBgLandscapeUrl] = useState(currentUser.bgLandscapeUrl || '');
  const [bgBentoMenuUrl, setBgBentoMenuUrl] = useState(currentUser.bgBentoMenuUrl || '');
  const [metisTechnicalAdviceEnabled, setMetisTechnicalAdviceEnabled] = useState(currentUser.metisTechnicalAdviceEnabled ?? true);
  const [activeTab, setActiveTab] = useState<'fiscal' | 'personalizacion' | 'empleados'>(initialTab);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTargetInfo | null>(null);

  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    if (initialTab) {
      setActiveTab(initialTab);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCustomizerOpen) {
          setIsCustomizerOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isCustomizerOpen]);

  if (!isOpen) return null;

  const handleDirectSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !fiscalAddress.trim() || !cif.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Todos los datos fiscales marcados con asterisco (*) son obligatorios.');
      return;
    }

    const updatedUser: AppUser = {
      ...currentUser,
      fullName: fullName.trim().toUpperCase(),
      fiscalAddress: fiscalAddress.trim(),
      cif: cif.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      verified: true,
      businessType,
      sector: sector.trim(),
      branch: branch.trim(),
      specialty: specialty.trim(),
      employees,
      logoUrl: logoUrl.trim(),
      bgPortraitUrl: bgPortraitUrl.trim(),
      bgLandscapeUrl: bgLandscapeUrl.trim(),
      bgBentoMenuUrl: bgBentoMenuUrl.trim(),
      metisTechnicalAdviceEnabled,
    };

    onUserSaved(updatedUser);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 1200);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isAlreadyVerified) {
      handleDirectSave(e);
      return;
    }

    if (!fullName.trim() || !fiscalAddress.trim() || !cif.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Todos los campos son obligatorios para generar facturas válidas.');
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await sendRegistrationVerificationCode(email.trim(), fullName.trim());
      if (res.success && res.simulatedCode) {
        setSentCode(res.simulatedCode);
        setStep('verify');
      } else {
        setErrorMessage('Error enviando el código. Revisa la configuración.');
      }
    } catch {
      setErrorMessage('No se pudo conectar con el servicio de correo.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (verificationCode.trim() !== sentCode.trim()) {
      setErrorMessage('El código introducido no coincide o ha caducado.');
      return;
    }

    const newUser: AppUser = {
      id: currentUser.id || `usr_${Date.now()}`,
      fullName: fullName.trim().toUpperCase(),
      fiscalAddress: fiscalAddress.trim(),
      cif: cif.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      verified: true,
      createdAt: currentUser.createdAt || new Date().toISOString(),
      currentTier: currentUser.currentTier || 'pro',
      businessType,
      sector: sector.trim(),
      branch: branch.trim(),
      specialty: specialty.trim(),
      employees,
      logoUrl: logoUrl.trim(),
      bgPortraitUrl: bgPortraitUrl.trim(),
      bgLandscapeUrl: bgLandscapeUrl.trim(),
      bgBentoMenuUrl: bgBentoMenuUrl.trim(),
      metisTechnicalAdviceEnabled,
    };

    onUserSaved(newUser);
    setStep('success');
  };

  const handleLocalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomizedImage = (
    variant: { styleName: string; dataUrl: string },
    targetSlot: 'portrait' | 'landscape' | 'bento' | 'all'
  ) => {
    if (targetSlot === 'portrait' || targetSlot === 'all') {
      setBgPortraitUrl(variant.dataUrl);
    }
    if (targetSlot === 'landscape' || targetSlot === 'all') {
      setBgLandscapeUrl(variant.dataUrl);
    }
    if (targetSlot === 'bento' || targetSlot === 'all') {
      setBgBentoMenuUrl(variant.dataUrl);
    }
  };

  const handleImageReplaced = (slot: ReplaceTargetInfo['slot'], newUrl: string) => {
    let updatedPortrait = bgPortraitUrl;
    let updatedLandscape = bgLandscapeUrl;
    let updatedBento = bgBentoMenuUrl;
    let updatedLogo = logoUrl;

    if (slot === 'portrait' || slot === 'custom_main') {
      updatedPortrait = newUrl;
      setBgPortraitUrl(newUrl);
    }
    if (slot === 'landscape') {
      updatedLandscape = newUrl;
      setBgLandscapeUrl(newUrl);
    }
    if (slot === 'bento') {
      updatedBento = newUrl;
      setBgBentoMenuUrl(newUrl);
    }
    if (slot === 'logo') {
      updatedLogo = newUrl;
      setLogoUrl(newUrl);
    }

    onUserSaved({
      ...currentUser,
      logoUrl: updatedLogo,
      bgPortraitUrl: updatedPortrait,
      bgLandscapeUrl: updatedLandscape,
      bgBentoMenuUrl: updatedBento,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#F8F7F3] border border-[#D5D2C9] rounded-xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera del Modal de Configuración */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0F2942]" />
              Configuración de la Empresa
            </h2>
            <p className="text-xs text-[#64748B]">
              Datos fiscales del emisor, personalización visual y gestión de empleados
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
            title="Cerrar configuración"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Pestañas: Datos Fiscales | Personalización | Empleados */}
        <div className="flex border-b border-[#E2E0D8] bg-[#F1F5F9]/50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeTab === 'fiscal'
                ? 'text-[#0F2942] border-b-2 border-[#0F2942] bg-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Datos Fiscales
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personalizacion')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeTab === 'personalizacion'
                ? 'text-[#0F2942] border-b-2 border-[#0F2942] bg-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Palette className="w-4 h-4" />
            Personalización
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('empleados')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              activeTab === 'empleados'
                ? 'text-[#0F2942] border-b-2 border-[#0F2942] bg-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Users className="w-4 h-4" />
            Empleados ({employees.length})
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">¡Configuración guardada correctamente!</span>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              {/* TAB 1: DATOS FISCALES */}
              <div className={activeTab === 'fiscal' ? 'space-y-6' : 'hidden'}>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1">
                    Clasificación del Negocio
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Tipo de Entidad *
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value as 'autonomo' | 'empresa')}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      >
                        <option value="empresa">Sociedad / Empresa (S.L., S.A.)</option>
                        <option value="autonomo">Autónomo / Profesional Independiente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Sector *
                      </label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Ej: Automoción"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Rama de Actividad *
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="Ej: Reparaciones"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Especialidad Concreta *
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ej: Chapa y Pintura"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1">
                    Datos Fiscales del Emisor
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Marca / Razón Social / Nombre Comercial *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="DM CAR"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none uppercase font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        NIF / CIF *
                      </label>
                      <input
                        type="text"
                        required
                        value={cif}
                        onChange={(e) => setCif(e.target.value)}
                        placeholder="B-89324511"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Teléfono de Contacto *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 912 345 678"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Domicilio Fiscal Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={fiscalAddress}
                        onChange={(e) => setFiscalAddress(e.target.value)}
                        placeholder="Polígono Industrial Las Eras, Nave 14, 28052 Madrid"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Correo Electrónico Corporativo *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@dmcar.es"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                        Email de la gestoría (Informes trimestrales)
                      </label>
                      <input
                        type="email"
                        value={agencyEmail}
                        onChange={(e) => setAgencyEmail(e.target.value)}
                        placeholder="gestoria@asesores.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 2: PERSONALIZACIÓN */}
              <div className={activeTab === 'personalizacion' ? 'space-y-6' : 'hidden'}>
                <div className="space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1">
                    Personalización Visual y Fondos de Pantalla
                  </h3>

                  {/* Banner destacada para IA Estilizadora con Imagen Local */}
                  <div className="p-4 bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] text-white rounded-xl border-2 border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#38BDF8] animate-spin" />
                        <h4 className="font-bold text-sm sm:text-base text-white">
                          Estudio IA: Personalizar Fondos desde Imagen Local
                        </h4>
                      </div>
                      <p className="text-xs text-[#CBD5E1] max-w-xl">
                        Sube una foto desde tu dispositivo local y la IA generará 3 estilos adicionales (Artística, Manga y Futurista) respetando el aspecto de la original. Podrás elegir y asignar a Inicio o Menú Bento.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomizerOpen(true)}
                      className="shrink-0 px-4 py-2.5 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0F172A] font-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:scale-105 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir y Estilizar con IA</span>
                    </button>
                  </div>

                  {/* Logotipo de la Empresa */}
                  <div className="bg-white p-4 rounded-xl border border-[#D5D2C9] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                        Logotipo de la Empresa - Recomendado 250 x 250 px
                      </label>
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleLocalLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setReplaceTarget({
                          slot: 'logo',
                          label: 'Logotipo de la Empresa',
                          currentUrl: logoUrl,
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F2942] transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir desde dispositivo</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Se muestra en la cabecera arriba a la izquierda (pulsable para volver a INICIO) y en todos los presupuestos/facturas.
                    </p>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="URL o ruta de la imagen del logotipo"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                    />

                    {/* Previsualización interactiva con soporte de 3 segundos */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#0F2942] uppercase tracking-wider">
                          Vista previa del logotipo
                        </span>
                        <span className="text-[10px] text-[#0284C7] font-semibold">
                          Mantén pulsada 3s para reemplazar desde galería
                        </span>
                      </div>
                      <div className="max-w-xs">
                        <LongPressImagePreview
                          imageUrl={logoUrl}
                          altText="Vista previa del logotipo"
                          title="Logotipo de la Empresa"
                          slotLabel="Logotipo"
                          heightClass="h-28"
                          onLongPressTrigger={() => setReplaceTarget({
                            slot: 'logo',
                            label: 'Logotipo de la Empresa',
                            currentUrl: logoUrl,
                          })}
                          onDirectUploadClick={() => setReplaceTarget({
                            slot: 'logo',
                            label: 'Logotipo de la Empresa',
                            currentUrl: logoUrl,
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fondos Individuales */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2942]">
                        Fondos de Pantalla Personalizados
                      </h4>
                      <span className="hidden sm:inline-flex text-[11px] text-[#0284C7] font-semibold bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
                        Mantén pulsada cualquier imagen 3s para reemplazar desde la galería
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Portrait */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#D5D2C9] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                            Fondo Inicio (Móvil / Portrait)
                          </label>
                          <button
                            type="button"
                            onClick={() => setReplaceTarget({
                              slot: 'portrait',
                              label: 'Fondo Inicio (Móvil / Portrait)',
                              currentUrl: bgPortraitUrl,
                              defaultFallbackUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                            })}
                            className="text-[10px] font-bold text-[#0284C7] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Galería</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={bgPortraitUrl}
                          onChange={(e) => setBgPortraitUrl(e.target.value)}
                          placeholder="https://... o generado por IA"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                        />
                        <LongPressImagePreview
                          imageUrl={bgPortraitUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                          altText="Fondo Inicio Móvil"
                          title="Fondo Inicio Móvil"
                          slotLabel="Móvil / Portrait"
                          heightClass="h-32"
                          onLongPressTrigger={() => setReplaceTarget({
                            slot: 'portrait',
                            label: 'Fondo Inicio (Móvil / Portrait)',
                            currentUrl: bgPortraitUrl,
                            defaultFallbackUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                          })}
                          onDirectUploadClick={() => setReplaceTarget({
                            slot: 'portrait',
                            label: 'Fondo Inicio (Móvil / Portrait)',
                            currentUrl: bgPortraitUrl,
                            defaultFallbackUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
                          })}
                        />
                      </div>

                      {/* Landscape */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#D5D2C9] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                            Fondo Inicio (PC / Landscape)
                          </label>
                          <button
                            type="button"
                            onClick={() => setReplaceTarget({
                              slot: 'landscape',
                              label: 'Fondo Inicio (PC / Landscape)',
                              currentUrl: bgLandscapeUrl,
                              defaultFallbackUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
                            })}
                            className="text-[10px] font-bold text-[#0284C7] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Galería</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={bgLandscapeUrl}
                          onChange={(e) => setBgLandscapeUrl(e.target.value)}
                          placeholder="https://... o generado por IA"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                        />
                        <LongPressImagePreview
                          imageUrl={bgLandscapeUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'}
                          altText="Fondo Inicio PC"
                          title="Fondo Inicio PC"
                          slotLabel="PC / Landscape"
                          heightClass="h-32"
                          onLongPressTrigger={() => setReplaceTarget({
                            slot: 'landscape',
                            label: 'Fondo Inicio (PC / Landscape)',
                            currentUrl: bgLandscapeUrl,
                            defaultFallbackUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
                          })}
                          onDirectUploadClick={() => setReplaceTarget({
                            slot: 'landscape',
                            label: 'Fondo Inicio (PC / Landscape)',
                            currentUrl: bgLandscapeUrl,
                            defaultFallbackUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
                          })}
                        />
                      </div>

                      {/* Bento Menu */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#D5D2C9] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                            Fondo Menú Bento (Botones)
                          </label>
                          <button
                            type="button"
                            onClick={() => setReplaceTarget({
                              slot: 'bento',
                              label: 'Fondo Menú Bento (Botones)',
                              currentUrl: bgBentoMenuUrl,
                              defaultFallbackUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'
                            })}
                            className="text-[10px] font-bold text-[#0284C7] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Galería</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={bgBentoMenuUrl}
                          onChange={(e) => setBgBentoMenuUrl(e.target.value)}
                          placeholder="https://... o generado por IA"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                        />
                        <LongPressImagePreview
                          imageUrl={bgBentoMenuUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'}
                          altText="Fondo Menú Bento"
                          title="Fondo Menú Bento"
                          slotLabel="Menú Bento"
                          heightClass="h-32"
                          onLongPressTrigger={() => setReplaceTarget({
                            slot: 'bento',
                            label: 'Fondo Menú Bento (Botones)',
                            currentUrl: bgBentoMenuUrl,
                            defaultFallbackUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'
                          })}
                          onDirectUploadClick={() => setReplaceTarget({
                            slot: 'bento',
                            label: 'Fondo Menú Bento (Botones)',
                            currentUrl: bgBentoMenuUrl,
                            defaultFallbackUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2564&auto=format&fit=crop'
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Metis */}
                  <div className="pt-3 border-t border-[#E2E0D8]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-[#0F2942] border border-[#38BDF8] flex items-center justify-center text-[10px] font-black text-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                        AI
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2942]">
                        Asistente Inteligente del Taller (Metis)
                      </h4>
                    </div>
                    <label className="flex items-start gap-3 p-3 bg-white border border-[#CBD5E1] rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-colors">
                      <input
                        type="checkbox"
                        checked={metisTechnicalAdviceEnabled}
                        onChange={(e) => setMetisTechnicalAdviceEnabled(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#0F2942] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#0F172A] block">
                          Permitir que Metis proporcione consejos técnicos de chapa y pintura / reparación
                        </span>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">
                          Si está activado, Metis asesorará al equipo en tiempos de secado de imprimación/barniz, códigos de pintura OEM, proporciones de catalizador, técnicas de desabollado y preparación de superficies.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Automatización de Facturas e IA (Integración Gmail) */}
                  <div className="pt-3 border-t border-[#E2E0D8]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-[#0F2942] border border-purple-500 flex items-center justify-center text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                        <Inbox className="w-3 h-3" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2942]">
                        Automatización de Facturas e IA
                      </h4>
                    </div>
                    <div className="flex flex-col items-start gap-3 p-4 bg-white border border-[#CBD5E1] rounded-lg">
                      <span className="text-xs font-bold text-[#0F172A] block">
                        Integración con Google Workspace / Gmail
                      </span>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        Conecta tu cuenta de Gmail de forma segura para que nuestra IA escanee, extraiga y procese tus facturas adjuntas automáticamente en segundo plano.
                      </span>
                      <button
                        type="button"
                        onClick={handleGoogleSync}
                        className="mt-2 px-4 py-2 bg-[#0F2942] text-white hover:bg-[#1e4a7a] active:bg-[#0a1b2d] font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                      >
                        <Mail className="w-4 h-4 text-purple-400" />
                        Conectar cuenta de Google
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 3: EMPLEADOS (CON TARJETAS Y EPÍGRAFES OFICIALES) */}
              <div className={activeTab === 'empleados' ? 'block' : 'hidden'}>
                <EmployeeManager employees={employees} onChange={setEmployees} />
              </div>

              {/* Pie de guardado */}
              <div className="pt-4 border-t border-[#E2E0D8] flex items-center justify-between sticky bottom-0 bg-[#F8F7F3] pb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                  <span>Cerrar</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[11px] text-[#64748B]">
                    * Datos protegidos por normativa fiscal y laboral
                  </span>
                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {isSendingCode ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando código...</span>
                      </>
                    ) : isAlreadyVerified ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar Configuración</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar y Verificar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div className="p-4 bg-white border border-[#E2E0D8] rounded-xl text-center">
                <Mail className="w-8 h-8 mx-auto text-[#1E3A8A] mb-2" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                  Introduce el código de verificación
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Hemos enviado un código numérico a:
                </p>
                <p className="text-xs font-semibold text-[#0F2942] mt-0.5">{email}</p>
                <div className="mt-3 py-1.5 px-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg inline-block">
                  <span className="text-[11px] text-[#475569]">
                    Código de verificación generado: <strong className="text-[#0F2942] font-mono tracking-widest">{sentCode}</strong>
                  </span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-48 mx-auto block px-4 py-2.5 text-center text-xl tracking-[0.5em] font-mono bg-white border-2 border-[#0F2942] rounded-lg text-[#0F172A] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg cursor-pointer"
                >
                  Volver al Formulario
                </button>
                <button
                  type="submit"
                  disabled={verificationCode.length !== 6}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] disabled:bg-[#94A3B8] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Confirmar y Guardar</span>
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] uppercase tracking-wide">
                Configuración Guardada
              </h3>
              <p className="text-xs text-[#475569] max-w-sm mx-auto">
                Los datos de <strong>{fullName}</strong> ({cif}) y la plantilla de empleados han sido actualizados satisfactoriamente.
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F2942] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs hover:bg-[#1E3A8A]"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de personalización con IA de fondos a partir de imagen local */}
      <ImageCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentUser={currentUser}
        onSaveBackgrounds={(updated) => {
          if (updated.bgPortraitUrl) setBgPortraitUrl(updated.bgPortraitUrl);
          if (updated.bgLandscapeUrl) setBgLandscapeUrl(updated.bgLandscapeUrl);
          if (updated.bgBentoMenuUrl) setBgBentoMenuUrl(updated.bgBentoMenuUrl);
        }}
        onSelectImage={handleApplyCustomizedImage}
      />

      {/* Modal para reemplazar imagen tras mantener pulsada durante tres segundos */}
      <ReplaceImageModal
        isOpen={Boolean(replaceTarget)}
        onClose={() => setReplaceTarget(null)}
        target={replaceTarget}
        onImageReplaced={handleImageReplaced}
      />
    </div>
  );
};
