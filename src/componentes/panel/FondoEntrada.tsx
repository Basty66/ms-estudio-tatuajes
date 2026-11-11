import { Estrella } from "./Iconos";

/**
 * Fondo de las pantallas de entrada y desbloqueo: lo primero que se ve cada
 * vez que se abre la app. La misma noche azul del sitio, la estrella del
 * estudio arriba y el contenido a la altura del pulgar.
 */
export function FondoEntrada({
  children,
  compacta = false,
}: {
  children: React.ReactNode;
  /** Con teclado de PIN: en teléfonos bajos se quita la marca para que el teclado quepa entero. */
  compacta?: boolean;
}) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center overflow-clip px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] [@media(max-height:760px)]:pt-[max(1rem,env(safe-area-inset-top))]">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[60vh] w-[110vw] -translate-x-1/2 rounded-full bg-stencil/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,rgb(239_232_226/0.05)_1px,transparent_1.5px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className={`flex flex-col items-center gap-2 text-center ${compacta ? "[@media(max-height:760px)]:hidden" : ""}`}>
        <span className="texto-acero font-gotica text-[34px] leading-none">Matness</span>
        <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-ceniza uppercase">
          <Estrella className="size-2.5 text-stencil" />
          Panel del estudio
          <Estrella className="size-2.5 text-stencil" />
        </span>
      </div>

      <div className="panel-surge flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.4dvh,1.5rem)] py-[clamp(0.5rem,2.4dvh,1.5rem)]">
        {children}
      </div>
    </main>
  );
}

/** El círculo con la inicial de quien entra. */
export function Inicial({ nombre }: { nombre: string }) {
  return (
    <span className="grid size-[clamp(3rem,8dvh,4.25rem)] place-items-center rounded-full border border-stencil/70 bg-[radial-gradient(circle_at_35%_30%,#2f6bff,#0c1f6b)] font-gotica text-[clamp(1.6rem,4dvh,2.2rem)] leading-none text-piel shadow-[0_0_40px_-6px_rgba(47,107,255,0.9)]">
      {nombre.charAt(0).toUpperCase()}
    </span>
  );
}
