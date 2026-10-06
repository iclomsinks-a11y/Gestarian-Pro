import React, { useState, useRef } from 'react'
import {
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Square,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Sparkles,
  RefreshCw,
  Camera,
  AlertCircle
} from 'lucide-react'
import { uploadImageToCloudflare } from '../services/cloudflareService'
import { transcribeAudio, mejorarTextoConGemini } from '../services/aiProviderService'
import { crearAccionOT, eliminarAccionOT, AccionOT } from '../services/otAccionesService'
import { getPerfil } from '../services/authService'
import { useToast } from '../lib/ToastContext'

interface PanelAccionesEmpleadoOTProps {
  ordenTrabajoId?: string
  reparacionId?: string
  clienteId: string
  vehiculoId?: string
  acciones: AccionOT[]
  onAccionesUpdated: () => void
}

export function PanelAccionesEmpleadoOT({
  ordenTrabajoId,
  reparacionId,
  clienteId,
  vehiculoId,
  acciones,
  onAccionesUpdated
}: PanelAccionesEmpleadoOTProps) {
  const { showToast } = useToast()
  const perfil = getPerfil()

  const [modalTipo, setModalTipo] = useState<'imagen' | 'texto' | 'voz' | null>(null)
  const [loading, setLoading] = useState(false)
  const [mejorandoIA, setMejorandoIA] = useState(false)

  // Subir Imagen
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [pieFotoRaw, setPieFotoRaw] = useState('')
  const [pieFotoMejorado, setPieFotoMejorado] = useState('')

  // Texto / Comentario
  const [textoRaw, setTextoRaw] = useState('')
  const [textoMejorado, setTextoMejorado] = useState('')

  // Audio / Grabación de voz
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ── 1. SUBIDA DE IMAGEN (Cloudflare + Gemini pie de foto) ──
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
      setPieFotoRaw('')
      setPieFotoMejorado('')
      setModalTipo('imagen')
    }
  }

  const handleMejorarPieFoto = async () => {
    if (!pieFotoRaw.trim()) return
    setMejorandoIA(true)
    try {
      const mejorado = await mejorarTextoConGemini(pieFotoRaw, 'pie_foto')
      setPieFotoMejorado(mejorado)
    } catch (e) {
      showToast('Error al procesar el texto con Gemini', 'error')
    } finally {
      setMejorandoIA(false)
    }
  }

  const handleConfirmarImagen = async () => {
    if (!selectedFile) return
    setLoading(true)
    try {
      // 1. Subida a Cloudflare Images (WebP max 720p)
      const res = await uploadImageToCloudflare(selectedFile, selectedFile.name)
      if (!res.success || !res.url) {
        throw new Error(res.error || 'Error al subir la imagen a Cloudflare.')
      }

      // 2. Crear acción OT
      await crearAccionOT({
        orden_trabajo_id: ordenTrabajoId,
        reparacion_id: reparacionId,
        cliente_id: clienteId,
        vehiculo_id: vehiculoId,
        empleado_id: perfil?.id || 'emp-01',
        empleado_nombre: perfil?.nombre || 'Empleado Taller',
        empleado_cargo: perfil?.rol || 'MECANICO',
        tipo: 'imagen',
        url_imagen: res.url,
        pie_foto: pieFotoMejorado || pieFotoRaw
      })

      showToast('📸 Imagen publicada en tiempo real para el cliente', 'success')
      cerrarModal()
      onAccionesUpdated()
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar imagen', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── 2. INTRODUCIR TEXTO (Gemini mejora de redacción) ──
  const handleMejorarTexto = async () => {
    if (!textoRaw.trim()) return
    setMejorandoIA(true)
    try {
      const mejorado = await mejorarTextoConGemini(textoRaw, 'comentario')
      setTextoMejorado(mejorado)
    } catch (e) {
      showToast('Error al mejorar el texto con IA', 'error')
    } finally {
      setMejorandoIA(false)
    }
  }

  const handleConfirmarTexto = async () => {
    const textoFinal = textoMejorado || textoRaw
    if (!textoFinal.trim()) return
    setLoading(true)
    try {
      await crearAccionOT({
        orden_trabajo_id: ordenTrabajoId,
        reparacion_id: reparacionId,
        cliente_id: clienteId,
        vehiculo_id: vehiculoId,
        empleado_id: perfil?.id || 'emp-01',
        empleado_nombre: perfil?.nombre || 'Empleado Taller',
        empleado_cargo: perfil?.rol || 'MECANICO',
        tipo: 'texto',
        texto: textoFinal,
        texto_original: textoRaw
      })

      showToast('📝 Comentario enviado al área de cliente', 'success')
      cerrarModal()
      onAccionesUpdated()
    } catch (e) {
      showToast('Error al enviar el comentario', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── 3. GRABAR VOZ (Audio MediaRecorder + Transcripción Gemini) ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
        // Transcribir automáticamente
        await transcribirYMejorarVoz(blob)
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      showToast('No se pudo acceder al micrófono', 'error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const transcribirYMejorarVoz = async (blob: Blob) => {
    setMejorandoIA(true)
    try {
      const transcrito = await transcribeAudio(blob)
      setTextoRaw(transcrito)
      const mejorado = await mejorarTextoConGemini(transcrito, 'transcripcion_voz')
      setTextoMejorado(mejorado)
    } catch (err: any) {
      showToast(err?.message || 'Error transcribiendo audio', 'error')
    } finally {
      setMejorandoIA(false)
    }
  }

  const handleConfirmarVoz = async () => {
    const textoFinal = textoMejorado || textoRaw
    if (!textoFinal.trim()) return
    setLoading(true)
    try {
      await crearAccionOT({
        orden_trabajo_id: ordenTrabajoId,
        reparacion_id: reparacionId,
        cliente_id: clienteId,
        vehiculo_id: vehiculoId,
        empleado_id: perfil?.id || 'emp-01',
        empleado_nombre: perfil?.nombre || 'Empleado Taller',
        empleado_cargo: perfil?.rol || 'MECANICO',
        tipo: 'voz',
        texto: textoFinal,
        texto_original: textoRaw
      })

      showToast('🎤 Nota de voz transcrita y notificada al cliente', 'success')
      cerrarModal()
      onAccionesUpdated()
    } catch (e) {
      showToast('Error al enviar la nota de voz', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta acción enviada?')) return
    const ok = await eliminarAccionOT(id)
    if (ok) {
      showToast('Acción eliminada correctamente', 'success')
      onAccionesUpdated()
    } else {
      showToast('Error al eliminar acción', 'error')
    }
  }

  const cerrarModal = () => {
    setModalTipo(null)
    setSelectedFile(null)
    setImagePreviewUrl(null)
    setPieFotoRaw('')
    setPieFotoMejorado('')
    setTextoRaw('')
    setTextoMejorado('')
    setAudioBlob(null)
  }

  return (
    <div className="space-y-4 bg-slate-900/90 border-2 border-cyan-500/30 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-black text-white uppercase tracking-wider">PANEL DE ACCIONES EN ORDEN DE TRABAJO</h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
          NOTIFICACIONES TIEMPO REAL AL CLIENTE
        </span>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Subir Imagen */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleSelectFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-slate-200 hover:text-white flex items-center justify-center gap-2.5 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
        >
          <Camera className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Subir Imagen</span>
        </button>

        {/* 2. Añadir Texto */}
        <button
          type="button"
          onClick={() => {
            setTextoRaw('')
            setTextoMejorado('')
            setModalTipo('texto')
          }}
          className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/40 hover:border-teal-400 text-slate-200 hover:text-white flex items-center justify-center gap-2.5 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
        >
          <MessageSquare className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
          <span>Añadir Texto</span>
        </button>

        {/* 3. Grabar Voz */}
        <button
          type="button"
          onClick={() => {
            setTextoRaw('')
            setTextoMejorado('')
            setModalTipo('voz')
          }}
          className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/40 hover:border-purple-400 text-slate-200 hover:text-white flex items-center justify-center gap-2.5 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
        >
          <Mic className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span>Grabar Voz</span>
        </button>
      </div>

      {/* HISTORIAL DE ACCIONES PUBLICADAS EN LA OT */}
      {acciones.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Acciones publicadas en el Área del Cliente ({acciones.length}):
          </span>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {acciones.map(a => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {a.tipo === 'imagen' && <ImageIcon className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />}
                  {a.tipo === 'texto' && <MessageSquare className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />}
                  {a.tipo === 'voz' && <Mic className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-300">{a.empleado_nombre}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {a.tipo === 'imagen' && (
                      <div className="mt-1.5 space-y-1">
                        <img
                          src={a.url_imagen}
                          alt="OT foto"
                          className="w-24 h-24 object-cover rounded-lg border border-slate-700"
                        />
                        {a.pie_foto && <p className="text-slate-300 font-medium">{a.pie_foto}</p>}
                      </div>
                    )}

                    {(a.tipo === 'texto' || a.tipo === 'voz') && (
                      <p className="text-slate-200 mt-1 font-medium leading-relaxed">{a.texto}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleEliminar(a.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors shrink-0 cursor-pointer"
                  title="Eliminar esta acción de la OT"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL PREVISUALIZACIÓN Y CONFIRMACIÓN CON IA ── */}
      {modalTipo && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {modalTipo === 'imagen' && 'SUBIR IMAGEN Y REVISAR CON IA'}
                  {modalTipo === 'texto' && 'REVISAR COMENTARIO CON IA'}
                  {modalTipo === 'voz' && 'GRABAR Y TRANSCRIBIR VOZ CON IA'}
                </h3>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-white p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* CASO 1: IMAGEN */}
            {modalTipo === 'imagen' && imagePreviewUrl && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img
                    src={imagePreviewUrl}
                    alt="Previsualización"
                    className="max-h-48 rounded-xl border-2 border-cyan-500/30 object-contain"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pie de Foto (Opcional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pieFotoRaw}
                      onChange={e => setPieFotoRaw(e.target.value)}
                      placeholder="Ej: Desmontaje de paragolpes completado..."
                      className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleMejorarPieFoto}
                      disabled={mejorandoIA || !pieFotoRaw.trim()}
                      className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {mejorandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Mejorar</span>
                    </button>
                  </div>
                </div>

                {pieFotoMejorado && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Previsualización Texto Mejorado Gemini:
                    </span>
                    <p className="text-xs text-white font-medium">{pieFotoMejorado}</p>
                  </div>
                )}
              </div>
            )}

            {/* CASO 2: TEXTO */}
            {modalTipo === 'texto' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Escribe tu nota/diagnóstico:</label>
                  <textarea
                    rows={3}
                    value={textoRaw}
                    onChange={e => setTextoRaw(e.target.value)}
                    placeholder="Ej: Hemos comprobado la holgura del trapecio izquierdo, requiere sustitución..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleMejorarTexto}
                  disabled={mejorandoIA || !textoRaw.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {mejorandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Mejorar Redacción con IA (Gemini)</span>
                </button>

                {textoMejorado && (
                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Texto Mejorado (Previsualización final al cliente):
                    </span>
                    <textarea
                      rows={3}
                      value={textoMejorado}
                      onChange={e => setTextoMejorado(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-teal-500/40 rounded-lg text-xs text-white font-medium"
                    />
                  </div>
                )}
              </div>
            )}

            {/* CASO 3: VOZ */}
            {modalTipo === 'voz' && (
              <div className="space-y-4">
                <div className="text-center space-y-3 py-3">
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-transform active:scale-95 cursor-pointer"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center mx-auto animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.6)] cursor-pointer"
                    >
                      <Square className="w-8 h-8" />
                    </button>
                  )}
                  <p className="text-xs font-bold text-slate-300">
                    {recording ? 'Grabando audio... Pulsa para detener' : 'Pulsa el micrófono para comenzar a hablar'}
                  </p>
                </div>

                {mejorandoIA && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center gap-2 text-purple-300 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcribiendo y mejorando texto con Gemini...</span>
                  </div>
                )}

                {textoMejorado && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Transcripción y Texto Mejorado:
                    </span>
                    <textarea
                      rows={3}
                      value={textoMejorado}
                      onChange={e => setTextoMejorado(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-purple-500/40 rounded-lg text-xs text-white font-medium"
                    />
                  </div>
                )}
              </div>
            )}

            {/* BOTONES CONFIRMAR / CANCELAR */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (modalTipo === 'imagen') handleConfirmarImagen()
                  if (modalTipo === 'texto') handleConfirmarTexto()
                  if (modalTipo === 'voz') handleConfirmarVoz()
                }}
                disabled={loading || mejorandoIA}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirmar y Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
