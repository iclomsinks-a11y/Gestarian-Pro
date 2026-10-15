import React, { useState } from 'react';
import { 
  X, CheckCircle2, Mail, ShieldAlert, ArrowRight, ArrowLeft, RefreshCw, 
  KeyRound, Briefcase, Users, Save, Check,
  Sun, Moon, Eye, Inbox
} from 'lucide-react';
import { AppUser, Employee } from '../types';
import { sendRegistrationVerificationCode } from '../services/emailService';
import { EmployeeManager } from './EmployeeManager';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: (user: AppUser) => void;
  currentUser: AppUser;
  initialTab?: 'fiscal' | 'empleados';
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
  const [useCustomSenderEmail, setUseCustomSenderEmail] = useState<boolean>(Boolean(currentUser.useCustomSenderEmail));

  // Business context fields
  const [businessType, setBusinessType] = useState<'autonomo' | 'empresa'>(currentUser.businessType || 'empresa');
  const [sector, setSector] = useState(currentUser.sector || 'Automoción');
  const [branch, setBranch] = useState(currentUser.branch || 'Reparaciones');
  const [specialty, setSpecialty] = useState(currentUser.specialty || 'Chapa y Pintura');

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(currentUser.employees || []);
  const [activeTab, setActiveTab] = useState<'fiscal' | 'empleados'>(initialTab);

  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    if (initialTab) {
      setActiveTab(initialTab);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, initialTab]);

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
      agencyEmail: agencyEmail.trim().toLowerCase(),
      useCustomSenderEmail,
      verified: true,
      businessType,
      sector: sector.trim(),
      branch: branch.trim(),
      specialty: specialty.trim(),
      employees,
      logoUrl: currentUser.logoUrl || '',
      bgPortraitUrl: currentUser.bgPortraitUrl || '',
      bgLandscapeUrl: currentUser.bgLandscapeUrl || '',
      bgBentoMenuUrl: currentUser.bgBentoMenuUrl || '',
      metisTechnicalAdviceEnabled: currentUser.metisTechnicalAdviceEnabled ?? true,
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
      agencyEmail: agencyEmail.trim().toLowerCase(),
      useCustomSenderEmail,
      verified: true,
      createdAt: currentUser.createdAt || new Date().toISOString(),
      currentTier: currentUser.currentTier || 'pro',
      businessType,
      sector: sector.trim(),
      branch: branch.trim(),
      specialty: specialty.trim(),
      employees,
      logoUrl: currentUser.logoUrl || '',
      bgPortraitUrl: currentUser.bgPortraitUrl || '',
      bgLandscapeUrl: currentUser.bgLandscapeUrl || '',
      bgBentoMenuUrl: currentUser.bgBentoMenuUrl || '',
      metisTechnicalAdviceEnabled: currentUser.metisTechnicalAdviceEnabled ?? true,
    };

    onUserSaved(newUser);
    setStep('success');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-[#0F172A]/20 backdrop-blur-md w-full h-full overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900/20">
        {/* Cabecera Fija del Modal: solo arriba centrado "Configuración" y botón volver a la izquierda */}
        <div className="relative flex items-center justify-center px-4 py-3 sm:py-4 bg-[#581C87] border-b border-purple-900/60 shadow-md shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 flex items-center gap-1.5 px-3.5 py-1.5 text-base font-bold text-white hover:bg-white/20 bg-white/10 border border-white/25 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide text-center">
            Configuración
          </h2>
        </div>

        {/* Pestañas Fijas Debajo: Datos Fiscales | Empleados (en una sola línea, sin dibujitos ni contador) */}
        <div className="grid grid-cols-2 gap-2 p-2 sm:px-6 bg-white/40 border-b border-gray-300/60 backdrop-blur-md shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`py-2 px-3 text-sm sm:text-base font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap text-center cursor-pointer ${
              activeTab === 'fiscal'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-white/60 text-[#0F2942] hover:bg-white/80 border border-gray-200/60'
            }`}
          >
            Datos Fiscales
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('empleados')}
            className={`py-2 px-3 text-sm sm:text-base font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap text-center cursor-pointer ${
              activeTab === 'empleados'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-white/60 text-[#0F2942] hover:bg-white/80 border border-gray-200/60'
            }`}
          >
            Empleados
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 w-full">
          <div className="w-[95%] max-w-5xl mx-auto">
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-red-100/80 border border-red-300 text-red-800 text-[18px] rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="mb-4 p-3.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[18px] rounded-lg flex items-center gap-2.5">
                <Check className="w-5 h-5 shrink-0 text-emerald-600" />
                <span className="font-semibold">¡Configuración guardada correctamente!</span>
              </div>
            )}
          </div>

          {step === 'form' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              {/* TAB 1: DATOS FISCALES */}
              <div className={activeTab === 'fiscal' ? 'space-y-6 w-[95%] max-w-5xl mx-auto' : 'hidden'}>
                {/* Tarjeta 1: Clasificación del Negocio */}
                <div className="p-5 rounded-xl border border-gray-300/70 bg-[#E5E7EB] shadow-xs space-y-4">
                  <h3 className="text-[18px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-gray-300/60 pb-2">
                    Clasificación del Negocio
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Tipo de Entidad *
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value as 'autonomo' | 'empresa')}
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] font-semibold outline-none focus:bg-white focus:border-[#0F2942]"
                      >
                        <option value="empresa" className="bg-white text-[#0F172A]">Sociedad / Empresa (S.L., S.A.)</option>
                        <option value="autonomo" className="bg-white text-[#0F172A]">Autónomo / Profesional Independiente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Sector *
                      </label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Ej: Automoción"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] font-semibold outline-none focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Rama de Actividad *
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="Ej: Reparaciones"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] font-semibold outline-none focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Especialidad Concreta *
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ej: Chapa y Pintura"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] font-semibold outline-none focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjeta 2: Datos Fiscales del Emisor */}
                <div className="p-5 rounded-xl border border-gray-300/70 bg-[#E5E7EB] shadow-xs space-y-4">
                  <h3 className="text-[18px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-gray-300/60 pb-2">
                    Datos Fiscales del Emisor
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Marca / Razón Social / Nombre Comercial *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="DM CAR"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] outline-none uppercase font-bold focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        NIF / CIF *
                      </label>
                      <input
                        type="text"
                        required
                        value={cif}
                        onChange={(e) => setCif(e.target.value)}
                        placeholder="B-89324511"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] outline-none uppercase font-mono font-bold focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Teléfono de Contacto *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 912 345 678"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] font-semibold outline-none focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Domicilio Fiscal Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={fiscalAddress}
                        onChange={(e) => setFiscalAddress(e.target.value)}
                        placeholder="Polígono Industrial Las Eras, Nave 14, 28052 Madrid"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] font-semibold outline-none focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Correo Electrónico Corporativo *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@dmcar.es"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] outline-none font-mono font-bold focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#0F2942] mb-1.5">
                        Email de la gestoría (Informes trimestrales)
                      </label>
                      <input
                        type="email"
                        value={agencyEmail}
                        onChange={(e) => setAgencyEmail(e.target.value)}
                        placeholder="gestoria@asesores.com"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white/80 border border-gray-300/80 rounded-lg text-[#0F172A] outline-none font-mono font-bold focus:bg-white focus:border-[#0F2942]"
                      />
                    </div>

                    {/* Tarjeta de autorización de email */}
                    <div className="sm:col-span-2 p-4 bg-[#E5E7EB] border border-gray-300/70 rounded-xl space-y-1.5 my-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomSenderEmail}
                          onChange={(e) => setUseCustomSenderEmail(e.target.checked)}
                          className="w-5 h-5 accent-[#0F2942] rounded cursor-pointer mt-0.5 shrink-0"
                        />
                        <div>
                          <span className="text-[18px] font-bold text-[#0F2942] block leading-snug">
                            Autorizo / Acepto enviar los correos desde mi dirección de email ({email || 'contacto@empresa.com'})
                          </span>
                          <span className="text-[15px] text-[#0F2942]/80 block mt-1 leading-normal font-medium">
                            Si no se activa, por defecto todas las notificaciones y documentos saldrán desde <strong className="text-[#0F2942]">notificaciones@gestarian.com</strong> con dirección de respuesta a tu correo.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 2: EMPLEADOS (CON TARJETAS Y EPÍGRAFES OFICIALES) */}
              <div className={activeTab === 'empleados' ? 'block w-[95%] mx-auto' : 'hidden'}>
                <EmployeeManager employees={employees} onChange={setEmployees} />
              </div>

              {/* Botones Cerrar y Guardar abajo del todo - No flotantes, ambos en la misma fila */}
              <div className={`pt-6 pb-8 border-t border-gray-300/60 flex items-center justify-between gap-3 mt-6 ${activeTab === 'empleados' ? 'w-[95%] mx-auto' : 'w-[95%] max-w-5xl mx-auto'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-[18px] font-bold text-[#0F2942] bg-[#E5E7EB] hover:bg-gray-300 border border-gray-300/80 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <X className="w-5 h-5 text-[#0F2942]" />
                  <span>Cerrar</span>
                </button>
                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="flex-1 sm:flex-none px-8 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[18px] font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  {isSendingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : isAlreadyVerified ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
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
    </div>
  );
};
