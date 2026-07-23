import { motion } from "framer-motion"
import { Medal, MapPin, User, Sparkle } from "@phosphor-icons/react"

export default function SobreElTatuador() {
  return (
    <section id="sobre" className="relative py-24 md:py-36 overflow-hidden section-dark">
      {/* Background glowing orbs */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] ambient-glow-cyan -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] ambient-glow-gold translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase mb-4 block">
            <Sparkle size={12} className="inline mr-2 text-cyan-400" weight="fill" />
            Sobre mí
          </span>
          <h2 className="section-title-fluid text-white mb-4">
            EL <span className="premium-gradient">TATUADOR</span>
          </h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="h-px w-12 md:w-20 bg-cyan-400/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="h-px w-12 md:w-20 bg-cyan-400/30" />
          </div>
          <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed font-tech tracking-wider uppercase text-xs">
            Conocé al artista detrás de la aguja
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Imagen */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face"
                alt="Retrato del tatuador M.S. — MS Estudio de Tatuajes"
                className="w-full aspect-[3/4] object-cover grayscale contrast-110"
              />
              {/* Frame border effect */}
              <div className="absolute inset-3 border border-white/[0.06] rounded-3xl pointer-events-none z-20" />
            </div>

            {/* Badge */}
            <motion.div
              className="absolute -bottom-4 -right-4 glass-premium rounded-2xl px-5 py-4 flex items-center gap-3"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                <Medal size={20} className="text-cyan-400" weight="fill" />
              </div>
              <div>
                <p className="text-white text-xs font-medium">5+ Años</p>
                <p className="text-gray-600 text-[10px] font-tech tracking-wider uppercase">Experiencia</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Contenido */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center">
                <User size={24} className="text-cyan-400" weight="duotone" />
              </div>
              <div>
                <p className="text-3xl font-bold section-title text-white">M·S</p>
                <p className="text-gray-500 text-xs font-tech tracking-[0.15em] uppercase">
                  TATUADOR PROFESIONAL
                </p>
              </div>
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-10">
              Más de <span className="text-cyan-400 font-semibold">5 años de experiencia</span> transformando 
              ideas en arte sobre piel. Especializado en estilos que van desde el{' '}
              <span className="text-white">realismo</span> hasta composiciones personalizadas únicas. 
              Cada tatuaje es una obra irrepetible.
            </p>

            <div className="space-y-4 mb-10">
              <motion.div
                className="glass-premium rounded-2xl p-5"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center shrink-0">
                    <Medal size={18} className="text-cyan-400" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-2">Especialidades</p>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Black & Grey · Microrealismo · Fine Line · Lettering · Composiciones personalizadas
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="glass-premium rounded-2xl p-5"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-cyan-400" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-2">Trayectoria</p>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Formado con artistas reconocidos en Chile. Participación en convenciones 
                      nacionales e internacionales. Comprometido con la calidad, higiene y 
                      satisfacción de cada cliente.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <a
              href="https://wa.me/56964470668"
              target="_blank"
              rel="noopener noreferrer"
              className="font-tech inline-flex items-center gap-3 px-8 py-4 rounded-full neon-button hover:gap-4 transition-all duration-500 text-sm tracking-[0.2em] group"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              AGENDAR SESIÓN
              <span className="group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
