import React, { useEffect, useState } from 'react'
import {
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Clock,
  Sparkles,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { getAccionesOT, cargarAccionesOTDB, AccionOT, subscribeOTAcciones } from '../services/otAccionesService'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'

interface TimelineAccionesOTClienteProps {
  clienteId: string
  vehiculoId?: string
}

export function TimelineAccionesOTCliente({ clienteId, vehiculoId }: TimelineAccionesOTClienteProps) {
  const [acciones, setAcciones] = useState<AccionOT[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(true)
  const [modalImagenUrl, setModalImagenUrl] = useState<string | null>(null)

  const fetchAcciones = async () => {
    const list = await cargarAccionesOTDB(clienteId, vehiculoId)
    setAcciones(list)
    setLoading(false)
  }

  useEffect(() => {
    fetchAcciones()
    const unsubscribe = subscribeOTAcciones(() => {
      fetchAcciones()
    })
    return () => unsubscribe()
  }, [clienteId, vehiculoId])

  // Subscripción Realtime con debounce y cleanup (Blindaje de Egreso)
  useRealtimeSubscription({
    table: 'ot_acciones',
    filterColumn: 'cliente_id',
    filterValue: clienteId,
    onUpdate: () => fetchAcciones(),
    debounceMs: 600
  })

  if (!loading && acciones.length === 0) {
    return null
  }

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border-2 border-cyan-500/40 p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              ESTADO DEL VEHÍCULO Y SEGUIMIENTO EN TIEMPO REAL
            </h4>
            <span className="text-[10px] text-cyan-300 font-medium">Cronología de actualizaciones del taller</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expandido && (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-slate-800">
          {acciones.map(a => {
            const dateObj = new Date(a.created_at)
            const horaFormatted = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''
            const fechaFormatted = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              : ''

            return (
              <div key={a.id} className="relative group animate-fade-in">
                {/* ICONO DEL TIMELINE */}
                <div className="absolute -left-[30px] top-0.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  {a.tipo === 'imagen' && <Camera className="w-3.5 h-3.5" />}
                  {a.tipo === 'texto' && <MessageSquare className="w-3.5 h-3.5" />}
                  {a.tipo === 'voz' && <Mic className="w-3.5 h-3.5" />}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="font-black text-cyan-300 uppercase tracking-wider">
                      {a.empleado_nombre} ({a.empleado_cargo})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {fechaFormatted} - {horaFormatted}
                    </span>
                  </div>

                  {/* EVENTO SEGÚN TIPO */}
                  {a.tipo === 'imagen' && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-200">
                        📸 Se ha subido una nueva imagen{a.pie_foto ? `: "${a.pie_foto}"` : ''}
                      </p>
                      {a.url_imagen && (
                        <div className="relative group/img inline-block">
                          <img
                            src={a.url_imagen}
                            alt="Foto OT"
                            onClick={() => setModalImagenUrl(a.url_imagen || null)}
                            className="max-h-48 rounded-xl border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer object-cover shadow-md"
                          />
                          <span className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-md bg-slate-950/80 text-white font-bold opacity-0 group-hover/img:opacity-100 transition-opacity">
                            Ampliar 🔍
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {a.tipo === 'texto' && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-teal-300 block">📝 Nuevo comentario:</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {a.texto}
                      </p>
                    </div>
                  )}

                  {a.tipo === 'voz' && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-purple-300 block">🎤 Mensaje de voz transcrito:</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {a.texto}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL VISOR DE FOTO COMPLETA */}
      {modalImagenUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setModalImagenUrl(null)}
        >
          <img
            src={modalImagenUrl}
            alt="Ampliación"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl border-2 border-cyan-400 shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  )
}
