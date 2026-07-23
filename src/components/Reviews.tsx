import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, GoogleLogo } from "@phosphor-icons/react"

interface Resena {
  id: number
  autor: string
  texto: string
  rating: number
  fuente: string
}

const easeOut = [0.23, 1, 0.32, 1] as const

export default function Reviews() {
  const [resenas, setResenas] = useState<Resena[]>([])

  useEffect(() => {
    fetch("/api/resenas")
      .then((r) => r.json())
      .then((data) => { if (data.success) setResenas(data.resenas) })
      .catch(() => {})
  }, [])

  if (resenas.length === 0) return null

  return (
    <section id="reviews" className="relative py-20 md:py-32 overflow-hidden">
      <div className="ambient-glow top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-16"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            Lo que dicen nuestros clientes
          </span>
          <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
            RESEÑAS DE
            <br />
            <span className="premium-gradient">GOOGLE</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {resenas.slice(0, 6).map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: easeOut }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      weight={j < r.rating ? "fill" : "regular"}
                      className={j < r.rating ? "text-yellow-400" : "text-gray-700"}
                    />
                  ))}
                </div>
                <GoogleLogo size={16} className="text-gray-600" weight="fill" />
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{r.texto}</p>
              <p className="font-tech text-xs tracking-[0.15em] text-gray-500">{r.autor}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
