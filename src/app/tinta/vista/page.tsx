import { VistaEnVivo } from "@/componentes/panel/VistaEnVivo";
import { leerContenido } from "@/db/contenido";
import { hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";

/**
 * Lo que carga el marco de la vista previa del panel (ver VistaPrevia): una
 * sección de la web, sin menú ni barra del panel, que se redibuja con el
 * borrador que le manda el editor. Exige la sesión como cualquier página del
 * panel.
 */
export const dynamic = "force-dynamic";

export default async function Vista({ searchParams }: { searchParams: Promise<{ bloque?: string }> }) {
  await operadorDelPanel();
  const [contenido, { bloque = "" }] = await Promise.all([leerContenido(), searchParams]);
  return <VistaEnVivo base={contenido} bloque={bloque} hoy={hoyChile()} />;
}
