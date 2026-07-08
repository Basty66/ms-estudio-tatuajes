import { useState } from "react"
import { Upload, Calculator, Send } from "lucide-react"
import { supabase } from "../lib/supabase"
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
  { value: "pequeno", label: "Pequeño (< 7 cm)" },
  { value: "mediano", label: "Mediano (8-15 cm)" },
  { value: "grande", label: "Grande (> 15 cm)" },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCalcular = () => {
    if (!form.tamano || !form.estilo) return
    const result = calcularEstimacion(form.tamano, form.estilo)
    setEstimacion(result)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.whatsapp || !form.estilo || !form.zona || !form.tamano) return

    setEnviando(true)
    let imageUrl = ""

    if (file) {
      const filePath = `cotizaciones/${Date.now()}_${file.name}`
      const { data: uploadData } = await supabase.storage
        .from("imagenes")
        .upload(filePath, file)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("imagenes").getPublicUrl(filePath)
        imageUrl = urlData?.publicUrl || ""
      }
    }

    const { error } = await supabase.from("cotizaciones").insert([
      {
        nombre: form.nombre,
        whatsapp: form.whatsapp,
        estilo: form.estilo,
        zona: form.zona,
        tamano: form.tamano,
        imagen_url: imageUrl,
      },
    ])

    setEnviando(false)
    if (!error) {
      setEnviado(true)
      setForm({ nombre: "", whatsapp: "+56", estilo: "", zona: "", tamano: "" })
      setFile(null)
      setEstimacion(null)
    }
  }

  if (enviado) {
    return (
      <section id="cotizador" className="py-24">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="neon-card rounded-xl p-12">
            <p className="text-cyan-400 text-5xl mb-4">✓</p>
            <h3 className="section-title text-2xl mb-2">¡COTIZACIÓN ENVIADA!</h3>
            <p className="text-gray-400 text-sm mb-6">
              Te contactaremos por WhatsApp para confirmar los detalles.
            </p>
            <button
              onClick={() => setEnviado(false)}
              className="neon-button-primary px-6 py-3 rounded-lg text-sm tracking-wider"
            >
              NUEVA COTIZACIÓN
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="cotizador" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-2xl mx-auto px-4 relative z-10">
        <p className="section-subtitle text-center mb-2">COTIZA TU DISEÑO</p>
        <h2 className="section-title text-4xl md:text-5xl text-center mb-12 neon-text">
          COTIZADOR
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-cyan-400/80 mb-1 tracking-wider">NOMBRE</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
              className="neon-input rounded-lg px-4 py-3 w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-cyan-400/80 mb-1 tracking-wider">WHATSAPP</label>
            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="+56 9 XXXX XXXX"
              required
              className="neon-input rounded-lg px-4 py-3 w-full text-sm"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-cyan-400/80 mb-1 tracking-wider">ESTILO</label>
              <select
                name="estilo"
                value={form.estilo}
                onChange={handleChange}
                required
                className="neon-input rounded-lg px-4 py-3 w-full text-sm appearance-none"
              >
                <option value="">Seleccionar</option>
                {estilos.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-cyan-400/80 mb-1 tracking-wider">ZONA</label>
              <select
                name="zona"
                value={form.zona}
                onChange={handleChange}
                required
                className="neon-input rounded-lg px-4 py-3 w-full text-sm appearance-none"
              >
                <option value="">Seleccionar</option>
                {zonas.map((z) => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-cyan-400/80 mb-1 tracking-wider">TAMAÑO</label>
              <select
                name="tamano"
                value={form.tamano}
                onChange={handleChange}
                required
                className="neon-input rounded-lg px-4 py-3 w-full text-sm appearance-none"
              >
                <option value="">Seleccionar</option>
                {tamanos.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-cyan-400/80 mb-1 tracking-wider">
              IMAGEN DE REFERENCIA (OPCIONAL)
            </label>
            <label className="neon-input rounded-lg px-4 py-3 w-full flex items-center gap-3 cursor-pointer text-sm text-gray-400 hover:border-cyan-400/40 transition-colors">
              <Upload size={18} className="text-cyan-400" />
              {file ? file.name : "Subir imagen..."}
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
            className="neon-button w-full rounded-lg px-6 py-3 flex items-center justify-center gap-2 text-sm tracking-wider"
          >
            <Calculator size={18} />
            CALCULAR ESTIMACIÓN
          </button>

          {estimacion && (
            <div className="neon-card rounded-xl p-6 text-center">
              <p className="text-cyan-400 text-sm tracking-wider mb-1">PRECIO ESTIMADO</p>
              <p className="text-2xl md:text-3xl font-bold text-white neon-text">
                {formatPrecio(estimacion.minimo)} - {formatPrecio(estimacion.maximo)}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Estimación automática. El valor final puede variar según los detalles del diseño y
                será confirmado por el artista vía WhatsApp.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="neon-button-primary w-full rounded-lg px-6 py-3 flex items-center justify-center gap-2 text-sm tracking-wider disabled:opacity-50"
          >
            <Send size={18} />
            {enviando ? "ENVIANDO..." : "ENVIAR COTIZACIÓN"}
          </button>
        </form>
      </div>
    </section>
  )
}
