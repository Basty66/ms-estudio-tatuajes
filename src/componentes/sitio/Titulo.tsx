import type { IdSeccion } from "@/lib/estudio";
import { Indice } from "./Indice";

/** Encabezado de sección: índice, el nombre en gótica grande y una bajada corta. */
export function Titulo({
  children,
  bajada,
  id,
  seccion,
  className = "",
}: {
  children: React.ReactNode;
  bajada?: React.ReactNode;
  id?: string;
  /** Para el índice numerado sobre el título. */
  seccion?: IdSeccion;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div>
        {seccion && <Indice id={seccion} className="mb-4 lg:mb-6" />}
        <h2 id={id} className="texto-cromo font-gotica text-[clamp(3.5rem,11vw,9rem)] leading-[0.85]">
          {children}
        </h2>
      </div>
      {bajada && <p className="max-w-sm text-base leading-relaxed text-ceniza lg:pb-3 lg:text-right">{bajada}</p>}
    </div>
  );
}
