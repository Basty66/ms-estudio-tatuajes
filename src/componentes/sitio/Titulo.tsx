/** Encabezado de sección: el nombre en gótica grande y una bajada corta. Nada encima: el título se basta solo. */
export function Titulo({
  children,
  bajada,
  id,
  className = "",
}: {
  children: React.ReactNode;
  bajada?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div>
        <h2 id={id} className="texto-cromo font-gotica text-[clamp(3.5rem,11vw,9rem)] leading-[0.85]">
          {children}
        </h2>
      </div>
      {bajada && <p className="max-w-sm text-base leading-relaxed text-ceniza lg:pb-3 lg:text-right">{bajada}</p>}
    </div>
  );
}
