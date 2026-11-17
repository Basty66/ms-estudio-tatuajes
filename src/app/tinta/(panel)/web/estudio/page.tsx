import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarEstudio } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Estudio() {
  await operadorDelPanel();
  const { estudio } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Contacto y dirección" />
      <EditarEstudio inicial={estudio} />
    </>
  );
}
