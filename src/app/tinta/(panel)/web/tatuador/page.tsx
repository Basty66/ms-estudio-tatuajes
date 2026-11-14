import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarTatuador } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Tatuador() {
  await operadorDelPanel();
  const { tatuador } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} etiqueta="Web" titulo="El tatuador" />
      <p className="-mt-2 mb-5 text-[14px] text-ceniza">Las fotos de esta sección se cambian en Fotos de la web.</p>
      <EditarTatuador inicial={tatuador} />
    </>
  );
}
