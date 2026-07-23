import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { InstagramLogo, TiktokLogo, YoutubeLogo, Spinner } from "@phosphor-icons/react"

function extractReelCode(url: string): string | null {
  const match = url.match(/instagram\.com\/reel\/([^/?&#]+)/)
  return match ? match[1] : null
}

function extractTikTokId(url: string): { user: string; id: string } | null {
  const match = url.match(/tiktok\.com\/@([^/]+)\/video\/(\d+)/)
  return match ? { user: match[1], id: match[2] } : null
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([^/?&#]+)/)
  if (match) return match[1]
  const match2 = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  return match2 ? match2[1] : null
}

function getEmbedUrl(reel: { url: string; plataforma: string }): string | null {
  if (reel.plataforma === "instagram") {
    const code = extractReelCode(reel.url)
    return code ? `https://www.instagram.com/reel/${code}/embed/captioned` : null
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
  activo: boolean
  orden: number
  creado_en: string
}

export default function ReelsSection() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => {
        if (data.success) setReels(data.reels || [])
      })
      .catch(e => console.error("Error al cargar reels", e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (reels.length > 0) {
      ;(window as any).instgrm?.Embeds?.process()
      ;(window as any).tiktokEmbed?.load()
    }
  }, [reels])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} className="text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (reels.length === 0) return null

  const getPlatformIcon = (plataforma: string) => {
    switch (plataforma) {
      case "instagram": return <InstagramLogo size={18} weight="fill" className="text-pink-400" />
      case "tiktok": return <TiktokLogo size={18} weight="fill" className="text-gray-400" />
      case "youtube": return <YoutubeLogo size={18} weight="fill" className="text-red-400" />
      default: return null
    }
  }

  const getPlatformColor = (plataforma: string) => {
    switch (plataforma) {
      case "instagram": return "border-pink-400/20 hover:border-pink-400/40"
      case "tiktok": return "border-white/10 hover:border-white/30"
      case "youtube": return "border-red-400/20 hover:border-red-400/40"
      default: return "border-cyan-400/20 hover:border-cyan-400/40"
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-16"
      >
        <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">Contenido</span>
        <h2 className="section-title text-4xl md:text-5xl mt-4 mb-6 text-white">REELS</h2>
        <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
          Mira nuestro trabajo en video. Seguinos en redes para más contenido.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {reels.map((reel, i) => {
          const embedUrl = getEmbedUrl(reel)
          const tiktokData = reel.plataforma === "tiktok" ? extractTikTokId(reel.url) : null
          const loaded = loadedVideos.has(reel.id)

          return (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`glass rounded-2xl overflow-hidden border transition-all duration-300 ${getPlatformColor(reel.plataforma)}`}
            >
              <div className="relative aspect-[9/16] bg-black/40 flex items-center justify-center overflow-hidden">
                {embedUrl ? (
                  loaded ? (
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      scrolling="no"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center cursor-pointer" onClick={() => setLoadedVideos(prev => new Set(prev).add(reel.id))}>
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 hover:bg-white/20 transition-all">
                        <span className="text-white text-3xl">&#9654;</span>
                      </div>
                      <p className="text-gray-400 text-xs font-tech tracking-wider">CARGAR REEL</p>
                    </div>
                  )
                ) : tiktokData ? (
                  <a
                    href={reel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center cursor-pointer hover:scale-105 transition-transform"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 hover:bg-white/20 transition-all">
                      <TiktokLogo size={28} weight="fill" className="text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-xs font-tech tracking-wider">VER EN TIKTOK</p>
                  </a>
                ) : (
                  <a
                    href={reel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center cursor-pointer hover:scale-105 transition-transform"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 hover:bg-white/20 transition-all">
                      <span className="text-white text-2xl">&#9654;</span>
                    </div>
                    <p className="text-gray-400 text-xs font-tech tracking-wider">VER REEL</p>
                  </a>
                )}
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getPlatformIcon(reel.plataforma)}
                    <span className="text-xs text-gray-600 font-tech uppercase tracking-wider">
                      {reel.plataforma}
                    </span>
                  </div>
                  {reel.titulo && (
                    <p className="text-white text-sm truncate">{reel.titulo}</p>
                  )}
                </div>
                <a
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-cyan-400 transition-colors text-xs font-tech shrink-0 ml-3"
                >
                  ABRIR
                </a>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
