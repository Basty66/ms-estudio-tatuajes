import { motion } from "framer-motion"
import { FirstAid, Drop, Sun, Clock, X, Warning } from "@phosphor-icons/react"

const cuidados = [
  {
    icon: FirstAid,
    title: "Primeras 24 horas",
    items: [
      "Mantén el vendaje puesto durante 2-4 horas",
      "Lava con agua tibia y jabón neutro sin frotar",
      "Seca dando toques suaves con papel absorbente (no tela)",
    ],
  },
  {
    icon: Drop,
    title: "Hidratación",
    items: [
      "Aplica una capa FINA de crema (Bepanthol o similar) 2-3 veces al día",
      "No satures la piel — debe respirar",
      "Lava siempre antes de reaplicar crema",
    ],
  },
  {
    icon: Sun,
    title: "Qué evitar",
    items: [
      "Sol directo durante 3-4 semanas (arruina el pigmento)",
      "Piscinas, mar, jacuzzi (infección segura)",
      "Rascarse o arrancar las costras — se lleva la tinta",
      "Ropa ajustada que roce el tatuaje",
      "Ejercicio intenso los primeros 3 días (sudor = irritación)",
    ],
  },
  {
    icon: Clock,
    title: "Cicatrización",
    items: [
      "Días 3-7: empezará a pelarse como quemadura solar (NORMAL)",
      "Días 7-14: capa nueva de piel. Puede verse opaco (volverá el color)",
      "Día 30+: curado completo. Ya puedes exponer al sol con protector",
    ],
  },
  {
    icon: Warning,
    title: "Señales de alerta",
    items: [
      "Enrojecimiento que se expande después del día 3",
      "Pus, mal olor o dolor intenso",
      "Fiebre — consulta al médico inmediatamente",
      "Ante cualquier duda, escríbeme por WhatsApp",
    ],
  },
]

export default function CuidadosPost() {
  return (
    <section id="cuidados" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-dark-100 to-black" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
            <FirstAid size={14} className="inline mr-2 text-cyan-400" weight="fill" />
            Después del tatuaje
          </span>
          <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-4">
            CUIDADOS <span className="premium-gradient">POST-TATUAJE</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Seguí estas instrucciones para que tu tatuaje cure perfecto y mantenga sus colores para siempre.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuidados.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-premium rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center">
                    <Icon size={18} className="text-cyan-400" weight="duotone" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{cat.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-400 text-xs leading-relaxed">
                      <X size={10} className="text-cyan-400/50 mt-0.5 shrink-0" weight="bold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
