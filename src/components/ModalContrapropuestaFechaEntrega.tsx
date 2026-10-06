import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2
} from 'lucide-react'
import {
  getHorarioTallerConfig,
  obtenerDiasDisponiblesSemana,
  obtenerVentanasHorariasDisponibles
} from '../services/horarioTallerService'
import { useToast } from '../lib/ToastContext'

interface ModalContrapropuestaFechaEntregaProps {
  presupuestoEstado: string
  fechaPropuestaTaller: string // ISO string or YYYY-MM-DD HH:mm
  onConfirmarContrapropuesta: (nuevaFechaISO: string, observaciones?: string) => Promise<void>
  onCerrar: () => void
}

export function ModalContrapropuestaFechaEntrega({
  presupuestoEstado,
  fechaPropuestaTaller,
  onConfirmarContrapropuesta,
  onCerrar
}: ModalContrapropuestaFechaEntregaProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  // Parsear fecha propuesta por el taller
  const dateTaller = new Date(fechaPropuestaTaller)
  const fechaValidaTaller = !isNaN(dateTaller.getTime()) ? dateTaller : new Date(Date.now() + 86400000)

  // Obtener días disponibles de la semana posterior
  const configHorario = getHorarioTallerConfig()
  const diasDisponibles = obtenerDiasDisponiblesSemana(fechaValidaTaller, configHorario)

  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(diasDisponibles[0] || fechaValidaTaller)
  const [slotSeleccionado, setSlotSeleccionado] = useState<string>('')
  const [observaciones, setObservaciones] = useState<string>('')

  // Ventanas horarias del día seleccionado
  const ventanasHorarias = obtenerVentanasHorariasDisponibles(diaSeleccionado, fechaValidaTaller, configHorario)

  // Regla 5.1: Comprobación de aceptación previa del presupuesto
  const presupuestoAceptado = presupuestoEstado === 'aceptado'

  useEffect(() => {
    if (ventanasHorarias.length > 0) {
      setSlotSeleccionado(ventanasHorarias[0])
    } else {
      setSlotSeleccionado('')
    }
  }, [diaSeleccionado])

  const handleConfirmar = async () => {
    if (!presupuestoAceptado) {
      showToast('Debes aceptar el presupuesto primero antes de modificar la fecha de entrega.', 'warning')
      return
    }

    if (!slotSeleccionado) {
      showToast('Selecciona una ventana horaria disponible', 'warning')
      return
    }

    setLoading(true)
    try {
      const [h, m] = slotSeleccionado.split(':').map(Number)
      const fechaFinal = new Date(diaSeleccionado)
      fechaFinal.setHours(h, m, 0, 0)

      await onConfirmarContrapropuesta(fechaFinal.toISOString(), observaciones)
      showToast('Contrapropuesta de fecha enviada al taller con éxito', 'success')
      onCerrar()
    } catch (e: any) {
      showToast(e?.message || 'Error al enviar la contrapropuesta', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl text-cyan-400 border border-cyan-500/30">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">MODIFICAR FECHA DE ENTREGA</h3>
              <p className="text-xs text-slate-400">Contrapropuesta de horario del vehículo</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-white p-1">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* ALERTA SI NO HA ACEPTADO EL PRESUPUESTO PREVIAMENTE (Regla 5.1) */}
        {!presupuestoAceptado ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Presupuesto Pendiente de Aceptación</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Debes aceptar el presupuesto primero antes de modificar la fecha de entrega.
            </p>
            <button
              onClick={onCerrar}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-black text-xs uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* FECHA PROPUESTA POR EL TALLER */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Propuesta actual del taller:</span>
              <span className="text-cyan-300 font-mono font-black">
                {fechaValidaTaller.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} - {fechaValidaTaller.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* SELECCIÓN DE DÍA (7 días posteriores) */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                1. Selecciona un día (Semana posterior):
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {diasDisponibles.map((d, i) => {
                  const esSel = d.toDateString() === diaSeleccionado.toDateString()
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDiaSeleccionado(d)}
                      className={`px-3.5 py-2.5 rounded-xl text-center shrink-0 border transition-all cursor-pointer ${
                        esSel
                          ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-wider">
                        {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-black font-mono mt-0.5">
                        {d.getDate()} {d.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SELECCIÓN DE VENTANA HORARIA */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                2. Selecciona una ventana horaria disponible:
              </label>

              {ventanasHorarias.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {ventanasHorarias.map(slot => {
                    const esSel = slot === slotSeleccionado
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSlotSeleccionado(slot)}
                        className={`p-2.5 rounded-xl font-mono text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          esSel
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-rose-400 font-bold">
                  No hay ventanas horarias disponibles para el día seleccionado dentro del horario de apertura.
                </div>
              )}
            </div>

            {/* OBSERVACIONES OPCIONALES */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Nota adicional para el taller (Opcional):</label>
              <input
                type="text"
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Ej: Prefiero recogerlo por la tarde si es posible..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            {/* BOTONES */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmar}
                disabled={loading || !slotSeleccionado}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Enviar Contrapropuesta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
