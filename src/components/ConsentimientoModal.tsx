import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Spinner } from "@phosphor-icons/react"
import { descargarPdfConsentimiento } from "../lib/pdfConsentimiento"

const easeOut = [0.23, 1, 0.32, 1] as const

interface HealthFlag {
  key: string
  label: string
}

const healthFlags: HealthFlag[] = [
  { key: "problemas_coagulacion", label: "Problemas de coagulación" },
  { key: "diabetes", label: "Diabetes" },
  { key: "enfermedad_cardiaca", label: "Enfermedad cardíaca" },
  { key: "epilepsia", label: "Epilepsia" },
  { key: "vih_hepatitis", label: "VIH / Hepatitis" },
  { key: "embarazo_lactancia", label: "Embarazo o lactancia" },
  { key: "bajo_efectos", label: "Bajo efectos de alcohol/drogas hoy" },
]

const aceptaciones = [
  {
    key: "acepta_riesgos",
    label:
      "Entiendo que un tatuaje es permanente y conozco los riesgos (infección, reacción alérgica, cicatrización).",
  },
  {
    key: "acepta_cuidados",
    label:
      "Me comprometo a seguir las indicaciones de cuidado post-tatuaje que me entregue el estudio.",
  },
  {
    key: "acepta_veracidad",
    label: "Declaro que toda la información entregada es verdadera y completa.",
  },
  {
    key: "acepta_datos",
    label: "Autorizo el tratamiento de mis datos personales para fines del servicio.",
  },
]

interface ConsentimientoModalProps {
  isOpen: boolean
  onClose: () => void
  nombre?: string
  whatsapp?: string
}

export default function ConsentimientoModal({ isOpen, onClose, nombre, whatsapp }: ConsentimientoModalProps) {
  const [form, setForm] = useState<Record<string, any>>({
    nombre: nombre || "",
    rut: "",
    fecha_nacimiento: "",
    telefono: whatsapp || "+56",
    email: "",
    zona_tatuaje: "",
    descripcion_tatuaje: "",
    alergias: false,
    alergias_detalle: "",
    medicamentos: "",
    mayor_edad: false,
    menor_edad: false,
    nombre_padre: "",
    rut_padre: "",
    acepta_riesgos: false,
    acepta_cuidados: false,
    acepta_veracidad: false,
    acepta_datos: false,
  })
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firmaData, setFirmaData] = useState<string | null>(null)
  const [carnetPreview, setCarnetPreview] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const hasSignature = useRef(false)

  useEffect(() => {
    if (isOpen) {
      setForm((f) => ({
        ...f,
        nombre: nombre || f.nombre,
        telefono: whatsapp || f.telefono,
      }))
    }
  }, [isOpen, nombre, whatsapp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isOpen) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    ctx.scale(ratio, ratio)
    ctx.strokeStyle = "#00e5ff"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [isOpen])

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.PointerEvent) => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    hasSignature.current = true
  }

  const stopDraw = () => {
    drawing.current = false
  }

  const clearSignature = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasSignature.current = false
    setFirmaData(null)
  }

  const setField = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  const toggleFlag = (key: string) => {
    setFlags((f) => ({ ...f, [key]: !f[key] }))
  }

  const handleCarnetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 200 * 1024) {
      setError("La imagen del carnet no puede superar 200 KB.")
      return
    }
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes (JPG, PNG, etc.).")
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setCarnetPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }

  const removeCarnet = () => setCarnetPreview(null)

  const descargarCopia = () => {
    if (!firmaData) return
    descargarPdfConsentimiento({
      nombre: form.nombre,
      rut: form.rut,
      fechaNacimiento: form.fecha_nacimiento,
      telefono: form.telefono,
      email: form.email,
      zonaTatuaje: form.zona_tatuaje,
      descripcionTatuaje: form.descripcion_tatuaje,
      saludMarcadas: [
        ...healthFlags.filter((f) => flags[f.key]).map((f) => f.label),
        ...(form.alergias ? ["Alergias"] : []),
      ],
      alergiasDetalle: form.alergias ? form.alergias_detalle : undefined,
      medicamentos: form.medicamentos,
      firmaUrl: firmaData,
      firmadoEn: new Date().toLocaleString("es-CL"),
      origen: "cliente",
      menorEdad: form.menor_edad,
      nombrePadre: form.nombre_padre,
      rutPadre: form.rut_padre,
      carnetPadreUrl: carnetPreview || undefined,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || !form.rut || !form.fecha_nacimiento || !form.telefono) {
      setError("Completa todos los campos obligatorios.")
      return
    }
    if (!/^\+56\d{9}$/.test(form.telefono)) {
      setError("Teléfono inválido. Debe ser +569XXXXXXXX.")
      return
    }

    const esMenor = form.menor_edad
    if (!form.mayor_edad && !esMenor) {
      setError("Debes confirmar si eres mayor o menor de edad.")
      return
    }

    if (esMenor) {
      if (!form.nombre_padre || !form.rut_padre) {
        setError("Completa los datos del padre/madre responsable.")
        return
      }
      if (!carnetPreview) {
        setError("Debes adjuntar la imagen del carnet del padre/madre.")
        return
      }
    }

    if (!form.acepta_riesgos || !form.acepta_cuidados || !form.acepta_veracidad || !form.acepta_datos) {
      setError("Debes aceptar todas las declaraciones para continuar.")
      return
    }
    if (!hasSignature.current) {
      setError("Falta tu firma.")
      return
    }

    setEnviando(true)
    try {
      const firma_url = canvasRef.current!.toDataURL("image/png")
      setFirmaData(firma_url)

      let carnet_url = ""
      if (esMenor && carnetPreview) {
        const uploadRes = await fetch("/api/upload-carnet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: carnetPreview }),
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          carnet_url = uploadData.url
        } else {
          setError("Error al subir la imagen del carnet. Intenta de nuevo.")
          setEnviando(false)
          return
        }
      }

      const payload = {
        ...form,
        ...flags,
        firma_url,
        menor_edad: esMenor,
        nombre_padre: esMenor ? form.nombre_padre : "",
        rut_padre: esMenor ? form.rut_padre : "",
        carnet_padre_url: carnet_url,
      }

      const res = await fetch("/api/consentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setEnviado(true)
      } else {
        setError(data.error || "Error al enviar. Intenta de nuevo.")
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    }
    setEnviando(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="glass rounded-2xl overflow-hidden w-full max-w-2xl mb-20"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-tech text-sm text-cyan-400 tracking-[0.15em] uppercase">Consentimiento Informado</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] p-6">
              {enviado ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-cyan-400/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="font-tech text-lg text-white tracking-[0.15em] mb-2">CONSENTIMIENTO REGISTRADO</h3>
                  <p className="text-gray-400 text-sm mb-6">Tu consentimiento fue enviado correctamente.</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={descargarCopia}
                      className="font-tech text-xs tracking-[0.15em] px-5 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-all"
                    >
                      DESCARGAR COPIA
                    </button>
                    <button
                      onClick={onClose}
                      className="font-tech text-xs tracking-[0.15em] px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                      CERRAR
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h4 className="font-tech text-cyan-400 text-xs tracking-[0.2em] uppercase mb-3">Datos personales</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <input className="neon-input w-full rounded-lg px-4 py-3 text-sm" placeholder="Nombre completo *" value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} />
                      <input className="neon-input w-full rounded-lg px-4 py-3 text-sm" placeholder="RUT *" value={form.rut} onChange={(e) => setField("rut", e.target.value)} />
                      <input type="date" className="neon-input w-full rounded-lg px-4 py-3 text-sm" value={form.fecha_nacimiento} onChange={(e) => setField("fecha_nacimiento", e.target.value)} />
                      <input className="neon-input w-full rounded-lg px-4 py-3 text-sm" placeholder="+569XXXXXXXX *" value={form.telefono} onChange={(e) => setField("telefono", e.target.value)} />
                      <input type="email" className="neon-input w-full rounded-lg px-4 py-3 text-sm md:col-span-2" placeholder="Email (opcional)" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-tech text-cyan-400 text-xs tracking-[0.2em] uppercase mb-3">Declaración de salud</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {healthFlags.map((f) => (
                        <button key={f.key} type="button" onClick={() => toggleFlag(f.key)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all border ${flags[f.key] ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"}`}>
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${flags[f.key] ? "border-cyan-400 bg-cyan-400" : "border-white/30"}`}>
                            {flags[f.key] && <span className="text-black text-[8px]">✓</span>}
                          </span>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setField("alergias", !form.alergias)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all border w-full mt-2 ${form.alergias ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"}`}>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${form.alergias ? "border-cyan-400 bg-cyan-400" : "border-white/30"}`}>
                        {form.alergias && <span className="text-black text-[8px]">✓</span>}
                      </span>
                      Tengo alergias
                    </button>
                    {form.alergias && (
                      <input className="neon-input w-full rounded-lg px-4 py-2.5 text-sm mt-2" placeholder="¿A qué eres alérgico/a?" value={form.alergias_detalle} onChange={(e) => setField("alergias_detalle", e.target.value)} />
                    )}
                    <input className="neon-input w-full rounded-lg px-4 py-2.5 text-sm mt-2" placeholder="Medicamentos actuales (opcional)" value={form.medicamentos} onChange={(e) => setField("medicamentos", e.target.value)} />
                  </div>

                  <div>
                    <h4 className="font-tech text-cyan-400 text-xs tracking-[0.2em] uppercase mb-3">Sobre el tatuaje</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <input className="neon-input w-full rounded-lg px-4 py-3 text-sm" placeholder="Zona del cuerpo" value={form.zona_tatuaje} onChange={(e) => setField("zona_tatuaje", e.target.value)} />
                      <input className="neon-input w-full rounded-lg px-4 py-3 text-sm" placeholder="Breve descripción" value={form.descripcion_tatuaje} onChange={(e) => setField("descripcion_tatuaje", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-tech text-cyan-400 text-xs tracking-[0.2em] uppercase mb-3">Declaraciones</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button type="button" onClick={() => { setField("mayor_edad", true); setField("menor_edad", false); removeCarnet() }} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all border ${form.mayor_edad ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"}`}>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${form.mayor_edad ? "border-cyan-400 bg-cyan-400" : "border-white/30"}`}>
                          {form.mayor_edad && <span className="text-black text-[8px]">✓</span>}
                        </span>
                        Mayor de 18 años
                      </button>
                      <button type="button" onClick={() => { setField("menor_edad", true); setField("mayor_edad", false) }} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all border ${form.menor_edad ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"}`}>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${form.menor_edad ? "border-cyan-400 bg-cyan-400" : "border-white/30"}`}>
                          {form.menor_edad && <span className="text-black text-[8px]">✓</span>}
                        </span>
                        Menor de 18 años
                      </button>
                    </div>

                    <AnimatePresence>
                      {form.menor_edad && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="glass rounded-xl p-4 mt-2 space-y-3 border border-cyan-400/20">
                            <p className="text-gray-400 text-xs">Necesitas el consentimiento de tu padre o madre responsable.</p>
                            <div className="grid md:grid-cols-2 gap-3">
                              <input className="neon-input w-full rounded-lg px-4 py-2.5 text-sm" placeholder="Nombre del padre/madre *" value={form.nombre_padre} onChange={(e) => setField("nombre_padre", e.target.value)} />
                              <input className="neon-input w-full rounded-lg px-4 py-2.5 text-sm" placeholder="RUT del padre/madre *" value={form.rut_padre} onChange={(e) => setField("rut_padre", e.target.value)} />
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-2">Foto del carnet del padre/madre *</p>
                              {carnetPreview ? (
                                <div className="relative inline-block">
                                  <img src={carnetPreview} alt="Carnet" className="max-h-32 rounded-lg border border-white/10" />
                                  <button type="button" onClick={removeCarnet} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 rounded-lg px-3 py-3 border border-dashed border-white/20 bg-white/[0.02] text-gray-400 hover:border-cyan-400/40 transition-all cursor-pointer text-xs">
                                  Subir foto del carnet (máx 200 KB)
                                  <input type="file" accept="image/*" onChange={handleCarnetUpload} className="hidden" />
                                </label>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2 mt-2">
                      {aceptaciones.map((a) => (
                        <button key={a.key} type="button" onClick={() => setField(a.key, !form[a.key])} className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all border w-full ${form[a.key] ? "border-cyan-400/50 bg-cyan-400/10 text-white" : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"}`}>
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${form[a.key] ? "border-cyan-400 bg-cyan-400" : "border-white/30"}`}>
                            {form[a.key] && <span className="text-black text-[8px]">✓</span>}
                          </span>
                          <span className="leading-relaxed">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-tech text-cyan-400 text-xs tracking-[0.2em] uppercase mb-3">Firma</h4>
                    <div className="relative rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <canvas ref={canvasRef} className="w-full h-32 touch-none cursor-crosshair" onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerLeave={stopDraw} />
                      <span className="absolute bottom-2 left-3 text-gray-600 text-[10px] font-tech tracking-wider pointer-events-none">Firma con el dedo o el mouse</span>
                      <button type="button" onClick={clearSignature} className="absolute top-2 right-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-tech uppercase tracking-wider">Borrar</button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button type="submit" disabled={enviando} className="hero-cta-primary w-full font-tech text-sm tracking-[0.15em] py-3 disabled:opacity-60">
                    {enviando ? <span className="flex items-center justify-center gap-2"><Spinner size={16} className="animate-spin" /> ENVIANDO...</span> : "FIRMAR Y ENVIAR"}
                  </button>

                  <p className="text-gray-600 text-[10px] text-center">Al enviar, tu firma y datos quedan registrados de forma segura y confidencial.</p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
