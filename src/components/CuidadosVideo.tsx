import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Video } from "@phosphor-icons/react"

const VIDEO_URL = "/videos/cuidados.mp4"
const POSTER_URL = "/images/tatuaje2.jpg"

export default function CuidadosVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onHover = () => {
      video.play().catch(() => {})
      setPlaying(true)
    }
    const onLeave = () => {
      video.pause()
      video.currentTime = 0
      setPlaying(false)
    }
    video.addEventListener("mouseenter", onHover)
    video.addEventListener("mouseleave", onLeave)
    return () => {
      video.removeEventListener("mouseenter", onHover)
      video.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-10"
    >
      <div className="relative rounded-2xl overflow-hidden border border-white/5 group max-w-3xl mx-auto">
        {available ? (
          <video
            ref={videoRef}
            src={VIDEO_URL}
            poster={POSTER_URL}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setAvailable(false)}
            className="w-full aspect-video object-cover cursor-pointer"
          />
        ) : (
          <div className="w-full aspect-video relative bg-black flex flex-col items-center justify-center gap-3">
            <img src={POSTER_URL} alt="" className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.35]" />
            <Video size={32} className="text-cyan-400 relative" />
            <p className="relative text-gray-400 text-xs font-tech tracking-wider uppercase px-6 text-center">
              Video de cuidados — próximamente
            </p>
          </div>
        )}

        {/* Overlay de estado */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300">
          <motion.div
            key={playing ? "pause" : "play"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center"
          >
            {playing ? (
              <Pause size={18} className="text-white" weight="fill" />
            ) : (
              <Play size={18} className="text-white ml-0.5" weight="fill" />
            )}
          </motion.div>
        </div>

        {/* Hover hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-[9px] font-tech tracking-wider text-white/70 uppercase transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          {playing ? "Pausa al salir" : "Pasa el mouse para reproducir"}
        </div>
      </div>
    </motion.div>
  )
}
