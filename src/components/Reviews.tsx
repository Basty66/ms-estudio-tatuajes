import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, GoogleLogo, Quotes } from "@phosphor-icons/react"
import TestimonioForm from "./TestimonioForm"

interface Resena {
  id: number
  autor: string
  texto: string
  rating: number
  fuente: string
}

interface Testimonio {
  id: number
  nombre: string
  texto: string
  rating: number
  aprobado: boolean
  creado_en: string
}

const easeOut = [0.23, 1, 0.32, 1] as const

export default function Reviews() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [testimonios, setTestimonios] = useState<Testimonio[]>([])

  const fetchData = () => {
    fetch("/api/resenas")
      .then((r) => r.json())
      .then((data) => { if (data.success) setResenas(data.resenas) })
      .catch(() => {})

    fetch("/api/testimonios")
      .then((r) => r.json())
      .then((data) => { if (data.success) setTestimonios(data.testimonios) })
      .catch(() => {})
  }

  useEffect(() => { fetchData() }, [])

  if (resenas.length === 0 && testimonios.length === 0) return null

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
            RESEÑAS Y
            <br />
            <span className="premium-gradient">TESTIMONIOS</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        {/* Reseñas de Google */}
        {resenas.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <GoogleLogo size={20} className="text-gray-500" weight="fill" />
              <h3 className="font-tech text-sm tracking-[0.2em] text-gray-400 uppercase">
                Reseñas de Google
              </h3>
            </div>
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
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{r.texto}</p>
                  <p className="font-tech text-xs tracking-[0.15em] text-gray-500">{r.autor}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonios de clientes */}
        {testimonios.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Quotes size={20} className="text-cyan-400" weight="fill" />
              <h3 className="font-tech text-sm tracking-[0.2em] text-gray-400 uppercase">
                Testimonios de clientes
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonios.slice(0, 6).map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: easeOut }}
                  className="glass-card rounded-2xl p-6 border border-cyan-400/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={14}
                          weight={j < t.rating ? "fill" : "regular"}
                          className={j < t.rating ? "text-yellow-400" : "text-gray-700"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{t.texto}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-tech text-xs tracking-[0.15em] text-cyan-400/70">{t.nombre}</p>
                    <p className="text-gray-700 text-[10px]">
                      {new Date(t.creado_en).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de testimonio */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="max-w-lg mx-auto"
        >
          <TestimonioForm onSubmitted={fetchData} />
        </motion.div>
      </div>
    </section>
  )
}
