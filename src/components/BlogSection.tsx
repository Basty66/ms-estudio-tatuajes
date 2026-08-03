import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  ChatCircle,
  X,
  PaperPlaneTilt,
  NotePencil,
  Clock,
  Spinner,
  CheckCircle,
} from "@phosphor-icons/react"

interface Post {
  id: number
  titulo: string
  contenido: string
  imagen_url: string
  tipo: string
  publicado: boolean
  creado_en: string
  likes: number
  comentarios_count: number
}

interface Comentario {
  id: number
  publicacion_id: number
  nombre: string
  texto: string
  creado_en: string
}

const tipoConfig: Record<string, { label: string; color: string }> = {
  post: { label: "Post", color: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30" },
  promocion: { label: "Oferta", color: "bg-amber-400/20 text-amber-400 border-amber-400/30" },
  evento: { label: "Evento", color: "bg-green-400/20 text-green-400 border-green-400/30" },
  aviso: { label: "Aviso", color: "bg-red-400/20 text-red-400 border-red-400/30" },
}

const easeOut = [0.23, 1, 0.32, 1] as const

export default function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Post | null>(null)
  const [likesData, setLikesData] = useState<Record<number, { count: number; liked: boolean }>>({})
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loadingComentarios, setLoadingComentarios] = useState(false)
  const [comNombre, setComNombre] = useState("")
  const [comTexto, setComTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [comExito, setComExito] = useState(false)

  useEffect(() => {
    fetch("/api/admin/publicaciones")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPosts(data.posts || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchLikes = useCallback(async (publicacionId: number) => {
    try {
      const res = await fetch(`/api/publicacion-likes?publicacion_id=${publicacionId}`)
      const data = await res.json()
      if (data.success) {
        setLikesData((prev) => ({ ...prev, [publicacionId]: { count: data.count, liked: data.liked } }))
      }
    } catch {}
  }, [])

  const fetchComentarios = useCallback(async (publicacionId: number) => {
    setLoadingComentarios(true)
    try {
      const res = await fetch(`/api/publicacion-comentarios?publicacion_id=${publicacionId}`)
      const data = await res.json()
      if (data.success) setComentarios(data.comentarios || [])
    } catch {}
    setLoadingComentarios(false)
  }, [])

  const toggleLike = async (publicacionId: number) => {
    try {
      const res = await fetch("/api/publicacion-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicacion_id: publicacionId }),
      })
      const data = await res.json()
      if (data.success) {
        setLikesData((prev) => ({ ...prev, [publicacionId]: { count: data.count, liked: data.liked } }))
        setPosts((prev) => prev.map((p) => p.id === publicacionId ? { ...p, likes: data.count } : p))
      }
    } catch {}
  }

  const enviarComentario = async () => {
    if (!selected || !comNombre.trim() || !comTexto.trim() || enviando) return
    setEnviando(true)
    try {
      const res = await fetch("/api/publicacion-comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicacion_id: selected.id,
          nombre: comNombre.trim(),
          texto: comTexto.trim(),
        }),
      })
      const data = await res.json()
      if (data.success && data.comentario) {
        setComentarios((prev) => [data.comentario, ...prev])
        setPosts((prev) => prev.map((p) => p.id === selected.id ? { ...p, comentarios_count: p.comentarios_count + 1 } : p))
        setComTexto("")
        setComExito(true)
        setTimeout(() => setComExito(false), 2000)
      }
    } catch {}
    setEnviando(false)
  }

  const abrirPost = (post: Post) => {
    setSelected(post)
    setComentarios([])
    setComNombre("")
    setComTexto("")
    setComExito(false)
    fetchLikes(post.id)
    fetchComentarios(post.id)
  }

  if (loading) {
    return (
      <section id="blog" className="relative py-20 md:py-28 overflow-hidden section-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14 animate-pulse">
            <div className="h-3 w-16 bg-white/5 rounded mx-auto mb-3" />
            <div className="h-10 w-56 bg-white/5 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-premium rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-4">
                  <div className="h-3 w-20 bg-white/5 rounded mb-2" />
                  <div className="h-4 w-40 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (posts.length === 0) return null

  return (
    <>
      <section id="blog" className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-dark-200 to-black" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="text-center mb-14"
          >
            <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
              <NotePencil size={14} className="inline mr-2" weight="fill" />
              Blog
            </span>
            <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
              ÚLTIMAS <span className="premium-gradient">PUBLICACIONES</span>
            </h2>
            <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {posts.slice(0, 9).map((post, i) => {
              const cfg = tipoConfig[post.tipo] || tipoConfig.post
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.6, ease: easeOut }}
                  className="glass-premium rounded-2xl overflow-hidden group cursor-pointer"
                  onClick={() => abrirPost(post)}
                >
                  {post.imagen_url ? (
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={post.imagen_url}
                        alt={post.titulo}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className={`absolute top-3 left-3 font-tech text-[10px] tracking-wider px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-sm leading-snug mb-1">{post.titulo}</h3>
                        <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(post.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={11} weight={post.likes > 0 ? "fill" : "regular"} />
                            {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ChatCircle size={11} />
                            {post.comentarios_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <span className={`font-tech text-[10px] tracking-wider px-2.5 py-1 rounded-lg border inline-block mb-3 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <h3 className="text-white font-semibold text-sm mb-2">{post.titulo}</h3>
                      <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">{post.contenido}</p>
                      <div className="flex items-center gap-3 text-gray-600 text-[11px] mt-3 font-tech">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(post.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={11} /> {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ChatCircle size={11} /> {post.comentarios_count || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Modal / Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) setSelected(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="glass rounded-2xl overflow-hidden w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cfg = tipoConfig[selected.tipo] || tipoConfig.post
                    return (
                      <span className={`font-tech text-[10px] tracking-wider px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    )
                  })()}
                  <span className="text-gray-600 text-xs font-tech">
                    {new Date(selected.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} weight="bold" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                {selected.imagen_url && (
                  <img src={selected.imagen_url} alt={selected.titulo} className="w-full object-cover max-h-[50vh]" />
                )}

                <div className="p-4">
                  <h3 className="text-white font-semibold text-base mb-2">{selected.titulo}</h3>
                  {selected.contenido && (
                    <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{selected.contenido}</p>
                  )}

                  {/* Like button */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => toggleLike(selected.id)}
                      className="flex items-center gap-2 transition-colors"
                    >
                      <Heart
                        size={22}
                        weight={likesData[selected.id]?.liked ? "fill" : "regular"}
                        className={likesData[selected.id]?.liked ? "text-red-400" : "text-gray-500 hover:text-red-400"}
                      />
                      <span className="text-sm text-gray-400 font-tech">{likesData[selected.id]?.count || 0}</span>
                    </button>
                    <span className="flex items-center gap-2 text-gray-500">
                      <ChatCircle size={20} />
                      <span className="text-sm font-tech">{comentarios.length}</span>
                    </span>
                  </div>

                  {/* Comments */}
                  <div className="mt-4">
                    <h4 className="font-tech text-xs tracking-wider text-gray-500 uppercase mb-3">Comentarios</h4>
                    {loadingComentarios ? (
                      <div className="flex justify-center py-4">
                        <Spinner size={18} className="text-cyan-400 animate-spin" />
                      </div>
                    ) : comentarios.length === 0 ? (
                      <p className="text-gray-700 text-xs text-center py-4">Sé el primero en comentar</p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {comentarios.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-cyan-400/10 flex items-center justify-center shrink-0">
                              <span className="text-cyan-400 text-[10px] font-bold">{c.nombre.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-white text-xs font-semibold">{c.nombre}</span>
                                <span className="text-gray-700 text-[10px]">
                                  {new Date(c.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{c.texto}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comment form */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        value={comNombre}
                        onChange={(e) => setComNombre(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 transition-all"
                        maxLength={100}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escribí un comentario..."
                        value={comTexto}
                        onChange={(e) => setComTexto(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && enviarComentario()}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 transition-all"
                        maxLength={500}
                      />
                      <button
                        onClick={enviarComentario}
                        disabled={!comNombre.trim() || !comTexto.trim() || enviando}
                        className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/20 transition-all disabled:opacity-30"
                      >
                        {enviando ? <Spinner size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
                      </button>
                    </div>
                    {comExito && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-2 text-green-400 text-xs"
                      >
                        <CheckCircle size={14} weight="fill" /> Comentario publicado
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
