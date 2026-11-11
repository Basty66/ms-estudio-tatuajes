import type { Metadata } from "next";
import Link from "next/link";
import { NombreCromo } from "@/componentes/sitio/NombreCromo";
import { Ornamento } from "@/componentes/sitio/Ornamento";

export const metadata: Metadata = {
  title: "Página no encontrada · Matness",
  robots: { index: false, follow: false },
};

/**
 * 404 del estudio: el número se calca y se entinta en cromo, y cada pocos
 * segundos pasa el láser y lo borra en partículas, para volver a tatuarse.
 * También es lo que ve quien busca /admin: el panel vive en otra ruta.
 */
export default function NoEncontrada() {
  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <div aria-hidden className="pointer-events-none absolute top-1/4 left-1/2 -z-10 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-stencil/15 blur-[140px]" />
      <Ornamento tipo="telarana" className="top-0 left-0 w-32 opacity-30 sm:-top-4 sm:-left-4 sm:w-56" flotar={0} brillo={false} />
      <Ornamento tipo="daga" className="top-[18%] right-[8%] hidden w-14 rotate-[18deg] sm:block" />
      <Ornamento tipo="estrella" className="bottom-[22%] left-[12%] w-5" retraso={2} />

      <Link href="/" className="texto-acero absolute top-6 left-1/2 -translate-x-1/2 font-gotica text-[32px] leading-none" aria-label="Matness Studio, inicio">
        Matness
      </Link>

      <div className="borrado relative w-full max-w-[720px]">
        <div className="borrado-tinta">
          <NombreCromo texto="404" className="w-full drop-shadow-[0_24px_50px_rgba(0,0,0,0.85)]" />
        </div>
        <div aria-hidden className="borrado-laser">
          <span className="borrado-chispas" />
        </div>
      </div>

      <h1 className="mt-10 max-w-xl text-[clamp(1.6rem,4vw,2.4rem)] leading-tight font-semibold tracking-[-0.02em]">
        Esta página no existe, o la borramos con láser.
      </h1>
      <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ceniza">
        Revisa la dirección, o vuelve al inicio para ver los trabajos y cotizar tu tatuaje.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="boton-cromo inline-flex min-h-12 items-center justify-center rounded-full bg-[image:var(--acero)] px-7 text-[15px] font-semibold text-tinta shadow-[0_0_40px_-6px_rgba(47,107,255,0.9)]"
        >
          Volver al inicio
        </Link>
        <Link
          href="/#cotiza"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-linea px-7 text-[15px] font-semibold transition-[border-color,box-shadow] hover:border-stencil hover:shadow-[0_0_24px_-4px_rgba(47,107,255,0.7)]"
        >
          Cotizar y pedir hora
        </Link>
      </div>
    </main>
  );
}
