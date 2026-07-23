import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { InstagramLogo, TiktokLogo, YoutubeLogo, Spinner, Play, CaretLeft, CaretRight } from "@phosphor-icons/react"

interface Reel {
  id: number
  url: string
  titulo: string
  plataforma: string
  video_url?: string
}

export default function ReelsSection() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const activeVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => { if (data.success) setReels(data.reels || []) })
      .catch(e => console.error("Error al cargar reels", e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            if (activeVideoRef.current && activeVideoRef.current !== video) {
              activeVideoRef.current.pause()
            }
            video.play().catch(() => {})
            activeVideoRef.current = video
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.6 }
    )
    document.querySelectorAll(".reel-video").forEach(v => observerRef.current?.observe(v))
    return () => observerRef.current?.disconnect()
  }, [reels])

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" })
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size={28} className="text-cyan-400 animate-spin" /></div>
  if (reels.length === 0) return null

  const igCode = (url: string) => { const m = url.match(/instagram\.com\/reel\/([^/?&#]+)/); return m ? m[1] : null }
  const ytId = (url: string) => { const m = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^/?&#]+)/); if (m) return m[1]; const w = url.match(/youtube\.com\/watch\?v=([^&]+)/); return w ? w[1] : null }

  const platformGradient = (p: string) => {
    switch (p) {
      case "instagram": return "from-pink-500/10 via-purple-500/5 to-amber-500/10"
      case "tiktok": return "from-gray-400/10 via-cyan-400/5 to-red-400/10"
      case "youtube": return "from-red-500/10 via-red-600/5 to-black"
      default: return "from-cyan-400/10 to-black"
    }
  }

  const platformIcon = (p: string) => {
    switch (p) {
      case "instagram": return <InstagramLogo size={28} weight="fill" className="text-pink-400" />
      case "tiktok": return <TiktokLogo size={28} weight="fill" className="text-gray-200" />
      case "youtube": return <YoutubeLogo size={28} weight="fill" className="text-red-400" />
      default: return <Play size={28} weight="fill" className="text-cyan-400" />
    }
  }

  const platformRing = (p: string) => {
    switch (p) {
      case "instagram": return "border-pink-400/30"
      case "tiktok": return "border-white/20"
      case "youtube": return "border-red-400/30"
      default: return "border-cyan-400/30"
    }
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

        <div ref={scrollRef} className="flex gap-2.5 md:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {reels.map((reel) => {
            const hasVideo = !!(reel.video_url && reel.video_url.length > 0)

            return (
              <div key={reel.id} className="snap-start shrink-0" style={{ width: "clamp(200px, 42vw, 280px)" }}>
                <a href={reel.url} target="_blank" rel="noopener noreferrer"
                  className={`block glass rounded-xl overflow-hidden border border-white/5 hover:border-cyan-400/20 transition-all duration-300 group`}
                  onClick={(e) => { if (hasVideo) e.preventDefault() }}
                >
                  {/* Preview */}
                  <div className={`relative aspect-[4/5] bg-black/90 overflow-hidden`}>
                    {hasVideo ? (
                      /* MP4 nativo */
                      <>
                        <video
                          src={reel.video_url}
                          className="reel-video absolute inset-0 w-full h-full object-cover"
                          muted loop playsInline preload="metadata"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      </>
                    ) : igCode(reel.url) ? (
                      /* Instagram thumbnail via proxy */
                      <div className="absolute inset-0">
                        <img
                          src={`/api/instagram-thumb?code=${igCode(reel.url)}`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="w-14 h-14 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center group-hover:bg-cyan-400/20 group-hover:scale-110 transition-all"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play size={20} className="text-white ml-0.5" weight="fill" />
                          </motion.div>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
                          <InstagramLogo size={12} weight="fill" className="text-pink-400" />
                          <span className="text-white/60 text-[9px] font-tech">IG</span>
                        </div>
                      </div>
                    ) : ytId(reel.url) ? (
                      /* YouTube thumbnail */
                      <div className="absolute inset-0">
                        <img
                          src={`https://img.youtube.com/vi/${ytId(reel.url)}/hqdefault.jpg`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="w-14 h-14 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center group-hover:bg-red-400/20 group-hover:scale-110 transition-all"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play size={20} className="text-white ml-0.5" weight="fill" />
                          </motion.div>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
                          <YoutubeLogo size={12} weight="fill" className="text-red-400" />
                          <span className="text-white/60 text-[9px] font-tech">YT</span>
                        </div>
                      </div>
                    ) : (
                      /* Card animada con gradiente de plataforma */
                      <div className={`absolute inset-0 bg-gradient-to-br ${platformGradient(reel.plataforma)}`}>
                        {/* Animated rings */}
                        <motion.div
                          className={`absolute inset-4 rounded-full border ${platformRing(reel.plataforma)} opacity-20`}
                          animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.15, 0.25, 0.15] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className={`absolute inset-8 rounded-full border ${platformRing(reel.plataforma)} opacity-10`}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />

                        {/* Icon + play */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                          <motion.div
                            className={`w-16 h-16 rounded-full bg-black/40 backdrop-blur border ${platformRing(reel.plataforma)} flex items-center justify-center`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {platformIcon(reel.plataforma)}
                          </motion.div>
                          <div className="flex items-center gap-2">
                            <Play size={12} className="text-white/50" weight="fill" />
                            <span className="text-white/40 text-[10px] font-tech tracking-wider uppercase">
                              Ver reel
                            </span>
                          </div>
                        </div>

                        {/* Shimmer bar */}
                        <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent rounded-full"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${reel.plataforma === "instagram" ? "bg-pink-400" : reel.plataforma === "tiktok" ? "bg-gray-400" : "bg-red-400"}`} />
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-wider truncate">{reel.titulo || reel.plataforma}</span>
                    <span className="text-[9px] text-gray-700 font-tech ml-auto">{hasVideo ? "MP4" : "Ver →"}</span>
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-center text-gray-700 text-[10px] font-tech tracking-wider mt-3 md:hidden">Desliza para ver más →</p>
    </div>
  )
}
