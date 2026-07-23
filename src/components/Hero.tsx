import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Tag, Heart, Camera, ArrowRight, Sparkle, ShareNetwork, Needle, Flower } from "@phosphor-icons/react"

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
  hover: { y: -8, transition: { duration: 0.3, ease: easeOut } },
}

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section id="inicio" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Video background — desktop */}
      <div className="absolute inset-0 z-0 hidden md:block" style={{ filter: "grayscale(100%) brightness(18%) contrast(140%)" }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          poster="https://images.unsplash.com/photo-1611501275010-a5f652551b23?w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Fallback image — mobile y si no hay video */}
      <div
        className="absolute inset-0 z-0 md:hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1611501275010-a5f652551b23?w=800&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "grayscale(100%) brightness(18%) contrast(140%)",
          opacity: 0.5,
        }}
      />
      {/* Fallback image — desktop si video no carga */}
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1611501275010-a5f652551b23?w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "grayscale(100%) brightness(18%) contrast(140%)",
          opacity: 0.5,
          zIndex: -1,
        }}
      />

      {/* Ink-splash gradient overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black via-transparent to-black opacity-90" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.08)_0%,transparent_60%)]" />

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-[15%] right-[10%] text-cyan-400/10 z-[1] hidden lg:block"
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Needle size={80} weight="thin" />
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] left-[8%] text-gold-400/10 z-[1] hidden lg:block"
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flower size={60} weight="thin" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.p
            variants={itemVariants}
            className="font-tech text-xs md:text-sm tracking-[0.3em] text-cyan-400/60 mb-6 uppercase"
          >
            MS Estudio de Tatuajes · Melipilla
          </motion.p>

          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-4xl sm:text-8xl md:text-9xl lg:text-[10rem] section-title leading-[0.82]">
              <span className="premium-gradient">CONCURSO</span>
              <br />
              <span className="font-tech text-cyan-400 text-xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.25em] block mt-2 sm:mt-4 uppercase">
                PARTICIPA Y GANA
              </span>
            </h1>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <span className="h-px w-8 md:w-16 bg-cyan-400/20" />
            <p className="font-tech text-gray-500 text-xs md:text-sm tracking-[0.25em] uppercase">
              CONCURSO EXCLUSIVO PARA SEGUIDORES
            </p>
            <span className="h-px w-8 md:w-16 bg-cyan-400/20" />
          </motion.div>

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
                  className="glass-card-dark rounded-2xl p-4 md:p-8 flex flex-col items-center gap-3 md:gap-4 group cursor-default"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-500">
                    <Icon size={24} className="text-cyan-400" weight="duotone" />
                  </div>
                  <span className="text-2xl md:text-4xl font-bold section-title text-cyan-400">
                    {step.title}
                  </span>
                  <span className="font-tech text-[11px] md:text-[11px] text-gray-500 tracking-[0.2em] text-center leading-relaxed uppercase">
                    {step.desc}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <div className="gradient-border rounded-2xl p-5 md:p-10 bg-dark-400/70 backdrop-blur-xl">
              <motion.div
                className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkle size={28} className="text-cyan-400 shrink-0" weight="fill" />
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-4xl font-bold section-title premium-gradient">
                    ¡UN GANADOR!
                  </p>
                  <p className="font-tech text-base md:text-2xl text-white font-bold tracking-[0.15em]">
                    TATUAJE GRATIS VALORADO EN $80.000
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-14 flex flex-col items-center gap-6">
            <motion.button
              onClick={() => {
                const el = document.getElementById("galeria")
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" })
                  navigate("#galeria", { replace: true })
                }
              }}
              className="font-tech group flex items-center gap-3 text-gray-500 hover:text-cyan-400 transition-colors duration-300 tracking-[0.25em] text-xs uppercase py-3 px-4 min-h-[44px]"
              whileHover={{ x: 5 }}
            >
              Descubre nuestros estilos
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
