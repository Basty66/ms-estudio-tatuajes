import { useEffect, useRef, useState } from "react"

const IMAGES = [
  "/images/tatuaje1.jpg",
  "/images/tatuaje2.jpg",
  "/images/tatuaje3.jpg",
  "/images/laser-borrado.jpg",
  "/images/hero-bg.png",
]

export default function TattooMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    let x = 0
    let raf = 0
    let speed = 1

    const step = () => {
      const target = hovered ? 0.12 : 1
      speed += (target - speed) * 0.04
      const track = trackRef.current
      if (track) {
        x -= speed
        const half = track.scrollWidth / 2
        if (x <= -half) x += half
        track.style.transform = `translateX(${x}px)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [hovered])

  const row = [...IMAGES, ...IMAGES]

  return (
    <div
      className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-black via-dark-100 to-black select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Borde superior */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

      <div className="flex overflow-hidden">
        <div ref={trackRef} className="flex gap-3 md:gap-4 will-change-transform">
          {row.map((src, i) => (
            <div key={i} className="relative shrink-0 w-40 h-52 md:w-52 md:h-64 rounded-xl overflow-hidden group">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover grayscale brightness-[0.75] group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-0 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/5 group-hover:ring-cyan-400/30 transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Borde inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    </div>
  )
}
