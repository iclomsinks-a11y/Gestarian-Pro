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

      {/* Grid de Tarjetas de Empleados ocupando el 95% del ancho */}
      {employees.length === 0 ? (
        <div className="w-[95%] mx-auto p-8 text-center bg-[#E5E7EB] border border-gray-300/70 rounded-xl text-[#0F2942]">
          <Users className="w-12 h-12 mx-auto text-[#0F2942] mb-2" />
          <p className="text-[21px] font-bold">No hay empleados registrados todavía.</p>
          <p className="text-[18px] mt-1 text-[#0F2942]">Haz clic en "Añadir Empleado" para registrar al primer trabajador.</p>
        </div>
      ) : (
        <div className="w-[95%] mx-auto space-y-3">
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
                className="w-full bg-[#E5E7EB] rounded-xl border border-gray-300/70 shadow-xs hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col gap-3 text-[#0F2942]"
              >
                {/* Fila Superior: Perfil, Contacto y Todos los Botones Compactos */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-300/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-[20px] tracking-wider shrink-0 shadow-2xs">
                      {initials || 'EM'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[20px] font-bold text-[#0F2942] leading-tight">
                          {emp.name}
                        </h4>
                        <span className="text-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/20">
                          {emp.role}
                        </span>
                        {emp.dni && (
                          <span className="text-[15px] font-mono font-bold text-[#0F2942] bg-white/80 border border-gray-300/70 px-2 py-0.5 rounded-sm">
                            DNI: {emp.dni}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[16px] text-[#0F2942] font-semibold mt-1 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-[#0F2942] shrink-0" />
                          {emp.profession || 'Especialista en automoción'}
                        </span>
                        {emp.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-[#0F2942] shrink-0" />
                            {emp.phone}
                          </span>
                        )}
                        {emp.email && (
                          <span className="flex items-center gap-1.5 font-mono">
                            <Mail className="w-4 h-4 text-[#0F2942] shrink-0" />
                            {emp.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción juntos en la fila superior */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setManagingPermissionsEmp(emp)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-lg text-[16px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Shield className="w-4 h-4 text-white" />
                      <span>Gestionar Permisos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="p-2 text-[#0F2942] hover:bg-white/80 bg-white/40 border border-gray-300/70 rounded-lg transition-colors cursor-pointer"
                      title="Editar datos del empleado"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100/70 bg-white/40 border border-gray-300/70 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar empleado"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Fila Media: Seguridad Social y Permisos de manera compacta */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-[16px]">
                  {/* Seguridad Social (4 columnas) */}
                  <div className="lg:col-span-4 p-2.5 rounded-lg bg-white/50 border border-gray-200/80 space-y-1">
                    <div className="flex items-center justify-between gap-1 text-[15px]">
                      <span className="font-semibold text-[#0F2942]">CNO-11:</span>
                      <span className="font-bold text-[#0F2942] truncate max-w-[200px]" title={emp.cnoDescription}>
                        {emp.cnoCode ? `${emp.cnoCode} - ${emp.cnoDescription}` : 'Sin asignar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[15px]">
                      <span className="font-semibold text-[#0F2942]">Cotización:</span>
                      <span className="font-bold text-[#0F2942] truncate">
                        {emp.cotizacionGroup || 'Grupo 8: Oficiales'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[15px]">
                      <span className="font-semibold text-[#0F2942]">Tarifa Accidentes:</span>
                      <span className="font-bold text-[#0F2942]">
                        {emp.accidentsEpigrafe || '45.20'}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de Permisos y Botones de estado (8 columnas) */}
                  <div className="lg:col-span-8 p-2.5 rounded-lg bg-white/50 border border-gray-200/80 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[14px] font-bold uppercase tracking-wider text-[#0F2942]">
                        Módulos con acceso ({APP_MODULES.filter(m => emp.permissions?.[m.key]).length}):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {emp.permissions?.canSetPrices ? (
                          <span className="text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[14px] font-bold">
                            Precios: Sí
                          </span>
                        ) : (
                          <span className="text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[14px] font-bold">
                            Precios: Solo Jefe
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[14px] font-bold border ${emp.permissions?.scanPlates ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                          Cámara OCR {emp.permissions?.scanPlates ? '✓' : '✗'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[14px] font-bold border ${emp.permissions?.manageWorkOrders ? 'bg-blue-100 text-blue-950 border-blue-300' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                          Órdenes {emp.permissions?.manageWorkOrders ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {APP_MODULES.map((mod) => {
                        const hasAccess = emp.permissions ? (emp.permissions[mod.key] ?? false) : false;
                        if (!hasAccess) return null;
                        const Icon = mod.icon;
                        return (
                          <span
                            key={mod.key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 text-[#0F2942] rounded text-[14px] font-bold border border-gray-200"
                          >
                            <Icon className="w-3.5 h-3.5 text-[#0F2942]" />
                            <span>{mod.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Gestionar Permisos de un Empleado Específico */}
      {managingPermissionsEmp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/60 backdrop-blur-xs">
          <div className="bg-[#F8FAFC] rounded-2xl border-2 border-[#CBD5E1] shadow-2xl max-w-3xl w-full p-6 sm:p-8 flex flex-col max-h-[92vh]">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#CBD5E1] shrink-0">
              <div>
                <span className="text-[20px] font-extrabold uppercase tracking-widest text-[#0F2942] block mb-1">
                  Panel de Control de Permisos
                </span>
                <h4 className="text-[28px] font-bold text-[#0F2942] flex items-center gap-2.5">
                  <UserCheck className="w-8 h-8 text-[#0F2942]" />
                  {managingPermissionsEmp.name}
                </h4>
                <p className="text-[20px] font-medium text-[#0F2942] mt-1">
                  {managingPermissionsEmp.profession || 'Empleado Autorizado'} • CNO: {managingPermissionsEmp.cnoCode || 'N/D'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingPermissionsEmp(null)}
                className="text-[#0F2942] hover:text-red-600 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer"
                title="Cerrar Panel"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Guía y selección rápida */}
            <div className="py-3.5 px-4 bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-xl my-4 text-[20px] font-medium text-[#0F2942] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              <span>Activa o desactiva casillas para conceder o restringir el acceso a partes y funciones.</span>
              <div className="flex items-center gap-3 shrink-0 font-bold">
                <button
                  type="button"
                  onClick={() => handleToggleAllModules(managingPermissionsEmp.id, true)}
                  className="text-[20px] font-bold text-[#0F2942] underline hover:text-[#1E3A8A] cursor-pointer"
                >
                  Marcar todo
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllModules(managingPermissionsEmp.id, false)}
                  className="text-[20px] font-bold text-[#0F2942] underline hover:text-red-700 cursor-pointer"
                >
                  Desmarcar todo
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-6 pr-2 flex-1">
              {/* Bloque 1: Partes de la Aplicación de Usuario */}
              <div>
                <div className="text-[22px] font-bold uppercase tracking-wider text-[#0F2942] mb-3 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#0F2942]" />
                  Acceso a Secciones de la Aplicación
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {APP_MODULES.map((mod) => {
                    const isChecked = managingPermissionsEmp.permissions ? (managingPermissionsEmp.permissions[mod.key] ?? false) : false;
                    const Icon = mod.icon;
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-colors cursor-pointer ${
                          isChecked ? 'bg-white border-[#0F2942] shadow-sm' : 'bg-[#F1F5F9] border-[#CBD5E1] opacity-75'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSinglePermission(managingPermissionsEmp.id, mod.key)}
                          className="w-6 h-6 accent-[#0F2942] rounded-md cursor-pointer mt-0.5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[20px] font-bold text-[#0F2942] flex items-center gap-2">
                            <Icon className="w-5 h-5 text-[#0F2942]" />
                            <span>{mod.label}</span>
                          </div>
                          <p className="text-[18px] text-[#0F2942]/85 leading-tight mt-1">
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
                <div className="text-[22px] font-bold uppercase tracking-wider text-[#0F2942] mb-3 flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-[#0F2942]" />
                  Permisos Operativos y de Trabajo en Taller
                </div>
                <div className="space-y-3">
                  {OPERATIONAL_PERMISSIONS.map((op) => {
                    const isChecked = managingPermissionsEmp.permissions ? (managingPermissionsEmp.permissions[op.key] ?? false) : false;
                    const Icon = op.icon;
                    const isSpecialPrice = op.key === 'canSetPrices';
                    return (
                      <div
                        key={op.key}
                        className={`flex items-start justify-between p-4 rounded-xl border-2 ${
                          isSpecialPrice 
                            ? 'border-amber-400 bg-amber-50' 
                            : 'border-[#CBD5E1] bg-[#F1F5F9]'
                        }`}
                      >
                        <div className="pr-4">
                          <div className={`text-[20px] font-bold flex items-center gap-2 ${isSpecialPrice ? 'text-amber-950' : 'text-[#0F2942]'}`}>
                            <Icon className={`w-6 h-6 ${isSpecialPrice ? 'text-amber-900' : 'text-[#0F2942]'}`} />
                            {op.label}
                          </div>
                          <p className={`text-[18px] mt-1 ${isSpecialPrice ? 'text-amber-950 font-medium' : 'text-[#0F2942]/85'}`}>
                            {op.desc}
                          </p>
                          {op.restrictedWarning && !isChecked && (
                            <p className="text-[18px] text-amber-950 font-semibold mt-2 bg-amber-100/90 p-2.5 rounded-lg border border-amber-300">
                              {op.restrictedWarning}
                            </p>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSinglePermission(managingPermissionsEmp.id, op.key)}
                          className="w-7 h-7 accent-[#0F2942] rounded-md cursor-pointer mt-0.5 shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#CBD5E1] flex justify-end shrink-0 mt-4">
              <button
                type="button"
                onClick={() => setManagingPermissionsEmp(null)}
                className="px-8 py-3.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-[20px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
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
