import Link from "next/link";
import { mesVecino } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { Atras, Flecha } from "./Iconos";

/**
 * Encabezado de cada pantalla del panel: volver (si aplica), etiqueta, título y una acción.
 *
 * El título no se corta: un nombre largo baja a una segunda línea en vez de
 * quedar en "Fernanda Cas…". Volver a "Más" solo existe en el teléfono; en el
 * escritorio esas secciones están en la columna de la izquierda.
 */
export function Encabezado({
  titulo,
  etiqueta,
  volver,
  accion,
}: {
  titulo: React.ReactNode;
  etiqueta?: React.ReactNode;
  volver?: string;
  accion?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {volver && (
          <Link
            href={volver}
            className={`-ml-2 mb-2 inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-[14px] text-ceniza hover:text-piel ${volver === `${PANEL}/mas` ? "lg:hidden" : ""}`}
          >
            <Atras className="size-4" /> Volver
          </Link>
        )}
        {etiqueta && <p className="text-[12px] font-semibold tracking-[0.18em] text-ceniza uppercase">{etiqueta}</p>}
        <h1 className="mt-1 font-gotica text-[clamp(2.1rem,8.5vw,3.2rem)] leading-[0.95] text-balance [overflow-wrap:anywhere]">{titulo}</h1>
      </div>
      {accion && <div className="shrink-0">{accion}</div>}
    </header>
  );
}

/** Tarjeta base del panel. */
export function Tarjeta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-linea bg-hollin/70 p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function TituloBloque({ children, accion }: { children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="mb-3 flex min-h-6 items-center justify-between gap-3">
      <h2 className="text-[12px] font-semibold tracking-[0.16em] text-ceniza uppercase">{children}</h2>
      {accion}
    </div>
  );
}

const TONOS = {
  neutro: "",
  verde: "text-[#6ee7b7]",
  ambar: "text-[#fbbf24]",
  rojo: "text-[#ff8a80]",
  azul: "text-stencil-claro [text-shadow:0_0_18px_rgba(47,107,255,0.8)]",
} as const;

/** Una cifra con su rótulo: sesiones de hoy, lo pagado, lo que se debe. Con `href`, se toca. */
export function Cifra({
  valor,
  texto,
  tono = "neutro",
  href,
}: {
  valor: React.ReactNode;
  texto: string;
  tono?: keyof typeof TONOS;
  href?: string;
}) {
  const contenido = (
    <>
      <span className={`block truncate text-[20px] leading-tight font-semibold tabular-nums ${TONOS[tono]}`}>{valor}</span>
      <span className="mt-0.5 block text-[12px] leading-tight text-ceniza">{texto}</span>
    </>
  );
  const clase = "min-w-0 rounded-2xl border border-linea bg-hollin/70 px-3 py-3 sm:px-4";
  return href ? (
    <Link href={href} className={`${clase} transition-colors hover:border-stencil/60`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

/** Flechas de mes anterior y siguiente, y "Hoy" si se está mirando otro mes. */
export function CambiarMes({ mes, actual, enlace }: { mes: string; actual: string; enlace: (mes: string) => string }) {
  const redondo = "grid size-11 place-items-center rounded-full border border-linea text-ceniza transition-colors hover:border-ceniza/60 hover:text-piel";
  return (
    <div className="flex items-center gap-1">
      {mes !== actual && (
        <Link href={enlace(actual)} className="mr-1 inline-flex min-h-11 items-center rounded-full border border-linea px-4 text-[14px] font-semibold text-piel hover:border-ceniza/60">
          Hoy
        </Link>
      )}
      <Link href={enlace(mesVecino(mes, -1))} aria-label="Mes anterior" className={redondo}>
        <Atras className="size-5" />
      </Link>
      <Link href={enlace(mesVecino(mes, 1))} aria-label="Mes siguiente" className={redondo}>
        <Flecha className="size-5" />
      </Link>
    </div>
  );
}
