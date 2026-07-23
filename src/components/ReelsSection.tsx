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

function extractInstagramCode(url: string): string | null {
  const m = url.match(/instagram\.com\/reel\/([^/?&#]+)/)
  return m ? m[1] : null
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^/?&#]+)/)
  if (m) return m[1]
  const w = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  return w ? w[1] : null
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

  // Auto-play/pause videos in viewport
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
            const igCode = reel.plataforma === "instagram" ? extractInstagramCode(reel.url) : null
            const ytId = reel.plataforma === "youtube" ? extractYouTubeId(reel.url) : null

            // Thumbnail URL
            let thumbnail: string | null = null
            if (igCode) thumbnail = `https://www.instagram.com/p/${igCode}/media/?size=m`
            else if (ytId) thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`

            return (
              <div key={reel.id} className="snap-start shrink-0" style={{ width: "clamp(200px, 42vw, 280px)" }}>
                <a href={reel.url} target="_blank" rel="noopener noreferrer"
                  className={`block glass rounded-xl overflow-hidden border border-white/5 hover:border-cyan-400/20 transition-all duration-300 group ${hasVideo ? "cursor-default" : "cursor-pointer"}`}
                  onClick={(e) => { if (hasVideo) e.preventDefault() }}
                >
                  <div className="relative aspect-[4/5] bg-black/80 overflow-hidden">
                    {/* MP4 video nativo */}
                    {hasVideo ? (
                      <>
                        <video
                          src={reel.video_url}
                          className="reel-video absolute inset-0 w-full h-full object-cover"
                          muted loop playsInline preload="metadata"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      </>
                    ) : thumbnail ? (
                      /* Thumbnail del reel */
                      <>
                        <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-cyan-400/20 group-hover:scale-110 transition-all"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play size={22} className="text-white ml-0.5" weight="fill" />
                          </motion.div>
                        </div>
                        {igCode && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur">
                            <InstagramLogo size={12} weight="fill" className="text-pink-400" />
                          </div>
                        )}
                        {ytId && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur">
                            <YoutubeLogo size={12} weight="fill" className="text-red-400" />
                          </div>
                        )}
                      </>
                    ) : (
                      /* Sin thumbnail - icono animado */
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-black/90 via-black/70 to-black/90">
                        <motion.div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                          {reel.plataforma === "instagram" && <InstagramLogo size={28} weight="fill" className="text-pink-400" />}
                          {reel.plataforma === "tiktok" && <TiktokLogo size={28} weight="fill" className="text-gray-300" />}
                          {reel.plataforma === "youtube" && <YoutubeLogo size={28} weight="fill" className="text-red-400" />}
                        </motion.div>
                        <div className="flex items-center gap-1.5">
                          <Play size={12} className="text-white/60" weight="fill" />
                          <span className="text-white/50 text-[10px] font-tech tracking-wider uppercase">Ver reel</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${reel.plataforma === "instagram" ? "bg-pink-400" : reel.plataforma === "tiktok" ? "bg-gray-400" : "bg-red-400"}`} />
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-wider truncate">{reel.titulo || reel.plataforma}</span>
                    {!hasVideo && <span className="text-[9px] text-gray-700 font-tech ml-auto">Ver &rarr;</span>}
                    {hasVideo && <span className="text-[9px] text-cyan-400/40 font-tech ml-auto">MP4</span>}
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-center text-gray-700 text-[10px] font-tech tracking-wider mt-3 md:hidden">Desliza para ver más &rarr;</p>
    </div>
  )
}
