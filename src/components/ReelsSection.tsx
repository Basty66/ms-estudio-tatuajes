import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { InstagramLogo, TiktokLogo, Spinner, Play } from "@phosphor-icons/react"

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
  const m = url.match(/instagram\.com\/(?:reel|p)\/([^/?&#]+)/)
  return m ? m[1] : null
}

function IgCard({ reel }: { reel: Reel }) {
  const code = extractIG(reel.url)

  return (
    <div className="snap-start shrink-0 w-[clamp(200px, 40vw, 260px)]">
      <div className="relative rounded-2xl overflow-hidden border border-white/5 group bg-black aspect-[9/16]">
        <iframe
          src={`https://www.instagram.com/reel/${code}/embed/`}
          title={reel.titulo || "Reel de Instagram"}
          loading="lazy"
          scrolling="no"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          className="absolute inset-0 w-full h-full"
        />

        {/* Badge plataforma */}
        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur flex items-center gap-1 pointer-events-none">
          <InstagramLogo size={11} weight="fill" className="text-pink-400" />
          <span className="text-white/60 text-[9px] font-tech">Reel</span>
        </div>
      </div>
    </div>
  )
}

function LinkCard({ reel }: { reel: Reel }) {
  const ytCode = extractYT(reel.url)
  const isTikTok = reel.plataforma === "tiktok"

  return (
    <div className="snap-start shrink-0 w-[clamp(200px, 40vw, 260px)]">
      <a
        href={reel.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block rounded-2xl overflow-hidden border border-white/5 group bg-black aspect-[9/16]"
      >
        {ytCode ? (
          <img src={`https://img.youtube.com/vi/${ytCode}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 via-cyan-400/5 to-red-400/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-400/30 transition-all">
            {isTikTok ? <TiktokLogo size={18} weight="fill" className="text-gray-200" /> : <Play size={16} className="text-white ml-0.5" weight="fill" />}
          </div>
        </div>
        {isTikTok && (
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
            <TiktokLogo size={11} weight="fill" className="text-gray-300" />
            <span className="text-white/60 text-[9px] font-tech">TikTok</span>
          </div>
        )}
        {ytCode && (
          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur flex items-center gap-1">
            <Play size={10} className="text-red-400" weight="fill" />
            <span className="text-white/60 text-[9px] font-tech">YouTube</span>
          </div>
        )}
        {reel.titulo && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5">
            <p className="text-white/70 text-[10px] font-tech tracking-wider truncate">{reel.titulo}</p>
          </div>
        )}
      </a>
    </div>
  )
}

export default function ReelsSection() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/reels")
      .then(r => r.json())
      .then(data => { if (data.success) setReels(data.reels || []) })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size={28} className="text-cyan-400 animate-spin" /></div>
  if (reels.length === 0) return null

  const igReels = reels.filter(r => r.plataforma === "instagram" && extractIG(r.url))
  const linkReels = reels.filter(r => r.plataforma !== "instagram" || !extractIG(r.url))

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-12 md:py-20 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-8">
        <span className="font-tech text-[10px] tracking-[0.3em] text-cyan-400 uppercase">Contenido</span>
        <h2 className="section-title text-3xl md:text-5xl text-white mt-2 mb-2"><span className="premium-gradient">REELS</span></h2>
        <p className="text-gray-500 text-xs max-w-md mx-auto">Pasa el mouse sobre los videos para reproducirlos.</p>
      </motion.div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {[...igReels, ...linkReels].map(reel =>
          reel.plataforma === "instagram" && extractIG(reel.url) ? (
            <IgCard key={reel.id} reel={reel} />
          ) : (
            <LinkCard key={reel.id} reel={reel} />
          )
        )}
      </div>

      <p className="text-center text-gray-700 text-[10px] font-tech tracking-wider mt-3 md:hidden">Desliza para ver más →</p>
    </div>
  )
}
