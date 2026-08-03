import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, PaperPlaneTilt, CheckCircle, Warning } from "@phosphor-icons/react"

interface Props {
  onSubmitted: () => void
}

export default function TestimonioForm({ onSubmitted }: Props) {
  const [nombre, setNombre] = useState("")
  const [texto, setTexto] = useState("")
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim() || !texto.trim()) {
      setError("Completa tu nombre y comentario.")
      return
    }

    setEnviando(true)
    try {
      const res = await fetch("/api/testimonios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), texto: texto.trim(), rating }),
      })
      const data = await res.json()
      if (data.success) {
        setEnviado(true)
        setNombre("")
        setTexto("")
        setRating(5)
        onSubmitted()
      } else {
        setError(data.error || "Error al enviar. Intenta de nuevo.")
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-premium rounded-2xl p-8 text-center"
      >
        <CheckCircle size={48} weight="duotone" className="text-cyan-400 mx-auto mb-4" />
        <h4 className="text-white font-semibold mb-2">¡Gracias por tu testimonio!</h4>
        <p className="text-gray-400 text-sm mb-4">
          Tu comentario será visible tras ser aprobado por el estudio.
        </p>
        <button
          onClick={() => setEnviado(false)}
          className="font-tech text-xs text-cyan-400 tracking-wider hover:text-cyan-300 transition-colors"
        >
          ENVIAR OTRO
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass-premium rounded-2xl p-6 md:p-8">
      <h4 className="font-tech text-cyan-400 text-sm tracking-[0.2em] uppercase mb-4">
        Deja tu testimonio
      </h4>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={24}
              weight={(hoverRating || rating) >= star ? "fill" : "regular"}
              className={
                (hoverRating || rating) >= star
                  ? "text-yellow-400"
                  : "text-gray-600"
              }
            />
          </button>
        ))}
        <span className="text-gray-500 text-xs ml-2 font-tech">
          {rating}/5
        </span>
      </div>

      {/* Nombre */}
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Tu nombre *"
        className="neon-input rounded-xl px-4 py-3 w-full text-sm mb-3"
        maxLength={100}
      />

      {/* Comentario */}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Cuéntanos tu experiencia con el estudio... *"
        rows={3}
        className="neon-input rounded-xl px-4 py-3 w-full text-sm resize-none mb-4"
        maxLength={1000}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4"
          >
            <Warning size={16} weight="fill" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={enviando || !nombre.trim() || !texto.trim()}
        className="hero-cta-primary font-tech text-sm tracking-[0.15em] px-6 py-3 w-full flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {enviando ? (
          "ENVIANDO..."
        ) : (
          <>
            <PaperPlaneTilt size={16} weight="bold" />
            ENVIAR TESTIMONIO
          </>
        )}
      </button>

      <p className="text-gray-600 text-[10px] text-center mt-3">
        Tu testimonio será revisado antes de publicarse.
      </p>
    </form>
  )
}
