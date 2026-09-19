import React, { useState } from 'react';
import { X, UserCheck, Smartphone, Lock, Mail, FileText, ArrowRight, ShieldCheck, CheckCircle2, Building, AlertCircle, Wrench, Users, LogOut, Check } from 'lucide-react';
import { Client, AppUser, Employee, GestarianDocument } from '../types';

interface AccessSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  user: AppUser;
  documents?: GestarianDocument[];
  activeEmployeeSession?: Employee | null;
  onSelectClientSession: (client: Client) => void;
  onSelectEmployeeSession?: (employee: Employee) => void;
  onLogoutEmployeeSession?: () => void;
  onNavigateToTaller?: () => void;
  onOpenNewUserModal: () => void;
}

export const AccessSelectorModal: React.FC<AccessSelectorModalProps> = ({
  isOpen,
  onClose,
  clients,
  user,
  documents = [],
  activeEmployeeSession,
  onSelectClientSession,
  onSelectEmployeeSession,
  onLogoutEmployeeSession,
  onNavigateToTaller,
  onOpenNewUserModal,
}) => {
  const [activeTab, setActiveTab] = useState<'cliente' | 'autorizado' | 'usuario'>('cliente');

  // Formulario cliente
  const [clientEmail, setClientEmail] = useState('');
  const [clientCif, setClientCif] = useState('');
  const [clientError, setClientError] = useState('');

  // Formulario autorizado / operario
  const [empIdentifier, setEmpIdentifier] = useState('');
  const [empError, setEmpError] = useState('');
  const [empSuccess, setEmpSuccess] = useState('');

  // Formulario usuario / taller
  const [userEmail, setUserEmail] = useState(user.email || '');
  const [userPassword, setUserPassword] = useState(user.cif || '');
  const [userSuccess, setUserSuccess] = useState('');
  const [userError, setUserError] = useState('');

  if (!isOpen) return null;

  const employees = user.employees || [];

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    const emailClean = clientEmail.trim().toLowerCase();
    const cifClean = clientCif.trim().toUpperCase().replace(/[^A-Za-z0-9]/g, '');

    if (!emailClean || !cifClean) {
      setClientError('Por favor, introduzca su Email y su DNI/CIF.');
      return;
    }

    // Buscar en la base de datos de clientes invitados
    const foundClient = clients.find((c) => {
      const matchEmail = c.email && c.email.trim().toLowerCase() === emailClean;
      const matchCif = c.cif && c.cif.trim().toUpperCase().replace(/[^A-Za-z0-9]/g, '') === cifClean;
      return matchEmail && matchCif;
    });

    if (foundClient) {
      onSelectClientSession(foundClient);
      onClose();
    } else {
      setClientError(
        'No existe ningún cliente registrado con este Email y DNI/CIF. Recuerde que únicamente los clientes invitados y dados de alta en la base de datos de su taller pueden acceder. Contacte con su taller para solicitar su alta.'
      );
    }
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');
    setEmpSuccess('');

    const cleanInput = empIdentifier.trim().toLowerCase();
    if (!cleanInput) {
      setEmpError('Por favor, introduzca su DNI, Email o Nombre.');
      return;
    }

    const foundEmp = employees.find((emp) => {
      const matchDni = emp.dni && emp.dni.trim().toLowerCase() === cleanInput;
      const matchEmail = emp.email && emp.email.trim().toLowerCase() === cleanInput;
      const matchName = emp.name && emp.name.trim().toLowerCase().includes(cleanInput);
      return matchDni || matchEmail || matchName;
    });

    if (foundEmp) {
      if (onSelectEmployeeSession) {
        onSelectEmployeeSession(foundEmp);
      }
      setEmpSuccess(`Sesión iniciada correctamente para ${foundEmp.name}`);
      setTimeout(() => {
        onClose();
        if (onNavigateToTaller) onNavigateToTaller();
      }, 600);
    } else {
      setEmpError('No se encontró ningún autorizado/empleado con esos datos en la plantilla de la empresa.');
    }
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!userEmail.trim() || !userPassword.trim()) {
      setUserError('Introduzca Email y Contraseña/DNI.');
      return;
    }

    setUserSuccess(`Acceso verificado para ${user.fullName}. Redirigiendo al Portal de Usuario / ERP Taller...`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F172A]/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#F8F7F3] border border-[#D5D2C9] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-5 bg-[#0F2942] text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#38BDF8] block">
              www.gestarian.com • Portal Unificado
            </span>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              Acceso a Portales Gestarian
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Selección */}
        <div className="grid grid-cols-3 border-b border-[#E2E0D8] bg-white text-center">
          <button
            type="button"
            onClick={() => setActiveTab('cliente')}
            className={`py-3 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'cliente'
                ? 'border-[#0F2942] text-[#0F2942] bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2942]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#1E3A8A] shrink-0" />
            <span className="truncate">Clientes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('autorizado')}
            className={`py-3 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'autorizado'
                ? 'border-blue-600 text-blue-900 bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-blue-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Autorizados</span>
            {activeEmployeeSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse absolute top-2 right-2"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usuario')}
            className={`py-3 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'usuario'
                ? 'border-[#0F2942] text-[#0F2942] bg-[#F8F7F3]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2942]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#0F2942] shrink-0" />
            <span className="truncate">Titular / Taller</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#F8F7F3]">
          {activeTab === 'cliente' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 text-xs text-[#1E3A8A]">
                <ShieldCheck className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Portal del Cliente Exclusivo</h4>
                  <p className="mt-0.5 text-[11px] text-blue-900 leading-relaxed">
                    Solo los clientes invitados y registrados en la base de datos de los talleres podrán entrar a su área personal de cliente introduciendo su email y DNI/CIF.
                  </p>
                </div>
              </div>

              {clientError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{clientError}</span>
                </div>
              )}

              <form onSubmit={handleClientLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Email de Cliente Registrado *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="ejemplo@cliente.es"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#0F2942]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    DNI / CIF del Cliente *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      required
                      value={clientCif}
                      onChange={(e) => setClientCif(e.target.value.toUpperCase())}
                      placeholder="Ej: 53291048Z o B-83492019"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold uppercase bg-white border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#0F2942]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Entrar a mi Área Personal de Cliente</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Clientes de prueba disponibles */}
              <div className="pt-4 border-t border-[#E2E0D8]">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-2">
                  Clientes Invitados en Base de Datos (Acceso Rápido de Prueba):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClientEmail(c.email || '');
                        setClientCif(c.cif || '');
                      }}
                      className="w-full p-2 bg-white hover:bg-blue-50/50 border border-[#CBD5E1] rounded-lg text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-[#0F172A] block">{c.name}</span>
                        <span className="text-[10px] text-[#64748B]">{c.email}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-[#F1F5F9] px-2 py-0.5 rounded text-[#1E3A8A]">
                        {c.cif}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'autorizado' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-3 text-xs text-blue-900">
                <Wrench className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Portal de Autorizados y Operarios del Taller</h4>
                  <p className="mt-0.5 text-[11px] text-blue-800 leading-relaxed">
                    Acceso para operarios y empleados autorizados de la empresa. Inicie sesión como Autorizado para gestionar las reparaciones y órdenes de trabajo asignadas a su perfil y marcar su finalización.
                  </p>
                </div>
              </div>

              {/* Sesión activa si ya está logueado un Autorizado */}
              {activeEmployeeSession && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Sesión Activa de Autorizado</span>
                        <h4 className="font-bold text-emerald-950 text-sm">{activeEmployeeSession.name}</h4>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-full font-bold">
                      {activeEmployeeSession.profession || 'Operario'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigateToTaller) onNavigateToTaller();
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Ver Mis Reparaciones y OTs Adjudicadas</span>
                    </button>

                    {onLogoutEmployeeSession && (
                      <button
                        type="button"
                        onClick={onLogoutEmployeeSession}
                        className="py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {empError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{empError}</span>
                </div>
              )}

              {empSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{empSuccess}</span>
                </div>
              )}

              {/* Lista de Empleados Registrados con Selección Rápida */}
              <div>
                <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-2">
                  Plantilla de Autorizados Registrados ({employees.length}):
                </span>

                {employees.length === 0 ? (
                  <div className="p-4 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 text-center">
                    No hay ningún empleado o autorizado dado de alta en la configuración del emisor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {employees.map((emp) => {
                      const assignedCount = documents.filter(
                        (d) => d.assignedEmployeeId === emp.id || d.createdByName === emp.name
                      ).length;
                      const isCurrent = activeEmployeeSession?.id === emp.id;

                      return (
                        <div
                          key={emp.id}
                          className={`p-3 bg-white border rounded-xl flex items-center justify-between text-xs transition-all ${
                            isCurrent ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#CBD5E1] hover:border-blue-400'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0F172A]">{emp.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                                  ACTIVO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#64748B]">
                              {emp.profession || 'Operario de Taller'} • DNI: {emp.dni || 'Sin DNI'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded-md font-bold border border-blue-200">
                              {assignedCount} OTs
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectEmployeeSession) {
                                  onSelectEmployeeSession(emp);
                                }
                                onClose();
                                if (onNavigateToTaller) onNavigateToTaller();
                              }}
                              className="px-3 py-1.5 bg-[#0F2942] hover:bg-blue-800 text-white font-bold rounded-lg transition-colors text-[11px] cursor-pointer"
                            >
                              Entrar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Formulario manual de login para autorizados */}
              <form onSubmit={handleEmployeeLogin} className="pt-3 border-t border-[#E2E0D8] space-y-3">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                  O Iniciar Sesión por DNI / Email de Autorizado:
                </span>

                <div>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={empIdentifier}
                      onChange={(e) => setEmpIdentifier(e.target.value)}
                      placeholder="DNI, Email o Nombre del Autorizado"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#0F2942]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Iniciar Sesión como Autorizado</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg flex items-start gap-3 text-xs text-[#0F2942]">
                <Building className="w-5 h-5 text-[#0F2942] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Portal del Usuario (Taller / Empresa)</h4>
                  <p className="mt-0.5 text-[11px] text-[#475569] leading-relaxed">
                    Los usuarios del taller se autentican con su email y contraseña. En principio la contraseña es su DNI/CIF y posteriormente se le invita a cambiarla.
                  </p>
                </div>
              </div>

              {userError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {userError}
                </div>
              )}

              {userSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUserLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Email de Usuario / Taller *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="contacto@dmcar.es"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#0F2942]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#64748B] mb-1">
                    Contraseña / DNI Inicial *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="password"
                      required
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="DNI/CIF inicial o contraseña"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#0F2942]"
                    />
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Su contraseña inicial predeterminada es su DNI o CIF de emisor.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Iniciar Sesión Taller</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenNewUserModal();
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-gray-100 text-[#0F2942] border border-[#CBD5E1] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Configurar Emisor
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 bg-[#FAF9F5] border-t border-[#E2E0D8] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#0F172A] border border-[#CBD5E1] rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
