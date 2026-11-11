import Link from "next/link";
import { Atras } from "./Iconos";

/** Encabezado de cada pantalla del panel: volver (si aplica), etiqueta, título y una acción. */
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
          <Link href={volver} className="-ml-2 mb-2 inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-[14px] text-ceniza hover:text-piel">
            <Atras className="size-4" /> Volver
          </Link>
        )}
        {etiqueta && <p className="text-[12px] font-semibold tracking-[0.18em] text-ceniza uppercase">{etiqueta}</p>}
        <h1 className="mt-1 truncate font-gotica text-[clamp(2.4rem,9vw,3.4rem)] leading-[0.95]">{titulo}</h1>
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[12px] font-semibold tracking-[0.16em] text-ceniza uppercase">{children}</h2>
      {accion}
    </div>
  );
}
