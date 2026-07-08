import { motion } from "framer-motion"
import {
  MapPin,
  Building,
  SealCheck,
  Star,
} from "@phosphor-icons/react"

const pillars = [
  { icon: MapPin, title: "FÁCIL DE ENCONTRAR", desc: "Av. Manso 529, Segundo Piso - Melipilla" },
  { icon: Building, title: "ESTUDIO PROFESIONAL", desc: "Espacio equipado y exclusivo para tu tatuaje" },
  { icon: Star, title: "EXPERIENCIA Y CALIDAD", desc: "Arte y precisión en cada trazo" },
]

export default function Ubicacion() {
  return (
    <section id="ubicacion" className="relative py-20 md:py-32 overflow-hidden">
      <div className="ambient-glow bottom-0 left-0 translate-x-1/2 translate-y-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            Encuéntranos
          </span>
                <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
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
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="glass rounded-2xl md:rounded-3xl p-5 md:p-10 flex flex-col justify-center"
          >
            <div className="flex items-start gap-5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                <MapPin size={24} className="text-cyan-400" weight="duotone" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wider">
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
            transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="glass rounded-2xl md:rounded-3xl p-2 md:p-4 min-h-[220px] md:min-h-[280px] group overflow-hidden"
          >
            <div className="w-full h-full min-h-[200px] rounded-2xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!2d3325.5!2d-71.214!3d-33.685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDQxJzA2LjAiUyA3McKwMTInNTAuNCJX!5e0!3m2!1ses!2scl!4v1!4m1!1s0x9662b5b5b5b5b5b5%3A0x0!2zQXYuIE1hbnNvIDUyOSwgTWVsaXBpbGxh!5e0!3m2!1ses!2scl"
                width="100%"
                height="100%"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MS Estudio de Tatuajes - Ubicación"
                className="grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-700"
                style={{ border: 0, minHeight: "200px", maxWidth: "100%", transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              />
            </div>
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
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-5 md:p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-cyan-400/10 transition-all">
                  <Icon size={28} className="text-cyan-400" weight="duotone" />
                </div>
                <h4 className="font-tech text-white font-bold text-sm tracking-[0.2em] mb-3">{p.title}</h4>
                <p className="text-gray-500 text-xs tracking-wider leading-relaxed">{p.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
