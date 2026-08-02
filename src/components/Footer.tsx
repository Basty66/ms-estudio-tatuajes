import { motion } from "framer-motion"
import { Heart, ArrowUp, MapPin, WhatsappLogo } from "@phosphor-icons/react"

const links = [
  { label: "Inicio", id: "inicio" },
  { label: "Galería", id: "galeria" },
  { label: "Cotizador", id: "cotizador" },
  { label: "Agenda", id: "agenda" },
  { label: "Ubicación", id: "ubicacion" },
]

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <footer className="relative border-t border-white/5 pt-12 pb-6">
      <div className="ambient-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/3" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <span className="text-xl font-bold tracking-[0.15em] text-white neon-text">MS</span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed max-w-[220px]">
              Estudio de tatuajes profesional en Melipilla. Realismo, Fine Line, Lettering y más.
            </p>
          </div>

          <div>
            <h4 className="font-tech text-cyan-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-4">
              Enlaces
            </h4>
            <nav className="flex flex-col">
              {links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => goTo(l.id)}
                  className="text-left text-gray-500 hover:text-cyan-400 text-xs tracking-wider transition-colors py-1.5 flex items-center"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-tech text-cyan-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-4">
              Contacto
            </h4>
            <div className="flex flex-col gap-3">
              <p className="flex items-start gap-2 text-gray-500 text-xs">
                <MapPin size={14} className="text-cyan-400/60 mt-0.5 shrink-0" weight="fill" />
                Av. Manso 529, 2º piso
                <br />
                Melipilla, Chile
              </p>
              <a
                href="https://wa.me/56964470668"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-xs group"
              >
                <WhatsappLogo size={14} className="text-cyan-400/60 group-hover:text-cyan-400 shrink-0" weight="fill" />
                +56 9 6447 0668
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-tech text-cyan-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-4">
              Redes
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/matness_tattoos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-gray-500 hover:text-cyan-400 transition-colors text-xs group"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                @MATNESS_TATTOOS
              </a>
              <a
                href="https://facebook.com/matnesstattoos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-gray-500 hover:text-cyan-400 transition-colors text-xs group"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </span>
                MATNESS TATTOOS
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-700 text-[11px] tracking-wider flex items-center gap-1">
            © {new Date().getFullYear()} MS Estudio de Tatuajes. Hecho con{" "}
            <Heart size={11} className="text-cyan-400" weight="fill" /> en Melipilla
          </p>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all"
          >
            <ArrowUp size={14} weight="bold" />
          </motion.button>
        </div>
      </div>
    </footer>
  )
}
