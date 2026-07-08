import Header from "./components/Header"
import Hero from "./components/Hero"
import Gallery from "./components/Gallery"
import Cotizador from "./components/Cotizador"
import Agenda from "./components/Agenda"
import Ubicacion from "./components/Ubicacion"
import Footer from "./components/Footer"

export default function App() {
  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <main>
        <Hero />
        <Gallery />
        <Cotizador />
        <Agenda />
        <Ubicacion />
      </main>
      <Footer />
    </div>
  )
}
