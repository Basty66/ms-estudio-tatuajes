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

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => {
        if (data.success) setReels(data.reels || [])
      })
      .catch(e => console.error("Error al cargar reels", e))
      .finally(() => setLoading(false))
  }, [])

  // Auto-play videos when they enter viewport
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
            video.currentTime = 0
          }
        })
      },
      { threshold: 0.6 }
    )

    const videos = document.querySelectorAll(".reel-video")
    videos.forEach(v => observerRef.current?.observe(v))
    return () => observerRef.current?.disconnect()
  }, [reels])

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} className="text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (reels.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-8"
      >
        <span className="font-tech text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Contenido</span>
        <h2 className="section-title text-3xl md:text-5xl text-white mt-2 mb-2">
          <span className="premium-gradient">REELS</span>
        </h2>
      </motion.div>

      <div className="relative">
        {reels.length > 3 && (
          <>
            <button onClick={() => scrollBy("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all -ml-1 hidden md:flex">
              <CaretLeft size={12} weight="bold" />
            </button>
            <button onClick={() => scrollBy("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all -mr-1 hidden md:flex">
              <CaretRight size={12} weight="bold" />
            </button>
          </>
        )}

        <div ref={scrollRef} className="flex gap-2.5 md:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {reels.map((reel) => {
            const hasVideo = !!(reel.video_url && reel.video_url.length > 0)

            return (
              <div key={reel.id} className="snap-start shrink-0" style={{ width: "clamp(160px, 40vw, 240px)" }}>
                <div className="glass rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 group">
                  
                  {/* Preview */}
                  <div className="relative aspect-[4/5] bg-black/60 overflow-hidden">
                    {hasVideo ? (
                      <>
                        <video
                          src={reel.video_url}
                          className="reel-video absolute inset-0 w-full h-full object-cover"
                          muted loop playsInline preload="metadata"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-black/80 via-black/60 to-black/80">
                        <motion.div
                          className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {reel.plataforma === "instagram" && <InstagramLogo size={28} weight="fill" className="text-pink-400" />}
                          {reel.plataforma === "tiktok" && <TiktokLogo size={28} weight="fill" className="text-gray-300" />}
                          {reel.plataforma === "youtube" && <YoutubeLogo size={28} weight="fill" className="text-red-400" />}
                        </motion.div>
                        <div className="flex items-center gap-1.5">
                          <Play size={12} className="text-white/60" weight="fill" />
                          <span className="text-white/50 text-[10px] font-tech tracking-wider uppercase">
                            {reel.titulo || `Ver en ${reel.plataforma}`}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-cyan-400/60 to-cyan-400/20 rounded-full w-1/3"
                              animate={{ x: ["-100%", "300%"] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hover overlay with play button */}
                    <a
                      href={hasVideo ? (reel.url || "#") : reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/0 group-hover:bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                        <Play size={18} className="text-white ml-0.5" weight="fill" />
                      </div>
                      {!hasVideo && (
                        <span className="absolute bottom-3 text-[9px] text-white/40 font-tech tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          ABRIR EN {reel.plataforma.toUpperCase()}
                        </span>
                      )}
                    </a>
                  </div>

                  {/* Label */}
                  <div className="px-2.5 py-1.5 flex items-center gap-1">
                    <span className="text-[9px] text-gray-600 font-tech uppercase tracking-wider truncate">
                      {reel.titulo || reel.plataforma}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Swipe hint on mobile */}
      <p className="text-center text-gray-700 text-[10px] font-tech tracking-wider mt-3 md:hidden">
        Desliza para ver más &rarr;
      </p>
    </div>
  )
}
