import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Image, X } from "@phosphor-icons/react"

interface GalleryImage {
  id: number
  imagen_url: string
  estilo: string
  titulo: string
  descripcion: string
}

const easeOut = [0.23, 1, 0.32, 1] as const

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [estilos, setEstilos] = useState<string[]>([])
  const [filtro, setFiltro] = useState("todos")
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.images) {
          setImages(data.images)
          const uniqueStyles = [...new Set(data.images.map((i: GalleryImage) => i.estilo))] as string[]
          setEstilos(uniqueStyles)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtradas = filtro === "todos" ? images : images.filter(i => i.estilo === filtro)

  if (loading) {
    return (
      <section id="galeria" className="relative py-20 md:py-32 overflow-hidden section-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
        </div>
      </section>
    )
  }

  if (images.length === 0) return null

  return (
    <section id="galeria" className="relative py-20 md:py-28 overflow-hidden section-dark">
      <div className="ambient-glow-cyan top-1/3 left-0 w-[500px] h-[500px] -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-10"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
            <Image size={14} className="inline mr-2 text-cyan-400" weight="fill" />
            Nuestro trabajo
          </span>
          <h2 className="section-title text-4xl md:text-7xl text-white mt-2 mb-4">
            GALERÍA DE <span className="premium-gradient">ESTILOS</span>
          </h2>
        </motion.div>

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
          {estilos.map(e => (
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
              onClick={() => setLightbox(img)}
            >
              <div className="relative rounded-xl overflow-hidden glass-card-dark">
                <img
                  src={img.imagen_url}
                  alt={img.titulo || img.estilo}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-3">
                  <div>
                    {img.titulo && <p className="text-white text-xs font-medium truncate">{img.titulo}</p>}
                    <p className="text-cyan-400/60 text-[10px] font-tech uppercase tracking-wider capitalize">{img.estilo}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X size={20} weight="bold" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightbox.imagen_url}
              alt={lightbox.titulo}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            {lightbox.titulo && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass rounded-full px-5 py-2 border border-white/5">
                <p className="text-white text-sm">{lightbox.titulo}</p>
                <p className="text-cyan-400/60 text-[10px] font-tech uppercase tracking-wider text-center capitalize">{lightbox.estilo}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
