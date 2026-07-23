import { motion } from "framer-motion"
import { Heart, ArrowUp } from "@phosphor-icons/react"

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="relative border-t border-white/5 pt-16 pb-8">
      <div className="ambient-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/3" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="mb-4">
              <span className="text-2xl font-bold tracking-[0.15em] text-white neon-text">MS</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Estudio de Tatuajes Profesional en Melipilla, Chile.
              Realismo, Fine Line, Lettering y más.
            </p>
          </div>

          <div>
            <h4 className="font-tech text-cyan-400 font-bold text-xs tracking-[0.2em] uppercase mb-5">
              Enlaces
            </h4>
            <nav className="flex flex-col gap-3">
              {["Inicio", "Galería", "Cotizador", "Agenda", "Ubicación"].map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    const id = l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    const el = document.getElementById(id)
                    if (el) el.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="text-left text-gray-500 hover:text-cyan-400 text-xs tracking-wider transition-colors py-2 min-h-[44px] flex items-center"
                >
                  {l}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-tech text-cyan-400 font-bold text-xs tracking-[0.2em] uppercase mb-5">
              Redes
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/matness_tattoos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-500 hover:text-cyan-400 transition-colors text-sm group min-h-[44px]"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-cyan-400 transition-colors">
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
                className="flex items-center gap-3 text-gray-500 hover:text-cyan-400 transition-colors text-sm group min-h-[44px]"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </span>
                MATNESS TATTOOS
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-700 text-xs tracking-wider flex items-center gap-1">
            © {new Date().getFullYear()} MS Estudio de Tatuajes. Hecho con{" "}
            <Heart size={12} className="text-cyan-400" weight="fill" /> en Melipilla
          </p>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all"
          >
            <ArrowUp size={16} weight="bold" />
          </motion.button>
        </div>
      </div>
    </footer>
  )
}
