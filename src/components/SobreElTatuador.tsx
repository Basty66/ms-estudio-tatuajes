import { motion } from "framer-motion"
import { Medal, MapPin, User, Sparkle, Needle, CheckCircle } from "@phosphor-icons/react"

const especialidades = [
  "Black & Grey", "Microrealismo", "Fine Line", "Lettering", "Realismo"
]

export default function SobreElTatuador() {
  return (
    <section id="sobre" className="relative py-16 md:py-28 overflow-hidden section-dark">
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] ambient-glow-cyan -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[250px] h-[250px] ambient-glow-gold translate-x-1/3" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="font-tech text-[11px] tracking-[0.25em] text-cyan-400/70 uppercase">
            <Sparkle size={12} className="inline mr-1.5 text-cyan-400" weight="fill" />
            Sobre mí
          </span>
          <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-3">
            EL <span className="premium-gradient">TATUADOR</span>
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-cyan-400/25" />
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            <span className="h-px w-8 bg-cyan-400/25" />
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
          {/* Imagen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="shrink-0"
          >
            <div className="relative w-44 h-44 md:w-52 md:h-52">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent blur-sm" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
                  alt="Retrato del tatuador M.S. — MS Estudio de Tatuajes"
                  className="w-full h-full object-cover grayscale contrast-110"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center backdrop-blur-md">
                <Needle size={18} className="text-cyan-400" weight="fill" />
              </div>
            </div>

            <div className="mt-5 text-center md:text-left">
              <p className="text-xl md:text-2xl font-bold section-title text-white">M·S</p>
              <p className="text-gray-600 text-[10px] font-tech tracking-[0.2em] uppercase">
                Tatuador Profesional
              </p>
            </div>
          </motion.div>

          {/* Contenido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-2 mb-4">
              <Medal size={16} className="text-cyan-400" weight="fill" />
              <span className="text-cyan-400/80 font-tech text-xs tracking-[0.2em] uppercase">5+ años de experiencia</span>
            </div>

            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
              Transformando ideas en arte sobre piel. Especializado en estilos que van desde 
              el <span className="text-white">realismo</span> hasta composiciones personalizadas. 
              Cada tatuaje es una obra única, diseñada y ejecutada con los más altos estándares 
              de calidad e higiene.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {especialidades.map((e) => (
                <span key={e} className="flex items-center gap-1 px-3 py-1.5 rounded-full glass border border-white/5 text-[11px] text-gray-400 font-tech tracking-wider">
                  <CheckCircle size={10} className="text-cyan-400" weight="fill" />
                  {e}
                </span>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              <div className="glass rounded-xl p-3.5 flex items-start gap-3 border border-white/5">
                <MapPin size={16} className="text-cyan-400 mt-0.5 shrink-0" weight="duotone" />
                <div>
                  <p className="text-white text-xs font-medium mb-1">Trayectoria</p>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Formado con artistas reconocidos en Chile. Convenciones nacionales e internacionales.
                  </p>
                </div>
              </div>

              <div className="glass rounded-xl p-3.5 flex items-start gap-3 border border-white/5">
                <User size={16} className="text-cyan-400 mt-0.5 shrink-0" weight="duotone" />
                <div>
                  <p className="text-white text-xs font-medium mb-1">Compromiso</p>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Calidad, higiene y satisfacción del cliente. Material descartable y esterilizado.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/56964470668"
              target="_blank"
              rel="noopener noreferrer"
              className="font-tech inline-flex items-center gap-2.5 px-6 py-3 rounded-full neon-button text-xs tracking-[0.2em] group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AGENDAR SESIÓN
              <span className="group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
