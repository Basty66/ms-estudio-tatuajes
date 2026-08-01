import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  User,
  IdentificationCard,
  Cake,
  DeviceMobile,
  Warning,
  PencilSimple,
  CheckCircle,
  Eraser,
  ShieldCheck,
} from "@phosphor-icons/react"

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

export default function Consentimiento() {
  const [form, setForm] = useState<Record<string, any>>({
    nombre: "",
    rut: "",
    fecha_nacimiento: "",
    telefono: "+56",
    email: "",
    zona_tatuaje: "",
    descripcion_tatuaje: "",
    alergias: false,
    alergias_detalle: "",
    medicamentos: "",
    mayor_edad: false,
    acepta_riesgos: false,
    acepta_cuidados: false,
    acepta_veracidad: false,
    acepta_datos: false,
  })
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const hasSignature = useRef(false)

  // Setup del canvas de firma
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
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
  }, [])

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
  }

  const setField = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  const toggleFlag = (key: string) => {
    setFlags((f) => ({ ...f, [key]: !f[key] }))
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
    if (!form.mayor_edad) {
      setError("Debes confirmar que eres mayor de edad.")
      return
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
      const payload = { ...form, ...flags, firma_url }

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

  if (enviado) {
    return (
      <section id="consentimiento" className="relative py-20 md:py-28 section-dark overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="glass-premium rounded-2xl p-10 md:p-14"
          >
            <CheckCircle size={64} weight="duotone" className="text-cyan-400 mx-auto mb-6" />
            <h2 className="section-title text-3xl md:text-4xl text-white mb-3">
              CONSENTIMIENTO REGISTRADO
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Tu consentimiento fue firmado y enviado correctamente. El estudio ya tiene tu
              información. ¡Nos vemos pronto!
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="consentimiento" className="relative py-20 md:py-28 section-dark overflow-hidden">
      <div className="ambient-glow-cyan top-1/4 right-0 w-[500px] h-[500px] translate-x-1/2" />

      <div className="max-w-3xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-10"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
            <ShieldCheck size={14} className="inline mr-2" weight="fill" />
            Antes de tu sesión
          </span>
          <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-4">
            CONSENTIMIENTO <span className="premium-gradient">INFORMADO</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            Completa este formulario antes de tu cita. Es obligatorio, confidencial y solo toma un
            par de minutos.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="glass-premium rounded-2xl p-6 md:p-10 space-y-8">
          {/* Datos personales */}
          <div>
            <h3 className="font-tech text-cyan-400 text-sm tracking-[0.2em] uppercase mb-4">
              Datos personales
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Field icon={<User size={18} />}>
                <input
                  className="neon-input w-full rounded-lg px-4 py-3 pl-11 text-sm"
                  placeholder="Nombre completo *"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                />
              </Field>
              <Field icon={<IdentificationCard size={18} />}>
                <input
                  className="neon-input w-full rounded-lg px-4 py-3 pl-11 text-sm"
                  placeholder="RUT *"
                  value={form.rut}
                  onChange={(e) => setField("rut", e.target.value)}
                />
              </Field>
              <Field icon={<Cake size={18} />}>
                <input
                  type="date"
                  className="neon-input w-full rounded-lg px-4 py-3 pl-11 text-sm"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setField("fecha_nacimiento", e.target.value)}
                />
              </Field>
              <Field icon={<DeviceMobile size={18} />}>
                <input
                  className="neon-input w-full rounded-lg px-4 py-3 pl-11 text-sm"
                  placeholder="+569XXXXXXXX *"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Salud */}
          <div>
            <h3 className="font-tech text-cyan-400 text-sm tracking-[0.2em] uppercase mb-4">
              Declaración de salud
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              Marca lo que corresponda. Esta información es confidencial y ayuda a tu seguridad.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {healthFlags.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFlag(f.key)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all duration-300 border ${
                    flags[f.key]
                      ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                      : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      flags[f.key] ? "border-cyan-400 bg-cyan-400" : "border-white/30"
                    }`}
                  >
                    {flags[f.key] && <CheckCircle size={12} weight="bold" className="text-black" />}
                  </span>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Alergias con detalle */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setField("alergias", !form.alergias)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all duration-300 border w-full ${
                  form.alergias
                    ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                    : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    form.alergias ? "border-cyan-400 bg-cyan-400" : "border-white/30"
                  }`}
                >
                  {form.alergias && <CheckCircle size={12} weight="bold" className="text-black" />}
                </span>
                Tengo alergias
              </button>
              {form.alergias && (
                <input
                  className="neon-input w-full rounded-lg px-4 py-3 text-sm mt-2"
                  placeholder="¿A qué eres alérgico/a? (látex, pigmentos, medicamentos...)"
                  value={form.alergias_detalle}
                  onChange={(e) => setField("alergias_detalle", e.target.value)}
                />
              )}
            </div>

            <input
              className="neon-input w-full rounded-lg px-4 py-3 text-sm mt-3"
              placeholder="Medicamentos que tomas actualmente (opcional)"
              value={form.medicamentos}
              onChange={(e) => setField("medicamentos", e.target.value)}
            />
          </div>

          {/* Tatuaje */}
          <div>
            <h3 className="font-tech text-cyan-400 text-sm tracking-[0.2em] uppercase mb-4">
              Sobre el tatuaje
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="neon-input w-full rounded-lg px-4 py-3 text-sm"
                placeholder="Zona del cuerpo"
                value={form.zona_tatuaje}
                onChange={(e) => setField("zona_tatuaje", e.target.value)}
              />
              <input
                className="neon-input w-full rounded-lg px-4 py-3 text-sm"
                placeholder="Breve descripción"
                value={form.descripcion_tatuaje}
                onChange={(e) => setField("descripcion_tatuaje", e.target.value)}
              />
            </div>
          </div>

          {/* Aceptaciones */}
          <div>
            <h3 className="font-tech text-cyan-400 text-sm tracking-[0.2em] uppercase mb-4">
              Declaraciones
            </h3>
            <div className="space-y-2.5">
              <CheckRow
                checked={form.mayor_edad}
                onChange={() => setField("mayor_edad", !form.mayor_edad)}
                label="Confirmo que soy mayor de 18 años. *"
                highlight
              />
              {aceptaciones.map((a) => (
                <CheckRow
                  key={a.key}
                  checked={!!form[a.key]}
                  onChange={() => setField(a.key, !form[a.key])}
                  label={a.label}
                />
              ))}
            </div>
          </div>

          {/* Firma */}
          <div>
            <h3 className="font-tech text-cyan-400 text-sm tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
              <PencilSimple size={16} /> Firma
            </h3>
            <div className="relative rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-40 touch-none cursor-crosshair"
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={stopDraw}
                onPointerLeave={stopDraw}
              />
              <span className="absolute bottom-2 left-4 text-gray-600 text-[10px] font-tech tracking-wider pointer-events-none">
                Firma con el dedo o el mouse
              </span>
              <button
                type="button"
                onClick={clearSignature}
                className="absolute top-2 right-2 text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1 text-[10px] font-tech uppercase tracking-wider"
              >
                <Eraser size={14} /> Borrar
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              <Warning size={18} weight="fill" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="hero-cta-primary w-full font-tech text-sm tracking-[0.15em] py-4 disabled:opacity-60"
          >
            {enviando ? "ENVIANDO..." : "FIRMAR Y ENVIAR"}
          </button>

          <p className="text-gray-600 text-[11px] text-center leading-relaxed">
            Al enviar, tu firma y datos quedan registrados de forma segura y confidencial,
            únicamente para uso del estudio.
          </p>
        </form>
      </div>
    </section>
  )
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/60 pointer-events-none">
        {icon}
      </span>
      {children}
    </div>
  )
}

function CheckRow({
  checked,
  onChange,
  label,
  highlight,
}: {
  checked: boolean
  onChange: () => void
  label: string
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all duration-300 border w-full ${
        checked
          ? "border-cyan-400/50 bg-cyan-400/10 text-white"
          : highlight
            ? "border-cyan-400/20 bg-white/[0.02] text-gray-300 hover:border-cyan-400/40"
            : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"
      }`}
    >
      <span
        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
          checked ? "border-cyan-400 bg-cyan-400" : "border-white/30"
        }`}
      >
        {checked && <CheckCircle size={14} weight="bold" className="text-black" />}
      </span>
      <span className="leading-relaxed">{label}</span>
    </button>
  )
}
