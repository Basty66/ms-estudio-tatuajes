import { useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Gallery from "./components/Gallery"
import Cotizador from "./components/Cotizador"
import Agenda from "./components/Agenda"
import Ubicacion from "./components/Ubicacion"
import Footer from "./components/Footer"
import WhatsAppFloat from "./components/WhatsAppFloat"

const sections = [
  { id: "inicio", Component: Hero },
  { id: "galeria", Component: Gallery },
  { id: "cotizador", Component: Cotizador },
  { id: "agenda", Component: Agenda },
  { id: "ubicacion", Component: Ubicacion },
]

function HomePage() {
  return (
    <>
      {sections.map(({ id, Component }) => (
        <section key={id} id={id}>
          <Component />
        </section>
      ))}
    </>
  )
}

function ScrollToTop() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: "smooth" })
    }
  }, [hash])

  return null
}

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-dark relative">
      <div className="ambient-glow top-[-200px] left-[-200px] bg-cyan-400" />
      <div className="ambient-glow bottom-[-200px] right-[-200px] bg-cyan-400" />
      <div className="ambient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500" />

      <Navbar />
      <ScrollToTop />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      <Footer />
      <WhatsAppFloat />
    </div>
  )
}
