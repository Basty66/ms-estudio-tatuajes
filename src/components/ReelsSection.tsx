import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { InstagramLogo, TiktokLogo, Spinner, Play, CaretLeft, CaretRight } from "@phosphor-icons/react"

interface Reel {
  id: number
  url: string
  titulo: string
  plataforma: string
  video_url?: string
}

function extractYT(url: string) {
  const m = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^/?&#]+)/)
  if (m) return m[1]
  const w = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  return w ? w[1] : null
}

function extractIG(url: string) {
  const m = url.match(/instagram\.com\/reel\/([^/?&#]+)/)
  return m ? m[1] : null
}

export default function ReelsSection() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIg, setExpandedIg] = useState<Set<number>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const activeVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => { if (data.success) setReels(data.reels || []) })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  // Process Instagram embeds when expanded
  useEffect(() => {
    if (expandedIg.size > 0) {
      const script = document.createElement("script")
      script.src = "//www.instagram.com/embed.js"
      script.async = true
      document.body.appendChild(script)
      return () => { script.remove() }
    }
  }, [expandedIg])

  // Auto-play MP4 in viewport
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement
        if (entry.isIntersecting) {
          if (activeVideoRef.current && activeVideoRef.current !== video) activeVideoRef.current.pause()
          video.play().catch(() => {})
          activeVideoRef.current = video
        } else { video.pause() }
      })
    }, { threshold: 0.6 })
    document.querySelectorAll(".reel-video").forEach(v => observerRef.current?.observe(v))
    return () => observerRef.current?.disconnect()
  }, [reels, expandedIg])

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" })
  }

  const toggleIg = (id: number) => {
    setExpandedIg(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        next.clear()
        next.add(id)
      }
      return next
    })
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size={28} className="text-cyan-400 animate-spin" /></div>
  if (reels.length === 0) return null

  const renderCard = (reel: Reel) => {
    const hasVideo = !!(reel.video_url && reel.video_url.length > 0)
    const ytCode = extractYT(reel.url)
    const isExpanded = expandedIg.has(reel.id)

    return (
      <div key={reel.id} className="snap-start shrink-0" style={isExpanded ? { width: "min(90vw, 540px)" } : { width: "clamp(260px, 50vw, 340px)" }}>
        <div className="glass rounded-xl overflow-hidden border border-white/5 hover:border-cyan-400/20 transition-all duration-300">
          
          {/* Preview / Embed */}
          <div className={`relative bg-black/90 overflow-hidden ${isExpanded ? "aspect-auto min-h-[500px]" : "aspect-[4/5]"}`}>
            {hasVideo ? (
              <video src={reel.video_url} className="reel-video absolute inset-0 w-full h-full object-cover" muted loop playsInline preload="metadata" />
            ) : reel.plataforma === "instagram" ? (
              isExpanded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <blockquote
                    className="instagram-media w-full max-w-[540px]"
                    data-instgrm-permalink={reel.url}
                    data-instgrm-version="14"
                    style={{ background: "#000", border: 0, margin: 0 }}
                  />
                </div>
              ) : (
                /* Preview card con thumbnail de Instagram */
                <div className="absolute inset-0 cursor-pointer" onClick={() => toggleIg(reel.id)}>
                  {/* Thumbnail via proxy */}
                  {(() => {
                    const igCode = extractIG(reel.url)
                    if (igCode) {
                      return (
                        <img
                          src={`/api/instagram-thumb?code=${igCode}`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => (e.target as HTMLImageElement).style.display = "none"}
                        />
                      )
                    }
                    return null
                  })()}
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Play size={20} className="text-white ml-0.5" weight="fill" />
                    </motion.div>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
                    <InstagramLogo size={12} weight="fill" className="text-pink-400" />
                    <span className="text-white/60 text-[9px] font-tech">Reel</span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white/50 text-[10px] font-tech tracking-wider">
                    Tocar para expandir
                  </div>
                </div>
              )
            ) : reel.plataforma === "youtube" && ytCode ? (
              <a href={reel.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
                <img src={`https://img.youtube.com/vi/${ytCode}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center">
                    <Play size={20} className="text-white ml-0.5" weight="fill" />
                  </div>
                </div>
              </a>
            ) : (
              <a href={reel.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-gradient-to-br from-gray-400/10 via-cyan-400/5 to-red-400/10 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center">
                  <TiktokLogo size={28} weight="fill" className="text-gray-200" />
                </div>
                <span className="text-white/40 text-[10px] font-tech tracking-wider uppercase">Ver en {reel.plataforma}</span>
              </a>
            )}
          </div>

          {/* Label */}
          <div className="px-3 py-2 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${reel.plataforma === "instagram" ? "bg-pink-400" : reel.plataforma === "tiktok" ? "bg-gray-400" : "bg-red-400"}`} />
            <span className="text-[10px] text-gray-500 font-tech uppercase tracking-wider truncate flex-1">{reel.titulo || reel.plataforma}</span>
            {isExpanded && (
              <button onClick={() => toggleIg(reel.id)} className="text-[10px] text-gray-600 font-tech hover:text-white transition-colors">
                CERRAR
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-6 md:mb-8">
        <span className="font-tech text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Contenido</span>
        <h2 className="section-title text-3xl md:text-5xl text-white mt-2 mb-2"><span className="premium-gradient">REELS</span></h2>
      </motion.div>

      <div className="relative">
        {reels.length > 3 && (
          <>
            <button onClick={() => scrollBy("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all -ml-1 hidden md:flex">
              <CaretLeft size={12} weight="bold" />
            </button>
            <button onClick={() => scrollBy("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all -mr-1 hidden md:flex">
              <CaretRight size={12} weight="bold" />
            </button>
          </>
        )}

        <div ref={scrollRef} className="flex gap-2.5 md:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {reels.map(renderCard)}
        </div>
      </div>

      <p className="text-center text-gray-700 text-[10px] font-tech tracking-wider mt-3 md:hidden">Desliza para ver más →</p>
    </div>
  )
}
