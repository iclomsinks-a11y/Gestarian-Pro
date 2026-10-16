import React, { useState, useEffect } from 'react';
import { X, Users, UserCheck, Wrench, Check, Plus, User } from 'lucide-react';
import { AppUser, Employee, GestarianDocument } from '../types';

interface AssignEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GestarianDocument | null;
  currentUser: AppUser;
  onConfirmAssignment: (docId: string, employeeId: string, employeeName: string) => void;
}

const DEFAULT_EMPLOYEES: { id: string; name: string; profession: string; laborEncomendada?: string }[] = [
  { id: 'emp_default_1', name: 'Carlos García', profession: 'Oficial Mecánica', laborEncomendada: 'Mecánica general' },
  { id: 'emp_default_2', name: 'Juan Pérez', profession: 'Especialista Chapa y Pintura', laborEncomendada: 'Carrocería y pintado' },
  { id: 'emp_default_3', name: 'Manuel López', profession: 'Técnico Electromecánica', laborEncomendada: 'Diagnóstico eléctrico' },
  { id: 'emp_default_4', name: 'Antonio Fernández', profession: 'Jefe de Taller / Asesor', laborEncomendada: 'Gestión de taller' },
  { id: 'emp_default_5', name: 'María Sánchez', profession: 'Administrativa / Contable', laborEncomendada: 'Facturación y contabilidad' },
  { id: 'emp_default_6', name: 'Lucía Gómez', profession: 'Limpiadora de Instalaciones', laborEncomendada: 'Limpieza de taller' },
];

export const AssignEmployeeModal: React.FC<AssignEmployeeModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  currentUser,
  onConfirmAssignment,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Lista combinada de todos los empleados
  const rawEmployees = (currentUser.employees && currentUser.employees.length > 0)
    ? currentUser.employees
    : DEFAULT_EMPLOYEES;

  // Filtro estricto de roles: para tareas operativas de taller (chapa, pintura, mecánica, electromecánica),
  // EXCLUIR personal no operativo como limpiadoras/limpiadores y administrativos/contables.
  const availableEmployees = rawEmployees.filter((emp) => {
    const p = (emp.profession || '').toLowerCase();
    const l = (emp.laborEncomendada || '').toLowerCase();
    const isNonOperational =
      p.includes('limpia') || l.includes('limpia') ||
      p.includes('administrativ') || l.includes('administrativ') ||
      p.includes('contable') || l.includes('contable') ||
      p.includes('oficina') || l.includes('oficina') ||
      p.includes('facturación') || l.includes('facturación');
    return !isNonOperational;
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Preseleccionar empleado asignado previamente o el primero disponible
    if (doc?.assignedEmployeeId && availableEmployees.some((e) => e.id === doc.assignedEmployeeId)) {
      setSelectedId(doc.assignedEmployeeId);
      setIsCustom(false);
    } else if (doc?.createdByName && !availableEmployees.some((e) => e.name === doc.createdByName)) {
      setCustomName(doc.createdByName);
      setIsCustom(true);
    } else if (availableEmployees.length > 0) {
      setSelectedId(availableEmployees[0].id);
      setIsCustom(false);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, doc, availableEmployees]);

  if (!isOpen || !doc) return null;

  const handleConfirm = () => {
    let finalId = selectedId;
    let finalName = '';

    if (isCustom && customName.trim()) {
      finalId = `custom_emp_${Date.now()}`;
      finalName = customName.trim();
    } else {
      const found = availableEmployees.find((e) => e.id === selectedId);
      if (found) {
        finalName = found.name;
      } else {
        finalName = customName.trim() || 'Operario de Taller';
      }
    }

    onConfirmAssignment(doc.id, finalId, finalName);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 my-auto flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera Toast / Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                Toast • Asignación Operario Taller
              </span>
              <h3 className="text-base font-black text-[#0F172A]">
                ASIGNAR EMPLEADO
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información del vehículo y expediente */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">
              Expediente Vinculado
            </span>
            <span className="font-mono font-bold text-[#0F2942]">
              {doc.expediente || doc.number}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">
              Vehículo / Matrícula
            </span>
            <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
              {doc.vehiclePlate || 'SIN-MAT'}
            </span>
          </div>
        </div>

        {/* Banner Informativo de Filtro de Rol */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-900 font-bold flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-amber-900">
            <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Filtro de Rol Activo: Operarios de Taller</span>
          </div>
          <span className="text-[11px] font-normal text-amber-800">
            Al ser una tarea operativa de taller (chapa y pintura o mecánica), se excluye automáticamente a la limpiadora y al personal administrativo.
          </span>
        </div>

        <p className="text-xs text-[#334155] leading-relaxed">
          Seleccione el operario especialista que ejecutará la reparación en taller:
        </p>

        {/* Lista de Empleados disponibles */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {availableEmployees.map((emp) => {
            const isSelected = !isCustom && selectedId === emp.id;
            return (
              <div
                key={emp.id}
                onClick={() => {
                  setSelectedId(emp.id);
                  setIsCustom(false);
                }}
                className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-2xs font-bold'
                    : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-[#0F172A]">{emp.name}</span>
                    {emp.profession && (
                      <span className="text-[11px] text-[#64748B] font-normal">{emp.profession}</span>
                    )}
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}

          {/* Opción para escribir un empleado personalizado */}
          <div
            onClick={() => setIsCustom(true)}
            className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col gap-2 transition-all ${
              isCustom
                ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-2xs'
                : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Asignar otro operario / libre</span>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isCustom ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                {isCustom && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {isCustom && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nombre del nuevo operario o mecánico..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md outline-none focus:border-blue-600 font-medium"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="pt-3 border-t border-[#E2E0D8] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Confirmar y Asignar a Taller</span>
          </button>
        </div>
      </div>
    </div>
  );
};
