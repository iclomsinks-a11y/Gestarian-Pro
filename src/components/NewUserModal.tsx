import React, { useState } from 'react';
import { 
  X, CheckCircle2, Mail, ShieldAlert, ArrowRight, RefreshCw, 
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#F8F7F3] border border-[#D5D2C9] rounded-xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera del Modal de Configuración */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E0D8] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[24px] font-bold text-[#0F172A] flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#0F2942]" />
              Configuración de la Empresa
            </h2>
            <p className="text-[18px] text-[#64748B] mt-0.5">
              Datos fiscales del emisor y gestión de plantilla de empleados
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[18px] font-bold text-[#64748B] hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
            title="Cerrar configuración"
          >
            <X className="w-5 h-5" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Pestañas: Datos Fiscales | Empleados */}
        <div className="flex border-b border-[#E2E0D8] bg-[#F1F5F9]/50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`px-5 py-3.5 text-[18px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2.5 ${
              activeTab === 'fiscal'
                ? 'text-[#0F2942] border-b-2 border-[#0F2942] bg-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Datos Fiscales
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('empleados')}
            className={`px-5 py-3.5 text-[18px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2.5 ${
              activeTab === 'empleados'
                ? 'text-[#0F2942] border-b-2 border-[#0F2942] bg-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Users className="w-5 h-5" />
            Empleados ({employees.length})
          </button>
        </div>

        {/* Cuerpo del Modal con scroll */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-[18px] rounded-lg flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[18px] rounded-lg flex items-center gap-2.5">
              <Check className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">¡Configuración guardada correctamente!</span>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              {/* TAB 1: DATOS FISCALES */}
              <div className={activeTab === 'fiscal' ? 'space-y-6' : 'hidden'}>
                <div className="space-y-4">
                  <h3 className="text-[18px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1.5">
                    Clasificación del Negocio
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Tipo de Entidad *
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value as 'autonomo' | 'empresa')}
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      >
                        <option value="empresa">Sociedad / Empresa (S.L., S.A.)</option>
                        <option value="autonomo">Autónomo / Profesional Independiente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Sector *
                      </label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Ej: Automoción"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Rama de Actividad *
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="Ej: Reparaciones"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Especialidad Concreta *
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ej: Chapa y Pintura"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[18px] font-bold uppercase tracking-wider text-[#0F2942] border-b border-[#E2E0D8] pb-1.5">
                    Datos Fiscales del Emisor
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Marca / Razón Social / Nombre Comercial *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="DM CAR"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none uppercase font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        NIF / CIF *
                      </label>
                      <input
                        type="text"
                        required
                        value={cif}
                        onChange={(e) => setCif(e.target.value)}
                        placeholder="B-89324511"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Teléfono de Contacto *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 912 345 678"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Domicilio Fiscal Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={fiscalAddress}
                        onChange={(e) => setFiscalAddress(e.target.value)}
                        placeholder="Polígono Industrial Las Eras, Nave 14, 28052 Madrid"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Correo Electrónico Corporativo *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@dmcar.es"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[16.5px] font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                        Email de la gestoría (Informes trimestrales)
                      </label>
                      <input
                        type="email"
                        value={agencyEmail}
                        onChange={(e) => setAgencyEmail(e.target.value)}
                        placeholder="gestoria@asesores.com"
                        className="w-full px-3.5 py-2.5 text-[18px] bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 2: EMPLEADOS (CON TARJETAS Y EPÍGRAFES OFICIALES) */}
              <div className={activeTab === 'empleados' ? 'block' : 'hidden'}>
                <EmployeeManager employees={employees} onChange={setEmployees} />
              </div>

              {/* Pie de guardado */}
              <div className="pt-4 border-t border-[#E2E0D8] flex items-center justify-between sticky bottom-0 bg-[#F8F7F3] pb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[18px] font-bold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500" />
                  <span>Cerrar</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[16.5px] text-[#64748B]">
                    * Datos protegidos por normativa fiscal y laboral
                  </span>
                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[18px] font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer"
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
    </div>
  );
};
