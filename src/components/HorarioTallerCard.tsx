import React, { useState, useEffect } from 'react'
import { Card } from './UI'
import { Clock, Save, CheckCircle2, Calendar } from 'lucide-react'
import { Switch } from '@mui/material'
import {
  getHorarioTallerConfig,
  saveHorarioTallerConfig,
  HorarioTallerConfig,
  HORARIO_TALLER_DEFECTO
} from '../services/horarioTallerService'
import { useToast } from '../lib/ToastContext'

export function HorarioTallerCard() {
  const { showToast } = useToast()
  const [horario, setHorario] = useState<HorarioTallerConfig>(HORARIO_TALLER_DEFECTO)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    setHorario(getHorarioTallerConfig())
  }, [])

  const handleSave = async () => {
    setGuardando(true)
    const ok = await saveHorarioTallerConfig(horario)
    setGuardando(false)
    if (ok) {
      setGuardado(true)
      showToast('¡Horario del taller guardado correctamente!', 'success')
      setTimeout(() => setGuardado(false), 2500)
    } else {
      showToast('Error al guardar el horario del taller', 'error')
    }
  }

  return (
    <Card className="p-6 space-y-5 border border-cyan-500/20 shadow-xl relative overflow-hidden bg-slate-900/90 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl text-cyan-400 border border-cyan-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">CONFIGURACIÓN DEL HORARIO DEL TALLER</h3>
            <p className="text-xs text-slate-400">Define los tramos de apertura para la contrapropuesta de citas y fecha de entrega del cliente</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={guardando}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {guardado ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4 text-slate-950" />}
          <span>{guardando ? 'Guardando...' : guardado ? '¡Guardado!' : 'Guardar Horario'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. LUNES A VIERNES */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black text-white uppercase">LUNES A VIERNES</span>
            </div>
            <Switch
              size="small"
              checked={horario.lunes_viernes.activo}
              onChange={(e) =>
                setHorario({
                  ...horario,
                  lunes_viernes: { ...horario.lunes_viernes, activo: e.target.checked }
                })
              }
              sx={{ '& .MuiSwitch-thumb': { bgcolor: '#38bdf8' } }}
            />
          </div>

          {horario.lunes_viernes.activo ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Turno Mañana</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Apertura</label>
                    <input
                      type="time"
                      value={horario.lunes_viernes.manana.apertura}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          lunes_viernes: {
                            ...horario.lunes_viernes,
                            manana: { ...horario.lunes_viernes.manana, apertura: e.target.value }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cierre</label>
                    <input
                      type="time"
                      value={horario.lunes_viernes.manana.cierre}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          lunes_viernes: {
                            ...horario.lunes_viernes,
                            manana: { ...horario.lunes_viernes.manana, cierre: e.target.value }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Turno Tarde</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Apertura</label>
                    <input
                      type="time"
                      value={horario.lunes_viernes.tarde?.apertura || '16:00'}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          lunes_viernes: {
                            ...horario.lunes_viernes,
                            tarde: {
                              apertura: e.target.value,
                              cierre: horario.lunes_viernes.tarde?.cierre || '19:00'
                            }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cierre</label>
                    <input
                      type="time"
                      value={horario.lunes_viernes.tarde?.cierre || '19:00'}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          lunes_viernes: {
                            ...horario.lunes_viernes,
                            tarde: {
                              apertura: horario.lunes_viernes.tarde?.apertura || '16:00',
                              cierre: e.target.value
                            }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-400 font-bold py-4 text-center">CERRADO</p>
          )}
        </div>

        {/* 2. SÁBADOS */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black text-white uppercase">SÁBADOS</span>
            </div>
            <Switch
              size="small"
              checked={horario.sabado.activo}
              onChange={(e) =>
                setHorario({
                  ...horario,
                  sabado: { ...horario.sabado, activo: e.target.checked }
                })
              }
              sx={{ '& .MuiSwitch-thumb': { bgcolor: '#38bdf8' } }}
            />
          </div>

          {horario.sabado.activo ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Turno Mañana</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Apertura</label>
                    <input
                      type="time"
                      value={horario.sabado.manana.apertura}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          sabado: {
                            ...horario.sabado,
                            manana: { ...horario.sabado.manana, apertura: e.target.value }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cierre</label>
                    <input
                      type="time"
                      value={horario.sabado.manana.cierre}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          sabado: {
                            ...horario.sabado,
                            manana: { ...horario.sabado.manana, cierre: e.target.value }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-400 font-bold py-4 text-center">CERRADO</p>
          )}
        </div>

        {/* 3. DOMINGOS */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black text-white uppercase">DOMINGOS</span>
            </div>
            <Switch
              size="small"
              checked={horario.domingo.activo}
              onChange={(e) =>
                setHorario({
                  ...horario,
                  domingo: { ...horario.domingo, activo: e.target.checked }
                })
              }
              sx={{ '& .MuiSwitch-thumb': { bgcolor: '#38bdf8' } }}
            />
          </div>

          {horario.domingo.activo ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Turno Mañana</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Apertura</label>
                    <input
                      type="time"
                      value={horario.domingo.manana.apertura}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          domingo: {
                            ...horario.domingo,
                            manana: { ...horario.domingo.manana, apertura: e.target.value }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cierre</label>
                    <input
                      type="time"
                      value={horario.domingo.manana.cierre}
                      onChange={(e) =>
                        setHorario({
                          ...horario,
                          domingo: {
                            ...horario.domingo,
                            manana: { ...horario.domingo.manana, cierre: e.target.value }
                          }
                        })
                      }
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-400 font-bold py-4 text-center">CERRADO</p>
          )}
        </div>
      </div>
    </Card>
  )
}
