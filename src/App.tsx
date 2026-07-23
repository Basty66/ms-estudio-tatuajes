import { useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import SobreElTatuador from "./components/SobreElTatuador"
import Gallery from "./components/Gallery"
import Cotizador from "./components/Cotizador"
import Agenda from "./components/Agenda"
import Ubicacion from "./components/Ubicacion"
import Footer from "./components/Footer"
import WhatsAppFloat from "./components/WhatsAppFloat"
import Reviews from "./components/Reviews"
import Admin from "./pages/Admin"

const sectionIds = ["inicio", "sobre", "galeria", "cotizador", "agenda", "reviews", "ubicacion"]
const components = [Hero, SobreElTatuador, Gallery, Cotizador, Agenda, Reviews, Ubicacion]

function HomePage() {
  return (
    <>
      {components.map((Comp, i) => {
        return (
          <section key={sectionIds[i]} id={sectionIds[i]}>
            <Comp />
          </section>
        )
      })}
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
  const isAdmin = location.pathname === "/admin"

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden relative">
      {/* Global texture overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {!isAdmin && <Navbar />}
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
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppFloat />}
    </div>
  )
}
