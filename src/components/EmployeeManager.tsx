import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Shield, Wrench, FileText, Camera, 
  Calendar, PieChart, Search, Check, AlertCircle, Edit2, 
  Briefcase, Lock, CheckCircle2, ChevronDown, UserCheck, Phone, Mail, IdCard, X,
  FolderGit2, Inbox, Receipt, TrendingUp, Truck, AlertTriangle, CheckSquare, Square
} from 'lucide-react';
import { Employee, EmployeePermissions } from '../types';
import { 
  SPANISH_CNO_CATALOG, 
  SPANISH_COTIZACION_GROUPS, 
  SPANISH_ACCIDENTS_EPIGRAFES, 
  searchOccupations,
  CnoOccupation
} from '../data/spanishOccupations';

export const APP_MODULES: { key: keyof EmployeePermissions; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'accessExpedientes', label: 'Expedientes', desc: 'Roadmap y progreso de reparación', icon: FolderGit2 },
  { key: 'accessSolicitudes', label: 'Solicitudes', desc: 'Recepción y gestión de peticiones de clientes', icon: Inbox },
  { key: 'accessClientes', label: 'Clientes', desc: 'Cartera interna de clientes y sus vehículos', icon: Users },
  { key: 'accessPresupuestos', label: 'Presupuestos', desc: 'Elaboración técnica de presupuestos', icon: FileText },
  { key: 'accessCitas', label: 'Citas / Agenda', desc: 'Calendario y entradas programadas al taller', icon: Calendar },
  { key: 'accessTaller', label: 'Taller', desc: 'Órdenes de Trabajo (chapa, pintura y mecánica)', icon: Wrench },
  { key: 'accessFacturacion', label: 'Facturación', desc: 'Facturas emitidas, gastos y cobros', icon: Receipt },
  { key: 'accessBalances', label: 'Balances', desc: 'Rendimiento económico y cuentas de la empresa', icon: TrendingUp },
  { key: 'accessProveedores', label: 'Proveedores', desc: 'Gestión de recambistas y suministros', icon: Truck },
  { key: 'accessIncidencias', label: 'Incidencias', desc: 'Partes de siniestro y resolución de incidencias', icon: AlertTriangle },
];

export const OPERATIONAL_PERMISSIONS: { 
  key: keyof EmployeePermissions; 
  label: string; 
  desc: string; 
  icon: React.ComponentType<{ className?: string }>; 
  restrictedWarning?: string 
}[] = [
  { 
    key: 'scanPlates', 
    label: 'Escanear Matrículas (Cámara OCR)', 
    desc: 'Permite capturar matrículas con cámara desde el móvil para crear presupuestos u órdenes', 
    icon: Camera 
  },
  { 
    key: 'manageWorkOrders', 
    label: 'Iniciar y Finalizar Órdenes de Trabajo (OTs)', 
    desc: 'Cambiar estados de las órdenes en taller (En Espera, En Reparación, Finalizado)', 
    icon: Wrench 
  },
  { 
    key: 'createBudgets', 
    label: 'Cumplimentar Partidas de Presupuesto', 
    desc: 'Redactar líneas técnicas de chapa, pintura y recambios', 
    icon: FileText 
  },
  { 
    key: 'canSetPrices', 
    label: 'Fijar Precios e Importes', 
    desc: 'Valoración económica en presupuestos (Restringido por defecto al Jefe de taller)', 
    icon: Lock, 
    restrictedWarning: 'Al desmarcarse, el empleado redactará el presupuesto y el botón dirá "Enviar" para que el Jefe de taller complete la valoración económica.' 
  },
];

const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  accessExpedientes: true,
  accessSolicitudes: false,
  accessClientes: true,
  accessPresupuestos: true,
  accessCitas: false,
  accessTaller: true,
  accessFacturacion: false,
  accessBalances: false,
  accessProveedores: false,
  accessIncidencias: true,
  manageWorkOrders: true,
  createBudgets: true,
  canSetPrices: false,
  scanPlates: true,
  viewAgenda: false,
  viewReports: false,
};

interface EmployeeManagerProps {
  employees: Employee[];
  onChange: (employees: Employee[]) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, onChange }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [managingPermissionsEmp, setManagingPermissionsEmp] = useState<Employee | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formProfession, setFormProfession] = useState('');
  const [formCnoCode, setFormCnoCode] = useState('');
  const [formCnoDescription, setFormCnoDescription] = useState('');
  const [formCotizacionGroup, setFormCotizacionGroup] = useState('Grupo 8: Oficiales de primera y de segunda');
  const [formAccidentsEpigrafe, setFormAccidentsEpigrafe] = useState('45.20 (Reparación de vehículos)');
  
  // Search CNO dropdown
  const [cnoSearchQuery, setCnoSearchQuery] = useState('');
  const [isCnoDropdownOpen, setIsCnoDropdownOpen] = useState(false);

  // Form permissions
  const [formPermissions, setFormPermissions] = useState<EmployeePermissions>({ ...DEFAULT_EMPLOYEE_PERMISSIONS });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormDni('');
    setFormPhone('');
    setFormEmail('');
    setFormProfession('');
    setFormCnoCode('');
    setFormCnoDescription('');
    setFormCotizacionGroup('Grupo 8: Oficiales de primera y de segunda');
    setFormAccidentsEpigrafe('45.20 (Reparación de vehículos)');
    setCnoSearchQuery('');
    setFormPermissions({ ...DEFAULT_EMPLOYEE_PERMISSIONS });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormDni(emp.dni || '');
    setFormPhone(emp.phone || '');
    setFormEmail(emp.email || '');
    setFormProfession(emp.profession || '');
    setFormCnoCode(emp.cnoCode || '');
    setFormCnoDescription(emp.cnoDescription || '');
    setFormCotizacionGroup(emp.cotizacionGroup || 'Grupo 8: Oficiales de primera y de segunda');
    setFormAccidentsEpigrafe(emp.accidentsEpigrafe || '45.20 (Reparación de vehículos)');
    setCnoSearchQuery(emp.cnoDescription ? `${emp.cnoCode} - ${emp.cnoDescription}` : '');
    setFormPermissions(emp.permissions ? { ...DEFAULT_EMPLOYEE_PERMISSIONS, ...emp.permissions } : { ...DEFAULT_EMPLOYEE_PERMISSIONS });
    setIsAddModalOpen(true);
  };

  const handleSelectCno = (occ: CnoOccupation) => {
    setFormCnoCode(occ.cno);
    setFormCnoDescription(occ.title);
    if (!formProfession) {
      setFormProfession(occ.defaultCategory);
    }
    setFormCotizacionGroup(occ.suggestedCotizacionGroup);
    setFormAccidentsEpigrafe(occ.suggestedAccidentsEpigrafe);
    setCnoSearchQuery(`${occ.cno} - ${occ.title}`);
    setIsCnoDropdownOpen(false);
  };

  const handleSaveEmployeeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingEmployee) {
      // Update existing
      const updated = employees.map((emp) =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              name: formName.trim().toUpperCase(),
              dni: formDni.trim().toUpperCase() || undefined,
              phone: formPhone.trim() || undefined,
              email: formEmail.trim().toLowerCase() || undefined,
              profession: formProfession.trim() || undefined,
              cnoCode: formCnoCode || undefined,
              cnoDescription: formCnoDescription || undefined,
              cotizacionGroup: formCotizacionGroup || undefined,
              accidentsEpigrafe: formAccidentsEpigrafe || undefined,
              permissions: formPermissions,
            }
          : emp
      );
      onChange(updated);
    } else {
      // Add new
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        name: formName.trim().toUpperCase(),
        dni: formDni.trim().toUpperCase() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim().toLowerCase() || undefined,
        role: 'autorizado',
        profession: formProfession.trim() || 'Operario de taller',
        cnoCode: formCnoCode || undefined,
        cnoDescription: formCnoDescription || undefined,
        cotizacionGroup: formCotizacionGroup || undefined,
        accidentsEpigrafe: formAccidentsEpigrafe || undefined,
        permissions: formPermissions,
      };
      onChange([...employees, newEmp]);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('¿Deseas dar de baja a este empleado en el sistema?')) {
      onChange(employees.filter((e) => e.id !== id));
    }
  };

  const handleToggleSinglePermission = (empId: string, permKey: keyof EmployeePermissions) => {
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        return {
          ...emp,
          permissions: {
            ...emp.permissions,
            [permKey]: !emp.permissions[permKey],
          },
        };
      }
      return emp;
    });
    onChange(updated);
    if (managingPermissionsEmp && managingPermissionsEmp.id === empId) {
      setManagingPermissionsEmp({
        ...managingPermissionsEmp,
        permissions: {
          ...managingPermissionsEmp.permissions,
          [permKey]: !managingPermissionsEmp.permissions[permKey],
        },
      });
    }
  };

  const handleToggleAllModules = (empId: string, enabled: boolean) => {
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        const newPerms = { ...emp.permissions };
        APP_MODULES.forEach((mod) => {
          newPerms[mod.key] = enabled;
        });
        return { ...emp, permissions: newPerms };
      }
      return emp;
    });
    onChange(updated);
    if (managingPermissionsEmp && managingPermissionsEmp.id === empId) {
      const newPerms = { ...managingPermissionsEmp.permissions };
      APP_MODULES.forEach((mod) => {
        newPerms[mod.key] = enabled;
      });
      setManagingPermissionsEmp({ ...managingPermissionsEmp, permissions: newPerms });
    }
  };

  const filteredCnoList = searchOccupations(cnoSearchQuery);

  return (
    <div className="space-y-6">
      {/* Cabecera de la sección de empleados */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E0D8]">
        <div>
          <h3 className="text-[21px] font-bold uppercase tracking-wider text-[#0F2942] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0F2942]" />
            Plantilla y Empleados Autorizados
          </h3>
          <p className="text-[18px] text-[#64748B] mt-0.5">
            Gestión de trabajadores, epígrafes de Seguridad Social para futuras nóminas y control de permisos por puesto.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-[18px] font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Añadir Empleado
        </button>
      </div>

      {/* Grid de Tarjetas de Empleados */}
      {employees.length === 0 ? (
        <div className="p-8 text-center bg-white border border-[#CBD5E1] rounded-xl text-[#64748B]">
          <Users className="w-12 h-12 mx-auto text-[#94A3B8] mb-2" />
          <p className="text-[21px] font-medium">No hay empleados registrados todavía.</p>
          <p className="text-[18px] mt-1">Haz clic en "Añadir Empleado" para registrar al primer trabajador.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => {
            const initials = emp.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('');

            return (
              <div
                key={emp.id}
                className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado tarjeta: Avatar, Nombre y Acciones */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-[21px] tracking-wider shrink-0 shadow-2xs">
                        {initials || 'EM'}
                      </div>
                      <div>
                        <h4 className="text-[21px] font-bold text-[#0F172A] leading-tight">
                          {emp.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[15px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                            {emp.role}
                          </span>
                          {emp.dni && (
                            <span className="text-[16.5px] font-mono text-[#475569] bg-[#F1F5F9] px-2.5 py-0.5 rounded-sm">
                              DNI: {emp.dni}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(emp)}
                        className="p-2 text-[#64748B] hover:text-[#0F2942] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                        title="Editar datos del empleado"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Eliminar empleado"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Datos de contacto */}
                  <div className="text-[18px] text-[#64748B] space-y-1.5 mb-3 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                    {emp.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4.5 h-4.5 text-[#64748B] shrink-0" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    {emp.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4.5 h-4.5 text-[#64748B] shrink-0" />
                        <span className="font-mono">{emp.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 font-medium text-[#1E293B]">
                      <Briefcase className="w-4.5 h-4.5 text-[#0F2942] shrink-0" />
                      <span>{emp.profession || 'Especialista en automoción'}</span>
                    </div>
                  </div>

                  {/* Ficha Oficial de Seguridad Social & Nómina */}
                  <div className="space-y-2 pt-2.5 border-t border-[#F1F5F9] text-[16.5px]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#64748B] font-semibold">Epígrafe Oficial CNO-11:</span>
                      <span className="text-right font-medium text-[#0F172A]">
                        {emp.cnoCode ? (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-xs font-mono font-bold text-[16.5px]">
                            {emp.cnoCode} - {emp.cnoDescription}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Sin epígrafe asignado</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#64748B] font-semibold">Grupo Cotización:</span>
                      <span className="text-right text-[#334155] font-medium">
                        {emp.cotizacionGroup || 'Grupo 8: Oficiales'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#64748B] font-semibold">Tarifa Accidentes (IT/IMS):</span>
                      <span className="text-right text-[#334155] font-medium">
                        {emp.accidentsEpigrafe || '45.20'}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de permisos */}
                  <div className="mt-3.5 pt-3.5 border-t border-[#F1F5F9]">
                    <div className="text-[15px] uppercase font-bold tracking-wider text-[#64748B] mb-2 flex items-center justify-between">
                      <span>Partes con acceso:</span>
                      {emp.permissions?.canSetPrices ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs font-bold text-[15px]">
                          Precios: Habilitado
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs font-bold text-[15px]">
                          Precios: Solo Jefe
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {APP_MODULES.map((mod) => {
                        const hasAccess = emp.permissions ? (emp.permissions[mod.key] ?? false) : false;
                        if (!hasAccess) return null;
                        const Icon = mod.icon;
                        return (
                          <span
                            key={mod.key}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#F1F5F9] text-[#0F2942] rounded-xs text-[15px] font-semibold border border-[#E2E8F0]"
                          >
                            <Icon className="w-3.5 h-3.5 text-[#0F2942]" />
                            <span>{mod.label}</span>
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[16.5px]">
                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${emp.permissions?.scanPlates ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        <Camera className="w-4.5 h-4.5" />
                        <span className="truncate">Cámara OCR</span>
                        <span className="ml-auto font-bold">{emp.permissions?.scanPlates ? '✓' : '✗'}</span>
                      </div>

                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${emp.permissions?.manageWorkOrders ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        <Wrench className="w-4.5 h-4.5" />
                        <span className="truncate">Órdenes Taller</span>
                        <span className="ml-auto font-bold">{emp.permissions?.manageWorkOrders ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón Ver / Gestionar Permisos */}
                <div className="mt-4 pt-3.5 border-t border-[#E2E0D8]">
                  <button
                    type="button"
                    onClick={() => setManagingPermissionsEmp(emp)}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2942] rounded-lg text-[18px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Shield className="w-5 h-5 text-[#0F2942]" />
                    Gestionar Permisos de Acceso
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Gestionar Permisos de un Empleado Específico */}
      {managingPermissionsEmp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xl max-w-xl w-full p-4 sm:p-6 flex flex-col max-h-[92vh]">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E0D8] shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2942]">
                  Panel de Control de Permisos
                </span>
                <h4 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#0F2942]" />
                  {managingPermissionsEmp.name}
                </h4>
                <p className="text-xs text-[#64748B]">
                  {managingPermissionsEmp.profession || 'Empleado Autorizado'} • CNO: {managingPermissionsEmp.cnoCode || 'N/D'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingPermissionsEmp(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guía y selección rápida */}
            <div className="py-2.5 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg my-3 text-xs text-[#475569] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
              <span>Activa o desactiva casillas para conceder o restringir el acceso a partes y funciones.</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAllModules(managingPermissionsEmp.id, true)}
                  className="text-[11px] font-bold text-[#0F2942] hover:underline"
                >
                  Marcar todo
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllModules(managingPermissionsEmp.id, false)}
                  className="text-[11px] font-bold text-[#64748B] hover:underline"
                >
                  Desmarcar todo
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Bloque 1: Partes de la Aplicación de Usuario */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Acceso a Secciones de la Aplicación
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {APP_MODULES.map((mod) => {
                    const isChecked = managingPermissionsEmp.permissions ? (managingPermissionsEmp.permissions[mod.key] ?? false) : false;
                    const Icon = mod.icon;
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          isChecked ? 'bg-white border-[#0F2942]/30 shadow-xs' : 'bg-gray-50/70 border-gray-200 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSinglePermission(managingPermissionsEmp.id, mod.key)}
                          className="w-4 h-4 accent-[#0F2942] rounded-xs cursor-pointer mt-0.5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-[#0F2942]" />
                            <span>{mod.label}</span>
                          </div>
                          <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                            {mod.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bloque 2: Permisos Operativos */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Permisos Operativos y de Trabajo en Taller
                </div>
                <div className="space-y-2">
                  {OPERATIONAL_PERMISSIONS.map((op) => {
                    const isChecked = managingPermissionsEmp.permissions ? (managingPermissionsEmp.permissions[op.key] ?? false) : false;
                    const Icon = op.icon;
                    const isSpecialPrice = op.key === 'canSetPrices';
                    return (
                      <div
                        key={op.key}
                        className={`flex items-start justify-between p-3 rounded-lg border ${
                          isSpecialPrice 
                            ? 'border-amber-300 bg-amber-50/60' 
                            : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="pr-3">
                          <div className={`text-xs font-bold flex items-center gap-1.5 ${isSpecialPrice ? 'text-amber-900' : 'text-[#0F172A]'}`}>
                            <Icon className={`w-4 h-4 ${isSpecialPrice ? 'text-amber-800' : 'text-[#0F2942]'}`} />
                            {op.label}
                          </div>
                          <p className={`text-[11px] mt-0.5 ${isSpecialPrice ? 'text-amber-800 leading-snug' : 'text-[#64748B]'}`}>
                            {op.desc}
                          </p>
                          {op.restrictedWarning && !isChecked && (
                            <p className="text-[10px] text-amber-900 font-medium mt-1 bg-amber-100/70 p-1.5 rounded-xs border border-amber-200">
                              {op.restrictedWarning}
                            </p>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSinglePermission(managingPermissionsEmp.id, op.key)}
                          className="w-5 h-5 accent-[#0F2942] rounded-xs cursor-pointer mt-0.5 shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E0D8] flex justify-end shrink-0 mt-3">
              <button
                type="button"
                onClick={() => setManagingPermissionsEmp(null)}
                className="px-5 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Añadir o Editar Empleado con Buscador de Epígrafes Oficiales */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xl max-w-xl w-full p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E0D8]">
              <div>
                <h4 className="text-base font-bold text-[#0F172A]">
                  {editingEmployee ? 'Editar Ficha de Empleado' : 'Alta de Nuevo Empleado'}
                </h4>
                <p className="text-xs text-[#64748B]">
                  Configuración laboral, epígrafe oficial Seguridad Social y permisos de aplicación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeForm} className="py-4 space-y-4">
              {/* Nombre y DNI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: JUAN PÉREZ GARCÍA"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] focus:border-[#0F2942] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                    DNI / NIE
                  </label>
                  <input
                    type="text"
                    value={formDni}
                    onChange={(e) => setFormDni(e.target.value)}
                    placeholder="12345678Z"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] focus:border-[#0F2942] outline-none uppercase font-mono"
                  />
                </div>
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] focus:border-[#0F2942] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="empleado@dmcar.es"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] focus:border-[#0F2942] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Profesión / Denominación Puesto */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1">
                  Puesto o Profesión en la Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formProfession}
                  onChange={(e) => setFormProfession(e.target.value)}
                  placeholder="Ej: Chapista de automoción / Preparador de pintura"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5D2C9] rounded-lg text-[#0F172A] focus:border-[#0F2942] outline-none"
                />
              </div>

              {/* BUSCADOR DESPLEGABLE DE EPÍGRAFES OFICIALES SEGÚN MINISTERIO DE TRABAJO / CNO */}
              <div className="relative bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#0F2942]" />
                    Catálogo Oficial de Epígrafes (CNO-11 / Ministerio de Trabajo)
                  </label>
                  {formCnoCode && (
                    <span className="text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">
                      CNO {formCnoCode}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={cnoSearchQuery}
                    onChange={(e) => {
                      setCnoSearchQuery(e.target.value);
                      setIsCnoDropdownOpen(true);
                    }}
                    onFocus={() => setIsCnoDropdownOpen(true)}
                    placeholder="Escribe para buscar ocupación (ej: chapa, pintor, mecánico, 7313...)"
                    className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:border-[#0F2942] outline-none"
                  />
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-2.5" />
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-2.5 top-2.5" />

                  {/* Lista desplegable filtrada */}
                  {isCnoDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white border border-[#CBD5E1] rounded-xl shadow-xl divide-y divide-[#F1F5F9]">
                      {filteredCnoList.length === 0 ? (
                        <div className="p-3 text-xs text-[#64748B] text-center">
                          No se encontraron epígrafes coincidentes.
                        </div>
                      ) : (
                        filteredCnoList.map((item) => (
                          <button
                            key={item.cno}
                            type="button"
                            onClick={() => handleSelectCno(item)}
                            className="w-full text-left p-3 hover:bg-[#F1F5F9] transition-colors flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-[#0F2942] bg-[#E2E8F0] px-1.5 py-0.5 rounded-xs">
                                  {item.cno}
                                </span>
                                <span className="text-xs font-semibold text-[#0F172A]">
                                  {item.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                Puesto tipo: {item.defaultCategory}
                              </p>
                            </div>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs shrink-0">
                              {item.suggestedCotizacionGroup.split(':')[0]}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Parámetros de Seguridad Social para la futura sección de nóminas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Grupo Cotización Régimen General
                    </label>
                    <select
                      value={formCotizacionGroup}
                      onChange={(e) => setFormCotizacionGroup(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] outline-none"
                    >
                      {SPANISH_COTIZACION_GROUPS.map((g) => (
                        <option key={g.group} value={`${g.group}: ${g.description}`}>
                          {g.group} - {g.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Tarifa Accidentes Trabajo (IT/IMS)
                    </label>
                    <select
                      value={formAccidentsEpigrafe}
                      onChange={(e) => setFormAccidentsEpigrafe(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] outline-none"
                    >
                      {SPANISH_ACCIDENTS_EPIGRAFES.map((acc) => (
                        <option key={acc.code} value={`${acc.code} (${acc.description.slice(0, 30)})`}>
                          {acc.code} - {acc.description.slice(0, 35)}... (IT: {acc.itRate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-[#64748B] italic pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Estos datos quedarán habilitados automáticamente en su nómina en la próxima sección.
                </div>
              </div>

              {/* Permisos de la Aplicación en DM CAR */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#CBD5E1] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Permisos de Acceso y Funciones en la Aplicación
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const allOn = { ...formPermissions };
                        APP_MODULES.forEach((m) => { allOn[m.key] = true; });
                        setFormPermissions(allOn);
                      }}
                      className="font-bold text-[#0F2942] hover:underline"
                    >
                      Todas las secciones
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allOff = { ...formPermissions };
                        APP_MODULES.forEach((m) => { allOff[m.key] = false; });
                        setFormPermissions(allOff);
                      }}
                      className="font-bold text-[#64748B] hover:underline"
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                {/* Secciones de la app */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Secciones accesibles para este puesto:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                    {APP_MODULES.map((mod) => {
                      const isChecked = formPermissions[mod.key] ?? false;
                      const Icon = mod.icon;
                      return (
                        <label
                          key={mod.key}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] cursor-pointer transition-colors ${
                            isChecked ? 'bg-white border-[#0F2942]/30 text-[#0F172A] font-semibold' : 'bg-white/50 border-gray-200 text-[#64748B]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setFormPermissions({ ...formPermissions, [mod.key]: e.target.checked })}
                            className="accent-[#0F2942] rounded-xs shrink-0"
                          />
                          <Icon className="w-3 h-3 text-[#0F2942] shrink-0" />
                          <span className="truncate">{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Funciones operativas */}
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Funciones operativas:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-[#0F172A] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <input
                        type="checkbox"
                        checked={formPermissions.scanPlates}
                        onChange={(e) => setFormPermissions({ ...formPermissions, scanPlates: e.target.checked })}
                        className="accent-[#0F2942] rounded-xs shrink-0"
                      />
                      <div>
                        <span className="font-semibold block text-[11px]">Escanear Matrículas (Cámara OCR)</span>
                        <span className="text-[10px] text-[#64748B]">Inicia órdenes y presupuestos con cámara</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[#0F172A] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <input
                        type="checkbox"
                        checked={formPermissions.manageWorkOrders}
                        onChange={(e) => setFormPermissions({ ...formPermissions, manageWorkOrders: e.target.checked })}
                        className="accent-[#0F2942] rounded-xs shrink-0"
                      />
                      <div>
                        <span className="font-semibold block text-[11px]">Órdenes de Trabajo (Taller)</span>
                        <span className="text-[10px] text-[#64748B]">Avanzar estados en taller</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[#0F172A] bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <input
                        type="checkbox"
                        checked={formPermissions.createBudgets}
                        onChange={(e) => setFormPermissions({ ...formPermissions, createBudgets: e.target.checked })}
                        className="accent-[#0F2942] rounded-xs shrink-0"
                      />
                      <div>
                        <span className="font-semibold block text-[11px]">Cumplimentar Presupuestos</span>
                        <span className="text-[10px] text-[#64748B]">Redactar conceptos técnicos</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-amber-950 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canSetPrices}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canSetPrices: e.target.checked })}
                        className="accent-[#0F2942] rounded-xs shrink-0"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-amber-900">Fijar Precios (Solo Jefe por defecto)</span>
                        <span className="text-[10px] text-amber-800">Si se desmarca, requiere revisión del Jefe</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-2xs"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Añadir a la Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
