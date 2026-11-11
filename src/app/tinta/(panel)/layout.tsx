import { Candado } from "@/componentes/panel/Candado";
import { MantenerAlDia } from "@/componentes/panel/MantenerAlDia";
import { Navegacion } from "@/componentes/panel/Navegacion";
import { cotizacionesSinVer } from "@/db/panel";
import { OCULTAR_SI_SE_CERRO } from "@/lib/admin/apertura";
import { operadorDelPanel } from "@/lib/admin/panel";

/**
 * Todo lo que está dentro del panel pasa por acá.
 *
 * El proxy solo mira que exista la cookie; operadorDelPanel() comprueba de
 * verdad que la sesión siga viva, que la persona siga activa y que el panel no
 * esté bloqueado. Cada página la vuelve a llamar (ver lib/admin/panel.ts).
 *
 * El script del principio corre antes de pintar nada: si la app viene de
 * cerrarse, esconde el panel mientras <Candado> lo bloquea.
 */
export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  await operadorDelPanel();
  const sinVer = await cotizacionesSinVer();

  return (
    <div className="min-h-dvh lg:pl-64">
      <script dangerouslySetInnerHTML={{ __html: OCULTAR_SI_SE_CERRO }} />
      <div aria-hidden className="pointer-events-none fixed -top-48 left-1/2 -z-10 h-[50vh] w-[90vw] -translate-x-1/2 rounded-full bg-stencil/10 blur-[120px]" />
      <main
        className="panel-surge mx-auto w-full max-w-3xl px-4 pb-36 sm:px-6 lg:max-w-4xl lg:px-10 lg:pb-16"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        {children}
      </main>
      <Navegacion sinVer={sinVer} />
      <Candado />
      <MantenerAlDia />
    </div>
  );
}
