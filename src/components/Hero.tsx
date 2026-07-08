import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Tag, Heart, Camera, ArrowRight, Sparkle, ShareNetwork } from "@phosphor-icons/react"

const steps = [
  { icon: Tag, title: "01", desc: "ETIQUETA A UN AMIGO" },
  { icon: Heart, title: "02", desc: "SIGUE LA PÁGINA" },
  { icon: Camera, title: "03", desc: "SUBE A TU HISTORIA" },
  { icon: ShareNetwork, title: "04", desc: "REPOSTEA ESTA PUBLICACIÓN" },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
}

const easeOut = [0.23, 1, 0.32, 1] as const

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easeOut },
  },
  hover: { y: -8, transition: { duration: 0.3 } },
}

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24"
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.1)_0%,transparent_60%)]"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.p
            variants={itemVariants}
            className="text-xs md:text-sm tracking-[0.3em] text-cyan-400/60 mb-6 uppercase"
          >
            MS Estudio de Tatuajes · Melipilla
          </motion.p>

            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold section-title leading-[0.85] mb-6"
            >
              <span className="premium-gradient">CONCURSO</span>
              <br />
              <span className="text-white text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[0.15em] block mt-3 md:mt-4 font-sans font-light">
                PARTICIPA Y GANA
              </span>
            </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-600 max-w-lg mx-auto text-xs md:text-sm tracking-[0.2em] mb-10 md:mb-16"
          >
            CONCURSO EXCLUSIVO PARA SEGUIDORES
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-16"
          >
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  variants={cardVariants}
                  whileHover="hover"
                  className="glass-card rounded-2xl p-4 md:p-8 flex flex-col items-center gap-3 md:gap-4 group cursor-default"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all duration-500">
                    <Icon
                      size={24}
                      className="text-cyan-400"
                      weight="duotone"
                    />
                  </div>
                  <span className="text-2xl md:text-4xl font-bold section-title text-cyan-400">
                    {step.title}
                  </span>
                  <span className="text-[10px] md:text-[11px] text-gray-500 tracking-[0.2em] text-center leading-relaxed">
                    {step.desc}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="max-w-2xl mx-auto"
          >
            <div className="gradient-border rounded-2xl p-5 md:p-10 bg-dark-400/50 backdrop-blur-sm">
              <motion.div
                className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkle
                  size={28}
                  className="text-cyan-400 shrink-0"
                  weight="fill"
                />
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-4xl font-bold section-title premium-gradient">
                    ¡UN GANADOR!
                  </p>
                  <p className="text-base md:text-2xl text-white font-bold tracking-wider">
                    TATUAJE GRATIS VALORADO EN $80.000
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <motion.button
              onClick={() => {
                const el = document.getElementById("galeria")
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" })
                  navigate("#galeria", { replace: true })
                }
              }}
              className="group flex items-center gap-3 text-gray-500 hover:text-cyan-400 transition-colors duration-300 tracking-widest text-xs uppercase"
              whileHover={{ x: 5 }}
            >
              Descubre nuestros estilos
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
