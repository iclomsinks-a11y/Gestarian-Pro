/**
 * Servicio Centralizado para Acciones de la Orden de Trabajo (OT)
 * Maneja subida de fotos (Cloudflare), texto y notas de voz mejorados por Gemini,
 * almacenamiento en Supabase/localStorage, borrado lógico (soft delete),
 * y notificaciones en tiempo real (Supabase Realtime + Web Push).
 */

import { supabase } from '../lib/supabase'

export interface AccionOT {
  id: string
  orden_trabajo_id?: string
  reparacion_id?: string
  cliente_id: string
  vehiculo_id?: string
  empleado_id: string
  empleado_nombre: string
  empleado_cargo: string
  tipo: 'imagen' | 'texto' | 'voz'
  url_imagen?: string
  pie_foto?: string
  texto?: string
  texto_original?: string
  audio_url?: string
  activo: boolean
  deleted_at?: string | null
  created_at: string
}

const STORAGE_KEY_OT_ACCIONES = 'gestarian_ot_acciones'

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeOTAcciones(cb: Listener): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb()
    } catch (e) {
      console.warn('Error en listener de acciones OT:', e)
    }
  })
}

// ── Web Push Notification Helper ──
export async function solicitarPermisoNotificacionesPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission()
    return res === 'granted'
  }
  return false
}

export function enviarNotificacionPushCliente(titulo: string, cuerpo: string, icon = '/icons/icon-192x192.png') {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(titulo, {
            body: cuerpo,
            icon,
            badge: icon,
            tag: 'ot-update'
          })
        })
      } else {
        new Notification(titulo, { body: cuerpo, icon })
      }
    } catch (e) {
      console.warn('Error enviando notificación Push:', e)
    }
  }
}

// ── Cargar Acciones ──
export function getAccionesOT(filtro: {
  cliente_id?: string
  vehiculo_id?: string
  reparacion_id?: string
  orden_trabajo_id?: string
}): AccionOT[] {
  let list: AccionOT[] = []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OT_ACCIONES)
    if (raw) {
      list = JSON.parse(raw)
    }
  } catch (e) {}

  return list
    .filter(a => a.activo !== false)
    .filter(a => {
      if (filtro.cliente_id && a.cliente_id !== filtro.cliente_id) return false
      if (filtro.vehiculo_id && a.vehiculo_id && a.vehiculo_id !== filtro.vehiculo_id) return false
      if (filtro.reparacion_id && a.reparacion_id && a.reparacion_id !== filtro.reparacion_id) return false
      if (filtro.orden_trabajo_id && a.orden_trabajo_id && a.orden_trabajo_id !== filtro.orden_trabajo_id) return false
      return true
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ── Cargar Acciones desde Supabase (con fallback) ──
export async function cargarAccionesOTDB(clienteId: string, vehiculoId?: string): Promise<AccionOT[]> {
  try {
    let query = supabase
      .from('ot_acciones')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .order('created_at', { ascending: false })

    if (vehiculoId) {
      query = query.eq('vehiculo_id', vehiculoId)
    }

    const { data, error } = await query
    if (!error && data) {
      // Sincronizar en localStorage
      const local = getAccionesOT({})
      const map = new Map<string, AccionOT>()
      local.forEach(i => map.set(i.id, i))
      data.forEach((i: any) => map.set(i.id, i))
      const merged = Array.from(map.values())
      localStorage.setItem(STORAGE_KEY_OT_ACCIONES, JSON.stringify(merged))
      return data as AccionOT[]
    }
  } catch (e) {
    console.warn('Error consultando ot_acciones en Supabase, usando localStorage:', e)
  }

  return getAccionesOT({ cliente_id: clienteId, vehiculo_id: vehiculoId })
}

// ── Crear Nueva Acción de OT ──
export async function crearAccionOT(nuevaAccion: Omit<AccionOT, 'id' | 'created_at' | 'activo'>): Promise<AccionOT> {
  const accion: AccionOT = {
    ...nuevaAccion,
    id: `accion-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    activo: true,
    created_at: new Date().toISOString()
  }

  // 1. Guardar localmente
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OT_ACCIONES)
    const list: AccionOT[] = raw ? JSON.parse(raw) : []
    list.unshift(accion)
    localStorage.setItem(STORAGE_KEY_OT_ACCIONES, JSON.stringify(list))
    notifyListeners()
  } catch (e) {}

  // 2. Persistir en Supabase (si existe la tabla)
  try {
    await supabase.from('ot_acciones').insert({
      id: accion.id,
      orden_trabajo_id: accion.orden_trabajo_id || null,
      reparacion_id: accion.reparacion_id || null,
      cliente_id: accion.cliente_id,
      vehiculo_id: accion.vehiculo_id || null,
      empleado_id: accion.empleado_id,
      empleado_nombre: accion.empleado_nombre,
      empleado_cargo: accion.empleado_cargo,
      tipo: accion.tipo,
      url_imagen: accion.url_imagen || null,
      pie_foto: accion.pie_foto || null,
      texto: accion.texto || null,
      texto_original: accion.texto_original || null,
      activo: true,
      created_at: accion.created_at
    })
  } catch (e) {
    console.warn('Error al guardar accion_ot en Supabase:', e)
  }

  // 3. Notificación Push para el Cliente
  let pushTitulo = '📱 Actualización de tu Vehículo en Taller'
  let pushCuerpo = ''
  if (accion.tipo === 'imagen') {
    pushCuerpo = `📸 Se ha subido una nueva imagen${accion.pie_foto ? `: ${accion.pie_foto}` : ''}`
  } else if (accion.tipo === 'texto') {
    pushCuerpo = `📝 Nuevo comentario: ${accion.texto || ''}`
  } else if (accion.tipo === 'voz') {
    pushCuerpo = `🎤 Mensaje de voz transcrito: ${accion.texto || ''}`
  }

  enviarNotificacionPushCliente(pushTitulo, pushCuerpo)

  return accion
}

// ── Soft Delete de Acción ──
export async function eliminarAccionOT(id: string): Promise<boolean> {
  let success = false
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OT_ACCIONES)
    if (raw) {
      const list: AccionOT[] = JSON.parse(raw)
      const idx = list.findIndex(a => a.id === id)
      if (idx !== -1) {
        list[idx].activo = false
        list[idx].deleted_at = new Date().toISOString()
        localStorage.setItem(STORAGE_KEY_OT_ACCIONES, JSON.stringify(list))
        success = true
        notifyListeners()
      }
    }
  } catch (e) {}

  try {
    await supabase
      .from('ot_acciones')
      .update({ activo: false, deleted_at: new Date().toISOString() })
      .eq('id', id)
  } catch (e) {}

  return success
}
