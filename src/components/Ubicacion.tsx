import { motion } from "framer-motion"
import {
  MapPin,
  Building,
  SealCheck,
  Star,
  ArrowSquareOut,
} from "@phosphor-icons/react"

const pillars = [
  { icon: MapPin, title: "FÁCIL DE ENCONTRAR", desc: "Av. Manso 529, Segundo Piso - Melipilla" },
  { icon: Building, title: "ESTUDIO PROFESIONAL", desc: "Espacio equipado y exclusivo para tu tatuaje" },
  { icon: Star, title: "EXPERIENCIA Y CALIDAD", desc: "Arte y precisión en cada trazo" },
]

export default function Ubicacion() {
  return (
    <section id="ubicacion" className="relative py-32 overflow-hidden">
      <div className="ambient-glow bottom-0 left-0 translate-x-1/2 translate-y-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            Encuéntranos
          </span>
          <h2 className="section-title text-5xl md:text-7xl text-white mb-4">
            NUESTRA
            <br />
            <span className="premium-gradient">UBICACIÓN</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass rounded-3xl p-8 md:p-10 flex flex-col justify-center"
          >
            <div className="flex items-start gap-5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                <MapPin size={24} className="text-cyan-400" weight="duotone" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-wider">
                  MS ESTUDIO DE TATUAJES
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Av. Manso 529, Segundo Piso
                  <br />
                  Melipilla, Chile
                </p>
              </div>
            </div>

            <div className="gradient-border rounded-2xl p-5 bg-dark-400/50">
              <p className="text-cyan-300 text-sm font-medium tracking-wider flex items-center gap-3">
                <SealCheck size={18} className="text-cyan-400" weight="duotone" />
                Puerta blanca es la entrada
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="glass rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center min-h-[280px] group"
          >
            <MapPin size={48} className="text-cyan-400 mb-4" weight="duotone" />
            <p className="text-gray-400 text-sm tracking-wider mb-4">
              Melipilla, Región Metropolitana
            </p>
            <a
              href="https://maps.google.com/?q=Av.+Manso+529+Melipilla"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-all text-sm tracking-wider group"
            >
              VER EN MAPA
              <ArrowSquareOut size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-cyan-400/10 transition-all">
                  <Icon size={28} className="text-cyan-400" weight="duotone" />
                </div>
                <h4 className="text-white font-bold text-sm tracking-widest mb-3">{p.title}</h4>
                <p className="text-gray-500 text-xs tracking-wider leading-relaxed">{p.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
