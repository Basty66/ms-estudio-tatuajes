import { motion } from "framer-motion"
import { Eye, Swatches, TextT, ArrowRight } from "@phosphor-icons/react"

const categories = [
  {
    image: "/images/tatuaje1.jpg",
    icon: Eye,
    title: "Black & Grey",
    subtitle: "Realismo Mitológico",
    desc: "Tatuaje detallado de Anubis",
    info: "El Black & Grey es la técnica clásica del tatuaje. Usamos sombreado en escala de grises para crear volumen, profundidad y realismo. Ideal para retratos, criaturas mitológicas y piezas con alto contraste. Es el estilo más solicitado por su durabilidad y elegancia atemporal.",
    ideal: "Retratos, dioses, animales, rostros",
  },
  {
    image: "/images/tatuaje2.jpg",
    icon: Swatches,
    title: "Microrealismo a Color",
    subtitle: "Fine Line",
    desc: "Dos peces Betta flotando, uno rojo y uno negro",
    info: "El Microrealismo combina líneas finas (Fine Line) con color vibrante para lograr detalles hiperrealistas en tamaño reducido. Usamos agujas ultra finas y tintas de alta densidad para capturar cada detalle. Perfecto para piezas pequeñas con gran impacto visual.",
    ideal: "Animales, flores, retratos pequeños, detalles",
  },
  {
    image: "/images/tatuaje3.jpg",
    icon: TextT,
    title: "Lettering",
    subtitle: "Caligrafía Custom",
    desc: "Letras estilo Script que digan \"Godfather\"",
    info: "El Lettering es el arte de la tipografía personalizada. Cada pieza se diseña desde cero adaptando la fuente, el grosor y la ornamentación al estilo del cliente. Desde scripts elegantes hasta letras góticas, creamos textos con carácter y significado único.",
    ideal: "Nombres, fechas, frases, iniciales, memoriales",
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
    <section id="galeria" className="relative py-20 md:py-32 overflow-hidden">
      <div className="ambient-glow top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
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
                <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
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
                className="group relative rounded-2xl overflow-hidden min-h-[400px] md:min-h-[520px] glass-card cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/60 transition-all duration-700" />
              
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,229,255,0.06), transparent 40%)",
                  }}
                />

                <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-8">
                  <div className="mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all duration-500">
                      <Icon size={24} className="text-cyan-400" weight="duotone" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-wider">
                      {cat.title}
                    </h3>
                    <p className="text-cyan-400/80 text-sm font-medium tracking-wider mb-3">
                      {cat.subtitle}
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="overflow-hidden max-h-0 md:group-hover:max-h-40 transition-all duration-700 ease-in-out">
                    <p className="text-gray-400 text-xs leading-relaxed mb-3 opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-100">
                      {cat.info}
                    </p>
                    <p className="text-cyan-400/50 text-[10px] tracking-widest uppercase opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-200">
                      Ideal para: {cat.ideal}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-cyan-400/60 group-hover:text-cyan-400 transition-colors duration-300 text-xs tracking-widest uppercase mt-3">
                    <span className="md:hidden">Más info</span>
                    <span className="hidden md:inline">Ver estilo</span>
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
