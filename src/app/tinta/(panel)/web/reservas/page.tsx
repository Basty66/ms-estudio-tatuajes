import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarReservas } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Reservas() {
  await operadorDelPanel();
  const { reservas } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Horario y reservas" />
      <p className="-mt-2 mb-5 max-w-2xl text-[14px] text-ceniza">Los cupos de cada día: las horas en que puede empezar una sesión. La web ofrece solo los que están libres en tu agenda, y lo que dura cada tatuaje lo pones tú al confirmar.</p>
      <EditarReservas inicial={reservas} />
    </>
  );
}
