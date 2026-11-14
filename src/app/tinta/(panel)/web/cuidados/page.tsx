import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarCuidados } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Cuidados() {
  await operadorDelPanel();
  const { cuidados } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} etiqueta="Web" titulo="Cuidados" />
      <p className="-mt-2 mb-5 text-[14px] text-ceniza">Es lo que la gente se guarda en su WhatsApp con el botón de la web.</p>
      <EditarCuidados inicial={cuidados} />
    </>
  );
}
