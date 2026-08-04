import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarBlank } from "@phosphor-icons/react"

export default function FloatingAgendaButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToAgenda = () => {
    const el = document.getElementById("agenda")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToAgenda}
          className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 rounded-full px-4 py-3 md:px-5 md:py-3.5 shadow-lg hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all duration-300 backdrop-blur-sm"
          style={{ boxShadow: "0 4px 20px rgba(0, 229, 255, 0.15)" }}
        >
          <CalendarBlank size={18} weight="duotone" />
          <span className="hidden md:inline font-tech text-xs tracking-[0.15em] uppercase font-semibold">
            Agendar
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
