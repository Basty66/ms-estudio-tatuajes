import { Encabezado } from "@/componentes/panel/Encabezado";
import { EditarReservas } from "@/componentes/panel/EditoresWeb";
import { leerContenido } from "@/db/contenido";
import { hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

export default async function Reservas() {
  await operadorDelPanel();
  const { reservas } = await leerContenido();
  return (
    <>
      <Encabezado volver={`${PANEL}/web`} titulo="Horario y reservas" />
      <p className="-mt-2 mb-5 max-w-2xl text-[14px] text-ceniza">Cuándo atiendes y cuánto dura cada sesión: con esto la web muestra las horas libres. Lo ocupado sale de tu agenda.</p>
      <EditarReservas inicial={reservas} hoy={hoyChile()} />
    </>
  );
}
