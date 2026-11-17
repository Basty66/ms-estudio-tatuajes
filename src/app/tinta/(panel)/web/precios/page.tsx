import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarPrecios } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Precios() {
  await operadorDelPanel();
  const { precios } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Precios del cotizador" />
      <p className="-mt-2 mb-5 text-[14px] text-ceniza">Los rangos que calcula el cotizador de la web. El precio final lo pones tú al ver el diseño.</p>
      <EditarPrecios inicial={precios} />
    </>
  );
}
