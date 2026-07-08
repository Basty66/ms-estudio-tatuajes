import { motion } from "framer-motion"
import { Eye, Swatches, TextT, ArrowRight } from "@phosphor-icons/react"

const categories = [
  {
    icon: Eye,
    title: "Black & Grey",
    subtitle: "Realismo Mitológico",
    desc: "Tatuaje detallado de Anubis",
    accent: "from-gray-600 via-gray-400 to-gray-600",
    gradient: "from-gray-900/80 via-gray-800/40 to-gray-900/80",
  },
  {
    icon: Swatches,
    title: "Microrealismo a Color",
    subtitle: "Fine Line",
    desc: "Dos peces Betta flotando, uno rojo y uno negro",
    accent: "from-cyan-400 via-blue-400 to-cyan-400",
    gradient: "from-cyan-900/30 via-blue-900/30 to-cyan-900/30",
  },
  {
    icon: TextT,
    title: "Lettering",
    subtitle: "Caligrafía Custom",
    desc: "Letras estilo Script que digan \"Godfather\"",
    accent: "from-purple-400 via-pink-400 to-purple-400",
    gradient: "from-purple-900/30 via-gray-900/30 to-purple-900/30",
  },
]

const easeOut = [0.23, 1, 0.32, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: easeOut },
  }),
}

export default function Gallery() {
  return (
    <section id="galeria" className="relative py-32 overflow-hidden">
      <div className="ambient-glow top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            Nuestro trabajo
          </span>
          <h2 className="section-title text-5xl md:text-7xl text-white mb-4">
            GALERÍA DE
            <br />
            <span className="premium-gradient">ESTILOS</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -8 }}
                className="group relative rounded-2xl overflow-hidden min-h-[480px] glass-card cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,229,255,0.06), transparent 40%)",
                  }}
                />

                <div className="relative z-10 h-full flex flex-col justify-end p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all duration-500">
                      <Icon size={28} className="text-cyan-400" weight="duotone" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1 tracking-wider">
                      {cat.title}
                    </h3>
                    <p className="text-cyan-400/80 text-sm font-medium tracking-wider mb-3">
                      {cat.subtitle}
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-cyan-400/60 group-hover:text-cyan-400 transition-colors duration-300 text-xs tracking-widest uppercase">
                    Ver estilo
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
