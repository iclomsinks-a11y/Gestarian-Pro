import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface DeliveryDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeliveryDate: (formattedDate: string) => void;
  initialDate?: string;
}

export const DeliveryDatePickerModal: React.FC<DeliveryDatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDeliveryDate,
  initialDate,
}) => {
  // Generar los 30 días a partir de la fecha actual (hoy)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysList = Array.from({ length: 30 }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() + index);
    return d;
  });

  // Fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) {
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime()) && parsed >= today) {
        return parsed;
      }
    }
    return daysList[0];
  });

  // Horas a intervalos de media hora: 08:00 a 20:00
  const availableHours: string[] = [];
  for (let h = 8; h <= 20; h++) {
    const hourStr = String(h).padStart(2, '0');
    availableHours.push(`${hourStr}:00`);
    if (h < 20) {
      availableHours.push(`${hourStr}:30`);
    }
  }

  const [selectedHour, setSelectedHour] = useState<string>(() => {
    if (initialDate && initialDate.includes(':')) {
      const timeMatch = initialDate.match(/(\d{2}:\d{2})/);
      if (timeMatch && availableHours.includes(timeMatch[1])) {
        return timeMatch[1];
      }
    }
    return '10:00';
  });

  if (!isOpen) return null;

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Separar los 30 días por meses
  const monthsGroup: { monthLabel: string; days: Date[] }[] = [];
  daysList.forEach((d) => {
    const label = `${monthNames[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
    const lastGroup = monthsGroup[monthsGroup.length - 1];
    if (!lastGroup || lastGroup.monthLabel !== label) {
      monthsGroup.push({ monthLabel: label, days: [d] });
    } else {
      lastGroup.days.push(d);
    }
  });

  const handleConfirm = () => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd} ${selectedHour}`;
    onSelectDeliveryDate(formatted);
    onClose();
  };

  // Convertir getDay() (0=Domingo, 1=Lunes... 6=Sábado) a columna L a D (0=Lunes, 6=Domingo)
  const getColIndex = (d: Date) => (d.getDay() + 6) % 7;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Contenedor perfectamente centrado en la pantalla del dispositivo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg max-h-[85vh] my-auto bg-[#F1F5F9] rounded-2xl shadow-2xl border border-slate-300 flex flex-col justify-between p-3.5 sm:p-5 overflow-hidden select-none"
        >
          {/* Botón cerrar discreto */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 rounded-full transition-all cursor-pointer z-20"
            title="Cerrar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* PARTE 1: CALENDARIO DE 30 DÍAS CON FILAS DE 7 DÍAS, DOMINGOS A LA DERECHA */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
            {monthsGroup.map((group, gIdx) => {
              const firstDayOfGroup = group.days[0];
              const firstColStart = getColIndex(firstDayOfGroup) + 1; // 1-indexed for gridColumnStart

              return (
                <div key={group.monthLabel} className={gIdx > 0 ? 'mt-3 pt-2 border-t border-slate-200' : ''}>
                  {/* Mes arriba centrado */}
                  <div className="text-center mb-1.5">
                    <span className="text-xs sm:text-sm font-black tracking-widest text-slate-700 uppercase">
                      {group.monthLabel}
                    </span>
                  </div>

                  {/* Fila única de cabecera de días: L M X J V S D */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-1">
                    <div className="text-[10px] sm:text-xs font-bold text-slate-600">L</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-600">M</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-600">X</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-600">J</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-600">V</div>
                    <div className="text-[10px] sm:text-xs font-bold text-blue-600">S</div>
                    <div className="text-[10px] sm:text-xs font-bold text-red-600">D</div>
                  </div>

                  {/* Cuadrícula de 7 columnas para los días del mes */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {group.days.map((d, dIdx) => {
                      const dayOfWeek = d.getDay();
                      const isSaturday = dayOfWeek === 6;
                      const isSunday = dayOfWeek === 0;
                      const isSelected = isSameDay(d, selectedDate);

                      let colorClass = 'text-slate-800';
                      if (isSaturday) colorClass = 'text-blue-600';
                      if (isSunday) colorClass = 'text-red-600';

                      return (
                        <button
                          key={d.toISOString()}
                          type="button"
                          style={dIdx === 0 ? { gridColumnStart: firstColStart } : undefined}
                          onClick={() => setSelectedDate(d)}
                          className={`h-9 sm:h-10 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${
                            isSelected
                              ? 'bg-slate-900 text-white font-black border-slate-900 shadow-md scale-[1.03]'
                              : `bg-white hover:bg-slate-100/90 border-slate-200/90 shadow-2xs font-bold ${colorClass}`
                          }`}
                        >
                          <span className="text-sm sm:text-base font-black">
                            {d.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PARTE 2: SELECTOR DE HORA A INTERVALOS DE MEDIA HORA */}
          <div className="shrink-0 pt-2 pb-1 border-t border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {availableHours.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHour(h)}
                    className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PARTE 3: BOTÓN ACEPTAR */}
          <div className="shrink-0 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-sm sm:text-base tracking-wider uppercase transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center"
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
