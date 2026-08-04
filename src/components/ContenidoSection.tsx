import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  NotePencil,
  InstagramLogo,
  Heart,
  ChatCircle,
  X,
  PaperPlaneTilt,
  Clock,
  Spinner,
  CheckCircle,
  Play,
  SpeakerHigh,
  SpeakerX,
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react"

const easeOut = [0.23, 1, 0.32, 1] as const

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

interface Reel {
  id: number
  url: string
  titulo: string
  plataforma: string
  video_url?: string
}

const tipoConfig: Record<string, { label: string; color: string }> = {
  post: { label: "Post", color: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30" },
  promocion: { label: "Oferta", color: "bg-amber-400/20 text-amber-400 border-amber-400/30" },
  evento: { label: "Evento", color: "bg-green-400/20 text-green-400 border-green-400/30" },
  aviso: { label: "Aviso", color: "bg-red-400/20 text-red-400 border-red-400/30" },
}

const tabs = [
  { id: "reels", label: "Reels", icon: Play },
  { id: "blog", label: "Blog", icon: NotePencil },
  { id: "instagram", label: "Instagram", icon: InstagramLogo },
]

/* ─── Blog Tab ─── */
function BlogTab() {
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
      .then((data) => { if (data.success) setPosts(data.posts || []) })
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
        body: JSON.stringify({ publicacion_id: selected.id, nombre: comNombre.trim(), texto: comTexto.trim() }),
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
    )
  }

  if (posts.length === 0) {
    return <p className="text-gray-700 text-sm text-center py-10 font-tech tracking-wider">No hay publicaciones aún</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.slice(0, 9).map((post, i) => {
          const cfg = tipoConfig[post.tipo] || tipoConfig.post
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: easeOut }}
              className="glass-premium rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => abrirPost(post)}
            >
              {post.imagen_url ? (
                <div className="relative aspect-square overflow-hidden">
                  <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className={`absolute top-3 left-3 font-tech text-[10px] tracking-wider px-2.5 py-1 rounded-lg border ${cfg.color}`}>{cfg.label}</span>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-sm leading-snug mb-1">{post.titulo}</h3>
                    <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(post.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
                      <span className="flex items-center gap-1"><Heart size={11} weight={post.likes > 0 ? "fill" : "regular"} />{post.likes || 0}</span>
                      <span className="flex items-center gap-1"><ChatCircle size={11} />{post.comentarios_count || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <span className={`font-tech text-[10px] tracking-wider px-2.5 py-1 rounded-lg border inline-block mb-3 ${cfg.color}`}>{cfg.label}</span>
                  <h3 className="text-white font-semibold text-sm mb-2">{post.titulo}</h3>
                  <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">{post.contenido}</p>
                  <div className="flex items-center gap-3 text-gray-600 text-[11px] mt-3 font-tech">
                    <span className="flex items-center gap-1"><Clock size={11} />{new Date(post.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
                    <span className="flex items-center gap-1"><Heart size={11} /> {post.likes || 0}</span>
                    <span className="flex items-center gap-1"><ChatCircle size={11} /> {post.comentarios_count || 0}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

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
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {(() => { const cfg = tipoConfig[selected.tipo] || tipoConfig.post; return <span className={`font-tech text-[10px] tracking-wider px-2.5 py-1 rounded-lg border ${cfg.color}`}>{cfg.label}</span> })()}
                  <span className="text-gray-600 text-xs font-tech">{new Date(selected.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition-colors"><X size={20} weight="bold" /></button>
              </div>
              <div className="overflow-y-auto flex-1">
                {selected.imagen_url && <img src={selected.imagen_url} alt={selected.titulo} className="w-full object-cover max-h-[50vh]" />}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-base mb-2">{selected.titulo}</h3>
                  {selected.contenido && <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{selected.contenido}</p>}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                    <button onClick={() => toggleLike(selected.id)} className="flex items-center gap-2 transition-colors">
                      <Heart size={22} weight={likesData[selected.id]?.liked ? "fill" : "regular"} className={likesData[selected.id]?.liked ? "text-red-400" : "text-gray-500 hover:text-red-400"} />
                      <span className="text-sm text-gray-400 font-tech">{likesData[selected.id]?.count || 0}</span>
                    </button>
                    <span className="flex items-center gap-2 text-gray-500"><ChatCircle size={20} /><span className="text-sm font-tech">{comentarios.length}</span></span>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-tech text-xs tracking-wider text-gray-500 uppercase mb-3">Comentarios</h4>
                    {loadingComentarios ? (
                      <div className="flex justify-center py-4"><Spinner size={18} className="text-cyan-400 animate-spin" /></div>
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
                                <span className="text-gray-700 text-[10px]">{new Date(c.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
                              </div>
                              <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{c.texto}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Tu nombre" value={comNombre} onChange={(e) => setComNombre(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 transition-all" maxLength={100} />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Escribí un comentario..." value={comTexto} onChange={(e) => setComTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarComentario()} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 transition-all" maxLength={500} />
                      <button onClick={enviarComentario} disabled={!comNombre.trim() || !comTexto.trim() || enviando} className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/20 transition-all disabled:opacity-30">
                        {enviando ? <Spinner size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
                      </button>
                    </div>
                    {comExito && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-2 text-green-400 text-xs">
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

/* ─── Reels Tab ─── */
function ReelsTab() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => { if (data.success) setReels(data.reels || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setCanLeft(el.scrollLeft > 4)
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    const t = setTimeout(update, 400)
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); clearTimeout(t) }
  }, [reels.length])

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector("[data-reel-card]") as HTMLElement | null
    const step = card ? card.offsetWidth + 12 : 300
    el.scrollBy({ left: dir * step, behavior: "smooth" })
  }

  if (loading) return <div className="flex items-center justify-center py-10"><Spinner size={28} className="text-cyan-400 animate-spin" /></div>
  if (reels.length === 0) return <p className="text-gray-700 text-sm text-center py-10 font-tech tracking-wider">No hay reels aún</p>

  const videoReels = reels.filter(r => r.video_url && r.video_url.length > 0)
  const linkReels = reels.filter(r => !r.video_url || r.video_url.length === 0)

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 px-1" ref={scrollRef} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {[...videoReels, ...linkReels].map(reel =>
          reel.video_url && reel.video_url.length > 0 ? (
            <VideoCard key={reel.id} reel={reel} />
          ) : (
            <LinkCard key={reel.id} reel={reel} />
          )
        )}
      </div>
      <button onClick={() => scrollByCard(-1)} disabled={!canLeft} className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full glass-premium border border-white/10 items-center justify-center text-white/80 hover:text-cyan-400 hover:border-cyan-400/40 transition-all ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <CaretLeft size={18} weight="bold" />
      </button>
      <button onClick={() => scrollByCard(1)} disabled={!canRight} className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-10 h-10 rounded-full glass-premium border border-white/10 items-center justify-center text-white/80 hover:text-cyan-400 hover:border-cyan-400/40 transition-all ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <CaretRight size={18} weight="bold" />
      </button>
      <p className="text-center text-gray-700 text-[10px] font-tech tracking-wider mt-3 md:hidden">Desliza para ver más →</p>
    </div>
  )
}

function VideoCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(!muted)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play().catch(() => {}); setPlaying(true) }
    else { video.pause(); video.currentTime = 0; setPlaying(false) }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onHover = () => { video.play().catch(() => {}); setPlaying(true) }
    const onLeave = () => { video.pause(); video.currentTime = 0; setPlaying(false) }
    video.addEventListener("mouseenter", onHover)
    video.addEventListener("mouseleave", onLeave)
    return () => { video.removeEventListener("mouseenter", onHover); video.removeEventListener("mouseleave", onLeave) }
  }, [])

  return (
    <div className="snap-start shrink-0 w-[260px] md:w-[300px] data-reel-card">
      <div className="relative rounded-2xl overflow-hidden border border-white/5 group bg-black aspect-[9/16]">
        <video ref={videoRef} src={reel.video_url} muted={muted} loop playsInline preload="metadata" onClick={togglePlay} className="w-full h-full object-contain cursor-pointer" />
        <div className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${playing ? "opacity-0" : "opacity-100"}`}>
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center"><Play size={16} className="text-white ml-0.5" weight="fill" /></div>
        </div>
        <a href={reel.url} target="_blank" rel="noopener noreferrer" className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center gap-1 hover:border-pink-400/40 hover:text-pink-400 transition-all z-10">
          <InstagramLogo size={11} weight="fill" className="text-pink-400" />
          <span className="text-white/70 text-[9px] font-tech">Instagram</span>
        </a>
        <button onClick={toggleMute} className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-white/70 hover:text-cyan-400 hover:border-cyan-400/30 transition-all opacity-60 hover:opacity-100 group-hover:opacity-100">
          {muted ? <SpeakerX size={14} weight="fill" /> : <SpeakerHigh size={14} weight="fill" />}
        </button>
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {reel.titulo ? <p className="text-white/70 text-[10px] font-tech tracking-wider truncate drop-shadow">{reel.titulo}</p> : <span />}
          <a href={reel.url} target="_blank" rel="noopener noreferrer" className="pointer-events-auto shrink-0 px-2 py-1 rounded-full bg-pink-500/15 border border-pink-400/20 backdrop-blur flex items-center gap-1 text-pink-300 text-[9px] font-tech tracking-wider hover:bg-pink-500/25 transition-all">
            Ver en IG <ArrowSquareOut size={9} />
          </a>
        </div>
      </div>
    </div>
  )
}

function LinkCard({ reel }: { reel: Reel }) {
  const igCode = reel.url.match(/instagram\.com\/(?:reel|p)\/([^/?&#]+)/)?.[1]
  const ytCode = reel.url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^/?&#]+)/)?.[1] || reel.url.match(/youtube\.com\/watch\?v=([^&]+)/)?.[1]

  return (
    <div className="snap-start shrink-0 w-[260px] md:w-[300px] data-reel-card">
      <a href={reel.url} target="_blank" rel="noopener noreferrer" className="relative block rounded-2xl overflow-hidden border border-white/5 group bg-black aspect-[9/16]">
        {ytCode ? (
          <img src={`https://img.youtube.com/vi/${ytCode}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${igCode ? "from-pink-500/10 via-transparent to-amber-500/10" : "from-gray-400/10 via-cyan-400/5 to-red-400/10"}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-400/30 transition-all">
            <Play size={16} className="text-white ml-0.5" weight="fill" />
          </div>
        </div>
        {igCode && (
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
            <InstagramLogo size={11} weight="fill" className="text-pink-400" />
            <span className="text-white/60 text-[9px] font-tech">Reel</span>
          </div>
        )}
        {ytCode && (
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
            <Play size={10} className="text-red-400" weight="fill" />
            <span className="text-white/60 text-[9px] font-tech">YouTube</span>
          </div>
        )}
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center">
          <span className="text-white/60 text-[9px] font-tech tracking-wider flex items-center gap-1">Ver en la plataforma <ArrowSquareOut size={10} /></span>
        </div>
        {reel.titulo && <div className="absolute bottom-8 left-2.5 right-2.5"><p className="text-white/70 text-[10px] font-tech tracking-wider truncate">{reel.titulo}</p></div>}
      </a>
    </div>
  )
}

/* ─── Instagram Tab ─── */
function InstagramTab() {
  return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 via-amber-500/10 to-purple-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <InstagramLogo size={28} weight="fill" className="text-pink-400" />
      </div>
      <p className="text-gray-400 text-sm mb-4">Seguinos en Instagram para ver todo nuestro trabajo</p>
      <a
        href="https://instagram.com/matness_tattoos"
        target="_blank"
        rel="noopener noreferrer"
        className="font-tech inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-500/10 border border-pink-400/30 text-pink-400 text-sm tracking-[0.15em] hover:bg-pink-500/20 hover:border-pink-400/50 transition-all"
      >
        <InstagramLogo size={18} weight="fill" />
        @MATNESS_TATTOOS
      </a>
    </div>
  )
}

/* ─── Main Component ─── */
export default function ContenidoSection() {
  const [activeTab, setActiveTab] = useState("reels")

  return (
    <section id="contenido" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-dark-200 to-black" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-10"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            <NotePencil size={14} className="inline mr-2" weight="fill" />
            Contenido
          </span>
          <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
            NUESTRO <span className="premium-gradient">CONTENIDO</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-tech flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs tracking-[0.15em] uppercase transition-all duration-300 border ${
                  activeTab === tab.id
                    ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400"
                    : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon size={14} weight={activeTab === tab.id ? "fill" : "regular"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            {activeTab === "blog" && <BlogTab />}
            {activeTab === "reels" && <ReelsTab />}
            {activeTab === "instagram" && <InstagramTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
