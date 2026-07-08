import { Gift, Tag, Heart, Share2, Camera } from "lucide-react"

const steps = [
  { icon: Tag, title: "01", desc: "ETIQUETA A UN AMIGO" },
  { icon: Heart, title: "02", desc: "SIGUE LA PÁGINA" },
  { icon: Camera, title: "03", desc: "SUBE A TU HISTORIA" },
  { icon: Share2, title: "04", desc: "REPOSTEA ESTA PUBLICACIÓN" },
]

export default function Hero() {
  return (
    <section id="inicio" className="min-h-screen flex flex-col justify-center relative pt-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-20 text-center relative z-10">
        <p className="section-subtitle mb-4">MS ESTUDIO DE TATUAJES</p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold section-title neon-text mb-6 leading-tight">
          CONCURSO
          <br />
          <span className="text-3xl md:text-5xl lg:text-6xl text-white tracking-widest">
            PARTICIPA Y GANA
          </span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto mb-12 text-sm tracking-wider">
          MELIPILLA - CHILE
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-16">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="neon-card rounded-lg p-6 flex flex-col items-center gap-3"
              >
                <Icon className="text-cyan-400" size={32} strokeWidth={1.5} />
                <span className="text-2xl font-bold text-cyan-400 font-agresiva">
                  {step.title}
                </span>
                <span className="text-xs text-gray-400 tracking-wider text-center leading-relaxed">
                  {step.desc}
                </span>
              </div>
            )
          })}
        </div>

        <div className="neon-border rounded-xl p-6 md:p-8 max-w-3xl mx-auto bg-dark-200/50">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Gift className="text-cyan-400" size={40} strokeWidth={1.5} />
            <div>
              <p className="text-2xl md:text-3xl font-bold section-title neon-text">
                ¡UN GANADOR!
              </p>
              <p className="text-xl md:text-2xl text-white font-bold tracking-wider">
                TATUAJE GRATIS VALORADO EN $80.000
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
