import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretDown, Question } from "@phosphor-icons/react"

const faqs = [
  {
    q: "¿Duele hacerse un tatuaje?",
    a: "La sensación varía según la zona y tu tolerancia. La mayoría lo describe como un rasguño o vibración. Uso técnicas y anestésicos tópicos para minimizar la molestia. Miles de clientes vuelven — no es tan grave como crees.",
  },
  {
    q: "¿Cuánto dura un tatuaje?",
    a: "Es permanente. Con los cuidados adecuados — protección solar, hidratación — los colores se mantienen vivos por décadas. Los retoques son normales cada varios años en zonas de mucho roce.",
  },
  {
    q: "¿Cuánto cuesta un tatuaje?",
    a: "Depende del tamaño, detalle, ubicación y tiempo estimado. Te invito a usar el cotizador instantáneo aquí en la web para una estimación. El precio final lo confirmamos al ver el diseño.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Acepto efectivo y transferencia. Generalmente se paga una seña (20-30%) para reservar fecha y el resto el día de la sesión.",
  },
  {
    q: "¿Usas material descartable?",
    a: "Sí. 100% del material es descartable y de un solo uso: agujas, grips, vasos de tinta, guantes. Todo estéril y abierto frente a ti. Bioseguridad nivel hospitalario.",
  },
  {
    q: "¿Puedo traer mi propio diseño?",
    a: "¡Claro! Mándamelo por WhatsApp y lo revisamos. Si no, puedo diseñártelo desde cero según tus ideas. El diseño se entrega unos días antes de la sesión para que lo apruebes.",
  },
  {
    q: "¿Desde qué edad tatúas?",
    a: "Desde los 18 años con consentimiento informado. Entre 16-17 solo con autorización notarial de ambos padres presentes.",
  },
  {
    q: "¿Hacés retoques gratis?",
    a: "Sí, el primer retoque es gratuito dentro de los 3 meses posteriores al tatuaje, siempre que hayas seguido los cuidados indicados.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-20 md:py-28 overflow-hidden section-dark">
      <div className="ambient-glow-cyan top-1/2 right-0 w-[350px] h-[350px] translate-x-1/2" />

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
            <Question size={14} className="inline mr-2 text-cyan-400" weight="fill" />
            ¿Dudas?
          </span>
          <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-4">
            PREGUNTAS <span className="premium-gradient">FRECUENTES</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="glass rounded-xl border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-white text-sm font-medium pr-6">{faq.q}</span>
                <CaretDown
                  size={16}
                  className={`text-cyan-400 shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
