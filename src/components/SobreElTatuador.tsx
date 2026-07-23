import { motion } from "framer-motion"
import { User, MapPin, Medal } from "@phosphor-icons/react"

export default function SobreElTatuador() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-16"
      >
        <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">Sobre mí</span>
        <h2 className="section-title text-4xl md:text-5xl mt-4 mb-6 text-white">EL TATUADOR</h2>
        <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
          Conocé al artista detrás de la aguja.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          <div className="aspect-[3/4] rounded-3xl overflow-hidden glass border border-white/5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face"
              alt="Tatuador"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center neon-glow">
            <Medal size={36} className="text-cyan-400" weight="duotone" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center">
              <User size={20} className="text-cyan-400" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">M·S</p>
              <p className="text-gray-500 text-xs font-tech tracking-wider">TATUADOR PROFESIONAL</p>
            </div>
          </div>

          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Más de 5 años de experiencia transformando ideas en arte sobre piel. 
            Especializado en estilos que van desde el realismo hasta composiciones 
            personalizadas únicas.
          </p>

          <div className="space-y-4 mb-8">
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <Medal size={18} className="text-cyan-400 mt-0.5 shrink-0" weight="duotone" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">Especialidades</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Black & Grey, Microrealismo, Fine Line, Lettering, composiciones personalizadas.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-cyan-400 mt-0.5 shrink-0" weight="duotone" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">Trayectoria</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Formado con artistas reconocidos en Chile. Participación en convenciones 
                    nacionales e internacionales. Comprometido con la calidad, higiene y 
                    satisfacción de cada cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/56964470668"
            target="_blank"
            rel="noopener noreferrer"
            className="font-tech inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm tracking-[0.2em] hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AGENDAR SESIÓN
          </a>
        </motion.div>
      </div>
    </div>
  )
}
