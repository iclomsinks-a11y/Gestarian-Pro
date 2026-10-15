import React, { useState } from 'react';
import { 
  Users, UserPlus, Clock, FileText, Wrench, Shield, Check, 
  Calendar, Download, Play, Pause, Square, Euro, Edit2, Trash2,
  CheckCircle2, X, Search, ArrowUpRight, User, Info, Save,
  AlertTriangle, Building2, ChevronRight, Lock, UserPen,
  MessageCircle, Phone, Mail, ChevronDown, Eye
} from 'lucide-react';
import { Employee, GestarianDocument, AppUser, EmployeeTimeLog, EmployeePermissions } from '../types';
import { PayrollModal } from './PayrollModal';
import { downloadFile } from '../services/exportService';

interface MiEquipoViewProps {
  id?: string;
  employees: Employee[];
  documents: GestarianDocument[];
  currentUser: AppUser;
  onUpdateEmployees: (employees: Employee[]) => void;
  onNavigateToExpediente?: (expId: string) => void;
  onViewDoc?: (doc: GestarianDocument) => void;
  onShowToast: (message: string) => void;
}

// Presets oficiales españoles para epígrafes, categorías y CNO
const EPIGRAFE_PRESETS = [
  { code: '691.2', label: 'Epígrafe 691.2 - Reparación y mantenimiento de vehículos de motor (CNAE 4520)' },
  { code: '691.9', label: 'Epígrafe 691.9 - Reparación de otros bienes de consumo y maquinaria' },
  { code: '844.0', label: 'Epígrafe 844.0 - Servicios de contabilidad, teneduría de libros y auditoría (CNAE 6920)' },
  { code: '659.4', label: 'Epígrafe 659.4 - Comercio al por menor de recambios y accesorios de vehículos' },
  { code: '849.9', label: 'Epígrafe 849.9 - Otros servicios empresariales de gestión y administración' },
];

const CATEGORIA_PRESETS = [
  { group: 'Grupo 2', label: 'Grupo 2: Ingenieros Técnicos, Peritos y Jefes de Taller' },
  { group: 'Grupo 3', label: 'Grupo 3: Jefes de Taller y Encargados Especialistas' },
  { group: 'Grupo 5', label: 'Grupo 5: Oficiales Administrativos y Contables' },
  { group: 'Grupo 8', label: 'Grupo 8: Oficiales de 1ª y 2ª (Mecánicos, Chapistas, Pintores)' },
  { group: 'Grupo 9', label: 'Grupo 9: Oficiales de 3ª y Especialistas de Taller' },
  { group: 'Grupo 10', label: 'Grupo 10: Peones y Ayudantes de Taller' },
];

const CNO_PRESETS = [
  { code: '7313', label: '7313 - Chapistas y caldereros de automoción' },
  { code: '7232', label: '7232 - Pintores en las industrias del automóvil y cabina' },
  { code: '7231', label: '7231 - Mecánicos y ajustadores de vehículos de motor' },
  { code: '3121', label: '3121 - Técnicos en mecánica y jefes de taller' },
  { code: '4311', label: '4311 - Empleados de contabilidad y cálculo de nóminas' },
];

export const MiEquipoView: React.FC<MiEquipoViewProps> = ({
  id = 'page-equipo',
  employees,
  documents,
  currentUser,
  onUpdateEmployees,
  onNavigateToExpediente,
  onViewDoc,
  onShowToast,
}) => {
  // -------------------------------------------------------------
  // Modales interactivos correspondientes a los 5 accesos con icono:
  // 1. Datos personales (donde metemos el epígrafe y categoría específica)
  const [selectedEmployeeForPersonalData, setSelectedEmployeeForPersonalData] = useState<Employee | null>(null);
  // 2. Nómina
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<Employee | null>(null);
  // 3. Permisos
  const [selectedEmployeeForPermissions, setSelectedEmployeeForPermissions] = useState<Employee | null>(null);
  // 4. Órdenes de trabajo
  const [selectedEmployeeForOTs, setSelectedEmployeeForOTs] = useState<Employee | null>(null);
  // 5. Control horario
  const [selectedEmployeeForTimeLogs, setSelectedEmployeeForTimeLogs] = useState<Employee | null>(null);

  // Tarjeta de empleado expandida
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const toggleExpand = (empId: string) => {
    setExpandedEmpId((prev) => (prev === empId ? null : empId));
  };

  // Estados locales editables para el Modal 1 (Datos Personales: Epígrafe y Categoría específica)
  const [personalEpigrafe, setPersonalEpigrafe] = useState('');
  const [personalCategoria, setPersonalCategoria] = useState('');
  const [personalCno, setPersonalCno] = useState('');
  const [personalProfession, setPersonalProfession] = useState('');
  const [personalLabor, setPersonalLabor] = useState('');
  const [personalDni, setPersonalDni] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalWorkHours, setPersonalWorkHours] = useState<'completa' | 'media' | 'personalizada'>('completa');
  const [personalSalary, setPersonalSalary] = useState(1950);
  const [personalIrpf, setPersonalIrpf] = useState(12);

  // Modal para Añadir / Editar ficha completa
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states para Añadir / Editar
  const [formName, setFormName] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formProfession, setFormProfession] = useState('');
  const [formLabor, setFormLabor] = useState('');
  const [formEpigrafe, setFormEpigrafe] = useState('');
  const [formCotizacionGroup, setFormCotizacionGroup] = useState('');
  const [formCnoCode, setFormCnoCode] = useState('');
  const [formSalary, setFormSalary] = useState(1950);
  const [formIrpf, setFormIrpf] = useState(12);
  const [formWorkHoursType, setFormWorkHoursType] = useState<'completa' | 'media' | 'personalizada'>('completa');
  const [formTimeTrackingEnabled, setFormTimeTrackingEnabled] = useState(true);
  const [formPermissions, setFormPermissions] = useState<EmployeePermissions>({
    accessExpedientes: true,
    accessSolicitudes: false,
    accessClientes: true,
    accessPresupuestos: true,
    accessCitas: true,
    accessTaller: true,
    accessFacturacion: false,
    accessBalances: false,
    accessProveedores: false,
    accessIncidencias: true,
    manageWorkOrders: true,
    createBudgets: true,
    canSetPrices: false,
    scanPlates: true,
    viewAgenda: true,
    viewReports: false,
  });

  // Buscador y Filtro por Rol
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [roleFilterTab, setRoleFilterTab] = useState<'all' | 'workshop' | 'office'>('all');

  React.useEffect(() => {
    const handleToggleSearch = () => {
      setIsSearchOpen((prev) => !prev);
    };
    const handleNewEmployee = () => {
      handleOpenAdd();
    };
    const handleFilterWorkshop = () => {
      setRoleFilterTab('workshop');
    };

    window.addEventListener('gestarian_toggle_employee_search', handleToggleSearch);
    window.addEventListener('gestarian_new_employee', handleNewEmployee);
    window.addEventListener('gestarian_filter_workshop_operators', handleFilterWorkshop);

    return () => {
      window.removeEventListener('gestarian_toggle_employee_search', handleToggleSearch);
      window.removeEventListener('gestarian_new_employee', handleNewEmployee);
      window.removeEventListener('gestarian_filter_workshop_operators', handleFilterWorkshop);
    };
  }, []);

  // Determinar si su labor depende de Órdenes de Trabajo técnicas al ser operario de taller
  const isOperarioOrTech = (emp: Employee) => {
    const p = (emp.profession || '').toLowerCase();
    const l = (emp.laborEncomendada || '').toLowerCase();
    if (
      p.includes('limpia') ||
      l.includes('limpia') ||
      p.includes('administrativ') ||
      p.includes('contable') ||
      p.includes('facturación') ||
      p.includes('oficina') ||
      l.includes('contabilidad') ||
      l.includes('facturación') ||
      l.includes('administrativ')
    ) {
      return false;
    }
    return true;
  };

  // Filtrado de empleados
  const filteredEmployees = employees.filter((emp) => {
    if (roleFilterTab === 'workshop' && !isOperarioOrTech(emp)) return false;
    if (roleFilterTab === 'office' && isOperarioOrTech(emp)) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.profession && emp.profession.toLowerCase().includes(q)) ||
      (emp.dni && emp.dni.toLowerCase().includes(q)) ||
      (emp.epigrafeActividad && emp.epigrafeActividad.toLowerCase().includes(q)) ||
      (emp.cotizacionGroup && emp.cotizacionGroup.toLowerCase().includes(q))
    );
  });

  // Obtener OTs asignadas a un empleado
  const getEmployeeWorkOrders = (emp: Employee) => {
    return documents.filter((d) => {
      const isWorkOrder = d.type === 'orden_trabajo' || Boolean(d.expediente);
      const isAssigned = 
        (d as any).assignedEmployeeId === emp.id || 
        (d as any).assignedEmployeeName === emp.name ||
        (d.notes && d.notes.toLowerCase().includes(emp.name.toLowerCase()));
      return isWorkOrder && isAssigned;
    });
  };

  // Apertura modal nuevo empleado
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormDni('');
    setFormPhone('');
    setFormEmail('');
    setFormProfession('Oficial Mecánico de Automoción');
    setFormLabor('Mantenimiento preventivo, diagnóstico electrónico y reparación de mecánica general.');
    setFormEpigrafe('Epígrafe 691.2 - Reparación y mantenimiento de vehículos de motor (CNAE 4520)');
    setFormCotizacionGroup('Grupo 8: Oficiales de 1ª y 2ª (Mecánicos, Chapistas, Pintores)');
    setFormCnoCode('7231');
    setFormSalary(1950);
    setFormIrpf(12);
    setFormWorkHoursType('completa');
    setFormTimeTrackingEnabled(true);
    setFormPermissions({
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
    });
    setIsAddEditModalOpen(true);
  };

  // Apertura modal edición ficha completa
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormDni(emp.dni || '');
    setFormPhone(emp.phone || '');
    setFormEmail(emp.email || '');
    setFormProfession(emp.profession || '');
    setFormLabor(emp.laborEncomendada || '');
    setFormEpigrafe(emp.epigrafeActividad || 'Epígrafe 691.2 - Reparación y mantenimiento de vehículos de motor (CNAE 4520)');
    setFormCotizacionGroup(emp.cotizacionGroup || 'Grupo 8: Oficiales de 1ª y 2ª (Mecánicos, Chapistas, Pintores)');
    setFormCnoCode(emp.cnoCode || '7231');
    setFormSalary(emp.salaryMonthly || 1900);
    setFormIrpf(emp.irpfRate || 12);
    setFormWorkHoursType(emp.workHoursType === 'media' ? 'media' : 'completa');
    setFormTimeTrackingEnabled(emp.timeTrackingEnabled !== false);
    setFormPermissions({ ...emp.permissions });
    setIsAddEditModalOpen(true);
  };

  // 1. Apertura modal exclusivo Datos Personales (donde metemos epígrafe y categoría específica)
  const handleOpenPersonalData = (emp: Employee) => {
    setSelectedEmployeeForPersonalData(emp);
    setPersonalEpigrafe(emp.epigrafeActividad || 'Epígrafe 691.2 - Reparación y mantenimiento de vehículos de motor (CNAE 4520)');
    setPersonalCategoria(emp.cotizacionGroup || 'Grupo 8: Oficiales de 1ª y 2ª (Mecánicos, Chapistas, Pintores)');
    setPersonalCno(emp.cnoCode || '7231');
    setPersonalProfession(emp.profession || 'Especialista Técnico');
    setPersonalLabor(emp.laborEncomendada || 'Funciones asignadas en taller.');
    setPersonalDni(emp.dni || '');
    setPersonalPhone(emp.phone || '');
    setPersonalEmail(emp.email || '');
    setPersonalWorkHours(emp.workHoursType || 'completa');
    setPersonalSalary(emp.salaryMonthly || 1900);
    setPersonalIrpf(emp.irpfRate || 12);
  };

  // Guardar datos personales desde el modal específico de Datos Personales
  const handleSavePersonalData = () => {
    if (!selectedEmployeeForPersonalData) return;
    const updatedEmp: Employee = {
      ...selectedEmployeeForPersonalData,
      epigrafeActividad: personalEpigrafe.trim(),
      cotizacionGroup: personalCategoria.trim(),
      cnoCode: personalCno.trim(),
      profession: personalProfession.trim(),
      laborEncomendada: personalLabor.trim(),
      dni: personalDni.trim().toUpperCase(),
      phone: personalPhone.trim(),
      email: personalEmail.trim(),
      workHoursType: personalWorkHours,
      monthlyTargetHours: personalWorkHours === 'media' ? 80 : 160,
      salaryMonthly: Number(personalSalary) || selectedEmployeeForPersonalData.salaryMonthly || 1900,
      irpfRate: Number(personalIrpf) || selectedEmployeeForPersonalData.irpfRate || 12,
    };

    const updatedList = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
    onUpdateEmployees(updatedList);
    setSelectedEmployeeForPersonalData(null);
    onShowToast(`Epígrafe y categoría específica de ${updatedEmp.name} guardados correctamente`);
  };

  // Guardar empleado desde modal general
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('El nombre del empleado es obligatorio');
      return;
    }

    if (editingEmployee) {
      const updated = employees.map((emp) => {
        if (emp.id === editingEmployee.id) {
          return {
            ...emp,
            name: formName.trim().toUpperCase(),
            dni: formDni.trim().toUpperCase(),
            phone: formPhone.trim(),
            email: formEmail.trim(),
            profession: formProfession.trim(),
            laborEncomendada: formLabor.trim(),
            epigrafeActividad: formEpigrafe.trim(),
            cotizacionGroup: formCotizacionGroup.trim(),
            cnoCode: formCnoCode.trim(),
            salaryMonthly: Number(formSalary) || 1900,
            irpfRate: Number(formIrpf) || 12,
            workHoursType: formWorkHoursType,
            monthlyTargetHours: formWorkHoursType === 'media' ? 80 : 160,
            timeTrackingEnabled: formTimeTrackingEnabled,
            permissions: formPermissions,
          };
        }
        return emp;
      });
      onUpdateEmployees(updated);
      onShowToast(`Ficha de ${formName} actualizada con éxito`);
    } else {
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        name: formName.trim().toUpperCase(),
        dni: formDni.trim().toUpperCase(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        role: 'autorizado',
        profession: formProfession.trim() || 'Operario de Taller',
        laborEncomendada: formLabor.trim() || 'Funciones asignadas en taller y mantenimiento mecánico.',
        epigrafeActividad: formEpigrafe.trim() || 'Epígrafe 691.2 - Reparación y mantenimiento de vehículos de motor (CNAE 4520)',
        cotizacionGroup: formCotizacionGroup.trim() || 'Grupo 8: Oficiales de 1ª y 2ª (Mecánicos, Chapistas, Pintores)',
        cnoCode: formCnoCode.trim() || '7231',
        salaryMonthly: Number(formSalary) || 1900,
        irpfRate: Number(formIrpf) || 12,
        workHoursType: formWorkHoursType,
        monthlyTargetHours: formWorkHoursType === 'media' ? 80 : 160,
        timeTrackingEnabled: formTimeTrackingEnabled,
        permissions: formPermissions,
        timeLogs: [
          {
            id: `tl_init_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            entryTime: '08:00',
            pauseStart: '13:00',
            pauseEnd: '14:00',
            exitTime: '17:00',
            totalHours: 8,
            status: 'completado',
            type: 'ordinaria',
          }
        ],
      };
      onUpdateEmployees([newEmp, ...employees]);
      onShowToast(`Empleado ${newEmp.name} dado de alta correctamente`);
    }

    setIsAddEditModalOpen(false);
  };

  // Eliminar empleado
  const handleDeleteEmployee = (empId: string, empName: string) => {
    if (confirm(`¿Seguro que deseas eliminar a ${empName} de la plantilla?`)) {
      const updated = employees.filter((e) => e.id !== empId);
      onUpdateEmployees(updated);
      onShowToast(`Empleado ${empName} eliminado de la plantilla`);
    }
  };

  // Conmutar interruptor de control horario
  const handleToggleTimeTracking = (empId: string) => {
    const updated = employees.map((e) => {
      if (e.id === empId) {
        const nextState = e.timeTrackingEnabled === false ? true : false;
        onShowToast(
          nextState 
            ? `Control horario (RD-ley 8/2019) ACTIVADO para ${e.name}` 
            : `Control horario DESACTIVADO para ${e.name}`
        );
        return { ...e, timeTrackingEnabled: nextState };
      }
      return e;
    });
    onUpdateEmployees(updated);

    if (selectedEmployeeForTimeLogs?.id === empId) {
      setSelectedEmployeeForTimeLogs(prev => prev ? { ...prev, timeTrackingEnabled: !prev.timeTrackingEnabled } : null);
    }
  };

  // Guardar permisos desde el modal de permisos
  const handleSavePermissions = (empId: string, permissions: EmployeePermissions) => {
    const updated = employees.map((e) => (e.id === empId ? { ...e, permissions } : e));
    onUpdateEmployees(updated);
    onShowToast(`Permisos actualizados para ${selectedEmployeeForPermissions?.name}`);
    setSelectedEmployeeForPermissions(null);
  };

  // Fichaje rápido en tiempo real
  const handleQuickClockAction = (emp: Employee, action: 'entrada' | 'pausa' | 'salida') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const logs = [...(emp.timeLogs || [])];
    const todayLogIndex = logs.findIndex((l) => l.date === dateStr);

    if (action === 'entrada') {
      if (todayLogIndex >= 0 && logs[todayLogIndex].status === 'en_curso') {
        onShowToast(`${emp.name} ya tiene un fichaje de entrada activo hoy`);
        return;
      }
      if (todayLogIndex >= 0 && logs[todayLogIndex].status === 'pausado') {
        logs[todayLogIndex] = {
          ...logs[todayLogIndex],
          pauseEnd: timeStr,
          status: 'en_curso',
        };
        onShowToast(`Jornada reanudada para ${emp.name} a las ${timeStr}`);
      } else {
        const newLog: EmployeeTimeLog = {
          id: `tl_${Date.now()}`,
          date: dateStr,
          entryTime: timeStr,
          totalHours: 0,
          status: 'en_curso',
          type: 'ordinaria',
        };
        logs.unshift(newLog);
        onShowToast(`Fichaje de ENTRADA registrado para ${emp.name} a las ${timeStr}`);
      }
    } else if (action === 'pausa') {
      if (todayLogIndex < 0 || logs[todayLogIndex].status !== 'en_curso') {
        onShowToast(`No hay jornada activa en curso para pausar`);
        return;
      }
      logs[todayLogIndex] = {
        ...logs[todayLogIndex],
        pauseStart: timeStr,
        status: 'pausado',
      };
      onShowToast(`Pausa registrada para ${emp.name} a las ${timeStr}`);
    } else if (action === 'salida') {
      if (todayLogIndex < 0) {
        onShowToast(`No hay jornada abierta hoy para registrar salida`);
        return;
      }
      const currentLog = logs[todayLogIndex];
      const [hIn, mIn] = (currentLog.entryTime || '08:00').split(':').map(Number);
      const [hOut, mOut] = timeStr.split(':').map(Number);
      let diffMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      if (currentLog.pauseStart) {
        diffMinutes = Math.max(30, diffMinutes - 60);
      }
      const hours = Number((diffMinutes / 60).toFixed(1));

      logs[todayLogIndex] = {
        ...currentLog,
        exitTime: timeStr,
        totalHours: hours,
        status: 'completado',
      };
      onShowToast(`Fichaje de SALIDA registrado para ${emp.name} a las ${timeStr} (${hours} h)`);
    }

    const updated = employees.map((e) => (e.id === emp.id ? { ...e, timeLogs: logs } : e));
    onUpdateEmployees(updated);

    if (selectedEmployeeForTimeLogs?.id === emp.id) {
      setSelectedEmployeeForTimeLogs({ ...selectedEmployeeForTimeLogs, timeLogs: logs });
    }
  };

  // Exportar Registro Oficial de Jornada (RD-ley 8/2019)
  const handleExportTimeLogs = (emp: Employee) => {
    const logs = emp.timeLogs || [];
    const headers = 'Fecha,Empleado,DNI,Hora Entrada,Inicio Pausa,Fin Pausa,Hora Salida,Total Horas,Tipo,Empresa,CIF\n';
    const rows = logs.map((l) => 
      `"${l.date}","${emp.name}","${emp.dni || ''}","${l.entryTime}","${l.pauseStart || ''}","${l.pauseEnd || ''}","${l.exitTime || ''}","${l.totalHours}","${l.type}","${currentUser.fullName}","${currentUser.cif}"`
    ).join('\n');

    const csvContent = headers + rows;
    const filename = `Registro_Jornada_${emp.name.replace(/\s+/g, '_')}_RD8_2019.csv`;
    downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
    onShowToast(`Registro oficial de jornada conforme a RD-ley 8/2019 descargado (${filename})`);
  };

  // Horas acumuladas en el mes
  const getMonthlyHours = (emp: Employee) => {
    const logs = emp.timeLogs || [];
    return logs.reduce((acc, log) => acc + (log.totalHours || 0), 0);
  };

  return (
    <div id={id} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-slate-800 pb-20 select-none">
      
      {/* Buscador emergente activado desde el icono de la lupa en el footer */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 bg-white border-2 border-slate-400 rounded-xl p-2 shadow-sm animate-in fade-in zoom-in-95 duration-200 mb-4">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empleado por nombre, DNI o cargo..."
            className="w-full text-xs sm:text-sm font-bold text-slate-800 outline-none bg-transparent placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-700 text-xs font-black px-1.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Selector de Filtro de Roles: Todos / Operarios de Taller / Oficina y Limpieza */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setRoleFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              roleFilterTab === 'all'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({employees.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilterTab('workshop')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilterTab === 'workshop'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Operarios Taller ({employees.filter(isOperarioOrTech).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilterTab('office')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              roleFilterTab === 'office'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Oficina / Limpieza ({employees.filter((e) => !isOperarioOrTech(e)).length})
          </button>
        </div>

        {roleFilterTab === 'workshop' && (
          <span className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl">
            🛠️ Excluidos Limpiadora y Administrativo
          </span>
        )}
      </div>

      {/* Cuadrícula de Tarjetas de Empleados con diseño idéntico al estándar de StandardCard */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron empleados</h3>
          <p className="text-xs text-slate-500 mt-1">Añade nuevos trabajadores pulsando en el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((emp, index) => {
            const isOperario = isOperarioOrTech(emp);
            const workOrders = getEmployeeWorkOrders(emp);
            
            // Alternancia visual de bordes y fondo al 5% idéntico al estándar de StandardCard
            const isOrangeVariant = index % 2 === 0;
            const finalBorder = isOrangeVariant ? 'border border-orange-500' : 'border border-emerald-500';
            const effectiveBg = isOrangeVariant ? 'bg-orange-500/5' : 'bg-emerald-500/5';
            const statusTextColor = isOrangeVariant ? 'text-orange-600' : 'text-emerald-600';
            
            // Estado de fichaje en tiempo real hoy
            const todayStr = new Date().toISOString().split('T')[0];
            const todayLog = (emp.timeLogs || []).find((l) => l.date === todayStr);
            const isCurrentlyWorking = todayLog && todayLog.status === 'en_curso';
            const isPaused = todayLog && todayLog.status === 'pausado';

            let statusLabel = emp.timeTrackingEnabled !== false
              ? (emp.workHoursType === 'media' ? 'JORNADA MEDIA (80H)' : 'JORNADA COMPLETA (160H)')
              : 'ACTIVO';
            if (isCurrentlyWorking) statusLabel = 'FICHADO · EN JORNADA';
            else if (isPaused) statusLabel = 'EN PAUSA DE JORNADA';

            return (
              <div
                key={emp.id}
                className={`${effectiveBg} rounded-xl shadow-xs hover:shadow-md transition-all overflow-hidden ${finalBorder} w-full flex flex-col justify-between group cursor-pointer`}
                onClick={() => toggleExpand(emp.id)}
              >
                {/* Zona de contenido principal idéntica a StandardCard */}
                <div className="pt-5 px-5 pb-3 flex flex-col gap-3 select-none">
                  
                  {/* Línea 1: Nombre y DNI sin envoltorios ni dibujitos, en color azul slate destacado */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 w-full">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 truncate leading-tight">
                      {emp.name}
                    </span>
                    <span className="font-mono font-extrabold text-sm sm:text-base text-teal-700 tracking-wider">
                      {emp.dni || `EMP-${emp.id.replace(/\D/g, '') || '01'}`}
                    </span>
                  </div>

                  {/* Línea 2: Rol / Profesión */}
                  <div className="text-sm font-black text-slate-600 uppercase tracking-wider leading-tight">
                    {emp.profession || 'Especialista Técnico'}
                  </div>

                  {/* Línea 3: Orden de trabajo activa: vehículo y matrícula con icono de ojo para ver orden */}
                  {(() => {
                    const activeOt = workOrders[0];
                    return (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          <span className="text-slate-500 uppercase font-bold text-[11px] shrink-0">OT Activa:</span>
                          {activeOt ? (
                            <span className="truncate text-slate-900 font-mono">
                              {[activeOt.vehicleBrand, activeOt.vehicleModel].filter(Boolean).join(' ') || activeOt.vehicleType || 'Vehículo en taller'}
                              {activeOt.vehiclePlate ? ` (${activeOt.vehiclePlate})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Sin orden activa asignada</span>
                          )}
                        </div>

                        {activeOt && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewDoc) onViewDoc(activeOt);
                              else if (onNavigateToExpediente && activeOt.expediente) onNavigateToExpediente(activeOt.expediente);
                            }}
                            className="p-1 text-teal-600 hover:text-teal-700 hover:scale-110 active:scale-95 transition-transform cursor-pointer shrink-0"
                            title="Ver Orden de Trabajo"
                          >
                            <Eye className="w-6 h-6 stroke-[2.2]" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Sección expandida al pulsar: ÚNICAMENTE ICONOS EN DOS FILAS (TAMAÑO ESCALADO x1.5) CON EL MISMO DISEÑO QUE EN CLIENTES */}
                {expandedEmpId === emp.id && (
                  <div
                    className="bg-[#FAF9F6] border-t border-[#E2E0D8] p-4 flex flex-col gap-4 animate-in fade-in duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Fila 1: Datos Personales (epígrafe/categoría), Nómina, Permisos, Órdenes de Trabajo */}
                    <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
                      {/* 1. Datos personales: Epígrafe y Categoría específica */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPersonalData(emp);
                        }}
                        className="p-2 text-[#0F2942] hover:text-blue-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title="Datos Personales: Epígrafe y Categoría de Actividad"
                        aria-label="Datos Personales"
                      >
                        <UserPen className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                      </button>

                      {/* 2. Nómina Oficial */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployeeForPayroll(emp);
                        }}
                        className="p-2 text-[#0F2942] hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title={`Nómina Oficial: ${(emp.salaryMonthly || 1900).toFixed(0)} €/mes`}
                        aria-label="Nómina Oficial"
                      >
                        <Euro className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                      </button>

                      {/* 3. Permisos */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployeeForPermissions(emp);
                        }}
                        className="p-2 text-[#0F2942] hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title="Permisos y Nivel de Acceso"
                        aria-label="Permisos"
                      >
                        <Shield className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                      </button>

                      {/* 4. Órdenes de Trabajo */}
                      {isOperario ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployeeForOTs(emp);
                          }}
                          className="p-2 text-[#0F2942] hover:text-amber-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                          title={`Órdenes de Trabajo (${workOrders.length} asignadas)`}
                          aria-label="Órdenes de Trabajo"
                        >
                          <Wrench className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                          {workOrders.length > 0 && (
                            <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                              {workOrders.length}
                            </span>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployeeForOTs(emp);
                          }}
                          className="p-2 text-slate-300 hover:text-slate-400 hover:scale-105 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative opacity-50"
                          title="Puesto no operario (Labor administrativa - Sin órdenes de trabajo asignadas)"
                          aria-label="Sin órdenes de trabajo"
                        >
                          <Wrench className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        </button>
                      )}
                    </div>

                    {/* Fila 2: Control Horario, WhatsApp, Teléfono, Email */}
                    <div className="grid grid-cols-4 gap-3 items-center justify-items-center">
                      {/* 5. Control Horario (RD-ley 8/2019) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployeeForTimeLogs(emp);
                        }}
                        className="p-2 text-[#0F2942] hover:text-teal-600 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center relative"
                        title="Control Horario Laboral (RD-ley 8/2019)"
                        aria-label="Control Horario"
                      >
                        <Clock className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                        {isCurrentlyWorking ? (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                        ) : emp.timeTrackingEnabled !== false ? (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white" />
                        ) : null}
                      </button>

                      {/* 6. WhatsApp */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!emp.phone) {
                            onShowToast(`${emp.name} no tiene teléfono registrado`);
                            return;
                          }
                          let cleanPhone = emp.phone.replace(/[^\d+]/g, '');
                          if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('00') && cleanPhone.length === 9) {
                            cleanPhone = `34${cleanPhone}`;
                          }
                          window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(`Hola ${emp.name}, te contactamos desde DM CAR.`)}`, '_blank');
                        }}
                        className={`p-2 text-emerald-600 hover:text-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                          !emp.phone ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title={emp.phone ? `WhatsApp: ${emp.phone}` : 'Sin teléfono'}
                        aria-label="WhatsApp"
                        disabled={!emp.phone}
                      >
                        <MessageCircle className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                      </button>

                      {/* 7. Teléfono */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!emp.phone) {
                            onShowToast(`${emp.name} no tiene teléfono registrado`);
                            return;
                          }
                          window.location.href = `tel:${emp.phone}`;
                        }}
                        className={`p-2 text-blue-600 hover:text-blue-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                          !emp.phone ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title={emp.phone ? `Llamar a ${emp.phone}` : 'Sin teléfono'}
                        aria-label="Llamar"
                        disabled={!emp.phone}
                      >
                        <Phone className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                      </button>

                      {/* 8. Email */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!emp.email) {
                            onShowToast(`${emp.name} no tiene correo registrado`);
                            return;
                          }
                          window.location.href = `mailto:${emp.email}?subject=Gestión DM CAR - Comunicación Interna`;
                        }}
                        className={`p-2 text-indigo-600 hover:text-indigo-700 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center ${
                          !emp.email ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title={emp.email ? `Email: ${emp.email}` : 'Sin correo'}
                        aria-label="Enviar correo"
                        disabled={!emp.email}
                      >
                        <Mail className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.8} />
                      </button>
                    </div>

                    {/* Opciones auxiliares: Editar ficha y Eliminar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(emp);
                        }}
                        className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Ficha Completa</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(emp.id, emp.name);
                        }}
                        className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar de Plantilla</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. MODAL DE DATOS PERSONALES (Epígrafe, Categoría y Labor)    */}
      {/* ------------------------------------------------------------- */}
      {selectedEmployeeForPersonalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployeeForPersonalData(null);
          }}
        >
          <div className="w-full max-w-2xl my-6 bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Datos Personales & Ficha de Actividad Laboral
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedEmployeeForPersonalData.name} · DNI: {selectedEmployeeForPersonalData.dni || 'Sin registrar'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForPersonalData(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Sección A: Epígrafe Oficial de Actividad */}
              <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-sky-900 block">
                    Epígrafe Oficial de Actividad (IAE / CNAE) *
                  </span>
                  <span className="text-[10px] text-sky-700 font-semibold">
                    Clasificación tributaria y laboral
                  </span>
                </div>

                {/* Selector rápido con presets oficiales de taller */}
                <select
                  value={personalEpigrafe}
                  onChange={(e) => setPersonalEpigrafe(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {EPIGRAFE_PRESETS.map((p) => (
                    <option key={p.code} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                  <option value={personalEpigrafe}>Otro / Personalizado...</option>
                </select>

                <input
                  type="text"
                  value={personalEpigrafe}
                  onChange={(e) => setPersonalEpigrafe(e.target.value)}
                  placeholder="Ej. Epígrafe 691.2 - Reparación y mantenimiento de vehículos de motor"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Sección B: Categoría específica y Grupo de Cotización SS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-800 block">
                    Categoría Específica & Grupo de Cotización SS *
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Seguridad Social Régimen General
                  </span>
                </div>

                <select
                  value={personalCategoria}
                  onChange={(e) => setPersonalCategoria(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {CATEGORIA_PRESETS.map((c) => (
                    <option key={c.group} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                  <option value={personalCategoria}>Otro / Personalizado...</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Texto de Categoría Específica
                    </label>
                    <input
                      type="text"
                      value={personalCategoria}
                      onChange={(e) => setPersonalCategoria(e.target.value)}
                      placeholder="Ej. Grupo 8: Oficiales de 1ª y 2ª de Taller"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Código CNO-11 Oficial
                    </label>
                    <select
                      value={personalCno}
                      onChange={(e) => setPersonalCno(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {CNO_PRESETS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección C: Cargo que ocupa y Labor Encomendada */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cargo que Ocupa de su Labor Encomendada *
                  </label>
                  <input
                    type="text"
                    value={personalProfession}
                    onChange={(e) => setPersonalProfession(e.target.value)}
                    placeholder="Ej. Oficial Mecánico y Chapista de Automoción"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Labor Encomendada (Descripción de funciones principales)
                  </label>
                  <textarea
                    rows={2}
                    value={personalLabor}
                    onChange={(e) => setPersonalLabor(e.target.value)}
                    placeholder="Describe las tareas asignadas: diagnosis electrónica, bancada, cabina de pintura, facturación..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sección D: Datos Personales, Identificación y Contacto */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-700 block">
                  Identificación, Contacto y Jornada
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      DNI / NIE
                    </label>
                    <input
                      type="text"
                      value={personalDni}
                      onChange={(e) => setPersonalDni(e.target.value)}
                      placeholder="12345678Z"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={personalPhone}
                      onChange={(e) => setPersonalPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="empleado@taller.es"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Tipo de Jornada
                    </label>
                    <select
                      value={personalWorkHours}
                      onChange={(e) => setPersonalWorkHours(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="completa">Jornada Completa (160h/mes)</option>
                      <option value="media">Media Jornada (80h/mes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Salario Base (€)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={personalSalary}
                      onChange={(e) => setPersonalSalary(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Retención IRPF (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={personalIrpf}
                      onChange={(e) => setPersonalIrpf(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer con botón para Guardar Datos de Actividad */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForPersonalData(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleSavePersonalData}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Epígrafe y Categoría</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MODAL DE NÓMINA OFICIAL (Desglose oficial español con SS e IRPF) */}
      {/* ------------------------------------------------------------- */}
      {selectedEmployeeForPayroll && (
        <PayrollModal
          isOpen={Boolean(selectedEmployeeForPayroll)}
          onClose={() => setSelectedEmployeeForPayroll(null)}
          employee={selectedEmployeeForPayroll}
          companyName={currentUser.fullName}
          companyCif={currentUser.cif}
          companyAddress={currentUser.fiscalAddress}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL DE PERMISOS GRANULARES */}
      {/* ------------------------------------------------------------- */}
      {selectedEmployeeForPermissions && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployeeForPermissions(null);
          }}
        >
          <div className="w-full max-w-2xl my-6 bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Permisos y Nivel de Acceso: {selectedEmployeeForPermissions.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Control granular de acceso individual en GESTARIAN</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForPermissions(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Define qué módulos y acciones puede consultar o ejecutar este trabajador al identificarse como usuario autorizado.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'manageWorkOrders', label: 'Gestión de Órdenes de Trabajo', desc: 'Iniciar, pausar y finalizar reparaciones' },
                  { key: 'createBudgets', label: 'Redactar Presupuestos', desc: 'Crear valoraciones para clientes' },
                  { key: 'canSetPrices', label: 'Fijar Precios e Importes', desc: 'Autorización para tasar importes directamente' },
                  { key: 'scanPlates', label: 'Escáner ALPR de Matrículas', desc: 'Uso de la cámara OCR de vehículos' },
                  { key: 'accessExpedientes', label: 'Módulo Expedientes', desc: 'Consulta del historial de reparaciones' },
                  { key: 'accessSolicitudes', label: 'Módulo Solicitudes', desc: 'Recepción de peticiones de clientes' },
                  { key: 'accessClientes', label: 'Módulo Clientes', desc: 'Acceso a la base de datos de clientes' },
                  { key: 'accessPresupuestos', label: 'Módulo Presupuestos', desc: 'Visualización y emisión de presupuestos' },
                  { key: 'accessCitas', label: 'Módulo Citas y Agenda', desc: 'Consulta de calendario y reservas' },
                  { key: 'accessTaller', label: 'Módulo Taller', desc: 'Cuadro de mandos de vehículos en proceso' },
                  { key: 'accessFacturacion', label: 'Módulo Facturación', desc: 'Visualización de facturas emitidas y recibidas' },
                  { key: 'accessBalances', label: 'Módulo Balances', desc: 'Resultados económicos de la empresa' },
                  { key: 'accessProveedores', label: 'Módulo Proveedores', desc: 'Contactos y pedidos de piezas' },
                  { key: 'accessIncidencias', label: 'Módulo Incidencias', desc: 'Registro y seguimiento de incidencias' },
                ].map(({ key, label, desc }) => {
                  const isChecked = Boolean(selectedEmployeeForPermissions.permissions[key as keyof EmployeePermissions]);
                  return (
                    <label 
                      key={key} 
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updatedPerms: EmployeePermissions = {
                            ...selectedEmployeeForPermissions.permissions,
                            [key]: e.target.checked,
                          };
                          setSelectedEmployeeForPermissions({
                            ...selectedEmployeeForPermissions,
                            permissions: updatedPerms,
                          });
                        }}
                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="font-bold block text-xs">{label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForPermissions(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSavePermissions(selectedEmployeeForPermissions.id, selectedEmployeeForPermissions.permissions)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Guardar Permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL DE ÓRDENES DE TRABAJO ASIGNADAS */}
      {/* ------------------------------------------------------------- */}
      {selectedEmployeeForOTs && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployeeForOTs(null);
          }}
        >
          <div className="w-full max-w-2xl my-6 bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Órdenes de Trabajo: {selectedEmployeeForOTs.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedEmployeeForOTs.profession || 'Especialista de Taller'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForOTs(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {!isOperarioOrTech(selectedEmployeeForOTs) ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <Info className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">Puesto de Gestión / Administración</p>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                    La labor encomendada de este trabajador es contable o administrativa y no depende de órdenes de trabajo técnicas de taller.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = employees.map(e => {
                          if (e.id === selectedEmployeeForOTs.id) {
                            return {
                              ...e,
                              profession: 'Oficial Mecánico de Taller',
                              laborEncomendada: 'Mantenimiento preventivo, peritación y reparación de mecánica general.',
                            };
                          }
                          return e;
                        });
                        onUpdateEmployees(updated);
                        setSelectedEmployeeForOTs(null);
                        onShowToast(`${selectedEmployeeForOTs.name} reclasificado como Personal Operario de Taller`);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Habilitar como Operario de Taller
                    </button>
                  </div>
                </div>
              ) : getEmployeeWorkOrders(selectedEmployeeForOTs).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-slate-700">Sin órdenes asignadas actualmente</p>
                  <p className="text-xs text-slate-500">
                    Las órdenes de reparación asignadas a {selectedEmployeeForOTs.name} aparecerán aquí con su estado y vehículo.
                  </p>
                  
                  {/* Opción de asignar alguna orden abierta en el taller */}
                  {documents.filter(d => Boolean(d.expediente)).length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-600 block mb-2 uppercase">
                        Vincular orden abierta del taller:
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {documents.filter(d => Boolean(d.expediente)).slice(0, 3).map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              const updatedDocs = documents.map(doc => {
                                if (doc.id === d.id) {
                                  return {
                                    ...doc,
                                    assignedEmployeeId: selectedEmployeeForOTs.id,
                                    assignedEmployeeName: selectedEmployeeForOTs.name,
                                  };
                                }
                                return doc;
                              });
                              // Si el servicio guarda documentos en localStorage:
                              try {
                                localStorage.setItem('gestarian_documents', JSON.stringify(updatedDocs));
                                window.dispatchEvent(new CustomEvent('gestarian_documents_updated'));
                              } catch {}
                              onShowToast(`Orden ${d.expediente || d.number} asignada a ${selectedEmployeeForOTs.name}`);
                              setSelectedEmployeeForOTs(null);
                            }}
                            className="w-full text-left p-2.5 bg-white border border-slate-300 hover:border-amber-400 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-900 mr-2">{d.expediente || d.number}</span>
                              <span className="text-slate-600">[{d.vehiclePlate || 'S/M'}] · {d.clientName}</span>
                            </div>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Asignar
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                getEmployeeWorkOrders(selectedEmployeeForOTs).map((ot) => (
                  <div key={ot.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">{ot.number}</span>
                        {ot.expediente && (
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                            {ot.expediente}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          (ot as any).status === 'finalizada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(ot as any).status || 'En ejecución'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Cliente: <strong>{ot.clientName}</strong> · Vehículo: <span className="font-mono font-bold">[{ot.vehiclePlate || 'S/M'}]</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ot.expediente && onNavigateToExpediente && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeForOTs(null);
                            onNavigateToExpediente(ot.expediente!);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Expediente</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onViewDoc && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeForOTs(null);
                            onViewDoc(ot);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForOTs(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL DE CONTROL HORARIO LABORAL (RD-ley 8/2019)           */}
      {/* ------------------------------------------------------------- */}
      {selectedEmployeeForTimeLogs && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployeeForTimeLogs(null);
          }}
        >
          <div className="w-full max-w-2xl my-6 bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Control Horario Laboral · RD-ley 8/2019
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedEmployeeForTimeLogs.name} · Custodia oficial legal de 4 años
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmployeeForTimeLogs(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Barra de activación con interruptor */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Registro de Jornada Activo
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedEmployeeForTimeLogs.workHoursType === 'media' ? 'Media Jornada (80h mensuales por defecto)' : 'Jornada Completa (160h mensuales por defecto)'}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer" title="Activar/desactivar registro de jornada">
                  <input
                    type="checkbox"
                    checked={selectedEmployeeForTimeLogs.timeTrackingEnabled !== false}
                    onChange={() => handleToggleTimeTracking(selectedEmployeeForTimeLogs.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Botones de fichaje en tiempo real */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Fichaje en Tiempo Real
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickClockAction(selectedEmployeeForTimeLogs, 'entrada')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Entrada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickClockAction(selectedEmployeeForTimeLogs, 'pausa')}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pausa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickClockAction(selectedEmployeeForTimeLogs, 'salida')}
                    className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Salida</span>
                  </button>
                </div>
              </div>

              {/* Cómputo mensual */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 block">
                    Cómputo Mensual de Horas Registradas
                  </span>
                  <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                    {getMonthlyHours(selectedEmployeeForTimeLogs)} horas contabilizadas
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-900 bg-teal-100 px-3 py-1 rounded-full">
                  Objetivo: {selectedEmployeeForTimeLogs.workHoursType === 'media' ? 80 : 160}h
                </span>
              </div>

              {/* Historial de fichajes */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Últimos Fichajes Registrados
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Entrada</th>
                        <th className="px-3 py-2">Pausa</th>
                        <th className="px-3 py-2">Salida</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {(selectedEmployeeForTimeLogs.timeLogs || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-slate-400 font-sans">
                            Sin registros de fichaje este mes.
                          </td>
                        </tr>
                      ) : (
                        (selectedEmployeeForTimeLogs.timeLogs || []).slice(0, 6).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-bold text-slate-800">{log.date}</td>
                            <td className="px-3 py-2 text-emerald-700">{log.entryTime || '--:--'}</td>
                            <td className="px-3 py-2 text-amber-700">{log.pauseStart ? `${log.pauseStart} - ${log.pauseEnd || '...'}` : '-'}</td>
                            <td className="px-3 py-2 text-rose-700">{log.exitTime || '--:--'}</td>
                            <td className="px-3 py-2 text-right font-black text-slate-900">{log.totalHours}h</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleExportTimeLogs(selectedEmployeeForTimeLogs)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Registro Oficial (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEmployeeForTimeLogs(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL GENERAL: AÑADIR O EDITAR FICHA COMPLETA DE EMPLEADO     */}
      {/* ------------------------------------------------------------- */}
      {isAddEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddEditModalOpen(false);
          }}
        >
          <div className="w-full max-w-2xl my-6 bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-base">
                {editingEmployee ? `Editar Ficha Completa: ${editingEmployee.name}` : 'Añadir Nuevo Empleado a la Plantilla'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Nombre y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Juan Pérez Gómez"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    DNI / NIE
                  </label>
                  <input
                    type="text"
                    value={formDni}
                    onChange={(e) => setFormDni(e.target.value)}
                    placeholder="Ej. 12345678Z"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="empleado@taller.es"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Cargo / Puesto que ocupa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formProfession}
                    onChange={(e) => setFormProfession(e.target.value)}
                    placeholder="Ej. Oficial 1ª Mecánico / Chapista"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Epígrafe Oficial de Actividad
                  </label>
                  <input
                    type="text"
                    value={formEpigrafe}
                    onChange={(e) => setFormEpigrafe(e.target.value)}
                    placeholder="Ej. Epígrafe 691.2 - Reparación y mantenimiento de vehículos"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Categoría / Grupo Cotización SS
                  </label>
                  <input
                    type="text"
                    value={formCotizacionGroup}
                    onChange={(e) => setFormCotizacionGroup(e.target.value)}
                    placeholder="Ej. Grupo 8: Oficiales de 1ª y 2ª"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Código CNO Ocupación
                  </label>
                  <input
                    type="text"
                    value={formCnoCode}
                    onChange={(e) => setFormCnoCode(e.target.value)}
                    placeholder="Ej. 7231 (Mecánicos de automoción)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Labor Encomendada (Funciones principales asignadas)
                </label>
                <textarea
                  rows={2}
                  value={formLabor}
                  onChange={(e) => setFormLabor(e.target.value)}
                  placeholder="Describe las tareas asignadas: diagnosis, bancada, pintura, gestión..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Salario y Configuración de Jornada */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold uppercase text-slate-800 tracking-wider block">
                  Condiciones Salariales y Jornada Laboral
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Salario Base Mensual (€)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={formSalary}
                      onChange={(e) => setFormSalary(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Retención IRPF (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="2"
                      max="45"
                      value={formIrpf}
                      onChange={(e) => setFormIrpf(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Tipo de Jornada
                    </label>
                    <select
                      value={formWorkHoursType}
                      onChange={(e) => setFormWorkHoursType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                    >
                      <option value="completa">Completa (160h / mes por defecto)</option>
                      <option value="media">Media jornada (80h / mes por defecto)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-time-tracking-form"
                    checked={formTimeTrackingEnabled}
                    onChange={(e) => setFormTimeTrackingEnabled(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="chk-time-tracking-form" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Activar Control Horario Laboral obligatorio (Real Decreto-ley 8/2019)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Añadir Empleado'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
