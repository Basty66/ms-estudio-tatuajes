import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { InstagramLogo, TiktokLogo, YoutubeLogo, Spinner, Play, CaretLeft, CaretRight } from "@phosphor-icons/react"

function extractReelCode(url: string): string | null {
  const match = url.match(/instagram\.com\/reel\/([^/?&#]+)/)
  return match ? match[1] : null
}

function extractTikTokId(url: string): { user: string; id: string } | null {
  const match = url.match(/tiktok\.com\/@([^/]+)\/video\/(\d+)/)
  return match ? { user: match[1], id: match[2] } : null
}

function extractYouTubeId(url: string): string | null {
  const shortsMatch = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^/?&#]+)/)
  if (shortsMatch) return shortsMatch[1]
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  return watchMatch ? watchMatch[1] : null
}

function getEmbedUrl(reel: { url: string; plataforma: string }): string | null {
  if (reel.plataforma === "instagram") {
    const code = extractReelCode(reel.url)
    return code ? `https://www.instagram.com/reel/${code}/embed/captioned` : null
  }
  if (reel.plataforma === "tiktok") {
    const t = extractTikTokId(reel.url)
    return t ? `https://www.tiktok.com/embed/v2/${t.id}` : null
  }
  if (reel.plataforma === "youtube") {
    const id = extractYouTubeId(reel.url)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  return null
}

interface Reel {
  id: number
  url: string
  titulo: string
  plataforma: string
}

export default function ReelsSection() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => {
        if (data.success) setReels(data.reels || [])
      })
      .catch(e => console.error("Error al cargar reels", e))
      .finally(() => setLoading(false))
  }, [])

  const scrollTo = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[index] as HTMLElement
    if (card) {
      el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" })
      setActiveIndex(index)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} className="text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (reels.length === 0) return null

  const getPlatformIcon = (p: string) => {
    switch (p) {
      case "instagram": return <InstagramLogo size={14} weight="fill" className="text-pink-400" />
      case "tiktok": return <TiktokLogo size={14} weight="fill" className="text-gray-300" />
      case "youtube": return <YoutubeLogo size={14} weight="fill" className="text-red-400" />
      default: return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
          Contenido
        </span>
        <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-3">
          <span className="premium-gradient">REELS</span>
        </h2>
        <p className="text-gray-600 text-xs font-tech tracking-wider max-w-md mx-auto">
          Mira nuestro trabajo en video
        </p>
      </motion.div>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Nav arrows */}
        {reels.length > 3 && (
          <>
            <button
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-cyan-400 hover:border-cyan-400/30 transition-all -ml-3 hidden md:flex"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => scrollTo(Math.min(reels.length - 1, activeIndex + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-cyan-400 hover:border-cyan-400/30 transition-all -mr-3 hidden md:flex"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </>
        )}

        {/* Cards row */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reels.map((reel, i) => {
            const embedUrl = getEmbedUrl(reel)

            return (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="snap-start shrink-0"
                style={{ width: "clamp(260px, 42vw, 340px)" }}
              >
                <div className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-400/20 transition-all duration-300 group">
                  {/* Video container */}
                  <div className="relative aspect-[9/16] bg-black/60 overflow-hidden">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        scrolling="no"
                        loading="lazy"
                        allow="autoplay; encrypted-media"
                      />
                    ) : (
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-black/40 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-400/20 transition-all">
                          <Play size={22} className="text-white" weight="fill" />
                        </div>
                        <span className="text-gray-400 text-[10px] font-tech tracking-wider">VER REEL</span>
                      </a>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2.5 flex items-center gap-2">
                    {getPlatformIcon(reel.plataforma)}
                    <span className="text-[10px] text-gray-500 font-tech uppercase tracking-wider truncate">
                      {reel.plataforma}
                    </span>
                    {reel.titulo && (
                      <span className="text-[11px] text-gray-400 truncate flex-1">{reel.titulo}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
