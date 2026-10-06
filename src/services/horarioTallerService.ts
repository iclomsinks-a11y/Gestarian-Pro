/**
 * Servicio de Configuración de Horario del Taller y Validación de Ventanas Horarias
 * para la Contrapropuesta de Fecha de Entrega por parte del Cliente.
 */

import { supabase } from '../lib/supabase'

export interface TramoHorario {
  apertura: string // "09:00"
  cierre: string   // "14:00"
}

export interface DiaConfigHorario {
  activo: boolean
  manana: TramoHorario
  tarde?: TramoHorario | null
}

export interface HorarioTallerConfig {
  lunes_viernes: DiaConfigHorario
  sabado: DiaConfigHorario
  domingo: DiaConfigHorario
}

export const HORARIO_TALLER_DEFECTO: HorarioTallerConfig = {
  lunes_viernes: {
    activo: true,
    manana: { apertura: '09:00', cierre: '14:00' },
    tarde: { apertura: '16:00', cierre: '19:00' }
  },
  sabado: {
    activo: true,
    manana: { apertura: '09:00', cierre: '13:00' },
    tarde: null
  },
  domingo: {
    activo: false,
    manana: { apertura: '09:00', cierre: '14:00' },
    tarde: null
  }
}

const STORAGE_KEY_HORARIO = 'gestarian_horario_taller_config'

export function getHorarioTallerConfig(): HorarioTallerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HORARIO)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return HORARIO_TALLER_DEFECTO
}

export async function saveHorarioTallerConfig(config: HorarioTallerConfig): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_KEY_HORARIO, JSON.stringify(config))
    await supabase
      .from('configuracion')
      .update({ horario_taller: config })
      .eq('id', 1)
    return true
  } catch (e) {
    console.warn('Error al guardar horario_taller en Supabase:', e)
    return true
  }
}

/**
 * Obtiene la configuración de día según la fecha dada (0=Domingo, 1=Lunes,..., 6=Sábado)
 */
export function getDiaConfigForDate(date: Date, config = getHorarioTallerConfig()): DiaConfigHorario {
  const day = date.getDay()
  if (day === 0) return config.domingo
  if (day === 6) return config.sabado
  return config.lunes_viernes
}

/**
 * Genera slots de tiempo disponibles (intervalos de 30 min) para un día específico
 * aplicando las restricciones de contrapropuesta:
 * - Debe estar dentro del horario de apertura.
 * - Si es el mismo día propuesto por el taller, debe ser mínimo 30 minutos más tarde.
 * - Debe ser posterior a la fecha/hora propuesta por el taller.
 */
export function obtenerVentanasHorariasDisponibles(
  fechaTarget: Date,
  fechaPropuestaTaller: Date,
  config = getHorarioTallerConfig()
): string[] {
  const diaConfig = getDiaConfigForDate(fechaTarget, config)
  if (!diaConfig.activo) return []

  const slots: string[] = []

  const agregarSlotsDeTramo = (tramo: TramoHorario) => {
    const [hInicio, mInicio] = tramo.apertura.split(':').map(Number)
    const [hFin, mFin] = tramo.cierre.split(':').map(Number)

    let actualMinutos = hInicio * 60 + mInicio
    const finMinutos = hFin * 60 + mFin

    while (actualMinutos < finMinutos) {
      const h = Math.floor(actualMinutos / 60)
      const m = actualMinutos % 60
      const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      // Crear objeto Date completo para este slot
      const slotDate = new Date(fechaTarget)
      slotDate.setHours(h, m, 0, 0)

      // Reglas de restricción contrapropuesta:
      // 1. Siempre debe ser posterior a la fecha propuesta por el taller.
      if (slotDate.getTime() > fechaPropuestaTaller.getTime()) {
        const esMismoDia =
          slotDate.getFullYear() === fechaPropuestaTaller.getFullYear() &&
          slotDate.getMonth() === fechaPropuestaTaller.getMonth() &&
          slotDate.getDate() === fechaPropuestaTaller.getDate()

        if (esMismoDia) {
          // Mismo día: mínimo 30 minutos más tarde que la hora propuesta por el taller
          const diffMs = slotDate.getTime() - fechaPropuestaTaller.getTime()
          if (diffMs >= 30 * 60 * 1000) {
            slots.push(horaStr)
          }
        } else {
          // Otro día posterior: cualquier hora en horario de apertura
          slots.push(horaStr)
        }
      }

      actualMinutos += 30
    }
  }

  if (diaConfig.manana) agregarSlotsDeTramo(diaConfig.manana)
  if (diaConfig.tarde) agregarSlotsDeTramo(diaConfig.tarde)

  return slots
}

/**
 * Obtiene los próximos 7 días laborables/disponibles a partir de la fecha propuesta por el taller
 */
export function obtenerDiasDisponiblesSemana(fechaPropuestaTaller: Date, config = getHorarioTallerConfig()): Date[] {
  const dias: Date[] = []
  let cursor = new Date(fechaPropuestaTaller)
  cursor.setHours(0, 0, 0, 0)

  // Recorrer los próximos 7 días a partir de la fecha propuesta
  for (let i = 0; i < 7; i++) {
    const d = new Date(cursor)
    d.setDate(cursor.getDate() + i)

    const cfg = getDiaConfigForDate(d, config)
    if (cfg.activo) {
      dias.push(d)
    }
  }

  return dias
}
