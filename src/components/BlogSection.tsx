import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { NotePencil, ArrowRight, Clock } from "@phosphor-icons/react"

interface Post {
  id: number
  titulo: string
  contenido: string
  imagen_url: string
  tipo: string
  creado_en: string
}

export default function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/publicaciones")
      .then(r => r.json())
      .then(data => {
        if (data.success) setPosts(data.posts || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (posts.length === 0) return null

  return (
    <section id="blog" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-dark-200 to-black" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
            <NotePencil size={14} className="inline mr-2 text-cyan-400" weight="fill" />
            Blog
          </span>
          <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-4">
            ÚLTIMAS <span className="premium-gradient">PUBLICACIONES</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {posts.slice(0, 5).map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-premium rounded-2xl overflow-hidden border border-white/5"
            >
              <button
                onClick={() => setExpanded(expanded === post.id ? null : post.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-4 p-5">
                  {post.imagen_url && (
                    <img
                      src={post.imagen_url}
                      alt={post.titulo}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className="text-gray-600" />
                      <span className="text-gray-600 text-[10px] font-tech tracking-wider uppercase">
                        {new Date(post.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{post.titulo}</h3>
                    {expanded === post.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-gray-400 text-xs leading-relaxed mt-3"
                      >
                        {post.contenido}
                      </motion.p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-cyan-400/50 text-[10px] font-tech tracking-wider">
                      {expanded === post.id ? "Leer menos" : "Leer más"}
                      <ArrowRight size={10} className={expanded === post.id ? "rotate-90" : ""} />
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
