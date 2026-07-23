import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  DeviceMobile,
  PaintBrush,
  MapPinArea,
  Ruler,
  UploadSimple,
  Calculator,
  PaperPlaneRight,
  CheckCircle,
  ArrowClockwise,
} from "@phosphor-icons/react"
import { calcularEstimacion, formatPrecio } from "../lib/precios"

const estilos = [
  { value: "realismo", label: "Realismo" },
  { value: "tradicional", label: "Tradicional" },
  { value: "fineline", label: "Fine Line" },
  { value: "lettering", label: "Lettering" },
  { value: "color", label: "Microrealismo a Color" },
  { value: "otro", label: "Otro" },
]

const zonas = [
  { value: "brazo", label: "Brazo" },
  { value: "antebrazo", label: "Antebrazo" },
  { value: "pierna", label: "Pierna" },
  { value: "muslo", label: "Muslo" },
  { value: "espalda", label: "Espalda" },
  { value: "pecho", label: "Pecho" },
  { value: "costilla", label: "Costilla" },
  { value: "mano", label: "Mano" },
  { value: "cuello", label: "Cuello" },
  { value: "otro", label: "Otra" },
]

const tamanos = [
  { value: "pequeno", label: "Pequeño < 7cm" },
  { value: "mediano", label: "Mediano 8-15cm" },
  { value: "grande", label: "Grande > 15cm" },
  { value: "manga", label: "Manga Completa" },
]

export default function Cotizador() {
  const [form, setForm] = useState({
    nombre: "",
    whatsapp: "+56",
    estilo: "",
    zona: "",
    tamano: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [estimacion, setEstimacion] = useState<{ minimo: number; maximo: number } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (e.target.name === "whatsapp") setError(null)
  }

  const handleCalcular = () => {
    if (!form.tamano || !form.estilo) return
    setEstimacion(calcularEstimacion(form.tamano, form.estilo))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.whatsapp || !form.estilo || !form.zona || !form.tamano) return

    if (!/^\+56\d{9}$/.test(form.whatsapp)) {
      setError("WhatsApp inválido. Debe ser +569XXXXXXXX")
      return
    }

    setEnviando(true)

    let imagenBase64 = ""
    if (file) {
      try {
        const reader = new FileReader()
        imagenBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error("Error al leer la imagen"))
          reader.readAsDataURL(file)
        })
      } catch {
        setError("No se pudo leer la imagen. Intenta con otra.")
        setEnviando(false)
        return
      }
    }

    try {
      const res = await fetch("/api/cotizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          whatsapp: form.whatsapp,
          estilo: form.estilo,
          zona: form.zona,
          tamano: form.tamano,
          imagenBase64,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setEnviado(true)
        setForm({ nombre: "", whatsapp: "+56", estilo: "", zona: "", tamano: "" })
        setFile(null)
        setEstimacion(null)
      } else {
        setError("Error del servidor. Intenta de nuevo más tarde.")
      }
    } catch {
      setError("Error al enviar la cotización. Intenta de nuevo.")
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <section id="cotizador" className="relative py-20 md:py-32">
        <div className="max-w-lg mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={40} className="text-cyan-400" weight="fill" />
            </motion.div>
            <h3 className="section-title text-3xl premium-gradient mb-3">¡COTIZACIÓN ENVIADA!</h3>
            <p className="text-gray-500 text-sm mb-8 tracking-wider">
              Te contactaremos por WhatsApp para confirmar los detalles.
            </p>
            <button
              onClick={() => setEnviado(false)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm tracking-widest hover:bg-cyan-400/20 transition-all"
            >
              <ArrowClockwise size={16} weight="bold" />
              NUEVA COTIZACIÓN
            </button>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="cotizador" className="relative py-20 md:py-32 overflow-hidden">
      <div className="ambient-glow bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            Cotiza tu diseño
          </span>
                <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
            COTIZADOR
            <br />
            <span className="premium-gradient">INSTANTÁNEO</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="glass rounded-2xl md:rounded-3xl p-5 md:p-10 space-y-5 md:space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="font-tech flex items-center gap-2 text-xs tracking-[0.2em] text-cyan-400/60 uppercase">
                  <User size={14} className="text-cyan-400" />
                  Nombre
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  className="neon-input rounded-xl px-5 py-3.5 w-full text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="font-tech flex items-center gap-2 text-xs tracking-[0.2em] text-cyan-400/60 uppercase">
                  <DeviceMobile size={14} className="text-cyan-400" />
                  WhatsApp
                </label>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="+56 9 XXXX XXXX"
                  required
                  className="neon-input rounded-xl px-5 py-3.5 w-full text-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="font-tech flex items-center gap-2 text-xs tracking-[0.2em] text-cyan-400/60 uppercase">
                  <PaintBrush size={14} className="text-cyan-400" />
                  Estilo
                </label>
                <select
                  name="estilo"
                  value={form.estilo}
                  onChange={handleChange}
                  required
                  className="neon-input rounded-xl px-5 py-3.5 w-full text-sm appearance-none"
                >
                  <option value="">Seleccionar</option>
                  {estilos.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-tech flex items-center gap-2 text-xs tracking-[0.2em] text-cyan-400/60 uppercase">
                  <MapPinArea size={14} className="text-cyan-400" />
                  Zona
                </label>
                <select
                  name="zona"
                  value={form.zona}
                  onChange={handleChange}
                  required
                  className="neon-input rounded-xl px-5 py-3.5 w-full text-sm appearance-none"
                >
                  <option value="">Seleccionar</option>
                  {zonas.map((z) => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-tech flex items-center gap-2 text-xs tracking-[0.2em] text-cyan-400/60 uppercase">
                  <Ruler size={14} className="text-cyan-400" />
                  Tamaño
                </label>
                <select
                  name="tamano"
                  value={form.tamano}
                  onChange={handleChange}
                  required
                  className="neon-input rounded-xl px-5 py-3.5 w-full text-sm appearance-none"
                >
                  <option value="">Seleccionar</option>
                  {tamanos.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs tracking-widest text-cyan-400/60 uppercase">
                <UploadSimple size={14} className="text-cyan-400" />
                Imagen de referencia (opcional)
              </label>
              <label className="neon-input rounded-xl px-5 py-3.5 w-full flex items-center gap-3 cursor-pointer text-sm text-gray-400 hover:border-cyan-400/30 transition-colors">
                <UploadSimple size={18} className="text-cyan-400 shrink-0" />
                <span className="truncate">{file ? file.name : "Subir imagen..."}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleCalcular}
              className="font-tech neon-button w-full rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.2em]"
            >
              <Calculator size={18} weight="bold" />
              CALCULAR ESTIMACIÓN
            </button>

            <AnimatePresence>
              {estimacion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-cyan rounded-2xl p-6 text-center overflow-hidden"
                >
                  <p className="text-xs tracking-[0.2em] text-cyan-400/60 uppercase mb-2">
                    Precio estimado
                  </p>
                  <p className="text-3xl md:text-4xl font-bold section-title premium-gradient">
                    {formatPrecio(estimacion.minimo)} - {formatPrecio(estimacion.maximo)}
                  </p>
                  <p className="text-gray-600 text-xs mt-3 tracking-wider">
                    Estimación automática. El valor final puede variar según los detalles del
                    diseño y será confirmado por el artista vía WhatsApp.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="font-tech text-xs text-red-400 tracking-wider text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="font-tech neon-button-primary w-full rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.2em] disabled:opacity-50"
            >
              <PaperPlaneRight size={18} weight="bold" />
              {enviando ? "ENVIANDO..." : "ENVIAR COTIZACIÓN"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
