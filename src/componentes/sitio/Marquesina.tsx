import { ESTILOS } from "@/lib/estudio";

export function Estrella({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M32 2 C34 24 40 30 62 32 C40 34 34 40 32 62 C30 40 24 34 2 32 C24 30 30 24 32 2 Z" fill="currentColor" />
    </svg>
  );
}

/** Banda inclinada con los estilos del estudio, corriendo sin fin. */
export function Marquesina() {
  const fila = [...ESTILOS, ...ESTILOS];

  return (
    <section aria-label="Estilos que tatúa Matness" className="relative z-10 -my-4 overflow-hidden py-4">
      <div className="-rotate-[2deg] scale-x-[1.04] border-y border-linea bg-hollin py-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
        <ul className="marquesina flex w-max items-center">
          {fila.map((estilo, i) => (
            <li
              key={`${estilo}-${i}`}
              aria-hidden={i >= ESTILOS.length}
              className="flex items-center gap-10 pr-10 font-gotica text-5xl leading-none whitespace-nowrap sm:text-7xl"
            >
              <span className="texto-cromo pb-1">{estilo}</span>
              <Estrella className="h-6 w-6 text-stencil sm:h-8 sm:w-8" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
