import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Image,
  X,
  Heart,
  ChatCircle,
  CaretLeft,
  CaretRight,
  PaperPlaneTilt,
  ShareFat,
  Spinner,
  CheckCircle,
  WhatsappLogo,
} from "@phosphor-icons/react"

interface GalleryImage {
  id: number
  imagen_url: string
  estilo: string
  titulo: string
  descripcion: string
  likes: number
  comentarios_count: number
}

interface Comentario {
  id: number
  galeria_id: number
  nombre: string
  texto: string
  creado_en: string
}

const easeOut = [0.23, 1, 0.32, 1] as const

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [estilos, setEstilos] = useState<string[]>([])
  const [filtro, setFiltro] = useState("todos")
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [likesData, setLikesData] = useState<Record<number, { count: number; liked: boolean }>>({})
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loadingCom, setLoadingCom] = useState(false)
  const [comNombre, setComNombre] = useState("")
  const [comTexto, setComTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [comExito, setComExito] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtradas = filtro === "todos" ? images : images.filter((i) => i.estilo === filtro)
  const lightboxImg = lightboxIdx !== null ? filtradas[lightboxIdx] : null
  const heroImages = [...images].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 8)

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.images) {
          setImages(data.images)
          const uniqueStyles = [...new Set(data.images.map((i: GalleryImage) => i.estilo))] as string[]
          setEstilos(uniqueStyles)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Hero carousel auto-advance
  useEffect(() => {
    if (heroImages.length <= 1 || paused) return
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroImages.length, paused])

  // Sync heroIdx scroll
  useEffect(() => {
    if (scrollRef.current) {
      const child = scrollRef.current.children[heroIdx] as HTMLElement
      if (child) child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [heroIdx])

  const fetchLikes = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/galeria-likes?galeria_id=${id}`)
      const data = await res.json()
      if (data.success) {
        setLikesData((prev) => ({ ...prev, [id]: { count: data.count, liked: data.liked } }))
      }
    } catch {}
  }, [])

  const fetchComentarios = useCallback(async (id: number) => {
    setLoadingCom(true)
    try {
      const res = await fetch(`/api/galeria-comentarios?galeria_id=${id}`)
      const data = await res.json()
      if (data.success) setComentarios(data.comentarios || [])
    } catch {}
    setLoadingCom(false)
  }, [])

  const toggleLike = async (id: number) => {
    try {
      const res = await fetch("/api/galeria-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galeria_id: id }),
      })
      const data = await res.json()
      if (data.success) {
        setLikesData((prev) => ({ ...prev, [id]: { count: data.count, liked: data.liked } }))
        setImages((prev) => prev.map((img) => img.id === id ? { ...img, likes: data.count } : img))
      }
    } catch {}
  }

  const enviarComentario = async () => {
    if (!lightboxImg || !comNombre.trim() || !comTexto.trim() || enviando) return
    setEnviando(true)
    try {
      const res = await fetch("/api/galeria-comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galeria_id: lightboxImg.id,
          nombre: comNombre.trim(),
          texto: comTexto.trim(),
        }),
      })
      const data = await res.json()
      if (data.success && data.comentario) {
        setComentarios((prev) => [data.comentario, ...prev])
        setImages((prev) => prev.map((img) => img.id === lightboxImg.id ? { ...img, comentarios_count: img.comentarios_count + 1 } : img))
        setComTexto("")
        setComExito(true)
        setTimeout(() => setComExito(false), 2000)
      }
    } catch {}
    setEnviando(false)
  }

  const abrirLightbox = (idx: number) => {
    setLightboxIdx(idx)
    setComentarios([])
    setComNombre("")
    setComTexto("")
    setComExito(false)
    const img = filtradas[idx]
    if (img) {
      fetchLikes(img.id)
      fetchComentarios(img.id)
    }
  }

  const navigateLightbox = (dir: number) => {
    if (lightboxIdx === null) return
    const next = lightboxIdx + dir
    if (next < 0 || next >= filtradas.length) return
    setLightboxIdx(next)
    setComentarios([])
    setComTexto("")
    setComExito(false)
    const img = filtradas[next]
    if (img) {
      fetchLikes(img.id)
      fetchComentarios(img.id)
    }
  }

  const shareUrl = lightboxImg ? `https://tatuajes-azure.vercel.app/#galeria` : ""
  const shareText = lightboxImg ? `Mirá este tatuaje de ${lightboxImg.titulo || lightboxImg.estilo} en MS Estudio` : ""

  if (loading) {
    return (
      <section id="galeria" className="relative py-20 md:py-28 overflow-hidden section-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 animate-pulse">
            <div className="h-3 w-32 bg-white/5 rounded mx-auto mb-3" />
            <div className="h-10 w-64 bg-white/5 rounded mx-auto" />
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-3 md:mb-4">
                <div className="glass rounded-xl overflow-hidden">
                  <div className="bg-white/5 animate-pulse" style={{ height: `${180 + (i % 3) * 60}px` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (images.length === 0) return null

  return (
    <>
      <section id="galeria" className="relative py-20 md:py-28 overflow-hidden section-dark">
        <div className="ambient-glow-cyan top-1/3 left-0 w-[500px] h-[500px] -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="text-center mb-10"
          >
            <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
              <Image size={14} className="inline mr-2" weight="fill" />
              Nuestro trabajo
            </span>
            <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
              GALERÍA DE <span className="premium-gradient">ESTILOS</span>
            </h2>
            <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
          </motion.div>

          {/* Hero Carousel */}
          {heroImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
              className="mb-12 relative group/carousel"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {heroImages.map((img, i) => (
                  <div
                    key={img.id}
                    className="snap-center shrink-0 w-[85vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] xl:w-[45vw] cursor-pointer"
                    onClick={() => {
                      const realIdx = filtradas.findIndex((f) => f.id === img.id)
                      if (realIdx !== -1) abrirLightbox(realIdx)
                    }}
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] glass-card-dark">
                      <img
                        src={img.imagen_url}
                        alt={img.titulo || img.estilo}
                        className="w-full h-full object-cover"
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-tech text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 capitalize">
                            {img.estilo}
                          </span>
                          {img.likes > 0 && (
                            <span className="flex items-center gap-1 text-red-400 text-[10px] font-tech">
                              <Heart size={10} weight="fill" /> {img.likes}
                            </span>
                          )}
                        </div>
                        {img.titulo && (
                          <h3 className="text-white font-semibold text-base md:text-lg">{img.titulo}</h3>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots */}
              {heroImages.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {heroImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === heroIdx ? "w-6 bg-cyan-400" : "w-1.5 bg-gray-700 hover:bg-gray-500"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Arrows (desktop) */}
              {heroImages.length > 1 && (
                <>
                  <button
                    onClick={() => setHeroIdx((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass border border-white/10 items-center justify-center text-white/50 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <button
                    onClick={() => setHeroIdx((prev) => (prev + 1) % heroImages.length)}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass border border-white/10 items-center justify-center text-white/50 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Filtros */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            <button
              onClick={() => setFiltro("todos")}
              className={`font-tech text-[11px] tracking-wider px-4 py-2 rounded-full transition-all ${
                filtro === "todos"
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              TODOS
            </button>
            {estilos.map((e) => (
              <button
                key={e}
                onClick={() => setFiltro(e)}
                className={`font-tech text-[11px] tracking-wider px-4 py-2 rounded-full transition-all capitalize ${
                  filtro === e
                    ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            {filtradas.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 8) * 0.05, duration: 0.5 }}
                className="break-inside-avoid mb-3 md:mb-4 cursor-pointer group"
                onClick={() => abrirLightbox(i)}
              >
                <div className="relative rounded-xl overflow-hidden glass-card-dark">
                  <img
                    src={img.imagen_url}
                    alt={img.titulo || img.estilo}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-3">
                    <div className="flex-1 min-w-0">
                      {img.titulo && <p className="text-white text-xs font-medium truncate">{img.titulo}</p>}
                      <p className="text-cyan-400/60 text-[10px] font-tech uppercase tracking-wider capitalize">{img.estilo}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] shrink-0">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10} weight={img.likes > 0 ? "fill" : "regular"} className={img.likes > 0 ? "text-red-400" : ""} />
                        {img.likes || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ChatCircle size={10} />
                        {img.comentarios_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onKeyDown={(e) => {
              if (e.key === "Escape") setLightboxIdx(null)
              if (e.key === "ArrowLeft") navigateLightbox(-1)
              if (e.key === "ArrowRight") navigateLightbox(1)
            }}
            tabIndex={0}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              onClick={() => setLightboxIdx(null)}
            >
              <X size={20} weight="bold" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 font-tech text-xs text-gray-500 tracking-wider">
              {lightboxIdx !== null ? `${lightboxIdx + 1} / ${filtradas.length}` : ""}
            </div>

            {/* Nav arrows */}
            {lightboxIdx !== null && lightboxIdx > 0 && (
              <button
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1) }}
              >
                <CaretLeft size={18} weight="bold" />
              </button>
            )}
            {lightboxIdx !== null && lightboxIdx < filtradas.length - 1 && (
              <button
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1) }}
              >
                <CaretRight size={18} weight="bold" />
              </button>
            )}

            {/* Main layout */}
            <div className="flex flex-col lg:flex-row w-full h-full">
              {/* Image */}
              <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-0">
                <motion.img
                  key={lightboxImg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  src={lightboxImg.imagen_url}
                  alt={lightboxImg.titulo}
                  className="max-w-full max-h-[60vh] lg:max-h-[85vh] object-contain rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-80 xl:w-96 glass border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col max-h-[40vh] lg:max-h-full shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                  {lightboxImg.titulo && (
                    <h3 className="text-white font-semibold text-sm mb-1">{lightboxImg.titulo}</h3>
                  )}
                  <p className="text-cyan-400/60 text-[10px] font-tech uppercase tracking-wider capitalize">{lightboxImg.estilo}</p>
                  {lightboxImg.descripcion && (
                    <p className="text-gray-500 text-xs mt-2 leading-relaxed">{lightboxImg.descripcion}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => toggleLike(lightboxImg.id)}
                      className="flex items-center gap-1.5 transition-colors"
                    >
                      <Heart
                        size={18}
                        weight={likesData[lightboxImg.id]?.liked ? "fill" : "regular"}
                        className={likesData[lightboxImg.id]?.liked ? "text-red-400" : "text-gray-500 hover:text-red-400"}
                      />
                      <span className="text-xs text-gray-400 font-tech">{likesData[lightboxImg.id]?.count || 0}</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <ChatCircle size={16} />
                      <span className="text-xs font-tech">{comentarios.length}</span>
                    </span>
                    <div className="flex-1" />
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-all"
                      title="Compartir por WhatsApp"
                    >
                      <WhatsappLogo size={14} weight="fill" />
                    </a>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: lightboxImg.titulo || "MS Estudio", text: shareText, url: shareUrl })
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                      title="Compartir"
                    >
                      <ShareFat size={14} weight="fill" />
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  {loadingCom ? (
                    <div className="flex justify-center py-4">
                      <Spinner size={16} className="text-cyan-400 animate-spin" />
                    </div>
                  ) : comentarios.length === 0 ? (
                    <p className="text-gray-700 text-xs text-center py-4">Sé el primero en comentar</p>
                  ) : (
                    <div className="space-y-3">
                      {comentarios.map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-cyan-400/10 flex items-center justify-center shrink-0">
                            <span className="text-cyan-400 text-[9px] font-bold">{c.nombre.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-white text-xs font-semibold">{c.nombre}</span>
                              <span className="text-gray-700 text-[9px]">
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
                <div className="p-3 border-t border-white/5">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={comNombre}
                      onChange={(e) => setComNombre(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 transition-all"
                      maxLength={100}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Comentario..."
                      value={comTexto}
                      onChange={(e) => setComTexto(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && enviarComentario()}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 transition-all"
                      maxLength={500}
                    />
                    <button
                      onClick={enviarComentario}
                      disabled={!comNombre.trim() || !comTexto.trim() || enviando}
                      className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/20 transition-all disabled:opacity-30 shrink-0"
                    >
                      {enviando ? <Spinner size={12} className="animate-spin" /> : <PaperPlaneTilt size={12} weight="fill" />}
                    </button>
                  </div>
                  {comExito && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 text-green-400 text-[10px]"
                    >
                      <CheckCircle size={11} weight="fill" /> Comentario publicado
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
