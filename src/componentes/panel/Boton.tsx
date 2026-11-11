/**
 * Botones del panel. "cromo" es la acción principal de cada pantalla (una
 * sola); "linea" las secundarias; "peligro" lo que no se deshace.
 */
const ESTILOS = {
  cromo:
    "boton-cromo bg-[image:var(--acero)] text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)]",
  linea: "border border-linea bg-hollin/60 text-piel hover:border-ceniza/60",
  peligro: "border border-sangre/50 bg-sangre/10 text-[#ff8a80] hover:bg-sangre/20",
  fantasma: "text-ceniza hover:text-piel",
} as const;

export type Variante = keyof typeof ESTILOS;

export function claseBoton(variante: Variante = "cromo", extra = "") {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-[transform,background-color,border-color,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${ESTILOS[variante]} ${extra}`;
}

export function Boton({
  variante = "cromo",
  className = "",
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button type="button" {...resto} className={claseBoton(variante, className)} />;
}
